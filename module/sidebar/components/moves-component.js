import Component from '../../api/front-end/lib/component.js';
import { PrepareMoveData } from '../../ptu.js';
import { CoatIcon, FullActionIcon, ShiftActionIcon, BlastIcon, BlessingIcon, BurstIcon, LineIcon, MeleeIcon, SelfIcon, RangeIcon, TriggerIcon, FieldIcon, SwiftActionIcon, HealingIcon, FriendlyIcon, SonicIcon, InterruptIcon, ShieldIcon, SocialIcon, FiveStrikeIcon, DoubleStrikeIcon, GroundsourceIcon, SmiteIcon, ExhaustIcon, PassIcon, SetupIcon, IllusionIcon } from '../constants.js';

export default class MovesList extends Component {
    constructor(store) {
        super({
            store,
            element: $('#moves-list')
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
        // But as moves shouldn't have effects anyways this can safely be ignored.
        if (this.updated <= 1) {
            // If no moves are currently displayed
            if (this.state.moves.length == 0 && this.state.actor?.itemTypes.move.length != 0) {
                if (!this.state.actor) return;
                this.updated += 1;
                await this.store.dispatch("updateMoves", this.state.actor.itemTypes.move);
                return;
            }
            // If we have moves displayed
            if (this.state.moves.length > 0) {
                // But no moves on actor
                if (this.state.actor?.itemTypes.move.length === 0) {
                    this.updated += 1;
                    await this.store.dispatch("updateMoves", undefined);
                    return;
                }
                if (!this.state.actor) return;
                // But the moves are different than the ones displayed
                if (!isObjectEmpty(diffObject(this.state.moves, duplicate(this.state.actor.itemTypes.move))) || !isObjectEmpty(diffObject(duplicate(this.state.actor.itemTypes.move), this.state.moves))) {
                    this.updated += 1;
                    await this.store.dispatch("updateMoves", this.state.actor.itemTypes.move);
                    return;
                }
            }
            if (this.state.targetHasChanged) this.updated += 1;
            if (this.updated == 0) return;
        }

        let output = "";

        for (const move of this.state.moves ?? []) {
            // Move data is prepared on a duplicate entry, otherwise the preperation data will be flagged as 
            // 'changed move data' during every re-render, causing infinite re-render loops.
            const moveData = duplicate(move);
            moveData.data = this.PrepareMoveData(moveData.data, this.state.actor.data.data, this.state.targetedActors);
            const moveHtml = await renderTemplate('/systems/ptu/module/sidebar/components/moves-component.hbs', moveData);
            output += moveHtml;
        }

        this.element.html(output);

        for (const move of this.state.moves ?? []) {
            $(`.movemaster-button[data-button="${move._id}"]`).on("click", (event) => {
                // Handle on move click here, for now just log that button is clicked
                console.log(move.name, "was clicked");
            })
        }

        this.updated = 0;
        this.store.dispatch("targetsUpdated");
    }

    PrepareMoveData(moveData, actorData, targetData) {
        // Old Prepare Move Data 
        moveData.owner = {
            type: actorData.typing,
            stats: actorData.stats,
            acBonus: actorData.modifiers.acBonus.total,
            critRange: actorData.modifiers.critRange.total,
            damageBonus: actorData.modifiers.damageBonus
        };
        moveData.prepared = true;

        moveData.stab = moveData.owner?.type && (moveData.owner.type[0] == moveData.type || moveData.owner.type[1] == moveData.type);
        moveData.acBonus = moveData.owner.acBonus ? moveData.owner.acBonus : 0;

        // End of Old Prepare Move Data

        moveData.rangeIconsHtml = this._getRangeIcons(moveData.range);

        if (targetData.length == 0) return moveData;
        if (targetData.length == 1) {

        }
        if (targetData.length > 1) {

        }

        return moveData;
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
