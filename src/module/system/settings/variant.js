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
        default: false,
        requiresReload: true
    },
    "trainerRevamp": {
        name: "PTU.Settings.Variant.TrainerRevamp.Name",
        hint: "PTU.Settings.Variant.TrainerRevamp.Hint",
        type: Boolean,
        default: false
    },
    "spiritPlaytest": {
        name: "PTU.Settings.Variant.SpiritPlaytest.Name",
        hint: "PTU.Settings.Variant.SpiritPlaytest.Hint",
        type: Boolean,
        default: false,
        requiresReload: true
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

    /** @override */
    async _updateObject(event, data) {
        await super._updateObject(event, data);

        if(game.settings.get("ptu", "variant.trainerRevamp") && game.settings.get("ptu", "variant.useDexExp")) {
            return game.settings.set("ptu", "variant.useDexExp", false);
        }
    }
}