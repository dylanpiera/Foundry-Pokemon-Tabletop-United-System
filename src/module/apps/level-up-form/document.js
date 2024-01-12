import { getItemFromCompendium } from "../../../util/misc.js";
import { calculateStatTotal } from "../../actor/helpers.js";
import { PTUPokemonActor } from "../../actor/index.js"
import { PokemonGenerator } from "../../actor/pokemon/generator.js";

class LevelUpData {
    constructor(pokemon, { newExp, newLevel }) {
        if (!(pokemon instanceof PTUPokemonActor)) throw new Error("LevelUpData must be constructed with a PTUPokemonActor");

        this.pokemon = pokemon;
        this.newExp = newExp;
        this.newLevel = newLevel;

        this.evolution = undefined;

        this.stats = {}
        for (const [stat, value] of Object.entries(this.pokemon.system.stats)) {
            this.stats[stat] = {
                value: value.value,
                oldLevelUp: value.levelUp,
                oldTotal: value.total,
                newLevelUp: 0,
                stage: value.stage,
                mod: value.mod,
                baseMod: this.pokemon.system.modifiers?.baseStats?.[stat]?.total ?? 0,
                altered: ((value.stage?.value ?? 0) + (value.stage?.mod ?? 0)) !== 0 || ((value.mod.value ?? 0) + (value.mod.mod ?? 0)) !== 0
            }

            if (this.evolving) {
                this.stats[stat].newTotal = value.base;
            }
            else {
                this.stats[stat].newTotal = value.total;
            }
        }

        if (!this.pokemon.species) throw new Error("Pokemon must have a species to level up");

        this.#setMoves(this.pokemon.species);

        this.#setAbilities(this.pokemon.species);
    }

    #setAbilities(species) {
        const currentAbilities = this.pokemon.itemTypes.ability;

        this.abilities = {
            basic: [],
            advanced: [],
            high: [],
            current: {
                basic: currentAbilities.find(a => a.flags.ptu?.abilityChosen === "basic"),
                advanced: currentAbilities.find(a => a.flags.ptu?.abilityChosen === "advanced"),
                high: currentAbilities.find(a => a.flags.ptu?.abilityChosen === "high")
            },
            index: {
                basic: this.abilities?.index?.basic ?? -1,
                advanced: this.abilities?.index?.advanced ?? -1,
                high: this.abilities?.index?.high ?? -1
            },
            helpText: {
                advanced: this.level.current < 20 && this.newLevel >= 20 ? "select" : "locked",
                high: this.level.current < 40 && this.newLevel >= 40 ? "select" : "locked"
            },
            remove: []
        }

        for (const ability of species.system.abilities.basic) {

            if (this.abilities.current.basic && currentAbilities.some(a => a.slug === ability.slug)) {
                if (this.abilities.index.basic === -1)
                    this.abilities.index.basic = species.system.abilities.basic.findIndex(a => a.slug === ability.slug);
                continue;
            }
            // If the species is evolving, check if basic ability has been changed
            if (this.abilities.index.basic !== -1 && species.slug != this.pokemon.species.slug) {
                if (this.pokemon.species.system.abilities.basic[this.abilities.index.basic].slug === ability.slug) {
                    continue;
                }

                this.abilities.remove.push(this.abilities.current.basic);

                this.abilities.current.basic = ability;
                this.abilities.index.basic = species.system.abilities.basic.findIndex(a => a.slug === ability.slug);
                continue;
            }
            this.abilities.basic.push(ability);
        }

