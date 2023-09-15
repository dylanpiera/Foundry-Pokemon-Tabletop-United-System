export const ActorButtons = {
    listen() {
        Hooks.on("renderSidebarTab", () => {
            if(!game.user.isGM) return;
            const sidebarButtons = $("#sidebar #actors .directory-header .action-buttons");

            if(sidebarButtons.find(".import-party").length > 0) return;
            sidebarButtons.append(`<button class="import-party"><i class="fas fa-upload"></i>Import Party</button>`)
            sidebarButtons.append(`<button class="mass-generator"><i class="fas fa-users"></i>Pkmn Generator</button>`)

            $("#sidebar #actors .directory-header .action-buttons .import-party").on("click", async (event) => {
                await CONFIG.PTU.ui.party.sheetClass.importParty();
            });
            $("#sidebar #actors .directory-header .action-buttons .mass-generator").on("click", async (event) => {
                new CONFIG.PTU.ui.speciesMassGenerator.sheetClass().render(true);
            });
        });
    }
}