import { sluggify } from "../../../util/misc.js";
import { MigrationBase } from "../base.js";

export class Migration115RulesAutomation extends MigrationBase {
    static version = 0.115;
    requiresFlush = true;

    static once = game.settings.get("ptu","worldSchemaVersion") >= Migration115RulesAutomation.version;

    /**
     * @type {MigrationBase['updateItem']} 
     */
    async updateItem(item, actor) {
        if(item.type !== "move") return;
        const moves = this.moves ??= await game.packs.get("ptu.moves").getDocuments();
        const slug = item.system.slug || sluggify(item.name);

        const move = (() => {
            // Try to look up by source ID
            const sourceId = item.flags?.core?.sourceId;
            if(sourceId) {
                const idPart = sourceId.split(".").at(-1);
                const move = moves.find(move => move.id === idPart);
                if(move) return move;
            }

            // Try to look up by slug
            return moves.find(move => move.slug === slug);
        })();
        if(!move) return;

        if(move.system.referenceEffect && !item.system.referenceEffect) {
            item.system.referenceEffect = move.system.referenceEffect;
        }

        if(move.system.rules?.length == 0) return;

        const oldRules = item.system.rules ?? [];
        const newRules = [];
        for(const rule of move.system.rules) {
            const anyMatch = oldRules.some(oldRule => foundry.utils.objectsEqual(oldRule, rule));
            if(anyMatch) continue;

            newRules.push(rule);
        }

        item.system.rules = oldRules.concat(newRules);

        if(!Migration115RulesAutomation.once) {
          Migration115RulesAutomation.once = true;
            await ChatMessage.create({
                speaker: { alias: "System" },
                content: "<h1>Move Rules Automation Updated!</h1><p>All moves have been updated to include newly created rules automation.</p><p>If you had manually created rules automation before, they have been added in addition, therefore you may now find duplicate automation on your moves.</p><p>Please double check this in case you added custom automation to core moves!</p>"
            })
        }
    }
}