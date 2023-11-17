import { PTUSettingsMenu } from "./base.js";

const HomebrewSettingsConfig = {
    "nuclearType": {
        name: "PTU.Settings.Homebrew.NuclearType.Name",
        hint: "PTU.Settings.Homebrew.NuclearType.Hint",
        type: Boolean,
        default: false,
        requiresReload: true
    },
    "shadowType": {
        name: "PTU.Settings.Homebrew.ShadowType.Name",
        hint: "PTU.Settings.Homebrew.ShadowType.Hint",
        type: Boolean,
        default: false,
        requiresReload: true
    }
}

export class HomebrewSettings extends PTUSettingsMenu {
    static namespace = "homebrew";

    static get settings() {
        return HomebrewSettingsConfig;
    }

    static get SETTINGS() {
        return Object.keys(HomebrewSettingsConfig);
    }
}