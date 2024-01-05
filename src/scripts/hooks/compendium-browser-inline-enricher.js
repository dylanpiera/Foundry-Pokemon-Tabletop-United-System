/**
 * Ideally, this would not be needed. But the chat gets rendered before PTU initializes the Browser, and introducing
 * statics into classes are more of a hassle than having a hard coded list of tabs here.
 * @type {string[]}
 */
const MANUAL_NAMES_OF_COMPENDIUM_BROWSER_TABS_LOWER = [
    "abilities",
    "edges",
    "feats",
    "items",
    "moves",
    "pokeEdges",
    "species"
]

/**
 * @param {Array.<String>} values Values for given parameter, excluding param name. E.g ["water", "not:fire"]
 * @param {string} paramName Parameter name as named in compendium browser filter data, e.g. "types"
 * @param {Object} filterData Whole filterData of CompendiumBrowserTab. Will not get modified.
 *
 * @return {Object} New Object for filter data, merged with provided
 */
function checkboxes(values, paramName, filterData) {
    const fd = deepClone(filterData)
    fd.checkboxes[paramName].selected = []
    for (const optionName of Object.keys(fd.checkboxes[paramName].options)) {
        fd.checkboxes[paramName].options[optionName].selected = false;
    }
    for (const value of values) {
        if (fd.checkboxes[paramName].options[value] === undefined) continue;
        fd.checkboxes[paramName].options[value].selected = true;
        fd.checkboxes[paramName].selected.push(value)
    }
    return fd
}

/**
 * @param {Array.<String>} values Values for given parameter, excluding param name. E.g ["water", "not:fire"]
 * @param {string} paramName Parameter name as named in compendium browser filter data, e.g. "types"
 * @param {Object} filterData Whole filterData of CompendiumBrowserTab. Will not get modified.
 *
 * @return {Object} New Object for filter data, merged with provided
 */
function multiselects(values, paramName, filterData) {
    const fd = deepClone(filterData)

    const conjunction = values.find(v => v.startsWith("logic:"))
    if (conjunction) fd.multiselects[paramName].conjunction = conjunction.substring(6)

    const negatives = values
        .filter(v => v.startsWith("not:"))
        .map(v => v.substring(4))
        .map(value => {
            return {
                value: value,
                not: true,
                label: filterData.multiselects[paramName].options.find(o => o.value === value).label
            }
        })
    const positives = values
        .filter(v => !v.includes(":"))
        .map(value => {
            return {
                value: value,
                label: filterData.multiselects[paramName].options.find(o => o.value === value).label
            }
        })

    fd.multiselects[paramName].selected = positives.concat(negatives)
    return fd
}

/**
 * @param {Array.<String>} values Values for given parameter, excluding param name. E.g ["water", "not:fire"]
 * @param {string} paramName Parameter name as named in compendium browser filter data, e.g. "types"
 * @param {Object} filterData Whole filterData of CompendiumBrowserTab. Will not get modified.
 *
 * @return {Object} New Object for filter data, merged with provided
 */
function sliders(values, paramName, filterData) {
    const fd = deepClone(filterData)
    for (const end of ["min", "max"]) {
        const val = values.filter(v => v.startsWith(`${end}:`)).map(v => Number(v.substring(4))).find(v => v)
        if (val) fd.sliders[paramName].values[end] = val
    }
    return fd;
}

/**
 * @param {Array.<String>} values Values for given parameter, excluding param name. E.g ["water", "not:fire"]
 * @param {string} paramName Parameter name as named in compendium browser filter data, e.g. "types"
 * @param {Object} filterData Whole filterData of CompendiumBrowserTab. Will not get modified.
 *
 * @return {Object} New Object for filter data, merged with provided
 */
function selects(values, paramName, filterData) {
    const fd = deepClone(filterData)
    const legalOptionNames = Object.keys(fd.selects[paramName].options)
    fd.selects[paramName].selected = values.find(v => legalOptionNames.includes(v)) || ""
    return fd;
}

/**
 * @param {Array.<String>} values Values for given parameter, excluding param name. E.g ["water", "not:fire"]
 * @param {string} paramName Parameter name as named in compendium browser filter data, e.g. "types"
 * @param {Object} filterData Whole filterData of CompendiumBrowserTab. Will not get modified.
 *
 * @return {Object} New Object for filter data, merged with provided
 */
function order(values, paramName, filterData) {
    const fd = deepClone(filterData)
    const by = values.filter(v => v.startsWith("by:")).map(v => v.substring(3))[0]
    if (by) fd.order.by = by
    const dir = values.filter(v => v.startsWith("dir:")).map(v => v.substring(4))[0]
    if (dir) fd.order.direction = by
    return fd
}

/**
 * @param {Array.<String>} values Values for given parameter, excluding param name. E.g ["water", "not:fire"]
 * @param {string} paramName Parameter name as named in compendium browser filter data, e.g. "types"
 * @param {Object} filterData Whole filterData of CompendiumBrowserTab. Will not get modified.
 *
 * @return {Object} New Object for filter data, merged with provided
 */
function search(values, paramName, filterData) {
    const fd = deepClone(filterData)
    fd.search.text = values.join(" ")
    return fd
}

