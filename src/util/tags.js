function transformWhitelist(whitelist) {
    return Array.isArray(whitelist)
        ? whitelist
        : Object.entries(whitelist)
              .map(([key, locPath]) => ({
                  id: key,
                  value: game.i18n.localize(typeof locPath === "string" ? locPath : locPath.label),
              }))
              .sort((a, b) => a.value.localeCompare(b.value, game.i18n.lang));
}

/**
 * @param {HTMLInputElement} input 
 * @param {Object} options
 * @param {Object} options.whitelist
 * @param {number} options.maxTags
 * @param {boolean} options.enforceWhitelist 
 */
function tagify(input, {whitelist, maxTags, enforceWhitelist = true} = {}) {
    if (input?.hasAttribute("name") && input.dataset.dtype !== "JSON") {
        throw Error("Usable only on input elements with JSON data-dtype");
    } else if (!input) {
        return null;
    }

    const whitelistTransformed = whitelist ? transformWhitelist(whitelist) : [];
    const maxItems = whitelist ? Object.keys(whitelistTransformed).length : undefined;

    const tagify = new Tagify(input, {
        enforceWhitelist: !!whitelist && enforceWhitelist,
        keepInvalidTags: false,
        skipInvalid: !!whitelist,
        maxTags: maxTags ?? maxItems,
        dropdown: {
            enabled: 0,
            maxItems,
            searchKeys: ["id", "value"],
        },
        whitelist: whitelistTransformed,
    });

    // Add the name to the tags html as an indicator for refreshing
    if (input.name) {
        tagify.DOM.scope.dataset.name = input.name;
    }

    // Work around a tagify bug on Firefox
    // https://github.com/yairEO/tagify/issues/1115
    tagify.DOM.input.blur();

    return tagify;
}

export { tagify }