import { sluggify } from "../../../../util/misc.js";
import { CompendiumBrowserTab } from "./base.js";

export class CompendiumBrowserFeatsTab extends CompendiumBrowserTab {
    constructor(browser) {
        super(browser);

        this.searchFields = ["name", "prerequisites.label", "prerequisites.tier", "class"]
        this.storeFields = ["name", "uuid", "type", "source", "img", "prerequisites", "class"];

        this.index = ["img", "system.source.value", "system.prerequisites", "system.class"];

        this.filterData = this.prepareFilterData();
    }

    get tabName() {
        return "feats"
    }

    get templatePath() {
        return "systems/ptu/static/templates/apps/compendium-browser/partials/feats.hbs"
    }

    async loadData() {
        const feats = [];
        const indexFields = foundry.utils.duplicate(this.index);
        const sources = new Set();

        const classes = new Set();
        const featNames = new Set();

        for await (const { pack, index } of this.browser.packLoader.loadPacks(
            "Item",
            this.browser.loadedPacks(this.tabName),
            indexFields
        )) {
            for (const featData of index) {
                if (featData.type !== "feat") continue;
                if (!this.hasAllIndexFields(featData, indexFields)) continue;

                const source = featData.system.source?.value ?? "";
                const sourceSlug = sluggify(source);
                if (source) sources.add(source);

                const isClass = featData.img.includes("class");
                const _class = isClass ? featData.name.trim(): (featData.system.class?.trim() ?? "");
                const prerequisites = featData.system?.prerequisites ?? "";

                feats.push({
                    name: featData.name,
                    type: featData.type,
                    img: featData.img,
                    uuid: `Compendium.${pack.collection}.${featData._id}`,
                    source: sourceSlug,
                    prerequisites: this.#prerequisitesStringToEntries(prerequisites),
                    class: sluggify(_class),
                    classPretty: _class,
                })
                if (_class) classes.add(_class);

                featNames.add(featData.name);
            }
        }

        for (const feat of feats) {
            const prereqs = [];
            for (const prereq of feat.prerequisites) {
                if (classes.has(prereq.label.toLowerCase().capitalize())) {
                    feat.class ||= prereq.label;
                    continue;
                }
                if (featNames.has(prereq.label)) prereq.feat = true;
                prereqs.push(prereq);
            }
            feat.prerequisites = prereqs;
        }

        this.indexData = feats;

        // Set filters if necessary
        this.filterData.checkboxes.class.options = this.#generateCheckboxOptions([...classes].sort());
        this.filterData.checkboxes.source.options = this.generateSourceCheckboxOptions(sources);
    }

    #prerequisitesStringToEntries(prerequisites) {
        const tiers = new Set(["untrained", "novice", "adept", "expert", "master"]);

        const entries = [];
        for (const prereq of prerequisites) {
            let tierFound = false;
            const entry = prereq.split(" ").map(p => p.trim()).reduce((acc, curr) => {
                if (!tierFound && tiers.has(curr.toLowerCase())) {
                    acc.tier = curr;
                    acc.label = acc.label ? `${curr} ${acc.label}` : curr;
                    tierFound = true;
                } else {
                    acc.label = acc.label ? `${acc.label} ${curr}` : curr;
                }
                return acc;
            }, { label: "", tier: "" });

            if (entry.label) entries.push(entry);
        }

        return entries;
    }

    #generateCheckboxOptions(classSet) {
        return classSet.reduce((result, _class) => ({
            ...result,
            [sluggify(_class)]: {
                label: _class,
                selected: false
            }
        }), {});
    }

    filterIndexData(entry) {
        const { checkboxes } = this.filterData;

        if (checkboxes.source.selected.length) {
            if (!checkboxes.source.selected.includes(entry.source)) return false;
        }

        // Class
        if (checkboxes.class.selected.length) {
            if (!checkboxes.class.selected.includes(entry.class.toLowerCase())) return false;
        }

        return true;
    }

    prepareFilterData() {
        return {
            checkboxes: {
                class: {
                    isExpanded: false,
                    label: "PTU.CompendiumBrowser.FilterOptions.Class",
                    options: {},
                    selected: []
                },
                // skills: {
                //     isExpanded: false,
                //     label: "PTU.CompendiumBrowser.FilterOptions.Skills",
                //     options: CONFIG.PTU.data.skills.keys.reduce((result, skill) => ({ ...result, [skill.toLowerCase()]: { label: skill, selected: false } }), {}),
                //     selected: []
                // },
                source: {
                    isExpanded: false,
                    label: "PTU.CompendiumBrowser.FilterOptions.Source",
                    options: {},
                    selected: []
                }
            },
            order: {
                by: "class",
                direction: "asc",
                options: {
                    class: "PTU.CompendiumBrowser.FilterOptions.Class",
                    name: "PTU.CompendiumBrowser.FilterOptions.Name"
                }
            },
            search: {
                text: ""
            }
        }
    }

    // const skills = new Set(['acrobatics', 'athletics', 'charm', 'combat', 'command', 'generalEd', 'generalEducation', 'medicineEd', 'medicineEducation', 'occultEd', 'occultEducation', 'pokemonEd', 'pokemonEducation', 'pokémonEducation', 'techEd', 'technologyEducation', 'focus', 'guile', 'intimidate', 'intuition', 'perception', 'stealth', 'survival']);

    // const entries = [];
    // const statements = prerequisites.split(",").map(s => s.trim());
    // let lastTier = "";
    // for (let statement of statements) {
    //     if (entries.length === 3) {
    //         entries.push({ label: "..." })
    //         break;
    //     }

    //     if(statement.trim() === "or") continue;

    //     const splits = statement.split(" ").map(s => s.trim());
    //     const tier = splits.at(0);
    //     const skill = splits.slice(1).join(" ");
    //     const tierSlug = sluggify(tier ?? "", { camel: "dromedary" });
    //     const skillSlug = sluggify(skill ?? "", { camel: "dromedary" });
    //     const isTierOr = tierSlug === "or";
    //     const skillIncludesOr = skill.includes("or");

    //     if (tiers.has(tierSlug) && skills.has(skillSlug)) {
    //         entries.push({ label: `${tier} ${skill}`, tier })
    //         lastTier = tier;
    //         continue;
    //     }
    //     else if (tierSlug && (tierSlug.length > 3 && (!skill || skillIncludesOr)) || isTierOr) {
    //         if (skills.has(isTierOr ? skillSlug : tierSlug) && lastTier.length > 0) {
    //             entries.at(-1).label += ` or ${isTierOr ? skill : statement}`;
    //             continue;
    //         }
    //     }

    //     const statementTier = statement.split(' ').find(word => tiers.has(sluggify(word ?? "", { camel: "dromedary" })));
    //     entries.push({ label: statement, tier: statementTier ?? "" })
    //     if(statementTier) {
    //         lastTier = statementTier;
    //         continue;
    //     }

    //     lastTier = "";
    // }
} 