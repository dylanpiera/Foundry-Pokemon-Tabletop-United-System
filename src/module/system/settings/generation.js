import { PTUSettingsMenu } from "./base.js";

const GenerationSettingsConfig = {
    "defaultImageDirectory": {
        name: "PTU.Settings.Generation.DefaultImageDirectory.Name",
        hint: "PTU.Settings.Generation.DefaultImageDirectory.Hint",
        type: String,
        filePicker: true,
        default: "systems/ptu/static/images/sprites/"
    },
    "defaultImageExtension": {
        name: "PTU.Settings.Generation.DefaultImageExtension.Name",
        hint: "PTU.Settings.Generation.DefaultImageExtension.Hint",
        type: String,
        default: ".webp"
    },
    "defaultPokemonImageNameType": {
        name: "PTU.Settings.Generation.DefaultPokemonImageNameType.Name",
        hint: "PTU.Settings.Generation.DefaultPokemonImageNameType.Hint",
        type: Boolean,
        default: false
    },
    "defaultDexDragInLevelMin": {
        name: "PTU.Settings.Generation.DefaultDexDragInLevelMin.Name",
        hint: "PTU.Settings.Generation.DefaultDexDragInLevelMin.Hint",
        type: Number,
        default: 10
    },
    "defaultDexDragInLevelMax": {
        name: "PTU.Settings.Generation.DefaultDexDragInLevelMax.Name",
        hint: "PTU.Settings.Generation.DefaultDexDragInLevelMax.Hint",
        type: Number,
        default: 10,
    },
    "defaultDexDragInShinyChance": {
        name: "PTU.Settings.Generation.DefaultDexDragInShinyChance.Name",
        hint: "PTU.Settings.Generation.DefaultDexDragInShinyChance.Hint",
        type: Number,
        default: 2
    },
    "defaultDexDragInStatRandomness": {
        name: "PTU.Settings.Generation.DefaultDexDragInStatRandomness.Name",
        hint: "PTU.Settings.Generation.DefaultDexDragInStatRandomness.Hint",
        type: Number,
        default: 20
    },
    "defaultDexDragInPreventEvolution": {
        name: "PTU.Settings.Generation.DefaultDexDragInPreventEvolution.Name",
        hint: "PTU.Settings.Generation.DefaultDexDragInPreventEvolution.Hint",
        type: Boolean,
        default: false
    }
}

export class GenerationSettings extends PTUSettingsMenu {
    static namespace = "generation";

    static get settings() {
        return GenerationSettingsConfig;
    }

    static get SETTINGS() {
        return Object.keys(GenerationSettingsConfig);
    }
}