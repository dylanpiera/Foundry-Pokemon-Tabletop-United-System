import { sluggify } from "../../../../util/misc.js";
import { CompendiumBrowserTab } from "./base.js";

export class CompendiumBrowserSpeciesTab extends CompendiumBrowserTab {
    constructor(browser) {
        super(browser);

        this.searchFields = ["name"]
        this.storeFields = ["name", "uuid", "type", "source", "img", "types", "number"];

        this.index = ["system.source.value", "system.types", "system.number"];

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

                species.push({
                    name: speciesData.name,
                    type: speciesData.type,
                    img: this.#getImagePath(speciesData.name, speciesData.system.number),
                    uuid: `Compendium.${pack.collection}.${speciesData._id}`,
                    source: sourceSlug,
                    types: speciesData.system.types,
                    number: isNaN(number) ? Infinity : number
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

    filterIndexData(entry) {
        const { checkboxes, multiselects } = this.filterData;

        if(checkboxes.source.selected.length) {
            if(!checkboxes.source.selected.includes(entry.source)) return false;
        }

        const selected = multiselects.types.selected.filter(s => !s.not).map(s => s.value);
        const notSelected = multiselects.types.selected.filter(s => s.not).map(s => s.value);
        if(selected.length || notSelected.length) {
            if(notSelected.some(s => entry.types.some(t => sluggify(t) === s))) return false;
            const fulfilled = 
                multiselects.types.conjunction === "and"
                    ? selected.every(s => entry.types.some(t => sluggify(t) === s))
                    : selected.some(s => entry.types.some(t => sluggify(t) === s));
            if(!fulfilled) return false;
        }

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
                    options: Object.keys(CONFIG.PTU.data.typeEffectiveness).map(type => ({value: sluggify(type), label: type})),
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