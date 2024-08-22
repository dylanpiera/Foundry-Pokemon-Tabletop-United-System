import { PokemonGenerator } from "../../actor/pokemon/generator.js";


const MaxPartyPokemon = 6;


const SINGLE_MIN_SKILL_RANK_RE = /(?<rank>(Untrained)|(Novice)|(Adept)|(Expert)|(Master)|(Virtuoso)) (?<skill>.+)/i;
const ANY_N_SKILLS_AT_RE = /(any )?(?<n>([0-9]+)|(One)|(Two)|(Three)|(Four)|(Five)|(Six)|(Seven)|(Eight)|(Nine)) Skills at (?<rank>(Untrained)|(Novice)|(Adept)|(Expert)|(Master)|(Virtuoso))( Rank)?/i;
const N_SKILLS_AT_FROM_LIST_RE = /(?<n>([0-9]+)|(One)|(Two)|(Three)|(Four)|(Five)|(Six)|(Seven)|(Eight)|(Nine))( Skills)? of (?<skills>.+) at (?<rank>(Untrained)|(Novice)|(Adept)|(Expert)|(Master)|(Virtuoso))( Rank)?/i;

const FEAT_WITH_SUB_RE = /(?<main>.+) (\((?<sub>.+)\))/i;
const COMPENDIUM_ITEM_RE = /Compendium\.([\w\.]+).Item.[a-zA-Z0-9]+/;

function parseIntA(s) {
    let i = parseInt(s);
    if (!Number.isNaN(i)) return i;
    i = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"].indexOf(s.toLowerCase());
    if (i >= 0) return i;
    return Number.NaN;
}

function simplifyString(s) {
    return s.toLowerCase().replaceAll("pokémon", "pokemon").replaceAll("tech education", "technology education");
}


function chooseFrom(list) {
    return list[Math.random() * list.length | 0];
}

function average(list) {
    return list.reduce((a,b)=>a+b, 0) / list.length;
}

export class NpcQuickBuildData {

    _preloadedCompendiums = false;

    constructor() {
        this.page = 1;

        this.manuallyUpdatedFields = new Set(); // the keys to avoid auto-generating overtop of

        this.alliance = CONFIG.PTU.data.alliances.includes("opposition") ? "opposition" : CONFIG.PTU.data.alliances[0];
        this.trainer = {
            name: "",
            sex: [],
            level: Math.floor(this.estimatedAppropriateLevel),
            classes: {
                selected: [],
                restricted: true,
            },
            features: {
                selected: [],
                computed: [],
            },
            edges: {
                selected: [],
                computed: [],
            },
            subSelectables: {},
            skills: {},
            stats: {},
        };

        // set skills default
        for (const skill of CONFIG.PTU.data.skills.keys) {
            this.trainer.skills[skill] = {
                label: `SKILL.${skill}`,
                value: 1,
                min: 1,
                max: 6,
            }
        }

        // set stats default
        for (const stat of CONFIG.PTU.data.stats.keys) {
            this.trainer.stats[stat] = {
                label: `PTU.Stats.${stat}`,
                value: 0,
                min: 0,
                max: 10 + ((this.trainer.level - 1) * 2),
            }
        }

        // Configure party pokemon slots

        this.party = {};
        for (let n = 1; n <= MaxPartyPokemon; n++) {
            this.party[`slot${n}`] = {
                slot: `slot${n}`,
                configured: false,
                species: {
                    object: null,
                    name: "",
                    img: "icons/svg/mystery-man.svg",
                    uuid: "",
                    selected: [],
                    gender: {
                        selected: "",
                        options: [],
                        choosable: false,
                    },
                    variations: {
                        selected: "",
                        options: [],
                    },
                    optimization: {
                        selected: "good",
                        options: [
                            { label: "PTU.OptimizationLevel.Bad", value: "bad" },
                            { label: "PTU.OptimizationLevel.Neutral", value: "neutral" },
                            { label: "PTU.OptimizationLevel.Good", value: "good" },
                            { label: "PTU.OptimizationLevel.MinMaxed", value: "minmax" },
                        ]
                    },
                },
                shiny: false,
                nickname: "",
                level: {
                    value: game.settings.get("ptu", "generation.defaultDexDragInLevelMin"), // TODO: use a different default? Maybe 2x trainer level?
                    min: 1,
                    max: 100,
                }
            };
        }

        this.multiselects = {
            sex: {
                options: [
                    {
                        label: game.i18n.format("PTU.Male"),
                        value: "Male",
                    },
                    {
                        label: game.i18n.format("PTU.Female"),
                        value: "Female",
                    },
                    {
                        label: game.i18n.format("PTU.Nonbinary"),
                        value: "Nonbinary",
                    }
                ],
                maxTags: 1,
            },
            classes: {
                options: []
            },
            features: {
                options: []
            },
            edges: {
                options: []
            },
            species: {
                options: [],
                maxTags: 1,
            }
        };


        this.warnings = [];
    }

