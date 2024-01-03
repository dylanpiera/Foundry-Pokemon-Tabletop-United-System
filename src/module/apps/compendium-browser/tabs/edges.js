import { sluggify } from "../../../../util/misc.js";
import { CompendiumBrowserTab } from "./base.js";

export class CompendiumBrowserEdgesTab extends CompendiumBrowserTab {
    constructor(browser) {
        super(browser);

        this.searchFields = ["name", "prerequisites.label", "prerequisites.tier"]
        this.storeFields = ["name", "uuid", "type", "source", "img", "prerequisites"];

        this.index = ["img", "system.source.value", "system.prerequisites"];

        this.filterData = this.prepareFilterData();
    }

    get tabName() {
        return "edges"
    }

    get templatePath() {
        return "systems/ptu/static/templates/apps/compendium-browser/partials/edges.hbs"
    }

    async loadData() {
        const abilities = [];
        const indexFields = duplicate(this.index);
        const sources = new Set();

        for await (const { pack, index } of this.browser.packLoader.loadPacks(
            "Item",
            this.browser.loadedPacks(this.tabName),
            indexFields
        )) {
            for (const edgeData of index) {
                if (edgeData.type !== "edge") continue;
                if (!this.hasAllIndexFields(edgeData, indexFields)) continue;

                const source = edgeData.system.source?.value ?? "";
                const sourceSlug = sluggify(source);
                if (source) sources.add(source);

                const prerequisites = edgeData.system.prerequisites ?? [];

                abilities.push({
                    name: edgeData.name,
                    type: edgeData.type,
                    img: edgeData.img,
                    uuid: `Compendium.${pack.collection}.${edgeData._id}`,
                    source: sourceSlug,
                    prerequisites: this.#prerequisitesStringToEntries(prerequisites)
                })
            }
        }

        this.indexData = abilities;

        // Set filters if necessary
        this.filterData.checkboxes.source.options = this.generateSourceCheckboxOptions(sources);
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
        const { checkboxes } = this.filterData;

        if(checkboxes.source.selected.length) {
            if(!checkboxes.source.selected.includes(entry.source)) return false;
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