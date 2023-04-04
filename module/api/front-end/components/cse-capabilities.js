import { debug } from '../../../ptu.js';
import Component from '../lib/component.js';

export default class CseCapabilities extends Component{
    constructor(store, id){
        super({
            store,
            element: $(`#${id}`)
        });
    }

    /**
     * React to state changes and render the component's HTML
     * 
     * @returns {void}
     */
    async render(){
        const capabilities = duplicate(this.store.state.speciesData.Capabilities);
        delete capabilities.Other;

        const capabilitiesList = [
            "Overland",
            "Sky",
            "Swim",
            "Levitate",
            "Burrow",
            "Teleporter",
            "High Jump",
            "Long Jump",
            "Power",
            "Weight Class",
            "Naturewalk"
        ]

        let html = ``;

        for(const key of capabilitiesList){
            html += `
                <div class="d-flex align-items-center pt-1 pb-1">
                    <div class="col-sm-7">
                        <label for="Capabilities.${key}">${key}</label>
                    </div>
                    <div class="col-sm-5">
                        <input ${key != "Naturewalk" ? 'required' : ''} type="text" name="Capabilities.${key}"
                            value="${key == "Naturewalk" ? capabilities[key].join(',') : (capabilities[key] ?? 0)}" />
                    </div>
                </div>
            `
        }

        this.element.html(html);

        this.element.find(`input`).on("change", (e) => {
            this.store.dispatch('updateCapability', e.target.name, e.target.value);
        });
    }
}