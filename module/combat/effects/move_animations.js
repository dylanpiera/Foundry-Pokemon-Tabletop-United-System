import { debug, log } from "../../ptu.js";


export const move_animation_library = { // This is basically a list of Sequencer sequences, identified by lowercase move name.
    "attack order":{},
    "hyper beam":{
        "self":  { path:"modules/jb2a_patreon/Library/TMFX/InPulse/Circle/InPulse_01_Circle_Normal_500.webm", scale: 0.9, anchor_x: 0.15, anchor_y: 0.5, speed:0.1, ease:false, melee:false, count:1 },
        "hit":  { path:"modules/jb2a_patreon/Library/Cantrip/Eldritch_Blast/EldritchBlast_01_Regular_Yellow_30ft_1600x400.webm", scale: 0.9, anchor_x: 0.15, anchor_y: 0.5, speed:0.1, ease:false, melee:false, count:1 },
        // "miss": {}
    },
};


async function PlayMoveSelfAnimation(move, moveUserToken) 
{
    if(move_animation_library[move.name.toLowerCase()]?.self)
    {
        new Sequence().effect().file( move_animation_library[move.name.toLowerCase()]["self"]["path"] ).atLocation(moveUserToken).play();
    }
}


async function PlayMoveHitAnimation(move, moveUserToken, moveTargetToken) 
{
    if(move_animation_library[move.name.toLowerCase()]?.hit)
    {
        new Sequence().effect().file( move_animation_library[move.name.toLowerCase()]["hit"]["path"] ).atLocation(moveUserToken).stretchTo(moveTargetToken).missed(false).play();
    }
}


async function PlayMoveMissAnimation(move, moveUserToken, moveTargetToken) 
{
    if(move_animation_library[move.name.toLowerCase()]?.miss)
    {
        new Sequence().effect().file( move_animation_library[move.name.toLowerCase()]["miss"]["path"] ).atLocation(moveUserToken).stretchTo(moveTargetToken).missed(true).play();
    }
    else if(move_animation_library[move.name.toLowerCase()]?.hit)
    {
        new Sequence().effect().file( move_animation_library[move.name.toLowerCase()]["hit"]["path"] ).atLocation(moveUserToken).stretchTo(moveTargetToken).missed(true).play();
    }
}


export async function PlayMoveAnimations(move, moveUserToken, attacksData) 
{
    if(!(game.modules.get("sequencer")?.active) || !(game.settings.get("ptu", "enableMoveAnimations") == true))
    {
        return false; // Either Sequencer module is not installed, or config settings have disabled move animations, so stop here.
    }

    await PlayMoveSelfAnimation(move, moveUserToken); // Play any effects that swirl around the *user* of the move.

    for(let target_token_id in attacksData) // Then play the 'projectile' effects between the user and each target.
    {
        if(attacksData[target_token_id].isHit)
        {
            await PlayMoveHitAnimation(move, moveUserToken, canvas.tokens.get(target_token_id));
        }
        else
        {
            await PlayMoveMissAnimation(move, moveUserToken, canvas.tokens.get(target_token_id));
        }
        
    }

    return true;
}