        if (this.level.current < 20 && this.newLevel >= 20) {
            for (const ability of species.system.abilities.advanced) {
                if (this.abilities.current.advanced && currentAbilities.some(a => a.slug === ability.slug)) {
                    if (this.abilities.index.advanced === -1)
                        this.abilities.index.advanced = species.system.abilities.advanced.findIndex(a => a.slug === ability.slug);
                    continue;
                }
                // If the species is evolving, check if advanced ability has been changed
                if (this.abilities.index.advanced !== -1 && species.slug != this.pokemon.species.slug) {
                    if (this.pokemon.species.system.abilities.advanced[this.abilities.index.advanced].slug === ability.slug) {
                        continue;
                    }

                    this.abilities.remove.push(this.abilities.current.advanced);

                    this.abilities.current.advanced = ability;
                    this.abilities.index.advanced = species.system.abilities.advanced.findIndex(a => a.slug === ability.slug);
                    continue;
                }
                this.abilities.advanced.push(ability);
            }
        }
        if (this.level.current < 40 && this.newLevel >= 40) {
            for (const ability of species.system.abilities.high) {
                if (this.abilities.current.high && currentAbilities.some(a => a.slug === ability.slug)) {
                    if (this.abilities.index.high === -1)
                        this.abilities.index.high = species.system.abilities.high.findIndex(a => a.slug === ability.slug);
                    continue;
                }
                // If the species is evolving, check if high ability has been changed
                if (this.abilities.index.high !== -1 && species.slug != this.pokemon.species.slug) {
                    if (this.pokemon.species.system.abilities.high[this.abilities.index.high].slug === ability.slug) {
                        continue;
                    }

                    this.abilities.remove.push(this.abilities.current.high);

                    this.abilities.current.high = ability;
                    this.abilities.index.high = species.system.abilities.high.findIndex(a => a.slug === ability.slug);
                    continue;
                }
                this.abilities.high.push(ability);
            }
        }

        if (this.abilities.current.basic) this.abilities.helpText.basic = "locked";
        if (this.abilities.current.advanced) this.abilities.helpText.advanced = "locked";
        if (this.abilities.current.high) this.abilities.helpText.high = "locked";

