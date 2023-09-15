class CheckRoll extends Roll {
    get template() {
        return "systems/ptu/static/templates/chat/check/check-roll.hbs";
    }

    constructor(formula, data, options) {
        super(formula, data, options);

        this.isReroll = options.isReroll ?? false;
        this.isRerollable =
            !this.isReroll && this.dice.some((d) => d.modifiers.includes("kh") || d.modifiers.includes("kl"));
        this.roller = game.users.get(this.options.rollerId ?? "") ?? null;
    }

    async render(options = {}) {
        if(!this._evaluated) await this.evaluate({async: true});

        const { isPrivate, flavor, template } = options;
        let containsPrivate = isPrivate ?? this.options.isPrivate ?? false;

        const actor = this.options?.origin?.actor ? await fromUuid(this.options.origin.actor) : null;
        const item = this.options?.origin?.item ? await fromUuid(this.options.origin.item) : null;

        const targets = await (async () => {
            const data = this.options.targets ?? options.targets ?? [];
            if(!data?.length > 0) return [];

            const targets = [];
            for(const target of data) {
                if(typeof target?.actor === "object") {
                    const actor = game.actors.get(target.actor._id) ?? null;
                    targets.push({...target.actor, dc: target.dc, isPrivate: actor?.isPrivate});
                    if(actor?.isPrivate) containsPrivate = true;
                    continue;
                }
                const actor = await fromUuid(target.actor ?? "");
                if(!actor) continue;
                targets.push({...actor, dc: target.dc, isPrivate: actor.isPrivate});
                if(actor.isPrivate) containsPrivate = true;
            }
            return targets;
        })();

        const chatData = {
            formula: isPrivate ? "???" : this.formula,
            user: game.user.id,
            tooltip: isPrivate ? "" : await this.getTooltip(),
            total: isPrivate ? "?" : Math.round(this.total * 100) / 100,
            item,
            self: actor,
            targets,
            outcome: isPrivate ? null : this.options.outcome ?? options.outcome ?? null,
            ...options,
            type: this.options.type ?? options.type ?? null,
            containsPrivate,
        }


        return renderTemplate(template ?? this.template, chatData);
    }
}

export { CheckRoll }