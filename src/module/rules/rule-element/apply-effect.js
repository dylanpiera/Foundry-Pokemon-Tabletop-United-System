import { ResolvableValueField } from "../../system/schema-data-fields.js";
import { RuleElementPTU } from "./base.js";

class ApplyEffectRuleElement extends RuleElementPTU {
    constructor(source, item, options) {
        super(source, item, options);
    }

    /** @override */
    static defineSchema() {
        const { fields } = foundry.data;

        return {
            ...super.defineSchema(),
            uuid: new foundry.data.fields.StringField({ required: true, nullable: false, blank: false, initial: undefined }),
            affects: new fields.StringField({ required: true, choices: ["target", "origin"], initial: "target" }),
            selectors: new fields.ArrayField(
                new fields.StringField({ required: true, blank: false, initial: undefined }),
            ),
            range: new ResolvableValueField({ required: false, nullable: false, initial: undefined }),
            even: new fields.BooleanField({ required: false, nullable: false, initial: false }),
        };
    }

    /** @override */
    beforePrepareData() {
        if (this.ignored) return;

        const uuid = this.resolveInjectedProperties(this.uuid);

        const selectors = this.selectors.map(s => this.resolveInjectedProperties(s)).filter(s => !!s);
        if (selectors.length === 0) {
            return this.failValidation("must have at least one selector");
        }

        for (const selector of selectors) {
            const construct = async (options = {}) => {
                if (!this.test(options.test ?? this.actor.getRollOptions())) {
                    return null;
                }

                const grantedItem = await(async () => {
                    try {
                        return (await fromUuid(uuid))?.clone(this.overwrites ?? {}) ?? null;
                    }
                    catch (error) {
                        console.error(error);
                        return null;
                    }
                })();
                if (!(grantedItem instanceof CONFIG.PTU.Item.documentClass)) return null;

                if (this.even && Number(options.roll) % 2 !== 0) {
                    return null;
                }

                if (this.range && (Number(options.roll) + (this.actor?.system?.modifiers?.effectRange?.total ?? 0)) < Number(this.range)) {
                    return null;
                }

                const itemObject = grantedItem.toObject();
                itemObject.system.effect ??= "";
                itemObject.system.effect += `<blockquote>Applied by ${this.label ?? this.item.name} from ${this.actor.name}</blockquote>`;

                return itemObject;
            }

            const synthetics = ((this.actor.synthetics.applyEffects[selector] ??= { target: [], origin: [] }));
            synthetics[this.affects].push(construct);
        }
    }
}

export { ApplyEffectRuleElement }