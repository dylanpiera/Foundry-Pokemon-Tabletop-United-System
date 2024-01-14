import { isObject } from '../../../util/misc.js';
import { CheckModifier, StatisticDiceModifier, StatisticModifier } from '../../actor/modifiers.js';
import { extractModifiers, extractRollSubstitutions } from '../../rules/helpers.js';
import { PTUCheck, eventToRollParams } from '../check/check.js';

/**
 * @abstract
 * @class SimpleStatistic
 */
class SimpleStatistic {
    /**
     * @param {PTUActor} actor
     * @param {StatisticData} data
     */
    constructor(actor, data) {
        this.actor = actor;
        this.slug = data.slug;
        this.label = game.i18n.localize(data.label);
        this.modifiers = [...(data.modifiers ??= [])];
        this.domains = [...(data.domains ??= [])];
        this.data = { ...data };

        if (this.domains.length > 0) {
            this.modifiers.push(...extractModifiers(this.actor.synthetics, this.domains));

            const options = this.createRollOptions();
            this.modifiers = this.modifiers.map(mod => mod.clone({ test: options }));
        }
    }

    /**
     * @param {string[]} domains
     * @returns {Set<string>} 
     */
    createRollOptions(domains = this.domains) {
        return new Set(this.actor.getRollOptions(domains));
    }
}

class Statistic extends SimpleStatistic {

    /**
     * @type {StatisticCheck}
     */
    #check;
    /**
     * @type {StatisticDifficultyClass}
     * */
    #dc;

    /**
     * @param {PTUActor} actor
     * @param {StatisticData} data
     * @param {RollOptionsParameters} options
     */
    constructor(actor, data, options = {}) {
        data.modifiers ??= [];
        super(actor, data);


        this.options = options;
        if (data.filter) {
            this.modifiers = this.modifiers.filter(data.filter);
        }

        this.data.dc ??= { domains: [`${this.slug}-dc`] };
    }

