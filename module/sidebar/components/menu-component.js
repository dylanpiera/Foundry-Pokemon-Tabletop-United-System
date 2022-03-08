import Component from '../../api/front-end/lib/component.js';
import { pokeball_sound_paths } from '../../combat/effects/pokeball_effects.js';

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
                    menu: "none"
                })
                output += "<p style='color: white;'>Struggle Test</p>"
                break;
            case "pokeball":
                if(this.state.actor.type == "pokemon") return this.store.dispatch('changeMenuOption', "none");
                
                output += await renderTemplate("/systems/ptu/module/sidebar/components/menu-component.hbs", {
                    menu: "pokeball",
                    ball: await this._getTrainerPokeballArray(this.state.actor)
                })
                break;
            case "maneuver":

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
            const {entityId, ballName, ownerId} = event.target.dataset;

            const owner = game.actors.get(ownerId);
            game.ptu.ThrowPokeball(owner, game.user?.targets?.first(), owner?.items.get(entityId));
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
            return canvas.animatePan({ x: token.data.x, y: token.data.y });
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

    async _getTrainerPokeballArray(actor) {
        return actor.items.filter(item => item.type == "item" && item.data.data.category.toLowerCase() == "pokeballs").map(item => {
            return {
                name: item.name,
                id: item.id,
                owner: actor.id,
                img: item.img,
                amount: item.data.data.quantity
            }
        });
    }
}