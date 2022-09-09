import { debug, log } from "../../ptu.js";

export const move_animation_delay_ms = 1100;

export const move_animation_library = { // This is basically a list of Sequencer sequences, identified by lowercase move name.
    "attack order":{
        "hit":  { path:"modules/jb2a_patreon/Library/Generic/Energy/EnergyStrand_Multiple01_Dark_Green_30ft_1600x400.webm", scale: 1, repeats:[3, 100, 500]}
    },

    "bug bite":{
        "hit":  { path:"modules/jb2a_patreon/Library/Generic/Creature/Bite_01_Regular_Green_400x400.webm", scale: 0.5, repeats:[4, 100], melee: true}
    },

    "bug buzz":{
        "hit":  { path:"modules/jb2a_patreon/Library/5th_Level/Cone_Of_Cold/ConeOfCold_01_Regular_Green_600x600.webm", scale: 1.75, repeats:[1, 0]}
    },

    "zap cannon":{
        "hit": { path:"modules/jb2a_patreon/Library/6th_Level/Chain_Lightning/ChainLightning_01_Regular_Green_30ft_Primary_1600x400.webm", scale: 1.2, repeats:[1, 0], anchor_x: 0.5, anchor_y: 0.5 }
    },




    "hone claws":{
        "self": {path:"modules/jb2a_patreon/Library/Generic/Creature/Claws_01_Bright_Blue_400x400.webm", scale:0.7, repeats:[6, 250], anchor_y: 0.25,}
    },

    
    "hyper beam":{
        "self":  { path:"modules/jb2a_patreon/Library/TMFX/InPulse/Circle/InPulse_01_Circle_Normal_500.webm", scale: 1, anchor_x: 0.15, anchor_y: 0.5, speed:0.1, ease:false, melee:false, repeats:[1, 100, 500] },
        "hit":  { path:"modules/jb2a_patreon/Library/Cantrip/Eldritch_Blast/EldritchBlast_01_Regular_Yellow_30ft_1600x400.webm", scale: 1.2, anchor_x: 0.15, anchor_y: 0.5, speed:0.1, ease:false, melee:false, repeats:[1, 0] },
        // "miss": {}
    },
    "light screen":{
        "self":  { path:"modules/jb2a_patreon/Library/Generic/Zoning/ZoningCircle01Out_01_Regular_BlueGreen_600x600.webm", scale: 10, repeats:[1, 0]}
    },
    "reflect":{
        "self":  { path:"modules/jb2a_patreon/Library/Generic/Zoning/ZoningCircle01Out_01_Regular_RedYellow_600x600.webm", scale: 10, repeats:[1, 0]}
    },
    "safeguard":{
        "self":  { path:"modules/jb2a_patreon/Library/Generic/Zoning/ZoningCircle03Out_01_Regular_BlueGreen_600x600.webm", scale: 10, repeats:[1, 0]}
    },
};


export const move_type_color_filters = {
    "normal":"#ffffff",
    // "fire":"#e0772d",
    // "water":"#6186e0",
    // "electric":"#e7c22d",
    // "grass":"#70bb4b",
    // "ice":"#8ecaca",
    "fighting":"#b32d25",
    "poison":"#953c95",
    "ground":"#d3b562",
    "flying":"#9d86e0",
    "psychic":"#e8527f",
    "bug":"#9dac1e",
    "rock":"#ac9534",
    "ghost":"#69528e",
    "dragon":"#6934e7",
    "dark":"#695243",
    "steel":"#acacc2",
    // "fairy":"#cf9acf",
    "nuclear":"#03fe01"
};


