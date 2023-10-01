class PTUSettingsMenu extends FormApplication {
    constructor(object, options) {
        super(object, options);
        this.cache = {};
    }

    static get namespace() {
        return "";
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes.push("ptu-settings-menu");

        return mergeObject(options, {
            title: `PTU.Settings.${this.namespace.titleCase()}.Name`,
            id: `${this.namespace}-settings`,
            template: `systems/ptu/static/templates/config/settings/menu.hbs`,
            width: 550,
            height: "auto",
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: "form" }],
            closeOnSubmit: false,
            submitOnChange: true,
        });
    }

    static get prefix() {
        return `${this.namespace}.`;
    }

    get namespace() {
        return this.constructor.namespace;
    }

    get prefix() {
        return this.constructor.prefix;
    }

    static get SETTINGS() {
        return []
    }

    static get settings() {
        return {}
    }

    static registerSettings() {
        const settings = this.settings;
        for (const setting of this.SETTINGS) {
            game.settings.register("ptu", `${this.prefix}${setting}`, {
                ...settings[setting],
                scope: "world",
                config: false
            })
        }
    }

    async getData() {
        const settings = this.constructor.settings;
        const templateData = settingsToSheetData(settings, this.cache, this.prefix)
        return mergeObject(await super.getData(), {
            settings: templateData,
            instructions: `PTU.Settings.${this.namespace.titleCase()}.Hint`
        })
    }

    activateListeners($html) {
        super.activateListeners($html);
        $html.find("button[name='reset']").on("click", this._onReset.bind(this));
    }

    async _onReset(event) {
        event.preventDefault();
        const settings = this.constructor.settings;
        for (const key of this.constructor.SETTINGS) {
            this.cache[key] = settings[key].default;
        }
        return this.render();
    }

    async _updateObject(event, data) {
        let requiresClientReload = false;
        let requiresWorldReload = false;
        const settings = this.constructor.settings;
        for (const key of this.constructor.SETTINGS) {
            const settingKey = `${this.prefix}${key}`;
            const value = data[key];
            this.cache[key] = value;
            if (event.type === "submit") {
                const current = game.settings.get("ptu", settingKey);
                if(current === value) continue;

                requiresClientReload ||= settings[key].scope === "client" && !!settings[key].requiresReload;
                requiresWorldReload ||= settings[key].scope !== "client" && !!settings[key].requiresReload;
                await game.settings.set("ptu", settingKey, value);
            }
        }
        if(requiresClientReload || requiresWorldReload) SettingsConfig.reloadConfirm({world: requiresWorldReload});

        if (event.type === "submit") {
            this.close();
        } else {
            this.render();
        }
    }

    _injectHTML($html) {
        super._injectHTML($html);

        // Initialize cache
        for (const key of this.constructor.SETTINGS) {
            const settingKey = `${this.prefix}${key}`;
            this.cache[key] = game.settings.get("ptu", settingKey);
        }
    }
}
function settingsToSheetData(settings, cache, prefix = "") {
    return Object.entries(settings).reduce((result, [key, setting]) => {
        const lookupKey = `${prefix}${key}`;
        const value = key in cache ? cache[key] : game.settings.get("ptu", lookupKey);
        cache[key] = value;
        result[key] = {
            ...setting,
            key,
            value,
            isSelect: !!setting.choices,
            isCheckbox: setting.type === Boolean,
            isText: setting.type === String,
            isNumber: setting.type === Number,
            filepicker: setting.type === String && setting.filePicker,
        }

        return result;
    }, {});
}

export { PTUSettingsMenu, settingsToSheetData }