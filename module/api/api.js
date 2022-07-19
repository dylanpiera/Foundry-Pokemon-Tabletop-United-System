import { displayAppliedDamageToTargets, ApplyInjuries } from '../combat/damage-calc-tools.js';
import { LATEST_VERSION } from '../ptu.js'
import { debug, log } from '../ptu.js';
import { dataFromPath } from '../utils/generic-helpers.js';
import { PlayPokeballReturnAnimation } from '../combat/effects/pokeball_effects.js';

class ApiError {
    constructor({ message, type }) {
        this.message = message;
        this.type = type;
    }
}

export default class Api {
    constructor() {
        this._requestResolvers = {};
        this.handlers = this._setupHandlers();
        Object.freeze(this.handlers);

        this._registerSocket();
    }

    _setupHandlers() {
        const ref = this;
        return {
            async setChangelogRead(data) {
                if (!ref._isMainGM()) return;
                                
                const {userId, version} = data.content;
                if(!userId || !version) return ref._returnBridge({ result: new ApiError({ message: "userId or version is undefined.", type: 404 }) }, data);

                const setting = game.settings.get("ptu", "dismissedVersion")
                if(setting[userId] == version) return ref._returnBridge({ result: new ApiError({ message: "Setting is already up-to-date.", type: 403 }) }, data);
                
                setting[userId] = version;

                ref._returnBridge({result: [await game.settings.set("ptu", "dismissedVersion", setting)]}, data)
            },
            async tokensDelete(data) {
                if (!ref._isMainGM()) return;

                const documents = [];
                for (const uuid of data.content.uuids) {
                    const document = await ref._documentFromUuid(uuid);
                    if (!document) continue;
                    if (document.locked || !document.actor.canUserModify(game.users.get(data.user), "delete")) continue;
                    documents.push(document);
                }

                if (data.user != game.user.id) {
                    if (!game.settings.get("ptu", "canPlayersDeleteTokens")) return ref._returnBridge({ result: new ApiError({ message: "setting: `ptu.canPlayersDeleteTokens` has been turned off.", type: 403 }) }, data)
                }

                const retVal = { result: [] };
                for (const document of documents) retVal.result.push( await PlayPokeballReturnAnimation(document) );
                ref._returnBridge(retVal, data);
            },
            async messageUpdate(data) {
                if (!ref._isMainGM()) return;

                const message = game.messages.get(data.content.id);
                if (!message) return;

                const retVal = { result: await message.update(data.content.options) }
                ref._returnBridge(retVal, data);
            },
            async transferOwnership(data) {
                if (!ref._isMainGM()) return;

                const sender = game.users.get(data.content.options?.newOwnerId ?? data.user);
                const pc = sender.character;
                const document = await ref._documentFromUuid(data.content.uuid);
                if (!pc) return ref._returnBridge({ result: new ApiError({ message: "Player does not have a Character set to transfer ownership too", type: 400 }) }, data);
                if (!document) return ref._returnBridge({ result: new ApiError({ message: "Referenced document doesn't exist.", type: 400 }) }, data);

                let reason;
                switch (data.content.reason) {
                    case "capture": reason = "They claim they succeeded a capture roll!"; break;
                    default: reason = ""; break;
                }

                //Maybe skip check with a setting?
                const allowed = await new Promise((resolve, reject) => {
                    const dialog = new Dialog({
                        title: "Ownership Transfer",
                        content: `<p>It seems that ${pc.name} wishes to take control of ${document.name}.<br>${reason}<br>Will you let them?</p>`,
                        buttons: {
                            yes: {
                                icon: '<i class="fas fa-check"></i>',
                                label: game.i18n.localize("Yes"),
                                callback: _ => resolve("true")
                            },
                            no: {
                                icon: '<i class="fas fa-times"></i>',
                                label: game.i18n.localize("No"),
                                callback: _ => resolve("false")
                            }
                        },
                        default: "no",
                        close: () => resolve("timeout"),
                    });
                    dialog.render(true);
                    setTimeout(_ => {
                        dialog.close();
                        resolve("timeout");
                    }, (data.content.options?.timeout ?? 15000) - 1000)
                });

                if (allowed == "false") return ref._returnBridge({ result: new ApiError({ message: "DM Denied owner transfer", type: 403 }) }, data);
                if (allowed == "timeout") {
                    //TODO: Allow GM to retroactively apply request.
                    return ref._returnBridge({ result: new ApiError({ message: "Request to DM for owner transfer timed out.", type: 403 }) }, data);
                }

                const newData = {
                    folder: pc.folder?.id,
                    permission: mergeObject({
                        "default": game.settings.get("ptu", "transferOwnershipDefaultValue") ?? 0,
                        [sender.id]: 3
                    }, data.content.options?.permission ?? {}),
                    "data.owner": pc.id,
                    "data.pokeball": data.content.options?.pokeball ?? "Basic Ball"
                }

                return ref._returnBridge({ result: await document.update(newData) }, data);
            },
            async applyDamage(data) {
                if (!ref._isMainGM()) return;

                const { damageType, damageCategory, uuids } = data.content;
                const { label = "", isFlat = false, isHalf = false, isResist = false, isWeak = false, damageReduction = 0, msgId } = data.content.options;
                const damage = isHalf ? Math.max(1, Math.floor(data.content.damage / 2)) : data.content.damage;

                const documents = [];
                for (const uuid of uuids) {
                    const document = await ref._documentFromUuid(uuid);
                    if (!document || document.locked) continue;
                    documents.push(document);
                }

                const retVal = { result: [], appliedDamage: {}, appliedInjuries: {} };

                for (const document of documents) {
                    let actualDamage;
                    if (isFlat) {
                        actualDamage = damage;
                    }
                    else {
                        const defense = damageCategory == "Special" ? document.actor.system.stats.spdef.total : document.actor.system.stats.def.total;
                        const dr = parseInt(damageCategory == "Special" ? (document.actor.system.modifiers?.damageReduction?.special?.total ?? 0) : (document.actor.system.modifiers?.damageReduction?.physical?.total ?? 0));

                        const effectiveness = document.actor.system.effectiveness?.All[damageType] ?? 1;

                        actualDamage = Math.max(
                            (effectiveness === 0 ? 0 : 1),
                            Math.floor((damage - parseInt(defense) - dr - parseInt(damageReduction)) * (effectiveness + (isResist ? (effectiveness > 1 ? -0.5 : effectiveness * -0.5) : isWeak ? (effectiveness >= 1 ? effectiveness >= 2 ? 1 : 0.5 : effectiveness) : 0))))
                    }
                    log(`Dealing ${actualDamage} damage to ${document.name}`);
                    retVal.appliedDamage[document.actorLink ? document.actor.id : (document._id ?? document.id)] = {
                        name: document.actor.name,
                        damage: actualDamage,
                        type: document.actorLink ? "actor" : "token",
                        old: {
                            value: duplicate(document.actor.system.health.value),
                            temp: duplicate(document.actor.system.tempHp.value),
                            injuries: duplicate(document.actor.system.health.injuries)
                        },
                        injuries: (await ApplyInjuries(document.actor, actualDamage)),
                        tokenId: document.id,
                        msgId,
                    };
                    retVal.result.push(await document.actor.modifyTokenAttribute("health", actualDamage * -1, true, true));
                }
                await displayAppliedDamageToTargets({ data: retVal.appliedDamage, move: label });

                ref._returnBridge(retVal, data);
            },
            async toggleEffect(data) {
                if (!ref._isMainGM()) return;

                const { uuids, effect } = data.content;
                const documents = [];
                for (const uuid of uuids) {
                    const document = await ref._documentFromUuid(uuid);
                    if (!document || document.locked) continue;
                    documents.push(document);
                }

                const retVal = { result: [] };
                for (const document of documents) retVal.result.push(await document.layer.get(document.id).toggleEffect(effect));
                ref._returnBridge(retVal, data);
            },
            async addActiveEffect(data) {
                if (!ref._isMainGM()) return;

                const { uuids, effects } = data.content;
                const documents = [];
                for (const uuid of uuids) {
                    const document = await ref._documentFromUuid(uuid);
                    if (!document || document.locked) continue;
                    documents.push(document);
                }

                const retVal = { result: [] };
                for (const document of documents)
                    retVal.result.push(await document.actor.createEmbeddedDocuments("ActiveEffect", effects));
                ref._returnBridge(retVal, data);
            },
            async removeActiveEffect(data) {
                if (!ref._isMainGM()) return;

                const { uuids, effectIds } = data.content;
                const documents = [];
                for (const uuid of uuids) {
                    const document = await ref._documentFromUuid(uuid);
                    if (!document || document.locked) continue;
                    documents.push(document);
                }

                const retVal = { result: [] };
                for (const document of documents)
                    retVal.result.push(await document.actor.deleteEmbeddedDocuments("ActiveEffect", effectIds));
                ref._returnBridge(retVal, data);
            },
            async tokensUpdate(data) {
                if (!ref._isMainGM()) return;

                const { scale, x, y, tint, height, width, img, brightSight, dimSight, light } = data.content.options;

                const documents = [];
                for (const uuid of data.content.uuids) {
                    const document = await ref._documentFromUuid(uuid);
                    if (!document || document.locked) continue;
                    documents.push(document);
                }

                const newData = {};

                if(scale !== undefined) newData["scale"] = scale;
                if(x !== undefined) newData["x"] = x;
                if(y !== undefined) newData["y"] = y;
                if(tint !== undefined) newData["tint"] = tint;
                if(height !== undefined) newData["height"] = height;
                if(width !== undefined) newData["width"] = width;
                if(img !== undefined) newData["img"] = img;
                if(brightSight !== undefined) newData["brightSight"] = brightSight;
                if(dimSight !== undefined) newData["dimSight"] = dimSight;

                if(light){
                    const newLight = {}
                    const {alpha, angle, animation, bright, color, coloration, contrast, darkness, dim, gradual, luminosity, rotation, saturation, seed, shadows, vision, walls} = light
                    if(alpha !== undefined) newLight["alpha"] = alpha;
                    if(angle !== undefined) newLight["angle"] = angle;
                    if(bright !== undefined) newLight["bright"] = bright;
                    if(color !== undefined) newLight["color"] = color;
                    if(coloration !== undefined) newLight["coloration"] = coloration;
                    if(contrast !== undefined) newLight["contrast"] = contrast;
                    if(dim !== undefined) newLight["dim"] = dim;
                    if(gradual !== undefined) newLight["gradual"] = gradual;
                    if(luminosity !== undefined) newLight["luminosity"] = luminosity;
                    if(rotation !== undefined) newLight["rotation"] = rotation;
                    if(saturation !== undefined) newLight["saturation"] = saturation;
                    if(seed !== undefined) newLight["seed"] = seed;
                    if(shadows !== undefined) newLight["shadows"] = shadows;
                    if(vision !== undefined) newLight["vision"] = vision;
                    if(walls !== undefined) newLight["walls"] = walls;

                    if(animation){
                        const newAnimation = {}
                        const {type, speed, intensity, reverse} = animation
                        if(type !== undefined) newAnimation["type"] = type
                        if(speed !== undefined) newAnimation["speed"] = speed
                        if(intensity !== undefined) newAnimation["intensity"] = intensity
                        if(reverse !== undefined) newAnimation["reverse"] = reverse
                        newLight["animation"] = newAnimation
                    }
                    if(darkness){
                        const newDarkness = {}
                        const {min, max} = darkness
                        if(min !== undefined) newDarkness["min"] = min
                        if(max !== undefined) newDarkness["max"] = max
                        newLight["darkness"] = newDarkness
                    }
                    newData["light"] = newLight
                }



                const retVal = { result: [] };
                for (const document of documents) retVal.result.push(await document.update(newData));
                ref._returnBridge(retVal, data);
            },
            async nextTurn(data) {
                if (!ref._isMainGM()) return;

                const combat = game.combats.get(data.content.id);
                if (!combat) return;

                const retVal = { result: await combat.nextTurn() }
                ref._returnBridge(retVal, data);
            },
            async addTokenMagicFilters(data) {
                if (!ref._isMainGM()) return;
                debug(data);

                if(!(game.modules.get("tokenmagic")?.active) || !(game.settings.get("ptu", "enableMoveAnimations") == true))
                    return; // Either TMFX module is not installed, or config settings have disabled move animations, so stop here.

                const scene = game.scenes.get(data.content.sceneId);
                if(!scene) return ref._returnBridge({ result: new ApiError({ message: "Scene not found.", type: 500 }) }, data);

                const token = scene.tokens.get(data.content.tokenId);
                if(!token) return ref._returnBridge({ result: new ApiError({ message: "Token not found.", type: 500 }) }, data);;

                const retVal = { result: await TokenMagic.addFilters(token.object, data.content.filters) }
                ref._returnBridge(retVal, data);
            },
            async removeTokenMagicFilters(data) {
                if (!ref._isMainGM()) return;
                debug(data);

                if(!(game.modules.get("tokenmagic")?.active) || !(game.settings.get("ptu", "enableMoveAnimations") == true))
                    return; // Either TMFX module is not installed, or config settings have disabled move animations, so stop here.

                const scene = game.scenes.get(data.content.sceneId);
                if(!scene) return ref._returnBridge({ result: new ApiError({ message: "Scene not found.", type: 500 }) }, data);

                const token = scene.tokens.get(data.content.tokenId);
                if(!token) return ref._returnBridge({ result: new ApiError({ message: "Token not found.", type: 500 }) }, data);;

                const retVal = { result: await TokenMagic.deleteFilters(token.object, data.content.filters) }
                ref._returnBridge(retVal, data);
            },
        }
    }

