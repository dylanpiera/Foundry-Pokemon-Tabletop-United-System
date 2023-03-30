import { debug } from '../../../ptu.js';
import { GetSpeciesArt } from '../../../utils/species-command-parser.js';
import Component from '../lib/component.js';

export default class MonImageComponent extends Component {
    constructor(store, element) {
        super({
            store, 
            element
        })

        this.cache = {}
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
    async render() {
        if(!this.state.species) return;

        if(this.state.evolving.is && this.state.evolving.into && this.state.species.toLowerCase() != this.state.evolving.into.toLowerCase()) {
            const oldArt = await this._getArt(this.state.species);
            const newArt = await this._getArt(this.state.evolving.into);

            if(oldArt) this.cache[this.state.species] = oldArt;
            if(newArt) this.cache[this.state.evolving.into] = newArt;
            
            return this.element.html(this._renderHtml(oldArt ?? '/icons/svg/mystery-man-black.svg', newArt ?? '/icons/svg/mystery-man-black.svg'));
        }

        const img = await this._getArt(this.state.species);

        this.element.html(this._renderHtml(img ?? '/icons/svg/mystery-man-black.svg'));
    }

    _renderHtml(s1,s2) {
        if(!s2) return `<div class="avatar m-2"><img src="${s1}"/></div>`

        return `
            <div class="avatar m-2"><img src="${s1}"/></div>
            <div class="image-divider"></div>
            <div class="avatar m-2"><img src="${s2}"/></div>
        `;
    }

    _getArt(species) {
        if(this.cache[species]) return this.cache[species];

        const imgSrc = game.settings.get("ptu", "defaultPokemonImageDirectory");
        if(!imgSrc) return undefined;

        const speciesData = game.ptu.utils.species.get(species)
        if(!speciesData) return undefined;

        return GetSpeciesArt(speciesData, imgSrc);
    }
}