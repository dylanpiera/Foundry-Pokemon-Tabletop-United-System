import { PTUItem } from "../../../item/index.js";
import { MigrationList } from "../../../migration/index.js";
import { MigrationRunner } from "../../../migration/runner/index.js";
import { RuleElementPTU } from "../base.js";

class GrantItemRuleElement extends RuleElementPTU {
    constructor(source, item, options = {}) {
        super(source, item, options);

        if(this.reevaluateOnUpdate) {
            this.replaceSelf = false;
            this.allowduplicate = false;
        }

        this.onDeleteActions = this.#getOnDeleteActions(source);

        this.grantedId = this.item.flags.ptu?.itemGrants?.[this.flag ?? ""]?.id ?? null;
    }

    /** @override */
    static defineSchema() {
        return {
            ...super.defineSchema(),
            uuid: new foundry.data.fields.StringField({ required: true, nullable: false, blank: false, initial: undefined }),
            flag: new foundry.data.fields.StringField({ required: true, nullable: true, initial: null }),
            reevaluateOnUpdate: new foundry.data.fields.BooleanField({ required: false, nullable: false, initial: false }),
            replaceSelf: new foundry.data.fields.BooleanField({ required: false, nullable: false, initial: false }),
            allowduplicate: new foundry.data.fields.BooleanField({ required: false, nullable: false, initial: true }),
            onDeleteActions: new foundry.data.fields.ObjectField({ required: false, nullable: false, initial: undefined }),
            overwrites: new foundry.data.fields.ObjectField({ required: false, nullable: false, initial: undefined })
        };
    }

    static ON_DELETE_ACTIONS = ["cascade", "detach", "restrict"];

    /** @override */
    async preCreate(args) {
        const { itemSource, pendingItems, context, ruleSource} = args;
        
        if(this.reevaluateOnUpdate && this.predicate.length === 0) {
            ruleSource.ignored = true;
            return this.failValidation("`reevaluateOnUpdate` may only be used with a predicate.");
        }

        const uuid = this.resolveInjectedProperties(this.uuid);
        const grantedItem = await (async () => {
            try {
                return (await fromUuid(uuid))?.clone(this.overwrites ?? {}) ?? null;
            }
            catch (error) {
                console.error(error);
                return null;
            }
        })();
        if(!(grantedItem instanceof PTUItem)) return;

        ruleSource.flag = 
            typeof ruleSource.flag === "string" && ruleSource.flag.length > 0
                ? ruleSource.flag
                : (() => {
                    const defaultFlag = grantedItem.slug ?? grantedItem.name;
                    const flagPattern = new RegExp(`^${defaultFlag}\\d*$`);
                    const itemGrants = itemSource.flags?.ptu?.itemGrants ?? {};
                    const nthGrant = Object.keys(itemGrants).filter((g => flagPattern.test(g))).length;
                    return nthGrant > 0 ? `${defaultFlag}${nthGrant+1}` : defaultFlag;
                })();
        this.flag = String(ruleSource.flag);

        if(!this.test()) return;

        const migrations = MigrationList.constructFromVersion(grantedItem.schemaVersion);
        if(migrations.length) {
            await MigrationRunner.ensureSchemaVersion(grantedItem, migrations);
        }

        const existingItem = this.actor.items.find((i) => i.sourceId === uuid || (grantedItem.type === "condition" && i.slug === grantedItem.slug));
        if(!this.allowduplicate && existingItem) {
            if(this.replaceSelf) {
                pendingItems.splice(pendingItems.indexOf(existingItem), 1);
            }
            //this.#setGrantFlags(itemSource, existingItem);

            return ui.notifications.warn(`Item ${grantedItem.name} is already granted to ${this.actor.name}.`);
        }

        if (!this.actor?.allowedItemTypes.includes(grantedItem.type)) {
            ui.notifications.error(`PTU | ${source.type.capitalize()}s cannot be added to ${actor.name}`);
            return [];
        }

        itemSource._id ??= foundry.utils.randomID();
        const grantedSource = grantedItem.toObject();
        grantedSource._id = foundry.utils.randomID();

        if(["feat", "edge"].includes(grantedSource.type)) {
            grantedSource.system.free = true;
        }

        // Guarantee future alreadyGranted checks pass in all cases by re-assigning sourceId
        grantedSource.flags = foundry.utils.mergeObject(grantedSource.flags, { core: { sourceId: uuid } });

        // Create a temporary owned item and run its actor-data preparation and early-stage rule-element callbacks
        const tempGranted = new PTUItem(foundry.utils.deepClone(grantedSource), { parent: this.actor });

        tempGranted.prepareActorData?.();
        for(const rule of tempGranted.prepareRuleElements()) {
            rule.onApplyActiveEffects?.();
        }

        if(this.ignored) return;

        // If the granted item is replacing the granting item, swap it out and return early
        if(this.replaceSelf) {
            pendingItems.findSplice((i) => i === itemSource, grantedSource);
            await this.#runGrantedItemPreCreates(args, tempGranted, grantedSource, context);
            return;
        }

        this.grantedId = grantedSource._id;
        context.keepId = true;

        this.#setGrantFlags(itemSource, grantedSource);

        // Run the granted item's preCreate callbacks unless this is a pre-actor-update reevaluation
        if(!args.reevaluation) {
            await this.#runGrantedItemPreCreates(args, tempGranted, grantedSource, context);
        }

        pendingItems.push(grantedSource);
    }

