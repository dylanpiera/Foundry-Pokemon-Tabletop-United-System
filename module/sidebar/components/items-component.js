import Component from '../../api/front-end/lib/component.js';

export default class ItemsComponent extends Component {
    constructor(store) {
        super({
            store,
            element: $('#items-list')
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
        let dividerIcon = "";
        let output = "";
        if (this.state.actor.type == 'character') {
            const items = this.state.actor.itemTypes.item;
            dividerIcon = "<img class='divider-image' src='systems/ptu/images/icons/DividerIcon_Items.png' style='border:none; width:200px;'>"


            if (items.length > 0) {
                output += dividerIcon

                for (const item of items.sort(this._sort)) {
                    output += await renderTemplate("/systems/ptu/module/sidebar/components/items-component.hbs", {
                        name: item.name,
                        img: item.img,
                        id: item.id,
                        color: 'gray',
                        amount: item.system.quantity,
                        effect: item.system.effect,
                        owner: this.state.actor.id
                    });
                }
            }
        } else if (this.state.actor.type == 'pokemon') {
            dividerIcon = "<img class='divider-image' src='systems/ptu/images/icons/DividerIcon_HeldItem.png' style='border:none; width:200px;'>"
            const itemName = this.state.actor.system.heldItem;
            if (itemName != "None")
            {
                let item = game.ptu.data.items.find(i => i.name.toLowerCase().includes(itemName.toLowerCase()));
                if (item) {
                    output += dividerIcon             
                    output += await renderTemplate("/systems/ptu/module/sidebar/components/items-component.hbs", {
                        name: item.name,
                        img: item.img,
                        id: item.id,
                        color: 'gray',
                        amount: 1,
                        effect: item.system.effect,
                        owner: this.state.actor.id
                    });
                }
            }
            
        }
        this.element.html(output);

        this.element.children(".item").on("click", function(event) {
            const {itemId, itemOwner} = event.currentTarget.dataset;

            if(game.actors.get(itemOwner).type == 'character') {
                game.actors.get(itemOwner).items.get(itemId).sheet._toChat(itemOwner);
            } else if (game.actors.get(itemOwner).type == 'pokemon') {
                game.ptu.data.items.find(i => i.id == itemId).sheet._toChat(itemOwner);
            }
 
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
        const an = Number(a.system.quantity);
        const bn = Number(b.system.quantity);

        if (an > bn) return -1;
        if (bn > an) return 1;

        if (a.name > b.name) return 1;
        if (b.name > a.name) return -1;
        return 0;
    }
}
