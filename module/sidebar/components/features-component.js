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
            output += "<img src='systems/ptu/images/icons/DividerIcon_Features.png' style='border:none; width:200px;'>"

        for (const feature of this.state.features ?? []) {
            // Feature data is prepared on a duplicate entry, otherwise the preperation data will be flagged as 
            // 'changed feature data' during every re-render, causing infinite re-render loops.
            const featureData = duplicate(feature);
            featureData.data = this.PrepareFeatureData(featureData.data, this.state.actor.data.data, this.state.targetedActors);
            const featureHtml = await renderTemplate('/systems/ptu/module/sidebar/components/features-component.hbs', featureData);
            output += featureHtml;
        }

        this.element.html(output);

        for (const feature of this.state.features ?? []) {
            $(`.movemaster-button[data-button="${feature._id}"]`).on("click", (event) => {
                // Handle on feature click here, for now just log that button is clicked
                console.log(feature.name, "was clicked");
            })
        }

        this.updated = 0;
        this.store.dispatch("targetsUpdated");
    }

    PrepareFeatureData(featureData, actorData, targetIds) {
        featureData.rangeIconsHtml = this._getRangeIcons(featureData.range);
        featureData.effectiveness = 1;

        return featureData;
    }

    _getRangeIcons(rangeText, actionType = "Standard") {
        if(!rangeText) return;
        const range = rangeText.toLowerCase().split(",").map(x => x.trim());

        let o = "";
        for(const r of range.slice(0, -1)) {
            const x = getIcon(r);
            if(x) o += `<span>${x}</span>`;
        }
        const x = getIcon(range[range.length-1]);
        if(x) o += `<span>${x}</span>`;

        function getIcon(range) {
            if(!range) return;
            switch (true) {
                case range.includes("see effect"): return range;
                case range.includes("blessing"): return BlessingIcon; 
                case range.includes("self"): return SelfIcon;
                case range.includes("burst"): return BurstIcon + range.slice(range.indexOf("burst")+"burst".length).split(',')[0].trim();
                case range.includes("line"): return LineIcon + range.slice(range.indexOf("line")+"line".length).split(',')[0].trim();
                case range.includes("close blast"): return MeleeIcon + BlastIcon + range.slice(range.indexOf("close blast")+"close blast".length).split(',')[0].trim();
                case range.includes("ranged blast"): return BlastIcon + range.slice(range.indexOf("ranged blast")+"ranged blast".length).split(',')[0].trim();
                case range.includes("melee"): return MeleeIcon;
                case range.includes("trigger"): return TriggerIcon;
                case range.includes("field"): return FieldIcon;
                case range.includes("swift action"): return SwiftActionIcon;
                case range.includes("full action"): return FullActionIcon;
                case range.includes("shift"): return ShiftActionIcon;
                case range.includes("healing"): return HealingIcon;
                case range.includes("friendly"): return FriendlyIcon;
                case range.includes("sonic"): return SonicIcon;
                case range.includes("interrupt"): return InterruptIcon;
                case range.includes("shield"): return ShieldIcon;
                case range.includes("social"): return SocialIcon;
                case range.includes("five strike"): 
                case range.includes("fivestrike"): return FiveStrikeIcon;
                case range.includes("double strike"): 
                case range.includes("doublestrike"): return DoubleStrikeIcon;
                case range.includes("groundsource"): return GroundsourceIcon;
                case range.includes("smite"): return SmiteIcon;
                case range.includes("exhaust"): return ExhaustIcon;
                case range.includes("pass"): return PassIcon;
                case range.includes("set-up"): return SetupIcon;
                case range.includes("illusion"): return IllusionIcon;
                case range.includes("coat"): return CoatIcon;
                case !isNaN(Number(range)): return RangeIcon + range.split(',')[0].trim()
                default: {
                    if(range.includes("1 target")) return "";
                    return `${range}`;
                }
            }
        }
        
        return o;
    }
}
