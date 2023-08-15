function extractModifiers(synthetics, selectors, options = {}) {
    const { modifierAdjustments, statisticsModifiers } = synthetics;
    const modifiers = Array.from(new Set(selectors))
        .flatMap((s) => statisticsModifiers[s] ?? [])
        .flatMap((d) => d(options) ?? []);
    for (const modifier of modifiers) {
        modifier.adjustments = extractModifierAdjustments(modifierAdjustments, selectors, modifier.slug);
    }

    return modifiers;
}

function extractModifierAdjustments(
    adjustmentsRecord,
    selectors,
    slug
) {
    const adjustments = Array.from(new Set(selectors.flatMap((s) => adjustmentsRecord[s] ?? [])));
    return adjustments.filter((a) => [slug, null].includes(a.slug));
}

async function extractEphemeralEffects({ affects, origin, target, item, domains, options }) {
    if (!(origin && target)) return [];

    const [effectsFrom, effectsTo] = affects === "target" ? [origin, target] : [target, origin];
    const fullOptions = [...options, ...effectsTo.getSelfRollOptions(affects)];
    const resolvables = item?.type == "move" ? { move: item } : {};
    return (
        await Promise.all(
            domains
                .flatMap(s => effectsFrom.synthetics.ephemeralEffects[s]?.[affects] ?? [])
                .map(d => d({ test: fullOptions, resolvables }))
        )
    ).flatMap(e => e ?? [])
}

function extractRollSubstitutions(substitutions, domains, rollOptions) {
    return domains
        .flatMap((d) => deepClone(substitutions?.[d] ?? []))
        .filter((s) => s.predicate?.test(rollOptions) ?? true);
}

export { extractEphemeralEffects, extractRollSubstitutions, extractModifiers }