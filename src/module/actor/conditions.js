export class ActorConditions extends Collection {
    #slugMap = new Map();

    get active() {
        return this.filter(c => c.active);
    }

    get stored() {
        return this.filter(c => c.actor.items.has(c.id));
    }

    constructor() {
        super();
    }

    /** @override */
    get(key, { strict, active, temporary } = { strict: false, active: null, temporary: null }) {
        const condition = super.get(key, { strict: strict });
        if (active === true && !condition?.active) return undefined;
        if (active === false && condition?.active) return undefined;
        if (temporary === true && condition?.actor.items.has(key)) return undefined;
        if (temporary === false && !condition?.actor.items.has(key)) return undefined;

        return condition;
    }

    /** @override */
    set(id, condition) {
        super.set(id, condition);

        const listBySlug = this.#slugMap.get(condition.slug) ?? [];
        listBySlug.push(condition);
        this.#slugMap.set(condition.slug, listBySlug);

        return this;
    }

    /**  
    * @override
    * No deletions: A new instance is created every data cycle
    */
    delete() {
        return false;
    }

    bySlug(slug, { active, temporary } = { active: null, temporary: null }) {
        return (this.#slugMap.get(slug) ?? []).filter(c => {
            const activeFilter = active === true ? c.active : active === false ? !c.active : true;
            const temporaryFilter = temporary === true ? !c.actor.items.has(c.id) : temporary === false ? c.actor.items.has(c.id) : true;
            return activeFilter && temporaryFilter;
        });
    }
}