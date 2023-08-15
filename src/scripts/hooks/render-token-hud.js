export const RenderTokenHUD = {
    listen: () => {
        Hooks.on("renderTokenHUD", (_app, $html, data) => {
            game.ptu.StatusEffects.onRenderTokenHUD($html[0], data);
        });
        Hooks.once("ready", _ => {
            canvas.tokens.hud.refreshStatusIcons = () => {};
        }) 
    },
};