    _registerSocket() {
        this.socketId = game.socket.on(`system.ptu`, async (data) => {
            if (data.operation === "return") {
                const resolve = this._requestResolvers[data.randomID];
                if (resolve) {
                    delete this._requestResolvers[data.randomID];
                    if (data.retVal.uuid) data.retVal.result = await this._documentFromUuid(data.retVal.result) //recompose from UUID if it was minified down to it
                    resolve(data.retVal)
                }
            } else {
                if (data.operation)
                    this.handlers[data.operation](data);
            }
        });
    }

    /** API Operations */
    /**
     * 
     * @param {*} userId - User ID that wishes to hide the changelog till next update
     * @param {*} version - Current Version
     */
    async setChangelogRead(userId, version) {
        if (!userId) userId = game.userId;
        if (!version) version = LATEST_VERSION;

        const setting = game.settings.get("ptu", "dismissedVersion")
        if(setting[userId] == version) return false;

        return this._handlerBridge({userId, version}, "setChangelogRead");
    }
    /**
     * 
     * @param {*} object - Instance of or array of either PTUActor, Token, TokenDocument or UUID string. Passing in an Actor will delete all of its tokens in any scene.
     * @param {*} options
     * @returns 
     */
    async tokensDelete(object, options) {
        if (!object) return;
        const objects = (object instanceof Array) ? object : [object];
        const tokens = [];

        for (const o of objects) {
            if (o instanceof game.ptu.PTUActor)
                tokens.push(...(await o.getActiveTokens()));

            if (o instanceof TokenDocument || o instanceof Token)
                tokens.push(o);

            if (typeof o === "string")
                tokens.push(await this._documentFromUuid(o));
        }


        if (tokens.length === 0) {
            ui.notifications.notify(`${object?.uuid ?? object} has no tokens linked to it`, 'error');
            return false;
        }

        const content = { uuids: tokens.map(t => t.uuid), options };
        return this._handlerBridge(content, "tokensDelete");
    }

