import Component from '../../api/front-end/lib/component.js';
import { PrepareAbilityData } from '../../ptu.js';

export default class BeltComponent extends Component {
    constructor(store) {
        super({
            store,
            element: $('#belt-component')
        })
        this._highlighted = undefined;
        this._hidden = false;
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
    async render() {
        if (!this.state.actor) return;

        // If this is not a character, empty belt component
        if (this.state.actor.type != "character") {
            return this.element.html("");
        }
        // Else display this component

        const dividerIcon = "<img class='divider-image' src='systems/ptu/images/icons/DividerIcon_PokeballBelt.png' style='border:none; width:200px;'>"
        const beltMons = [];
        let output = "";

        // select all owned pokemon in the same folder as this actor.
        if(this.state.actor?.folder)
        {
            for (const actor of this.state.actor?.folder?.contents) {
                if (actor.system.owner == this.state.actor.id) {
                    beltMons.push(actor);
                }
            }
        }

        if (beltMons.length > 0) {
            output += dividerIcon;
            for (const mon of beltMons) {
                output += await renderTemplate("/systems/ptu/module/sidebar/components/belt-component.hbs", {
                    name: mon.name,
                    img: mon.img,
                    id: mon.id,
                    color: this._calculateColor(mon.system.health),
                    isActive: false,
                    bgImg: undefined,
                });
            }
        }

        this.element.html(output);

        const beltImages = this.element.children().children();

        beltImages.on("dragstart", this._onDragStart.bind(this));
        beltImages.hover(this._onHoverIn.bind(this), this._onHoverOut.bind(this));
        beltImages.click(this._onClick.bind(this));

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
          return canvas.animatePan({x: token.system.x, y: token.system.y});
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
