import { sluggify } from "../../../util/misc.js";
import { MigrationBase } from "../base.js";

export class Migration114Hardened extends MigrationBase {
    static version = 0.114;

    /**
     * @type {MigrationBase['updateItem']} 
     */
    async updateItem(item, actor) {
        const rules = item.system.rules;
        if(!rules) return;

        const rule = rules.find(rule => rule.path === "system.modifiers.resistanceSteps.mod");
        if(!rule) return;

        if(rule.value === 0.5) rule.value = 1;
    }
}