export const DeleteToken = {
    listen() {
        Hooks.on("deleteToken", (document, options, user) => {
            if(!document.actor) return;
            if(document.isLinked) return;
            for (const effect of [document.actor.itemTypes.effect, document.actor.itemTypes.condition].flat().filter((x) => x)) {
                game.ptu.effectTracker.unregister(effect);
            }
        })
    }
}