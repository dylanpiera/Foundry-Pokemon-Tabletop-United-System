import { MigrationBase } from "../base.js";

export class Migration107ActiveEffectsToEffectItem extends MigrationBase {
    static version = 0.107;
    requiresFlush = true;

    static CHANGE_MODES = {
        1: 'multiply',
        2: 'add',
        3: 'downgrade',
        4: 'upgrade',
        5: 'override',
    };

    /**
     * @type {MigrationBase['updateActor']}
     */
    async updateActor(actor) {
        const effects = actor.effects;
        if(!effects?.length) return;

        const applicableEffects = effects.filter(e => !/(R(\d+)([\s-]+)T(\d+))/gm.test(e.name));
        if(!applicableEffects.length) return actor.effects = [];

        const newEffects = [];
        for(const effect of applicableEffects) {
            const itemData = {
                type: 'effect',
                name: effect.name ?? "New Effect",
                img: "/systems/ptu/static/css/images/icons/effect_icon.png",
                system: {
                    rules: effect.changes.map((change) => {
                        if(change.mode === 0 || change.mode < 0 || change.mode > 5) return null;
                        return {
                            key: "ActiveEffectLike",
                            path: change.key.replaceAll("data.data", "system"),
                            mode: Migration107ActiveEffectsToEffectItem.CHANGE_MODES[change.mode],
                            priority: isNaN(Number(change.priority)) ? 0 : Number(change.priority),
                            value: isNaN(Number(change.value)) ? change.value : Number(change.value),
                        };
                    }).filter(c => !!c).flat()
                }
            }
            const item = await Item.create(itemData, {temporary: true});
            newEffects.push(item);
        }
        actor.items.push(...newEffects);
    }
}