    async preload() {
        // TODO can we share the PackLoader from the compendium browser? YES
        const compendiumBrowser = game.ptu.compendiumBrowser;

        // load feats with pack loader/compendium browser!
        if (!NpcQuickBuildData._preloadedCompendiums) {
            await compendiumBrowser.tabs.feats.loadData();
            await compendiumBrowser.tabs.edges.loadData();
            await compendiumBrowser.tabs.species.loadData();
            NpcQuickBuildData._preloadedCompendiums = true;
        }

        // trawl the compendiums for classes/features, edges, and pokemon species
        let featureCompendiums = ["ptu.feats"];
        let edgeCompendiums = ["ptu.edges"];
        let speciesCompendiums = ["ptu.species"];

        // try to use the ones set up in the compendium browser
        const compendiumSettings = game.settings.get("ptu", "compendiumBrowserPacks");
        if (compendiumSettings) {
            featureCompendiums = Object.keys(compendiumSettings.feats).filter(c => compendiumSettings.feats[c].load);
            edgeCompendiums = Object.keys(compendiumSettings.edges).filter(c => compendiumSettings.edges[c].load);
            speciesCompendiums = Object.keys(compendiumSettings.species).filter(c => compendiumSettings.species[c].load);
        }

        // get classes/features
        for (const compendium of featureCompendiums) {
            for (const feature of game.packs.get(compendium).index) {
                if (feature.type !== "feat") continue;
                let bucket = "features";
                if (feature?.system?.keywords?.includes("Class")) bucket = "classes";
                this.multiselects[bucket].options.push({
                    label: feature.name,
                    value: feature.uuid,
                    prerequisites: feature?.system?.prerequisites ?? [],
                    hydrated: null,
                })
            }
        }
        this.multiselects.classes.options.sort((a, b) => a.label.localeCompare(b.label));
        this.multiselects.features.options.sort((a, b) => a.label.localeCompare(b.label));

        // get edges
        for (const compendium of edgeCompendiums) {
            for (const edge of game.packs.get(compendium).index) {
                if (edge.type !== "edge") continue;
                this.multiselects.edges.options.push({
                    label: edge.name,
                    value: edge.uuid,
                    prerequisites: edge?.system?.prerequisites ?? [],
                    hydrated: null,
                })
            }
        }
        this.multiselects.edges.options.sort((a, b) => a.label.localeCompare(b.label));

        // get species
        for (const compendium of speciesCompendiums) {
            for (const species of game.packs.get(compendium).index) {
                if (species.type !== "species") continue;
                this.multiselects.species.options.push({
                    label: species.name,
                    value: species.uuid,
                })
            }
        }
        this.multiselects.species.options.sort((a, b) => a.label.localeCompare(b.label));
    }

    async _findFromMultiselect(bucket, searchfunction) {
        const found = this.multiselects[bucket]?.options?.find(searchfunction);
        if (!found) return null;
        const uuid = found.value || found.uuid;
        if (!uuid) return null;
        const foundItem = (await fromUuid(uuid))?.toObject();
        if (!foundItem) return null;
        Object.assign(foundItem, {
            uuid,
        });
        return foundItem;
    }

    get estimatedAppropriateLevel () {
        // this generator broadly speaking assumes that power level goes up with the square of level
        const playerLevelsSquared = game.users.filter(u=>u.character?.id != undefined).map(u=>Math.pow(u.character?.system?.level?.current ?? 1, 2));
        return Math.sqrt(average(playerLevelsSquared));
    }

