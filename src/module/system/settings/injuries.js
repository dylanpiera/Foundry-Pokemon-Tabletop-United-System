import { PTUSettingsMenu } from "./base.js";

const InjuriesSettingsConfig = {
    "massiveDamageThresholdRollFormula":{
        name: "PTU.Settings.Injuries.MassiveDamageThreshold.Name",
        hint: "PTU.Settings.Injuries.MassiveDamageThreshold.Hint",
        scope: "world",
        config: true,
        default: "1/2",
        type: String,
    },
    "hpInjuryGateIntervalRollFormula":{
        name: "PTU.Settings.Injuries.HpInjuryGateInterval.Name",
        hint: "PTU.Settings.Injuries.HpInjuryGateInterval.Hint",
        scope: "world",
        config: true,
        default: "1/2",
        type: String,
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


    activateListeners($html) {
        super.activateListeners($html);
        $html.find("button[type='submit']").on("click", event => {
            let valid = true
            for(const fieldName of ["massiveDamageThresholdRollFormula","hpInjuryGateIntervalRollFormula"]){
                const findResults = $html.find(`input[name='${fieldName}']`)
                if(findResults.length !== 1) {
                    console.warn(`Can not find Input Field for ${fieldName}`, findResults);
                    continue;
                }
                const rollFormulaInput = findResults[0]
                if(!this._isValidInjuryThresholdFormula(rollFormulaInput.value)){
                    valid = false
                    break;
                }
            }
            if(!valid){
                event.preventDefault();
                ui.notifications.error("PTU.Settings.Injuries.InvalidInput", {localize: true})
            }
        });
    }

    _isValidInjuryThresholdFormula(rollFormula){
        try{
            const evaled = Roll.safeEval(rollFormula)
            return Number.isNumeric(evaled) && evaled !== 0
        }catch(err){
            return false
        }
    }
}