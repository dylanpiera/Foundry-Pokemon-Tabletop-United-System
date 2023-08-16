import { Progress } from "../../../util/progress.js";

class PTUPartySheet extends FormApplication {
    constructor({actor, ...options} = {}) {
        if(!actor) throw new Error("PTU.PartySheet.NoActor");
        super(options);
        
        this._prepare(actor);
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            title: "PTU.PartySheet.Title",
            classes: ["ptu", "sheet", "party"],
            width: 637,
            height: 600,
            template: 'systems/ptu/static/templates/apps/party-sheet.hbs',
            dragDrop: [
                {dragSelector: ".party-list .party-item.draggable", dropSelector: ".party-list.droppable"},
                {dragSelector: undefined, dropSelector: '.party-list.droppable'},
                {dragSelector: undefined, dropSelector: undefined}
            ],
            resizable: true,
            //tabs: [{ navSelector: ".tabs", contentSelector: ".sheet-body", initial: "description" }]
        });
    };

    /** @override */
    _canDragStart(selector) {
        return this.isEditable;
    }
    /** @override */
    _canDragDrop(selector) {
        return this.isEditable;
    }

    getData() {
        const data = super.getData();
       
        data.trainer = this.trainer;
        data.party = this.party;
        data.boxed = this.boxed;
        data.available = this.available;

        return data;
    }

    _prepare(actor) {
        this.#setTrainer(actor);
        this.#loadFolders();
        this.#loadParty();
        this.#loadBox();
        this.#loadAvailable();
    }

    #setTrainer(actor) {
        // If the actor is a pokemon, we need to get the trainer
        if(actor.type == "pokemon") {
            // if a trainer is set, get the actor
            if(actor.flags?.ptu?.party?.trainer) {
                this.trainer = game.actors.get(actor.flags.ptu.party.trainer);

                return;
            }

            // Otherwise, try find the trainer from the user
            if(game.user.character && game.user.character.type == "trainer") {
                this.trainer = game.user.character;
                return;
            }

            // Otherwise, attempt to find the trainer from ownership permissions
            const pool = [];
            for(const [owner, value] of Object.entries(actor.ownership)) {
                if(owner == "default" || value < 3) continue;
                
                const user = game.users.get(owner);
                if(!user) continue;

                if(user.character && user.character.type == "character") {
                    pool.push(user.character);
                }
            }
            if(pool.length == 1) {
                this.trainer = pool[0];
                return;
            }

            ui.notifications.error("PTU.PartySheet.NoTrainer", {localize: true});
            throw new Error("PTU.PartySheet.NoTrainer");
        } 

        // Otherwise the actor is our trainer
        this.trainer = actor;
        return;
    }
    
    #loadFolders() {
        // Get available folders from the trainer's folder
        const folder = this.trainer.folder;
        if(!folder) {
            ui.notifications.error("PTU.PartySheet.NoFolder", {localize: true});
            throw new Error("PTU.PartySheet.NoFolder");
        };

        const party = folder.children.find(folder => folder.folder.name == "Party")?.folder;
        const box = folder.children.find(folder => folder.folder.name == "Box")?.folder;
        
        this.folders = {
            root: folder,
            party,
            box
        }

        if(!party) {
            // Create the party folder
            Folder.create({name: "Party", type: "Actor", folder: folder.id})
                .then(folder => {
                    this.folders.party = folder;
                })
                // Move all pokemon in the trainer's folder to the party folder
                .then(async () => {
                    const partyFolder = this.folders.party;
                    const party = game.actors.filter(actor =>
                        actor.type == "pokemon" &&
                        actor.flags?.ptu?.party?.trainer == this.trainer.id &&
                        !actor.flags?.ptu?.party?.boxed);

                    const available = folder.contents.filter(actor => actor.type == "pokemon" && !actor.flags?.ptu?.party?.trainer) ?? [];
                    for(const mon of available) {
                        if(mon.folder.id == partyFolder.id) continue;
                        await mon.update({
                            "folder": partyFolder.id, 
                            "flags.ptu.party.trainer": this.trainer.id, 
                            "flags.ptu.party.boxed": false
                        });
                    };
                    for(const mon of party) {
                        if(mon.folder.id == partyFolder.id) continue;
                        await mon.update({"folder": partyFolder.id});
                    }

                    this.#loadAvailable();
                    this.#loadParty();
                    await this.render(true);
                })
        }
        if(!box) {
            // Create the box folder
            Folder.create({name: "Box", type: "Actor", folder: folder.id})
                .then(folder => {
                    this.folders.box = folder;
                })
                // Move all pokemon with the boxed flag to the box folder
                .then(async () => {
                    const box = this.folders.box;
                    const boxed = game.actors.filter(actor =>
                        actor.type == "pokemon" &&
                        actor.flags?.ptu?.party?.trainer == this.trainer.id &&
                        actor.flags?.ptu?.party?.boxed);
                    for(const mon of boxed) {
                        if(mon.folder.id == box.id) continue;
                        await mon.update({"folder": box.id});
                    }

                    this.#loadAvailable();
                    this.#loadBox();
                    await this.render(true);
                })
        }
    }

    #loadParty() {

        // If the trainer has a party folder, get the pokemon from the folder
        if(this.folders.party) {
            const party = this.folders.party.contents.filter(actor => actor.type == "pokemon");
            this.party = party;
            return;
        }
        // Otherwise, get the pokemon from the flag
        const party = game.actors.filter(actor => 
            actor.type == "pokemon" &&
            actor.flags?.ptu?.party?.trainer == this.trainer.id &&
            !actor.flags?.ptu?.party?.boxed);
        
        this.party = party;
    }

    #loadBox() {
        // If the trainer has a box, get the pokemon from the box
        if(this.folders.box) {
            const boxed = this.folders.box.contents.filter(actor => actor.type == "pokemon");
            this.boxed = boxed;
            return;
        }
        // Otherwise, get the pokemon from the flag
        const boxed = game.actors.filter(actor => 
            actor.type == "pokemon" &&
            actor.flags?.ptu?.party?.trainer == this.trainer.id &&
            actor.flags?.ptu?.party?.boxed);
        
        this.boxed = boxed;
    }

    #loadAvailable() {
        // Load available pokemon located in the trainer's folder
        const folder = this.folders.root;

        const available = folder.contents.filter(actor => actor.type == "pokemon" && !actor.flags?.ptu?.party?.trainer) ?? [];
        this.available = available;
    }

    /** @override */
	_getHeaderButtons() {
		let buttons = super._getHeaderButtons();

        buttons.unshift({
            label: "Download Party",
            class: "party-download",
            icon: "fas fa-download",
            onclick: this.downloadParty.bind(this)
        });

		return buttons;
	}

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        html.find('.party-list.droppable').on('dragover', (event) => {
            event.preventDefault();
            event.currentTarget.classList.add("dragover");
        });

        html.find('.party-list.droppable').on('dragleave', (event) => {
            event.preventDefault();
            event.currentTarget.classList.remove("dragover");
        });
    }

    /** @override */
    _onDragStart(event) {
        const li = event.currentTarget;
        const { actorUuid, partyStatus, actorIndex } = li.dataset;

        event.dataTransfer.setData('text/plain', JSON.stringify({
            uuid: actorUuid,
            type: partyStatus,
            index: actorIndex
        }));
    }

    /** @override */
    async _onDrop(event) {
        const data = JSON.parse(event.dataTransfer.getData('text/plain'));
        $(event.currentTarget)?.find('.item-list')?.removeClass("dragover");

        if(data.type == "Actor" && data.uuid) {
            if(this.handledDrop) return;
            const actor = await fromUuid(data.uuid);

            if(!actor) return;
            if(actor.type != "pokemon") return;

            // If the actor is already in the party, do nothing
            if(actor.flags?.ptu?.party?.trainer == this.trainer.id) return;

            const { partyStatus } = event.currentTarget?.dataset ?? {};

            this.handledDrop = true;
            // If the drop was targeted on a specific area, add the actor to that area
            if(partyStatus) {
                switch(partyStatus) {
                    case "available": {
                        const folder = this.folders.root;
                    
                        if(actor.folder?.id != folder.id) {
                            await actor.update({folder: folder.id});
                        }
                        if(actor.flags?.ptu?.party?.trainer) {
                            await actor.unsetFlag("ptu", "party");
                        }

                        this.available.push(actor);
                        this.handledDrop = false;
                        return this.render();
                    }
                    case "party": {
                        let folder = this.folders.party;
                        if(!folder) {
                            folder = await Folder.create({name: "Party", type: "Actor", folder: this.folders.root.id});       
                        }

                        if(actor.folder?.id != folder.id) {
                            await actor.update({folder: folder.id});
                        }
                        await actor.setFlag("ptu", "party", {trainer: this.trainer.id, boxed: false});
                        
                        this.party.push(actor);
                        this.available = this.available.filter(a => a.uuid != actor.uuid);
                        this.handledDrop = false;
                        return this.render();
                    }
                    case "boxed": {
                        let folder = this.folders.box;
                        if(!folder) {
                            folder = await Folder.create({name: "Box", type: "Actor", folder: this.folders.root.id});       
                        }

                        if(actor.folder?.id != folder.id) {
                            await actor.update({folder: folder.id});
                        }
                        await actor.setFlag("ptu", "party", {trainer: this.trainer.id, boxed: true});

                        this.boxed.push(actor);
                        this.available = this.available.filter(a => a.uuid != actor.uuid);
                        this.handledDrop = false;
                        return this.render();
                    }
                }

            }
            else {
                // Otherwise, add the actor to the party if there is space
                if(this.party.length < 6) {
                    let folder = this.folders.party;
                    if(!folder) {
                        folder = await Folder.create({name: "Party", type: "Actor", folder: this.folders.root.id});       
                    }

                    if(actor.folder?.id != folder.id) {
                        await actor.update({folder: folder.id});
                    }
                    await actor.setFlag("ptu", "party", {trainer: this.trainer.id, boxed: false});
                    
                    this.party.push(actor);
                    this.available = this.available.filter(a => a.uuid != actor.uuid);    
                }
                else {
                    let folder = this.folders.box;
                    if(!folder) {
                        folder = await Folder.create({name: "Box", type: "Actor", folder: this.folders.root.id});       
                    }

                    if(actor.folder?.id != folder.id) {
                        await actor.update({folder: folder.id});
                    }
                    await actor.setFlag("ptu", "party", {trainer: this.trainer.id, boxed: true});

                    this.boxed.push(actor);
                    this.available = this.available.filter(a => a.uuid != actor.uuid);
                }

                this.handledDrop = false;
                return this.render();
            }
        }

        // If there is no partyStatus this already ran so ignore
        if(!event.currentTarget?.dataset?.partyStatus) return;

        const { uuid, type, index } = data;
        const { partyStatus } = event.currentTarget.dataset;
        const actor = await fromUuid(uuid);

        if(!actor) return;
        if(actor.type != "pokemon") return;

        switch(partyStatus) {
            case "available": {
                const folder = this.folders.root;

                if(actor.folder?.id != folder.id) {
                    await actor.update({folder: folder.id});
                }
                if(actor.flags?.ptu?.party?.trainer) {
                    await actor.unsetFlag("ptu", "party");
                }

                this[type].splice(index, 1);
                this.available.push(actor);
                return this.render();
            }
            case "party": {
                let folder = this.folders.party;
                if(!folder) {
                    folder = await Folder.create({name: "Party", type: "Actor", folder: this.folders.root.id});
                }

                if(actor.folder?.id != folder.id) {
                    await actor.update({folder: folder.id});
                }
                await actor.setFlag("ptu", "party", {trainer: this.trainer.id, boxed: false});

                this[type].splice(index, 1);
                this.party.push(actor);
                return this.render();
            }
            case "boxed": {
                let folder = this.folders.box;
                if(!folder) {
                    folder = await Folder.create({name: "Box", type: "Actor", folder: this.folders.root.id});
                }

                if(actor.folder?.id != folder.id) {
                    await actor.update({folder: folder.id});
                }
                await actor.setFlag("ptu", "party", {trainer: this.trainer.id, boxed: true});

                this[type].splice(index, 1);
                this.boxed.push(actor);
                return this.render();
            }
        }
    }

    downloadParty() { 
        const data = {
            trainer: this.trainer.toCompendium(null, {}),
            party: this.party.map(p => {
                const data = p.toCompendium(null, {});
                data.flags.exportSource = {
                    world: game.world.id,
                    system: game.system.id,
                    coreVersion: game.version,
                    systemVersion: game.system.version
                };
                return data;
            }),
            boxed: this.boxed.map(p => {
                const data = p.toCompendium(null, {});
                data.flags.exportSource = {
                    world: game.world.id,
                    system: game.system.id,
                    coreVersion: game.version,
                    systemVersion: game.system.version
                };
                return data;
            }),
        }
        data.trainer.flags.exportSource = {
            world: game.world.id,
            system: game.system.id,
            coreVersion: game.version,
            systemVersion: game.system.version
        };

        const filename = ["fvtt", "ptuParty", this.trainer.name?.slugify(), randomID()].filterJoin("-");
        saveDataToFile(JSON.stringify(data, null, 2), "text/json", `${filename}.json`);
    }

    static async importParty() {
        const [fileHandler] = await window.showOpenFilePicker({
            types: [
                {
                    description: "JSON Files",
                    accept: {
                        "text/json": [".json"]
                    }
                }
            ],
            excludeAcceptAllOption: true,
            multiple: false
        });
        const file = await fileHandler.getFile();
        if(!file) return;
        if(!file.name.startsWith("fvtt-ptuParty-")) {
            ui.notifications.error("Invalid file type. Please select a PTU Party file.");
            return;
        }

        const text = await file.text();
        const json = JSON.parse(text);

        const { trainer, party, boxed } = json;

        let folder = game.folders.get(trainer.folder);
        if(!folder)  {
            folder = game.folders.getName(trainer.name);
            if(folder) trainer.folder = folder.id;
        }
        // Check if folder exists; in which case this is a overwrite
        if(folder) {
            const existingActor = folder.contents.find(a => a.name == trainer.name);
            if(existingActor) {
                // Prompt user to overwrite
                const confirmed = await Dialog.confirm({
                    title: "Overwrite Party",
                    content: "It appears you're trying to import a party that already exists. Would you like to overwrite it?",
                });
                if(!confirmed) return;

                // Log the existing party to the console in case of an accident
                const partySheet = new PTUPartySheet({actor: existingActor});
                const data = {
                    trainer: partySheet.trainer,
                    party: partySheet.party,
                    boxed: partySheet.boxed
                }
                console.log(duplicate(data));

                // Delete existing party
                await existingActor.delete();
                for(const actor of partySheet.party) {
                    await actor.delete();
                }
                for(const actor of partySheet.boxed) {
                    await actor.delete();
                }
            }
        }
        else {
            folder = await Folder.create({
                name: trainer.name,
                type: "Actor",
            })

            trainer.folder = folder.id;
        }

        // Create the new party
        const totalCount = party.length + boxed.length + 1;
        const progress = new Progress({steps: totalCount});

        progress.advance(`Importing Party: Trainer ${trainer.name}`)
        const newTrainer = await CONFIG.Actor.documentClass.create(trainer);
        for(const actor of party) {
            progress.advance(`Importing Party: Party Pokemon ${actor.name}`)
            if(actor.folder) {
                let partyFolder = game.folders.get(actor.folder);
                if(!partyFolder) {
                    partyFolder = folder.children.find(folder => folder.folder.name == "Party")?.folder;
                    if(!partyFolder) {
                        partyFolder = await Folder.create({name: "Party", type: "Actor", folder: folder.id});
                    }
                }
                actor.folder = partyFolder.id;

            }
            await CONFIG.Actor.documentClass.create(actor);
        }
        for(const actor of boxed) {
            progress.advance(`Importing Party: Boxed Pokemon ${actor.name}`)
            if(actor.folder) {
                let boxFolder = game.folders.get(actor.folder);
                if(!boxFolder) {
                    boxFolder = folder.children.find(folder => folder.folder.name == "Box")?.folder;
                    if(!boxFolder) {
                        boxFolder = await Folder.create({name: "Box", type: "Actor", folder: folder.id});
                    }
                }
                actor.folder = boxFolder.id;
            }
            await CONFIG.Actor.documentClass.create(actor);
        }
        progress.close("Importing Party: Completed!")

        const partySheet = new PTUPartySheet({actor: newTrainer});
        partySheet.render(true);
    }
}

export { PTUPartySheet }