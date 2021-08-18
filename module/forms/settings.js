import { debug } from "../ptu.js";

export const PTUSettingCategories = [
    {id: "general", label: "General", icon: "fas fa-cogs"},
    {id: "combat", label: "Combat", icon: "fas fa-fist-raised", subtext: "Combat Rules & Preferences"},
    {id: "rules", label: "Rules", icon: "fas fa-book", subtext: "System rules, like which erratas to use."},
    {id: "generation", label: "Generation", icon: "fas fa-cogs", subtext: "Settings in regards to Pokémon Generation (through Dex-Dragin)"},
    {id: "preferences", label: "Player Preferences", icon: "fas fa-users", subtext: "These settings only apply to the current user.", settings: {}},
    {id: "other", label: "Other", icon: "fas fa-atlas"},
]

export class PTUSettings extends FormApplication {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["ptu", "settings"],
            template: "systems/ptu/templates/forms/settings.hbs",
            width: 800,
            height: "auto",
            title: "PTU Settings",
            tabs: [{ navSelector: ".settings-tabs", contentSelector: ".settings-body", initial: "general" }]
        });
    }

    static Initialize(html) {
        html.find('#ptu-options').append($(
            `<button data-action="ptu-settings">
                <i class="fas fa-cogs"></i>
                PTU Settings
            </button>`));

        html.find('button[data-action="ptu-settings"').on("click", _ => new PTUSettings().render(true));
    }

    /** @override */
    getData() {
        const data = super.getData();
        data.dtypes = ["String", "Number", "Boolean"];

        const canConfigure = game.user.can("SETTINGS_MODIFY");

        data.categories = game.ptu.settingCategories

        data.settings = {};
        for(const [key, setting] of game.settings.settings.entries()) {
            if(!key.toLowerCase().startsWith("ptu")) continue;
            if ( !setting.config || (!canConfigure && (setting.scope !== "client")) ) continue;

            const s = duplicate(setting);
            s.name = game.i18n.localize(s.name);
            s.hint = game.i18n.localize(s.hint);
            s.value = game.settings.get(s.module, s.key);
            s.type = setting.type instanceof Function ? setting.type.name : "String";
            s.isCheckbox = setting.type === Boolean;
            s.isSelect = s.choices !== undefined;
            s.isRange = (setting.type === Number) && s.range;

            if(s.scope == "client") {
                data.categories.find(x => x.id == "preferences").settings[key] = s;
            }
            
            data.settings[key] = s;
        }

        for(const category of data.categories) {
            if(category.id == "preferences") continue;
            category.settings = {};
            const filter = (category.id == "other") ? ((x) => x[1].category == category.id || x[1].category === undefined) : ((x) => x[1].category == category.id)
            for(const [key, setting] of Object.entries(data.settings).filter(filter)) {
                if(setting.scope == "client") continue;
                category.settings[key] = setting;
            }
        }

        data.categories = data.categories.filter(c => Object.keys(c.settings).length > 0);

        return data;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
    }

    /** @override */
    async _updateObject(event, formData) {
        for ( let [k, v] of Object.entries(flattenObject(formData)) ) {
            let s = game.settings.settings.get(k);
            let current = game.settings.get(s.module, s.key);
            if ( v !== current ) {
                await game.settings.set(s.module, s.key, v);
            }
        }
    }
}