import { PTUActor, PTUSkills } from "../index.js";
import { calcBaseStats, calculateEvasions, calculatePTStatTotal, calculateOldStatTotal, calculateStatTotal } from "../helpers.js";
import { calculatePokemonCapabilities } from "./capabilities.js";
import { getEffectiveness } from "./effectiveness.js";
import { calculateLevel } from "./level.js";
import { calculateSkills } from "./skills.js";
import { LevelUpForm } from "../../apps/level-up-form/sheet.js";
import { sluggify } from "../../../util/misc.js";
import { PokemonGenerator } from "./generator.js";
import { PTUModifier } from "../modifiers.js";

class PTUPokemonActor extends PTUActor {

    get identified() {
        //TODO: Implement this for 4.1
        return super.identified;
    }

    get species() {
        if (this.itemTypes.species.length > 1) console.warn(`Found more than one species for ${this.name}`);
        if(this.synthetics.speciesOverride.species) {
            return this.synthetics.speciesOverride.species;
        }
        return this.itemTypes.species[0];
    }

    get allowedItemTypes() {
        return ["species", "pokeedge", "move", "contestmove", "ability", "capability", "effect", "condition", "spiritaction"]
    }

    get nature() {
        return this.system.nature.value;
    }

    get moves() {
        return this.itemTypes.move.filter(m => !m.system.isStruggle);
    }

    /** @override */
    get sizeClass() {
        return this.species?.system?.size?.sizeClass ?? "Medium";
    }

    get trainer() {
        return game.actors.get(this.flags.ptu.party?.trainer) ?? null;
    }

    /** @override */
    async createEmbeddedDocuments(embeddedName, data, options) {
        if (embeddedName === "Item") {
            for (const itemData of data) {
                if (itemData.type === "species" && this.itemTypes.species.length > 0) {
                    if (this.itemTypes.species[0].slug == itemData.system.slug) return false;
                    await this.itemTypes.species[0].delete();
                }
            }
        }
        return super.createEmbeddedDocuments(embeddedName, data, options);
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();

        const system = this.system;

        // Add Skill Background traits
        // Background Increases
        for (const skill of Object.values(this.system.background.increased)) {
            if (!system.skills[skill]) continue;
            system.skills[skill]["value"]["mod"] += 1;
        }
        // Background Decreases
        for (const skill of Object.values(this.system.background.decreased)) {
            if (!system.skills[skill]) continue;
            system.skills[skill]["value"]["mod"] -= 1;
        }

        if(game.settings.get("ptu", "variant.spiritPlaytest")) {
            switch(system.spirit.value) {
                case 5:
                case 4:
                case 3: {
                    system.modifiers.acBonus.mod += 1;
                    system.modifiers.evasion.physical.mod += 1;
                    system.modifiers.evasion.special.mod += 1;
                    system.modifiers.evasion.speed.mod += 1;
                    system.modifiers.critRange.mod += 1;
                    system.modifiers.saveChecks.mod += 2;
                    system.modifiers.skillBonus.mod += 2;
                    break;
                }
                case 2: {
                    system.modifiers.saveChecks.mod += 2;
                    system.modifiers.skillBonus.mod += 2;
                    break;
                }
                case 1: {
                    system.modifiers.skillBonus.mod += 2;
                    break;
                }
                case -1: {
                    system.modifiers.skillBonus.mod -= 2;
                    break;
                }
                case -2: {
                    system.modifiers.saveChecks.mod -= 2;
                    system.modifiers.skillBonus.mod -= 2;
                    break;
                }
                case -3: {
                    system.modifiers.acBonus.mod -= 1;
                    system.modifiers.evasion.physical.mod -= 1;
                    system.modifiers.evasion.special.mod -= 1;
                    system.modifiers.evasion.speed.mod -= 1;
                    system.modifiers.critRange.mod -= 1;
                    system.modifiers.saveChecks.mod -= 2;
                    system.modifiers.skillBonus.mod -= 2;
                    break;
                }
            }
        }

        system.level.current = calculateLevel(system.level.exp);
        
        system.level.expTillNextLevel = CONFIG.PTU.data.levelProgression[Math.min(system.level.current + 1, 100)];
        system.level.percent = Math.round(
            (
                (system.level.exp - CONFIG.PTU.data.levelProgression[system.level.current]) 
                / 
                (system.level.expTillNextLevel - CONFIG.PTU.data.levelProgression[system.level.current])
            ) * 100);
        

        // Set attributes which are underrived data
        this.attributes = {
            level: {current: system.level.current, tillNext: system.level.expTillNextLevel, percent: system.level.percent},
            health: { current: system.health.value, temp: system.tempHp },
            skills: {},
        }
    }

