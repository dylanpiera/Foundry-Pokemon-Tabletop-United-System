import {TypeSettings} from "../system/settings/types.js";

class TypeMatrix extends TypeSettings {
    static namespace = "typeMatrix";
    constructor(object, options) {
        super(object, options);
        this.cache = {};
    }

    static registerSettings(){
    }
    static get settings(){
        return {};
    }

    static get SETTINGS() {
        return Object.keys(TypeSettingsConfig);
    }
    static get defaultOptions() {
        const options = super.defaultOptions;

        return mergeObject(options, {
            width: 777,
            height: 807,
            resizable: true,
            title: "Type Matrix",
            id: "type-matrix",
            submitOnChange: false,
            closeOnSubmit: false,
        });
    }

    async getData() {
        const data = mergeObject((await super.getData()));

        return {
            ...data,
            readOnly: true
        }
    }

    activateListeners($html) {
        super.activateListeners($html);
        $html.find(".type").on("click", "**");
        $html.find(".type").on("contextmenu", "**");
        $html.find("button[type='add']").on("click", "**");
        $html.find(".type[data-type]").on("dblclick", "**");

    }

    async _onReset(event) {
        throw new Error("The readOnly viewer should not be able to call _onReset().");
    }
    async _updateObject(event, data) {
        throw new Error("The readOnly viewer should not be able to call _updateObject().");
    }
    async createTypeDialog(typeData, exists = false) {
        throw new Error("The readOnly viewer should not be able to call createTypeDialog().");
    }
}

export {TypeMatrix}