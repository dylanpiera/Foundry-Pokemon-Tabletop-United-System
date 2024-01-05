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

const FILTERDATA_MERGERS = {
    checkboxes: checkboxes,
    multiselects: multiselects,
    sliders: sliders,
    selects: selects
}

export const CompendiumBrowserInlineEnricher = {
    listen: () => {

        // Set up a single Enricher that goes through all(?) content and subs the hand written
        // stuff with an anchor https://discord.com/channels/170995199584108546/722559135371231352/1192834854614737068
        Hooks.on('setup', () => {
            CONFIG.TextEditor.enrichers.push({
                pattern: /@([A-Z][a-z]+)Browser\[([|:_0-9a-zA-Z\- ]*)\](:?{(:?[^\[\]\{\}@]*)?})?/gim,
                enricher: async (match, enrichmentOptions) => {
                    const [tabNameUpper, paramString] = match.slice(1, 3)
                    let displayText = match[4]

                    const a = document.createElement("a");
                    a.classList.add("inline-roll", "compendium-link")

                    const tabNameLower = tabNameUpper.toLowerCase();
                    a.setAttribute("compendium-link-tab", tabNameLower)

                    const params = paramString.split("|")
                    const pValues = {}
                    for (const param of params) {
                        const [pName, pValue] = param.split(/:(.*)/s).splice(0, 2)
                        if (!pValues[pName]) pValues[pName] = new Set()
                        pValues[pName].add(pValue)
                    }
                    for (const pName of Object.keys(pValues)) {
                        a.setAttribute(`compendium-filter-setting-${pName}`, Array.from(pValues[pName]).join(" "))
                    }
                    a.innerHTML = `<i class="fas fa-th-list"></i>`

                    if (!displayText) {
                        const numExplicitSettings = Object.keys(pValues).map(k => pValues[k].size).reduce((a, b) => a + b, 0)
                        displayText = `${tabNameUpper} Search (${numExplicitSettings} Settings)`
                    }
                    a.insertAdjacentText("beforeend", displayText)
                    return a;
                }
            });
        })

        // This function adds Event Listeners to the given htmlElement for the compendium-link anchors
        // that the previous enricher will have added to the content
        const addAll = (htmlElement) => {
            htmlElement.querySelectorAll(`.compendium-link`).forEach(el => {
                el.addEventListener("click", async (event) => {
                    /** @type {CompendiumBrowserTab} */
                    const tabKey = el.getAttribute("compendium-link-tab")
                    const tab = game.ptu.compendiumBrowser.tabs[tabKey]

                    if (!tab) {
                        ui.notifications.warn(game.i18n.format("PTU.CompendiumBrowser.Enrichment.UnknownTab", {tabName: tabKey}));
                        return;
                    }

                    const allElAttributes = el.getAttributeNames()
                    const params = allElAttributes.filter(pName => pName.startsWith("compendium-filter-setting-")).map(s => {
                        return {
                            name: s.substring(26),
                            rawString: el.getAttribute(s)
                        }
                    })

                    let filterData = await tab.getFilterData()
                    for (const param of params) {
                        const paramValues = param.rawString.split(" ").map(v => v.trim()).filter(v => v !== "")
                        if (paramValues.length === 0) continue

                        //special cases for which there is no nested struture in filterdata
                        if(param.name==="search"){
                            filterData = search(paramValues, param.name, filterData);
                            continue;
                        }
                        if(param.name==="order"){
                            filterData = order(paramValues, param.name, filterData);
                            continue;
                        }

                        // Take care of all filters that are nested behind their respective input type
                        let filterDataMerger;
                        for (const filterType of Object.keys(FILTERDATA_MERGERS)) {
                            if (!filterData[filterType]) continue;
                            if (!filterData[filterType][param.name]) continue;
                            if (filterDataMerger) throw Error(`Multiple hits for ${param.name}`)
                            filterDataMerger = FILTERDATA_MERGERS[filterType] //break after
                        }
                        if (!filterDataMerger) ui.notifications.warn(game.i18n.format("PTU.CompendiumBrowser.Enrichment.UnknownFilterSetting", {filterName: param.name, tabName: tabKey}));
                        else filterData = filterDataMerger(paramValues, param.name, filterData)
                    }
                    await tab.open(filterData)
                })
            })
        }

        // These Sheets should be interactive, such that clicking on the anchor actually does something
        // Due to some performance stutters during development, those are relatively restrictive.
        // It the anchor appears somehwere where it should also work, add an appropriate hook here
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