import { PokemonGenerator } from "../../actor/pokemon/generator.js";
import { PTUSkills } from '../../actor/index.js';
import { Mutex } from '../../../util/mutex.js';

const MaxPartyPokemon = 6;


const SINGLE_MIN_SKILL_RANK_RE = /(?<rank>(Pathetic)|(Untrained)|(Novice)|(Adept)|(Expert)|(Master)|(Virtuoso)) (?<skill>.+)/i;
const ANY_N_SKILLS_AT_RE = /(any )?(?<n>([0-9]+)|(A)|(One)|(Two)|(Three)|(Four)|(Five)|(Six)|(Seven)|(Eight)|(Nine)) Skills? at (?<rank>(Untrained)|(Novice)|(Adept)|(Expert)|(Master)|(Virtuoso))( Rank)?/i;
const N_SKILLS_AT_FROM_LIST_RE = /(?<n>([0-9]+)|(A)|(One)|(Two)|(Three)|(Four)|(Five)|(Six)|(Seven)|(Eight)|(Nine))( Skills?)? of (?<skills>.+) at (?<rank>(Untrained)|(Novice)|(Adept)|(Expert)|(Master)|(Virtuoso))( Rank)?( or higher)?/i;

const FEAT_WITH_SUB_RE = /(?<main>.+)( \((?<sub>.+)\)?(?<cr> \[CR\])?)/i;
const N_FEATS_FROM_LIST_RE = /(?<n>([0-9]+)|(A)|(One)|(Two)|(Three)|(Four)|(Five)|(Six)|(Seven)|(Eight)|(Nine)) of (?<features>.+)?/i;
const COMPENDIUM_ITEM_RE = /Compendium\.([\w\.]+).Item.[a-zA-Z0-9]+/;

const LEVEL_RE = /Level (?<lv>[0-9]+)/i

// REGULAR EXPRESSIONS WITH global (/g) flag are NOT safe to use async
// They cause very very weird bugs if you try

function parseIntA(s) {
    let i = parseInt(s);
    if (!Number.isNaN(i)) return i;
    if (s.toLowerCase() == "a") return 1;
    i = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"].indexOf(s.toLowerCase());
    if (i >= 0) return i;
    return Number.NaN;
}

function simplifyString(s) {
    const replacements = {
        "pokémon": "pokemon",
        "general education": "general",
        "tech education": "technology",
        "technology education": "technology",
        "medicine education": "medicine",
        "medicine edu": "medicine",
        "pokemon education": "pokemon",
        "occult education": "occult",
        "intimidation": "intimidate",
    };
    return Object.keys(replacements).reduce(((a, b)=>a?.replaceAll(b, replacements[b])), s?.toLowerCase());
}


function chooseFrom(list) {
    return list[Math.random() * list.length | 0];
}

function average(list) {
    return list.reduce((a,b)=>a+b, 0) / list.length;
}

