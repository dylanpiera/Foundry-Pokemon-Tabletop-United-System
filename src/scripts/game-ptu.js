import { PokemonGenerator } from "../module/actor/pokemon/generator.js"
import { CompendiumBrowser } from "../module/apps/compendium-browser/index.js"
import { MigrationSummary } from "../module/apps/migration-summary.js"
import { TokenPanel } from "../module/apps/token-panel.js"
import { StatusEffects } from "../module/canvas/status-effect.js"
import { MigrationList } from "../module/migration/index.js"
import { MigrationRunner } from "../module/migration/runner/index.js"
import { EffectTracker } from "../module/system/effect-tracker.js"
import { getSpeciesData } from "../module/system/index.js"
import { findItemInCompendium, querySpeciesCompendium } from "../util/misc.js"
import { resolveInjectedProperties, resolveValue } from "../util/value-resolver.js"
import { dexSync } from "./macros/dex-sync.js"
import { pokedex } from "./macros/pokedex.js"
import { changeRotomForm } from "./macros/rotom-form-change.js"

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
            },
            macros: {
                changeRotomForm,
                pokedex,
                dexSync
            },
            tokenPanel: new TokenPanel()
        }

        game.ptu = mergeObject(game.ptu ?? {}, initData)

        CONFIG.PTU.data.typeEffectiveness = game.settings.get("ptu", "type.typeEffectiveness") ?? CONFIG.PTU.data.typeEffectiveness;
    },
    onSetup() { },
    onReady() {
        game.ptu.compendiumBrowser = new CompendiumBrowser();

        // Reset pokemon that have reloadOnReady marked as true
        // This is due to having a temporary species override
        game.actors.filter(a => a.type === "pokemon" && a.reloadOnReady).forEach(a => a.reset())
    }
}

export { GamePTU }