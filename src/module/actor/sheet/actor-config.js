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
        return mergeObject(super.defaultOptions, {
			template: 'systems/ptu/static/templates/config/actor-config-sheet.hbs',
			width: 450
		});
    }

    /** @override */
    async _updateObject(event, formData) {
        if(formData["flags.ptu.theme"]) formData["flags.ptu.theme"] = formData["flags.ptu.theme"].toLowerCase().replace('ball', '').trim();
        return super._updateObject(event, formData);
    }
}

export { ActorConfig }