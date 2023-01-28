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
        let output = "<img class='divider-image' src='systems/ptu/images/icons/DividerIcon_FoodBuff.png' style='border:none; width:200px;'>";
        const foodBuffs = this.state.actor.system.digestionBuff.split(", ");
        if (foodBuffs.length > 0) {
            for (const foodBuff of foodBuffs) {
                if (foodBuff != "None" && foodBuff != "")
                {
                    const foodBuffItem = game.ptu.data.items.find(i => i.name.toLowerCase().includes(foodBuff.toLowerCase()));
                    if (foodBuffItem) {
                        output += await renderTemplate("/systems/ptu/module/sidebar/components/food-buff-component.hbs", {
                            name: foodBuffItem.name,
                            img: foodBuffItem.img,
                            id: foodBuffItem.id,
                            color: 'gray',
                            effect: foodBuffItem.system.effect,
                            owner: this.state.actor.id
                        });
                    }
                }
            }
        }
        this.element.html(output);

        // Add click handlers to the item buttons
        this.element.children('.item').click("click", function (event) {
            const {itemId, itemOwner} = event.currentTarget.dataset;

            game.ptu.data.items.find(i => i.id == itemId).sheet._toChat(itemOwner, true);
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