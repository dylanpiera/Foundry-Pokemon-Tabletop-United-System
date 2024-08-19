import { findItemInCompendium, querySpeciesCompendium } from "../../../util/misc.js"

export class SpeciesGeneratorData {
    constructor() {
        this.speciesTab = "species";
        this.amount = 20;
        this.species = undefined;
        this.speciesField = {
            value: "",
            updated: false
        };
        this.table = undefined;
        this.tableSelect = {
            value: undefined,
            updated: false,
            options: game.tables.map(t => ({ label: t.name, value: t.uuid }))
        }
        if (this.tableSelect.options?.length > 0) {
            this.tableSelect.value = this.tableSelect.options[0].value;
            this.tableSelect.updated = true;
        }
        this.folder = undefined;
        this.folderField = {
            value: "",
            updated: false,
        }
        this.level = {
            min: game.settings.get("ptu", "generation.defaultDexDragInLevelMin") ?? 0,
            max: game.settings.get("ptu", "generation.defaultDexDragInLevelMax") ?? 0
        }
        this.helpText = {
            species: undefined,
            table: undefined,
            folder: undefined
        }
    }

    async refresh() {
        if (this.speciesField.updated) {
            if (this.speciesField.value.includes("Item.")) {
                this.species = await fromUuid(this.speciesField.value);
            }
            else if (!isNaN(Number(this.speciesField.value))) {
                this.species = (await querySpeciesCompendium((species) => species.system.number == Number(this.speciesField.value))).find(s => !s.system.form);
            }
            else {
                this.species = await (async () => {
                    const compendiums = Object.entries(game.settings.get("ptu", "compendiumBrowserPacks")?.species ?? { "ptu.species": { load: true } }).filter(([k, v]) => v.load).map(([k, v]) => k);
                    for (const compendium of compendiums) {
                        const result = await findItemInCompendium({ type: "species", name: this.speciesField.value, compendium });
                        if (result) return result;
                    }
                })()
            }
            this.speciesField.updated = false;
        }
        if (this.tableSelect.updated) {
            if (!isNaN(Number(this.tableSelect.value))) {
                this.table = game.tables.get(this.tableSelect.value);
            }
            else if (this.tableSelect.value.includes("RollTable.")) {
                this.table = await fromUuid(this.tableSelect.value);
            }
            this.tableSelect.updated = false;
        }
        if (this.folderField.updated) {
            if (this.folderField.value.includes("Item.")) {
                const result = await fromUuid(this.folderField.value);
                this.folder = result ? result.type == "Actor" ? result : "invalid" : undefined;
            }
            else if (!isNaN(Number(this.folderField.value))) {
                const result = game.folders.get(this.folderField.value);
                this.folder = result ? result.type == "Actor" ? result : "invalid" : undefined;
            }
            else {
                this.folder = game.folders.find(f => f.name == this.folderField.value && f.type == "Actor");
            }
            this.folderField.updated = false;
        }

        if (this.tableSelect.options?.length == 0) {
            await game.packs.get("ptu.habitats").importAll()
            this.tableSelect.options = game.tables.map(t => ({ label: t.name, uuid: t.uuid }))
            if (this.tableSelect.options?.length > 0) {
                this.tableSelect.value = this.tableSelect.options[0].uuid;
                this.tableSelect.updated = true;
            }
        }

        if (this.species) {
            this.helpText.species = `<span>${game.i18n.localize("PTU.MassGenerator.FoundSpecies")} <span class="linked-item">@UUID[${this.species.uuid}]</span></span>`
        }
        else if (this.speciesField.value) {
            this.helpText.species = `<span>${game.i18n.format("PTU.MassGenerator.CouldNotFindSpecies", { species: this.speciesField.value })}</span>`
        }

        if (this.table) {
            this.helpText.table = `<span>${game.i18n.localize("PTU.MassGenerator.FoundTable")} <span class="linked-item">@UUID[${this.table.uuid}]</span></span>`
        }
        else if (this.tableSelect.value) {
            this.helpText.table = `<span>${game.i18n.format("PTU.MassGenerator.CouldNotFindTable", { table: this.tableSelect.value })}</span>`
        }

        if (this.folder == "invalid") {
            this.helpText.folder = `<span>${game.i18n.localize("PTU.MassGenerator.InvalidFolder")}</span>`
        }
        else if (this.folder) {
            this.helpText.folder = `<span>${game.i18n.localize("PTU.MassGenerator.FoundFolder")} <span class="linked-item">@UUID[${this.folder.uuid}]</span></span>`
        }
        else if (this.folderField.value) {
            this.helpText.folder = `<span>${game.i18n.format("PTU.MassGenerator.CouldNotFindFolder", { folder: this.folderField.value })}</span>`
        }
    }

    async finalize() {
        const data = {
            folder: this.folder ?? this.folderField.value,
            level: this.level,
            amount: this.amount,
        }

        if (this.speciesTab == "species") {
            data.species = this.species;
        }
        else {
            data.table = this.table;
        }

        return data;
    }
}