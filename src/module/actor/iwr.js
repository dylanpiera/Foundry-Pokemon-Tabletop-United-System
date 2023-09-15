import { PTUPredicate } from "../system/index.js";

class IWRData {
    constructor({type, value, source, isDefensive = false}) {
        this.type = type?.toLocaleLowerCase(game.i18n.locale);
        this.value = value;
        this.source = source ?? null;
        this.isDefensive = isDefensive;
        this.predicate = new PTUPredicate(this.describe(this.type))
    }

    get label() {
        return this.typeLabel;
    }

    get typeLabel() {
        const label = game.i18n.localize(`PTU.Type.${this.type}`);
        return label.startsWith("PTU.Type.") ? Handlebars.helpers.capitalize(this.type) : label;
    }

    describe(iwrType) {
        switch(iwrType) {
            case "critical-hit": return ["damage:component:critical"];
            case "effect-damage": return ["damage:component:effect"];
            default: return ["damage:type:"+this.type];
        }
    }

    toObject() {
        return {
            type: this.type,
            source: this.source,
            label: this.label,
            value: this.value
        }
    }

    test(statements) {
        // Test for ignoring defensive abilities
        if(this.isDefensive) {
            if(statements.some(s => s == "origin:ignores:defensive" )) return false;
        }

        return this.predicate.test(statements);
    }
}

class ImmunityData extends IWRData {
    constructor({type, source}) {
        super({type, value: 0, source})
    }
}

class WeaknessData extends IWRData {

}

class ResistanceData extends IWRData {

}

export { IWRData, ImmunityData, WeaknessData, ResistanceData }