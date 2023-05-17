import Component from '../../api/front-end/lib/component.js';
import { sendMoveMessage } from '../../actor/pokemon-sheet-gen8.js'
import { PrepareMoveData } from '../../ptu.js';
import { CoatIcon, FullActionIcon, ShiftActionIcon, BlastIcon, BlessingIcon, BurstIcon, LineIcon, MeleeIcon, SelfIcon, RangeIcon, TriggerIcon, FieldIcon, SwiftActionIcon, HealingIcon, FriendlyIcon, SonicIcon, InterruptIcon, ShieldIcon, SocialIcon, FiveStrikeIcon, DoubleStrikeIcon, GroundsourceIcon, SmiteIcon, ExhaustIcon, PassIcon, SetupIcon, IllusionIcon } from '../constants.js';

export default class MovesList extends Component {
    constructor(store) {
        super({
            store,
            element: $('#moves-list')
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
        const effVisible = game.settings.get("ptu", "move-effectiveness-visible");
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
                if (!isEmpty(diffObject(this.state.moves, duplicate(this.state.actor.itemTypes.move))) || !isEmpty(diffObject(duplicate(this.state.actor.itemTypes.move), this.state.moves))) {
                    this.updated += 1;
                    await this.store.dispatch("updateMoves", this.state.actor.itemTypes.move);
                    return;
                }
            }
            if (this.state.targetHasChanged) this.updated += 1;
            if (this.updated == 0) return;
        }

        let output = "";
        if(this.state.moves.length > 0)
            output += "<img class='divider-image' src='systems/ptu/images/icons/DividerIcon_Moves.png' style='border:none; width:200px;'>"

        for (const move of this.state.moves.sort(this._sort) ?? []) {
            // Move data is prepared on a duplicate entry, otherwise the preperation data will be flagged as 
            // 'changed move data' during every re-render, causing infinite re-render loops.
            const moveData = duplicate(move);
            
            moveData.system = this.PrepareMoveSystem(moveData.system, this.state.actor.system, this.state.targetedActors);

            // If fake move skip
            if((moveData.system.damageBase == "--" && moveData.system.category == "--") || (moveData.system.damageBase == "" && moveData.system.category == "") || (moveData.system.isStruggle)) continue;
            
            const tokens = game.user.targets.size > 0 ? [...game.user.targets] : canvas.tokens.controlled
            const monData = game.ptu.utils.species.get(tokens[0]?.actor?.system?.species);

            // If DB is not a number, 
                if(isNaN(Number(moveData.system.damageBase))) moveData.system.damageBase = "--";
                switch (effVisible){
                    case 5: //visible to all
                        break;
                    case 4: //visible only on owned mons
                        if(game.user.isGM){
                            break; //visible to GMs
                        }

                        if (!game.user.character) {
                            ui.notifications.warn("Please make sure you have a trainer as your Selected Player Character");
                            moveData.system.effectiveness = -1;
                            break;
                        }

                        if (game.user.targets.size != 1) {
                            moveData.system.effectiveness = -1;
                            break;
                        }
                        
                        if((!game.user.character.itemTypes.dexentry.some(entry => entry.system.name.toLowerCase() === monData?._id?.toLowerCase() && entry.system.owned)))
                            moveData.system.effectiveness = -1;
                        

                        break;
                    case 3: //visible on seen mons
                        if(game.user.isGM){
                            break; //visible to GMs
                        }

                        if (!game.user.character) {
                            ui.notifications.warn("Please make sure you have a trainer as your Selected Player Character");
                            moveData.system.effectiveness = -1;
                            break;
                        }
                        
                        if (game.user.targets.size != 1) {
                            moveData.system.effectiveness = -1;
                        }

                        if(!game.user.character.itemTypes.dexentry.some(entry => entry.name.toLowerCase() === monData?._id?.toLowerCase()))
                            moveData.system.effectiveness = -1;

                        break;
                    case 2: //visible to GMs only
                        if(game.user.isGM){
                            break; //visible to GMs
                        }

                        moveData.system.effectiveness = -1; //don't show effectiveness
                        break;

                    case 1: //disabled
                        moveData.system.effectiveness = -1; //don't show effectiveness
                    
                }

            const moveHtml = await renderTemplate('/systems/ptu/module/sidebar/components/moves-component.hbs', moveData);
            output += moveHtml;
        }

        this.element.html(output);

        for (const move of this.state.moves ?? []) {
            $(`.movemaster-button[data-button="${move._id}"]`).on("mousedown", (event) => {
                // Handle on move click here, for now just log that button is clicked
                switch(event.which) {
                    case 3: // Right click
                        sendMoveMessage({
                            speaker: ChatMessage.getSpeaker({
                                actor: this.state.actor
                            }),
                            moveName: move.name,
                            move: move.system,
                        })
                        break;
                    case 1: // Left click
                    case 2: // Middle click
                    default: // anything else??
                        this.state.actor.executeMove(move._id)
                }
            })
        }

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
        this.store.dispatch("targetsUpdated");
    }

    PrepareMoveSystem(moveSystem, actorData, targetIds) {
        // Old Prepare Move Data 
        moveSystem.owner = {
            type: actorData.typing,
            stats: actorData.stats,
            acBonus: actorData.modifiers.acBonus.total,
            critRange: actorData.modifiers.critRange.total,
            damageBonus: actorData.modifiers.damageBonus
        };
        moveSystem.prepared = true;

        moveSystem.stab = moveSystem.owner?.type
                            && moveSystem.owner.type.filter(t => t == moveSystem.type).length > 0
                            && !moveSystem.isStruggle;

        moveSystem.acBonus = moveSystem.owner.acBonus ? moveSystem.owner.acBonus : 0;

        // End of Old Prepare Move Data

        moveSystem.rangeIconsHtml = this._getRangeIcons(moveSystem.range);
        moveSystem.effectiveness = 1;

        if (targetIds.length == 0) {
            moveSystem.effectiveness = -1;
            return moveSystem;
        }
        if (targetIds.length == 1) {
            moveSystem.effectiveness = this.store.getTarget(targetIds[0]).system.effectiveness?.All[moveSystem.type] ?? 1;
        }
        if (targetIds.length > 1) { // TODO: Maybe add a way to display multiple effectiveness borders?
            moveSystem.effectiveness = -1;
        }

        return moveSystem;
    }

    _sort(a,b) {
        return a.sort - b.sort;
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
