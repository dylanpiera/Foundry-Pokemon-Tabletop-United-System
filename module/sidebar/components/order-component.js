import Component from '../../api/front-end/lib/component.js';

export default class OrderComponent extends Component {
    constructor(store) {
        super({
            store,
            element: $('#orders-list')
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

        const trainings = this.state.actor.itemTypes.feat.filter(x => x.name.toLowerCase().includes("training"));

        const dividerIcon = "<img class='divider-image' src='systems/ptu/images/icons/DividerIcon_Orders.png' style='border:none; width:200px;'>"
        let output = "";
        if (trainings.length > 0) {
            output += dividerIcon

            for (const item of trainings.sort(this._sort)) {
                const trainingType = item.data.name.toLowerCase().replace("training", "").trim();

                if(trainingType != "agility" && trainingType != "brutal" && trainingType != "focused" && trainingType != "inspired") continue;

                output += await renderTemplate("/systems/ptu/module/sidebar/components/order-component.hbs", {
                    name: item.data.name,
                    img: item.data.img,
                    id: item.id,
                    color: 'gray',
                    color2: 'black',
                    effect: item.system.effect,
                    owner: this.state.actor.id,
                    type: trainingType
                });
            }
        }
        this.element.html(output);

        this.element.children().children(".item").on("click", () => {

        })
        this.element.children().children(".auto").on("click", () => {
            
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

    _sort(a, b) {
        if (a.name > b.name) return 1;
        if (b.name > a.name) return -1;
        return 0;
    }
}
