import { PTUSettingsMenu } from "./base.js";

const MetagameSettingsConfig = {
    "alwaysShowCrits": {
        name: "PTU.Settings.Metagame.AlwaysShowCrits.Name",
        hint: "PTU.Settings.Metagame.AlwaysShowCrits.Hint",
        type: Boolean,
        default: false
    },
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