import { sluggify } from "../../../../util/misc.js";
import { CompendiumBrowserTab } from "./base.js";

export const MOVES_COMPENDIUM_INDEX = ["img", "system.source.value", "system.type", "system.category", "system.damageBase"];

export class CompendiumBrowserMovesTab extends CompendiumBrowserTab {
    constructor(browser) {
        super(browser);

        this.searchFields = ["name"]
        this.storeFields = ["name", "uuid", "type", "source", "img", "moveType", "category", "damageBase"];

        this.index = duplicate(MOVES_COMPENDIUM_INDEX);

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
        const indexFields = duplicate(this.index);
        const sources = new Set();

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

                moves.push({
                    name: moveData.name,
                    type: moveData.type,
                    img: moveData.img,
                    uuid: `Compendium.${pack.collection}.${moveData._id}`,
                    source: sourceSlug,
                    category: moveData.system.category,
                    damageBase: isNaN(db) ? 0 : db,
                    moveType: moveData.system.type
                })
            }
        }

        this.indexData = moves;

        // Set filters if necessary
        this.filterData.checkboxes.source.options = this.generateSourceCheckboxOptions(sources);
    }

    filterIndexData(entry) {
        const { selects, checkboxes } = this.filterData;

        if(checkboxes.source.selected.length) {
            if(!checkboxes.source.selected.includes(entry.source)) return false;
        }

        if (selects.type.selected) {
            if(sluggify(entry.moveType) !== selects.type.selected) return false;
        }
        if(selects.category.selected) {
            if(sluggify(entry.category) !== selects.category.selected) return false;
        }

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