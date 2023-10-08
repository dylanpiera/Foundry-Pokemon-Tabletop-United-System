import { sluggify } from "../../../../util/misc.js";
import { CompendiumBrowserTab } from "./base.js";

export class CompendiumBrowserAbilitiesTab extends CompendiumBrowserTab {
    constructor(browser) {
        super(browser);

        this.searchFields = ["name"]
        this.storeFields = ["name", "uuid", "type", "source", "img"];

        this.index = ["img", "system.source.value"];

        this.filterData = this.prepareFilterData();
    }

    get tabName() {
        return "abilities"
    }

    get templatePath() {
        return "systems/ptu/static/templates/apps/compendium-browser/partials/abilities.hbs"
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
            for (const abilityData of index) {
                if (abilityData.type !== "ability") continue;
                if (!this.hasAllIndexFields(abilityData, indexFields)) continue;

                const source = abilityData.system.source?.value ?? "";
                const sourceSlug = sluggify(source);
                if (source) sources.add(source);

                abilities.push({
                    name: abilityData.name,
                    type: abilityData.type,
                    img: abilityData.img,
                    uuid: `Compendium.${pack.collection}.${abilityData._id}`,
                    source: sourceSlug,
                })
            }
        }

        this.indexData = abilities;

        // Set filters if necessary
        this.filterData.checkboxes.source.options = this.generateSourceCheckboxOptions(sources);
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