    setProperty(key, value) {
        const originalProperty = foundry.utils.getProperty(this, key);
        foundry.utils.setProperty(this, key, value);
        if ((typeof originalProperty != "object" && originalProperty != value) || (typeof originalProperty == "object" && JSON.stringify(originalProperty) != JSON.stringify(value))) {
            console.log("these were not equal", originalProperty, value)
            this.manuallyUpdatedFields.add(key);
        }
    }

    /*-----------------------------------------------------------------------*/

    /*                           AUTO GENERATION                             */

    async randomizeAll(force = false) {
        if (force) this.manuallyUpdatedFields = new Set();
        const noUpdate = new Set(this.manuallyUpdatedFields); // make sure the set doesn't change under us

        if (!noUpdate.has("trainer.sex")) await this.randomizeSex(); // I want to make a joke here so badly. What am I, 12?
        if (!noUpdate.has("trainer.name")) await this.randomizeName();
        if (!noUpdate.has("trainer.level")) await this.randomizeLevel();
        if (!noUpdate.has("trainer.classes.selected")) await this.randomizeClass();
        // TODO
    }

    async randomizeName() {
        this.trainer.name = chooseFrom(["Alex", "Beth", "Carmen", "Dylan", "Emma", "Felix", "Gertrude", "Harold", "Indara"]);
    }

    async randomizeSex() {
        this.trainer.sex = [chooseFrom(this.multiselects.sex.options)];
    }

    async randomizeLevel() {
        const estimatedAppropriateLevel = this.estimatedAppropriateLevel;
        // average ~8 Math.random() calls to simulate a normal distribution (mean~=0.5+C, std_dev~=0.1)
        const N = 8;
        const C = 0.4;
        const randomNormal = average(Array.from({length: N}, () => C + Math.random()));
        this.trainer.level = Math.min(50, Math.max(1, Math.round(estimatedAppropriateLevel * randomNormal)));
    }

    async randomizeClass() {

    }

    async randomizeFeatures() {
        // TODO add an option to keep existing, but add more

    }

    async randomizeEdges() {
        // TODO add an option to keep existing, but add more
    }

    async randomizeSkill(slug) {

    }

    async randomizeSkills() {

    }

    async randomizeStat(slug) {

    }

    async randomizeStats() {

    }

    async randomizePartyPokemon(slot) {

    }



    /*-----------------------------------------------------------------------*/