    /** @override */
    prepareDerivedData() {
        super.prepareDerivedData();

        const system = this.system;

        if (!this.species) {
            return console.warn(`Unable to prepare derived data for ${this.name} as it has no species item.`);
        }

        const speciesSystem = this.species.system;

        // Prepare data with Mods
        for (let [key, mod] of Object.entries(system.modifiers)) {
            // Skip these modifiers
            if (["hardened", "flinch_count", "immuneToEffectDamage", "typeOverwrite", "tp", "capabilities"].includes(key)) continue;

            // If the modifier is an object, it has subkeys that need to be calculated
            if (mod[Object.keys(mod)[0]]?.value !== undefined) {
                for (let [subkey, value] of Object.entries(mod)) {
                    system.modifiers[key][subkey]["total"] = (value["value"] ?? 0) + (value["mod"] ?? 0);
                }
                continue;
            }

            // Otherwise, just calculate the total
            system.modifiers[key]["total"] = (mod["value"] ?? 0) + (mod["mod"] ?? 0);
        }

        // Prepare flat modifiers
        {
            const construct = ({ value, label }) => () => {
                const modifier = new PTUModifier({
                    slug: sluggify(label),
                    label,
                    modifier: value,
                })
                return modifier;
            }

            if (system.modifiers.saveChecks.total != 0) {
                const saveMods = (this.synthetics.statisticsModifiers["save-check"] ??= []);
                saveMods.push(construct({ value: system.modifiers.saveChecks.total, label: "Save Check Mod" }));
            }
        }

        // Calculate Level related data
        system.levelUpPoints = system.level.current + system.modifiers.statPoints.total + 10;
        // Calculate Stats related data
        if (this.flags?.ptu?.is_poisoned) {
            system.stats.spdef.stage.mod -= 2;
        }

        system.stats = this._calcBaseStats();

        const leftoverLevelUpPoints = system.levelUpPoints - Object.values(system.stats).reduce((a, v) => v.levelUp + a, 0);
        const actualLevel = Math.max(1, system.level.current - Math.max(0, Math.clamped(0, leftoverLevelUpPoints, leftoverLevelUpPoints - system.modifiers.statPoints.total ?? 0)));

        const result = calculateStatTotal({
            level: actualLevel,
            actorStats: system.stats,
            nature: system.nature.value,
            isTrainer: false,
            twistedPower: this.rollOptions.all["self:ability:twisted-power"],
        })

        system.stats = result.stats;
        system.levelUpPoints = system.levelUpPoints - result.pointsSpend;

        const types = [];
        if (system.modifiers?.typeOverwrite) {
            const splitTypes = system.modifiers?.typeOverwrite?.split('/');
            for (const type of splitTypes) {
                if (CONFIG.PTU.data.typeEffectiveness[Handlebars.helpers.capitalizeFirst(type.toLowerCase())]) types.push(type);
            }
        }

        system.typing = speciesSystem?.types ?? ['Untyped'];
        if(types.length > 0) system.typing = types;
        if(this.synthetics.typeOverride.typing) system.typing = this.synthetics.typeOverride.typing;

        // for (const type of system.typing) {
        //     this.flags.ptu.rollOptions.all["self:types:" + type.toLowerCase()] = true;
        // }
        if(system.shiny) this.flags.ptu.rollOptions.all["self:pokemon:shiny"] = true;

        system.health.total = 10 + system.level.current + (system.stats.hp.total * 3);
        system.health.max = system.health.injuries > 0 ? Math.trunc(system.health.total * (1 - ((system.modifiers.hardened ? Math.min(system.health.injuries, 5) : system.health.injuries) / 10))) : system.health.total;
        if (system.health.value === null) system.health.value = system.health.max;

        system.health.percent = Math.round((system.health.value / system.health.max) * 100);
        system.health.totalPercent = Math.round((system.health.value / system.health.total) * 100);

        system.health.tick = Math.floor(system.health.total / 10);

        system.initiative = { value: system.stats.spd.total + system.modifiers.initiative.total };
        if (this.flags?.ptu?.is_paralyzed) system.initiative.value = Math.floor(system.initiative.value * 0.5);
        if (system.modifiers.flinch_count?.value > 0) {
            system.initiative.value -= (system.modifiers.flinch_count.value * 5);
        }
        Hooks.call("updateInitiative", this);

        system.tp.max = (system.level.current > 0 ? Math.floor(system.level.current / 5) : 0) + 1 + (system.modifiers.tp ?? 0);
        system.tp.pep.value = this.items.filter(x => x.type == "pokeedge" && x.system.origin?.toLowerCase() != "pusher").length;
        system.tp.pep.max = system.level.current > 0 ? Math.floor(system.level.current / 10) + 1 : 1;

        system.evasion = this._calcEvasion();

        system.capabilities = this._calcCapabilities();

        system.egggroup = (speciesSystem?.breeding?.eggGroups || []).join?.(' & ') ?? [];

        // Calculate Skill Ranks
        for (const [key, skill] of Object.entries(speciesSystem?.skills ?? {})) {
            system.skills[key]["value"]["value"] = skill["value"]
            system.skills[key]["value"]["total"] = skill["value"] + system.skills[key]["value"]["mod"];
            system.skills[key]["modifier"]["value"] = skill["modifier"]
            system.skills[key]["modifier"]["total"] = skill["modifier"] + system.skills[key]["modifier"]["mod"] + (system.modifiers.skillBonus?.total ?? 0);
            system.skills[key]["rank"] = PTUSkills.getRankSlug(system.skills[key]["value"]["total"]);
            this.attributes.skills[key] = PTUSkills.calculate({actor: this, context: {skill: key, options: []}})
        }

        // Calc Type Effectiveness
        system.effectiveness = getEffectiveness(this);

        // Contests
        // This is to force the order of the stats to be the same as the order in the sheet
        system.contests.stats = {
            cool: system.contests.stats.cool,
            tough: system.contests.stats.tough,
            beauty: system.contests.stats.beauty,
            smart: system.contests.stats.smart,
            cute: system.contests.stats.cute
        }
        system.contests.voltage.value = this.trainer?.system?.contests?.voltage?.value ?? 0;
        for(const stat of Object.keys(system.contests.stats)) {
            const combatStat = (() => {
                switch(stat) {
                    case "cool": return "atk";
                    case "tough": return "def";
                    case "beauty": return "spatk";
                    case "smart": return "spdef";
                    case "cute": return "spd";
                }
            })();
            system.contests.stats[stat].stats.value = Math.min(Math.floor(system.stats[combatStat].total / 10), 3);
            system.contests.stats[stat].stats.mod ??= 0;
            system.contests.stats[stat].stats.total = Math.min(system.contests.stats[stat].stats.value + system.contests.stats[stat].stats.mod, 3);

            system.contests.stats[stat].poffins.mod ??= 0;
            system.contests.stats[stat].poffins.total = system.contests.stats[stat].poffins.value + system.contests.stats[stat].poffins.mod;

            system.contests.stats[stat].dice = system.contests.stats[stat].stats.total + system.contests.stats[stat].poffins.total + (system.contests.voltage.value ?? 0);
        }

        system.contests.appeal = this.trainer?.system?.contests?.appeal ?? {};
        system.contests.appeal.value ??= 0;
        system.contests.appeal.mod ??= 0;
        system.contests.appeal.total = system.contests.appeal.value + system.contests.appeal.mod;

        this.attributes.health.max = system.health.max;

        /* The Corner of Exceptions */

        // Shedinja will always be a special case.
        if (this.species.slug === "shedinja") {
            system.health.max = 1;
            system.health.tick = 1;
        }
    }

