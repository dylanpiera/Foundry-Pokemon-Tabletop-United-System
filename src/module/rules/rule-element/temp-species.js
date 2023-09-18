import { RuleElementPTU, isBracketedValue } from "./base.js";

export class TemporarySpeciesRuleElement extends RuleElementPTU {
    constructor(data, item, options = {}) {
        const { species, uuid } = data;
        super(data, item, options);

        if(typeof species === "object") {
            if(species instanceof CONFIG.PTU.Actor.documentClasses.pokemon) this.species = species;
            else if(species.type === "pokemon") this.species = Actor.create(species, {temporary: true});
        }

        if(!species && typeof uuid === "string") {
            this.uuid = uuid;
            this.species = fromUuidSync(uuid);
            if(!this.species.system && uuid.startsWith("Compendium.")) fromUuid(uuid).then(actor => this.species = actor);
        }
    }

    /** @override */
    beforePrepareData() {
        if(!this.species) return this.failValidation("Missing species field");
        this.actor.synthetics.speciesOverride.species = this.species;
    }
}