        if (this.abilities.helpText.basic === "locked" && this.abilities.helpText.advanced === "locked" && this.abilities.helpText.high === "locked") {
            this.abilities.basic = [];
            this.abilities.advanced = [];
            this.abilities.high = [];
        }
    }

    #setMoves(species) {
        const availableMoves = species.system.moves.level.filter(move => (move.level > this.level.current && move.level <= this.newLevel) || move.level == "Evo").map(move => ({
            uuid: move.uuid,
            slug: move.slug,
        }));
        const knownMoves = this.pokemon.moves.map(move => ({
            uuid: move.uuid,
            slug: move.slug,
        }));

        this.moves = {
            known: knownMoves,
            available: availableMoves.filter(m => !knownMoves.some(km => km.slug === m.slug)),
        }
    }

    get level() {
        return {
            current: this.pokemon.system.level.current,
            new: this.newLevel
        }
    }

    get ballStyle() {
        return this.pokemon._sheet.ballStyle;
    }

    async refresh() {
        if (!this.evolutions) {
            this.evolutions = {
                available: [],
                current: {
                    uuid: this.pokemon.species.uuid,
                    slug: this.pokemon.species.slug,
                    level: this.level.current
                },
            }

            for (let i = 0; i < this.pokemon.species.system.evolutions.length; i++) {
                const evolution = this.pokemon.species.system.evolutions[i];

                if (evolution.slug === this.pokemon.species.slug) {
                    this.evolutions.available.push({
                        uuid: evolution.uuid,
                        slug: evolution.slug,
                        level: evolution.level
                    });
                    continue;
                }

                if (evolution.other?.restrictions) {
                    if (PokemonGenerator.isEvolutionRestricted(evolution, this.pokemon.gender)) continue;
                }

                if (evolution.level <= this.level.new && this.pokemon.species.system.evolutions.findIndex(e => e.slug === (this.evolution?.slug ?? this.pokemon.species.slug)) < i) {
                    this.evolutions.available.push({
                        uuid: evolution.uuid,
                        slug: evolution.slug,
                        level: evolution.level
                    });
                }
            }

            if (this.evolutions.available.length > 0) {
                const lastStage = this.evolutions.available[this.evolutions.available.length - 1]
                const otherStages = this.evolutions.available.filter(e => e.level === lastStage.level);
                if (otherStages.length > 1) {
                    this.evolutions.current = otherStages[Math.floor(Math.random() * otherStages.length)];
                }
                else {
                    this.evolutions.current = lastStage;
                }
            }
        }

        if (this.evolution?.slug !== this.evolutions.current.slug) {
            this.evolution = await getItemFromCompendium({uuid: this.evolutions.current.uuid, type: "species", name: this.evolutions.current.slug});
            if (this.evolution) {
                this.evolutions.current.image = await PokemonGenerator.getImage(this.evolution, { gender: this.pokemon.system.gender, shiny: this.pokemon.system.shiny });

                this.#setMoves(this.evolution);

                this.#setAbilities(this.evolution);

                for (const key of Object.keys(this.stats)) {
                    this.stats[key].newLevelUp = 0;
                    this.stats[key].value = this.evolution.system.stats[key] + this.stats[key].baseMod;
                }
            }
            else console.warn("Could not find evolution", this.evolutions.current.uuid, this.evolutions.current.slug);
        }

        const leftoverLevelUpPoints = (10 + this.level.new + this.pokemon.system.modifiers.statPoints.total ?? 0) - Object.values(this.stats).reduce((a, v) => v.oldLevelUp + v.newLevelUp + a, 0);
        const actualLevel = Math.max(1, this.level.new - Math.max(0, Math.clamp(0, leftoverLevelUpPoints, leftoverLevelUpPoints - this.pokemon.system.modifiers.statPoints.total ?? 0)));

        const evolving = (this.evolution?.slug ?? this.pokemon.species.slug) !== this.pokemon.species.slug;
        const actualStats = Object.entries(this.stats).reduce((stats, [stat, value]) => {
            stats[stat] = {
                value: value.value,
                levelUp: evolving ? value.newLevelUp : value.newLevelUp + value.oldLevelUp,
                stage: value.stage,
                mod: value.mod
            }
            return stats;
        }, {});

        const results = calculateStatTotal({
            level: actualLevel,
            actorStats: actualStats,
            nature: this.pokemon.nature,
            isTrainer: false,
            twistedPower: this.pokemon.rollOptions.all["self:ability:twisted-power"]
        });

        //calculate final stats
        for (const stat of Object.keys(this.stats)) {
            this.stats[stat].newTotal = results.stats[stat].total;
        }

        //calculate remaining level up points
        this.levelUpPoints = (10 + this.level.new + this.pokemon.system.modifiers.statPoints.total ?? 0) - results.pointsSpend;
    }

    async finalize() {
        const movesToAdd = [], movesToRemove = [];
        for (const move of this.moves.available) {
            if (move.uuid.startsWith("Actor")) {
                movesToRemove.push((await fromUuid(move.uuid)).toObject());
            }
        }
        for (const move of this.moves.known) {
            if (!move.uuid.startsWith("Actor")) {
                movesToAdd.push((await fromUuid(move.uuid)).toObject());
            }
        }

        const abilities = [];
        for (const [tier, ability] of Object.entries(this.abilities.current)) {
            if (!ability) continue;
            abilities.push({
                uuid: ability.uuid,
                slug: ability.slug,
                tier: tier
            });
        }

        return {
            changed: {
                system: {
                    stats: {
                        ...Object.entries(this.stats).reduce((stats, [stat, value]) => {
                            stats[stat] = {
                                levelUp: (this.evolution?.slug ?? this.pokemon.species.slug) !== this.pokemon.species.slug ? value.newLevelUp : value.newLevelUp + value.oldLevelUp,
                            }
                            return stats;
                        }, {})
                    }
                }
            },
            moves: {
                add: movesToAdd,
                remove: movesToRemove
            },
            abilities: {
                add: abilities,
                remove: this.abilities.remove.map(a => a.toObject?.()).filter(a => a)
            },
            evolution: this.evolution
        };
    }
}

export { LevelUpData }