    /**
     * 
     * @param {*} object - Instance of ChatMessage or UUID string.
     * @param {*} options - Data object to update the ChatMessage with.
     * @returns 
     */
    async chatMessageUpdate(object, options) {
        if (!object) return;

        if (!object.id) object = game.messages.get(object);
        if (!object?.id) return;

        const content = { id: object.id, options };
        return this._handlerBridge(content, "messageUpdate");
    }

    /**
     * @param {*} object - Instance of a PTUActor, Token, TokenDocument or UUID string. 
     * @param {Object} options - See subproperties:
     * @param {String} options.pokeball - Pokéball which the Pokémon was captured with.
     * @param {Number} options.timeout - DM Query Timeout duration, default 15 sec
     * @param {Object} options.permission - Possible Permission overwrite
     * 
     * @returns {ApiError | ActorData} - Will return data on success, otherwise will return ApiError.
     * @ApiError {403} - DM Denied request or Timed Out
     * @ApiError {400} - Badrequest, see message for details. 
     */
    async transferOwnership(object, options) {
        let actor;
        if (object instanceof game.ptu.PTUActor)
            actor = object;
        else if (object instanceof TokenDocument || object instanceof Token)
            actor = object.actor;
        else if (typeof object === "string")
            actor = await this._documentFromUuid(o);

        if (!actor) {
            ui.notifications.notify(`Unable to find an actor associated with: ${object?.uuid ?? object}`, 'error');
            return false;
        }

        const content = { uuid: actor.uuid, options };
        return this._handlerBridge(content, "transferOwnership", options?.timeout ?? 15000);
    }

