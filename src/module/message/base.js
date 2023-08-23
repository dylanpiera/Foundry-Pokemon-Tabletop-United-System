class ChatMessagePTU extends ChatMessage {
    constructor(data = {}, context = {}) {
        data.flags = mergeObject(expandObject(data.flags ?? {}), { core: {}, ptu: {} });
        super(data, context);
    }

    get actor() {
        const attack = this.flags.ptu.attack;
        if (!attack) return null;
        const actorUUID = "actor" in attack ? attack.actor : null;
        if (!actorUUID) return null;

        const match = /^Actor\.(\w+)$/.exec(actorUUID ?? "") ?? [];
        const actor = game.actors.get(match[1] ?? "");

        return actor ?? null;
    }

    get target() {
        const context = this.flags.ptu.context;
        if (!context) return null;
        const targetUUID = "target" in context ? context.target?.token : null;
        if (!targetUUID) return null;

        const match = /^Scene\.(\w+)\.Token\.(\w+)$/.exec(targetUUID ?? "") ?? [];
        const scene = game.scenes.get(match[1] ?? "");
        const token = scene?.tokens.get(match[2] ?? "");
        const actor = token?.actor;

        return actor ? { actor, token } : null;
    }

    get targets() {
        const context = this.flags.ptu.context;
        if (!context) return null;
        const targets = context.targets ?? [];
        if (!targets) return null;

        return targets.map(target => {
            const match = /^Scene\.(\w+)\.Token\.(\w+)$/.exec(target.token ?? "") ?? [];
            const scene = game.scenes.get(match[1] ?? "");
            const token = scene?.tokens.get(match[2] ?? "");
            const actor = token?.actor;

            const outcome = target.outcome ? target.outcome : this.outcomes?.[actor?.id ?? ""] ?? null;

            return actor && token ? { actor, token, dc: target.dc, outcome } : null;
        }).filter(t => t);
    }

    get context() {
        const context = this.flags.ptu.context;
        return context ?? null;
    }

    get isCheckRoll() {
        return this.rolls[0] instanceof CONFIG.PTU.Dice.rollDocuments.check;
    }

    get item() {
        const attack = this.attack;
        if (attack?.item) return attack.item;

        const context = this.context;
        if (context?.item) {
            const match = /^Actor\.(\w+)\.Item\.(\w+)$/.exec(context.item) ?? [];
            const actor = game.actors.get(match[1] ?? "");
            const item = actor?.items.get(match[2] ?? "");
            return item ?? null;
        }

        return null;
    }

    get attack() {
        const actor = this.actor;
        if (!actor?.system.attacks) return null;

        const attack = actor.system.attacks.get(this.flags.ptu.attack.id);
        return attack ?? null;
    }

    get token() {
        if (!game.scenes) return null;
        const sceneId = this.speaker.scene ?? "";
        const tokenId = this.speaker.token ?? "";
        return game.scenes.get(sceneId)?.tokens.get(tokenId) ?? null;
    }

    get outcome() {
        return this.rolls[0]?.options?.outcome ?? null;
    }

    get outcomes() {
        return this.flags.ptu?.context?.outcomes ?? null;
    }

    getRollData() {
        const { actor, item } = this;
        return { ...actor?.getRollData(), ...item?.getRollData() };
    }

    /** @override */
    async getHTML() {
        const $html = await super.getHTML();

        const message = this;

        $html.find('.tag.tooltip').tooltipster({
			theme: `tooltipster-shadow ball-themes default`,
			position: 'top'
		});

        $html.find(".buttons .button[data-action]").on("click", async event => {
            event.preventDefault();

            const $button = $(event.currentTarget);
            const action = $button.data("action");

            switch (action) {
                case "damage": {
                    const { actor } = this;
                    if (!actor) return;
                    if (!game.user.isGM && !actor.isOwner) return;

                    const attack = message.attack;
                    if (!attack) return;

                    const options = actor.getRollOptions(["all", "attack-roll"]);

                    const rollArgs = { event, options };

                    return attack.damage?.(rollArgs);
                }
                case "revert-damage": {
                    const appliedDamageFlag = message.flags.ptu?.appliedDamage;
                    if (!appliedDamageFlag) return;

                    const actorOrToken = await fromUuid(appliedDamageFlag.uuid);
                    const actor = actorOrToken.actor ?? (actorOrToken instanceof Actor) ? actorOrToken : null;
                    if (!actor) return;
                    await actor.undoDamage(appliedDamageFlag)

                    $html.find("span.statements").addClass("reverted");
                    $html.find(".buttons .button[data-action='revert-damage']").remove();
                    return await message.update({ "flags.ptu.appliedDamage.isReverted": true });
                }
            }
        })

        if (this.flags.ptu?.appliedDamage && this.flags.ptu.appliedDamage?.isReverted) {
            $html.find("span.statements").addClass("reverted");
            $html.find(".buttons .button[data-action='revert-damage']").remove();
        }

        if (this.flags.ptu?.appliedDamage) {
            const iwrInfo = $html.find(".iwr")[0];
            if (iwrInfo) {
                const iwrApplications = (() => {
                    try {
                        const parsed = JSON.parse(iwrInfo?.dataset.applications ?? "null");
                        return Array.isArray(parsed) &&
                            parsed.every(
                                (a) =>
                                    a instanceof Object &&
                                    "category" in a &&
                                    typeof a.category === "string" &&
                                    "type" in a &&
                                    typeof a.type === "string" &&
                                    (
                                        (
                                            "adjustment" in a &&
                                            typeof a.adjustment === "number"
                                        )
                                        ||
                                        (
                                            "modifier" in a &&
                                            typeof a.modifier === "number"
                                        )
                                    )
                            )
                            ? parsed
                            : null;
                    } catch {
                        return null;
                    }
                })();
    
                if (iwrApplications) {
                    $(iwrInfo).tooltipster({
                        theme: "crb-hover",
                        maxWidth: 400,
                        content: await renderTemplate("systems/ptu/static/templates/chat/iwr-breakdown.hbs", {
                            applications: iwrApplications,
                        }),
                        contentAsHTML: true,
                    });
                }
            }
        }

        return $html;
    }
}

export { ChatMessagePTU, PTUChatMessageProxy }

const PTUChatMessageProxy = new Proxy(ChatMessagePTU, {
    construct(_target, args) {
        const rolls = args[0].rolls;
        const type = args[0].flags?.ptu?.context?.type;
        if (type == "attack-roll") return new CONFIG.PTU.ChatMessage.documentClasses.attack(...args);
        if (type == "damage-roll") return new CONFIG.PTU.ChatMessage.documentClasses.damage(...args);

        return new ChatMessagePTU(...args);
    }
})