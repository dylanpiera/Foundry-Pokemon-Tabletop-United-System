import { isBracketedValue } from "../module/rules/rule-element/base.js";

/**
 * Callback used to parse and look up values when calculating rules. Parses strings that look like
 * {actor|x.y.z}, {item|x.y.z} or {rule|x.y.z} where x.y.z is the path on the current actor, item or rule.
 * It's useful if you want to include something like the item's ID in a modifier selector (for applying the
 * modifier only to a specific weapon, for example), or include the item's name in some text.
 *
 * @param source string that should be parsed
 * @param {Object} injectionData data to be used for data injection
 * @param {PTUActor} injectionData.actor actor to be used for data injection
 * @param {PTUItem} injectionData.item item to be used for data injection
 * @param {import("../module/actor/base").RuleElementPTU} injectionData.rule rule to be used for data injection
 * @return the looked up value on the specific object
 */
function resolveInjectedProperties(source, injectionData) {
    // If the source is null, a number or a string without any injected properties, return it as-is
    if (source === null || typeof source === "number" || (typeof source === "string" && !source.includes("{"))) {
        return source;
    }

    // If the source is an array, resolve each element
    if (Array.isArray(source)) {
        return source.map((element) => resolveInjectedProperties(element, injectionData));
    }

    // If the source is an object, resolve each value
    if (typeof source === "object") {
        for (const [key, value] of Object.entries(source)) {
            source[key] = resolveInjectedProperties(value);
        }
    }

    // If the source is a string, parse it for injected properties
    if (typeof source === "string") {
        const regex = /{(actor|item|rule)\|(.*)}/g;
        const {actor,item,rule} = injectionData;
        function replaceFunc(_match, key, prop) {
            const data = key === "rule" ? rule.data : key === "actor" ? actor : item;

            const property = prop.replace(regex, replaceFunc);

            const value = getProperty(data, property);
            if (value === undefined) {
                console.error(`Failed to resolve injected property "${source}"`);
            }
            return String(value);
        }

        return source.replace(regex, replaceFunc);
    }

    return source;
}

/**
 * Parses the value attribute on a rule.
 *
 * @param valueData can be one of 3 different formats:
 * * {value: 5}: returns 5
 * * {value: "4 + @details.level.value"}: uses foundry's built in roll syntax to evaluate it
 * * {
 *      field: "item|data.level.value",
 *      brackets: [
 *          {start: 1, end: 4, value: 5}],
 *          {start: 5, end: 9, value: 10}],
 *   }: compares the value from field to >= start and <= end of a bracket and uses that value
 * @param {Object} injectionData data to be used for data injection
 * @param {PTUActor} injectionData.actor actor to be used for data injection
 * @param {PTUItem} injectionData.item item to be used for data injection
 * @param {import("../module/actor/base").RuleElementPTU} injectionData.rule rule to be used for data injection
 * @param defaultValue if no value is found, use that one
 * @return the evaluated value
 */
function resolveValue(valueData, injectionData, defaultValue = 0, { evaluate = true } = {}) {
    let value = valueData ?? defaultValue ?? null;
    const { actor, item, rule } = injectionData;

    if (["number", "boolean"].includes(typeof value) || value === null) {
        return value;
    }
    if (typeof value === "string") {
        value = resolveInjectedProperties(value, injectionData);
    }

    if (isBracketedValue(valueData)) {
        const bracketNumber = (() => {
            if (!valueData?.field) return 0;
            const field = String(valueData.field);
            const seperator = field.indexOf("|");
            const source = field.substring(0, seperator);

            switch (source) {
                case "actor": return Number(getProperty(actor, field.substring(seperator + 1))) || 0;
                case "item": return Number(getProperty(item, field.substring(seperator + 1))) || 0;
                case "rule": return Number(getProperty(rule, field.substring(seperator + 1))) || 0;
                default: return 0;
            }
        })();

        const brackets = valueData?.brackets ?? [];
        // Set the fallthrough (the value set when no bracket matches) to be of the same type as the default value
        const bracketFallthrough = (() => {
            switch (typeof defaultValue) {
                case "number":
                case "boolean":
                case "object":
                    return defaultValue;
                case "string":
                    return Number.isNaN(Number(defaultValue)) ? defaultValue : Number(defaultValue);
                default:
                    return null;
            }
        });

        value =
            brackets.find((bracket) => {
                const start = bracket.start ?? 0;
                const end = bracket.end ?? Infinity;
                return start <= bracketNumber && end >= bracketNumber;
            })?.value ?? bracketFallthrough();
    }

    const saferEval = (formula) => {
        try {
            return Roll.safeEval(formula);
        } catch {
            console.error(`Error thrown while attempting to evaluate formula, "${formula}"`);
            return 0;
        }
    };

    return value instanceof Object && defaultValue instanceof Object
        ? mergeObject(defaultValue, value, { inplace: false })
        : typeof value === "string" && evaluate
            ? saferEval(Roll.replaceFormulaData(value, { actor, item, rule }))
            : value;
}

export { resolveInjectedProperties, resolveValue };