    /**
     * @param {*} object - Instance of or array of either Token, TokenDocument or UUID string. 
     * @param {Number} damage - Amount of damage to take, if you want to heal, apply negative damage.
     * @param {String} damageType - The elemental type of the damage
     * @param {String} damageCategory - Damage Category: 'Special' will use special defense, otherwise defense is used.
     * @param {Object} options - see subproperties:
     * @param {String} options.label - Label to display in 'undo-damage' text message
     * @param {Boolean} options.isFlat - Whether to apply this as flat damage (ignore resistance, defenses & DR) 
     * @param {Boolean} options.isHalf - Whether to half the incoming damage 
     * @param {Boolean} options.isResist - Whether the damage should be resisted one step further
     * @param {Number} options.damageReduction - Flat damage reduction applied to this damage
     * 
     * @returns {ActorData[]}
     */
    async applyDamage(object, damage, damageType, damageCategory, options) {
        if (!object || !damage) return;
        const objects = (object instanceof Array) ? object : [object];
        const tokens = [];

        for (const o of objects) {
            if (o instanceof TokenDocument || o instanceof Token)
                tokens.push(o);

            if (typeof o === "string")
                tokens.push(await this._documentFromUuid(o));
        }

        if (tokens.length === 0) {
            ui.notifications.notify(`${object?.uuid ?? object} has no tokens linked to it`, 'error');
            return false;
        }

        const content = { uuids: tokens.map(t => t.document.uuid), damage, damageType, damageCategory, options };
        return this._handlerBridge(content, "applyDamage");
    }

