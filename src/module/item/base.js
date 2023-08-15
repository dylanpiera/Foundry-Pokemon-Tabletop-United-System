import { RuleElements } from "../rules/index.js";
import { processGrantDeletions } from "../rules/rule-element/grant-item/helper.js";
import { sluggify } from "../../util/misc.js"

class PTUItem extends Item {

    get sourceId() {
        return this.flags?.core?.sourceId ?? undefined;
    }

    get schemaVersion() {
        return Number(this.system.schema?.version) || null;
    }

    get slug() {
        return this.system.slug || sluggify(this.name);
    }

    get grantedBy() {
        return this.actor?.items.get(this.flags.ptu.grantedBy?.id ?? "") ?? null;
    }

    get grantedBySameType() {
        return this.grantedBy?.type === this.type;
    }

    get isGranted() {
        return this.flags.ptu.grantedBy ? this.flags.ptu.grantedBy.onDelete != "detach" : false;
    }

    get hasAutomation() {
        return this.rules.length > 0 && this.rules.some((rule) => !rule.ignored);
    }

    get realId() {
        return this.id;
    }

    get rollOptions() {
        return this.flags.ptu?.rollOptions;
    }

    get rollable() {
        return false;
    }

    /** @override */
    prepareBaseData() {
        this.flags.ptu = mergeObject({ rulesSelections: {} }, this.flags.ptu ?? {});

        this.flags.ptu = mergeObject(this.flags.ptu ?? {}, {
            rollOptions: {
                all: {
                    [`item:id:${this._id}`]: true,
                    [`item:slug:${this.slug}`]: true,
                    [`item:type:${this.type}`]: true,
                    [`${this.type}:${this.slug}`]: true
                },
                item: {
                    [`item:id:${this._id}`]: true,
                    [`item:slug:${this.slug}`]: true,
                    [`item:type:${this.type}`]: true,
                    [`${this.type}:${this.slug}`]: true
                }
            }
        });
    }

    /** @override */
    _initialize() {
        this.rules = [];
        super._initialize();
    }

    /** @override */
    async delete(context) {
        if (this.actor) {
            await this.actor.deleteEmbeddedDocuments("Item", [this._id], context);
            return this;
        }
        return super.delete(context);
    }

    /**
     * Retrieve all roll option from the requested domains. Micro-optimized in an excessively verbose for-loop.
     * @param domains The domains of discourse from which to pull options. Always includes the "all" domain.
     */
    getRollOptions(domains = []) {
        if (!Array.isArray(domains)) domains = [domains];
        const withAll = Array.from(new Set(["all", ...domains]));
        const { rollOptions } = this;
        const toReturn = new Set();

        for (const domain of withAll) {
            for (const [option, value] of Object.entries(rollOptions[domain] ?? {})) {
                if (value) toReturn.add(option);
            }
        }

        return Array.from(toReturn).sort();
    }

    /** @override */
    getRollData() {
        return { actor: this.actor, item: this };
    }

    _updateIcon({ source, update } = { source: undefined, update: false }) {
        source ??= duplicate(this);

        let required = false;
        source.img ||= `/systems/ptu/static/css/images/icons/${source.type}_icon.png`
        if (source.img == "icons/svg/item-bag.svg" || source.img == "icons/svg/mystery-man.svg") {
            if (source.type == "move") {
                source.img = `/systems/ptu/static/css/images/types2/${source.system.type.capitalize()}IC_Icon.png`;
            }
            else {
                source.img = `/systems/ptu/static/css/images/icons/${source.type}_icon.png`;
            }
            required = true;
        }

        if (update && required) return this.update(source);
        else return source;
    }

    /** @override */
    prepareActorData() {
        const { actor } = this;
        if (!actor) return;
        const slug = this.slug;
        actor.rollOptions.all[`${this.type}:${slug}`] = true;
    }

