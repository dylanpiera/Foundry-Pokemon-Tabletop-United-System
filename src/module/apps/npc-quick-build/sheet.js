import { NpcQuickBuildData } from "./document.js";
// import {tagify} from "../../../util/tags.js";

export class PTUNpcQuickBuild extends FormApplication {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["ptu", "pokemon", "npc-quick-build"],
            template: "systems/ptu/static/templates/apps/npc-quick-build-sheet.hbs",
            width: 550,
            height: "auto",
            title: "NPC Quick Build",
            submitOnChange: true,
            submitOnClose: true,
            closeOnSubmit: false,
            dragDrop: [{ dragSelector: undefined, dropSelector: undefined }]
        });
    }

    constructor(options) {
        super(options);

        this.data = new NpcQuickBuildData();
    }

    /** @override */
    getData() {
        const data = super.getData();

        const allianceOptions = {
            party: "PTU.Alliance.Party",
            opposition: "PTU.Alliance.Opposition",
            neutral: "PTU.Alliance.Neutral"
        };


        return {
            ...data,
            config: CONFIG.PTU.data,
            allianceOptions,
            data: this.data,
        }
    }

    /** @override */
    activateListeners($html) {
        super.activateListeners($html);

        // next/prev page listeners
        $html.find('.next-page').on('click', (event) => {
            event.preventDefault();
            this.data.page = parseInt($html.get(0)?.dataset?.page || "0") + 1;
            this.render(true);
        });
        $html.find('.prev-page').on('click', (event) => {
            event.preventDefault();
            this.data.page = parseInt($html.get(0)?.dataset?.page || "2") - 1;
            this.render(true);
        });

        for (const multiselect of $html.find('.ptu-tagify[data-filter-name]')) {
            // await tagify(element);
            const data = this.data.multiselects[multiselect.dataset.filterName];
            const savePath = multiselect.name;

            const tagify = new Tagify(multiselect, {
                enforceWhitelist: !multiselect.matches(".trainer-gender"),
                keepInvalidTags: false,
                editTags: false,
                tagTextProp: "label",
                dropdown: {
                    enabled: 0,
                    fuzzySearch: false,
                    mapValueTo: "label",
                    maxItems: data.options.length,
                    searchKeys: ["label"],
                },
                whitelist: data.options,
                maxTags: data.maxTags,
            });

            // // Add the name to the tags html as an indicator for refreshing
            // if (multiselect.name) {
            //     tagify.DOM.scope.dataset.name = multiselect.name;
            // }

            // tagify.on("click", (event) => {
            //     const target = event.detail.event.target;
            //     if (!target) return;

            //     const value = event.detail.data.value;
            //     const selected = data.selected.find((s) => s.value === value);
            //     if (selected) {
            //         const current = !!selected.not;
            //         selected.not = !current;
            //         this.render();
            //     }
            // });
            tagify.on("change", (event) => {
                event.preventDefault();

                const selections = JSON.parse(event.detail.value || "[]");
                const isValid =
                    Array.isArray(selections) &&
                    selections.every((s) => typeof s === "object" && typeof s["value"] === "string");

                if (isValid && savePath) {
                    foundry.utils.setProperty(this.data, savePath, selections);
                    this.render();
                }
            });
        }

        // $html.find('.tab-button').on('click', (event) => {
        //     event.preventDefault();

        //     this.data.speciesTab = event.currentTarget.dataset.tab;
        //     this.render(true);
        // });

        // $html.find("#tableSelect").on("change", (event) => {
        //     this.data.tableSelect.value = event.currentTarget.value;
        //     this.data.tableSelect.updated = true;

        //     this.render(true);
        // });

        $html.find("input[type='submit']").on("click", (event) => {
            event.preventDefault();
            if (this.data.ready) {
                this.close({ properClose: true });
            }
        });
    }

    async preload() {
        return this.data.preload();
    }


    /** 
     * @override 
     * Tagify sets an empty input field to "" instead of "[]", which later causes the JSON parse to throw an error
    */
    async _onSubmit(event, {updateData = null, preventClose = false, preventRender = false} = {}) {
        const $form = $(this.form);
        $form.find("tags ~ input[data-dtype='JSON']").each((_i, input) => {
            if (input.value === "") input.value = "[]";
        });

        return super._onSubmit(event, { updateData, preventClose, preventRender });
    }


    /** @override */
    async _updateObject(event, formData) {
        event.preventDefault();
        for (const [key, value] of Object.entries(formData)) {
            if (!key) continue;
            foundry.utils.setProperty(this.data, key, value);
        }

        return this.render(true);
    }

    async _onDrop(event) {
        // const data = JSON.parse(event.dataTransfer.getData('text/plain'));

        // if (data.type == "Item") {
        //     const item = await fromUuid(data.uuid);
        //     if (item.type != "species") return;

        //     this.data.speciesField.value = data.uuid;
        //     this.data.speciesField.updated = true;
        // }
        // else if (data.type == "RollTable") {
        //     this.data.tableSelect.value = data.uuid
        //     this.data.tableSelect.updated = true;
        // }
        // else if (data.type == "Folder") {
        //     this.data.folderField.value = data.uuid;
        //     this.data.folderField.updated = true;
        // }

        return this.render(true);
    }

    /** @override */
    render(force = false, options = {}) {
        const localthis = this;
        this.data.refresh().then(() => localthis._render(force, options)).catch(err => {
            this._state = Application.RENDER_STATES.ERROR;
            Hooks.onError("Application#render", err, {
                msg: `An error occurred while rendering ${this.constructor.name} ${this.appId}`,
                log: "error",
                ...options
            });
        });
        return this;
    }

    /** @override */
    // async _renderInner(data) {
    //     const $html = await super._renderInner(data);
    //     return $html;
    // }

    /** @override */
    async close(options) {
        if (options?.properClose) {
            await this.data.finalize().then(()=>this.data.generate());
        }

        return super.close({ ...options, force: true });
    }

}