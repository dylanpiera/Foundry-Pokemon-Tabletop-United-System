import { debug, log } from "../../ptu.js";
import { PlayMissDodgeAnimation, PlayHitShakeAnimation } from "./move_animations.js";
import { RollCaptureChance } from "../../utils/pokeball-capture-calculations.js"

export const pokeball_sound_paths = {
    "miss": "systems/ptu/sounds/pokeball_sounds/pokeball_miss.mp3",
    "hit": "systems/ptu/sounds/pokeball_sounds/pokeball_hit.mp3",
    "wiggle": "systems/ptu/sounds/pokeball_sounds/pokeball_escape_attempt.mp3",
    "capture_attempt": "systems/ptu/sounds/pokeball_sounds/pokeball_catch_attempt.mp3",
    "capture_success": "systems/ptu/sounds/pokeball_sounds/pokeball_catch_confirmed.mp3",
    "capture_jingle": "systems/ptu/sounds/pokeball_sounds/pokeball_success_jingle.wav",
    "menu_open": "systems/ptu/sounds/pokeball_sounds/pokeball_grow.mp3",
    "menu_close": "systems/ptu/sounds/pokeball_sounds/pokeball_shrink.mp3",
    "return": "systems/ptu/sounds/pokeball_sounds/pokeball_return.mp3",
    "release": "systems/ptu/sounds/pokeball_sounds/pokeball_release.mp3",
};

const pokeball_capture_TMFX_params =
    [
        {
            filterType: "transform",
            filterId: "pokeballShoop",
            bpRadiusPercent: 100,
            //padding: 0,
            autoDestroy: true,
            animated:
            {
                bpStrength:
                {
                    animType: "cosOscillation",//"cosOscillation",
                    val1: 0,
                    val2: -0.99,//-0.65,
                    loopDuration: 1500,
                    loops: 1,
                }
            }
        },

        {
            filterType: "glow",
            filterId: "pokeballShoop",
            outerStrength: 40,
            innerStrength: 20,
            color: 0xFFFFFF,//0x5099DD,
            quality: 0.5,
            //padding: 0,
            //zOrder: 2,
            autoDestroy: true,
            animated:
            {
                color:
                {
                    active: true,
                    loopDuration: 1500,
                    loops: 1,
                    animType: "colorOscillation",
                    val1: 0xFFFFFF,//0x5099DD, 
                    val2: 0xff0000,//0x90EEFF
                }
            }
        },

        {
            filterType: "adjustment",
            filterId: "pokeballShoop",
            saturation: 1,
            brightness: 10,
            contrast: 1,
            gamma: 1,
            red: 1,
            green: 1,
            blue: 1,
            alpha: 1,
            autoDestroy: true,
            animated:
            {
                alpha:
                {
                    active: true,
                    loopDuration: 1500,
                    loops: 1,
                    animType: "syncCosOscillation",
                    val1: 0.35,
                    val2: 0.75
                }
            }
        }
    ];

const pokeball_wiggle_TMFX_params =
    [{
        filterType: "transform",
        filterId: "pokeballWiggle",
        padding: 50,
        animated:
        {
            translationX:
            {
                animType: "sinOscillation",
                val1: -0.0025,
                val2: +0.0025,
                loopDuration: 500,
            },
            translationY:
            {
                animType: "cosOscillation",
                val1: -0.00035,
                val2: +0.00035,
                loopDuration: 500,
            },
            rotation:
            {
                animType: "cosOscillation",
                val1: 15,
                val2: -15,
                loopDuration: 1000,
            },
        }
    }];


export async function GetActorFromToken(token) {
    let actor = game.actors.get(token.data.actorId);
    return actor;
};


export async function GetTokenFromActor(actor) {
    let actor_id = actor.id;
    let scene_tokens = game.scenes.current.data.tokens;

    let token = false;

    for (let searched_token of scene_tokens) {
        if (searched_token.actor.id == actor_id) {
            token = searched_token;
            break;
        }
    }

    return token;
};