    /** @override */
    static async createDocuments(data = [], context = {}) {
        const sources = data.map((d) => (d instanceof PTUItem ? d.toObject() : d));

        const actor = context.parent;
        if (!actor) return super.createDocuments(sources, context);

        const validTypes = actor.allowedItemTypes;
        for (const source of sources) {
            if (!validTypes.includes(source.type)) {
                ui.notifications.error(`PTU | ${source.type.capitalize()}s cannot be added to ${actor.name}`);
                return [];
            }
        }

        const items = sources.map((source) => {
            if (!(context.keepId || context.keepEmbeddedIds)) source._id = randomID();
            return new PTUItem(source, { parent: actor });
        })

        const outputSources = items.map((i) => i._source).filter(s => {
            if (s.type !== "condition") return true;

            const existing = actor.itemTypes.condition.find(c => c.slug === sluggify(s.name));
            if (existing) {
                if (existing.system.value.isValued) existing.increase();
                return false;
            }
            return true;
        });

        // Process item preCreate rules for all items that are going to be added
        // This may add additional items (such as via GrantItem)
        for (const item of items) {
            // Pre-load this item's self: roll options for predication by preCreate rule elements
            item.prepareActorData?.();

            const itemSource = (() => {
                if (item.type !== "condition") return item._source;

                const existing = actor.itemTypes.condition.find(c => c.slug === sluggify(item.name));
                if (existing) {
                    return existing._source;
                }
                return item._source
            })();
            const rules = item.prepareRuleElements();
            for (const rule of rules) {
                const ruleSource = itemSource.system.rules[rules.indexOf(rule)];
                await rule.preCreate?.({ itemSource, ruleSource, pendingItems: outputSources, context });
            }
        }

        return super.createDocuments(outputSources, context);
    }

    /** @override */
    static async deleteDocuments(ids = [], context = {}) {
        ids = Array.from(new Set(ids));
        const actor = context.parent;
        if (actor) {
            const items = ids.flatMap((id) => actor.items.get(id) ?? []);

            for (const item of [...items]) {
                for (const rule of item.rules) {
                    await rule.preDelete?.({ pendingItems: items, context });
                }

                await processGrantDeletions(item, items);
            }

            ids = Array.from(new Set(items.map((i) => i._id)).filter((id) => actor.items.has(id)));
        }
        return super.deleteDocuments(ids, context);
    }

    /** @override */
    async _preCreate(data, options, user) {
        await super._preCreate(data, options, user);

        this._source.system.rules = this._source.system.rules.filter((r) => !r.removeUponCreate);
    }

    /** @override */
    async _preUpdate(changed, options, user) {
        for (const rule of this.rules) {
            await rule.preUpdate?.(changed);
        }

        await super._preUpdate(changed, options, user);
    }

    /** @override */
    _onCreate(data, options, userId) {
        super._onCreate(data, options, userId);
        if (!(this.actor && game.user.id === userId)) return;

        this.actor.reset();
        const actorUpdates = {};
        for (const rule of this.rules) {
            rule.onCreate?.(actorUpdates);
        }

        const updateKeys = Object.keys(actorUpdates);
        if (updateKeys.length > 0 && !updateKeys.every(k => k === "_id")) this.actor.update(actorUpdates);
    }

    /** @override */
    _onDelete(options, userId) {
        super._onDelete(options, userId);
        if (!(this.actor && game.user.id === userId)) return;

        const actorUpdates = {};
        for (const rule of this.rules) {
            rule.onDelete?.(actorUpdates);
        }

        const updateKeys = Object.keys(actorUpdates);
        if (updateKeys.length > 0 && !updateKeys.every(k => k === "_id")) this.actor.update(actorUpdates);
    }

    prepareRuleElements(options = {}) {
        if (!this.actor) throw new Error("PTU | Item must have an actor to prepare rule elements");

        return (this.rules = this.actor.canHostRuleElements ? RuleElements.fromOwnedItem(this, options) : []);
    }

    async refreshFromCompendium() {
        if (!this.isOwned) return ui.notifications.error("PTU | Item must be owned to refresh from compendium");

        if (!this.sourceId?.startsWith("Compendium.")) {
            console.warn("PTU | Item must be from a compendium to refresh from compendium");
            return;
        }

        const currentSource = this.toObject();
        const latestSource = (await fromUuid(this.sourceId))?.toObject();
        if (!latestSource) return ui.notifications.error("PTU | Could not find latest source for item");
        else if (latestSource.type !== this.type) return ui.notifications.error("PTU | Item type must match latest source type");

        const updatedImage = currentSource.img.endsWith(".svg") ? latestSource.img : currentSource.img;
        const updates = {
            img: updatedImage,
            system: latestSource.system,
        }

        if (this.type === "item") {
            // Preserve the current quantity
            const { quantity } = currentSource.data;
            updates.system.quantity = quantity;
        }

        await this.update(updates, { diff: false, recursive: false });
        ui.notifications.info(`PTU | Item ${this.name} updated from compendium`);
    }
}

const PTUItemProxy = new Proxy(PTUItem, {
    construct(_target, args) {
        const subType = args[0]?.system?.subtype;
        if (subType && subType != "item") {
            return new CONFIG.PTU.Item.documentClasses[subType](...args);
        }

        return new CONFIG.PTU.Item.documentClasses[args[0].type](...args);
    }
})

export { PTUItem, PTUItemProxy }