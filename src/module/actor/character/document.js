import { PTUSkills, PTUActor } from "../index.js";
import { calculateEvasions, calculatePTStatTotal, calculateOldStatTotal, calculateStatTotal } from "../helpers.js";
import { calculateTrainerCapabilities } from "./capabilities.js";
import { PTUModifier } from "../modifiers.js";
import { sluggify } from "../../../util/misc.js";

class PTUTrainerActor extends PTUActor {

    get allowedItemTypes() {
        return ["feat", "edge", "move", "contestmove", "ability", "item", "capability", "effect", "condition", "dexentry"]
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();

        const system = this.system;

        // Add Skill Background traits
        for (const skill of Object.values(system.background.pathetic)) {
            if (system.skills[skill]) {
                system.skills[skill].value.mod -= 1;
            }
        }
        const { adept, novice } = system.background;
        if (system.skills[adept]) {
            system.skills[adept].value.mod += 2;
        }
        if (system.skills[novice]) {
            system.skills[novice].value.mod += 1;
        }

        system.level.dexexp = game.settings.get("ptu", "variant.useDexExp") == true
            ? (this.system.dex?.owned?.length || 0)
            : 0

        const levelUpRequirement = game.settings.get("ptu", "variant.trainerAdvancement") === "short-track" ? 20 : 10;

        const maxLevel = {
            "original": 50,
            "data-revamp": 25,
            "short-track": 25,
            "ptr-update": 50,
            "long-track": 100,
        }

        system.level.current =
            Math.clamp(
                1
                + Number(system.level.milestones)
                + Math.trunc((Number(system.level.miscexp) / levelUpRequirement) + (Number(system.level.dexexp) / levelUpRequirement)),
                1,
                maxLevel[game.settings.get("ptu", "variant.trainerAdvancement")] ?? 50
            );

        // Set attributes which are underrived data
        this.attributes = {
            // "skills": Object.fromEntries(
            //     Object.entries(system.skills)
            //         .map(([key, value]) => ([key, value.value.total]))
            // ),
            level: { current: system.level.current },
            health: { current: system.health.value, temp: system.tempHp, injuries: system.health.injuries },
            skills: {}
        }
    }

