import { sluggify } from "../../../../util/misc.js";
import { CompendiumBrowserTab } from "./base.js";

export class CompendiumBrowserItemsTab extends CompendiumBrowserTab {
    constructor(browser) {
        super(browser);

        this.searchFields = ["name"]
        this.storeFields = ["name", "uuid", "type", "source", "img", "cost", "subtype"];

        this.index = ["img", "system.source.value", "system.cost", "system.subtype"];

        this.filterData = this.prepareFilterData();
    }

    get tabName() {
        return "items"
    }

    get templatePath() {
        return "systems/ptu/static/templates/apps/compendium-browser/partials/items.hbs"
    }

    async loadData() {
        const items = [];
        const indexFields = foundry.utils.duplicate(this.index);
        const sources = new Set();

        for await (const { pack, index } of this.browser.packLoader.loadPacks(
            "Item",
            this.browser.loadedPacks(this.tabName),
            indexFields
        )) {
            for (const itemData of index) {
                if (itemData.type !== "item") continue;
                if (!this.hasAllIndexFields(itemData, indexFields)) continue;

                const source = itemData.system.source?.value ?? "";
                const sourceSlug = sluggify(source);
                if (source) sources.add(source);

                items.push({
                    name: itemData.name,
                    type: itemData.type,
                    img: itemData.img,
                    uuid: `Compendium.${pack.collection}.${itemData._id}`,
                    source: sourceSlug,
                    cost: itemData.system.cost || 0,
                    subtype: itemData.system.subtype || "",
                })
            }
        }

        this.indexData = items;

        // Set filters if necessary
        this.filterData.checkboxes.source.options = this.generateSourceCheckboxOptions(sources);
    }

    filterIndexData(entry) {
        const { selects, checkboxes } = this.filterData;

        if(checkboxes.source.selected.length) {
            if(!checkboxes.source.selected.includes(entry.source)) return false;
        }

        if(selects.type.selected) {
            switch (selects.type.selected) {
                case "pokeball":
                    if (entry.subtype !== "pokeball") return false;
                    break;
                case "tms":
                    if (/TM(\d{1,3})\s/.test(entry.name) === false) return false;
                    break;
                case "berries":
                    if (!entry.name.trim().endsWith("Berry")) return false;
                    break;
            }
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
            selects: {
                type: {
                    isExpanded: false,
                    label: "PTU.CompendiumBrowser.FilterOptions.ItemType",
                    options: { pokeball: "Pokéball", tms: "TMs", berries: "Berries" },
                    selected: ""
                },
            },
            order: {
                by: "name",
                direction: "asc",
                options: {
                    name: "PTU.CompendiumBrowser.FilterOptions.Name",
                    cost: "PTU.CompendiumBrowser.FilterOptions.Cost",
                }
            },
            search: {
                text: ""
            }
        }
    }
} 