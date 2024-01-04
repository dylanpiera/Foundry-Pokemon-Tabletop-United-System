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

export const PimpJournal = {
    listen: () => {
        Hooks.on("renderJournalTextPageSheet", (sheet, $html) => {

            /** @type {HTMLElement} */
            const content = $html.filter(".journal-page-content").get(0);

            const enrichments = []
            const commonRegexSuffix = /Browser\[([|:_0-9a-zA-Z\- ]*)\]{([^\[\]\{\}@]*)}/

            const tabNamesLower = Object.keys(game.ptu.compendiumBrowser.tabs)
            for (const tabNameLower of tabNamesLower) {
                const tab = game.ptu.compendiumBrowser.tabs[tabNameLower];
                const tabNamePretty = tabNameLower.charAt(0).toUpperCase() + tabNameLower.substring(1)
                const regex = new RegExp("@" + tabNamePretty + commonRegexSuffix.source)
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
                    const filterParamsOfType = tab.filterData[paramType];
                    if (filterParamsOfType)
                        params = params.concat(Object.keys(filterParamsOfType).map(paramName => {
                            return {name: paramName, funcAddValuesForParamToFilter: func}
                        }))
                }
                enrichments.push({
                    name: tabNameLower,
                    regex: regex,
                    compendiumBrowserTab: tab,
                    params: params
                })
            }

            // const enrichments = [
            //     {
            //         name: "feat",
            //         regex: /@FeatBrowser\[([|:_0-9a-zA-Z\- ]*)\]{([|:_0-9a-zA-Z\- ]*)}/,
            //         compendiumBrowserTab: game.ptu.compendiumBrowser.tabs.feats,
            //         params: [
            //             {
            //                 name: "class",
            //                 funcAddValuesForParamToFilter: checkboxes
            //             }
            //         ]
            //     },
            //     {
            //         name: "species",
            //         regex: /@SpeciesBrowser\[([|:_0-9a-zA-Z\- ]*)\]{([|:_0-9a-zA-Z\- ]*)}/,
            //         compendiumBrowserTab: game.ptu.compendiumBrowser.tabs.species,
            //         params: [
            //             {
            //                 name: "types",
            //                 funcAddValuesForParamToFilter: multiselects
            //             },
            //             {
            //                 name: "moves",
            //                 funcAddValuesForParamToFilter: multiselects
            //             },
            //             {
            //                 name: "abilities",
            //                 funcAddValuesForParamToFilter: multiselects
            //             },
            //             {
            //                 name: "overland",
            //                 funcAddValuesForParamToFilter: sliders
            //             },
            //             {
            //                 name: "order",
            //                 funcAddValuesForParamToFilter: order
            //             },
            //             {
            //                 name: "search",
            //                 funcAddValuesForParamToFilter: search
            //             },
            //             {
            //                 name: "source",
            //                 funcAddValuesForParamToFilter: checkboxes
            //             }
            //         ]
            //     },
            // ]


            // Enrich the Journal Page
            let workingString = content.innerHTML
            for (const enrichment of enrichments) {
                while (enrichment.regex.test(workingString)) {
                    const match = enrichment.regex.exec(workingString)
                    const currentBaseSt = workingString
                    const displayName = match[2]
                    const paramString = match[1]
                    const params = paramString.split("|")
                    let compFilterString = ""
                    for (const enrichmentParam of enrichment.params) {
                        const pName = enrichmentParam.name
                        const paramValues = params.filter(e => e.startsWith(`${pName}:`)).map(e => e.substring(pName.length + 1))
                        compFilterString += ` compendium-filter-${pName}="${paramValues.join(" ")}"`
                    }
                    workingString = currentBaseSt.substring(0, match.index)
                    workingString += `<a class="compendium-link compendium-link-${enrichment.name}"${compFilterString}><i class="fas fa-th-list"></i>${displayName}</a>`
                    workingString += currentBaseSt.substring(match[0].length + match.index, currentBaseSt.length)
                }
            }
            content.innerHTML = workingString

            // Now that the Proper HTML is in place, add listeners to freshly enriched HTML elements
            for (const enrichment of enrichments) {
                content.querySelectorAll(`.compendium-link-${enrichment.name}`).forEach(el => {
                    el.addEventListener("click", async (event) => {
                        /** @type {CompendiumBrowserTab} */
                        const tab = enrichment.compendiumBrowserTab;
                        let filterData = await tab.getFilterData()
                        for (const eParam of enrichment.params) {
                            const paramValues = el.getAttribute(`compendium-filter-${eParam.name}`).split(" ").map(v => v.trim()).filter(v => v !== "")
                            if (paramValues.length > 0) filterData = eParam.funcAddValuesForParamToFilter(paramValues, eParam.name, filterData)
                        }
                        await tab.open(filterData)
                    })
                })
            }

        });
    }
}