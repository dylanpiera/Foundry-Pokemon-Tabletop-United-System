import { sluggify } from "../../../../util/misc.js";
import { CompendiumBrowserTab } from "./base.js";

export class CompendiumBrowserPokeEdgesTab extends CompendiumBrowserTab {
    constructor(browser) {
        super(browser);

        this.searchFields = ["name", "prerequisites.label", "prerequisites.tier"]
        this.storeFields = ["name", "uuid", "type", "source", "img", "prerequisites", "keywords"];

        this.index = ["img", "system.source.value", "system.prerequisites", "system.keywords"];

        this.filterData = this.prepareFilterData();
    }

    get tabName() {
        return "pokeEdges"
    }

    get templatePath() {
        return "systems/ptu/static/templates/apps/compendium-browser/partials/pokeEdges.hbs"
    }

    async loadData() {
        const abilities = [];
        const indexFields = foundry.utils.duplicate(this.index);
        const sources = new Set();

        const allKeywordsSeen = new Set();

        for await (const { pack, index } of this.browser.packLoader.loadPacks(
            "Item",
            this.browser.loadedPacks(this.tabName),
            indexFields
        )) {
            for (const edgeData of index) {
                if (edgeData.type !== "pokeedge") continue;
                if (!this.hasAllIndexFields(edgeData, indexFields)) continue;

                const source = edgeData.system.source?.value ?? "";
                const sourceSlug = sluggify(source);
                if (source) sources.add(source);

                const prerequisites = edgeData.system.prerequisites ?? [];

                for(const keyword of edgeData.system.keywords) {
                    allKeywordsSeen.add(keyword);
                }

                abilities.push({
                    name: edgeData.name,
                    type: edgeData.type,
                    img: edgeData.img,
                    uuid: `Compendium.${pack.collection}.${edgeData._id}`,
                    source: sourceSlug,
                    prerequisites: this.#prerequisitesStringToEntries(prerequisites),
                    keywords: edgeData.system.keywords
                })
            }
        }

        this.indexData = abilities;

        // Set filters if necessary
        this.filterData.checkboxes.source.options = this.generateSourceCheckboxOptions(sources);
        this.filterData.multiselects.keywords.options = this.filterOptionsFromSet(allKeywordsSeen);
    }

    #prerequisitesStringToEntries(prerequisites) {
        const tiers = new Set(["novice", "adept", "expert", "master"])
        
        const entries = [];
        for(const prereq of prerequisites) {
            let tierFound = false;
            const entry = prereq.split(" ").map(p => p.trim()).reduce((acc, curr) => {
                if(!tierFound && tiers.has(curr.toLowerCase())) {
                    acc.tier = curr;
                    acc.label = acc.label ? `${curr} ${acc.label}` : curr;
                    tierFound = true;
                } else {
                    acc.label = acc.label ? `${acc.label} ${curr}` : curr;
                }
                return acc;
            }, {label: "", tier: ""});

            if(entry.label) entries.push(entry);
        }

        return entries.sort(this._sortTiers);
    }

    _sortTiers(objectA,objectB) {
        const tiers = new Set(["novice", "adept", "expert", "master"])
        const tierArray = Array.from(tiers);
        const tierA = objectA.tier.toLowerCase();
        const tierB = objectB.tier.toLowerCase();
        if(tiers.has(tierA) && tiers.has(tierB)) {
            return tierArray.indexOf(tierA) - tierArray.indexOf(tierB);
        }
        if(tiers.has(tierA)) return -1;
        if(tiers.has(tierB)) return 1;
        return 0;
    }

    filterIndexData(entry) {
        const { checkboxes, multiselects } = this.filterData;

        if(checkboxes.source.selected.length) {
            if(!checkboxes.source.selected.includes(entry.source)) return false;
        }

        if(!this.isEntryHonoringMultiselect(multiselects.keywords, entry.keywords)) return false;

        return true;
    }

    filterOptionsFromSet(set) {
        return [...set].map(value => ({ value, label: value })).sort((a, b) => a.label.localeCompare(b.label));
    }

    /**
     *  @param multiselectFilter - the `selected` from a filter, e.g. `filterData.multiselects.types`
     *  @param entrySetToCheck - the set of an entry corresponding to the filter, e.g. `entry.types`
     *  @return {boolean} - True if the entry honors the filter, i.e. would be valid result
    */
    isEntryHonoringMultiselect(multiselectFilter, entrySetToCheck) {
        const selected = multiselectFilter.selected.filter(s => !s.not).map(s => s.value);
        const notSelected = multiselectFilter.selected.filter(s => s.not).map(s => s.value);
        if (selected.length || notSelected.length) {
            if (notSelected.some(ns => entrySetToCheck.some(e => sluggify(e) === sluggify(ns)))) return false;
            const fulfilled =
                multiselectFilter.conjunction === "and"
                    ? selected.every(s => entrySetToCheck.some(e => sluggify(e) === sluggify(s)))
                    : selected.some(s => entrySetToCheck.some(e => sluggify(e) === sluggify(s)));
            if (!fulfilled) return false;
        }
        return true;
    }

    prepareFilterData() {
        return {
            checkboxes: {
                source: {
                    isExpanded: false,
                    label: "PTU.CompendiumBrowser.FilterOptions.Source",
                    options: {},
                    selected: []
                }
            },
            multiselects: {
                keywords: {
                    conjunction: "and",
                    label: "PTU.CompendiumBrowser.FilterOptions.Keywords",
                    options: [],
                    selected: [{value: 'Obsolete', label: 'Obsolete', not: true}]
                }
            },
            order: {
                by: "name",
                direction: "asc",
                options: {
                    name: "PTU.CompendiumBrowser.FilterOptions.Name"
                }
            },
            search: {
                text: ""
            }
        }
    }
} 