    async refresh() {
        // grab the features and prerequisites
        // the actual structure of these foundry items, plus "uuid" and "auto"
        const allComputed = [];
        const featuresComputed = [];
        const edgesComputed = [];
        const subSelectables = {};

        // Prerequisites that aren't yet met
        const unmetPrereqs = {
            minLevel: 1,
            skills: {},
            subs: [],
            unmet: [],
            unknown: [],
        };
        for (const feature of Object.values(this.trainer.classes.selected)) {
            if (!feature.value) continue;
            const item = (await fromUuid(feature.value))?.toObject();
            if (!item) continue;
            Object.assign(item, {
                uuid: feature.value,
            });
            featuresComputed.push(item);
            allComputed.push(item);
        }
        for (const feature of Object.values(this.trainer.features.selected)) {
            if (!feature.value) continue;
            const item = (await fromUuid(feature.value))?.toObject();
            if (!item) continue;
            Object.assign(item, {
                uuid: feature.value,
            });
            featuresComputed.push(item);
            allComputed.push(item);
        }
        for (const edge of Object.values(this.trainer.edges.selected)) {
            if (!edge.value) continue;
            const item = (await fromUuid(edge.value))?.toObject();
            if (!item) continue;
            Object.assign(item, {
                uuid: edge.value,
            });
            edgesComputed.push(item);
            allComputed.push(item);
        }

        /**
         * 
         * @param {*} textPrereq 
         * @param {*} firstPass 
         * @returns {
         *      newFeatures,
         *      newEdges,
         *      allNew,
         *      skillUpdates,
         *      unknown,
         *  }
         */
        const checkTextPrereq = async (textPrereq) => {
            const originalPrereq = textPrereq;

            const newFeatures = [];
            const newEdges = [];
            const allNew = [];
            const skillUpdates = {};
            const unmet = [];
            const unknown = [];
            const RETURN = {
                newFeatures,
                newEdges,
                allNew,
                skillUpdates,
                sub: null,
                unmet,
                unknown,
            };

            const compareName = function (t) {
                return (f) => simplifyString(f.name) == simplifyString(t);
            };
            const compareLabel = function (t) {
                return (f) => simplifyString(f.label) == simplifyString(t);
            };

            // check if this has a parenthesized section (for selection of feat, for instance)
            const withSub = textPrereq.match(FEAT_WITH_SUB_RE);
            if (withSub) {
                RETURN.sub = {
                    main: withSub.groups.main,
                    subvalue: withSub.groups.sub,
                };
                textPrereq = withSub.groups.main;
            }

            // check if this is the name of a class, feature, or edge we already have
            const existingItem = allComputed.find(compareName(textPrereq));
            if (existingItem) {
                if (RETURN.sub) RETURN.sub.uuid = existingItem.uuid;
                return RETURN;
            }

            // check if it's the name of a class, feature or edge we don't already have
            const featureClass = await this._findFromMultiselect("classes", compareLabel(textPrereq));
            if (featureClass) {
                newFeatures.push(featureClass);
                allNew.push(featureClass);
                if (RETURN.sub) RETURN.sub.uuid = featureClass.uuid;
                return RETURN;
            }
            const feature = await this._findFromMultiselect("features", compareLabel(textPrereq));
            if (feature) {
                newFeatures.push(feature);
                allNew.push(feature);
                if (RETURN.sub) RETURN.sub.uuid = feature.uuid;
                return RETURN;
            }
            const edge = await this._findFromMultiselect("edges", compareLabel(textPrereq));
            if (edge) {
                newEdges.push(edge);
                allNew.push(edge);
                if (RETURN.sub) RETURN.sub.uuid = edge.uuid;
                return RETURN;
            }

            if (withSub) {
                // this is clearly not a feat/edge with a sub
                textPrereq = originalPrereq;
                RETURN.sub = null;
            }

            const getSkill = function (t) {
                // TODO: do better, act right :(
                // this is very gross. Let's add some stuff in index.js so we don't have to rely on the translations
                return CONFIG.PTU.data.skills.keys.find(k => simplifyString(t) == simplifyString(game.i18n.format(`SKILL.${k}`)));
            };

            // check if it's a single minimum skill rank
            const singleSkillMatch = textPrereq.match(SINGLE_MIN_SKILL_RANK_RE);
            if (singleSkillMatch) {
                // TODO: do better, act right :(
                // this is very gross. Let's add some stuff in index.js so we don't have to rely on the translations
                const rank = [1, 2, 3, 4, 5, 6, 8].find(r => CONFIG.PTU.data.skills.PTUSkills.getRankSlug(r) == singleSkillMatch.groups.rank.toLowerCase());
                const skill = getSkill(singleSkillMatch.groups.skill);
                if (rank && skill) {
                    skillUpdates[skill] = Math.max(rank, skillUpdates[skill] ?? 0);
                    return RETURN;
                }
                // check multi-skill?
                if (singleSkillMatch.groups.skill.includes(" or ")) {
                    const skills = singleSkillMatch.groups.skill.split(" or ").map(getSkill);
                    // check if we meet any of those prereqs. If so, return.
                    for (const s of skills) {
                        if (rank <= Math.max(this.trainer.skills[s]?.value, skillUpdates[s] ?? 0)) return RETURN;
                    }
                    // otherwise, we do not meet this prerequisite
                    unmet.push(textPrereq);
                    return RETURN;
                }
            }

            // check if there's "N Skills at RANK"
            const anySkillMatch = textPrereq.match(ANY_N_SKILLS_AT_RE);
            if (anySkillMatch) {
                // TODO: do better, act right :(
                // this is somewhat gross. Let's add some stuff in index.js so we don't have to rely on the translations
                const rank = [1, 2, 3, 4, 5, 6, 8].find(r => CONFIG.PTU.data.skills.PTUSkills.getRankSlug(r) == anySkillMatch.groups.rank.toLowerCase());
                const n = parseIntA(anySkillMatch.groups.n || "100");
                if (rank && n) {
                    if (CONFIG.PTU.data.skills.keys.filter(k => rank <= Math.max(this.trainer.skills[k]?.value, skillUpdates[k] ?? 0)).length >= n) return RETURN;
                    else {
                        unmet.push(textPrereq);
                        return RETURN;
                    }
                }
            }

            // check if there's "any N of SKILLS at RANK"
            const nSkillMatch = textPrereq.match(N_SKILLS_AT_FROM_LIST_RE);
            if (nSkillMatch) {
                // TODO: do better, act right :(
                // this is somewhat gross. Let's add some stuff in index.js so we don't have to rely on the translations
                const rank = [1, 2, 3, 4, 5, 6, 8].find(r => CONFIG.PTU.data.skills.PTUSkills.getRankSlug(r) == nSkillMatch.groups.rank.toLowerCase());
                const n = parseIntA(nSkillMatch.groups.n || "100");
                const skills = nSkillMatch.groups.skills.split(" or ").map(getSkill);
                if (rank && n) {
                    if (skills.filter(k => rank <= Math.max(this.trainer.skills[k]?.value, skillUpdates[k] ?? 0)).length >= n) return RETURN;
                    else {
                        unmet.push(textPrereq);
                        return RETURN;
                    }
                }
            }


            // check if it's an OR clause, and we already match any of the terms


            // we can't figure out what this is, return
            if (!unmetPrereqs.unknown.includes(textPrereq)) unknown.push(textPrereq);
            return RETURN
        };

        // Get all the prerequisites
        for (let idx = 0; idx < allComputed.length; idx++) {
            const item = allComputed[idx];

            // parse all of the regular prerequisites
            for (const prereq of item.system.prerequisites) {
                const results = await checkTextPrereq(prereq, true);
                results.newFeatures.forEach(x => featuresComputed.push(Object.assign(x, { auto: true })));
                results.newEdges.forEach(x => edgesComputed.push(Object.assign(x, { auto: true })));
                results.allNew.forEach(x => allComputed.push(Object.assign(x, { auto: true })));
                Object.entries(results.skillUpdates).forEach(([k, v]) => {
                    if (unmetPrereqs.skills[k] ?? 0 < v) unmetPrereqs.skills[k] = v;
                });
                if (results.sub != null) unmetPrereqs.subs.push(results.sub);
                results.unmet.forEach(u => {
                    if (!unmetPrereqs.unmet.includes(u)) unmetPrereqs.unmet.push(u);
                })
                results.unknown.forEach(u => {
                    if (!unmetPrereqs.unknown.includes(u)) unmetPrereqs.unknown.push(u);
                })
            }
        }

        // get selectable choices from the computed features/edges
        for (const choice of allComputed) {
            if ((choice?.system?.rules ?? []).length == 0) continue;
            const choiceSets = choice.system.rules.filter(r => r.key == "ChoiceSet");
            if (choiceSets?.length == 0) continue;
            const alreadySelected = new Set();
            const relatedChanges = [];
            for (const [idx, choiceSet] of choiceSets.entries()) {
                const choices = choiceSet.choices.map(c => ({ ...c }));
                const uuid = choice.uuid;
                const key = `${uuid}-${idx}`.replaceAll(".", "-");
                const subSelectable = {
                    key,
                    uuid,
                    idx,
                    label: choice.name,
                    choices,
                    selected: this.trainer?.subSelectables?.[key]?.selected ?? null,
                    visible: true,
                };
                // check if the choices are items in the compendium
                if (choices.every(c => COMPENDIUM_ITEM_RE.test(c.value))) {
                    const choiceItems = await Promise.all(choices.map(c => fromUuid(c.value)));
                    subSelectable.choices = choiceItems.map(i => ({
                        label: i.name,
                        value: i.uuid,
                    }));
                }

                // check if we've got an unmet prerequisite for this still
                const unmet = unmetPrereqs.subs.find(s => s.uuid == uuid);
                if (unmet && choices.find(c => c.label == unmet.subvalue)) {
                    subSelectable.selected = choices.find(c => c.label == unmet.subvalue)?.value ?? null;
                    subSelectable.visible = false;
                    unmetPrereqs.subs.splice(unmetPrereqs.subs.indexOf(unmet), 1);
                }
                // if (alreadySelected.has(subSelectable.selected)) {
                //     subSelectable.selected = null;
                //     subSelectable.visible = true;
                // }
                subSelectables[key] = subSelectable;
                relatedChanges.push(subSelectable);
                alreadySelected.add(subSelectable.selected);
            }

            // disable shared items that are already selected
            for (const subSelectable of relatedChanges) {
                subSelectable.choices = subSelectable.choices.map(c => ({
                    ...c,
                    disabled: !(c.value == subSelectable.selected || !alreadySelected.has(c.value)),
                }));
            }
        }


        // try to infer auto stat changes
        // TODO


        // set them as the values in the trainer
        this.trainer.features.computed = featuresComputed;
        this.trainer.edges.computed = edgesComputed;
        this.trainer.subSelectables = subSelectables;




        // set warnings
        this.warnings = [
            ...unmetPrereqs.unmet.map(u => `Prerequisite "${u}" not met!`),
            ...unmetPrereqs.unknown.map(u => `Unknown prerequisite "${u}"`),
        ];

        // apply established skill minimums
        const newSkills = foundry.utils.deepClone(this.trainer.skills);
        for (const [skill, value] of Object.entries(unmetPrereqs.skills)) {
            newSkills[skill].min = Math.max(value, newSkills[skill].min ?? 1);
            newSkills[skill].value = Math.max(value, newSkills[skill].value ?? 1);
        }
        this.trainer.skills = newSkills;


        // check if any pokemon have been newly configured
        for (const slot of Object.keys(this.party)) {
            const pkmn = foundry.utils.deepClone(this.party[slot]);
            if (!pkmn.configured) {
                // get the uuid of the pokemon
                const uuid = pkmn?.species?.uuid || pkmn?.species?.selected?.at(0)?.value;
                if (!uuid) continue;

                pkmn.species.uuid = uuid;
                // get the pokemon species
                const species = await fromUuid(uuid);
                pkmn.species.object = species;
                pkmn.species.name = species.name;
                // set available genders
                const genders = [];
                const genderRatio = species.system.breeding.genderRatio;
                if (genderRatio == -1) {
                    genders.push({
                        label: "PTU.Genderless",
                        value: "Genderless"
                    });
                }
                if (genderRatio >= 0 && genderRatio < 100) {
                    genders.push({
                        label: "PTU.Male",
                        value: "Male"
                    });
                }
                if (genderRatio > 0 && genderRatio <= 100) {
                    genders.push({
                        label: "PTU.Female",
                        value: "Female"
                    });
                }
                if (!genders.find(g => g.value == pkmn.species.gender.selected)) {
                    if (genderRatio == -1) {
                        pkmn.species.gender.selected = "Genderless";
                    } else {
                        pkmn.species.gender.selected = Math.random() * 100 < genderRatio ? "Male" : "Female";
                    }
                }
                pkmn.species.gender.options = genders;
                pkmn.species.gender.choosable = genders.length > 1;

                // get minimum level for this evolution
                pkmn.level.min = species.system.evolutions.find(e => e.slug == species.system.slug)?.level ?? 1;
                if (pkmn.level.value < pkmn.level.min) {
                    pkmn.level.value = pkmn.level.min;
                }

                pkmn.configured = true;
            };
            // get image
            const img = await PokemonGenerator.getImage(pkmn.species.object, {
                gender: pkmn.species.gender.selected,
                shiny: pkmn.shiny,
            })
            if (img) {
                pkmn.species.img = img;
            }
            this.party[slot] = pkmn;
        }


    }