function shuffle(list) {
    return list.map(value => ({ value, sort: Math.random() })).sort((a, b) => a.sort - b.sort).map(({ value }) => value);
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
                value: 2,
                min: 1,
                max: 6,
                rankSlug: "untrained",
                valueLabel: "Untrained",
                prevRank: 2,
                nextRank: 3,
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
                options: ["PTU.Male", "PTU.Female", "PTU.Nonbinary"].map(x=>game.i18n.format(x)).map(x=>({ label: x, value: x})),
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


        this.warnings = {
            num: 0,
            unmet: [],
            unknown: [],
        };

        this._refreshMutex = new Mutex();
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
                })
            }
        }
        this.multiselects.edges.options.sort((a, b) => a.label.localeCompare(b.label));

        // get species
        for (const compendium of speciesCompendiums) {
            for (const species of game.packs.get(compendium).index) {
                if (species.type !== "species") continue;
                if (species.name.includes("-Mega")) continue; // Mega evolutions aren't real evolutions
                if (species.name.includes("-Terrastal")) continue; // Same with 
                if (species.name.includes("-Eternamax")) continue; // Same with Terrastalized
                if (species.name.startsWith("Delta ")) continue; // What even is this?
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
        if ((typeof originalProperty != typeof value) || (typeof originalProperty != "object" && originalProperty != value) || (typeof originalProperty == "object" && JSON.stringify(originalProperty) != JSON.stringify(value))) {
            this.manuallyUpdatedFields.add(key);
        }
    }

    /*-----------------------------------------------------------------------*/

    /*                           AUTO GENERATION                             */

    async randomizeAll(force = false) {
        if (force) this.manuallyUpdatedFields = new Set();
        const noUpdate = new Set(this.manuallyUpdatedFields); // make sure the set doesn't change under us

        console.log(noUpdate);

        // remove classes, features, and edges if they've not been manually set.
        if (!noUpdate.has("trainer.classes.selected")) this.trainer.classes.selected = [];
        if (!noUpdate.has("trainer.features.selected")) this.trainer.features.selected = [];
        if (!noUpdate.has("trainer.edges.selected")) this.trainer.edges.selected = [];
        await this.refresh();

        // set skills to their minimum value
        for (const slug of CONFIG.PTU.data.skills.keys) {
            if (noUpdate.has(`trainer.skills.${slug}.value`)) continue;
            const skill = this.trainer.skills[slug];
            skill.value = skill.min;
        }

        // TODO stats to min

        // start generating!
        if (!noUpdate.has("trainer.sex")) await this.randomizeSex();
        if (!noUpdate.has("trainer.name")) await this.randomizeName();
        if (!noUpdate.has("trainer.level")) await this.randomizeLevel();
        if (!noUpdate.has("trainer.classes.selected")) await this.randomizeClass();
        if (!noUpdate.has("trainer.features.selected")) await this.randomizeFeatures();
        if (!noUpdate.has("trainer.edges.selected")) await this.randomizeEdges();

        await this.randomizeSkills();
        
        // TODO

        for (let s = 1; s <= 6; s++) {
            const slot = `slot${s}`;
            if (noUpdate.has(`party.${slot}.species.selected`)) continue;
            if (noUpdate.has(`party.${slot}.nickname`)) continue;
            if (noUpdate.has(`party.${slot}.gender.selected`)) continue;
            if (noUpdate.has(`party.${slot}.shiny`)) continue;
            await this.randomizePartyPokemon(slot);
        }


        await this.refresh();
    }

    async randomizeName() {
        this.trainer.name = chooseFrom(["Alex", "Beth", "Carmen", "Dylan", "Emma", "Felix", "Gertrude", "Harold", "Indara"]);
    }

    async randomizeSex() {
        this.trainer.sex = [chooseFrom(["PTU.Male", "PTU.Female"].map(x=>game.i18n.format(x)).map(x=>({ label: x, value: x})))];
        if (Math.random() * 400 <= 3) this.trainer.sex = [chooseFrom(this.multiselects.sex.options)];
    }

    static normalDistribution(mean, std_dev) {
        // average ~8 Math.random() calls to simulate a normal distribution (mean~=0.5+C, std_dev~=0.1)
        const N = 8;
        const C = mean;
        const X = std_dev * 10;
        return average(Array.from({length: N}, () => C + ((Math.random() - 0.5) * X)));
    }

    async randomizeLevel() {
        const estimatedAppropriateLevel = this.estimatedAppropriateLevel;
        const randomNormal = NpcQuickBuildData.normalDistribution(0.9, 0.1);
        this.trainer.level = Math.min(50, Math.max(1, Math.round(estimatedAppropriateLevel * randomNormal)));
    }

    get expectedClassNumber() {
        return 1 + Math.floor(Math.sqrt(this.trainer.level / 5));
    }

    get expectedFeatureNumber() {
        return 1 + Math.floor(Math.sqrt(this.trainer.level));
    }

    get expectedEdgeNumber() {
        return 1 + Math.floor(Math.sqrt(this.trainer.level));
    }

    async randomizeClass(keepExisting=false) {
        const newClasses = keepExisting ? [...this.trainer.classes.selected] : [];
        if (!keepExisting) {
            this.trainer.classes.selected = [];
            await this.refresh();
        }

        const N = this.expectedClassNumber;
        const N_F = this.expectedFeatureNumber;
        const N_E = this.expectedEdgeNumber;
        const MAX_ATTEMPTS = 5 + (N * 3);
        const allComputed = [...this.trainer.features.computed, ...this.trainer.edges.computed];

        // assume we have maxed skills for our level
        const skillsComputed = {};
        const skillLimit = this.skillLimit;
        for (const skill of CONFIG.PTU.data.skills.keys) {
            skillsComputed[skill] = Math.max(skillLimit, this.trainer.skills[skill].value ?? 1);
        }

        // Stat Ace and Type Ace are problematic with their A/B prerequisites
        const curatedOptions = this.multiselects.classes.options.filter(c=>!(c.label.startsWith("Stat Ace") || c.label.startsWith("Type Ace")));

        let numChosen = newClasses.length;
        let numFeaturesChosen = this.trainer.features.computed.length;
        let numEdgesChosen = this.trainer.edges.computed.length;
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            const chosen = chooseFrom(curatedOptions);

            const { allNewFeatures, allNewEdges, allNewUnmet } = await this.allItemPrereqs(chosen.prerequisites, { level: this.trainer.level, allComputed, skillsComputed })
            if (allNewUnmet.length == 0 && numChosen + 1 <= N && numFeaturesChosen + allNewFeatures.length <= N_F && numEdgesChosen + allNewEdges.length <= N_E) {
                newClasses.push(chosen);
                numChosen += 1;
                numFeaturesChosen += allNewFeatures.length;
                numEdgesChosen += allNewEdges.length;
            }

            if (numChosen >= N) break;
        }
        this.trainer.classes.selected = newClasses;
        await this.refresh()
    }

    async randomizeFeatures(keepExisting=false) {
        const newFeatures = keepExisting ? [...this.trainer.features.selected] : [];
        if (!keepExisting) {
            this.trainer.features.selected = [];
            await this.refresh();
        }

        const N = this.expectedFeatureNumber;
        const MAX_ATTEMPTS = 5 + (N * 3);
        const allComputed = [...this.trainer.features.computed, ...this.trainer.edges.computed];

        // assume we have maxed skills for our level
        const skillsComputed = {};
        const skillLimit = this.skillLimit;
        for (const skill of CONFIG.PTU.data.skills.keys) {
            skillsComputed[skill] = Math.max(skillLimit, this.trainer.skills[skill].value ?? 1);
        }

        let numChosen = newFeatures.length + this.trainer.features.computed.length;
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            const chosen = chooseFrom(this.multiselects.features.options);

            const { allNewFeatures, allNewUnmet } = await this.allItemPrereqs(chosen.prerequisites, { level: this.trainer.level, allComputed, skillsComputed })
            if (allNewUnmet.length == 0 && numChosen + 1 + allNewFeatures.length <= N) {
                newFeatures.push(chosen);
                numChosen += 1 + allNewFeatures.length;
            }

            if (numChosen >= N) break;
        }
        this.trainer.features.selected = newFeatures;
        await this.refresh()
    }

    async randomizeEdges(keepExisting=false) {
        const newEdges = keepExisting ? [...this.trainer.edges.selected] : [];
        if (!keepExisting) {
            this.trainer.edges.selected = [];
            await this.refresh();
        }

        const N = this.expectedEdgeNumber;
        const MAX_ATTEMPTS = 5 + (N * 3);
        const allComputed = [...this.trainer.features.computed, ...this.trainer.edges.computed];

        // assume we have maxed skills for our level
        const skillsComputed = {};
        const skillLimit = this.skillLimit;
        for (const skill of CONFIG.PTU.data.skills.keys) {
            skillsComputed[skill] = Math.max(skillLimit, this.trainer.skills[skill].value ?? 1);
        }

        const curatedOptions = this.multiselects.edges.options.filter(e=>!["Basic Skills", "Adept Skills", "Expert Skills", "Master Skills"].includes(e.label));

        let numChosen = newEdges.length + this.trainer.edges.computed.length;
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            const chosen = chooseFrom(curatedOptions);

            const { allNewEdges, allNewUnmet } = await this.allItemPrereqs(chosen.prerequisites, { level: this.trainer.level, allComputed, skillsComputed })
            if (allNewUnmet.length == 0 && numChosen + 1 + allNewEdges.length <= N) {
                newEdges.push(chosen);
                numChosen += 1 + allNewEdges.length;
            }

            if (numChosen >= N) break;
        }
        this.trainer.edges.selected = newEdges;
        await this.refresh()
    }

    get skillLimit() {
        let limit = 3;
        if (this.trainer.level >= 12) limit = 6;
        else if (this.trainer.level >= 6) limit = 5;
        else if (this.trainer.level >= 2) limit = 4;
        return limit;
    }

    async randomizeSkills() {
        const noUpdate = new Set(this.manuallyUpdatedFields); // make sure the set doesn't change under us

        let pointsUsed = 0;
        for (const slug of CONFIG.PTU.data.skills.keys) {
            const skill = this.trainer.skills[slug];

            if (!noUpdate.has(`trainer.skills.${slug}.value`)) {
                pointsUsed += skill.min - 1;
            } else {
                pointsUsed += skill.value - 1;
            }
        }
        // each edge also subtracts from the number of skill advancements possible
        pointsUsed += this.trainer.edges.selected.length;

        // maximum points per skill by level
        const limit = this.skillLimit;

        // you start with a number of points equal to the number of skills
        // every even level you gain an edge
        // level 2, gain +1
        // level 6, gain +1
        // level 12, gain +1

        let maxPoints = CONFIG.PTU.data.skills.keys.length + Math.floor(this.trainer.level / 2);

        const modifiableSkills = CONFIG.PTU.data.skills.keys.filter(slug=>!noUpdate.has(`trainer.skills.${slug}.value`));
        // unspend all points
        for (const slug of modifiableSkills) {
            const skill = this.trainer.skills[slug];
            skill.value = skill.min;
        }

        // spend points until we're out of points, or out of things to spend them on!
        const spendable = shuffle(modifiableSkills.filter(slug=>this.trainer.skills[slug].min < Math.min(limit, this.trainer.skills[slug].max)));
        while (maxPoints > pointsUsed) {
            let pointAvailability = 0;
            for (const slug of spendable) {
                const skill = this.trainer.skills[slug];
                const amountToIncrease = Math.round(Math.random() * Math.min(Math.min(limit, skill.max) - skill.value, maxPoints-pointsUsed))
                skill.value = skill.value + amountToIncrease;
                pointsUsed += amountToIncrease;
                pointAvailability += skill.max - skill.value;
            }
            if (pointAvailability <= 0) break;
        }
    }

    async randomizeStats() {

    }

    async randomizePartyPokemon(slot) {
        // randomize level
        const pkmnLevel = Math.min(100, Math.max(1, Math.round((this.trainer.level * 2) * NpcQuickBuildData.normalDistribution(1.0, 0.1))));
        
        // randomize species
        // currently this is weighted towards species with more evolutions...
        // but it's really really slow to try to avoid that problem
        let speciesOption = chooseFrom(this.multiselects.species.options);
        let species = (await fromUuid(speciesOption.value));
        let evolutionChain = species.system.evolutions;
        
        // make sure we're at the right evolution level
        speciesOption = evolutionChain.filter(ev=>ev.level <= pkmnLevel).sort(ev=>-ev.level).map(ev=>({
            label: ev.slug[0].toUpperCase() + ev.slug.slice(1),
            value: ev.uuid,
        }))?.[0];
        species = (await fromUuid(speciesOption.value)) ?? species;

        this.party[slot].species.selected = [speciesOption];
        this.party[slot].species.object = species;
        this.party[slot].species.name = species.name;
        this.party[slot].species.uuid = speciesOption.value;
        this.party[slot].level.value = pkmnLevel;

        this.party[slot].configured = true;

        // console.log(validSpeciesToGenerate);
    }


    /**
     * 
     * @param {*} textPrereq 
     * @param {*} param1 
     * @returns { met, newFeatures, newEdges, newSkills, skillRank, subOption, unknown } 
     */
    async checkTextPrereq(textPrereq, { level, allComputed, skillsComputed, previousSkillRank=null}) {
        const originalPrereq = textPrereq;
        const RETURN = {
            met: false,
            newFeatures: [],
            newEdges: [],
            newSkills: {},
            skillRank: null,
            subOption: null,
            unknown: false,
        };

        const compareName = function (t) {
            return (f) => simplifyString(f.name) == simplifyString(t);
        };
        const compareLabel = function (t) {
            return (f) => simplifyString(f.label) == simplifyString(t);
        };

        // check if this has a parenthesized section (for selection of feat, for instance)
        const withSub = textPrereq.match(FEAT_WITH_SUB_RE);
        if (withSub?.groups?.sub) {
            RETURN.subOption = {
                main: withSub.groups.main,
                subvalue: withSub.groups.sub,
            };
            textPrereq = withSub.groups.main;
        }

        // check if the prereq is GM Permission
        if (originalPrereq == "GM Permission") {
            RETURN.met = true;
            RETURN.subOption = null; // the suboption doesn't matter, GM Permission is all that's needed
            return RETURN;
        }

        // check if the prereq is a minimum level
        const levelRequirement = textPrereq.match(LEVEL_RE);
        if (levelRequirement) {
            const lvRequired = parseInt(levelRequirement.groups.lv);
            RETURN.met = level >= lvRequired;
            RETURN.subOption = null; // the suboption doesn't matter
            return RETURN;
        };

        // check if this is the name of a class, feature, or edge we already have
        const existingItem = allComputed.find(compareName(textPrereq));
        if (existingItem) {
            RETURN.met = true;
            if (RETURN.subOption) RETURN.subOption.uuid = existingItem.uuid;
            return RETURN;
        }

        // check if it's the name of a class, feature or edge we don't already have
        const featureClass = await this._findFromMultiselect("classes", compareLabel(textPrereq));
        if (featureClass) {
            RETURN.newFeatures.push(featureClass);
            if (RETURN.subOption) RETURN.subOption.uuid = featureClass.uuid;
            return RETURN;
        }
        const feature = await this._findFromMultiselect("features", compareLabel(textPrereq));
        if (feature) {
            RETURN.newFeatures.push(feature);
            if (RETURN.subOption) RETURN.subOption.uuid = feature.uuid;
            return RETURN;
        }
        const edge = await this._findFromMultiselect("edges", compareLabel(textPrereq));
        if (edge) {
            RETURN.newEdges.push(edge);
            if (RETURN.subOption) RETURN.subOption.uuid = edge.uuid;
            return RETURN;
        }

        if (withSub) {
            // this is clearly not a feat/edge with a sub
            textPrereq = originalPrereq;
            RETURN.subOption = null;
        }

        // check if it's "any X of list" features
        const nFeaturesOf = textPrereq.match(N_FEATS_FROM_LIST_RE)
        if (nFeaturesOf) {
            const n = parseIntA(nFeaturesOf.groups.n || "100");
            const items = nFeaturesOf.groups.features.split(/ or /gi).map(name=>{
                for (const bucket of ["classes", "features", "edges"]) {
                    const result = this.multiselects[bucket]?.options?.find(compareLabel(name))
                    if (result) return name;
                }
                return null;
            });
            if (n && items.filter(item=>item == null).length == 0) {
                if (items.filter(name=>allComputed.find(compareName(name)) != null).length >= n) {
                    RETURN.met = true;
                    return RETURN;
                }
                RETURN.met = false;
                return RETURN;
            }
        }

        //
        // Check for skills & variations
        //

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
                RETURN.met = (skillsComputed[skill] ?? 1) >= rank;
                RETURN.skillRank = rank;
                RETURN.newSkills[skill] = rank;
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
                if (CONFIG.PTU.data.skills.keys.filter(k => rank <= skillsComputed[k] ?? 0).length >= n) {
                    RETURN.met = true;
                    return RETURN;
                }
                else return RETURN;
            }
        }

        // check if there's "any N of SKILLS at RANK"
        const nSkillMatch = textPrereq.match(N_SKILLS_AT_FROM_LIST_RE);
        if (nSkillMatch) {
            // TODO: do better, act right :(
            // this is somewhat gross. Let's add some stuff in index.js so we don't have to rely on the translations
            const rank = [1, 2, 3, 4, 5, 6, 8].find(r => CONFIG.PTU.data.skills.PTUSkills.getRankSlug(r) == nSkillMatch.groups.rank.toLowerCase());
            const n = parseIntA(nSkillMatch.groups.n || "100");
            const skills = nSkillMatch.groups.skills.split(/ or /gi).map(getSkill);
            if (rank && n) {
                if (skills.filter(k => rank <= skillsComputed[k] ?? 0).length >= n) {
                    RETURN.met = true;
                    return RETURN;
                } 
                else return RETURN;
            }
        }

        // if its just a skill by itself and we have a non-null "previousSkillRank"
        const loneSkill = getSkill(textPrereq);
        if (loneSkill && previousSkillRank) {
            RETURN.met = (skillsComputed[loneSkill] ?? 1) >= previousSkillRank;
            RETURN.newSkills[loneSkill] = previousSkillRank;
            return RETURN;
        }

        // check if it's an OR clause; recurse!
        if ((/ or /gi).test(textPrereq)) {
            const terms = textPrereq.split(/ or /gi);
            let sr = null;
            RETURN.unknown = false;
            for (const term of terms) {
                const { met, skillRank, unknown } = await this.checkTextPrereq(term, { level, allComputed, skillsComputed, previousSkillRank: sr });
                if (met) {
                    console.log("MET", originalPrereq, textPrereq, RETURN);
                    RETURN.unknown = false;
                    RETURN.met = true;
                    return RETURN;
                }
                if (unknown) console.log("UNKNOWN", term, { level, allComputed, skillsComputed, previousSkillRank: sr })
                sr = skillRank ?? sr;
                RETURN.unknown ||= unknown; 
            }
            if (!RETURN.unknown) return RETURN;
            console.log("UNMET", originalPrereq, textPrereq, RETURN);
        }

        // we can't figure out what this is, return
        RETURN.unknown = true;
        return RETURN
    };


    async allItemPrereqs(prereqs, { level, allComputed, skillsComputed }) {
        const allNewFeatures = [];
        const allNewEdges = [];
        const allNewSkills = {};
        const allNewSubOptions = [];
        const allNewUnmet = [];
        const allNewUnknown = [];

        const allNewItems = [{ system: { prerequisites: prereqs } }];
        const newSkillsComputed = {...skillsComputed};

        for (let n = 0; n < allNewItems.length; n++) {
            for (const prereq of allNewItems[n].system.prerequisites) {
                const { met, newFeatures, newEdges, newSkills, subOption, unknown } = await this.checkTextPrereq(prereq, { level, allComputed, skillsComputed: newSkillsComputed });

                // if it's unknown, store it as unknown and move on
                if (unknown) {
                    if (!allNewUnknown.includes(prereq)) allNewUnknown.push(prereq);
                    continue;
                }

                // if it's unmet, and we're given nothing to meet it with, store the prereq as unmet and move on.
                if (!met && newFeatures.length == 0 && newEdges.length == 0 && Object.keys(newSkills).length == 0) {
                    if (!allNewUnmet.includes(prereq)) allNewUnmet.push(prereq);
                    continue;
                }

                newFeatures.forEach(x => {
                    allNewFeatures.push(x);
                    allNewItems.push(x);
                });
                newEdges.forEach(x => {
                    allNewEdges.push(x);
                    allNewItems.push(x);
                });
                Object.entries(newSkills).forEach(([k, v]) => {
                    allNewSkills[k] = Math.max(allNewSkills[k] ?? 1, v ?? 1);
                    newSkillsComputed[k] = Math.max(newSkillsComputed[k] ?? 1, v ?? 1)
                });
                if (subOption != null) allNewSubOptions.push(subOption);
            }
        }
        return {
            allNewFeatures,
            allNewEdges,
            allNewSkills,
            allNewSubOptions,
            allNewUnmet,
            allNewUnknown,
        };
    }


    /*-----------------------------------------------------------------------*/

    async refresh() {
        const unlock = await this._refreshMutex.lock()
        // grab the features and prerequisites
        // the actual structure of these foundry items, plus "uuid" and "auto"
        const allComputed = [];
        const featuresComputed = [];
        const edgesComputed = [];
        const subSelectables = {};
        const skillsMinimum = {};
        const skillsComputed = {};
        const allSuboptions = [];
        const allUnmet = [];
        const allUnknown = [];

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

        // populate skillsComputed
        for (const skill of CONFIG.PTU.data.skills.keys) {
            skillsComputed[skill] = this.trainer.skills[skill].value ?? 1;
        }

        // Get all the prerequisites
        for (let idx = 0; idx < allComputed.length; idx++) {
            const item = allComputed[idx];

            // parse all of the regular prerequisites
            const { allNewFeatures, allNewEdges, allNewSkills, allNewSubOptions, allNewUnmet, allNewUnknown } = await this.allItemPrereqs(item.system.prerequisites, { level: this.trainer.level, allComputed, skillsComputed });
            allNewFeatures.forEach(x => {
                Object.assign(x, { auto: true });
                featuresComputed.push(x);
                allComputed.push(x);
            });
            allNewEdges.forEach(x => {
                Object.assign(x, { auto: true });
                edgesComputed.push(x);
                allComputed.push(x);
            });
            Object.entries(allNewSkills).forEach(([k, v]) => {
                skillsMinimum[k] = Math.max(skillsMinimum[k] ?? 1, v ?? 1);
                if (skillsComputed[k] ?? 0 < v) skillsComputed[k] = v;
            });
            allNewSubOptions.forEach(x => {
                if (!allSuboptions.includes(x)) allSuboptions.push(x);
            });
            allNewUnmet.forEach(x => {
                if (!allUnmet.includes(x)) allUnmet.push(x);
            });
            allNewUnknown.forEach(x => {
                if (!allUnknown.includes(x)) allUnknown.push(x);
            });
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
                const unmet = allSuboptions.find(s => s.uuid == uuid);
                if (unmet && choices.find(c => c.label == unmet.subvalue)) {
                    subSelectable.selected = choices.find(c => c.label == unmet.subvalue)?.value ?? null;
                    subSelectable.visible = false;
                    allSuboptions.splice(allSuboptions.indexOf(unmet), 1);
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
        this.warnings = {
            num: allUnmet.length + allUnknown.length,
            unmet: allUnmet.map(u => `Prerequisite "${u}" not met!`),
            unknown: allUnknown.map(u => `Unknown prerequisite "${u}"`),
        }

        // apply established skill minimums
        const newSkills = foundry.utils.deepClone(this.trainer.skills);
        for (const [key, skill] of Object.entries(newSkills)) {
            const min = skillsMinimum[key] ?? 1;
            skill.min = min;
            skill.value = Math.max(skill.value, min);

            skill.rankSlug = PTUSkills.getRankSlug(skill.value);
            skill.valueLabel = `PTU.Skill${skill.rankSlug[0].toUpperCase() + skill.rankSlug.slice(1)}`;
            skill.prevRank = skill.value > skill.min ? skill.value - 1 : null;
            skill.nextRank = skill.value < skill.max ? skill.value + 1 : null;
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

                this.party[slot].configured = true;
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

        console.log(this);
        unlock();
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