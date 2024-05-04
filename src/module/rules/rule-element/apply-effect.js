import { sluggify } from "../../../util/misc.js";
import { PTUModifier } from "../../actor/modifiers.js";
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

                const grantedItem = await (async () => {
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

                const effectRange = (() => {
                    const modifiers = [
                        new PTUModifier({
                            slug: "effect-range",
                            label: "Effect Range",
                            modifier: this.actor?.system?.modifiers?.effectRange?.total ?? 0,
                        })
                    ]
                    if (this.actor?.synthetics) {
                        modifiers.push(
                            ...extractModifiers(this.actor?.synthetics, [
                                "effect-range",
                                this.item?.id ? `${this.item.id}-effect-range` : [],
                                this.item?.slug ? `${this.item.slug}-effect-range` : [],
                                this.item?.system?.category ? `${sluggify(this.item.system.category)}-effect-range` : [],
                                this.item?.system?.type ? `${sluggify(this.item.system.type)}-effect-range` : [],
                                this.item?.system?.frequency ? `${sluggify(this.item.system.frequency)}-effect-range` : [],
                            ].flat(), { test: options.test ?? this.actor.getRollOptions() })
                        )
                    }

                    return Number(Object.values(
                        modifiers.reduce((acc, mod) => {
                            if (!mod.ignored && !acc[mod.slug]) acc[mod.slug] = mod.modifier;
                            return acc;
                        }, {})
                    ).reduce((acc, mod) => acc + mod, 0)) || 0;
                })();

                if (this.range && (Number(options.roll) + effectRange) < Number(this.range)) {
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