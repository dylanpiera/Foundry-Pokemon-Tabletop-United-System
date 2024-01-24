import { ActorConfig } from "./sheet/actor-config.js";

class PTUActorSheet extends ActorSheet {
    /** @override */
    _getHeaderButtons() {
        const buttons = super._getHeaderButtons();
        const sheetButton = buttons.find((button) => button.class === "configure-sheet");
        const hasMultipleSheets = Object.keys(CONFIG.Actor.sheetClasses[this.actor.type]).length > 1;
        if (!hasMultipleSheets && sheetButton) {
            buttons.splice(buttons.indexOf(sheetButton), 1);
        }

        if (this.isEditable) {
            const index = buttons.findIndex((b) => b.class === "close");
            buttons.splice(index, 0, {
                label: "Configure", // Top-level foundry localization key
                class: "configure-creature",
                icon: "fas fa-cog",
                onclick: () => this._onConfigureActor(),
            });
        }

        // Add notes button
        buttons.unshift({
            label: "Notes",
            class: "open-notes",
            icon: "fas fa-book",
            onclick: () => this.openNotes(),
        })

        return buttons;
    }

    _onConfigureActor() {
        new ActorConfig(this.actor).render(true);
    }

    /** Emulate a sheet item drop from the canvas */
    async emulateItemDrop(data) {
        return this._onDropItem({ preventDefault: () => { } }, data);
    }

    async openNotes() {
        const folder = await (async () => {
            const folderId = game.settings.get("ptu", "worldNotesFolder");
            if (!folderId) {
                if (game.user.isGM) return game.ptu.macros.initializeWorldNotes();
                else return null;
            }

            const folder = game.folders.get(folderId);
            if (!folder) {
                if (game.user.isGM) return game.ptu.macros.initializeWorldNotes();
                else return null;
            }

            return folder;
        })();
        if (!folder) return ui.notifications.error("No folder found for world notes; Please ask your GM to login and not to delete the folder \"Actor Notes\"");

        const journalEntry = await (async () => {
            const journalId = this.actor.getFlag("ptu", "notesId");
            if (!journalId) {
                const journal = await JournalEntry.create({
                    name: this.actor.name,
                    folder: folder.id,
                    ownership: this.actor.ownership,
                    pages: [
                        {
                            name: "Notes",
                            type: "text",
                            ownership: this.actor.ownership,
                            text: {
                                format: 1,
                                content: this.actor.system.notes || ""
                            }
                        }
                    ]
                });
                await this.actor.setFlag("ptu", "notesId", journal.id);
                return journal;
            }

            const journal = await fromUuid(`JournalEntry.${journalId}`);
            if (!journal) {
                await this.actor.unsetFlag("ptu", "notesId");
                return this.openNotes();
            }

            return journal;
        })();
        if (!journalEntry) return;

        journalEntry.sheet.render(true);
    }

    /** @override */
    async _onDrop(event) {
        const data = TextEditor.getDragEventData(event);
        const actor = this.actor;
        const allowed = Hooks.call("dropActorSheetData", actor, this, data);
        if (allowed === false) return;

        // Case 1 - Money
        if (data.type === "pokedollar") {
            const amount = parseInt(data.data.amount);
            if (!amount) return ui.notifications.error("Invalid amount of money dropped");

            if (data.data.item) {
                const item = await fromUuid(data.data.item);
                if (!item) return ui.notifications.error("Invalid item dropped");

                if ((actor.system.money ?? 0) < amount) return ui.notifications.error(`${actor.name} does not have enough money to pay for ${item.name} (Cost: ${amount} Poké, Current: ${actor.system.money})`);
                await actor.update({
                    "system.money": actor.system.money - amount,
                });
                // If duplicate item gets added instead increase the quantity
                const existingItem = actor.items.getName(item.name);
                if (existingItem && existingItem.system.quantity) {
                    const quantity = foundry.utils.duplicate(existingItem.system.quantity);
                    await existingItem.update({ "system.quantity": Number(quantity) + (item.system.quantity > 0 ? Number(item.system.quantity) : 1) });
                }
                else {
                    await Item.create(item.toObject(), { parent: actor });
                }
                return ui.notifications.info(`${actor.name} Paid ${amount} Poké for ${item.name} (New Total: ${actor.system.money})`);
            }
            await actor.update({
                "system.money": actor.system.money + amount
            });
            return ui.notifications.info(`${actor.name} Gained ${amount} Poké (New Total: ${actor.system.money})`);
        }
        else {
            return super._onDrop(event);
        }
    }
}

export { PTUActorSheet }