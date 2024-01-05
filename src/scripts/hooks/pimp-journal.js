/**
 * @param {Array.<String>} values
 * @param {string} paramName
 * @param {Object} filterData
 *
 * @return {Object} Filter data.
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
 * @param {Array.<String>} values
 * @param {string} paramName
 * @param {Object} filterData
 *
 * @return {Object} Filter data.
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
 * @param {Array.<String>} values
 * @param {string} paramName
 * @param {Object} filterData
 *
 * @return {Object} Filter data.
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
 * @param {Array.<String>} values
 * @param {string} paramName
 * @param {Object} filterData
 *
 * @return {Object} Filter data.
 */
function selects(values, paramName, filterData) {
    const fd = deepClone(filterData)
    const legalOptionNames = Object.keys(fd.selects[paramName].options)
    fd.selects[paramName].selected = values.find(v => legalOptionNames.includes(v)) || ""
    return fd;
}

/**
 * @param {Array.<String>} values
 * @param {string} paramName
 * @param {Object} filterData
 *
 * @return {Object} Filter data.
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
 * @param {Array.<String>} values
 * @param {string} paramName
 * @param {Object} filterData
 *
 * @return {Object} Filter data.
 */
function search(values, paramName, filterData) {
    const fd = deepClone(filterData)
    fd.search.text = values.join(" ")
    return fd
}

/**
 * Ideally, this would not be needed. But the chat gets rendered before PTU initializes the Browser, and introducing
 * statics into classes are more of a hassle than having a hard coded list of tabs here.
 * @type {string[]}
 */
const MANUAL_NAMES_OF_TABS_LOWER = [
    "abilities",
    "edges",
    "feats",
    "items",
    "moves",
    "pokeEdges",
    "species"
]

/**
 *
 * @param {HTMLElement} htmlElement
 */
function pimp(htmlElement) {
    const enrichments = []
    const commonRegexSuffix = /Browser\[([|:_0-9a-zA-Z\- ]*)\]{([^\[\]\{\}@]*)}/
    for (const tabNameLower of MANUAL_NAMES_OF_TABS_LOWER) {
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
            name: tabNameLower,
            regex: regex,
            compendiumBrowserTabGetter: getTab,
            paramsGetter: getParams
        })
    }

    // Enrich the Journal Page
    let workingString = htmlElement.innerHTML
    for (const enrichment of enrichments) {
        while (enrichment.regex.test(workingString)) {
            const match = enrichment.regex.exec(workingString)
            const currentBaseSt = workingString
            const displayName = match[2]
            const paramString = match[1]
            const params = paramString.split("|")
            const pValues = {}
            for (const param of params) {
                const [pName, pValue] = param.split(/:(.*)/s).splice(0, 2)
                if (!pValues[pName]) pValues[pName] = new Set()
                pValues[pName].add(pValue)
            }
            let compFilterString = ""
            for (const pName of Object.keys(pValues)) {
                compFilterString += ` compendium-filter-${pName}="${Array.from(pValues[pName]).join(" ")}"`
            }
            workingString = currentBaseSt.substring(0, match.index)
            workingString += `<a class="compendium-link compendium-link-${enrichment.name}"${compFilterString}><i class="fas fa-th-list"></i>${displayName}</a>`
            workingString += currentBaseSt.substring(match[0].length + match.index, currentBaseSt.length)
        }
    }
    htmlElement.innerHTML = workingString


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

export const PimpJournal = {
    listen: () => {
        Hooks.on("renderJournalTextPageSheet", (journal, $html) => {
            // maybe related to why this does do need a filter? https://github.com/foundryvtt/foundryvtt/issues/3088
            const journalHtmlElemtent = $html.filter(".journal-page-content").get(0);
            pimp(journalHtmlElemtent)
        });
        Hooks.on("renderChatMessage", (message, $html) => {
            // maybe related to why this does not need a filter? https://github.com/foundryvtt/foundryvtt/issues/3088
            const messageHtmlElement = $html.get(0);
            pimp(messageHtmlElement)
        });
    }
}