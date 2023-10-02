import { isItemUUID } from "../../../util/misc.js";
import { RuleElementPTU } from "./base.js";

class EphemeralEffectRuleElement extends RuleElementPTU {
    static defineSchema() {
        const { fields } = foundry.data;
        return {
            ...super.defineSchema(),
            affects: new fields.StringField({ required: true, choices: ["target", "origin"], initial: "target" }),
            selectors: new fields.ArrayField(
                new fields.StringField({ required: true, blank: false, nullable: false, initial: undefined })
            ),
            uuid: new fields.StringField({ required: true, blank: false, nullable: false, initial: undefined }),
            adjustName: new fields.BooleanField({ required: true, nullable: false, initial: true }),
        };
    }

    afterPrepareData() {
        for (const selector of this.resolveInjectedProperties(this.selectors)) {
            const deferredEffect = this.#createDeferredEffect();
            const synthetics = (this.actor.synthetics.ephemeralEffects[selector] ??= { target: [], origin: [] });
            synthetics[this.affects].push(deferredEffect);
        }
    }

    #createDeferredEffect() {
        return async (params = {}) => {
            if (!this.test(params.test ?? this.actor.getRollOptions())) {
                return null;
            }

            if(this.selectors.length === 0) {
                this.failValidation("must have at least one selector");
                return null;
            }

            const uuid = this.resolveInjectedProperties(this.uuid);

            if (!isItemUUID(uuid)) {
                this.failValidation(`"${uuid}" does not look like a UUID`);
                return null;
            }
            const effect = (await fromUuid(uuid));
            if (!(effect instanceof BaseEffectPTU && ["condition", "effect"].includes(effect.type))) {
                this.failValidation(`unable to find effect or condition item with uuid "${uuid}"`);
                return null;
            }

            const source = effect.toObject();

            // An ephemeral effect will be added to a contextual clone's item source array and cannot include any
            // asynchronous rule elements
            const hasForbiddenREs = source.system.rules.some(
                (r) => typeof r.key === "string" && ["ChoiceSet", "GrantItem"].includes(r.key)
            );
            if (hasForbiddenREs) {
                this.failValidation("an ephemeral effect may not include a choice set or grant");
            }

            if (this.adjustName) {
                source.name = `${source.name} (${this.label ?? this.item.name})`;
            }

            return source;
        };
    }
}

export { EphemeralEffectRuleElement }