    _calcBaseStats() {
        const stats = duplicate(this.system.stats);

        const speciesStats = this.species?.system?.stats;
        for (const stat of Object.keys(stats)) {
            stats[stat].base = speciesStats?.[stat] ?? 1;
            stats[stat].value = stats[stat].base + this.system.modifiers?.baseStats?.[stat]?.total ?? 0;
        }

        return stats;
    }

    _calcEvasion() {
        if (this.rollOptions.conditions?.["vulnerable"]) {
            return {
                "physical": 0,
                "special": 0,
                "speed": 0
            };
        }

        const evasion = {
            "physical": Math.max(Math.min(Math.floor(this.system.stats.def.total / 5), 6) + this.system.modifiers.evasion.physical.total, 0),
            "special": Math.max(Math.min(Math.floor(this.system.stats.spdef.total / 5), 6) + this.system.modifiers.evasion.special.total, 0),
            "speed": Math.max(Math.min(Math.floor(this.system.stats.spd.total / 5), 6) + this.system.modifiers.evasion.speed.total, 0)
        };

        if (this.rollOptions.conditions?.["stuck"] && !this.rollOptions.all["self:types:ghost"]) evasion.speed = 0;

        return evasion;
    }

    // TODO: Implement rules for capability changing items
    _calcCapabilities() {
        const capabilities = duplicate(this.species?.system?.capabilities ?? {});
        if (!capabilities) return {};

        const speedCombatStages = this.system.stats.spd.stage.value + this.system.stats.spd.stage.mod;
        const spdCsChanges = speedCombatStages > 0 ? Math.floor(speedCombatStages / 2) : speedCombatStages < 0 ? Math.ceil(speedCombatStages / 2) : 0;
        const capabilityMod = Number(this.system.modifiers.capabilities?.total ?? 0);
        for (const key of Object.keys(capabilities)) {
            if (key == "High Jump" || key == "Long Jump" || key == "Power" || key == "Weight Class" || key == "Naturewalk" || key == "Other") continue;
            if (capabilities[key] > 0) {
                capabilities[key] = Math.max(capabilities[key] + spdCsChanges + capabilityMod, capabilities[key] > 1 ? 2 : 1)
                if (this.rollOptions.conditions?.["slowed"]) capabilities[key] = Math.max(1, Math.floor(capabilities[key] * 0.5));
                capabilities[key] = Math.max(1, capabilities[key] + (this.system.modifiers.capabilities?.[key] ?? 0));
            }
        }

        for(const key of Object.keys(this.system.modifiers.capabilities)) {
            if(capabilities[key] === undefined) capabilities[key] = this.system.modifiers.capabilities[key];
        }

        return capabilities;
    }

