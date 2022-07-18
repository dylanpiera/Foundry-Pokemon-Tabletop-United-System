import Component from '../../api/front-end/lib/component.js';
import { PrepareAbilityData } from '../../ptu.js';
import { CoatIcon, FullActionIcon, ShiftActionIcon, BlastIcon, BlessingIcon, BurstIcon, LineIcon, MeleeIcon, SelfIcon, RangeIcon, TriggerIcon, FieldIcon, SwiftActionIcon, HealingIcon, FriendlyIcon, SonicIcon, InterruptIcon, ShieldIcon, SocialIcon, FiveStrikeIcon, DoubleStrikeIcon, GroundsourceIcon, SmiteIcon, ExhaustIcon, PassIcon, SetupIcon, IllusionIcon } from '../constants.js';

export default class AbilitiesList extends Component {
    constructor(store) {
        super({
            store,
            element: $('#abilities-list')
        })
        this.updated = 0;
        this._hidden = false;
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
    async render() {
        // If it appears we're stuck in a recursive loop stop attempting to update the data and instead just render. 
        // In testing this should only occur if an item has doubly nested arrays. For example, an Effect.
        // But as abilities shouldn't have effects anyways this can safely be ignored.
        if (this.updated <= 1) {
            // If no abilities are currently displayed
            if (this.state.abilities.length == 0 && this.state.actor?.itemTypes.ability.length != 0) {
                if (!this.state.actor) return;
                this.updated += 1;
                await this.store.dispatch("updateAbilities", this.state.actor.itemTypes.ability);
                return;
            }
            // If we have abilities displayed
            if (this.state.abilities.length > 0) {
                // But no abilities on actor
                if (this.state.actor?.itemTypes.ability.length === 0) {
                    this.updated += 1;
                    await this.store.dispatch("updateAbilities", undefined);
                    return;
                }
                if (!this.state.actor) return;
                // But the abilities are different than the ones displayed
                if (!isObjectEmpty(diffObject(this.state.abilities, duplicate(this.state.actor.itemTypes.ability))) || !isObjectEmpty(diffObject(duplicate(this.state.actor.itemTypes.ability), this.state.abilities))) {
                    this.updated += 1;
                    await this.store.dispatch("updateAbilities", this.state.actor.itemTypes.ability);
                    return;
                }
            }
            if (this.updated == 0) return;
        }

        let output = "";
        if(this.state.abilities.length > 0)
            output += "<img class='divider-image' src='systems/ptu/images/icons/DividerIcon_Abilities.png' style='border:none; width:200px;'>"

        for (const ability of this.state.abilities?.sort(this._sort.bind(this)) ?? []) {
            // Ability data is prepared on a duplicate entry, otherwise the preperation data will be flagged as 
            // 'changed ability data' during every re-render, causing infinite re-render loops.
            const abilityData = duplicate(ability);
            const frequencyIconPath = this._getFrequencyIcons(abilityData.data.frequency);
            const abilityHtml = await renderTemplate('/systems/ptu/module/sidebar/components/abilities-component.hbs', {
                name: abilityData.name,
                img: frequencyIconPath,
                id: abilityData._id,
                effect: abilityData.data.effect,
                owner: this.state.actor.id
            });
            output += abilityHtml;
        }

        this.element.html(output);

        this.element.children(".item").on("click", function(event) {
            const {itemId, itemOwner} = event.currentTarget.dataset;
            game.actors.get(itemOwner).items.get(itemId).sheet._toChat(); 
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

        this.updated = 0;
    }

    _sort(a, b) {
        const ai = this._getFrequencyIcons(a.data.frequency);
        const bi = this._getFrequencyIcons(b.data.frequency);
        if (ai > bi) return 1;
        if (bi > ai) return -1;

        if (a.data.frequency > b.data.frequency) return 1;
        if (b.data.frequency > a.data.frequency) return -1;

        if (a.name > b.name) return 1;
        if (b.name > a.name) return -1;
        return 0;
    }

    _getFrequencyIcons(frequencyText) {
        if(!frequencyText) return;
        const frequency = frequencyText.toLowerCase();

        return getIconPath(frequency);
        
        function getIconPath(frequency) {
            if(!frequency) return;
            const basePath = "systems/ptu/images/icons/"
            switch (true) {
                case frequency.includes("swift action"): return basePath + "SwiftActionBackground.png";
                case frequency.includes("standard action"): return basePath + "StandardActionBackground.png";
                case frequency.includes("shift action"): return basePath + "ShiftActionBackground.png";
                case frequency.includes("full action"): return basePath + "FullActionBackground.png";
                case frequency.includes("static"): return basePath + "StaticBackground.png";
                case frequency.includes("free action"): return basePath + "FreeActionBackground.png";
                case frequency.includes("extended action"): return basePath + "ExtendedActionBackground.png";
                default: return "";
            }
        }
    }
}