    /** @override */
    prepareDerivedData() {
        super.prepareDerivedData()

        const system = this.system;
        // Prepare data with Mods.

        // Prepare data with Mods
        for (let [key, mod] of Object.entries(system.modifiers)) {
            // Skip these modifiers
            if (["hardened", "flinch_count", "immuneToEffectDamage", "typeOverwrite", "capabilities"].includes(key)) continue;

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

        for (let [key, skill] of Object.entries(system.skills)) {
            skill["slug"] = key;
            skill["value"]["total"] = skill["value"]["value"] + skill["value"]["mod"];
            skill["rank"] = PTUSkills.getRankSlug(skill["value"]["total"]);
            skill["modifier"]["total"] = skill["modifier"]["value"] + skill["modifier"]["mod"] + (system.modifiers.skillBonus?.total ?? 0);
            this.attributes.skills[key] = this.prepareSkill(key);//PTUSkills.calculate({ actor: this, context: { skill: key, options: [] } });
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

        // Use Data
        system.levelUpPoints = (() => {
            switch (game.settings.get("ptu", "variant.trainerAdvancement")) {
                case "original": return system.level.current;
                case "data-revamp": return system.level.current * 2;
                case "short-track": {
                    let points = system.level.current * 2;
                    if (system.level.current >= 5) points += 5;
                    if (system.level.current >= 10) points += 5;
                    if (system.level.current >= 15) points += 5;
                    if (system.level.current >= 20) points += 5;
                    if (system.level.current == 25) points += 15;
                    return points;
                };
                case "ptr-update": {
                    let points = system.level.current;
                    if (system.level.current >= 5) points += 3;
                    if (system.level.current >= 10) points += 5;
                    if (system.level.current >= 20) points += 5;
                    if (system.level.current >= 25) points += 3;
                    if (system.level.current >= 35) points += 5;
                    return points;
                }
                case "long-track": return system.level.current;
            }
        })() + system.modifiers.statPoints.total + 9;

        system.stats = this._calcBaseStats();

        const leftoverLevelUpPoints = system.levelUpPoints - Object.values(system.stats).reduce((a, v) => v.levelUp + a, 0);
        const actualLevel = Math.max(1, system.level.current - Math.max(0, Math.clamp(0, leftoverLevelUpPoints, leftoverLevelUpPoints - system.modifiers.statPoints.total ?? 0)));

        const result = calculateStatTotal({
            level: ["data-revamp", "short-track"].includes(game.settings.get("ptu", "variant.trainerAdvancement")) ? actualLevel * 2 : actualLevel,
            actorStats: system.stats,
            nature: null,
            isTrainer: true,
            twistedPower: this.rollOptions.all["self:ability:twisted-power"],
            hybridArmor: this.rollOptions.all["self:ability:hybrid-armor"],
        })

        system.stats = result.stats;
        system.levelUpPoints = system.levelUpPoints - result.pointsSpend;

        system.health.total = 10 + (system.level.current * (["data-revamp", "short-track"].includes(game.settings.get("ptu", "variant.trainerAdvancement")) ? 4 : 2)) + (system.stats.hp.total * 3);
        system.health.max = system.health.injuries > 0 ? Math.trunc(system.health.total * (1 - ((system.modifiers.hardened ? Math.min(system.health.injuries, 5) : system.health.injuries) / 10))) : system.health.total;

        system.health.percent = Math.round((system.health.value / system.health.max) * 100);
        system.health.totalPercent = Math.round((system.health.value / system.health.total) * 100);
        system.health.tick = Math.floor(system.health.total / 10);

        system.evasion = calculateEvasions(system, this.flags?.ptu, this.items);
        system.capabilities = calculateTrainerCapabilities(system.skills, this.items, (system.stats.spd.stage.value + system.stats.spd.stage.mod), system.modifiers.capabilities, this.rollOptions.conditions?.["slowed"]);

        system.feats = {
            total: this.items.filter(x => x.type == "feat" && !x.system.free).length,
            max: ((level) => {
                switch (game.settings.get("ptu", "variant.trainerAdvancement")) {
                    case "original": return 4 + Math.ceil(level / 2);
                    case "data-revamp": return 4 + level;
                    case "short-track": {
                        let feats = 4 + level;
                        if (level >= 5) feats += 1;
                        if (level >= 10) feats += 1;
                        if (level >= 15) feats += 1;
                        if (level >= 20) feats += 1;
                        if (level == 25) feats += 3;
                        return feats;
                    }
                    case "ptr-update": {
                        let feats = 4 + Math.ceil(level / 2);
                        if (level >= 5) feats += 1;
                        if (level >= 15) feats += 1;
                        if (level >= 25) feats += 1;
                        if (level >= 45) feats += 1;
                        if (level == 50) feats += 2;
                        return feats;
                    };
                    case "long-track": return 4 + Math.ceil(level / 2);
                }
            })(Number(system.level.current)) + (system.modifiers.featPoints?.total ?? 0)
        }

        system.edges = {
            total: this.items.filter(x => x.type == "edge" && !x.system.free).length,
            max: ((level) => {
                switch (game.settings.get("ptu", "variant.trainerAdvancement")) {
                    case "original": {
                        let edges = 4 + Math.floor(level / 2);
                        if (level >= 2) edges += 1;
                        if (level >= 6) edges += 1;
                        if (level >= 12) edges += 1;
                        return edges;
                    }
                    case "data-revamp": {
                        let edges = 4 + level;
                        if (level >= 2) edges += 1;
                        if (level >= 6) edges += 1;
                        if (level >= 12) edges += 1;
                        return edges;
                    }
                    case "short-track": {
                        let edges = 4 + level;
                        if (level >= 2) edges += 1;
                        if (level >= 6) edges += 1;
                        if (level >= 10) edges += 1;
                        if (level >= 12) edges += 1;
                        if (level >= 15) edges += 1;
                        if (level >= 20) edges += 2;
                        if (level == 25) edges += 3;
                        return edges;
                    }
                    case "ptr-update": {
                        let edges = 4 + Math.floor(level / 2);
                        if (level >= 2) edges += 1;
                        if (level >= 8) edges += 1;
                        if (level >= 10) edges += 1;
                        if (level >= 16) edges += 1;
                        if (level >= 20) edges += 1;
                        if (level >= 35) edges += 2;
                        if (level == 50) edges += 3;
                        return edges;
                    };
                    case "long-track": {
                        let edges = 4 + Math.floor(level / 2);
                        if (level >= 10) edges += 1;
                        if (level >= 20) edges += 1;
                        return edges;
                    }
                }
            })(Number(system.level.current)) + (system.modifiers.edgePoints?.total ?? 0)
        }

        system.ap.bound = Number(this.synthetics.apAdjustments.bound.map(b => b.value).reduce((a, b) => a + b, 0)) || 0
        system.ap.drained = Number(this.synthetics.apAdjustments.drained.map(d => d.value).reduce((a, b) => a + b, 0)) || 0
        system.ap.max = this.baseMaxAp - system.ap.bound - system.ap.drained

        system.initiative = { value: system.stats.spd.total + system.modifiers.initiative.total };

        // Contests
        // This is to force the order of the stats to be the same as the order in the sheet
        system.contests.stats = {
            cool: system.contests.stats.cool,
            tough: system.contests.stats.tough,
            beauty: system.contests.stats.beauty,
            smart: system.contests.stats.smart,
            cute: system.contests.stats.cute
        }
        for (const stat of Object.keys(system.contests.stats)) {
            const combatStat = (() => {
                switch (stat) {
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

            system.contests.stats[stat].dice = system.contests.stats[stat].stats.total + system.contests.voltage.value;
        }

        system.contests.appeal.mod ??= 0;
        system.contests.appeal.total = system.contests.appeal.value + system.contests.appeal.mod;

        this.attributes.health.max = system.health.max;
    }

    get baseMaxAp() {
        return 5 + Math.floor(this.system.level.current / 5);
    }

    _calcBaseStats() {
        const stats = foundry.utils.duplicate(this.system.stats);

        for (const stat of Object.keys(stats)) {
            if (stat === "hp") stats[stat].base = 10;
            else stats[stat].base = 5;

            stats[stat].value = stats[stat].base + this.system.modifiers?.baseStats?.[stat]?.total ?? 0;
        }

        return stats;
    }

    /** @override */
    _setDefaultChanges() {
        super._setDefaultChanges();
        const changes = { system: {} };
        for (const value of Object.values(this.system.background.pathetic)) {
            if (value && value != "blank") {
                if (!changes["system"]["skills"]) changes["system"]["skills"] = {}
                if (!changes["system"]["skills"][value]) changes["system"]["skills"][value] = {}
                if (!changes["system"]["skills"][value]['value']) changes["system"]["skills"][value]['value'] = {}
                if (!changes["system"]["skills"][value]['value']['mod']) changes["system"]["skills"][value]['value']['mod'] = {}
                changes["system"]["skills"][value]['value']['mod'][foundry.utils.randomID()] = { mode: 'add', value: -1, source: "Pathetic Background Skills" };
            }
        }
        const { adept, novice } = this.system.background;
        if (adept && adept != "blank") {
            if (!changes["system"]["skills"]) changes["system"]["skills"] = {}
            if (!changes["system"]["skills"][adept]) changes["system"]["skills"][adept] = {}
            if (!changes["system"]["skills"][adept]['value']) changes["system"]["skills"][adept]['value'] = {}
            if (!changes["system"]["skills"][adept]['value']['mod']) changes["system"]["skills"][adept]['value']['mod'] = {}
            changes["system"]["skills"][adept]['value']['mod'][foundry.utils.randomID()] = { mode: 'add', value: 2, source: "Adept Background Skill" };
        }
        if (novice && novice != "blank") {
            if (!changes["system"]["skills"]) changes["system"]["skills"] = {}
            if (!changes["system"]["skills"][novice]) changes["system"]["skills"][novice] = {}
            if (!changes["system"]["skills"][novice]['value']) changes["system"]["skills"][novice]['value'] = {}
            if (!changes["system"]["skills"][novice]['value']['mod']) changes["system"]["skills"][novice]['value']['mod'] = {}
            changes["system"]["skills"][novice]['value']['mod'][foundry.utils.randomID()] = { mode: 'add', value: 1, source: "Novice Background Skill" };
        }
        changes.system.maxAp = {
            1: {
                source: "Level",
                mode: "add",
                value: this.baseMaxAp,
            }
        }
        let maxApIndex = 2
        this.synthetics.apAdjustments.bound.filter(b => Number(b.value)).forEach(b => {
            changes.system.maxAp[maxApIndex++] = {
                source: `${fromUuidSync(b.sourceUuid).name} (Bound)`,
                mode: "add",
                value: - b.value
            }
        })
        this.synthetics.apAdjustments.drained.filter(b => Number(b.value)).forEach(b => {
            changes.system.maxAp[maxApIndex++] = {
                source: `${fromUuidSync(b.sourceUuid).name} (Drained)`,
                mode: "add",
                value: - b.value
            }
        })
        this.system.changes = foundry.utils.mergeObject(
            this.system.changes,
            changes
        );
    }
}


export { PTUTrainerActor }