export const move_type_auras = {
    "normal":"modules/jb2a_patreon/Library/TMFX/OutPulse/Circle/OutPulse_02_Circle_Fast_500.webm",
    "fire":"modules/jb2a_patreon/Library/Generic/Marker/EnergyStrandsOverlay_01_Regular_Orange_600x600.webm",
    "water":"modules/jb2a_patreon/Library/Generic/Liquid/LiquidSplash01_Bright_Blue_400x400.webm",
    "electric":"modules/jb2a_patreon/Library/Generic/Lightning/StaticElectricity_02_Regular_Green_400x400.webm",
    "grass":"modules/jb2a_patreon/Library/1st_Level/Detect_Magic/DetectMagicCircle_01_Regular_GreenOrange_1200x1200.webm",
    "ice":"modules/jb2a_patreon/Library/Generic/Ice/SnowflakeBurst_01_Regular_BlueWhite_Burst_600x600.webm",
    "fighting":"modules/jb2a_patreon/Library/Generic/Twinkling_Stars/TwinklingStars_09_100x100.webm",
    "poison":"modules/jb2a_patreon/Library/Generic/Liquid/LiquidSplash01_Bright_Purple_400x400.webm",
    "ground":"modules/jb2a_patreon/Library/Generic/Impact/GroundCrackImpact_01_Regular_Orange_600x600.webm",
    "flying":"modules/jb2a_patreon/Library/Generic/Marker/EnergyStrands_01_Regular_Blue_600x600.webm",
    "psychic":"modules/jb2a_patreon/Library/Generic/Energy/EnergyFieldBot_02_Regular_Purple_400x400.webm",
    "bug":"modules/jb2a_patreon/Library/Generic/Butterflies/Butterflies_01_Bright_Green_Many_400x400.webm",
    "rock":"modules/jb2a_patreon/Library/Generic/Traps/Falling_Rocks/FallingRocks01Top_01_Regular_Grey_05x05ft_600x600.webm",
    "ghost":"modules/jb2a_patreon/Library/Generic/Marker/Marker_02_Regular_PurplePink_400x400.webm",
    "dragon":"modules/jb2a_patreon/Library/2nd_Level/Flaming_Sphere/FlamingSphere_02_Blue_200x200.webm",
    "dark":"modules/jb2a_patreon/Library/1st_Level/Sneak_Attack/Sneak_Attack_Dark_Purple_300x300.webm",
    "steel":"modules/jb2a_patreon/Library/5th_Level/Wall_Of_Force/WallOfForce_01_Grey_Sphere_400x400.webm",
    "fairy": "modules/jb2a_patreon/Library/Generic/Energy/SwirlingSparkles_01_Regular_BluePink_400x400.webm",
    "nuclear":"modules/jb2a_patreon/Library/Generic/Liquid/LiquidSplash01_Bright_Green_400x400.webm"
};


export const move_type_impacts_physical = {
    "normal":"modules/jb2a_patreon/Library/Generic/Impact/Impact_02_Regular_Yellow_400x400.webm",
    "fire":"modules/jb2a_patreon/Library/Generic/Impact/Impact_02_Regular_Orange_400x400.webm",
    "water":"modules/jb2a_patreon/Library/Generic/Liquid/LiquidSplash01_Bright_Blue_400x400.webm",
    "electric":"modules/jb2a_patreon/Library/Generic/Impact/Impact_12_Regular_Green_400x400.webm",
    "grass":"modules/jb2a_patreon/Library/Generic/Impact/Impact_03_Regular_Green_400x400.webm",
    "ice":"modules/jb2a_patreon/Library/Generic/Impact/ImpactIceShard01_01_Regular_Blue_400x400.webm",
    "fighting":"modules/jb2a_patreon/Library/Generic/Impact/Impact_10_Regular_Red_400x400.webm",
    "poison":"modules/jb2a_patreon/Library/Generic/Impact/ImpactSkull01_01_Regular_PinkPurple_400x400.webm",
    "ground":"modules/jb2a_patreon/Library/Generic/Impact/GroundCrackImpact_01_Regular_Orange_600x600.webm",
    "flying":"modules/jb2a_patreon/Library/Generic/Impact/Impact_03_Regular_PinkPurple_400x400.webm",
    "psychic":"modules/jb2a_patreon/Library/Generic/Impact/Impact_04_Regular_PinkPurple_400x400.webm",
    "bug":"modules/jb2a_patreon/Library/Generic/Butterflies/Butterflies_01_Bright_Green_Many_400x400.webm",
    "rock":"modules/jb2a_patreon/Library/Generic/Traps/Falling_Rocks/FallingRocks01Top_01_Regular_Grey_05x05ft_600x600.webm",
    "ghost":"modules/jb2a_patreon/Library/Generic/Marker/Marker_02_Regular_PurplePink_400x400.webm",
    "dragon":"modules/jb2a_patreon/Library/Generic/Impact/Impact_04_Dark_Purple_400x400.webm",
    "dark":"modules/jb2a_patreon/Library/Generic/Impact/Impact_03_Dark_Purple_400x400.webm",
    "steel":"modules/jb2a_patreon/Library/Generic/Impact/Impact_05_Regular_White_400x400.webm",
    "fairy": "modules/jb2a_patreon/Library/Generic/Impact/ImpactHeart01_01_Regular_PinkYellow_400x400.webm",
    "nuclear":"modules/jb2a_patreon/Library/Generic/Liquid/LiquidSplash01_Bright_Green_400x400.webm"
};


