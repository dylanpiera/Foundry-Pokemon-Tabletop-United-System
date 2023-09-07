import { PTUItemSheet } from "../index.js";

class PTUSpeciesSheet extends PTUItemSheet {
    /** @override */
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes.push("species");
        options.height = 600;
        options.dragDrop = [
            {dragSelector: ".item-list .item.ability-item.draggable", dropSelector: ".item-list .item.ability-item"},
            {dragSelector: ".item-list .item.move-item.draggable", dropSelector: ".item-list .item.move-item"},
            {dragSelector: undefined, dropSelector: '.evolution-item'},
            {dragSelector: undefined, dropSelector: undefined}
        ]
        return options;
    }

    /** @override */
    async getData() {
        const data = await super.getData();
        
        data.types = [...Object.keys(CONFIG.PTU.data.typeEffectiveness).filter(type => type != "Untyped")];
        data.types.unshift("");

        data.view = (() => {
            // "full" : "entry";
            if(game.user.isGM) return "full";

            const permission = game.settings.get("ptu", "automation.dexPermission");
            switch(permission) {
                case 1: throw new Error("Players may not open species sheets");
                case 2: return "entry";
                case 3: return this.item.actor?.isOwner ? "full" : "entry";
                case 4: {
                    if(!game.user.character) ui.notifications.warn("PTU.UserNeedsToOwnCharacter", {localize: true})
                    if(!game.user.character?.system.dex?.owned?.length) return "entry";
                    if(game.user.character.system.dex.owned.find(slug => slug == this.item.slug)) return "full";
                    return "entry";
                }
                case 5: {
                    ui.notifications.warn("GM Prompt is not implemented, showing basic view.");
                    return "entry";
                }
                case 6: return "full";
            }
            return "entry";
        })();

        return data;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        
        html.find('.item[data-item-uuid] .item-name').on('click', async (event) => {
            event.preventDefault();
            
            const uuid = event.currentTarget.parentElement.dataset.itemUuid;
            if(!uuid) return;

            const item = await fromUuid(uuid);
            if(item) item.sheet.render(true);
        });

        html.find('.capability-item .item-control.item-delete').on('click', (event) => {
            event.preventDefault();

            const uuid = event.currentTarget.parentElement.parentElement.dataset.itemUuid;
            if(!uuid) return;

            const items = this.item.system.capabilities.other?.filter(item => item.uuid != uuid) ?? [];
            return this.item.update({"system.capabilities.other": items});
        });

        html.find('.ability-item .item-control.item-delete').on('click', (event) => {
            event.preventDefault();

            const {itemUuid, itemSubtype} = event.currentTarget.parentElement.parentElement.dataset;
            if(!itemUuid || !itemSubtype) return;

            const abilities = this.item.system.abilities;
            abilities[itemSubtype] = abilities[itemSubtype]?.filter(item => item.uuid != itemUuid) ?? [];
            return this.item.update({"system.abilities": abilities});
        });

        html.find('.move-item .item-control.item-delete').on('click', (event) => {
            event.preventDefault();

            const {itemUuid, itemSubtype} = event.currentTarget.parentElement.parentElement.dataset;
            if(!itemUuid || !itemSubtype) return;

            const moves = this.item.system.moves;
            moves[itemSubtype] = moves[itemSubtype]?.filter(item => item.uuid != itemUuid) ?? [];
            return this.item.update({"system.moves": moves});
        });

        html.find('.evolution-item .item-control.item-delete').on('click', (event) => {
            event.preventDefault();

            const {itemUuid} = event.currentTarget.parentElement.parentElement.dataset;
            if(!itemUuid) return;

            const evolutions = this.item.system.evolutions;
            evolutions.splice(evolutions.findIndex(e => e.uuid == itemUuid), 1);
            return this.item.update({"system.evolutions": evolutions});
        });

        html.find('.evolution-item .item-control.sub-item-delete').on('click', (event) => {
            event.preventDefault();

            const {itemUuid, itemIndex} = event.currentTarget.parentElement.parentElement.dataset;
            if(!itemUuid || !itemIndex) return;

            const evolutions = this.item.system.evolutions;
            if(!evolutions[itemIndex].other?.evolutionItem) return;

            evolutions[itemIndex].other.evolutionItem = undefined;
            return this.item.update({"system.evolutions": evolutions});
        });

        html.find('.item-list').on('dragover', (event) => {
            event.preventDefault();
            event.currentTarget.classList.add("dragover");
        });

        html.find('.item-list').on('dragleave', (event) => {
            event.preventDefault();
            event.currentTarget.classList.remove("dragover");
        });

        $(html).find('.linked-item').each(async (i, element) => {
			await CONFIG.PTU.util.Enricher.enrichContentLinks(element);
		});
    }

    get allowedDropTypes() {
        return ["capability", "ability", "move", "item", "species"]
    }

    /** @override */
    _onDragStart(event) {
        const li = event.currentTarget;
        const { itemUuid, itemSlug, itemType, itemSubtype, itemIndex } = li.dataset;

        event.dataTransfer.setData('text/plain', JSON.stringify({
            uuid: itemUuid,
            slug: itemSlug,
            type: itemType,
            subtype: itemSubtype,
            index: itemIndex
        }));
    }

    /** @override */
    async _onDrop(event) {
        const data = JSON.parse(event.dataTransfer.getData('text/plain'));
        $(event.currentTarget)?.find('.item-list')?.removeClass("dragover");

        // Compendium / World items
        if(data.type == "Item" && data.uuid) {
            const item = await fromUuid(data.uuid);

            if(!item) return;
            if(!this.allowedDropTypes.includes(item.type)) return;


            switch(item.type) {
                case "capability": {
                    const otherCapabilities = this.item.system.capabilities.other ?? [];
                    if(otherCapabilities.find(c => c.slug == item.slug)) return;

                    otherCapabilities.push({slug: item.slug, uuid: item.uuid});
                    return this.item.update({"system.capabilities.other": otherCapabilities});
                }
                case "ability": {
                    const abilities = this.item.system.abilities;
                    
                    if(abilities.basic?.find(a => a.slug == item.slug)) return;
                    if(abilities.advanced?.find(a => a.slug == item.slug)) return;
                    if(abilities.high?.find(a => a.slug == item.slug)) return;

                    const {itemType, itemSubtype} = event.currentTarget?.dataset ?? {};

                    // If the drop was targeted on a specific subtype, add the ability to that subtype
                    if(itemType == "ability" && itemSubtype) {
                        abilities[itemSubtype].push({slug: item.slug, uuid: item.uuid});
                    }
                    // Otherwise add it to basic
                    else {
                        abilities.basic.push({slug: item.slug, uuid: item.uuid});
                    }

                    return this.item.update({"system.abilities": abilities});
                }
                case "move": {
                    const moves = this.item.system.moves;

                    const {itemType, itemSubtype} = event.currentTarget?.dataset ?? {};

                    // If the drop was targeted on a specific subtype, add the move to that subtype
                    if(itemType == "move" && itemSubtype && itemSubtype != "level") {
                        if(moves[itemSubtype]?.find(m => m.slug == item.slug)) return;
                        moves[itemSubtype].push({uuid: item.uuid, slug: item.slug});

                        this.dragMove = item.slug;
                    }
                    // Otherwise add it to level
                    else {
                        if(moves.level?.find(m => m.slug == item.slug)) return;
                        if(this.dragMove == item.slug) {
                            this.dragMove = null;
                            return;
                        }
                        moves.level.unshift({uuid: item.uuid, slug: item.slug, level: 1});
                    }

                    return this.item.update({"system.moves": moves});
                }
                case "species": {
                    const evolutions = this.item.system.evolutions;
                    if(evolutions.find(e => e.slug == item.slug)) return;

                    const level = item.system?.evolutions?.find(e => e.slug == item.slug)?.level ?? 0;
                    const evolutionItem = item.system?.evolutions?.find(e => e.slug == item.slug)?.other?.evolutionItem ?? undefined;
                    const restrictions = item.system?.evolutions?.find(e => e.slug == item.slug)?.other?.restrictions ?? [];

                    evolutions.push({level, slug: item.slug, uuid: item.uuid, other: {
                        evolutionItem,
                        restrictions
                    }});
                    return this.item.update({"system.evolutions": evolutions});
                }
                case "item": {
                    const {index} = event.currentTarget?.dataset ?? {};
                    if(index === undefined) return;

                    const evolutions = this.item.system.evolutions;
                    if(evolutions[index]?.other?.evolutionItem?.slug == item.slug) return;

                    evolutions[index].other.evolutionItem = {slug: item.slug, uuid: item.uuid};
                    return this.item.update({"system.evolutions": evolutions});
                }
            }
        }

        // If there is no current Target this already ran so ignore
        if(!event.currentTarget?.dataset?.itemType && !event.currentTarget?.dataset?.zone) return;

        if(data.type == "ability") {
            const {subtype, index} = data;
            const {itemType, itemIndex, zone, subZone} = event.currentTarget.dataset;
            let {itemSubtype} = event.currentTarget.dataset;

            if(itemType != "ability") {
                if(zone != "ability") return;

                if(!itemSubtype) itemSubtype = subZone;
            }

            // re-order
            if(itemSubtype == subtype) {
                const abilities = this.item.system.abilities;
                const ability = abilities[subtype][index];
                if(!ability) return;
                abilities[subtype].splice(index, 1);
                abilities[subtype].splice(itemIndex, 0, ability);
                return this.item.update({"system.abilities": abilities});
            }
            // move to different category
            else {
                const abilities = this.item.system.abilities;
                const ability = abilities[subtype][index];
                if(!ability || abilities[itemSubtype].find(a => a.slug == ability.slug)) return;
                abilities[subtype].splice(index, 1);
                if(itemIndex) abilities[itemSubtype].splice(itemIndex, 0, ability);
                else abilities[itemSubtype].push(ability);
                return this.item.update({"system.abilities": abilities});
            }

        }

        if(data.type == "move") {
            const {subtype, index} = data;
            const {itemType, itemIndex, zone, subZone} = event.currentTarget.dataset;
            let { itemSubtype } = event.currentTarget.dataset;

            if(itemType != "move") {
                if(zone != "move") return;

                if(!itemSubtype) itemSubtype = subZone;
            }

            // re-order
            if(itemSubtype == subtype) {
                const moves = this.item.system.moves;
                const move = moves[subtype][index];
                if(!move) return;
                moves[subtype].splice(index, 1);
                moves[subtype].splice(itemIndex, 0, move);
                return this.item.update({"system.moves": moves});
            }
            // move to different category
            else {
                const moves = this.item.system.moves;
                const move = moves[subtype][index];
                if(!move || moves[itemSubtype].find(m => m.slug == move.slug)) return;
                if(subtype == "level") {
                    delete move.level;
                }
                if(itemSubtype == "level") {
                    move.level = 1;
                }
                moves[subtype].splice(index, 1);
                if(itemIndex) moves[itemSubtype].splice(itemIndex, 0, move);
                else moves[itemSubtype].push(move);
                return this.item.update({"system.moves": moves});
            }
        }
    }

    /** @override */
    _updateObject(event, formData) {
        const expanded = expandObject(formData);

        const types = [...new Set(Object.values(expanded.system.type))].filter(type => type != "Untyped" && type != "");
        if(types.length == 0) types.push("Untyped");
        expanded.system.types = types;

        if(expanded.system.capabilities?.naturewalk) {
            expanded.system.capabilities.naturewalk = Array.isArray(expanded.system.capabilities.naturewalk) ? expanded.system.capabilities.naturewalk : expanded.system.capabilities.naturewalk.split(",").map(naturewalk => naturewalk.trim());
        }
        if(expanded.system.breeding?.eggGroups) {
            expanded.system.breeding.eggGroups = Array.isArray(expanded.system.breeding.eggGroups) ? expanded.system.breeding.eggGroups : expanded.system.breeding.eggGroups.split(",").map(eggGroup => eggGroup.trim());
        }
        if(expanded.system.habitats) {
            expanded.system.habitats = Array.isArray(expanded.system.habitats) ? expanded.system.habitats : expanded.system.habitats.split(",").map(habitat => habitat.trim());
        }
        if(expanded.system.diet) {
            expanded.system.diet = Array.isArray(expanded.system.diet) ? expanded.system.diet : expanded.system.diet.split(",").map(diet => diet.trim());
        }
        
        if(expanded.system.moves?.level) {
            const moves = Object.values(expanded.system.moves.level)
                .map(move => {
                    if(!move.level) move.level = 1;
                    if(move.level && !isNaN(Number(move.level))) {
                        move.level = Number(move.level);
                    }
                    else {
                        if(""+move.level.toLowerCase() != "evo" ) move.level = "Evo";
                    }
                    return move;
                })
                .sort((a, b) => {
                    // if both levels are numbers compare
                    if(!isNaN(Number(a.level)) && !isNaN(Number(b.level))) {
                        return Number(a.level) - Number(b.level);
                    }
                    // if one of them is the string 'evo' put it first
                    if((""+a.level).toLowerCase() == "evo") return -1;
                    if((""+b.level).toLowerCase() == "evo") return 1;

                    // otherwise throw error
                    throw new Error("Invalid level");
                });
            expanded.system.moves.level = moves;
        }

        if(expanded.system.evolutions) {
            const evolutions = Object.values(expanded.system.evolutions)
                .map(evolution => {
                    if(evolution.level && !isNaN(Number(evolution.level))) {
                        evolution.level = Number(evolution.level);
                    }
                    else {
                        evolution.level = 1;
                    }
                    return evolution;
                });
            for(let i = 0; i < evolutions.length; i++) {
                evolutions[i].other.restrictions = Array.isArray(expanded.system.evolutions[i].other.restrictions) ? expanded.system.evolutions[i].other.restrictions : expanded.system.evolutions[i].other.restrictions.split(",").map(restriction => restriction.trim());
                evolutions[i].other.evolutionItem = this.item.system.evolutions[i].other.evolutionItem;
            }

            expanded.system.evolutions = evolutions.sort((a, b) => a.level - b.level);
        }

        return super._updateObject(event, flattenObject(expanded));
    }

    /** @override */
    _canUserView(user) {
        return true;
    }
}

export { PTUSpeciesSheet }