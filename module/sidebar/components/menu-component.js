import Component from '../../api/front-end/lib/component.js';
import { sendMoveMessage } from '../../actor/pokemon-sheet-gen8.js'
import { pokeball_sound_paths } from '../../combat/effects/pokeball_effects.js';
import { timeout } from '../../utils/generic-helpers.js';

export const ui_sound_paths = {
    "button": "systems/ptu/sounds/ui_sounds/ui_button.wav",
    "flip": "systems/ptu/sounds/ui_sounds/ui_cardflip.wav",
    "check_on": "systems/ptu/sounds/ui_sounds/ui_checkbox_on.wav",
    "check_off": "systems/ptu/sounds/ui_sounds/ui_checkbox_off.wav",
    "pokedex_scan": "systems/ptu/sounds/ui_sounds/ui_pokedex_ding.wav",
    "warning": "systems/ptu/sounds/ui_sounds/ui_warning.wav",
};

export default class MenuComponent extends Component {
    constructor(store) {
        super({
            store,
            element: $('#menu-component')
        })
        this._hidden = false;
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
    async render() {
        if (!this.state.actor) return;


        const dividerIcon = "<img class='divider-image' src='systems/ptu/images/icons/Divider.png' style='border:none; width:200px;'>"
        let output = dividerIcon;

        switch (this.state.menuOption) {
            case "struggle":
                output += await renderTemplate("/systems/ptu/module/sidebar/components/menu-component.hbs", {
                    menu: "struggle",
                    struggles: await this._getStruggles(this.state.actor)
                })
                break;
            case "pokeball":
                if (this.state.actor.type == "pokemon") return this.store.dispatch('changeMenuOption', "none");

                output += await renderTemplate("/systems/ptu/module/sidebar/components/menu-component.hbs", {
                    menu: "pokeball",
                    ball: await this._getTrainerPokeballArray(this.state.actor)
                })
                break;
            case "maneuver":
                output += await renderTemplate("/systems/ptu/module/sidebar/components/menu-component.hbs", {
                    menu: "maneuver",
                    maneuvers: await game.packs.get("ptu.maneuvers").getDocuments()
                })
                break;
            default:
                output += await renderTemplate("/systems/ptu/module/sidebar/components/menu-component.hbs", {
                    menu: "none"
                })
                    break;
        }

        this.element.html(output);

        this.element.children('#menu-buttons').children('.menu-item').on("click", (event) => {
            event.preventDefault();
            const type = event.currentTarget.dataset.type;

            switch (type) {
                case "struggle":
                    if (this.state.menuOption == type) {
                        this.store.dispatch('changeMenuOption', "none");
                        AudioHelper.play({ src: ui_sound_paths["check_off"], volume: 0.8, autoplay: true, loop: false }, false);
                    }
                    else {
                        this.store.dispatch('changeMenuOption', type);
                        AudioHelper.play({ src: ui_sound_paths["check_on"], volume: 0.8, autoplay: true, loop: false }, false);
                    }
                    break;
                case "pokeball":
                    if (this.state.menuOption == type) {
                        this.store.dispatch('changeMenuOption', "none");
                        AudioHelper.play({ src: pokeball_sound_paths["menu_close"], volume: 0.8, autoplay: true, loop: false }, false);
                        AudioHelper.play({ src: ui_sound_paths["check_off"], volume: 0.8, autoplay: true, loop: false }, false);
                    }
                    else {
                        this.store.dispatch('changeMenuOption', type);
                        AudioHelper.play({ src: pokeball_sound_paths["menu_open"], volume: 0.8, autoplay: true, loop: false }, false);
                        AudioHelper.play({ src: ui_sound_paths["check_on"], volume: 0.8, autoplay: true, loop: false }, false);
                    }
                    break;
                case "maneuver":
                    if (this.state.menuOption == type) {
                        this.store.dispatch('changeMenuOption', "none");
                        AudioHelper.play({ src: ui_sound_paths["check_off"], volume: 0.8, autoplay: true, loop: false }, false);
                    }
                    else {
                        this.store.dispatch('changeMenuOption', type);
                        AudioHelper.play({ src: ui_sound_paths["check_on"], volume: 0.8, autoplay: true, loop: false }, false);
                    }
                    break;
                case "rest":
                    // Render rest pop-up
                    break;
            }
        })

        this.element.children('#menu-content').children('.pokeball-item').on("click", async(event) => {
            const { entityId, ballName, ownerId } = event.target.dataset;

            const owner = game.actors.get(ownerId);
            const target = game.user?.targets?.first();

            let allowed = "true";
            
            if (game.settings.get("ptu", "pokeball-prompts") == 1 || game.settings.get("ptu", "pokeball-prompts") == 3) {
                if (game.ptu.utils.api.gm._isMainGM())
                    allowed = "true"
                //ask GM to confirm they want to allow player to throw a pokeball?
                else
                    allowed = await game.ptu.utils.api.gm.throwPokeballRequest(owner, target, {timeout: 30000});
            }

            if(allowed == "true"){
                game.ptu.utils.throwPokeball(owner, target, owner?.items.get(entityId));
            } else {
                ui.notifications.error("GM prevented you from throwing a pokeball at this pokemon.");
                return;
            }       
            
        })

        this.element.children("#menu-content").children(".struggle-row").children(".movemaster-button[data-struggle-id]").on("mousedown", (event) => {
            // Handle on move click here, for now just log that button is clicked
            const move = this.state.actor.items.get(event.currentTarget?.dataset?.struggleId);
            switch (event.which) {
                case 3: // Right click
                    sendMoveMessage({
                        speaker: ChatMessage.getSpeaker({
                            actor: this.state.actor
                        }),
                        moveName: move.name,
                        move: move.system,
                        templateType: 'details'
                    })
                    break;
                case 1: // Left click
                case 2: // Middle click
                default: // anything else??
                    this.state.actor.executeMove(move.id)
            }
        })

        this.element.children("#menu-content").children(".maneuvers-row").children(".movemaster-button[data-maneuver-name]").on("click", (event) => {
            this._sendManeuverToChat(event.currentTarget.dataset.maneuverName);            
        })

        this.element.children(".divider-image").on("click", () => {
            if (this._hidden) {
                this.element.children(":not(.divider-image)").fadeIn();
                this._hidden = false;
            }
            else {
                this.element.children(":not(.divider-image)").fadeOut();
                this._hidden = true;
            }
        })
    }

    _onDragStart(event) {
        const dragData = {
            type: 'Actor',
            id: event.target?.dataset?.entityId
        }
        event.originalEvent.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }

    _onHoverIn(event) {
        event.preventDefault();
        if (!canvas.ready) return;
        const li = event.target;
        const actorId = li.dataset.entityId
        const tokens = game.actors.get(actorId).getActiveTokens(true);
        if (tokens && tokens[0]?.isVisible) {
            if (!tokens[0]._controlled) tokens[0]._onHoverIn(event);
            this._highlighted = tokens[0];
        }
    }
    _onHoverOut(event) {
        event.preventDefault();
        if (this._highlighted) this._highlighted._onHoverOut(event);
        this._highlighted = null;
    }
    _onClick(event) {
        event.preventDefault();

        const li = event.target;
        const actorId = li.dataset.entityId
        const actor = game.actors.get(actorId)
        const token = actor?.getActiveTokens(true)[0];
        if (!actor?.testUserPermission(game.user, "OBSERVED")) return;
        const now = Date.now();

        // Handle double-left click to open sheet
        const dt = now - this._clickTime;
        this._clickTime = now;
        if (dt <= 250) return actor?.sheet.render(true);

        // Control and pan to Token object
        if (token) {
            token.control({ releaseOthers: true });
            return canvas.animatePan({ x: token.system.x, y: token.system.y });
        }
    }

    _calculateColor(health) {
        const healthPercentage = (health.value / health.max);

        if (healthPercentage >= 1) {
            return "green";
        }
        if (healthPercentage > 0.75) {
            return "lime";
        }
        if (healthPercentage > 0.50) {
            return "orange";
        }
        if (healthPercentage > 0.25) {
            return "red";
        }
        if (healthPercentage > 0) {
            return "darkred";
        }
        return "black";
    }

    async _getStruggles(actor) {
        if (this.lock) return;
        this.lock = true;

        const currentStruggles = [];
        actor.itemTypes.move.forEach(m => {
            if (m.system.isStruggle || (m.name.includes("Struggle") && m.system.type != "" && m.system.type != "--")) currentStruggles.push(m);
        })

        const foundStruggles = ["default"];

        const struggleCapabilities = {
            "default": { "type": "Normal" },
            "firestarter": { "type": "Fire" },
            "fountain": { "type": "Water" },
            "freezer": { "type": "Ice" },
            "guster": { "type": "Flying" },
            "materializer": { "type": "Rock" },
            "telekinetic": { "type": "Normal" },
            "zapper": { "type": "Electric" },
            "groundshaper": { "type": "Ground" }
        };

        const isTelekinetic = actor.itemTypes.capability.includes("Telekinetic");

        for (const item of actor.itemTypes.capability) {
            const name = item.name.toLowerCase();
            if (!struggleCapabilities[name]) continue;

            foundStruggles.push(name);
        }

        const strugglesToCreate = [];
        const strugglesToDisplay = [];

        for (const struggle of foundStruggles) {
            const { type } = struggleCapabilities[struggle];

            if (struggle != "telekinetic") {
                const move = currentStruggles.find(m => m.system.type == type && m.system.category == "Physical");
                if (!move) strugglesToCreate.push(this._prepareNewStruggle(actor, type, isTelekinetic));
                else strugglesToDisplay.push(move);
            }
            if (struggle == "default") continue;

            const move = currentStruggles.find(m => m.system.type == type && m.system.category == "Special");
            if (!move) strugglesToCreate.push(this._prepareNewStruggle(actor, type, isTelekinetic, false));
            else strugglesToDisplay.push(move);
        }

        if (strugglesToCreate.length > 0) strugglesToDisplay.push(...(await actor.createEmbeddedDocuments("Item", strugglesToCreate)));

        await timeout(150);
        this.lock = false;

        return strugglesToDisplay.map(m => m);
    }

    _prepareNewStruggle(actor, type, isTelekinetic, isPhysical = true) {
        const isStrugglePlus = actor.system.skills.combat.value >= 5;

        return {
            name: `Struggle (${type})`,
            type: "move",
            data: {
                isStruggle: true,
                ac: isStrugglePlus ? "3" : "4",
                category: isPhysical ? "Physical" : "Special",
                damageBase: isStrugglePlus ? "5" : "4",
                type: type,
                range: (isTelekinetic ? actor.system.skills.focus.value.total : "Melee") + ", 1 Target",
                frequency: "At-Will",
                effect: "--",
            }
        }
    }

    async _getTrainerPokeballArray(actor) {
        return actor.items.filter(item => item.type == "item" && item.system.category.toLowerCase() == "pokeballs").map(item => {
            return {
                name: item.name,
                id: item.id,
                owner: actor.id,
                img: item.img,
                amount: item.system.quantity
            }
        });
    }

    async _sendManeuverToChat(maneuverName) {
        const maneuver = await game.packs.get("ptu.maneuvers").find(m => m.name.toLowerCase() == maneuverName.toLowerCase());

        const messageData = {
            title: maneuver.name,
            user: game.user._id,
            action: maneuver.system.action,
            trigger: maneuver.system.trigger,
            ac: maneuver.system.ac,
            class: maneuver.system.class,
            range: maneuver.system.range,
            effect: maneuver.system.effect,
            sound: CONFIG.sounds.dice,
            templateType: 'maneuver',
        }
        messageData.content = await renderTemplate("/systems/ptu/templates/chat/maneuver.hbs", messageData)
        await ChatMessage.create(messageData, {});
    }
}