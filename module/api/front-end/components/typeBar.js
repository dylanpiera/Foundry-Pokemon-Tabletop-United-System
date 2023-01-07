import { debug } from '../../../ptu.js';
import Component from '../lib/component.js';

export default class TypeBar extends Component {
    constructor(store) {
        super({
            store,
            element: $('#typebar')
        })
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
    async render() {
        if (this.state.species) {
            const html = this.generateHtml(this.state.species.Type);

            this.element.html(html);
        }
    }

    generateHtml(types) {
        let html = "";
        for (const [index, type] of types.entries()) {
            html += `<img id="type${index + 1}" src="/systems/ptu/css/images/types2/${type}${index % 2 == 0 ? "IC" : "IC_Flipped"}.png"/>`
        }
        if (types.length == 1) html += `<img id="type2" src="/systems/ptu/css/images/types2/IC_Flipped.png"/>`

        return html;
    }
}