    /** @override */
    async preUpdateActor() {
        const noAction = { create: [], delete: []};
        if(!this.reevaluateOnUpdate) return noAction;

        if(this.grantedId && this.actor.items.has(this.grantedId)) {
            if(!this.test()) {
                return { create: [], delete: [this.grantedId] };
            }
            return noAction;
        }

        const itemSource = this.item.toObject();
        const ruleSource = itemSource.system.rules[this.sourceIndex ?? -1];
        if(!ruleSource) return noAction;

        const pendingItems = [];
        const context = {
            parent: this.actor,
            render: false
        };

        await this.preCreate({ itemSource, pendingItems, context, ruleSource, reevaluation: true });

        if(pendingItems.length > 0) {
            const updatedGrants = itemSource.flags.ptu.itemGrants ?? {};
            await this.item.update({"flags.ptu.itemGrants": updatedGrants}, { render: false });
            return { create: pendingItems, delete: [] };
        }
        return noAction;
    }

    #getOnDeleteActions(source) {
        const actions = source.onDeleteActions;
        if(typeof actions === "object") {
            const ACTIONS = GrantItemRuleElement.ON_DELETE_ACTIONS;
            return ACTIONS.includes(actions.granter) || ACTIONS.includes(actions.grantee) 
            ? actions : null;
        }
    }

    #setGrantFlags(granter, grantee) {
        const flags = foundry.utils.mergeObject(granter.flags ?? {}, { ptu: { itemGrants: { } } });
        if(!this.flag) throw new Error("GrantItemRuleElement#flag must be set before calling #setGrantFlags");
        flags.ptu.itemGrants[this.flag] = {
            id: grantee instanceof PTUItem ? grantee.id : grantee._id,
            // The on-delete action determines what will happen to the granter item when the granted item is deleted:
            // Default to "detach" (do nothing).
            onDelete: this.onDeleteActions?.grantee ?? "detach"
        } 

        // The granted item records its granting item's ID at `flags.ptu.grantedBy`
        const grantedBy = {
            id: granter._id,
            // The on-delete action determines what will happen to the granted item when the granter item is deleted:
            // Default to "cascade" (delete the granted item)
            onDelete: this.onDeleteActions?.granter ?? "cascade"
        }

        if(grantee instanceof PTUItem) {
            // This is a previously granted item: update its grantedBy flag
            grantee.update({"flags.ptu.grantedBy": grantedBy}, { render: false });
        }
        else {
            grantee.flags = foundry.utils.mergeObject(grantee.flags ?? {}, { ptu: { grantedBy } });
        }
    }

    async #runGrantedItemPreCreates(args, grantedItem, grantedSource, context) {
        for(const rule of grantedItem.rules) {
            const ruleSource = grantedSource.system.rules[grantedItem.rules.indexOf(rule)];
            await rule.preCreate?.({ ...args, itemSource: grantedSource, context, ruleSource});
        }
    }
}

export { GrantItemRuleElement }