let pokeballPolymorphFunc = async function (pokeball_image_path, target_token) {
    let transitionType = 9;
    let targetImagePath = pokeball_image_path;
    let polymorphFilterId = "pokeball_transform";
    let polymorph_params;

    // Is the filter already activated on the placeable ? 
    if (target_token.TMFXhasFilterId(polymorphFilterId)) {

        // Yes. So we update the type in the general section and loops + active in the progress animated section, to activate the animation for just one loop.
        // "type" to allow you to change the animation type
        // "active" to say at Token Magic : "Hey filter! It's time to work again!"
        // "loops" so that Token Magic can know how many loops it needs to schedule for the animation.
        // Each animation loop decreases "loops" by one. When "loops" reach 0, "active" becomes "false" and the animation will be dormant again.
        // Thank to the halfCosOscillation, a loop brings the value of the property from val1 to val2. A second loop is needed to bring val2 to val1. This is useful for monitoring progress with back and forth movements.
        polymorph_params =
            [{
                filterType: "polymorph",
                filterId: polymorphFilterId,
                type: transitionType,
                animated:
                {
                    progress:
                    {
                        active: true,
                        loops: 1
                    }
                }
            }];

    }
    else {
        // No. So we create the entirety of the filter
        polymorph_params =
            [{
                filterType: "polymorph",
                filterId: polymorphFilterId,
                type: transitionType,
                padding: 70,
                magnify: 0.25,
                imagePath: targetImagePath,
                animated:
                {
                    progress:
                    {
                        active: true,
                        animType: "halfCosOscillation",
                        val1: 0,
                        val2: 100,
                        loops: 1,
                        loopDuration: 1000
                    }
                }
            }];
    }

    // all functions that add, update or delete filters are asynchronous
    // if you are in a loop AND/OR you chain these functions, it is MANDATORY to await them
    // otherwise, data persistence may not works.
    // this is the reason why we use an async function (we cant use await in a non-async function)
    // avoid awaiting in a forEach loop, use "for" or "for/of" loop.
    await target_token.TMFXaddUpdateFilters(polymorph_params);
};


export async function PlayPokeballCaptureAnimation(target_token, pokeball_image_path, to_hit_roll, pokeball_item, throwing_actor, target_actor, isCaptured) {
    if (!(game.modules.get("tokenmagic")?.active) || !(game.settings.get("ptu", "enableMoveAnimations") == true)) {
        return false; // Either TMFX module is not installed, or config settings have disabled move animations, so stop here.
    }

    await TokenMagic.addFilters(target_token, pokeball_capture_TMFX_params);

    setTimeout(async () => {
        await pokeballPolymorphFunc(pokeball_image_path, target_token);
    }, 500);

    setTimeout(async () => {
        await AudioHelper.play({ src: pokeball_sound_paths["wiggle"], volume: 0.8, autoplay: true, loop: false }, true);
    }, 3000);

    setTimeout(async () => {
        await TokenMagic.addFilters(target_token, pokeball_wiggle_TMFX_params);
    }, 4000);

    setTimeout(async () => {
        await target_token.TMFXdeleteFilters("pokeballWiggle");

        if (isCaptured == true) // Captured!
        {
            await AudioHelper.play({ src: pokeball_sound_paths["capture_success"], volume: 0.8, autoplay: true, loop: false }, true);
            setTimeout(async () => {
                await AudioHelper.play({ src: pokeball_sound_paths["capture_jingle"], volume: 0.7, autoplay: true, loop: false }, true);
            }, 1000);
            setTimeout(async () => {
                await target_token.TMFXdeleteFilters("pokeball_transform");
            }, 2000);

        }
        else // Escaped!
        {
            setTimeout(async () => {
                await AudioHelper.play({ src: pokeball_sound_paths["release"], volume: 0.7, autoplay: true, loop: false }, true);
            }, 700);
            setTimeout(async () => {
                await TokenMagic.addFilters(target_token, pokeball_capture_TMFX_params);
            }, 900);
            setTimeout(async () => {
                await pokeballPolymorphFunc(pokeball_image_path, target_token);
            }, 1000);
            setTimeout(async () => {
                await target_token.TMFXdeleteFilters("pokeball_transform");
            }, 2000);
        }
    }, 10000);
}


