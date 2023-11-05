import { PTUSettingsMenu } from "./base.js";

const InjuriesSettingsConfig = {
    "massiveDamageThresholdPercent":{
        name: "PTU.Settings.Injuries.MassiveDamageThreshold.Name",
        hint: "PTU.Settings.Injuries.MassiveDamageThreshold.Hint",
        scope: "world",
        config: true,
        default: 50,
        type: Number,
    },
    "hpInjuryGateIntervalPercent":{
        name: "PTU.Settings.Injuries.HpInjuryGateInterval.Name",
        hint: "PTU.Settings.Injuries.HpInjuryGateInterval.Hint",
        scope: "world",
        config: true,
        default: 50,
        type: Number,
    }
}

export class InjuriesSettings extends PTUSettingsMenu {
    static namespace = "injuries";

    static get settings() {
        return InjuriesSettingsConfig;
    }

    static get SETTINGS() {
        return Object.keys(InjuriesSettingsConfig);
    }

    /** @override */
    async _updateObject(event, data) {
        await super._updateObject(event, data);
    }

}