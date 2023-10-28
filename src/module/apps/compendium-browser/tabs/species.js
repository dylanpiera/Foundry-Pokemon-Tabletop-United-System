import { sluggify } from "../../../../util/misc.js";
import { CompendiumBrowserTab } from "./base.js";
import {MOVES_COMPENDIUM_INDEX} from "./moves.js";
import {ABILITIES_COMPENDIUM_INDEX} from "./abilities.js";

export class CompendiumBrowserSpeciesTab extends CompendiumBrowserTab {
    constructor(browser) {
        super(browser);

        this.searchFields = ["name"]
        this.storeFields = ["name", "uuid", "type", "source", "img", "types", "number", "moves", "abilities"];

        this.index = ["system.source.value", "system.types", "system.number", "system.moves", "system.abilities"];

        this.filterData = this.prepareFilterData();
    }

    get tabName() {
        return "species"
    }

    get templatePath() {
        return "systems/ptu/static/templates/apps/compendium-browser/partials/species.hbs"
    }

    async loadData() {
        const species = [];
        const indexFields = duplicate(this.index);
        const sources = new Set();

        for await (const { pack, index } of this.browser.packLoader.loadPacks(
            "Item",
            this.browser.loadedPacks(this.tabName),
            indexFields
        )) {
            for (const speciesData of index) {
                if (speciesData.type !== "species") continue;
                if (!this.hasAllIndexFields(speciesData, indexFields)) continue;

                const source = speciesData.system.source?.value ?? "";
                const sourceSlug = sluggify(source);
                if (source) sources.add(source);

                if(!Array.isArray(speciesData.system.types) || speciesData.system.types.length === 0) {
                    console.warn(`Species ${speciesData.name} (${speciesData._id}) has no types!`);
                    continue;
                }

                const number = Number(speciesData.system.number)

                const moveLearnOrigins = ["egg", "tutor", "level", "machine"]
                // Looking at species in the compendium, even if they do not have egg moves for example,
                // they have an empty array as its value. Let's assume this is supposed to stay this way...
                if (moveLearnOrigins.some(o => !Array.isArray(speciesData.system.moves[o]))
                ) {
                    console.warn(`Species ${speciesData.name} (${speciesData._id}) has no valid move structure!`);
                    continue;
                }

                const moves = new Set(moveLearnOrigins.map(o => speciesData.system.moves[o]).flat(1).map(m => m.slug))

                const abilityRanks = ["basic", "advanced", "high"]
                if (abilityRanks.some(o => !Array.isArray(speciesData.system.abilities[o]))
                ) {
                    console.warn(`Species ${speciesData.name} (${speciesData._id}) has no valid ability structure!`);
                    continue;
                }

                const abilities = new Set(abilityRanks.map(r => speciesData.system.abilities[r]).flat(1).map(a => a.slug))

                species.push({
                    name: speciesData.name,
                    type: speciesData.type,
                    img: this.#getImagePath(speciesData.name, speciesData.system.number),
                    uuid: `Compendium.${pack.collection}.${speciesData._id}`,
                    source: sourceSlug,
                    types: speciesData.system.types,
                    number: isNaN(number) ? Infinity : number,
                    moves: moves,
                    abilities: abilities
                })
            }
        }

        this.indexData = species;

        // Set filters if necessary
        this.filterData.checkboxes.source.options = this.generateSourceCheckboxOptions(sources);
        if(this.filterData.checkboxes.source.options["ptr-core-dex"]) {
            this.filterData.checkboxes.source.options["ptr-core-dex"].selected = true;
            this.filterData.checkboxes.source.selected.push("ptr-core-dex");
        }

        this.filterData.multiselects.moves.options = this.filterOptionsFromNameList(await this.loadForeignItemsNamesOnly("move", "moves", MOVES_COMPENDIUM_INDEX))
        this.filterData.multiselects.abilities.options = this.filterOptionsFromNameList(await this.loadForeignItemsNamesOnly("ability", "abilities", ABILITIES_COMPENDIUM_INDEX))
    }