    /**
     * @returns {StatisticCheck}
     */
    get check() {
        return (this.#check ??= new StatisticCheck(this, this.data, this.options));
    }

    get dc() {
        return (this.#dc ??= new StatisticDifficultyClass(this, this.data, this.options));
    }

    get mod() {
        return this.check.number;
    }

    /** 
     * @override 
     * @param {string[]} domains
     * @param {RollOptionsParameters} args
     * @returns {Set<string>}
    */
    createRollOptions(domains = this.domains, args = {}) {
        const { item, extraRollOptions, origin, target } = args;

        const rollOptions = [];
        if (domains.length > 0) rollOptions.push(...super.createRollOptions());

        if (this.data.rollOptions) rollOptions.push(...this.data.rollOptions);

        if (item) {
            rollOptions.push(...item.getRollOptions("item"));
            if (item.actor && item.actor.uuid !== this.actor.uuid) {
                rollOptions.push(...item.actor.getRollOptions("origin"));
            }
        }

        if (origin) rollOptions.push(...origin.getRollOptions("origin"));
        else if (target) rollOptions.push(...target.getRollOptions("target"));

        if (extraRollOptions) rollOptions.push(...extraRollOptions);

        return new Set(rollOptions);
    }

    /**
     * @param {RollOptionsParameters | null} options 
     */
    withRollOptions(options) {
        const newOptions = foundry.utils.mergeObject(this.options ?? {}, options ?? {}, { inplace: false });
        return new Statistic(this.actor, foundry.utils.deepClone(this.data), newOptions);
    }

    /**
     * @param {StatisticData} data
     * @returns {Statistic}
     * */
    extend(data) {
        function maybeMergeArrays(arr1, arr2) {
            if (!arr1 && !arr2) return undefined;
            return [...new Set([arr1 ?? [], arr2 ?? []].flat())];
        }

        const result = foundry.utils.mergeObject(foundry.utils.deepClone(this.data), data);
        result.domains = maybeMergeArrays(this.domains, data.domains);
        result.modifiers = maybeMergeArrays(this.data.modifiers, data.modifiers);
        result.rollOptions = maybeMergeArrays(this.data.rollOptions, data.rollOptions);
        if (result.check && this.data.check) {
            result.check.domains = maybeMergeArrays(this.data.check.domains, data.check?.domains);
            result.check.modifiers = maybeMergeArrays(this.data.check.modifiers, data.check?.modifiers);
        }
        if (result.dc && this.data.dc) {
            result.dc.domains = maybeMergeArrays(this.data.dc.domains, data.dc?.domains);
            result.dc.modifiers = maybeMergeArrays(this.data.dc.modifiers, data.dc?.modifiers);
        }
        return new Statistic(this.actor, result, this.options);
    }

    /** 
     * Shortcut to `this#check#roll` 
     * @param {StatisticRollParameters} args
     * @returns {Promise<Roll>}
     * */
    roll(args = {}) {
        return this.check.roll(args);
    }

    /**
     * @param {RollOptionsParameters} options 
     * @returns {StatisticChatData}
     */
    getChatData(options = {}) {
        const { check, dc } = this.withRollOptions(options);
        return {
            slug: this.slug,
            label: this.label,
            check: { mod: check.mod, breakdown: check.breakdown, label: check.label },
            dc: {
                value: dc.value,
                breakdown: dc.breakdown,
            }
        }
    }

    /**
     * Returns data intended to be merged back into actor data. By default the value is the DC
     * @returns {StatisticTraceData}
     * */
    getTraceData(options = {}) {
        const { check, dc } = this;
        const valueProp = options.value ?? "mod";
        const [label, value, totalModifier, breakdown, modifiers] =
            valueProp === "mod"
                ? [this.label, check.mod, check.mod, check.breakdown, check.modifiers]
                : [dc.label || this.label, dc.value, dc.value, dc.breakdown, dc.modifiers];
        
        const trace = {
            slug: this.slug,
            label,
            value,
            totalModifier,
            dc: dc.value,
            breakdown,
            modifiers: modifiers.map(m => m.toObject())
        }

        return trace;
    }
}

class StatisticCheck {
    
    /**
     * @param {Statistic} parent
     * @param {StatisticData} data
     * @param {RollOptionsParameters} options
     */
    constructor(parent, data, options) {
        this.parent = parent;
        this.type = data.check?.type ?? "check";
        this.label = this.#determineLabel(data);
        this.domains = (data.domains ??[]).concat(data.check?.domains ?? []);

        const rollOptions = parent.createRollOptions(this.domains, options);
        const allCheckModifiers = [
            parent.modifiers,
            data.check?.modifiers ?? [],
            data.check?.domains ? extractModifiers(parent.actor.synthetics, data.check.domains) : []
        ].flat();
        this.modifiers = allCheckModifiers.map(m => m.clone({test: rollOptions}));
        this.diceModifiers = data.check?.diceModifiers ?? [];
        this.mod = new StatisticModifier(this.label, this.modifiers, rollOptions).totalModifier
        this.extraRollOptions = options.extraRollOptions ?? [];
    }

    /**
     * @param {StatisticData} data
     * @returns {string}
     * */
    #determineLabel(data) {
        const parentLabel = this.parent.label;
        if(data.check?.label) return game.i18n.localize(data.check.label);

        switch (this.type) {
            default: return parentLabel;
        }
    }

    /**
     * @param {RollOptionsParameters} args
     * @returns {Set<string>}
     * */
    createRollOptions(args = {}) {
        return this.parent.createRollOptions(this.domains, args);
    }

    /**
     * @param {StatisticRollParameters} args
     * @returns {Promise<Roll>}
     * */
    async roll(args = {}) {
        const { rollMode, skipDialog } = (() => {
            if(isObject(args)) {
                const event = args.event?.originalEvent ?? args.event;
                if(event instanceof MouseEvent) {
                    const { rollMode, skipDialog } = args;
                    return foundry.utils.mergeObject({rollMode, skipDialog}, eventToRollParams(event));
                }
            }
            return args;
        })();

        const actor = this.parent.actor;
        const token = args.token ?? actor.token;
        const item = args.item ?? null;
        const domains = this.domains;

        const { origin } = args;
        const targetToken = origin
            ? null
            : (args.target?.getActiveTokens() ?? Array.from(game.user.targets))[0] ?? null;
        
        const rollContext = await (async () => {
            return actor.getCheckContext({
                item,
                domains,
                statistic: this,
                target: targetToken,
                targetDC: args.dc?.slug ?? "evasion",
                options: new Set(this.extraRollOptions),
            })
        })()

        const targetActor = origin ? null : rollContext?.target?.actor ?? args.target ?? null;
        const extraModifiers = [...(args.modifiers ?? [])];
        const extraRollOptions = [...(args.extraRollOptions ?? []), ...(rollContext?.options ?? [])];
        const options = this.createRollOptions({ ...args, origin, target: targetActor, extraRollOptions });
        const dc = args.dc ?? rollContext?.dc ?? null;

        for(const rule of actor.rules.filter(r => !r.ignored)) {
            rule.beforeRoll?.(domains, {options: options});
        }

        const context = {
            actor,
            token,
            item,
            domains,
            targets: rollContext?.target ? [rollContext.target] : args.targets ?? [],
            dc,
            options,
            type: this.type,
            rollMode,
            skipDialog,
            substitutions: extractRollSubstitutions(actor.synthetics.rollSubstitutions, domains, options),
            title: args.title ?? this.label,
            createMessage: args.createMessage ?? true
        }

        const roll = await PTUCheck.roll(
            new CheckModifier(args.label || this.label, {modifiers: this.modifiers}, extraModifiers),
            context,
            null,
            args.callback,
            new StatisticDiceModifier(args.label || this.label, this.diceModifiers, options)
        )

        for(const rule of actor.rules.filter(r => !r.ignored)) {
            await rule.afterRoll?.({roll, selectors: domains, domains, rollOptions: options});
        }

        return roll;
    }

    get breakdown() {
        return this.modifiers
            .filter(m => m.enabled)
            .map(m => `${m.label}: ${m.modifier < 0 ? "" : "+"}${m.modifier}`)
            .join(", ");
    }
}

class StatisticDifficultyClass {
    /**
     * @param {Statistic} parent
     * @param {StatisticData} data
     * @param {RollOptionsParameters} options
     */
    constructor(parent, data, options) {
        this.parent = parent;
        this.domains = (data.domains ?? []).concat(data.dc?.domains ?? []);
        this.label = data.dc?.label;
        this.options = parent.createRollOptions(this.domains, options);

        const allDCModifiers = [
            parent.modifiers,
            data.dc?.modifiers ?? [],
            data.dc?.domains ? extractModifiers(parent.actor.synthetics, data.dc.domains) : []
        ].flat();
        this.modifiers = allDCModifiers.map(m => m.clone({test: this.options}));
    }

    get value() {
        return new StatisticModifier(this.label, this.modifiers, this.options).totalModifier;
    }

    get breakdown() {
        return this.modifiers
            .filter(m => m.enabled)
            .map(m => `${m.label}: ${m.modifier < 0 ? "" : "+"}${m.modifier}`)
            .join(", ");
    }
}

export { Statistic, StatisticCheck, StatisticDifficultyClass }