export const move_type_impacts_special = {
    "normal":"modules/jb2a_patreon/Library/Generic/Impact/Impact_02_Regular_Yellow_400x400.webm",
    "fire":"modules/jb2a_patreon/Library/Generic/Impact/Impact_02_Regular_Orange_400x400.webm",
    "water":"modules/jb2a_patreon/Library/Generic/Liquid/LiquidSplash01_Bright_Blue_400x400.webm",
    "electric":"modules/jb2a_patreon/Library/Generic/Impact/Impact_12_Regular_Green_400x400.webm",
    "grass":"modules/jb2a_patreon/Library/Generic/Impact/Impact_03_Regular_Green_400x400.webm",
    "ice":"modules/jb2a_patreon/Library/Generic/Impact/ImpactIceShard01_01_Regular_Blue_400x400.webm",
    "fighting":"modules/jb2a_patreon/Library/Generic/Impact/Impact_10_Regular_Red_400x400.webm",
    "poison":"modules/jb2a_patreon/Library/Generic/Impact/ImpactSkull01_01_Regular_PinkPurple_400x400.webm",
    "ground":"modules/jb2a_patreon/Library/Generic/Impact/GroundCrackImpact_01_Regular_Orange_600x600.webm",
    "flying":"modules/jb2a_patreon/Library/Generic/Impact/Impact_03_Regular_PinkPurple_400x400.webm",
    "psychic":"modules/jb2a_patreon/Library/Generic/Impact/Impact_04_Regular_PinkPurple_400x400.webm",
    "bug":"modules/jb2a_patreon/Library/Generic/Butterflies/Butterflies_01_Bright_Green_Many_400x400.webm",
    "rock":"modules/jb2a_patreon/Library/Generic/Traps/Falling_Rocks/FallingRocks01Top_01_Regular_Grey_05x05ft_600x600.webm",
    "ghost":"modules/jb2a_patreon/Library/Generic/Marker/Marker_02_Regular_PurplePink_400x400.webm",
    "dragon":"modules/jb2a_patreon/Library/Generic/Impact/Impact_04_Dark_Purple_400x400.webm",
    "dark":"modules/jb2a_patreon/Library/Generic/Impact/Impact_03_Dark_Purple_400x400.webm",
    "steel":"modules/jb2a_patreon/Library/Generic/Impact/Impact_05_Regular_White_400x400.webm",
    "fairy": "modules/jb2a_patreon/Library/Generic/Impact/ImpactHeart01_01_Regular_PinkYellow_400x400.webm",
    "nuclear":"modules/jb2a_patreon/Library/Generic/Liquid/LiquidSplash01_Bright_Green_400x400.webm"
};


export const move_type_impacts_status = {
    "normal":"modules/jb2a_patreon/Library/Generic/Impact/Impact_02_Regular_Yellow_400x400.webm",
    "fire":"modules/jb2a_patreon/Library/Generic/Impact/Impact_02_Regular_Orange_400x400.webm",
    "water":"modules/jb2a_patreon/Library/Generic/Liquid/LiquidSplash01_Bright_Blue_400x400.webm",
    "electric":"modules/jb2a_patreon/Library/Generic/Impact/Impact_12_Regular_Green_400x400.webm",
    "grass":"modules/jb2a_patreon/Library/Generic/Impact/Impact_03_Regular_Green_400x400.webm",
    "ice":"modules/jb2a_patreon/Library/Generic/Impact/ImpactIceShard01_01_Regular_Blue_400x400.webm",
    "fighting":"modules/jb2a_patreon/Library/Generic/Impact/Impact_10_Regular_Red_400x400.webm",
    "poison":"modules/jb2a_patreon/Library/Generic/Impact/ImpactSkull01_01_Regular_PinkPurple_400x400.webm",
    "ground":"modules/jb2a_patreon/Library/Generic/Impact/GroundCrackImpact_01_Regular_Orange_600x600.webm",
    "flying":"modules/jb2a_patreon/Library/Generic/Impact/Impact_03_Regular_PinkPurple_400x400.webm",
    "psychic":"modules/jb2a_patreon/Library/Generic/Impact/Impact_04_Regular_PinkPurple_400x400.webm",
    "bug":"modules/jb2a_patreon/Library/Generic/Butterflies/Butterflies_01_Bright_Green_Many_400x400.webm",
    "rock":"modules/jb2a_patreon/Library/Generic/Traps/Falling_Rocks/FallingRocks01Top_01_Regular_Grey_05x05ft_600x600.webm",
    "ghost":"modules/jb2a_patreon/Library/Generic/Marker/Marker_02_Regular_PurplePink_400x400.webm",
    "dragon":"modules/jb2a_patreon/Library/Generic/Impact/Impact_04_Dark_Purple_400x400.webm",
    "dark":"modules/jb2a_patreon/Library/Generic/Impact/Impact_03_Dark_Purple_400x400.webm",
    "steel":"modules/jb2a_patreon/Library/Generic/Impact/Impact_05_Regular_White_400x400.webm",
    "fairy": "modules/jb2a_patreon/Library/Generic/Impact/ImpactHeart01_01_Regular_PinkYellow_400x400.webm",
    "nuclear":"modules/jb2a_patreon/Library/Generic/Liquid/LiquidSplash01_Bright_Green_400x400.webm"
};


