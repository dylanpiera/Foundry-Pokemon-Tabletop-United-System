import { debug } from '../../../ptu.js';
import Component from '../lib/component.js';

export default class SpeciesImage extends Component {
    constructor(store) {
        super({
            store, 
            element: $('#preview-img')
        })
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
    async render() {
        if(this.state.imgPath) { 
            $("#preview-img").html(`<img src="${this.state.imgPath}">`);
        }
        else {
            $("#preview-img").html(`<img src="/icons/svg/mystery-man-black.svg" style="height: 404px; width: 100%;">`);
        }
    }
}