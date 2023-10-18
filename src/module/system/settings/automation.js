import { PTUSettingsMenu } from "./base.js";

const AutomationSettingsConfig = {
    "dexPermissions": {
        name: "PTU.Settings.Automation.DexPermissions.Name",
        hint: "PTU.Settings.Automation.DexPermissions.Hint",
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
    "levelUpScreen": {
        name: "PTU.Settings.Automation.LevelUpScreen.Name",
        hint: "PTU.Settings.Automation.LevelUpScreen.Hint",
        type: Boolean,
        default: true
    },
    "removeExpiredEffects": {
        name: "PTU.Settings.Automation.RemoveExpiredEffects.Name",
        hint: "PTU.Settings.Automation.RemoveExpiredEffects.Hint",
        type: Boolean,
        default: false
    },
    "autoExpireEffects": {
        name: "PTU.Settings.Automation.AutoExpireEffects.Name",
        hint: "PTU.Settings.Automation.AutoExpireEffects.Hint",
        type: Boolean,
        default: true
    },
    "failAttackIfOutOfRange": {
        name: "PTU.Settings.Automation.FailAttackIfOutOfRange.Name",
        hint: "PTU.Settings.Automation.FailAttackIfOutOfRange.Hint",
        type: Boolean,
        default: true
    },
    "failAttackIfNoTarget": {
        name: "PTU.Settings.Automation.FailAttackIfNoTarget.Name",
        hint: "PTU.Settings.Automation.FailAttackIfNoTarget.Hint",
        type: Boolean,
        default: false
    },
    "flankingDetection": {
        name: "PTU.Settings.Automation.FlankingDetection.Name",
        hint: "PTU.Settings.Automation.FlankingDetection.Hint",
        type: Boolean,
        default: true
    },
    "autoFaint": {
        name: "PTU.Settings.Automation.AutoFaint.Name",
        hint: "PTU.Settings.Automation.AutoFaint.Hint",
        type: Boolean,
        default: true
    },
    "autoFaintRecovery": {
        name: "PTU.Settings.Automation.AutoFaintRecovery.Name",
        hint: "PTU.Settings.Automation.AutoFaintRecovery.Hint",
        type: Boolean,
        default: true
    }
}

export class AutomationSettings extends PTUSettingsMenu {
    static namespace = "automation";

    static get settings() {
        return AutomationSettingsConfig;
    }

    static get SETTINGS() {
        return Object.keys(AutomationSettingsConfig);
    }
}