const dodge_TMFX_params =
[{
    filterType: "transform",
    filterId: "PTU_Dodge_Animation",
    autoDestroy: true,
    padding: 80,
    animated:
    {
        translationY:
        {
            animType: "cosOscillation",
            val1: 0,
            val2: -0.225,
            loops: 1,
            loopDuration: 900
        },
        scaleY:
        {
            animType: "cosOscillation",
            val1: 1,
            val2: 0.65,
            loops: 2,
            loopDuration: 450,
        },
        scaleX:
        {
            animType: "cosOscillation",
            val1: 1,
            val2: 0.65,
            loops: 2,
            loopDuration: 450,
        }
    }
}];

const hit_TMFX_params = 
[{
    filterType: "transform",
	filterId: "PTU_Hit_Animation",
	autoDestroy: true,
	padding: 80,
	animated:
	{
		translationX:
		{
			animType: "sinOscillation",
			val1: 0.05,
			val2: -0.05,
			loops: 5,
			loopDuration: 100
		},
		translationX:
		{
			animType: "cosOscillation",
			val1: 0.05,
			val2: -0.05,
			loops: 5,
			loopDuration: 50
		},
	}
}];


const soot_splash_params =
[{
	filterType: "splash",
	filterId: "sootSplash",
	rank:5,
	color: 0x999999,
	padding: 30,
	time: Math.random()*1000,
	seed: Math.random(),
	splashFactor: 1,
	spread: 0.4,
	blend: 1,
	dimX: 2,
	dimY: 2,
	cut: false,
	textureAlphaBlend: true,
	anchorX: 0.32+(Math.random()*0.36),
	anchorY: 0.32+(Math.random()*0.36)
}];

const blood_splash_params =
[{
	filterType: "splash",
	filterId: "bloodSplash",
	rank:5,
	color: 0x990505,
	padding: 30,
	time: Math.random()*1000,
	seed: Math.random(),
	splashFactor: 1,
	spread: 0.4,
	blend: 1,
	dimX: 2,
	dimY: 2,
	cut: false,
	textureAlphaBlend: true,
	anchorX: 0.32+(Math.random()*0.36),
	anchorY: 0.32+(Math.random()*0.36)
}];


export async function PlayHitShakeAnimation(moveTargetToken)
{
    if(!(game.modules.get("tokenmagic")?.active) || !(game.settings.get("ptu", "enableMoveAnimations") == true))
    {
        return false; // Either TMFX module is not installed, or config settings have disabled move animations, so stop here.
    }

    await game.ptu.api.addTokenMagicFilters(moveTargetToken, game.canvas.scene.id, hit_TMFX_params);
}


export async function PlayMissDodgeAnimation(moveTargetToken)
{
    if(!(game.modules.get("tokenmagic")?.active) || !(game.settings.get("ptu", "enableMoveAnimations") == true))
    {
        return false; // Either TMFX module is not installed, or config settings have disabled move animations, so stop here.
    }

    await game.ptu.api.addTokenMagicFilters(moveTargetToken, game.canvas.scene.id, dodge_TMFX_params);
}


