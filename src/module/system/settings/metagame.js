import { PTUSettingsMenu } from "./base.js";

const MetagameSettingsConfig = {
    "dexPermissions": {
        name: "PTU.Settings.Metagame.DexPermissions.Name",
        hint: "PTU.Settings.Metagame.DexPermissions.Hint",
        type: Number,
        choices: {
            1: "Disable Pokédex",
            2: "Dexentry description only (Basic description and details only)",
            3: "Full details on owned Tokens",
            4: "Full details on owned Mons (checks trainer's dex tab)",
            5: "GM Prompt",
            6: "Always Full Details",
        },
        default: 1
    },
    "alwaysShowCrits": {
        name: "PTU.Settings.Metagame.AlwaysShowCrits.Name",
        hint: "PTU.Settings.Metagame.AlwaysShowCrits.Hint",
        type: Boolean,
        default: false
    },
    "allowPlayersToEditSpecies": {
        name: "PTU.Settings.Metagame.AllowPlayersToEditSpecies.Name",
        hint: "PTU.Settings.Metagame.AllowPlayersToEditSpecies.Hint",
        type: Boolean,
        default: true
    }
}

export class MetagameSettings extends PTUSettingsMenu {
    static namespace = "metagame";

    static get settings() {
        return MetagameSettingsConfig;
    }

    static get SETTINGS() {
        return Object.keys(MetagameSettingsConfig);
    }
}