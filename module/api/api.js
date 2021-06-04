import {debug} from '../ptu.js';

class ApiError {
    constructor({message, type}) {
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
            async tokensDelete(data) {
                if(!ref._isMainGM()) return;
                
                const documents = [];
                for(const uuid of data.content.uuids) {
                    const document = await ref._documentFromUuid(uuid);
                    if(!document) continue;
                    if(document.data.locked || !document.actor.canUserModify(game.users.get(data.user), "delete")) continue;
                    documents.push(document);
                }

                if(data.user != game.user.id) {
                    if(!game.settings.get("ptu", "canPlayersDeleteTokens")) return ref._returnBridge({result: new ApiError({message: "setting: `ptu.canPlayersDeleteTokens` has been turned off.", type: 403})}, data)
                }

                const retVal = {result: []}; 
                for(const document of documents) retVal.result.push(await document.delete());
                ref._returnBridge(retVal, data);
            }
        }
    }

    _registerSocket() {
        this.socketId = game.socket.on(`system.ptu`, async (data) => {
            if(data.operation === "return"){
                const resolve = this._requestResolvers[data.randomID];
                if (resolve){
                    delete this._requestResolvers[data.randomID];
                    if(data.retVal.uuid) data.retVal.result = await this._documentFromUuid(data.retVal.result) //recompose from UUID if it was minified down to it
                    resolve(data.retVal)
                }
            } else {
                if(data.operation)
                    this.handlers[data.operation](data);
            }
        });
    }

    /** API Operations */
    /**
     * 
     * @param {*} object - Instance of or array of either PTUActor, Token, TokenDocument or UUID string. Passing in an Actor will delete all of its tokens in any scene.
     * @param {*} options
     * @returns 
     */
    async tokensDelete(object, options) {
        if(!object) return;
        const objects = (object instanceof Array) ? object : [object];
        const tokens = [];

        for(const o of objects) {
            if(o instanceof game.ptu.PTUActor) 
                tokens.push(...(await o.getActiveTokens()));

            if(o instanceof TokenDocument || o instanceof Token)
                tokens.push(o);

            if(typeof o === "string")
                tokens.push(await this._documentFromUuid(o));      
        }
        

        if(tokens.length === 0) {
            ui.notifications.notify(`${object?.uuid ?? ""} has no tokens linked to it`, 'error');
            return false;
        }

        const content = {uuids: tokens.map(t => t.uuid), options};
        return this._handlerBridge(content, "tokensDelete");
    }

    /** API Methods */
    _isMainGM(){
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

    async _handlerBridge(content, functionName, timeOutMs = 5000){  //if the user is the main GM, executes the handler directly.  otherwise, emits an instruction to execute over a socket.
        if(!this._isGMOnline()) return ui.notifications.notify(`Oops. To execute ${functionName} a GM needs to be online!`, 'warning');
        
        const methodResponse = await new Promise((resolve, reject) => {
            const randomID = this._getRandomId();
            this._requestResolvers[randomID] = resolve;
            const user = game.user.id;
            if ((!content.userID && this._isMainGM() ) || content.userID === user){ //if content doesn't specify a user, this is to be run by the GM.  If it does, it's to be run by the user specified
                this.handlers[functionName]({content, randomID, user})
            }else{ 
                game.socket.emit('system.ptu', {
                    operation: functionName,
                    user,
                    content,
                    randomID
                })
            }
            setTimeout(() =>{
                delete this._requestResolvers[randomID];
                reject(new Error ("timed out waiting for GM execution"));
            }, timeOutMs)
        })
    
        if (methodResponse.error)
            throw new Error(methodResponse.error)
        else
            return methodResponse.result;
    }

    _returnBridge(retVal, data){
        debug(`API ${data.operation}`,retVal)
        if (data.user === game.user.id){
            const resolve = this._requestResolvers[data.randomID];
            if (resolve){
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