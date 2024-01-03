import {sluggify} from "../../util/misc.js";

/**
 * @param {Array.<String>} values
 * @param {string} paramName
 * @param {Object} filterData
 *
 * @return {Object} Filter data.
 */
function checkboxes(values, paramName, filterData) {
    filterData.checkboxes[paramName].selected=[]
    for(const value of values){
        if(filterData.checkboxes[paramName].options[value] === undefined) continue;
        filterData.checkboxes[paramName].options[value].selected=true;
        filterData.checkboxes[paramName].selected.push(value)
    }
    return filterData
}

export const PimpJournal = {
    listen: () => {
        Hooks.on("renderJournalTextPageSheet", (sheet, $html) => {

            /** @type {HTMLElement} */
            const content = $html.filter(".journal-page-content").get(0);

            const enrichments = [{
                name: "feat",
                regex: /@FeatBrowser\[([|:_0-9a-zA-Z\- ]*)\]{([|:_0-9a-zA-Z\- ]*)}/,
                compendiumBrowserTab: game.ptu.compendiumBrowser.tabs.feats,
                params: [{
                    name: "class",
                    funcAddValuesForParamToFilter: checkboxes
                }]
            }]


            // Enrich the Journal Page
            let workingString = content.innerHTML
            for(const enrichment of enrichments){
                while (enrichment.regex.test(workingString)){
                    const match = enrichment.regex.exec(workingString)
                    const currentBaseSt = workingString
                    const displayName = match[2]
                    const paramString = match[1]
                    const params = paramString.split("|")
                    let compFilterString = ""
                    for (const enrichmentParam of enrichment.params){
                        const pName = enrichmentParam.name
                        const paramValues = params.filter(e => e.startsWith(`${pName}:`)).map(e => e.substring(pName.length+1))
                        compFilterString += ` compendium-filter-${pName}="${paramValues.join(" ")}"`
                    }
                    workingString = currentBaseSt.substring(0, match.index)
                    workingString += `<a class="compendium-link compendium-link-${enrichment.name}"${compFilterString}><i class="fas fa-th-list"></i>${displayName} Features</a>`
                    workingString += currentBaseSt.substring(match[0].length+match.index, currentBaseSt.length)
                }
            }
            content.innerHTML = workingString

            // Now that the Proper HTML is in place, add listeners to freshly enriched HTML elements
            for(const enrichment of enrichments) {
                content.querySelectorAll(`.compendium-link-${enrichment.name}`).forEach(el => {
                    el.addEventListener("click", async (event) => {
                        /** @type {CompendiumBrowserTab} */
                        const tab = enrichment.compendiumBrowserTab;
                        let filterData = await tab.getFilterData()
                        for (const eParam of enrichment.params) {
                            const paramValues = el.getAttribute(`compendium-filter-${eParam.name}`).split(" ")
                            filterData = eParam.funcAddValuesForParamToFilter(paramValues, eParam.name, filterData)
                        }
                        await tab.open(filterData)
                    })
                })
            }

        });
    }
}