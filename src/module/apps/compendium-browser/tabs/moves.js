import { sluggify } from "../../../../util/misc.js";
import { CompendiumBrowserTab } from "./base.js";

export class CompendiumBrowserMovesTab extends CompendiumBrowserTab {
    constructor(browser) {
        super(browser);

        this.searchFields = ["name", "range"]
        this.storeFields = ["name", "uuid", "type", "source", "img", "moveType", "category", "damageBase", "range", "keywords"];

        this.index = ["img", "system.source.value", "system.type", "system.category", "system.damageBase", "system.range", "system.keywords"];

        this.filterData = this.prepareFilterData();
    }

    get tabName() {
        return "moves"
    }

    get templatePath() {
        return "systems/ptu/static/templates/apps/compendium-browser/partials/moves.hbs"
    }

    async loadData() {
        const moves = [];
        const indexFields = foundry.utils.duplicate(this.index);
        const sources = new Set();
        const allKeywordsSeen = new Set();

        for await (const { pack, index } of this.browser.packLoader.loadPacks(
            "Item",
            this.browser.loadedPacks(this.tabName),
            indexFields
        )) {
            for (const moveData of index) {
                if (moveData.type !== "move") continue;
                if (!this.hasAllIndexFields(moveData, indexFields)) continue;

                const source = moveData.system.source?.value ?? "";
                const sourceSlug = sluggify(source);
                if (source) sources.add(source);

                const db = Number(moveData.system.damageBase);

                for(const keyword of moveData.system.keywords) {
                    allKeywordsSeen.add(keyword);
                }

                moves.push({
                    name: moveData.name,
                    type: moveData.type,
                    img: moveData.img,
                    uuid: `Compendium.${pack.collection}.${moveData._id}`,
                    source: sourceSlug,
                    category: moveData.system.category,
                    damageBase: isNaN(db) ? 0 : db,
                    moveType: moveData.system.type,
                    range: moveData.system.range,
                    keywords: moveData.system.keywords
                })
            }
        }

        this.indexData = moves;

        // Set filters if necessary
        this.filterData.checkboxes.source.options = this.generateSourceCheckboxOptions(sources);
        this.filterData.multiselects.keywords.options = this.filterOptionsFromSet(allKeywordsSeen)
    }

    filterIndexData(entry) {
        const { selects, multiselects, checkboxes } = this.filterData;

        if(checkboxes.source.selected.length) {
            if(!checkboxes.source.selected.includes(entry.source)) return false;
        }

        if (selects.type.selected) {
            if(sluggify(entry.moveType) !== selects.type.selected) return false;
        }
        if(selects.category.selected) {
            if(sluggify(entry.category) !== selects.category.selected) return false;
        }

        if(!this.isEntryHonoringMultiselect(multiselects.keywords, entry.keywords)) return false;

        return true;
    }

    sortResult(result) {
        const { order } = this.filterData;
        const lang = game.i18n.lang;
        const sorted = result.sort((a, b) => {
            switch(order.by) {
                case "name": {
                    return a.name.localeCompare(b.name, lang);
                }
                case "damageBase": {
                    if(a.damageBase === b.damageBase) return a.name.localeCompare(b.name, lang);
                    return a.damageBase - b.damageBase;
                }
                case "type": {
                    if(a.moveType === b.moveType) return a.name.localeCompare(b.name, lang);
                    return a.moveType.localeCompare(b.moveType, lang);
                }
                case "category": {
                    if(a.category === b.category) return a.name.localeCompare(b.name, lang);
                    return a.category.localeCompare(b.category, lang);
                }
                default: return 0;
            }
        });
        return order.direction === "asc" ? sorted : sorted.reverse();
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
            selects: {
                type: {
                    isExpanded: false,
                    label: "PTU.CompendiumBrowser.FilterOptions.MoveType",
                    options: Object.keys(CONFIG.PTU.data.typeEffectiveness).reduce((acc, type) => ({
                        ...acc,
                        [sluggify(type)]: type
                    }), {}),
                    selected: ""
                },
                category: {
                    isExpanded: false,
                    label: "PTU.CompendiumBrowser.FilterOptions.Category",
                    options: {
                        physical: "Physical",
                        special: "Special",
                        status: "Status"
                    },
                    selected: ""
                },
            },
            multiselects: {
                keywords: {
                    conjunction: "and",
                    label: "PTU.CompendiumBrowser.FilterOptions.Keywords",
                    options: [],
                    selected: []
                }
            },
            order: {
                by: "name",
                direction: "asc",
                options: {
                    name: "PTU.CompendiumBrowser.FilterOptions.Name",
                    damageBase: "PTU.CompendiumBrowser.FilterOptions.DamageBase",
                    type: "PTU.CompendiumBrowser.FilterOptions.MoveType",
                    category: "PTU.CompendiumBrowser.FilterOptions.Category"
                }
            },
            search: {
                text: ""
            }
        }
    }
} 