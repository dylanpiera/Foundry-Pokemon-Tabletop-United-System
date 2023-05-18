import { debug, log } from "../../ptu.js";
import { PlayMissDodgeAnimation, PlayHitShakeAnimation } from "./move_animations.js";
import { RollCaptureChance, applyCapture } from "../../utils/pokeball-capture-calculations.js"
import { timeout, capitalizeFirstLetter } from "../../utils/generic-helpers.js";

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

const pokeball_return_beam_FX_path = "modules/jb2a_patreon/Library/Generic/Energy/EnergyBeam_02_Regular_Red_30ft_1600x400.webm";
const pokeball_capture_pulse_FX_path = "modules/jb2a_patreon/Library/TMFX/InPulse/Circle/InPulse_01_Circle_Fast_500.webm";
const pokeball_escape_burst_FX_path = "modules/jb2a_patreon/Library/1st_Level/Thunderwave/Thunderwave_01_Bright_Orange_Center_600x600.webm";

export const pokeball_capture_TMFX_params =
[
    {
        filterType: "transform",
        filterId: "pokeballShoop",
        bpRadiusPercent: 100,
        autoDestroy: true,
        animated:
        {
            bpStrength:
            {
                animType: "cosOscillation",
                val1: 0,
                val2: -0.99,
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
        color: 0xFFFFFF,
        quality: 0.5,
        autoDestroy: true,
        animated:
        {
            color:
            {
                active: true,
                loopDuration: 1500,
                loops: 1,
                animType: "colorOscillation",
                val1: 0xFFFFFF,
                val2: 0xff0000,
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


const pokeballShoop_params =
[
    {
        filterType: "transform",
        filterId: "pokeballShoop",
        bpRadiusPercent: 100,
        autoDestroy: true,
        animated:
        {
            bpStrength:
            {
                animType: "cosOscillation",
                val1: 0,
                val2: -0.99,
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
        color: 0xFFFFFF,
        quality: 0.5,
        autoDestroy: true,
        animated:
        {
            color: 
            {
            active: true, 
            loopDuration: 1500, 
            loops: 1,
            animType: "colorOscillation", 
            val1:0xFFFFFF,
            val2:0xff0000,
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
    // await target_token.TMFXaddUpdateFilters(polymorph_params);
    await game.ptu.utils.api.gm.addTokenMagicFilters(target_token, game.canvas.scene, polymorph_params);
};


export async function ThrowPokeball(thrower, target, pokeball) {
    if (!target) {
        ui.notifications.error ("No target to throw pokeball at.");
        return false;
    }
    if (!thrower) return;
    const throwerToken = thrower.actor ? thrower : thrower.getActiveTokens()[0];
    if (!throwerToken) return;
    
    const targetToken = target.actor ? target : target.getActiveTokens()[0];
    if (!targetToken) return;
    if(targetToken.actor.type != "pokemon") return;

    if(pokeball.system.quantity < 1){
        ui.notifications.error("You don't have any of those left!");
        return;
    }

    const enable_pokeball_sounds = game.settings.get("ptu", "usePokeballSoundsOnDragOut");

    
    //reduce the number of balls that the character has by 1
    ui.notifications.info("Removed 1 quantity from Pokeball in inventory.")
    pokeball.update({"system.quantity": Number(duplicate(pokeball.system.quantity)) - 1});

    const POKEBALL_IMAGE_PATH = pokeball?.img ?? "systems/ptu/images/item_icons/basic ball.webp";

    let accuracyBonus = thrower?.data?.data?.modifiers?.acBonus?.total ?? 0;
    // The only thing I know of that gives a bonus would be Tools of the Trade, +2AC

    function probablyHasToolsOfTheTrade(actor){
        // So, TotT (Tools of the Trade) is not a Feature. We do not know how people track it explicitly. So, there are two things to look for
        // If a Feature includes the string Tools of the Trade in the Title, we guess the Trainer has it
        // Same for a Feature Description, EXCEPT we must exclude the occurence from the default Description that lists all Capture Techniques.
        // Otherwise, the default Capture Specialist would trigger it very time.
        const snippetThatListsAllCaptureTechniques = "Capture Techniques: Capture Skills, Curve Ball, Devitalizing Throw, Fast Pitch, Snare, Tools of the Trade, Catch Combo, False Strike, Relentless Pursuit";
        if (! actor.feats) return false;
        for (let feature of actor.feats){
            if (feature.name.toLowerCase().includes("tools of the trade")) return true;
            let description = feature.data.effect;
            if (description.includes(snippetThatListsAllCaptureTechniques)) description = description.replaceAll(snippetThatListsAllCaptureTechniques, "kek");
            if (description.toLowerCase().includes("tools of the trade")) return true;
        }
        return false;
    }

    if (probablyHasToolsOfTheTrade(thrower)) accuracyBonus += 2;

    const BASE_POKEBALL_AC = 6;
    const targetEvasion = target?.data?.data?.evasion?.speed ?? 0;

    const roll = new Roll("1d20 + @accuracyBonus - @acCheck", {
        accuracyBonus: accuracyBonus,
        acCheck: BASE_POKEBALL_AC
    });

    await roll.evaluate({ async: true });
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

    if(enable_pokeball_sounds)
        AudioHelper.play({ src: pokeball_sound_paths[hitType], volume: 0.8, autoplay: true, loop: false }, true);

    await timeout(1000);
    await roll.toMessage({ flavor: `Pokeball throw vs ${target.name}'s ${targetEvasion} Speed Evasion:`, sound: null });

    if (hitType == "hit") // Do hit-shake, then pokeball-shoop transformation
    {
        await PlayHitShakeAnimation(targetToken);

        let captureData = await RollCaptureChance(thrower, target, pokeball.name, roll, targetToken);
        const isCaptured = (Number(captureData.roll.total) <= captureData.rate) ? true : false;

        if ((game.modules.get("tokenmagic")?.active) && (game.settings.get("ptu", "enableMoveAnimations") == true))
        {
            await timeout(1000);

            await PlayPokeballShoopFX(targetToken, POKEBALL_IMAGE_PATH, roll.total, pokeball, thrower, target, isCaptured);
            // await timeout(1500);

            await PlayPokeballWiggleFX(targetToken);
            await timeout(10000); // Wiggle sound last for approx 7 seconds
            // await target.TMFXdeleteFilters("pokeballWiggle");
            await game.ptu.utils.api.gm.removeTokenMagicFilters(target, game.canvas.scene.id, "pokeballWiggle");

            await PlayPokeballCatchOrEscapeFX(isCaptured, targetToken);
        }
        await timeout(1000);

        await captureData.roll.toMessage({ flavor: `Pokeball capture check vs ${target.name}'s ${captureData.rate} Capture Rate:`, sound: null }); //message.data.sound = null; // Suppress dice sounds for Move Master roll templates

        if (isCaptured == true) // Captured!
        {
            if(enable_pokeball_sounds) await AudioHelper.play({ src: pokeball_sound_paths["capture_success"], volume: 0.8, autoplay: true, loop: false }, true);
    
            await timeout(1000);
            if(enable_pokeball_sounds) await AudioHelper.play({ src: pokeball_sound_paths["capture_jingle"], volume: 0.7, autoplay: true, loop: false }, true);

            await applyCapture(thrower, target.actor, pokeball, game.ptu.utils.species.get(target.actor.system.species)); 
        }
        else // Escaped!
        {
            if(enable_pokeball_sounds)
                await AudioHelper.play({ src: pokeball_sound_paths["release"], volume: 0.7, autoplay: true, loop: false }, true);
            if ((game.modules.get("tokenmagic")?.active) && (game.settings.get("ptu", "enableMoveAnimations") == true))
            {
                await game.ptu.utils.api.gm.addTokenMagicFilters(target, game.canvas.scene.id, pokeball_capture_TMFX_params);
                
                await timeout(100);
                await pokeballPolymorphFunc(POKEBALL_IMAGE_PATH, target);
                
                await timeout(1000);
                // await target.TMFXdeleteFilters("pokeball_transform");
                await game.ptu.utils.api.gm.removeTokenMagicFilters(target, game.canvas.scene.id, "pokeball_transform");
            }

            if (game.settings.get("ptu", "trackBrokenPokeballs"))
            {
                //check if thrower already has a broken ball of that type
                const brokenBall = thrower.items.find(i => i.name == "Broken " + pokeball.name);

                if (brokenBall) //if they do, increment the quantity
                    await brokenBall.update({"system.quantity": duplicate(brokenBall.system.quantity)+1})
                else //if they don't, create a new item
                {
                    await thrower.createEmbeddedDocuments('Item',[{
                        name: `Broken ${pokeball.name}`,
                        type: "item",
                        system: {
                            quantity: 1
                        },
                        img: pokeball.img
                    }])
                }
            }
        }

        return isCaptured;
    }
    else // Do miss-dodge
    {
        await PlayMissDodgeAnimation(targetToken);
        return false;
    }
}


export async function recallPokemon(target_actor) {
    for (let affliction of VolatileAfflictions) 
    {
        await cureActorAffliction(target_actor, affliction, true);
    }

    await ResetStagesToDefault(target_actor, true);

    // chatMessage(target_actor, target_actor.name + ' was recalled! Stages reset to defaults, and all volatile conditions cured!');
}


export async function PlayReleaseOwnedPokemonAnimation(token) {

    if (!game.modules.get("tokenmagic")?.active || (game.settings.get("ptu", "enableMoveAnimations") == false)) return;
    
    let tokenData = token.data;
    let actor = game.actors.get(tokenData.actorId);
    if(actor.type != "pokemon") {return false}
    
    let item_icon_path = "systems/ptu/images/item_icons/"
    let pokeball = (actor?.data?.data?.pokeball.toLowerCase()) ?? "basic ball";
    if(pokeball == "") { pokeball = "basic ball"; }

    let display_token_nature = game.settings.get("ptu", "alwaysDisplayTokenNature");
    let enable_pokeball_animation = game.settings.get("ptu", "usePokeballAnimationOnDragOut");
    let enable_pokeball_sounds = game.settings.get("ptu", "usePokeballSoundsOnDragOut");
    let always_display_token_name = game.settings.get("ptu", "alwaysDisplayTokenNames");
    let always_display_token_health = game.settings.get("ptu", "alwaysDisplayTokenHealth");

    if(actor)
    {
        let target_token;
        if(tokenData.actorLink == false)
        {
            target_token = canvas.tokens.get(token.id); // The thrown pokemon if token-actor
        }
        else
        {
            target_token = game.actors.get(actor.id).getActiveTokens().slice(-1)[0]; // The thrown pokemon if linked actor
        }

        let current_token_species = actor.name;
        if(actor.system.species)
        {
            current_token_species = capitalizeFirstLetter((actor.system.species).toLowerCase());
        }
        
        let current_token_nature = "";
        if(actor.system.nature && display_token_nature)
        {
            current_token_nature = capitalizeFirstLetter((actor.system.nature.value).toLowerCase())+" ";
        }

        if(actor.data.type == "pokemon" && (actor.system.owner != "0" && actor.system.owner != "")) // Owned Pokemon
        {
            let trainer_actor = game.actors.get(actor.system.owner);
            let trainer_tokens = trainer_actor.getActiveTokens();
            let actor_token = trainer_tokens[0]; // The throwing trainer
            
            if(enable_pokeball_animation)
            {
                // await target_token.document.update({ "alpha": (0) });
                await game.ptu.utils.api.gm.tokensUpdate(target_token, {alpha: 0})
            }

            if(enable_pokeball_sounds)
                await AudioHelper.play({src: pokeball_sound_paths["miss"], volume: 0.5, autoplay: true, loop: false}, true);

            let targetImagePath = item_icon_path+pokeball+".webp";

            if(enable_pokeball_animation)
            { 
                if(game.modules.get("sequencer")?.active && actor_token)
                {
                    new Sequence("PTU")
                        .effect()
                        .file(targetImagePath)
                        .atLocation(actor_token)
                        .scale(0.3)
                        .moveSpeed(1000)
                        .rotateIn(960, 5000, { ease: "easeOutCubic" })
                        .moveTowards(token, { ease: "easeOutBounce", rotate: true })
                        .missed(false)
                    .play();
                }

                await timeout(500);
                if(enable_pokeball_sounds)
                    await AudioHelper.play({src: pokeball_sound_paths["release"], volume: 0.5, autoplay: true, loop: false}, true); 

                await timeout(500);
                // await target_token.TMFXaddUpdateFilters(pokeballShoop_params); 
                await game.ptu.utils.api.gm.addTokenMagicFilters(target_token, game.canvas.scene, pokeballShoop_params);
                // await target_token.document.update({ "alpha": (1) });
                await game.ptu.utils.api.gm.tokensUpdate(target_token, {alpha: 1})
            }

            await timeout(2000);
            await game.ptu.utils.species.playCry(actor.system.species, actor.system.shiny);
            await target_token.document.update({ "alpha": (1) });

        }
        else if (actor.data.type == "pokemon") // Wild Pokemon - no pokeball release effect.
        {
            await game.ptu.utils.species.playCry(actor.system.species, actor.system.shiny);

            if(always_display_token_name)
            {
                if(always_display_token_health)
                {
                    await target_token.document.update({
                        "name": (current_token_nature+current_token_species),
                        "bar1.attribute": "health",
                        "displayBars": 50,
                        "displayName": 50,
                        "alpha": (1)
                    });  
                }
                else
                {
                    await target_token.document.update({
                        "name": (current_token_nature+current_token_species),
                        "displayName": 50,
                        "alpha": (1)
                    });  
                }
            }
            else if (always_display_token_health)
            {
                await target_token.document.update({
                    "bar1.attribute": "health",
                    "displayBars": 50,
                    "alpha": (1)
                });  
            }
            else
            {
                await target_token.document.update({ "alpha": (1) });
            }	
        }

        //if shiny add sparkles upon release
        if(actor.system.shiny && game.modules.get("sequencer")?.active && game.modules.get("jb2a_patreon")?.active && target_token)
        {
            const sparklesFilePath = "modules/jb2a_patreon/Library/Generic/Item/GlintMany01_02_Regular_Yellow_200x200.webm"
            new Sequence("PTU")
                .effect()
                .file(sparklesFilePath)
                .atLocation(target_token)
                .scale(target_token.document.height*0.5, target_token.document.height*0.5)
                .randomRotation()
                .fadeOut(1000)
                .fadeIn(1000)
            .play();
        }
    }
}


export async function PlayPokeballReturnAnimation(pokemon_token)
{
    let enable_pokeball_sounds = game.settings.get("ptu", "usePokeballSoundsOnDragOut");
    let pokemon_actor = await GetActorFromToken(pokemon_token);
    if(pokemon_actor?.type == "pokemon")
    {
        let trainer_actor = game.actors.get(pokemon_token.actor.system.owner)
        let trainer_tokens = await trainer_actor?.getActiveTokens();
        let on_field_trainer_token = trainer_tokens?.[0];
    
        if (on_field_trainer_token && (game.modules.get("sequencer")?.active) && (game.modules.get("jb2a_patreon")?.active) && (game.settings.get("ptu", "enableMoveAnimations") == true)) {
            new Sequence("PTU")
                .effect()
                .file(pokeball_return_beam_FX_path)
                // .tint("#FF0000") // TODO: This red tint doesn't seem to do anything.
                .atLocation(pokemon_token.object)
                .stretchTo(on_field_trainer_token)
            .play();
        }
    
        if ((game.modules.get("tokenmagic")?.active) && (game.settings.get("ptu", "enableMoveAnimations") == true)) {
            await game.ptu.utils.api.gm.addTokenMagicFilters(pokemon_token.object, game.canvas.scene.id, pokeball_capture_TMFX_params);
        }
    
        if(enable_pokeball_sounds)
            await AudioHelper.play({ src: pokeball_sound_paths["return"], volume: 0.7, autoplay: true, loop: false }, true);
    
        await timeout(2000);
        await pokemon_token.delete()
    }
    else
    {
        await pokemon_token.delete();
    }
}


export async function PlayPokeballShoopFX(target_token, pokeball_image_path, to_hit_roll, pokeball_item, throwing_actor, target_actor, isCaptured) 
{
    let enable_pokeball_sounds = game.settings.get("ptu", "usePokeballSoundsOnDragOut");
    if ((game.modules.get("tokenmagic")?.active) && (game.settings.get("ptu", "enableMoveAnimations") == true)) 
    {
        await game.ptu.utils.api.gm.addTokenMagicFilters(target_token, game.canvas.scene.id, pokeball_capture_TMFX_params);
        await pokeballPolymorphFunc(pokeball_image_path, target_token);
    }
    if(enable_pokeball_sounds)
        await AudioHelper.play({ src: pokeball_sound_paths["capture_attempt"], volume: 0.8, autoplay: true, loop: false }, true);
}


export async function PlayPokeballCatchOrEscapeFX(isCaptured, targetToken)
{
    if (isCaptured)
    {
        if((game.modules.get("sequencer")?.active) && (game.settings.get("ptu", "enableMoveAnimations") == true)) 
        {
            new Sequence("PTU")
                .effect()
                .file(pokeball_capture_pulse_FX_path)
                .atLocation(targetToken)
                .scaleToObject(3)
                .belowTokens(true)
            .play();
        }

        if((game.modules.get("confetti")?.active) && (game.settings.get("ptu", "enableMoveAnimations") == true))
        {
            const strength = window.confetti.confettiStrength.high;
            const shootConfettiProps = window.confetti.getShootConfettiProps(strength);
            window.confetti.shootConfetti(shootConfettiProps);
        }

        return true;
    }
    else
    {
        if((game.modules.get("sequencer")?.active) && (game.settings.get("ptu", "enableMoveAnimations") == true)) 
        {
            new Sequence("PTU")
                .effect()
                .file(pokeball_escape_burst_FX_path)
                .atLocation(targetToken)
                .scaleToObject(1.5)
                .belowTokens(true)
            .play();
        }

        return false;
    }
}


export async function PlayPokeballWiggleFX(target_token)
{
    const enable_pokeball_sounds = game.settings.get("ptu", "usePokeballSoundsOnDragOut");
    
    if(enable_pokeball_sounds)
        await AudioHelper.play({ src: pokeball_sound_paths["wiggle"], volume: 0.8, autoplay: true, loop: false }, true);

    if ((game.modules.get("tokenmagic")?.active) && (game.settings.get("ptu", "enableMoveAnimations") == true))
    {
        await game.ptu.utils.api.gm.addTokenMagicFilters(target_token, game.canvas.scene.id, pokeball_wiggle_TMFX_params);
    }
    
    return true;
}