async function PlayMoveTypeAura(move, moveUserToken) 
{
    if(move_type_auras[move.type.toLowerCase()])
    {
        new Sequence("PTU")
        .effect()
            .file( move_type_auras[move.type.toLowerCase()] )
            .atLocation(moveUserToken)
            .scaleToObject(1.5)
            // .rotateIn(360, 2000, {ease: "easeOutCubic"})
            // .rotateOut(360, 2000, {ease: "easeOutCubic"})
            // .scaleIn(0, 2000, {ease: "easeOutCubic"})
            // .scaleOut(0, 1000, {ease: "easeOutCubic"})
            // .duration(2000)
            .fadeOut(1000)
            .fadeIn(1000)
            .belowTokens()
            .tint(move_type_color_filters[move.type.toLowerCase()])
        .play();
    }
}


async function PlayMoveTargetHitImpact(move, moveTargetToken) 
{
    if(move_type_impacts_physical[move.type.toLowerCase()])
    {
        new Sequence("PTU")
        .effect()
            .file( move_type_impacts_physical[move.type.toLowerCase()] )
            .atLocation(moveTargetToken)
            // .scaleToObject(1.5)
            // .rotateIn(360, 2000, {ease: "easeOutCubic"})
            // .rotateOut(360, 2000, {ease: "easeOutCubic"})
            // .scaleIn(0, 2000, {ease: "easeOutCubic"})
            // .scaleOut(0, 1000, {ease: "easeOutCubic"})
            // .duration(2000)
            // .fadeOut(1000)
            // .fadeIn(1000)
            // .belowTokens()
            .tint(move_type_color_filters[move.type.toLowerCase()])
        .play();
    }
}


async function PlayMoveSelfAnimation(move, moveUserToken) 
{
    if(move_animation_library[move.name.toLowerCase()]?.self)
    {
        let scale = move_animation_library[move.name.toLowerCase()].self?.scale;
        let repeats = move_animation_library[move.name.toLowerCase()].self?.repeats ? move_animation_library[move.name.toLowerCase()].self?.repeats : [0];
        let anchor_x = move_animation_library[move.name.toLowerCase()].self?.anchor_x;
        let anchor_y = move_animation_library[move.name.toLowerCase()].self?.anchor_y;

        new Sequence("PTU")
            .effect()
                .file( move_animation_library[move.name.toLowerCase()]["self"]["path"] )
                .atLocation(moveUserToken)
                // .anchor(anchor_x, anchor_y)
                .spriteAnchor({ x: anchor_x, y: anchor_y })
                .scaleToObject(scale)
                .tint(move_type_color_filters[move.type.toLowerCase()])
                .repeats(...repeats)
            .play();
    }
}


async function PlayMoveSuccessfulAttackAnimation(move, moveUserToken, moveTargetToken) 
{
    if(move_animation_library[move.name.toLowerCase()]?.hit)
    {
        let scale = move_animation_library[move.name.toLowerCase()].hit?.scale;
        let repeats = move_animation_library[move.name.toLowerCase()].hit?.repeats ? move_animation_library[move.name.toLowerCase()].hit?.repeats : [1, 0, 0];
        let anchor_x = move_animation_library[move.name.toLowerCase()].hit?.anchor_x;
        let anchor_y = move_animation_library[move.name.toLowerCase()].hit?.anchor_y;
        let origin_location = moveUserToken;
        let target_location = moveTargetToken;

        if(move_animation_library[move.name.toLowerCase()].hit?.melee == true)
        {

        }
        
        move_animation_library[move.name.toLowerCase()].hit?.melee ? move_animation_library[move.name.toLowerCase()].hit?.melee : false;

        new Sequence("PTU")
            .effect()
                .file( move_animation_library[move.name.toLowerCase()]["hit"]["path"] )
                .atLocation(origin_location)
                // .anchor(anchor_x, anchor_y)
                .scale(scale)
                .tint(move_type_color_filters[move.type.toLowerCase()])
                .stretchTo(target_location)
                .missed(false)
                .repeats(...repeats)
            .play();
    }
    setTimeout( async () => { 
        await PlayMoveTargetHitImpact(move, moveTargetToken);
        await PlayHitShakeAnimation(moveTargetToken);
    }, move_animation_delay_ms);
}


