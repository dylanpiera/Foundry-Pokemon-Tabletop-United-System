import Component from '../../api/front-end/lib/component.js';
import { PrepareFeatureData } from '../../ptu.js';
import { CoatIcon, FullActionIcon, ShiftActionIcon, BlastIcon, BlessingIcon, BurstIcon, LineIcon, MeleeIcon, SelfIcon, RangeIcon, TriggerIcon, FieldIcon, SwiftActionIcon, HealingIcon, FriendlyIcon, SonicIcon, InterruptIcon, ShieldIcon, SocialIcon, FiveStrikeIcon, DoubleStrikeIcon, GroundsourceIcon, SmiteIcon, ExhaustIcon, PassIcon, SetupIcon, IllusionIcon } from '../constants.js';

export default class FeaturesList extends Component {
    constructor(store) {
        super({
            store,
            element: $('#features-list')
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
        // But as features shouldn't have effects anyways this can safely be ignored.
        if (this.updated <= 1) {
            // If no features are currently displayed
            if (this.state.features.length == 0 && this.state.actor?.itemTypes.feat.length != 0) {
                if (!this.state.actor) return;
                this.updated += 1;
                await this.store.dispatch("updateFeatures", this.state.actor.itemTypes.feat);
                return;
            }
            // If we have features displayed
            if (this.state.features.length > 0) {
                // But no features on actor
                if (this.state.actor?.itemTypes.feat.length === 0) {
                    this.updated += 1;
                    await this.store.dispatch("updateFeatures", undefined);
                    return;
                }
                if (!this.state.actor) return;
                // But the features are different than the ones displayed
                if (!isObjectEmpty(diffObject(this.state.features, duplicate(this.state.actor.itemTypes.feat))) || !isObjectEmpty(diffObject(duplicate(this.state.actor.itemTypes.feat), this.state.features))) {
                    this.updated += 1;
                    await this.store.dispatch("updateFeatures", this.state.actor.itemTypes.feat);
                    return;
                }
            }
            if (this.state.targetHasChanged) this.updated += 1;
            if (this.updated == 0) return;
        }

        let output = "";
        if(this.state.features.length > 0)
            output += "<img class='divider-image' src='systems/ptu/images/icons/DividerIcon_Features.png' style='border:none; width:200px;'>"

        for (const feature of this.state.features?.sort(this._sort.bind(this)) ?? []) {
            // Feature data is prepared on a duplicate entry, otherwise the preperation data will be flagged as 
            // 'changed feature data' during every re-render, causing infinite re-render loops.
            const featureData = duplicate(feature);
            const frequencyIconPath = this._getFrequencyIcons(featureData.data.frequency);
            const featureHtml = await renderTemplate('/systems/ptu/module/sidebar/components/features-component.hbs', {
                name: featureData.name,
                img: frequencyIconPath,
                id: featureData._id,
                effect: featureData.data.effect,
                owner: this.state.actor.id
            });
            output += featureHtml;
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
