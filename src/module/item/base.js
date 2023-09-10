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
                source.img = CONFIG.PTU.data.typeEffectiveness[source.system.type.titleCase()].images.icon;
            }
            else if (source.type =="contestmove") {
                source.img = `/systems/ptu/static/css/images/types2/${source.system.type}IC_Icon.png`;
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

        const items = await (async () => {
            /** Internal function to recursively get all simple granted items */
            async function getSimpleGrants(item) {
                const granted = (await item.createGrantedItems?.({ size: context.parent?.size })) ?? [];
                if (!granted.length) return [];
                const reparented = granted.map(
                    (i) =>
                    (i.parent
                        ? i
                        : new CONFIG.Item.documentClass(i._source, { parent: actor }))
                );
                return [...reparented, ...(await Promise.all(reparented.map(getSimpleGrants))).flat()];
            }

            const items = sources.map((source) => {
                if (!(context.keepId || context.keepEmbeddedIds)) {
                    source._id = randomID();
                }
                return new CONFIG.Item.documentClass(source, { parent: actor })
            });
            if(!context.keepId) context.keepId = true;

            // If any item we plan to add will add new items, add those too
            // When this occurs, keepId is switched on.
            for (const item of [...items]) {
                const grants = await getSimpleGrants(item);
                if (grants.length) {
                    context.keepId = true;
                    items.push(...grants);
                }
            }

            return items;
        })();

        const outputSources = items.map((i) => i._source).filter(s => {
            if (!s) return false;
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

    async sendToChat() {
        const tags = await (async () => {
            const tags = [];
            if(this.system.frequency) tags.push({slug: "frequency", label: game.i18n.localize("PTU.Tags.Frequency"), value: this.system.frequency });
            if(this.system.range) tags.push({slug: "range", label: game.i18n.localize("PTU.Tags.Range"), value: this.system.range });
            if(this.system.damageBase) tags.push({slug: "db", label: game.i18n.localize("PTU.Tags.DB"), value: this.system.damageBase+" DB" });
            return tags;
        })();

        const flavor = await (async () => {
            const typeAndCategoryHeader = (() => {
                if(this.type !== "move") return null;

                const header = document.createElement("div");
                header.classList.add("header-bar");
                header.classList.add("type-category");

                const type = document.createElement("div");
                type.classList.add("type-img");

                const typeImg = document.createElement("img");
                typeImg.src = CONFIG.PTU.data.typeEffectiveness[this.system.type].images.bar;
                type.append(typeImg);

                const category = document.createElement("div");
                category.classList.add("type-img");

                const categoryImg = document.createElement("img");
                categoryImg.src = `/systems/ptu/static/css/images/categories/${this.system.category}.png`;
                category.append(categoryImg);

                header.append(category, type);
                return [header]
            })();

            const header = document.createElement("div");
            header.classList.add("header-bar");
            if(this.img) {
                header.append((() => {
                    const img = document.createElement("img");
                    img.classList.add("item-img", "item-icon");
                    img.src = this.img;
                    return img;
                })());
            }
            header.append((() => {
                const h3 = document.createElement("h3");
                h3.classList.add("action");
                h3.innerHTML = this.name;
                return h3;
            })());
            return [header, typeAndCategoryHeader ?? []]
                .flat()
                .map(e => (typeof e === "string" ? e : e.outerHTML))
                .join("");
        })();

        const chatData = {
            user: game.user._id,
            item: this,
            tags
        }

        ChatMessage.create({content: await renderTemplate(`/systems/ptu/static/templates/chat/chat-items.hbs`, chatData), flavor})
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