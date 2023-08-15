import { PokemonGenerator } from "../module/actor/pokemon/generator.js"
import { MigrationSummary } from "../module/apps/migration-summary.js"
import { StatusEffects } from "../module/canvas/status-effect.js"
import { MigrationList } from "../module/migration/index.js"
import { MigrationRunner } from "../module/migration/runner/index.js"
import { EffectTracker } from "../module/system/effect-tracker.js"
import { getSpeciesData } from "../module/system/index.js"
import { findItemInCompendium, querySpeciesCompendium } from "../util/misc.js"
import { resolveInjectedProperties, resolveValue } from "../util/value-resolver.js"

const GamePTU = {
    onInit() {
        const initData = {
            species: {
                get: getSpeciesData,
                query: querySpeciesCompendium,
                generator: PokemonGenerator
            },
            item: {
                get: (name, type) => findItemInCompendium({ type, name }),
            },
            StatusEffects,
            forms: {
                massGenerator: undefined
            },
            effectTracker: new EffectTracker(),
            resolver: {
                resolveInjectedProperties,
                resolveValue
            },
            migration: {
                MigrationList,
                MigrationRunner,
                MigrationSummary
            }
        }

        game.ptu = mergeObject(game.ptu ?? {}, initData)
    },
    onSetup() { },
    onReady() {
    }
}

export { GamePTU }