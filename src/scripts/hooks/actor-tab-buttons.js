export const ActorButtons = {
    listen() {
        Hooks.on("renderSidebarTab", () => {
            if (!game.user.isGM) return;
            const sidebarButtons = $("#sidebar #actors .directory-header .action-buttons");

            if (sidebarButtons.find(".import-party").length > 0) return;
            sidebarButtons.append(`<button class="import-party"><i class="fas fa-upload"></i>Import Party</button>`)
            sidebarButtons.append(`<button class="mass-generator"><i class="fas fa-users"></i>Pkmn Generator</button>`)
            sidebarButtons.append(`<button class="quick-build"><i class="fas fa-users"></i>NPC Quick Build</button>`)

            $("#sidebar #actors .directory-header .action-buttons .import-party").on("click", async (event) => {
                await CONFIG.PTU.ui.party.sheetClass.importParty();
            });
            $("#sidebar #actors .directory-header .action-buttons .mass-generator").on("click", async (event) => {
                new CONFIG.PTU.ui.speciesMassGenerator.sheetClass().render(true);
            });
            $("#sidebar #actors .directory-header .action-buttons .quick-build").on("click", async (event) => {
                event.target.disabled = true;
                const npcQuickBuild = new CONFIG.PTU.ui.npcQuickBuild.sheetClass();
                await npcQuickBuild.preload()
                npcQuickBuild.render(true).finally(()=>{
                    event.target.disabled = false;
                });
            });
        });

        Hooks.on("renderSidebarTab", () => {
            const footer = $(".compendium-sidebar .directory-footer");
            if (footer.find(".compendium-browser-btn").length > 0) return;

            footer.append(`<button type="button" class="compendium-browser-btn"><i class="fa-solid fa-magnifying-glass"></i> Compendium Browser</button>`);
            footer.find(".compendium-browser-btn").on("click", () => {
                game.ptu.compendiumBrowser.render(true)
            });
        });

        Hooks.on("renderSidebarTab", () => {
            if (!game.user.isGM) return;
            const sidebarButtons = $("#sidebar #items .directory-header .action-buttons");

            if (sidebarButtons.find(".mass-import").length > 0) return;
            if(!window.showOpenFilePicker) return;
            sidebarButtons.append(`<button class="mass-import"><i class="fas fa-upload"></i>Mass Import</button>`)

            $("#sidebar #items .directory-header .action-buttons .mass-import").on("click", async (event) => {

                const fileHandlers = await window.showOpenFilePicker({
                    types: [
                        {
                            description: "JSON Files",
                            accept: {
                                "text/json": [".json"]
                            }
                        }
                    ],
                    excludeAcceptAllOption: true,
                    multiple: true
                });

                const items = [];
                const folder = await (async () => {
                    const folder = game.folders.getName("Mass Item Import");
                    if (folder) return folder;
                    return await Folder.create({
                        type: "Item",
                        name: "Mass Item Import"
                    });
                })();

                for (const fileHandler of fileHandlers) {
                    const file = await fileHandler.getFile();
                    const text = await file.text();
                    const json = JSON.parse(text);
                    json.folder = folder.id;
                    items.push(json);
                }

                return await CONFIG.Item.documentClass.createDocuments(items);
            });
        });
    }
}