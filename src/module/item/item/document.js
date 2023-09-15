import { PTUItem } from '../index.js';
class PTUItemItem extends PTUItem {

    get container() {
        return this.grantedBy;
    }

    get isContainer() {
        return this.system.container;
    }

    /** @override */
    prepareSiblingData() {
        const itemGrants = this.flags.ptu.itemGrants;
        if(!itemGrants) return this.grants = [];
        this.grants = Object.values(itemGrants).flatMap((grant) => {
            return this.actor?.items.get(grant.id) ? [this.actor.items.get(grant.id)] : [];
        }).sort((a,b) => (a.sort || 0) - (b.sort || 0));
    }

    /** @override */
    async _preUpdate(changed, options, user) {
        let oldClass = {}, newClass = {};
        
        if(changed.flags?.ptu?.grantedBy !== undefined) {
            const container = this.actor?.items.get(changed.flags.ptu.grantedBy.id);
            if(container) {
                newClass.actor = container;
                newClass.update = {"flags.ptu.itemGrants": {[this._id]: {id: this._id, onDelete: "detach"}}};   
            }
            if(this.flags.ptu?.grantedBy?.id) {
                const oldContainer = this.actor?.items.get(this.flags.ptu.grantedBy.id);
                if(oldContainer) {
                    oldClass.actor = oldContainer;
                    oldClass.update = {"flags.ptu.itemGrants": {[`-=${this._id}`]: null}};
                }
            }
        }
        else if(changed.flags?.ptu?.["-=grantedBy"] !== undefined) {
            const oldContainer = this.actor?.items.get(this.flags.ptu?.grantedBy?.id);
            if(oldContainer) {
                oldClass.actor = oldContainer;
                oldClass.update = {"flags.ptu.itemGrants": {[`-=${this._id}`]: null}};
            }
        }

        super._preUpdate(changed, options, user);

        if(oldClass?.actor) await oldClass.actor.update(oldClass.update);
        if(newClass?.actor) await newClass.actor.update(newClass.update);
    }
}

export { PTUItemItem }