export async function ThrowPokeball(thrower, target, pokeball) {
    if (!target) {
        console.log("No target to throw pokeball at.");
        return false;
    }
    if (!thrower) return;
    const throwerToken = thrower.actor ? thrower : thrower.getActiveTokens()[0];
    if (!throwerToken) return;
    
    const targetToken = target.actor ? target : target.getActiveTokens()[0];
    if (!targetToken) return;
    if(targetToken.actor.type != "pokemon") return;


    const POKEBALL_IMAGE_PATH = pokeball?.img ?? "systems/ptu/images/item_icons/basic ball.webp";

    const accuracyBonus = thrower?.data?.data?.modifiers?.acBonus?.total ?? 0; // TODO: Get actual value, factor in edges/features that effect this, etc.
    const BASE_POKEBALL_AC = -6;
    const targetEvasion = target?.data?.data?.evasion?.speed ?? 0;

    const roll = new Roll("1d20+@accuracyBonus-@acCheck", {
        accuracyBonus,
        acCheck: BASE_POKEBALL_AC
    });

    await roll.evaluate({ async: true });

    setTimeout(async () => {
        await roll.toMessage({ flavor: `Pokeball throw vs ${target.name}'s ${targetEvasion} Speed Evasion:`, sound: null });
    }, 500);

    const hitType = roll.total >= targetEvasion ? "hit": "miss";  

    if ((game.modules.get("sequencer")?.active) && (game.modules.get("jb2a_patreon")?.active) && (game.settings.get("ptu", "enableMoveAnimations") == true)) {
        new Sequence("PTU")
            .effect()
            .file(POKEBALL_IMAGE_PATH)
            .atLocation(throwerToken)
            .scale(0.3)
            .moveSpeed(1000)
            .rotateIn(960, 5000, { ease: "easeOutCubic" })
            .moveTowards(targetToken, { ease: "easeOutBounce", rotate: true })
            .missed((hitType == "miss"))
            .play();
    }

    if ((game.modules.get("tokenmagic")?.active) && (game.settings.get("ptu", "enableMoveAnimations") == true)) {
        if (hitType == "hit") // Do hit-shake, then pokeball-shoop transformation
        {
            await AudioHelper.play({ src: pokeball_sound_paths["capture_attempt"], volume: 0.8, autoplay: true, loop: false }, true);

            setTimeout(async () => {
                await PlayHitShakeAnimation(targetToken);
            }, 400);

            setTimeout(async () => {
                const isCaptured = hitType == "hit" ? await RollCaptureChance(thrower, target, pokeball.name, roll, targetToken) : false;
                await PlayPokeballCaptureAnimation(targetToken, POKEBALL_IMAGE_PATH, roll.total, pokeball, thrower, target, isCaptured);
            }, 1000);
        }
        else // Do miss-dodge
        {
            await PlayMissDodgeAnimation(targetToken);
        }
    }
    else {
        const isCaptured = hitType == "hit" ? await RollCaptureChance(thrower, target, pokeball.name, roll, targetToken) : false;
    }


    await AudioHelper.play({ src: pokeball_sound_paths[hitType], volume: 0.8, autoplay: true, loop: false }, true);

}


export async function recallPokemon(target_actor) {
    for (let affliction of VolatileAfflictions) {
        await cureActorAffliction(target_actor, affliction, true);
    }

    await ResetStagesToDefault(target_actor, true);

    // chatMessage(target_actor, target_actor.name + ' was recalled! Stages reset to defaults, and all volatile conditions cured!');
}