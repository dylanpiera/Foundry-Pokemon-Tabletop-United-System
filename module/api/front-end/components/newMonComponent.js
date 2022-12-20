import { debug } from '../../../ptu.js';
import Component from '../lib/component.js';

export default class NewMonComponent extends Component {
    constructor(store) {
        super({
            store, 
            element: $('#cse-mon-editor')
        })
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
    async render() {
        if(!isEmpty(this.state.speciesData ?? {})) return;

        const html = `
        <div class="h-100 d-flex">
            <div class="swsh-box" style="width: fit-content;height: fit-content;">
                <div class="swsh-header p-2 justify-content-center">
                    <h4>Create new species!</h4>
                </div>
                <div class="swsh-body justify-content-center">
                    <p class="w-100" style="white-space: pre-line; text-align: center;">Lets get started creating a new species, 
                    would you like to import data from an existing species?</p>
                    <input id="species-import"></input>
                    <small class="help-text p-1 pb-3" style="flex: 0 0 100%; text-align: center;">Leave empty for a blank species</small>
                    <button style="width:fit-content;padding: 0 1rem;margin-bottom:0.5rem;" id="create-new-species">Submit</button>
                </div>
            </div>
        </div>
        `;

        this.element.html(html);

        this.element.find('#create-new-species').on("click", async ev => {
            ev.preventDefault();
            await this.store.dispatch('changeSpecies', $('#species-import').val());
            await this.store.dispatch('syncPage');
            $('.cse .tabs').css('visibility', 'visible');
        })
    }
}