    /**
     * @param {*} object - Instance of or array of either PTUActor, Token, TokenDocument or UUID string.
     * @param {*} effect - Instance of Effect or effect id from CONFIG.statusEffects
     * @param {*} options 
     */
    async toggleEffect(object, effect, options) {
        if (!object || !effect) return;

        let actualEffect;
        if (typeof effect === "object")
            actualEffect = effect;
        else if (typeof effect === "string")
            actualEffect = CONFIG.statusEffects.find(x => x.id == effect);

        if (!actualEffect) {
            ui.notifications.notify(`Could not find effect with details: ${effect}`, 'error');
            return false;
        }

        const objects = (object instanceof Array) ? object : [object];
        const tokens = [];
        for (const o of objects) {
            if (o instanceof game.ptu.PTUActor)
                tokens.push(...(await o.getActiveTokens()));

            if (o instanceof TokenDocument || o instanceof Token)
                tokens.push(o);

            if (typeof o === "string")
                tokens.push(await this._documentFromUuid(o));
        }

        if (tokens.length === 0) {
            ui.notifications.notify(`${object?.uuid ?? object} has no tokens linked to it`, 'error');
            return false;
        }

        const content = { uuids: tokens.map(t => t.document.uuid), effect: actualEffect, options };
        return this._handlerBridge(content, "toggleEffect");
    }