    /** @override */
    _setDefaultChanges() {
        super._setDefaultChanges();
        const changes = { system: {} };
        for (const value of Object.values(this.system.background.increased)) {
            if (value && value != "blank") {
                if (!changes["system"]["skills"]) changes["system"]["skills"] = {}
                if (!changes["system"]["skills"][value]) changes["system"]["skills"][value] = {}
                if (!changes["system"]["skills"][value]['value']) changes["system"]["skills"][value]['value'] = {}
                if (!changes["system"]["skills"][value]['value']['mod']) changes["system"]["skills"][value]['value']['mod'] = {}
                changes["system"]["skills"][value]['value']['mod'][randomID()] = { mode: 'add', value: 1, source: "Skill Background" };
            }
        }
        for (const value of Object.values(this.system.background.decreased)) {
            if (value && value != "blank") {
                if (!changes["system"]["skills"]) changes["system"]["skills"] = {}
                if (!changes["system"]["skills"][value]) changes["system"]["skills"][value] = {}
                if (!changes["system"]["skills"][value]['value']) changes["system"]["skills"][value]['value'] = {}
                if (!changes["system"]["skills"][value]['value']['mod']) changes["system"]["skills"][value]['value']['mod'] = {}
                changes["system"]["skills"][value]['value']['mod'][randomID()] = { mode: 'add', value: -1, source: "Skill Background" };
            }
        }
        if(game.settings.get("ptu", "variant.spiritPlaytest")) {
            if(!changes["system"]["modifiers"]) changes["system"]["modifiers"] = {}
            if(!changes["system"]["modifiers"]["acBonus"]) changes["system"]["modifiers"]["acBonus"] = {}
            if(!changes["system"]["modifiers"]["acBonus"]["mod"]) changes["system"]["modifiers"]["acBonus"]["mod"] = {}
            if(!changes["system"]["modifiers"]["evasion"]) changes["system"]["modifiers"]["evasion"] = {}
            if(!changes["system"]["modifiers"]["evasion"]["physical"]) changes["system"]["modifiers"]["evasion"]["physical"] = {}
            if(!changes["system"]["modifiers"]["evasion"]["physical"]["mod"]) changes["system"]["modifiers"]["evasion"]["physical"]["mod"] = {}
            if(!changes["system"]["modifiers"]["evasion"]["special"]) changes["system"]["modifiers"]["evasion"]["special"] = {}
            if(!changes["system"]["modifiers"]["evasion"]["special"]["mod"]) changes["system"]["modifiers"]["evasion"]["special"]["mod"] = {}
            if(!changes["system"]["modifiers"]["evasion"]["speed"]) changes["system"]["modifiers"]["evasion"]["speed"] = {}
            if(!changes["system"]["modifiers"]["evasion"]["speed"]["mod"]) changes["system"]["modifiers"]["evasion"]["speed"]["mod"] = {}
            if(!changes["system"]["modifiers"]["critRange"]) changes["system"]["modifiers"]["critRange"] = {}
            if(!changes["system"]["modifiers"]["critRange"]["mod"]) changes["system"]["modifiers"]["critRange"]["mod"] = {}
            if(!changes["system"]["modifiers"]["saveChecks"]) changes["system"]["modifiers"]["saveChecks"] = {}
            if(!changes["system"]["modifiers"]["saveChecks"]["mod"]) changes["system"]["modifiers"]["saveChecks"]["mod"] = {}
            if(!changes["system"]["modifiers"]["skillBonus"]) changes["system"]["modifiers"]["skillBonus"] = {}
            if(!changes["system"]["modifiers"]["skillBonus"]["mod"]) changes["system"]["modifiers"]["skillBonus"]["mod"] = {}
            switch(this.system.spirit.value) {
                case 5:
                case 4:
                case 3: {
                    changes["system"]["modifiers"]["acBonus"]["mod"][randomID()] = { mode: 'add', value: 1, source: "Spirit" };
                    changes["system"]["modifiers"]["evasion"]["physical"]["mod"][randomID()] = { mode: 'add', value: 1, source: "Spirit" };
                    changes["system"]["modifiers"]["evasion"]["special"]["mod"][randomID()] = { mode: 'add', value: 1, source: "Spirit" };
                    changes["system"]["modifiers"]["evasion"]["speed"]["mod"][randomID()] = { mode: 'add', value: 1, source: "Spirit" };
                    changes["system"]["modifiers"]["critRange"]["mod"][randomID()] = { mode: 'add', value: 1, source: "Spirit" };
                    changes["system"]["modifiers"]["saveChecks"]["mod"][randomID()] = { mode: 'add', value: 2, source: "Spirit" };
                    changes["system"]["modifiers"]["skillBonus"]["mod"][randomID()] = { mode: 'add', value: 2, source: "Spirit" };
                    break;
                }
                case 2: {
                    changes["system"]["modifiers"]["saveChecks"]["mod"][randomID()] = { mode: 'add', value: 2, source: "Spirit" };
                    changes["system"]["modifiers"]["skillBonus"]["mod"][randomID()] = { mode: 'add', value: 2, source: "Spirit" };
                    break;
                }
                case 1: {
                    changes["system"]["modifiers"]["skillBonus"]["mod"][randomID()] = { mode: 'add', value: 2, source: "Spirit" };
                    break;
                }
                case -1: {
                    changes["system"]["modifiers"]["skillBonus"]["mod"][randomID()] = { mode: 'add', value: -2, source: "Spirit" };
                    break;
                }
                case -2: {
                    changes["system"]["modifiers"]["saveChecks"]["mod"][randomID()] = { mode: 'add', value: -2, source: "Spirit" };
                    changes["system"]["modifiers"]["skillBonus"]["mod"][randomID()] = { mode: 'add', value: -2, source: "Spirit" };
                    break;
                }
                case -3: {
                    changes["system"]["modifiers"]["acBonus"]["mod"][randomID()] = { mode: 'add', value: -1, source: "Spirit" };
                    changes["system"]["modifiers"]["evasion"]["physical"]["mod"][randomID()] = { mode: 'add', value: -1, source: "Spirit" };
                    changes["system"]["modifiers"]["evasion"]["special"]["mod"][randomID()] = { mode: 'add', value: -1, source: "Spirit" };
                    changes["system"]["modifiers"]["evasion"]["speed"]["mod"][randomID()] = { mode: 'add', value: -1, source: "Spirit" };
                    changes["system"]["modifiers"]["critRange"]["mod"][randomID()] = { mode: 'add', value: -1, source: "Spirit" };
                    changes["system"]["modifiers"]["saveChecks"]["mod"][randomID()] = { mode: 'add', value: -2, source: "Spirit" };
                    changes["system"]["modifiers"]["skillBonus"]["mod"][randomID()] = { mode: 'add', value: -2, source: "Spirit" };
                    break;
                }
            }
        }
        this.system.changes = mergeObject(
            this.system.changes,
            changes
        );
    }

