import { PTUCondition, PTUItem } from '../index.js';
class PTUMove extends PTUItem {
    get rollable() {
        return !(isNaN(Number(this.system.ac ?? undefined)) && isNaN(Number(this.system.damageBase ?? undefined)));
    }

    get usable() {
        return !this.rollable && this.system.frequency !== "Static";
    }

    /** @override */
    get realId() {
        return this.system.isStruggle ? `struggle-${this.system.type.toLocaleLowerCase(game.i18n.lang)}-${this.system.category.toLocaleLowerCase(game.i18n.lang)}` : super.realId;
    }

    get isDamaging() {
        return !isNaN(Number(this.system.damageBase ?? undefined));
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        
        this.flags.ptu = mergeObject(this.flags.ptu, {
            rollOptions: {
                all: {
                    [`move:type:${this.system.type.toLocaleLowerCase(game.i18n.lang)}`]: true,
                    [`move:category:${this.system.category.toLocaleLowerCase(game.i18n.lang)}`]: true,
                },
                item: {
                    [`move:type:${this.system.type.toLocaleLowerCase(game.i18n.lang)}`]: true,
                    [`move:category:${this.system.category.toLocaleLowerCase(game.i18n.lang)}`]: true,
                }
            }
        });
    }

    /** @override */
    async use(options = {}) {
        if(this.isDamaging || this.system.frequency === "Static") return;

        let didSomething = false;
        const conditions = new Set(this.actor.getFilteredRollOptions("condition"))
        if(conditions.has("condition:confused")) {
            await PTUCondition.HandleConfusion(this, this.actor);
            didSomething = true;
        }

        if(this.referenceEffect) {
            const results = [];
            const effect = await fromUuid(this.referenceEffect);
            if(this.range.includes("Self")) {
                const result = await effect.apply(this.actor, this.actor);
                if(result) results.push(...result);
            }
            else {
                const targets = options.targets || [...game.user.targets] || canvas.tokens.controlled;
                const result = await effect.apply(targets, this.actor);
                if(result) results.push(...result);
            }

            if(results.length > 0) {
                const statements = results.map((effect) => 
                    game.i18n.format("PTU.Broadcast.ApplyEffect", {actor: effect.actor.link, effect: effect.link, source: this.actor.link})
                ).filter(s => s).join("<br/>")
                const enrichedHtml = await TextEditor.enrichHTML(statements, {async: true})
                const chatData = {
                    user: game.user.id,
                    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                    content: await renderTemplate("systems/ptu/static/templates/chat/effect-applied.hbs", { statements: enrichedHtml }),
                    type: CONST.CHAT_MESSAGE_TYPES.OTHER,
                    whisper: this.actor.hasPlayerOwner ? [game.user.id] : game.users.filter(u => u.isGM).map(u => u.id),
                };
                await ChatMessage.create(chatData);
                didSomething = true;
            }
        }
        
        if(!didSomething) {
            ui.notifications.warn(game.i18n.localize("PTU.Notifications.NoEffect"));
        }
    }
}

export { PTUMove }