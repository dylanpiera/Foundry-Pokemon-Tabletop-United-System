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

        Hooks.on("renderSidebarTab", () => {
            const footer = $(".compendium-sidebar .directory-footer");
            if(footer.find(".compendium-browser-btn").length > 0) return;

            footer.append(`<button type="button" class="compendium-browser-btn"><i class="fa-solid fa-magnifying-glass"></i> Compendium Browser</button>`);
            footer.find(".compendium-browser-btn").on("click", () => {
                game.ptu.compendiumBrowser.render(true)
            });
        });
    }
}