async function PlayMoveMissedAttackAnimation(move, moveUserToken, moveTargetToken) 
{
    if(move_animation_library[move.name.toLowerCase()]?.miss) // Use miss-specific animation if one exists...
    {
        let scale = move_animation_library[move.name.toLowerCase()].miss?.scale;
        let repeats = move_animation_library[move.name.toLowerCase()].miss?.repeats ? move_animation_library[move.name.toLowerCase()].miss?.repeats : [1, 0, 0];
        let anchor_x = move_animation_library[move.name.toLowerCase()].miss?.anchor_x;
        let anchor_y = move_animation_library[move.name.toLowerCase()].miss?.anchor_y;
        let origin_location = moveUserToken;
        let target_location = moveTargetToken;

        new Sequence("PTU")
            .effect()
                .file( move_animation_library[move.name.toLowerCase()]["miss"]["path"] )
                .atLocation(origin_location)
                // .anchor(anchor_x, anchor_y)
                .scale(scale)
                .tint(move_type_color_filters[move.type.toLowerCase()])
                .stretchTo(target_location)
                .missed(true)
                .repeats(...repeats)
            .play();
    }
    else if(move_animation_library[move.name.toLowerCase()]?.hit) // Otherwise just fallback to the normal animation.
    {
        let scale = move_animation_library[move.name.toLowerCase()].hit?.scale;
        let repeats = move_animation_library[move.name.toLowerCase()].hit?.repeats ? move_animation_library[move.name.toLowerCase()].hit?.repeats : [1, 0, 0];
        let anchor_x = move_animation_library[move.name.toLowerCase()].hit?.anchor_x;
        let anchor_y = move_animation_library[move.name.toLowerCase()].hit?.anchor_y;
        let origin_location = moveUserToken;
        let target_location = moveTargetToken;

        new Sequence("PTU")
            .effect()
                .file( move_animation_library[move.name.toLowerCase()]["hit"]["path"] )
                .atLocation(origin_location)
                // .anchor(anchor_x, anchor_y)
                .scale(scale)
                .tint(move_type_color_filters[move.type.toLowerCase()])
                .stretchTo(target_location)
                .missed(true)
                .repeats(...repeats)
            .play();
    }
    setTimeout( async () => { 
        await PlayMissDodgeAnimation(moveTargetToken);
    }, move_animation_delay_ms);
}


export async function PlayMoveAnimations(move, moveUserToken, attacksData) 
{
    if(!((game.modules.get("sequencer")?.active) && (game.modules.get("jb2a_patreon")?.active)) || !(game.settings.get("ptu", "enableMoveAnimations") == true))
    {
        return false; // Either Sequencer module is not installed, or config settings have disabled move animations, so stop here.
    }

    await PlayMoveTypeAura(move, moveUserToken); // Play general type-based 'I am using a move' effect around user.
    await PlayMoveSelfAnimation(move, moveUserToken); // Play any effects that swirl around the *user* of the move.

    if( (move.range.toLowerCase().includes("self") == false) && (move.range.toLowerCase().includes("blessing") == false) && (move.range.toLowerCase().includes("field") == false))
    {
        for(let target_token_id in attacksData) // Then play the 'projectile' effects between the user and each target.
        {
            if(attacksData[target_token_id].isHit)
            {
                await PlayMoveSuccessfulAttackAnimation(move, moveUserToken, canvas.tokens.get(target_token_id));
            }
            else
            {
                await PlayMoveMissedAttackAnimation(move, moveUserToken, canvas.tokens.get(target_token_id));
            }
        }
    }

    return true;
}


export async function injuryTokenSplash(actor)
{
    if(!(game.modules.get("tokenmagic")?.active) || !(game.settings.get("ptu", "useInjurySplashes") == true))
    {
        return false; // Either TokenMagicFX module is not installed, or config settings have disabled injury splashes, so stop here.
    }

	let blood_allowed = game.settings.get("ptu", "useBloodSplashes");

	let actor_tokens = actor.getActiveTokens();
	let actor_token = actor_tokens[0];

    if( (actor.system.health.injuries >= 5) && (blood_allowed) )
    {
        // await actor_token.TMFXaddUpdateFilters(blood_splash_params);
        await game.ptu.api.addTokenMagicFilters(actor_token, game.canvas.scene, blood_splash_params);
    }
    else
    {
        // await actor_token.TMFXaddUpdateFilters(soot_splash_params);
        await game.ptu.api.addTokenMagicFilters(actor_token, game.canvas.scene, blood_splash_params);
    }
}


export async function cleanInjuryTokenSplash(actor)
{
	let actor_tokens = actor.getActiveTokens();
	let actor_token = actor_tokens[0];

	// await actor_token.TMFXdeleteFilters("sootSplash");
	// await actor_token.TMFXdeleteFilters("bloodSplash");
    await game.ptu.api.removeTokenMagicFilters(target, game.canvas.scene.id, "sootSplash");
    await game.ptu.api.removeTokenMagicFilters(target, game.canvas.scene.id, "bloodSplash");
}