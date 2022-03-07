import Component from '../../api/front-end/lib/component.js';

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
       
        switch(this.state.menuOption) {
            case "struggle":
                output += await renderTemplate("/systems/ptu/module/sidebar/components/menu-component.hbs", {
                    menu: "none"
                })
                output += "<p style='color: white;'>Struggle Test</p>"
            break;
            case "pokeball":
                output += await renderTemplate("/systems/ptu/module/sidebar/components/menu-component.hbs", {
                    menu: "none"
                })
                output += "<p style='color: white;'>Pokeball Test</p>"
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

            switch(type) {
                case "struggle":
                    if(this.state.menuOption == type) this.store.dispatch('changeMenuOption', "none");
                    else this.store.dispatch('changeMenuOption', type);
                break;
                case "pokeball":
                    if(this.state.menuOption == type) this.store.dispatch('changeMenuOption', "none");
                    else this.store.dispatch('changeMenuOption', type);
                break;
                case "maneuver":
                    if(this.state.menuOption == type) this.store.dispatch('changeMenuOption', "none");
                    else this.store.dispatch('changeMenuOption', type);
                break;
                case "rest":
                    // Render rest pop-up
                break;
            }
        })
      
        this.element.children(".divider-image").on("click", () => {
            if(this._hidden) {
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
            this._highlighted= tokens[0];
        }
    }
    _onHoverOut(event) {
        event.preventDefault();
        if ( this._highlighted ) this._highlighted._onHoverOut(event);
        this._highlighted = null;
    }
    _onClick(event) {
        event.preventDefault();

        const li = event.target;
        const actorId = li.dataset.entityId
        const actor = game.actors.get(actorId)
        const token = actor?.getActiveTokens(true)[0];
        if ( !actor?.testUserPermission(game.user, "OBSERVED") ) return;
        const now = Date.now();
    
        // Handle double-left click to open sheet
        const dt = now - this._clickTime;
        this._clickTime = now;
        if ( dt <= 250 ) return actor?.sheet.render(true);
    
        // Control and pan to Token object
        if ( token ) {
          token.control({releaseOthers: true});
          return canvas.animatePan({x: token.data.x, y: token.data.y});
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
}
