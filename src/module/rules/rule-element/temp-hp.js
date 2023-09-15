import { RuleElementPTU } from "./base.js";

export class TempHPRuleElement extends RuleElementPTU {
    constructor(data, item, options = {}) {
        const { removeOnDelete, value } = data;
        super(data, item, options);

        this.removeOnDelete = !!(removeOnDelete ?? true);
        this.value = value;
    }

    /** @override */
    onCreate(actorUpdates) {
        if(this.ignored) return;

        const updatedActorData = mergeObject(this.actor._source, actorUpdates, {inplace: false});
        const value = this.resolveValue(this.value)

        const rollOptions = Array.from(new Set(this.actor.getRollOptions()));

        if(!this.predicate.test(rollOptions)) return;
        if(typeof value !== "number") return this.failValidation("Temporary HP requires a non-zero value field");

        const currentTempHP = Number(getProperty(updatedActorData, "system.tempHp.value")) || 0;
        if(value > currentTempHP) {
            mergeObject(actorUpdates, {
                "system.tempHp.value": value, 
                "system.tempHp.max": value,
                "system.tempHp.source": this.item.uuid
            });
            this.broadcast(value, currentTempHP);
        }
    }    

    /** @override */
    onDelete(actorUpdates) {
        const updatedActorData = mergeObject(this.actor._source, actorUpdates, {inplace: false});
        if(!this.removeOnDelete) return;

        if(getProperty(updatedActorData, "system.tempHp.source") === this.item.uuid) {
            mergeObject(actorUpdates, {
                "system.tempHp.value": 0,
                "system.tempHp.-=source": null
            });
            this.broadcast(0, this.actor.system.tempHp.value);
        }
    }
    
    broadcast(newQuantity, oldQuantity) {
        const singularOrPlural =
            newQuantity === 1
                ? "PTU.Broadcast.TempHP.SingleNew"
                : "PTU.Broadcast.TempHP.PluralNew";
        const wasAt = oldQuantity > 0 ? game.i18n.format("PTU.Broadcast.TempHP.WasAt", { oldQuantity }) : "";
        const [actor, item] = [this.actor.name, this.item.name];
        const content = game.i18n.format(singularOrPlural, { actor, newQuantity, wasAt, item });
        const recipients = game.users.filter((u) => this.actor.testUserPermission(u, "OWNER")).map((u) => u.id);
        const speaker = ChatMessage.getSpeaker({ actor: this.actor, token: this.token });
        ChatMessage.create({ content, speaker, whisper: recipients });
    }
}