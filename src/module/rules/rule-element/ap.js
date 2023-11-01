import { RuleElementPTU } from "./base.js";

export class ActionPointsRuleElement extends RuleElementPTU {
    constructor(data, item, options = {}) {
        const { drainedValue, boundValue } = data;
        super(data, item, options);

        this.drainedValue = this.resolveValue(drainedValue);
        this.boundValue = this.resolveValue(boundValue);
    }

    /** @override */
    onCreate(actorUpdates) {
        if(this.ignored) return;

        const rollOptions = Array.from(new Set(this.actor.getRollOptions()));

        if(!this.predicate.test(rollOptions)) return;
        if(typeof this.drainedValue !== "number") return this.failValidation("drainedValue requires a non-zero value field");
        if(typeof this.boundValue !== "number") return this.failValidation("boundValue requires a non-zero value field");

        const currentApBeforeRule = Number(this.actor.system.ap.current) || 0;
        // this.onCreate() runs **AFTER** this.afterPrepareData(). Therefore, within the PTUTrainerActor.prepareDerivedData(), this Rules
        // drained and bound values are already included. Therefore, the maxAp before this rule can only be calced by adding
        // this rules values up to it again.
        const maxApBeforeRule = (Number(this.actor.system.ap.max) || 0) + this.drainedValue + this.boundValue;
        const currentApAfterRule = Math.clamped(currentApBeforeRule - this.drainedValue - this.boundValue, 0, maxApBeforeRule - this.drainedValue - this.boundValue);
        mergeObject(actorUpdates, {
            "system.ap.current": currentApAfterRule
        });
    }

    afterPrepareData() {
        if(this.ignored) return;
        super.afterPrepareData()
        this.actor.synthetics.apAdjustments.bound.push({"value": this.boundValue, "sourceUuid": this.item.uuid})
        this.actor.synthetics.apAdjustments.drained.push({"value": this.drainedValue, "sourceUuid": this.item.uuid})
    }

    /** @override */
    onDelete(actorUpdates) {
        // this.actor.synthetics.apAdjustments.bound = this.actor.synthetics.apAdjustments.bound.filter(e => e.sourceUuid !== this.item.uuid)
        // this.actor.synthetics.apAdjustments.drained = this.actor.synthetics.apAdjustments.drained.filter(e => e.sourceUuid !== this.item.uuid)


        // const updatedActorData = mergeObject(this.actor._source, actorUpdates, {inplace: false});
        // // Correct data
        // const currentApBeforeDeletion = Number(getProperty(updatedActorData, "system.ap.current")) || 0;
        // // undefined => 0
        // const maxApBeforeDeletion = Number(getProperty(updatedActorData, "system.ap.max")) || 0;

        // Correct
        const currentApBeforeDeletion = Number(this.actor.system.ap.current) || 0;
        // Correct
        const maxApBeforeDeletion = Number(this.actor.system.ap.max) || 0;


        const currentApAfterDeletion = Math.clamped(currentApBeforeDeletion + this.drainedValue, 0, maxApBeforeDeletion + this.drainedValue + this.boundValue);

        mergeObject(actorUpdates, {
            "system.ap.current": currentApAfterDeletion
        });
    }
    
    broadcast() {
        throw new Error("Why is this still used?!??!???!?!?")
    }
}