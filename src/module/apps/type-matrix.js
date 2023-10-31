class TypeMatrix extends FormApplication {
    constructor(object, options) { 
        super(object, options);
        this.cache = {};
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes.push("ptu-settings-menu");

        return mergeObject(options, {
            title: "PTU.TypeMatrix.Title",
            template: "systems/ptu/static/templates/config/settings/types.hbs",
            id: "type-matrix",
            width: "auto",
            height: "auto",
            resizable: true,
            submitOnChange: false,
            closeOnSubmit: false,
        });
    }

    async getData() {
        const data = await super.getData();

        if (this.cache["types"] === undefined) {
            const types = game.settings.get("ptu", "type.typeEffectiveness") || this.constructor.settings.typeEffectiveness.default;
            this.cache["types"] = types;
        }

        const typeEffectiveness = duplicate(this.cache["types"]);
        delete typeEffectiveness.Untyped;

        let typeLength = Object.keys(typeEffectiveness).length + 1;
        if(!game.settings.get("ptu", "homebrew.nuclearType") && typeEffectiveness["Nuclear"]) typeLength--;
        if(!game.settings.get("ptu", "homebrew.shadowType") && typeEffectiveness["Shadow"]) typeLength--;

        return {
            ...data,
            typeEffectiveness,
            types: Object.keys(this.cache["types"].Untyped.effectiveness),
            typeLength,
            readOnly: true
        }
    }

    activateListeners($html) {
        $html.find(".type").on("mouseover", event => {
            const { offensive, defensive } = event.currentTarget.dataset;
            if (!offensive || !defensive) return;

            $html.find(`.type[data-offensive="${offensive}"]`).addClass("highlight-x");
            $html.find(`.type[data-defensive="${defensive}"]`).addClass("highlight-y");
        });

        $html.find(".type").on("mouseout", event => {
            const { offensive, defensive } = event.currentTarget.dataset;
            if (!offensive || !defensive) return;

            $html.find(`.type[data-offensive="${offensive}"]`).removeClass("highlight-x");
            $html.find(`.type[data-defensive="${defensive}"]`).removeClass("highlight-y");
        });
    }
}

export { TypeMatrix }