import { PTUItem } from '../index.js';
class PTUMove extends PTUItem {
    get rollable() {
        return !(isNaN(Number(this.system.ac ?? undefined)) && isNaN(Number(this.system.damageBase ?? undefined)));
    }

    /** @override */
    get realId() {
        return this.system.isStruggle ? `struggle-${this.system.type.toLocaleLowerCase(game.i18n.lang)}-${this.system.category.toLocaleLowerCase(game.i18n.lang)}` : super.realId;
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        
        this.flags.ptu = mergeObject(this.flags.ptu, {
            rollOptions: {
                all: {
                    [`move:type:${this.system.type.toLocaleLowerCase(game.i18n.lang)}`]: true,
                    [`move:category:${this.system.category.toLocaleLowerCase(game.i18n.lang)}`]: true,
                },
                item: {
                    [`move:type:${this.system.type.toLocaleLowerCase(game.i18n.lang)}`]: true,
                    [`move:category:${this.system.category.toLocaleLowerCase(game.i18n.lang)}`]: true,
                }
            }
        });
    }
}

export { PTUMove }