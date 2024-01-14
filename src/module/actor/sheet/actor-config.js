class ActorConfig extends DocumentSheet {
    /** @override */
    get title() {
        return game.i18n.format("PTU.Configure", {name: this.actor.name});
    }

    /**
     * @param {PTUActor} actor
     */
    get actor() {
        return this.object;
    }

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
			template: 'systems/ptu/static/templates/config/actor-config-sheet.hbs',
			width: 450
		});
    }

    /** @override */
    async getData(options={}) {
        const data = super.getData(options);

        const alliance = this.actor._source.system?.alliance === null ? "neutral" : this.actor._source.system?.alliance ?? "default";
        const defaultValue = game.i18n.localize("PTU.Alliance." + (this.actor.hasPlayerOwner ? "Party" : "Opposition"));
        const allianceOptions = {
            default: game.i18n.format("PTU.Alliance.Default", {alliance: defaultValue}),
            party: game.i18n.localize("PTU.Alliance.Party"),
            opposition: game.i18n.localize("PTU.Alliance.Opposition"),
            neutral: game.i18n.localize("PTU.Alliance.Neutral")
        };

        return {
            ...data,
            alliance: alliance,
            allianceOptions: allianceOptions
        };
    }

    /** @override */
    async _updateObject(event, formData) {
        if(formData["flags.ptu.theme"]) formData["flags.ptu.theme"] = formData["flags.ptu.theme"].toLowerCase().replace('ball', '').trim();

        const alliance = formData["system.alliance"];
        if(alliance === "default") {
            delete formData["system.alliance"];
            formData["system.details.-=alliance"] = null;
        } else if (alliance === "neutral") {
            formData["system.alliance"] = null;
        } else if (!["party", "opposition"].includes(alliance)) {
            throw new Error("Invalid Alliance");
        }

        return super._updateObject(event, formData);
    }
}

export { ActorConfig }