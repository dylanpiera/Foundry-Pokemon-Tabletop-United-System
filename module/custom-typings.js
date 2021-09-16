import { TypeEffectiveness } from './data/effectiveness-data.js';
import {log, warn, error, debug} from './ptu.js'

export async function InitCustomTypings() {
    try {
        if(isObjectEmpty(game.settings.get("ptu", "typeEffectiveness") ?? {})) {
            await game.settings.set("ptu", "typeEffectiveness", TypeEffectiveness);
        }

        log("Finalizing Custom Typings Initialization")
        await Hooks.callAll("updatedCustomTypings");
        await game.socket.emit("system.ptu", "RefreshCustomTypings")
    } catch(err) {
        warn("Unable to import data as player", err)
        await ui.notifications.notify("There was a system update that requires the GM to login for migrations to happen. Please notify your GM and refresh after they have joined.", "warning")
    }
}

export async function UpdateCustomTypings(data) {
    log("Triggering Custom Typing Refresh")
    debug("Custom Typing Refresh Arguments:", data)
    game.ptu.TypeEffectiveness = game.settings.get("ptu", "typeEffectiveness")
    
    try {
        if(data && data.outdatedApplications) {
            for(let app of data.outdatedApplications) {
                await app._render();
            }
        }
    }
    catch(err) {
        warn("Unable to update applications", err)
    }

    if(data && data.updateActors) {
        await game.actors.filter(x => x.data.type === "pokemon").forEach(async (x) => {
            if(x.permission >= 3)
                await x.update({timestamp: Date.now()})
        })
    }
}