    async loadForeignItemsNamesOnly(itemType, itemTabName, itemCompendiumIndex){
        const items = [];
        const indexFields = duplicate(itemCompendiumIndex);

        for await (const {pack, index} of this.browser.packLoader.loadPacks(
            "Item",
            this.browser.loadedPacks(itemTabName),
            indexFields
        )) {
            for (const itemData of index) {
                if (itemData.type !== itemType) continue;
                if (!this.hasAllIndexFields(itemData, indexFields)) continue;

                items.push({
                    name: itemData.name,
                })
            }
        }
        return items
    }
    filterOptionsFromNameList(names){
        return names.map(m => ({value:sluggify(m.name), label: m.name})).sort((a,b) => (``+a.label).localeCompare(b.label))
    }
    #getImagePath(speciesName, speciesNumber) {
        const path = game.settings.get("ptu", "generation.defaultImageDirectory");
        const useName = game.settings.get("ptu", "generation.defaultPokemonImageNameType");
        const extension = game.settings.get("ptu", "generation.defaultImageExtension")

        return `${path.startsWith('/') ? "" : "/"}${path}${path.endsWith('/') ? "" : "/"}${useName ? sluggify(speciesName) : Handlebars.helpers.lpad(speciesNumber, 3, 0)}${extension.startsWith('.') ? "" : "."}${extension}`;
    }

    generateSourceCheckboxOptions(sources) {
        return [...sources].sort(this.#sortSources).reduce(
            (result,source) => ({
                ...result,
                [sluggify(source)]: {
                    label: source,
                    selected: source === "PTR Core Dex" ? true : false
                }
            }),
            {}
        )
    }

    #sortSources(a,b) {
        // If the source is a PTR Source (starts with PTR), it should be at the top of the list
        if(a.startsWith("PTR") && !b.startsWith("PTR")) return -1;
        if(b.startsWith("PTR") && !a.startsWith("PTR")) return 1;
        // Otherwise sort regularly
        return a.localeCompare(b, game.i18n.lang);
    }

    /**
     @param multiselectFilter - the `selected` from a filter, e.g. `filterData.multiselects.types`
     @param entrySetToCheck - the set of an entry corresponding to the filter, e.g. `entry.types`
     @return {boolean} - True if the entry honors the filter, i.e. would be valid result
     */
    entryHonorsMultiselect(multiselectFilter, entrySetToCheck){
        const selected = multiselectFilter.selected.filter(s => !s.not).map(s => s.value);
        const notSelected = multiselectFilter.selected.filter(s => s.not).map(s => s.value);
        if (selected.length || notSelected.length) {
            if (notSelected.some(ns => entrySetToCheck.some(e => sluggify(e) === ns))) return false;
            const fulfilled =
                multiselectFilter.conjunction === "and"
                    ? selected.every(s => entrySetToCheck.some(e => sluggify(e) === s))
                    : selected.some(s => entrySetToCheck.some(e => sluggify(e) === s));
            if(!fulfilled) return false;
        }
        return true;
    }
    filterIndexData(entry) {
        const { checkboxes, multiselects } = this.filterData;

        if(checkboxes.source.selected.length) {
            if(!checkboxes.source.selected.includes(entry.source)) return false;
        }

        if (! this.entryHonorsMultiselect(multiselects.types, entry.types)) return false;
        if (! this.entryHonorsMultiselect(multiselects.moves, entry.moves)) return false;
        if (! this.entryHonorsMultiselect(multiselects.abilities, entry.abilities)) return false;

        return true;
    }

    prepareFilterData() {
        return {
            checkboxes: {
                source: {
                    isExpanded: true,
                    label: "PTU.CompendiumBrowser.FilterOptions.Source",
                    options: {},
                    selected: []
                }
            },
            multiselects: {
                types: {
                    conjunction: "and",
                    label: "PTU.CompendiumBrowser.FilterOptions.MoveType",
                    options: Object.keys(CONFIG.PTU.data.typeEffectiveness).map(type => ({value: sluggify(type), label: type})).sort((a,b) => (``+a.label).localeCompare(b.label)),
                    selected: []
                },
                moves: {
                    conjunction: "and",
                    label: "PTU.CompendiumBrowser.FilterOptions.LearnableMoves",
                    options: [],
                    selected: []
                },
                abilities: {
                    conjunction: "and",
                    label: "PTU.CompendiumBrowser.FilterOptions.Abilities",
                    options: [],
                    selected: []
                },
            },
            // selects: {
            //     form: {
            //         isExpanded: false,
            //         label: "PTU.CompendiumBrowser.FilterOptions.HasForm",
            //         options: {"yes": "Yes", "no": "No"},
            //         selected: ""
            //     },
            // },
            order: {
                by: "number",
                direction: "asc",
                options: {
                    name: "PTU.CompendiumBrowser.FilterOptions.Name",
                    number: "PTU.CompendiumBrowser.FilterOptions.Number",
                }
            },
            search: {
                text: ""
            }
        }
    }
}
