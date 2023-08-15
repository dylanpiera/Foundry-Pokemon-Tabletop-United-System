import { sluggify } from "../../util/misc.js";
import { PTUPredicate } from "../system/predication.js";

class PTUModifier {
    #originalValue;

    constructor({ label, slug, modifier, type, category, adjustments, enabled, ignored, source, predicate, hideIfDisabled, item } = {}) {
        this.label = game.i18n.localize(label);
        this.slug = sluggify(slug ?? label);
        
        this.#originalValue = this.modifier = modifier ?? 0;

        this.type = type ?? "Untyped"
        this.category = category ?? "Physical";

        this.adjustments = deepClone(adjustments ?? []);
        this.enabled = enabled ?? true;
        this.ignored = ignored ?? false;
        this.source = source ?? null;
        this.predicate = new PTUPredicate(predicate ?? []);
        this.hideIfDisabled = hideIfDisabled ?? false;

        this.item = item ?? null;

        Object.defineProperty(this, "item", { enumerable: false });

        this.kind = (() => {
            if(this.modifier >= 0) return "bonus";
            if(this.modifier < 0) return "penalty";
            return "modifier";
        })();
    }

    get value() {
        return this.modifier;
    }

    get signedValue() {
        return this.modifier.signedString();
    }

    clone(options = {}) {
        const clone = 
            this.modifier === this.#originalValue
                ? new PTUModifier(this)
                : new PTUModifier({ ...this, modifier: this.#originalValue});
        
        if(options.test) clone.test(options.test);

        return clone;
    }

    getRollOptions() {
        const options = (["slug", "type", "category", "value"]).map((key) => `${this.kind}:${key}:${this[key]}`);

        if(this.item) {
            options.push(`${this.kind}:item:type:${this.item.type}`);
            options.push(`${this.kind}:item:slug:${this.item.slug}`);

            const grantingItem = this.item.grantedBy;
            if(grantingItem) {
                options.push(`${this.kind}:item:granter:type:${grantingItem.type}`);
                options.push(`${this.kind}:item:granter:slug:${grantingItem.slug}`);
            }
        }

        return new Set(options);
    }

    test(rollOptions) {
        this.ignored = !this.predicate.test(rollOptions);
        this.enabled = !this.ignored;
    }

    toObject() {
        return duplicate({...this, item: undefined});
    }

    toString() {
        return this.label;
    }
}

class StatisticModifier {
    /**
     * @param slug The name of this collection of statistic modifiers.
     * @param modifiers All relevant modifiers for this statistic.
     * @param rollOptions Roll options used for initial total calculation
     */
    constructor(slug, modifiers, rollOptions) {
        rollOptions = rollOptions instanceof Set ? rollOptions : new Set(rollOptions);
        this.slug = sluggify(slug);

        const seen = [];
        for (const modifier of modifiers) {
            const found = seen.some(m => m.slug === modifier.slug);
            if(!found) seen.push(modifier);
        }
        this._modifiers = seen;

        this.calculateTotal(rollOptions);
    }

    get modifiers() {
        return [...this._modifiers]
    }

    push(modifier) {
        if(this._modifiers.find(m => m.slug === modifier.slug) === undefined) {
            this._modifiers.push(modifier);
            this.calculateTotal();
        }
        return this._modifiers.length;
    }

    unshift(modifier) {
        if(this._modifiers.find(m => m.slug === modifier.slug) === undefined) {
            this._modifiers.unshift(modifier);
            this.calculateTotal();
        }
        return this._modifiers.length;
    }

    delete(modifierOrSlug) {
        const toDelete = 
            typeof modifierOrSlug === "object"
                ? modifierOrSlug
                : this._modifiers.find(m => m.slug === modifierOrSlug);
        const wasDeleted =
            toDelete && this._modifiers.includes(toDelete)
                ? !!this._modifiers.findSplice((m) => m === toDelete)
                : false;
        if(wasDeleted) this.calculateTotal();

        return wasDeleted;
    } 

    calculateTotal(rollOptions = new Set()) {
        if(rollOptions.size > 0) {
            for(const modifier of this._modifiers) {
                modifier.test(rollOptions);
                if(modifier.ignored) modifier.enabled = false;
            }

            adjustModifiers(this._modifiers, rollOptions);
        }

        this.totalModifier = this._modifiers.filter(m => m.enabled).reduce((total, m) => total + m.modifier, 0);
    }
}

class CheckModifier extends StatisticModifier {
    constructor(slug, statistic, modifiers, rollOptions) {
        super(slug, statistic.modifiers.map(m => m.clone()).concat(modifiers), rollOptions);
    }
}

function adjustModifiers(modifiers, rollOptions) {
    for(const modifier of [...modifiers].sort((a, b) => Math.abs(b.value) - Math.abs(a.value))) {
        const adjustments = modifier.adjustments.filter(a => a.predicate.test([...rollOptions, ...modifier.getRollOptions()]));

        if(adjustments.some((a) => a.suppress)) {
            modifier.ignored = true;
            continue;
        }

        const resolvedAdjustment = adjustments.reduce(
            (resolved, adjustment) => {
                const newValue = adjustment.getNewValue?.(resolved.value) ?? resolved.value;
                if(newValue !== resolved.value) {
                    resolved.value = newValue;
                    resolved.relabel = adjustment.relabel ?? null;
                }
                return resolved;
            },
            { value: modifier.modifier, relabel: null}
        );

        modifier.modifier = resolvedAdjustment.value;

        if(resolvedAdjustment.relabel) {
            modifier.label = game.i18n.localize(resolvedAdjustment.relabel);
        }
    }
}

export { StatisticModifier, PTUModifier, CheckModifier }