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

        const items = this.state.actor.itemTypes.item;
        const dividerIcon = "<img class='divider-image' src='systems/ptu/images/icons/DividerIcon_Items.png' style='border:none; width:200px;'>"
        let output = "";
        if (items.length > 0) {
            output += dividerIcon

            for (const item of items.sort(this._sort)) {
                output += await renderTemplate("/systems/ptu/module/sidebar/components/items-component.hbs", {
                    name: item.data.name,
                    img: item.data.img,
                    id: item.id,
                    color: 'gray',
                    amount: item.data.data.quantity,
                    effect: item.data.data.effect,
                    owner: this.state.actor.id
                });
            }
        }
        this.element.html(output);

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
        const an = Number(a.data.data.quantity);
        const bn = Number(b.data.data.quantity);

        if (an > bn) return -1;
        if (bn > an) return 1;

        if (a.name > b.name) return 1;
        if (b.name > a.name) return -1;
        return 0;
    }
}