    /** @override */
    async _preUpdate(changed, options, userId) {
        if (!game.settings.get("ptu", "automation.levelUpScreen") || (changed.system?.level?.exp ?? null) === null || changed.system.level.exp === this.system.level.exp)
            return super._preUpdate(changed, options, userId);

        const newLevel = calculateLevel(changed.system.level.exp, this.system.level.current);
        if (newLevel <= this.system.level.current) return super._preUpdate(changed, options, userId);

        const actor = this;

        const result = await new Promise((resolve, _) => {
            const form = new LevelUpForm(actor, {
                newExp: changed.system.level.exp,
                newLevel,
                resolve
            })
            form.render(true);
        });

        if (result) {
            if (result.changed) mergeObject(changed, result.changed);
        }

        await super._preUpdate(changed, options, userId);

        const toAdd = [];
        const toRemove = [];

        if (result?.evolution && result.evolution.slug !== this.species.slug) {
            toAdd.push(result.evolution.toObject());
            const update = {}
            const tokenUpdates = {};

            const curImg = await PokemonGenerator.getImage(this.species, { gender: this.system.gender, shiny: this.system.shiny });
            const newImg = await PokemonGenerator.getImage(result.evolution, { gender: this.system.gender, shiny: this.system.shiny });

            if (this.img === curImg) update.img = newImg;
            if (this.prototypeToken.texture.src === curImg) {
                update["prototypeToken.texture.src"] = newImg;
                tokenUpdates["texture.src"] = update["prototypeToken.texture.src"];
            }
            if (sluggify(this.name) == this.species.slug) {
                update.name = Handlebars.helpers.capitalizeFirst(result.evolution.name);
                tokenUpdates["name"] = update.name;
            }

            if (this.species.system.size.sizeClass != result.evolution.system.size.sizeClass) {
                const newSize = (() => {
                    const size = result.evolution.system.size.sizeClass;
                    switch (size) {
                        case "Small": return { width: 0.5, height: 0.5 };
                        case "Medium": return { width: 1, height: 1 };
                        case "Large": return { width: 2, height: 2 };
                        case "Huge": return { width: 3, height: 3 };
                        case "Gigantic": return { width: 4, height: 4 };
                        default: return { width: 1, height: 1 };
                    }
                })();
                update["prototypeToken.width"] = newSize.width;
                update["prototypeToken.height"] = newSize.height;
                tokenUpdates["width"] = update["prototypeToken.width"];
                tokenUpdates["height"] = update["prototypeToken.height"];
            }

            if (Object.keys(update).length > 0) await this.update(update);
            if (Object.keys(tokenUpdates).length > 0) {
                for (const token of this.getActiveTokens()) {
                    await token.document.update(tokenUpdates);
                }
            }
        }

        if (result?.moves.add?.length > 0 || result?.moves.remove?.length > 0) {
            const movesToAdd = result.moves.add;
            const movesToRemove = result.moves.remove;
            if (movesToAdd.length > 0) toAdd.push(...movesToAdd);
            if (movesToRemove.length > 0) toRemove.push(...movesToRemove.map(m => m.id ?? m._id));
        }

        if (result?.abilities?.add?.length > 0) {
            for (const ability of result.abilities.add) {
                const currentAbility = this.itemTypes.ability.find(a => a.slug === ability.slug);
                if (currentAbility && !currentAbility.flags?.ptu?.abilityChosen) {
                    await currentAbility.update({
                        "flags.ptu.abilityChosen": ability.tier
                    });
                }
                else if (!currentAbility) {
                    const newAbility = (await fromUuid(ability.uuid)).toObject();
                    newAbility.flags.ptu = mergeObject(newAbility.flags?.ptu ?? {}, {
                        abilityChosen: ability.tier
                    });
                    toAdd.push(newAbility);
                }
            }
        }
        if (result?.abilities?.remove?.length > 0) {
            toRemove.push(...result.abilities.remove.map(a => a.id ?? a._id));
        }

        if (toRemove.length > 0) await this.deleteEmbeddedDocuments("Item", toRemove);
        if (toAdd.length > 0) await this.createEmbeddedDocuments("Item", toAdd);
    }
}

export { PTUPokemonActor }