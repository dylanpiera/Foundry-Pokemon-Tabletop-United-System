export class TokenPanel extends Application {
    get token() {
        return canvas.tokens.controlled.at(0)?.document ?? null;
    }

    get actor() {
        return this.token?.actor ?? game.user?.character ?? null;
    }

    /**
     * Debounce and slightly delayed request to re-render this panel. Necessary for situations where it is not possible
     * to properly wait for promises to resolve before refreshing the UI.
     */
    refresh = foundry.utils.debounce(this.render, 100);

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "ptu-token-panel",
            template: "systems/ptu/static/templates/apps/token-panel.hbs",
            popOut: false,
        });
    }

    /** @override */
    async getData(options = {}) {
        const { actor } = this;
        if (!actor || !game.user.settings.showTokenPanel) return {
            user: { isGM: false },
            actor: null,
        };

        const attacks = [];
        const struggles = [];
        for (const attack of actor.attacks.contents) {
            const data = {
                name: attack.label,
                img: attack.img,
                db: attack.item?.system.damageBase ?? 0,
                ac: attack.item?.system.ac ?? 0,
                frequency: attack.item?.system.frequency ?? "At-Will",
                id: attack.item.id,
                rollable: !!attack.roll,
                effect: attack.item?.system.effect ?? "",
            };
            if (attack.item.system.isStruggle) struggles.push(data);
            else attacks.push(data);
        }

        return {
            ...(await super.getData(options)),
            user: { isGM: game.user.isGM },
            actor,
            attacks,
            struggles
        }
    }

    /** @override */
    activateListeners($html) {
        super.activateListeners($html);

        for(const action of $html.find(".action")) {
            action.addEventListener("click", (event) => {
                const id = event.currentTarget.dataset.id;
                const attack = this.actor.attacks.get(id);
                if (!attack) return;
                
                attack.roll?.({event, callback: async (rolls, targets, msg, event) => {
                    if(!game.settings.get("ptu", "autoRollDamage")) return;
    
                    const params = {
                        event,
                        options: msg.context.options ?? [],
                        actor: msg.actor,
                        targets: msg.targets
                    }
                    const result = await attack.damage?.(params);
                    if(result === null) {
                        return await msg.update({"flags.ptu.resolved": false})
                    }
                }});
            });
        }
    }
}