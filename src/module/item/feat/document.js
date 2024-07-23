import { sluggify } from '../../../util/misc.js';
import { PTUItem } from '../index.js';
class PTUFeat extends PTUItem {
    get category() {
        if(this.system.keywords?.includes("Class")) return "class";
        return "feat";
    }

    get isClass() {
        return this.category === "class";
    }

    /** @override */
    get rollable() {
        return this.system?.frequency && this.system.frequency !== "Static";
    }

    /** @override */
    async _preCreate(data, options, user) {
        super._preCreate(data, options, user);

        // If the item has a class check if we have a class item for it
        if(this.system.class) {
            const classItem = this.actor?.items.find((item) => item.isClass && item.slug === sluggify(this.system.class));
            if(classItem) {
                this._source.flags.ptu ??= {};
                this._source.flags.ptu.grantedBy = {id: classItem._id, onDelete: "detach"};
                await classItem.update({"flags.ptu.itemGrants": {[this._source._id]: {id: this._source._id, onDelete: "detach"}}});
            }
        }
    }

    /** @override */
    async _preUpdate(changed, options, user) {
        let oldClass = {}, newClass = {};

        // If the item has a class check if we have a class item for it
        if(changed.system?.class !== undefined) {
            newClass.actor = this.actor?.items.find((item) => item.isClass && item.name === changed.system.class);
            if(newClass.actor) {
                changed.flags = foundry.utils.expandObject({"ptu.grantedBy": {id: newClass.actor._id, onDelete: "detach"}});
                newClass.update = {"flags.ptu.itemGrants": {[this._id]: {id: this._id, onDelete: "detach"}}};
            }
            if(this.system.class) {
                oldClass.actor = this.actor?.items.find((item) => item.isClass && item.name === this.system.class);
                if(oldClass.actor) {
                    if(!changed.flags?.ptu?.grantedBy?.id && this.flags?.ptu?.grantedBy?.id === oldClass.actor._id) {
                        delete changed.flags?.ptu?.grantedBy;
                        changed.flags= foundry.utils.expandObject({"ptu.-=grantedBy": null});
                    };
                    oldClass.update = {"flags.ptu.itemGrants": {[`-=${this._id}`]: null}};
                }
            }
        }

        super._preUpdate(changed, options, user);

        if(oldClass?.actor) await oldClass.actor.update(oldClass.update);
        if(newClass?.actor) await newClass.actor.update(newClass.update);
    }

    /** @override */
    prepareActorData() {
        const { actor } = this;
        const prefix = this.isClass ? "class" : "feat";
        const slug = this.slug;
        actor.rollOptions.all[`${prefix}:${slug}`] = true;
    }

    /** @override */
    prepareSiblingData() {
        const itemGrants = this.flags.ptu.itemGrants;
        if(!itemGrants) return this.grants = [];
        this.grants = Object.values(itemGrants).flatMap((grant) => {
            if(grant.id === this._id) return [];
            return this.actor?.items.get(grant.id) ? [this.actor.items.get(grant.id)] : [];
        }).sort((a,b) => (a.sort || 0) - (b.sort || 0));
    }

    /** @override */
    getRollOptions(prefix = "feat") {
        return [
            ...super.getRollOptions(prefix),
            `${prefix}:category:${this.category}`,
        ]
    }
}

export { PTUFeat }