function buildEnrichments() {
    const enrichments = []
    const commonRegexSuffix = /Browser\[([|:_0-9a-zA-Z\- ]*)\]{([^\[\]\{\}@]*)}/
    for (const tabNameLower of MANUAL_NAMES_OF_COMPENDIUM_BROWSER_TABS_LOWER) {
        const tabNamePretty = tabNameLower.charAt(0).toUpperCase() + tabNameLower.substring(1)

        const regex = new RegExp("@" + tabNamePretty + commonRegexSuffix.source)

        const getTab = () => {
            return game.ptu.compendiumBrowser.tabs[tabNameLower]
        }

        const getParams = () => {
            const tab = game.ptu.compendiumBrowser.tabs[tabNameLower];
            let params = [
                {
                    name: "order",
                    funcAddValuesForParamToFilter: order
                },
                {
                    name: "search",
                    funcAddValuesForParamToFilter: search
                }
            ]
            for (const x of [[sliders, "sliders"], [checkboxes, "checkboxes"], [multiselects, "multiselects"], [selects, "selects"]]) {
                const func = x[0];
                const paramType = x[1];
                const filterData = tab.filterData[paramType];
                if (filterData)
                    params = params.concat(Object.keys(filterData).map(paramName => {
                        return {name: paramName, funcAddValuesForParamToFilter: func}
                    }))
            }
            return params

        }

        enrichments.push({
            /**@type{string}*/
            name: tabNameLower,
            /**@type{RegExp}*/
            regex: regex,
            /**Used on click, referencing browser that is not ready when e.g. Chat is loaded.
             * Therefor, encapsulate into function call to resolve at click-time
             * @type{Function}*/
            compendiumBrowserTabGetter: getTab,
            /**Used on click, referencing browser that is not ready when e.g. Chat is loaded.
             * Therefor, encapsulate into function call to resolve at click-time
             * @type{Function}*/
            paramsGetter: getParams
        })
    }
    return enrichments
}

export const CompendiumBrowserInlineEnricher = {
    listen: () => {
        const enrichments = buildEnrichments()

        for(const enrichment of enrichments){
            Hooks.on('setup', () => {
                CONFIG.TextEditor.enrichers.push({
                    pattern: /@([A-Z][a-z]+)Browser\[([|:_0-9a-zA-Z\- ]*)\](:?{(:?[^\[\]\{\}@]*)?})?/gim,
                    enricher: async (match, something) => {
                        const [tabNameUpper, paramString] = match.slice(1,3)
                        let displayText = match[4]

                        const a = document.createElement("a");
                        a.classList.add("inline-roll", "compendium-link")

                        const tabNameLower = tabNameUpper.toLowerCase();
                        a.classList.add(`compendium-link-${tabNameLower}`)

                        const params = paramString.split("|")
                        const pValues = {}
                        for (const param of params) {
                            const [pName, pValue] = param.split(/:(.*)/s).splice(0, 2)
                            if (!pValues[pName]) pValues[pName] = new Set()
                            pValues[pName].add(pValue)
                        }
                        for (const pName of Object.keys(pValues)) {
                            a.setAttribute(`compendium-filter-${pName}`, Array.from(pValues[pName]).join(" "))
                        }
                        a.innerHTML=`<i class="fas fa-th-list"></i>`

                        if(! displayText) {
                            const numExplicitSettings = Object.keys(pValues).map(k => pValues[k].size).reduce((a,b)=>a+b, 0)
                            displayText=`${tabNameUpper} Search (${numExplicitSettings} Settings)`
                        }
                        a.insertAdjacentText("beforeend", displayText)
                        return a;
                    }
                });
            })
        }

        const addAll= (htmlElement) => {
            // Now that the Proper HTML is in place, add listeners to freshly enriched HTML elements
            for (const enrichment of enrichments) {
                htmlElement.querySelectorAll(`.compendium-link-${enrichment.name}`).forEach(el => {
                    el.addEventListener("click", async (event) => {
                        /** @type {CompendiumBrowserTab} */
                        const tab = enrichment.compendiumBrowserTabGetter();
                        let filterData = await tab.getFilterData()
                        for (const eParam of enrichment.paramsGetter()) {
                            const attribute = el.getAttribute(`compendium-filter-${eParam.name}`)
                            if (!attribute) continue
                            const paramValues = attribute.split(" ").map(v => v.trim()).filter(v => v !== "")
                            if (paramValues.length === 0) continue
                            filterData = eParam.funcAddValuesForParamToFilter(paramValues, eParam.name, filterData)
                        }
                        await tab.open(filterData)
                    })
                })
            }
        }


        Hooks.on("renderJournalTextPageSheet", (journal, $html) => {
            // maybe related to why this does do need a filter? https://github.com/foundryvtt/foundryvtt/issues/3088
            const journalHtmlElement = $html.filter(".journal-page-content").get(0);
            addAll(journalHtmlElement)

        });
        Hooks.on("renderChatMessage", (message, $html) => {
            // maybe related to why this does not need a filter? https://github.com/foundryvtt/foundryvtt/issues/3088
            const messageHtmlElement = $html.get(0);
            addAll(messageHtmlElement)

            message.activateListeners($html)
        });
        Hooks.on("renderPTUItemSheet", (itemSheet, $html) => {
            // maybe related to why this does not need a filter? https://github.com/foundryvtt/foundryvtt/issues/3088
            const itemHtmlElement = $html.get(0)
            addAll(itemHtmlElement)
        });
    }
}