    /**
     * @param {*} object - Instance of or array of either PTUActor, Token, TokenDocument or UUID string. 
     * @param {*} effects - Instance of or array of EffectData.
     * @param {*} options 
     */
    async addActiveEffects(object, effects, options) {
        if (!object || !effects) return;

        const actualEffects = [];
        for (const e of (effects instanceof Array) ? effects : [effects]) {
            if (typeof e === 'object')
                actualEffects.push(e);
        }

        const tokens = [];
        for (const o of (object instanceof Array) ? object : [object]) {
            if (o instanceof game.ptu.PTUActor)
                tokens.push(...(await o.getActiveTokens()));

            if (o instanceof TokenDocument || o instanceof Token)
                tokens.push(o);

            if (typeof o === "string")
                tokens.push(await this._documentFromUuid(o));
        }
        if (tokens.length === 0) {
            ui.notifications.notify(`${object?.uuid ?? object} has no tokens linked to it`, 'error');
            return false;
        }

        const content = { uuids: tokens.map(t => t.document.uuid), effects: actualEffects, options };
        return this._handlerBridge(content, "addActiveEffect");
    }

    /**
     * @param {*} object - Instance of or array of either PTUActor, Token, TokenDocument or UUID string. 
     * @param {*} effects - Instance of or array of ActiveEffect, ActiveEffectData or ID string.
     * @param {*} options 
     */
    async removeActiveEffects(object, effects, options) {
        if (!object || !effects) return;

        const effectIds = [];
        for (const e of (effects instanceof Array) ? effects : [effects]) {
            if (typeof e === 'object')
                effectIds.push(e.id ? e.id : e._id);
            if (typeof e === 'string')
                effectIds.push(e);
        }

        const tokens = [];
        for (const o of (object instanceof Array) ? object : [object]) {
            if (o instanceof game.ptu.PTUActor)
                tokens.push(...(await o.getActiveTokens()));

            if (o instanceof TokenDocument || o instanceof Token)
                tokens.push(o);

            if (typeof o === "string")
                tokens.push(await this._documentFromUuid(o));
        }
        if (tokens.length === 0) {
            ui.notifications.notify(`${object?.uuid ?? object} has no tokens linked to it`, 'error');
            return false;
        }

        const content = { uuids: tokens.map(t => t.document.uuid), effectIds, options };
        return this._handlerBridge(content, "removeActiveEffect");
    }

    /**
     * @param {*} object - Instance of or array of either PTUActor, Token, TokenDocument or UUID string. Passing in an Actor will delete all of its tokens in any scene.
     * @param {*} options - Data to update should be included on the options object. Only certain data will be updated.
     * @returns 
     */
    async tokensUpdate(object, options) {
        if (!object) return;
        const objects = (object instanceof Array) ? object : [object];
        const tokens = [];

        for (const o of objects) {
            if (o instanceof game.ptu.PTUActor)
                tokens.push(...(await o.getActiveTokens()));

            if (o instanceof TokenDocument || o instanceof Token)
                tokens.push(o);

            if (typeof o === "string")
                tokens.push(await this._documentFromUuid(o));
        }

        if (tokens.length === 0) {
            ui.notifications.notify(`${object?.uuid ?? object} has no tokens linked to it`, 'error');
            return false;
        }

        const content = { uuids: tokens.map(t => t.document.uuid), options };
        return this._handlerBridge(content, "tokensUpdate");
    }

