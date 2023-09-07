import { PTUSettingsMenu } from "./base.js";

const VariantSettingsConfig = {
    "useTutorPoints": {
        name: "PTU.Settings.Variant.UseTutorPoints.Name",
        hint: "PTU.Settings.Variant.UseTutorPoints.Hint",
        type: Boolean,
        default: true
    },
    "useDexExp": {
        name: "PTU.Settings.Variant.UseDexExp.Name",
        hint: "PTU.Settings.Variant.UseDexExp.Hint",
        type: Boolean,
        default: false
    }
}

export class VariantSettings extends PTUSettingsMenu {
    static namespace = "variant";

    static get settings() {
        return VariantSettingsConfig;
    }

    static get SETTINGS() {
        return Object.keys(VariantSettingsConfig);
    }
}