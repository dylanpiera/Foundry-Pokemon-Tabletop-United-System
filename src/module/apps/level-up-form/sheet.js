import { LevelUpData } from "./document.js";

class LevelUpForm extends FormApplication {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["ptu", "pokemon", "level-up"],
            template: "systems/ptu/static/templates/apps/level-up-form.hbs",
            width: 560,
            height: "auto",
            title: "Level-Up Menu!",
            submitOnChange: true,
            submitOnClose : true,
            closeOnSubmit: false,
            dragDrop: [{ dropSelector: ".moves-dropzone"}, { dragSelector: ".ability .content-link", dropSelector: ".ability-header:has(.border.select)"}],
            resizable: true,
        });
    }

    constructor(pokemon, options) {
        super(pokemon, options);

        if(pokemon instanceof LevelUpData) {
            this.data = pokemon;
        }
        else {
            this.data = new LevelUpData(pokemon, options);
        }

        this.resolve = options.resolve;
        ui.windows[pokemon.sheet.appId]?.element?.css({"filter": "saturate(0.1) opacity(0.95)", "pointer-events": "none"})
    }

    /** @override */
    _canDragStart(selector) {
        return this.isEditable;
    }
    /** @override */
    _canDragDrop(selector) {
        return this.isEditable;
    }

    /** @override */
    getData() {
        const data = super.getData();
        
        return {
            ...data,
            data: this.data,
            cssClass: ``,
        };
    }

    /** @override */
    activateListeners($html) {
        super.activateListeners($html);

        $html.find('.stats .tooltip').tooltipster({
			theme: `tooltipster-shadow ball-themes ${this.ballStyle}`,
			position: 'top'
		});

        $html.find('.moves-dropzone').on('dragover', (event) => {
            event.preventDefault();
            event.currentTarget.classList.add("dragover");
        });

        $html.find('.moves-dropzone').on('dragleave', (event) => {
            event.preventDefault();
            if($(event.relatedTarget).closest(".moves-dropzone")[0] == event.currentTarget) return;
            event.currentTarget.classList.remove("dragover");
        });

        $html.find('#evolve-select').on('change', (event) => {
            event.preventDefault();
            if(event.currentTarget.value === this.data.evolutions.current.slug) return;
            const evolution = this.data.evolutions.available.find(e => e.slug == event.currentTarget.value);

            this.data.evolutions.current = evolution;
            this.render(true);
        });

        $html.find("button[type='submit']").on("click", () => this.close({properClose: true}));
    }

    /** @override */
    _onDragStart(event) {
        const li = event.currentTarget;
        const { category, type, uuid, slug} = li.parentElement.dataset;

        event.dataTransfer.setData('text/plain', JSON.stringify({
            uuid,
            slug,
            type,
            category
        }));
    }

    /** @override */
    async _onDrop(event) {
        const data = JSON.parse(event.dataTransfer.getData('text/plain'));
        $(event.currentTarget).removeClass("dragover");

        if(data.type == "Item" && data.uuid) {
            const zone = event.currentTarget?.dataset?.zone;
            if(!zone) return;

            if(zone == "known") {
                if(this.data.moves.known.find(m => m.uuid == data.uuid)) return;
                if(!this.data.moves.available.find(m => m.uuid == data.uuid)) return;
                this.data.moves.available.splice(this.data.moves.available.findIndex(m => m.uuid == data.uuid), 1);
                this.data.moves.known.push({uuid: data.uuid});
            }
            else if(zone == "available") {
                if(this.data.moves.available.find(m => m.uuid == data.uuid)) return;
                if(!this.data.moves.known.find(m => m.uuid == data.uuid)) return;
                this.data.moves.known.splice(this.data.moves.known.findIndex(m => m.uuid == data.uuid), 1);
                this.data.moves.available.push({uuid: data.uuid});
            }
            return this.render(true);
        }

        if(data.type == "ability" && data.uuid && data.category) {
            const zone = event.currentTarget?.dataset?.zone;
            if(!zone || event.currentTarget?.classList?.contains("locked")) return;

            let current;
            if(this.data.abilities.current[zone]?.uuid) {
                current = duplicate(this.data.abilities.current[zone]);
            }

            this.data.abilities.current[zone] = {uuid: data.uuid, category: data.category, slug: data.slug};

            this.data.abilities[data.category] = this.data.abilities[data.category].filter(a => a.uuid != data.uuid);
            if(current) this.data.abilities[current.category].push(current);
        }

        return this.render(true);
    }

    /** @override */
    async _updateObject(event, formData) {
        event.preventDefault();

        const data = expandObject(formData);

        for(const [stat, value] of Object.entries(data.stats)) {
            this.data.stats[stat].newLevelUp = value.newLevelUp;
        }

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
            ui.windows[this.data.pokemon.sheet.appId]?.element?.css({"filter": "", "pointer-events": ""})
        });
        return this;
    }

    /** @override */
    async _renderInner(data) {
        const $html = await super._renderInner(data);
        for(const element of $html.find('.linked-item')) {
            const parent = element.parentElement;
			await CONFIG.PTU.util.Enricher.enrichContentLinks(element);

            if(parent.classList.contains("locked")) {
                $(parent).children().attr("draggable", false)
            } 
        }
        return $html;
    }

    /** @override */
    async close(options) {
        if(options?.properClose) {
            this.resolve(await this.data.finalize());
        }
        this.resolve();

        ui.windows[this.data.pokemon.sheet.appId]?.element?.css({"filter": "", "pointer-events": ""})
        return super.close({...options, force: true});
    }
}

export { LevelUpForm }