    async finalize() {
        // TODO: fill unfilled required fields
    }

    async generate() {
        // build the folders
        const mainFolder = await Folder.create({
            name: this.trainer.name || "Unnamed Trainer",
            type: "Actor",
            parent: null,
        });
        const partyFolder = !Object.values(this.party).find(p => p.configured) ? null : await Folder.create({
            name: "Party",
            type: "Actor",
            parent: null,
            folder: mainFolder._id,
        });

        // build the NPC
        const skills = {}
        for (const skill of CONFIG.PTU.data.skills.keys) {
            skills[skill] = {
                label: game.i18n.format(`SKILL.${skill}`),
                modifier: {
                    mod: 0,
                    total: 0,
                    value: 0,
                },
                rank: CONFIG.PTU.data.skills.PTUSkills.getRankSlug(this.trainer.skills[skill].value),
                slug: skill,
                // type: body???
                value: {
                    value: this.trainer.skills[skill].value,
                    mod: 0,
                    total: this.trainer.skills[skill].value,
                },
            }
        }
        const stats = {}
        for (const stat of CONFIG.PTU.data.stats.keys) {
            stats[stat] = {
                base: stat == "hp" ? 10 : 5,
                label: game.i18n.format(`PTU.Stats.${stat}`),
                levelUp: this.trainer.stats[stat].value,
                mod: {
                    value: 0,
                    mod: 0,
                },
                total: null,
                value: null,
            }
        }

        const allItems = [...this.trainer.features.computed, ...this.trainer.edges.computed]
        const items = [];
        for (const item of allItems) {
            const iobj = (await fromUuid(item.uuid))?.toObject(); // TODO do we actually need to do this? or is item sufficient?
            iobj.flags ??= {}
            iobj.flags.core ??= {};
            iobj.flags.core.sourceId = item.uuid;

            // do choice-set assignments
            if ((iobj?.system?.rules ?? []).length > 0) {
                const choiceSets = iobj.system.rules.filter(r => r.key == "ChoiceSet");
                if (choiceSets?.length == 0) continue;
                // iobj.flags.ptu ??= {}
                // iobj.flags.ptu.rulesSelections ??= {}
                for (const [idx, choiceSet] of choiceSets.entries()) {
                    const uuid = item.uuid;
                    const key = `${uuid}-${idx}`.replaceAll(".", "-");
                    choiceSet.selection = this.trainer.subSelectables[key].selected;
                }
            }
            items.push(iobj);
        }

        const trainingItem = (await fromUuid(chooseFrom(["Compendium.ptu.feats.Item.TQ6scoBM3iZKMuZT", "Compendium.ptu.feats.Item.MolTHMn3UrNiIZ3h", "Compendium.ptu.feats.Item.FLSt79Zix8j69T07", "Compendium.ptu.feats.Item.WfLcIrUmRwblAaYr"]))).toObject();

        const trainerData = {
            name: this.trainer.name || "Unnamed Trainer",
            img: "icons/svg/mystery-man.svg",
            type: "character",
            system: {
                age: `${5 + Math.floor(this.trainer.level / 2) + Math.floor(Math.random() * (this.trainer.level + 10))}`,
                alliance: this.alliance,
                skills,
                stats,
                level: {
                    current: this.trainer.level,
                    milestones: this.trainer.level - 1,
                    dexexp: 0,
                    miscexp: 0,
                },
                sex: this.trainer.sex.length > 0 ? this.trainer.sex[0].label : "",
            },
            // items,
            items: [trainingItem],
            folder: mainFolder?._id ?? null,
        };

        // create trainer
        const createdTrainer = (await CONFIG.PTU.Actor.documentClasses.character.createDocuments([trainerData]))?.[0];

        // create items
        // createdTrainer.createDocuments(items, {parent: createdTrainer});
        // TODO: auto-pick choices first
        for (const itemType of Object.keys(CONFIG.PTU.Item.documentClasses)) {
            const itemsOfType = items.filter(f => f.type == itemType);
            if (itemsOfType) {
                await CONFIG.PTU.Item.documentClasses[itemType]?.createDocuments(itemsOfType, { parent: createdTrainer });
            }
        }




        // generate pokemon
        const monActorsToGenerate = [];
        for (const mon of Object.values(this.party)) {
            if (!mon.configured) continue;

            const monSpecies = await fromUuid(mon.species.uuid);
            const generator = new PokemonGenerator(monSpecies);
            generator.level = mon.level.value;
            generator.gender = mon.species.gender.current;
            generator.shiny = mon.shiny;
            generator.evolution = true; // don't change the species via evolution
            const generatorData = await generator.prepare().then(() => generator.create({
                folder: partyFolder?._id ?? null,
                generate: false,
            }));

            const actorData = {
                ...generatorData.actor,
                items: generatorData.items,
                name: mon.nickname || generatorData.actor.name,
            }
            actorData.system.alliance = this.alliance;
            actorData.flags ??= {}
            actorData.flags.ptu ??= {}
            actorData.flags.ptu.party ?? {
                trainer: createdTrainer._id,
                boxed: false,
            }

            monActorsToGenerate.push(actorData);
        }
        if (monActorsToGenerate) {
            const createdActors = await CONFIG.PTU.Actor.documentClasses.pokemon.createDocuments(monActorsToGenerate);

        }
    }

    get ready() {
        return true;
    }
}