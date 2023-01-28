import Component from '../../api/front-end/lib/component.js';

export default class FoodBuffComponent extends Component {
    constructor(store) {
        super({
            store,
            element: $('#food-buff')
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
        let output = "";
        const foodBuffName = this.state.actor.system.digestionBuff;
        const dividerIcon = "<img class='divider-image' src='systems/ptu/images/icons/DividerIcon_FoodBuff.png' style='border:none; width:200px;'>";
        let foodBuff = game.ptu.data.items.find(i => i.name.toLowerCase().includes(foodBuffName.toLowerCase()));
        if (foodBuff) {
            output += dividerIcon;
            output += await renderTemplate("/systems/ptu/module/sidebar/components/food-buff-component.hbs", {
                name: foodBuff.name,
                img: foodBuff.img,
                id: foodBuff.id,
                color: 'gray',
                effect: foodBuff.system.effect,
                owner: this.state.actor.id
            });
        }
        this.element.html(output);

        // Add click handlers to the item buttons
        this.element.children('.item').click("click", function (event) {
            const {itemId, itemOwner} = event.currentTarget.dataset;

            game.ptu.data.items.find(i => i.id == itemId).sheet._toChat(itemOwner);
        });

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

    _sort(a, b) {
        if (a.name > b.name) return 1;
        if (b.name > a.name) return -1;
        return 0;
    }
}