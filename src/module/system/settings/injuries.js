import { PTUSettingsMenu } from "./base.js";

/*

    //TODO wording
    game.settings.register("ptu", "injuries.massiveDamageThresholdRollFormula", {
        scope: "world",
        config: true,
        default: "1/2",
        type: String,
    });

    //TODO wording
    game.settings.register("ptu", "injuries.hpInjuryGateIntervalRollFormula", {
        scope: "world",
        config: true,
        default: "1/2",
        type: String,
    });

    <div class="form-group">
                <label for="massiveDamageThresholdRollFormula">PTU.Settings.Injuries.MassiveDamageThreshold.Name</label>
                <div class="form-fields">
                        <input type="text" name="massiveDamageThresholdRollFormula" value="1/2">
                                    </div>
                <p class="notes">PTU.Settings.Injuries.MassiveDamageThreshold.Hint</p>
            </div>

 */

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
    // "useTutorPoints": {
    //     name: "PTU.Settings.Variant.UseTutorPoints.Name",
    //     hint: "PTU.Settings.Variant.UseTutorPoints.Hint",
    //     type: Boolean,
    //     default: true
    // },
    // "useDexExp": {
    //     name: "PTU.Settings.Variant.UseDexExp.Name",
    //     hint: "PTU.Settings.Variant.UseDexExp.Hint",
    //     type: Boolean,
    //     default: false,
    //     requiresReload: true
    // },
    // "trainerRevamp": {
    //     name: "PTU.Settings.Variant.TrainerRevamp.Name",
    //     hint: "PTU.Settings.Variant.TrainerRevamp.Hint",
    //     type: Boolean,
    //     default: false
    // },
    // "spiritPlaytest": {
    //     name: "PTU.Settings.Variant.SpiritPlaytest.Name",
    //     hint: "PTU.Settings.Variant.SpiritPlaytest.Hint",
    //     type: Boolean,
    //     default: false,
    //     requiresReload: true
    // },
    // "improvedStatsRework": {
    //     name: "PTU.Settings.Variant.ImprovedStatsRework.Name",
    //     hint: "PTU.Settings.Variant.ImprovedStatsRework.Hint",
    //     type: Boolean,
    //     default: true,
    //     requiresReload: true
    // }
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
        console.log("Tinka log 485")
        // $html.find("input[name='massiveDamageThresholdRollFormula']").on("input", event => {
        //     const val = event.target.value
        //     if (!this._isTextValidRollFormula(val)) event.target.style.backgroundColor = "#ff9999";
        //     else event.target.style.backgroundColor = "#ffffff00"
        // });
        // $html.find("input[name='hpInjuryGateIntervalRollFormula']").on("input", event => {
        //     const val = event.target.value
        //     if (!this._isTextValidRollFormula(val)) event.target.style.backgroundColor = "#ff9999";
        //     else event.target.style.backgroundColor = "#ffffff00"
        // });
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
                ui.notifications.error("At least one field is not properly set.")
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