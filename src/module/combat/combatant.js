import { PTUCondition } from "../item/index.js";

class PTUCombatant extends Combatant {
    get encounter() {
        return this.combat;
    }

    get roundOfLastTurn() {
        return this.flags.ptu.roundOfLastTurn;
    }

    get roundOfLastTurnEnd() {
        return this.flags.ptu.roundOfLastTurnEnd;
    }

    get hasActed() {
        return this.roundOfLastTurnEnd >= this.combat.round;
    }

    get playersCanSeeName() {
        return !!this.token?.playersCanSeeName
    }

    get isBoss() {
        return !!this.actor?.system?.boss?.is;
    }

    get isDefeated() {
        return this.defeated || this.actor?.conditions.active.some(c => c.slug === "fainted") || this.token?.document?.overlayEffect === "systems/ptu/static/images/conditions/Fainted.svg";
    }

    get isPrimaryBossCombatant() {
        if (!this.isBoss) return false;

        return this.flags.ptu.isPrimaryBossCombatant;
    }

    get bossTurns() {
        if (!this.isBoss) return null;

        const turns = this.combat.combatants.filter(c => c.actorId === this.actorId);
        const mainTurn = turns.find(c => c.isPrimaryBossCombatant);
        const otherTurns = turns.filter(c => !c.isPrimaryBossCombatant);
        return { mainTurn, otherTurns };
    }

    hasHigherInitiative(than) {
        if (this.parent.id !== than.parent.id) throw new Error("Combatants must be in the same combat");

        return this.parent.getCombatantWithHigherInit(this, than) === this;
    }

    static async fromActor(actor, render = true, options = {}) {
        if (!game.combat) {
            ui.notifications.error("No combat active");
            return null;
        }
        const token = actor.getActiveTokens().pop();
        const existing = game.combat.combatants.find(c => c.actor === actor);
        if (existing) {
            return existing;
        }
        if (token) {
            const combat = options.combat ?? game.combat;
            const combatants = await combat.createEmbeddedDocuments(
                "Combatant",
                [
                    {
                        tokenId: token.id,
                        actorId: token.actor?.id,
                        sceneId: token.scene.id,
                        hidden: token.document.hidden,
                    }
                ],
                { render }
            )
            return combatants.at(0) ?? null;
        }
        ui.notifications.error("No token found");
        return null;
    }

    /** @override */
    static async createDocuments(data = [], context = {}) {
        const realData = data.flatMap(({ actorId, hidden, sceneId, tokenId }) => {
            const actor = game.actors.get(actorId ?? "");
            const turns = actor?.system?.boss?.is ? actor.system.boss.turns : 1;
            return Array.from({ length: turns }, (_, index) => (
                {
                    actorId,
                    hidden,
                    sceneId,
                    tokenId,
                    ...(index === 0 ? { flags: { ptu: { isPrimaryBossCombatant: true } } } : {})
                }));
        });
        return super.createDocuments(realData, context);
    };

    async startTurn() {
        const { actor, encounter } = this;
        if (!encounter || !actor) return;

        const actorUpdates = {};
        for (const rule of actor.rules) {
            await rule.onTurnStart?.(actorUpdates);
        }
        const paralyzed = actor.conditions.active.find(c => c.slug == "paralysis");
        if (paralyzed) await PTUCondition.HandleParalyzed(actor, paralyzed);
        const hyperMode = actor.conditions.active.find(c => c.slug == "hyper-mode");
        if (hyperMode) await PTUCondition.HandleHyperMode(actor, hyperMode);

        if (this.isBoss) {
            await this.bossTurns.mainTurn.update({ "flags.ptu.roundOfLastTurn": encounter.round });
        }
        else {
            await this.update({ "flags.ptu.roundOfLastTurn": encounter.round });
        }

        if (Object.keys(actorUpdates).length) {
            await actor.update(actorUpdates);
        }

        Hooks.callAll("ptu.startTurn", this, encounter, game.user.id);
    }

    async endTurn(options) {
        const round = options.round;
        const { actor, encounter } = this;
        if (!encounter || !actor) return;

        const activeConditions = actor.conditions.active;
        if (!this.isBoss || (this.isPrimaryBossCombatant && !this.hasActed)) {
            for (const condition of activeConditions) {
                await condition.onTurnEnd?.({ token: this.token });
            }
        }

        await this.update({ "flags.ptu.roundOfLastTurnEnd": round });

        Hooks.callAll("ptu.endTurn", this, encounter, game.user.id);
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();

        this.flags.ptu ??= {};
        this.flags.ptu.roundOfLastTurn ??= null;
        this.flags.ptu.roundOfLastTurnEnd ??= null;
        this.flags.ptu.isPrimaryBossTurn ??= false;
    }

    async toggleDefeated({ to = !this.isDefeated } = {}) {
        if (to === this.isDefeated) return;

        const updates = [];
        if (this.isBoss) {
            const { mainTurn, otherTurns } = this.bossTurns;
            for (const turn of [...otherTurns, mainTurn]) {
                updates.push({ _id: turn.id, defeated: to });
            }
        }
        else {
            updates.push({ _id: this.id, defeated: to });
        }

        await this.combat.updateEmbeddedDocuments("Combatant", updates);
        
        if(to) {
            await this.actor?.createEmbeddedDocuments("Item", await PTUCondition.FromEffects([{ id: "fainted" }]));
        }
        else {
            const faintedCondition = this.actor?.conditions.active.find(c => c.slug === "fainted");
            if(faintedCondition) await faintedCondition.delete();
        }
        
        //await this.token?.object?.toggleEffect("systems/ptu/static/images/conditions/Fainted.svg", { overlay: true, active: to });

        if (this.isDefeated && this.token?.object?.isTargeted) this.token.object.setTarget(false, { releaseOthers: false });
    }

    async toggleVisibility({ to = !this.hidden } = {}) {
        if (to === this.hidden) return;

        const updates = [];
        if (this.isBoss) {
            const { mainTurn, otherTurns } = this.bossTurns;
            for (const turn of [...otherTurns, mainTurn]) {
                updates.push({ _id: turn.id, hidden: to });
            }
        }
        else {
            updates.push({ _id: this.id, hidden: to });
        }

        await this.combat.updateEmbeddedDocuments("Combatant", updates);
        await this.token?.update({ hidden: to });
    }

    async toggleActed({ multi = false } = {}) {
        const currentRound = this.combat.current.round;
        const previousRound = currentRound - 1;

        const updates = [];
        if (multi && this.isBoss) {
            const { mainTurn, otherTurns } = this.bossTurns;
            for (const turn of [...otherTurns, mainTurn]) {
                updates.push({ _id: turn.id, flags: { ptu: { roundOfLastTurnEnd: this.hasActed ? previousRound : currentRound } } });
            }
        }
        else {
            updates.push({ _id: this.id, flags: { ptu: { roundOfLastTurnEnd: this.hasActed ? previousRound : currentRound } } });
        }

        await this.combat.updateEmbeddedDocuments("Combatant", updates);
    }
}

export { PTUCombatant }