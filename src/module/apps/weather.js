class Weather extends Application {
    /** @type {Map<string, CONFIG.PTU.Item.baseEffect>} */
    static globalEffects = new Map();

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["ptu", "weather"],
            title: "Weather",
            template: "systems/ptu/static/templates/apps/weather.hbs",
            width: 450,
            height: 300,
            resizable: true,
            dragDrop: [{ dragSelector: ".window-title", dropSelector: null }],
        });
    }

    static _initializeGlobalEffects() {
        const effects = game.settings.get("ptu", "weatherEffects");
        for (const effect of effects) {
            const item = new CONFIG.PTU.Item.proxy(effect, { temporary: true });
            const updates = {};
            if (item.system.mode === undefined) updates["system.mode"] = 'disabled';
            if (item.system.global === undefined) updates["system.global"] = true;
            item.updateSource(updates);
            Weather.globalEffects.set(item.id, item);
        }
    }

    constructor() {
        super();
        Weather._initializeGlobalEffects();
    }

    getData() {
        const data = super.getData();

        data.effects = [];
        for (const effect of Weather.globalEffects.values()) {
            data.effects.push({
                id: effect.id,
                name: effect.name,
                icon: effect.img,
                mode: effect.system.mode,
            });
        }

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find("select[name='mode']").on("change", this._onModeChange.bind(this));

        html.find(".item-control.effect-to-chat").on("click", (event) => {
            const effectId = event.target.closest(".effect").dataset.id;
            const effect = Weather.globalEffects.get(effectId);
            return effect?.sendToChat?.();
        });
        html.find(".item-control.effect-delete").on("click", (event) => {
            const effectId = event.target.closest(".effect").dataset.id;
            this.removeEffect(effectId);
        });
    }

    async _onModeChange(event) {
        const effectId = event.target.closest(".effect").dataset.id;
        const effect = Weather.globalEffects.get(effectId);
        if (!effect) return;

        effect.updateSource({ "system.mode": event.target.value });

        await game.settings.set("ptu", "weatherEffects", Array.from(Weather.globalEffects.values(), effect => effect.toObject()));
        this.render(true);
    }

    async _onDrop(event) {
        const data = JSON.parse(event.dataTransfer.getData("text/plain"));

        if (data.type !== "Item") return;

        const item = await fromUuid(data.uuid);
        if (!item || !(item instanceof CONFIG.PTU.Item.baseEffect)) return;

        await this.addEffect(item);
    }

    /**
     * @param {CONFIG.PTU.Item.baseEffect | {system: CONFIG.PTU.Item.baseEffect['system']} | {uuid: string}} effect 
     */
    async addEffect(effect) {
        if (effect instanceof CONFIG.PTU.Item.baseEffect) {
            Weather.globalEffects.set(effect.id, new CONFIG.PTU.Item.proxy(effect.toObject(), { temporary: true }));
            Weather.globalEffects.get(effect.id).updateSource({ "flags.core.sourceId": effect.uuid });
        }
        else if (typeof effect === "object" && "system" in effect) {
            Weather.globalEffects.set(effect.id, new CONFIG.PTU.Item.proxy(effect, { temporary: true }));
        }
        else if ("uuid" in effect) {
            const item = await fromUuid(effect.uuid);
            if (!item) return;
            Weather.globalEffects.set(item.id, new CONFIG.PTU.Item.proxy(item.toObject(), { temporary: true }));
            Weather.globalEffects.get(item.id).updateSource({ "flags.core.sourceId": item.uuid });
        }
        else {
            console.warn("Invalid weather effect", effect);
            return;
        }

        Weather.globalEffects.get(effect.id).updateSource({ "system.mode": 'disabled', "system.global": true })

        await game.settings.set("ptu", "weatherEffects", Array.from(Weather.globalEffects.values(), effect => effect.toObject()));
        this.render(true);
    }

    /**
     * @param {string} effectId 
     */
    async removeEffect(effectId) {
        const effect = Weather.globalEffects.get(effectId);
        if (!effect) return;
        Weather.globalEffects.delete(effectId);

        await game.settings.set("ptu", "weatherEffects", Array.from(Weather.globalEffects.values(), effect => effect.toObject()));
        this.render(true);
    }

    static async updateGameState() {
        Weather._initializeGlobalEffects();
        game.actors.forEach(actor => actor.reset());
        ui.notifications.info("Weather Effects Updated on all actors!");
    }

    static openWeatherMenu() {
        for(const apps of Object.values(ui.windows)) {
            if(apps instanceof Weather) {
                apps.bringToTop();
                return;
            }
        }
        new Weather().render(true);
    }
}

export { Weather };