    /**
     * 
     * @param {*} object - Instance of PTUCombatOverrides or UUID string
     * @returns 
     */
     async nextTurn(object) {
        if (!object) return;

        if (!object.id) object = game.combats.get(object);
        if (!object?.id) return;

        const content = { id: object.id };
        return this._handlerBridge(content, "nextTurn");
    }

    /**
     * 
     * @param {*} token - Token ID
     * @param {*} scene - Scene ID
     * @param {*} filters - TokenMagic Filters
     * @returns 
     */
     async addTokenMagicFilters(token, scene, filters) {
        if (!token || !scene || !filters) return;

        if(!(game.modules.get("tokenmagic")?.active) || !(game.settings.get("ptu", "enableMoveAnimations") == true))
        {
            return; // Either TMFX module is not installed, or config settings have disabled move animations, so stop here.
        }

        if(!scene.id ) scene = game.scenes.get(scene);
        if(!scene) return;

        if(!token.id) token = scene.tokens.get(token);
        if(!token) return;

        const content = { tokenId: token.id, sceneId: scene.id, filters };
        debug(content);
        return this._handlerBridge(content, "addTokenMagicFilters");
    }

    /**
     * 
     * @param {*} token - Token ID
     * @param {*} scene - Scene ID
     * @param {*} filters - TokenMagic Filters
     * @returns 
     */
     async removeTokenMagicFilters(token, scene, filters) {
        if (!token || !scene || !filters) return;

        if(!(game.modules.get("tokenmagic")?.active) || !(game.settings.get("ptu", "enableMoveAnimations") == true))
        {
            return; // Either TMFX module is not installed, or config settings have disabled move animations, so stop here.
        }

        if(!scene.id ) scene = game.scenes.get(scene);
        if(!scene) return;

        if(!token.id) token = scene.tokens.get(token);
        if(!token) return;

        const content = { tokenId: token.id, sceneId: scene.id, filters };
        debug(content);
        return this._handlerBridge(content, "removeTokenMagicFilters");
    }

    /** API Methods */
    _isMainGM() {
        return game.user === game.users.find((u) => u.isGM && u.active)
    }

    _isGMOnline() {
        return game.users.filter(x => x.active && x.isGM).length > 0;
    }

    async _documentFromUuid(uuid) {
        return fromUuid(uuid);
    }

    _getRandomId() {
        return window.randomID();
    }

    async _handlerBridge(content, functionName, timeOutMs = 5000) {  //if the user is the main GM, executes the handler directly.  otherwise, emits an instruction to execute over a socket.
        if (!this._isGMOnline()) return ui.notifications.notify(`Oops. To execute ${functionName} a GM needs to be online!`, 'warning');

        const methodResponse = await new Promise((resolve, reject) => {
            const randomID = this._getRandomId();
            this._requestResolvers[randomID] = resolve;
            const user = game.user.id;
            if ((!content.userID && this._isMainGM()) || content.userID === user) { //if content doesn't specify a user, this is to be run by the GM.  If it does, it's to be run by the user specified
                this.handlers[functionName]({ content, randomID, user })
            } else {
                game.socket.emit('system.ptu', {
                    operation: functionName,
                    user,
                    content,
                    randomID
                })
            }
            setTimeout(() => {
                delete this._requestResolvers[randomID];
                reject(new Error("timed out waiting for GM execution"));
            }, timeOutMs + 100)
        })

        if (methodResponse.error)
            throw new Error(methodResponse.error)
        else
            return methodResponse.result;
    }

    _returnBridge(retVal, data) {
        debug(`API ${data.operation}`, retVal)
        if (data.user === game.user.id) {
            const resolve = this._requestResolvers[data.randomID];
            if (resolve) {
                delete this._requestResolvers[data.randomID];
                resolve(retVal)
            }
            return;
        }
        game.socket.emit("system.ptu", {
            operation: "return",
            user: game.user.id,
            retVal,
            randomID: data.randomID
        })
    }
}