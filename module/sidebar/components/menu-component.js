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
                    maneuvers: await this._prepareManeuvers(this.state.actor)
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

        this.element.children('#menu-content').children('.pokeball-item').on("click", (event) => {
            const { entityId, ballName, ownerId } = event.target.dataset;

            const owner = game.actors.get(ownerId);
            game.ptu.utils.throwPokeball(owner, game.user?.targets?.first(), owner?.items.get(entityId));
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

    _prepareManeuvers(actor) {
        this.lock = true
        const maneuvers = new Array(
            {
                name: "Attack of Opportunity",
                action: "Free",
                trigger: "See Below",
                effect: "You may make a Struggle Attack against the triggering foe as an Interrupt. You may use Attack of Opportunity only once per round. Attacks of Opportunity cannot be made by Sleeping, Flinched, or Paralyzed targets.<br>&nbsp;<br>&nbsp;Attacks of Opportunity can be triggered in multiple ways:<br>&nbsp;»An adjacent foe uses a Push, Grapple, Disarm, Trip, or Dirty Trick Maneuver that does not target you.<br>&nbsp;»An adjacent foe stands up.<br>&nbsp;»An adjacent foe uses a Ranged attack that does not target someone adjacent to it.<br>&nbsp;»An adjacent foe uses a Standard Action to pick up or retrieve an item.<br>&nbsp;»An adjacent foe An adjacent foe Shifts out of a Square adjacent to you."
                
            },
            {
                name: "Disengage",
                action: "Shift",
                effect: "You may shift 1 Meter. Shifting this way does not provoke Attacks of Opportunity"

            },
            {
                name: "Disarm",
                ac: 6,
                action: "Standard",
                class: "Status",
                range: "Melee, 1 Target",
                effect: "You and the target each make opposed Combat or Stealth checks. If you win, the target's Held Item (Main hand or Off-hand for humans) falls to the ground"
            },
            {
                name: "Dirty Trick - Hinder",
                ac: 2,
                class: "Scene - Status",
                range: "Melee, 1 Target",
                effect: "You and the target make opposed athletics Checks. If you win, the target is slowed and takes a -2 penalty to all Skill Checks for one full round."
            },
            {
                name: "Dirty Trick - Blind",
                ac: 2,
                class: "Scene - Status",
                range: "Melee, 1 Target",
                effect: "You and the target make Opposed Stealth Checks. If you win, the target is Blinded for one full round."
            },
            {
                name: "Dirty Trick - Low Blow",
                ac: 2,
                class: "Scene - Status",
                range: "Melee, 1 Target",
                effect: "Low Blow - You and the target make Opposed Acrobatics Checks. If you win the target is Vulnerable and has their Initiative set to 0 until the end of your next turn."
            },
            {
                name: "Manipulate -Bon Mot",
                ac: 2,
                action: "Scene - Standard",
                class: "Status",
                range: "6, 1 Target",
                effect: "Manipulate can only be performed by Trainers.<br>&nbsp;<br>&nbsp;Make a Guile Check, opposed by the target's Guile or Focus. If you win, the target is Enraged and cannot spend AP for one full round. The target does not gain a Save Check against this effect."
            },
            {
                name: "Manipulate - Flirt",
                ac: 2,
                action: "Scene - Standard",
                class: "Status",
                range: "6, 1 Target",
                effect: "Manipulate can only be performed by Trainers.<br>&nbsp;<br>&nbsp;Make a Charm Check, opposed by the target's Charm or Focus. If you win. the target is Infatuated with you for one full round. The target automatically fails their Save Check."
            },
            {
                name: "Manipulate - Terrorize",
                ac: 2,
                action: "Scene - Standard",
                class: "Status",
                range: "6, 1 Target",
                effect: "Manipulate can only be performed by Trainers.<br>&nbsp;<br>&nbsp;Make an Intimidation Check, opposed by the target's Intimidate or Focus. If you win, the target loses all Temporary Hit Points and can only use At-Will Frequence Moves for one full round."
            },
            {
                name: "Push",
                ac: 4,
                action: "Standard",
                class: "Status",
                range: "Melee, 1 Target",
                effect: " You and the target each make opposed Combat or Athletics Checks. If you win, the target is Pushed back 1 Meter directly away from you. If you have Movement remaining this round, you may then Move into the newly occupied Space, and Push the target again. This continues until you choose to stop, or have no Movement remaining for the round. Push may only be used against a target whose weight is no heavier than your Heavy Lifting rating."
            },
            {
                name: "Sprint",
                action: "Standard",
                range: "Self",
                effect: "Increase your Movement Speeds by 50% for the rest of your turn."
            },
            {
                name: "Trip",
                ac: 6,
                action: "Standard",
                class: "Status",
                range: "Melee, 1 Target",
                effect: "You and the target each make opposed Combat or Acrobatics Checks. If you win, the target is knocked over and Tripped."
            },
            {
                name: "Incercept Melee",
                action: "Full Action, Interupt",
                trigger: "An ally within Movement range is hit by an adjacent foe",
                effect: "you must make an Acrobatics or Athletics check, with a DC equal to three times the number of meters they have to move to reach the triggering Ally;<br>&nbsp;If you succed, you push the triggeringAlly 1 Meter away from you, and Shigt to occupy their space, and are hit by the triggering attack.<br>&nbsp;On Failure to make the Check, the user still Shifts a number of meters equal to a third of their check result. <br>&nbsp; <br>&nbsp; ***Special: Pokemon must have Loyalty of 3 or greater to make Intercept Melee Maneuvers and may only Intercept attacks against their Trainer. At Loyalty 6, Pokemon may Intercept for an Ally"
            },
            {
                name: "Intercept Ranged",
                action: "Full Action, Interrupt",
                trigger: "A Ranged X-Target attack passes within your Movement range",
                effect: "Select a Square within your Movement Range that lies directly between the source of the attack and the target of the attack. Make an Acrobatics or Athletics check; you may Shift a number of Meters equal to half the result towards the chosen square.<br>&nbsp;if you reach the chosen square, you take the attack instead of it's intended target.<br>&nbsp; <br>&nbsp; ***Special: Pokemon must have Loyalty of 3 or greater to make Intercept Ranged Maneuvers and may only Intercept attacks against their Trainer. At Loyalty 6, Pokemon may Intercept for an Ally"
            },
            {
                name: "Grapple",
                ac: 4,
                action: "Standard",
                class: "Status",
                range: "Melee, 1 Target",
                effect: "You and the target each make opposed Combat or Athletics Checks. If you win, you and the target each become Grapples, and you gain Dominance in the Grapple.<br>&nbsp;<br>&nbsp;Pokemon and Trainers that are Grappled<br>&nbsp;» Are Vulnerable.<br>&nbsp;»Cannot take Shift Actions, or any actions that would cause them to Shift.<br>&nbsp;»Gain a -6 penalty to Accuracy rolls if targeting any-one outside the Grapple.<br>&nbsp;»Additionally, Grapply has other effects on whether the target has or doesn't have dominance.<br>&nbsp;<br>&nbsp;If a target begins their turn as part of a Grapple but with no Dominance, they may choose to contest the Grapple as a Full Action. If they do, all participants make opposed Combat or Athletics Checks. Whoever wins then may choose to either continue the Grapple and gain Dominance, or to end the Grapple<br>&nbsp;<br>&nbsp;If a target has the Phasing or Teleport Capability, they may use those to escape from a Grapple on their turn with no check required.<br>&nbsp;<br>&nbsp;If a Target Begins their turn as part of a Grapple and has Dominance, they may take one of the following actions as a Full action.<br>&nbsp;»End the Grapple<br>&nbsp;»Secure:They gain a +3 Bonus to the next opposed check they make in the Grapple.<br>&nbsp;»Attack: They may automatically hit with an Unarmed Struggle attack.<br>&nbsp;»Move: They Shift, dragging the other person in the grapple with them. The user's Movement Capability is lowered by the other grappler's Weight Class"
            }

        );

        return maneuvers.map(m => m);   
    }

    async _sendManeuverToChat(maneuverName) {
        let maneuver;
        this._prepareManeuvers(this.state.actor).forEach(m => {
            if (m.name == maneuverName) maneuver = m;
        })

        const messageData = mergeObject({
            title: maneuver.name,
            user: game.user._id,
            action: maneuver.action,
            trigger: maneuver.trigger,
            ac: maneuver.ac,
            class: maneuver.class,
            range: maneuver.range,
            effect: maneuver.effect,
            sound: CONFIG.sounds.dice,
            templateType: 'maneuver',
        })
        messageData.content = await renderTemplate("/systems/ptu/templates/chat/maneuver.hbs", messageData)
        console.log(messageData);
        await ChatMessage.create(messageData, {});
    }
}