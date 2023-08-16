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
        return this.itemTypes.species[0];
    }

    get allowedItemTypes() {
        return ["species", "pokeedge", "move", "ability", "item", "capability", "effect", "condition"]
    }

    get nature() {
        return this.system.nature.value;
    }

    get moves() {
        return this.itemTypes.move.filter(m => !m.system.isStruggle);
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
    prepareDerivedData() {
        super.prepareDerivedData();

        const system = this.system;

        if (!this.species) {
            this.oldPrepareData();
            return;
        }

        const speciesSystem = this.species.system;

        // Prepare data with Mods
        for (let [key, mod] of Object.entries(system.modifiers)) {
            // Skip these modifiers
            if (["hardened", "flinch_count", "immuneToEffectDamage", "typeOverwrite"].includes(key)) continue;

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
        system.level.current = calculateLevel(system.level.exp);

        system.levelUpPoints = system.level.current + system.modifiers.statPoints.total + 10;

        system.level.expTillNextLevel = (system.level.current < 100) ? CONFIG.PTU.data.levelProgression[system.level.current + 1] : CONFIG.PTU.data.levelProgression[100];
        system.level.percent = Math.round(((system.level.exp - CONFIG.PTU.data.levelProgression[system.level.current]) / (system.level.expTillNextLevel - CONFIG.PTU.data.levelProgression[system.level.current])) * 100);

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

        for (const type of system.typing) {
            this.flags.ptu.rollOptions.all["self:pokemon:type:" + type.toLowerCase()] = true;
        }

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

        system.tp.max = (system.level.current > 0 ? Math.floor(system.level.current / 5) : 0) + 1;
        system.tp.pep.value = this.items.filter(x => x.type == "pokeedge" && x.system.origin?.toLowerCase() != "pusher").length;
        system.tp.pep.max = system.level.current > 0 ? Math.floor(system.level.current / 10) + 1 : 1;

        system.evasion = this._calcEvasion();

        system.capabilities = this._calcCapabilities();

        system.egggroup = (speciesSystem?.breeding?.eggGroups ?? []).join(' & ');

        // Only run background skills if the actor is not constructed
        // This is to prevent the background skills from being applied twice
        // This is a temporary fix until the background skills are moved into rules
        if (!this.constructed) {
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
        }

        // Calculate Skill Ranks
        for (const [key, skill] of Object.entries(speciesSystem?.skills ?? {})) {
            system.skills[key]["value"]["value"] = skill["value"]
            system.skills[key]["value"]["total"] = skill["value"] + system.skills[key]["value"]["mod"];
            system.skills[key]["modifier"]["value"] = skill["modifier"]
            system.skills[key]["modifier"]["total"] = skill["modifier"] + system.skills[key]["modifier"]["mod"] + (system.modifiers.skillBonus?.total ?? 0);
            system.skills[key]["rank"] = PTUSkills.getRankSlug(system.skills[key]["value"]["total"]);
        }

        // Calc Type Effectiveness
        system.effectiveness = getEffectiveness(this);

        const passives = {}
        for (const item of this.items) {
            if (item.system.automation?.length > 0) {
                for (let index = 0; index < item.system.automation.length; index++) {
                    if (!item.system.automation[index].passive) continue;
                    for (const target of item.system.automation[index].targets) {
                        if (!passives[target]) passives[target] = [];
                        passives[target].push({
                            index: index,
                            automation: item.system.automation[index],
                            itemUuid: item.uuid,
                            itemName: item.name
                        })
                    }
                }
            }
        }
        system.passives = passives;

        /* The Corner of Exceptions */

        // Shedinja will always be a special case.
        if (this.species.slug === "shedinja") {
            system.health.max = 1;
            system.health.tick = 1;
        }
    }

    oldPrepareData() {
        const system = this.system;

        const speciesData = game.ptu.species.get(system.species);
        if (!speciesData) return;

        // Prepare system data
        system.isCustomSpecies = speciesData?.isCustomSpecies ?? false;

        // Prepare data with Mods
        for (let [key, mod] of Object.entries(system.modifiers)) {
            // Skip these modifiers
            if (["hardened", "flinch_count", "immuneToEffectDamage", "typeOverwrite"].includes(key)) continue;

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

        // Calculate Level related data
        system.level.current = calculateLevel(system.level.exp);

        system.levelUpPoints = system.level.current + system.modifiers.statPoints.total + 10;

        system.level.expTillNextLevel = (system.level.current < 100) ? CONFIG.PTU.data.levelProgression[system.level.current + 1] : CONFIG.PTU.data.levelProgression[100];
        system.level.percent = Math.round(((system.level.exp - CONFIG.PTU.data.levelProgression[system.level.current]) / (system.level.expTillNextLevel - CONFIG.PTU.data.levelProgression[system.level.current])) * 100);

        // Calculate Stats related data
        if (this.flags?.ptu?.is_poisoned) {
            system.stats.spdef.stage.mod -= 2;
        }

        system.stats = calcBaseStats(system.stats, speciesData, system.nature.value, system.modifiers.baseStats);

        const leftoverLevelUpPoints = system.levelUpPoints - Object.values(system.stats).reduce((a, v) => v.levelUp + a, 0);
        const actualLevel = Math.max(1, system.level.current - Math.max(0, Math.clamped(0, leftoverLevelUpPoints, leftoverLevelUpPoints - system.modifiers.statPoints.total ?? 0)));

        const result = game.settings.get("ptu", "playtestStats") ?
            calculatePTStatTotal(system.levelUpPoints, actualLevel, system.stats, { twistedPower: this.items.find(x => x.name.toLowerCase().replace("[playtest]") == "twisted power") != null }, system.nature.value, false) :
            calculateOldStatTotal(system.levelUpPoints, system.stats, { twistedPower: this.items.find(x => x.name.toLowerCase().replace("[playtest]") == "twisted power") != null });
        system.stats = result.stats;
        system.levelUpPoints = result.levelUpPoints;

        const types = [];
        if (system.modifiers?.typeOverwrite) {
            const splitTypes = system.modifiers?.typeOverwrite?.split('/');
            for (const type of splitTypes) {
                if (CONFIG.PTU.data.typeEffectiveness[Handlebars.helpers.capitalizeFirst(type.toLowerCase())]) types.push(type);
            }
        }
        if (types.length == 0 && speciesData?.Type) types.push(...speciesData.Type);
        system.typing = types.length > 0 ? types : speciesData?.Type;

        system.health.total = 10 + system.level.current + (system.stats.hp.total * 3);
        system.health.max = system.health.injuries > 0 ? Math.trunc(system.health.total * (1 - ((system.modifiers.hardened ? Math.min(system.health.injuries, 5) : system.health.injuries) / 10))) : system.health.total;
        if (system.health.value === null) system.health.value = system.health.max;

        system.health.percent = Math.round((system.health.value / system.health.max) * 100);

        system.health.tick = Math.floor(system.health.total / 10);

        system.initiative = { value: system.stats.spd.total + system.modifiers.initiative.total };
        if (this.flags?.ptu?.is_paralyzed) system.initiative.value = Math.floor(system.initiative.value * 0.5);
        if (system.modifiers.flinch_count?.value > 0) {
            system.initiative.value -= (system.modifiers.flinch_count.value * 5);
        }
        Hooks.call("updateInitiative", this);

        system.tp.max = (system.level.current > 0 ? Math.floor(system.level.current / 5) : 0) + 1;
        system.tp.pep.value = this.items.filter(x => x.type == "pokeedge" && x.system.origin?.toLowerCase() != "pusher").length;
        system.tp.pep.max = system.level.current > 0 ? Math.floor(system.level.current / 10) + 1 : 1;

        system.evasion = calculateEvasions(system, this.flags?.ptu, this.items);

        system.capabilities = calculatePokemonCapabilities(speciesData, this.items.values(), (system.stats.spd.stage.value + system.stats.spd.stage.mod), Number(system.modifiers.capabilities?.total ?? 0), this.flags?.ptu);

        if (speciesData) system.egggroup = speciesData["Breeding Information"]["Egg Group"].join(" & ");

        //TODO: Add skill background
        system.skills = calculateSkills(system.skills, speciesData, system.background, system.modifiers.skillBonus.total);

        // Calc skill rank
        for (let [key, skill] of Object.entries(system.skills)) {
            skill["value"]["total"] = skill["value"]["value"] + skill["value"]["mod"];
            skill["modifier"]["total"] = skill["modifier"]["value"] + skill["modifier"]["mod"];
            skill["rank"] = PTUSkills.getRankSlug(skill["value"]["total"]);
        }

        // Calc Type Effectiveness
        system.effectiveness = getEffectiveness(this);

        const passives = {}
        for (const item of this.items) {
            if (item.system.automation?.length > 0) {
                for (let index = 0; index < item.system.automation.length; index++) {
                    if (!item.system.automation[index].passive) continue;
                    for (const target of item.system.automation[index].targets) {
                        if (!passives[target]) passives[target] = [];
                        passives[target].push({
                            index: index,
                            automation: item.system.automation[index],
                            itemUuid: item.uuid,
                            itemName: item.name
                        })
                    }
                }
            }
        }
        system.passives = passives;

        /* The Corner of Exceptions */

        // Shedinja will always be a special case.
        if (system.species.toLowerCase() === "shedinja") {
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

        if (this.rollOptions.conditions?.["stuck"] && !this.rollOptions.all["self:pokemon:type:ghost"]) evasion.speed = 0;

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
            }
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
        this.system.changes = mergeObject(
            this.system.changes,
            changes
        );
    }

    /** @override */
    async _preUpdate(changed, options, userId) {
        if (!game.settings.get("ptu", "levelUpScreen") || (changed.system?.level?.exp ?? null) === null || changed.system.level.exp === this.system.level.exp)
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