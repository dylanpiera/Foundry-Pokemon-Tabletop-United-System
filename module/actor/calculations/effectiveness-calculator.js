function getTypeEffectiveness(targetType) {
    return duplicate(game.ptu.TypeEffectiveness[targetType])
}

export function GetMonEffectiveness(data) {
    let effectivenesses = {Weakness: [], Normal: [], Resistant: [], Immune: [], All: []}
    if(!data.data.typing) return effectivenesses;
    let typing = data.data.typing
    let typeCalc;
    
    for(let type of typing) {
        if(type === "Special") continue;
        if(!typeCalc) typeCalc = getTypeEffectiveness(type); 
        else 
            for(const [typeKey,effectiveness] of Object.entries(getTypeEffectiveness(type))) {
                typeCalc[typeKey] *= effectiveness;
            }
    }

    if(!game.settings.get("ptu", "uraniumData")) {
        delete typeCalc["Nuclear"];
    }

    /** TODO: Add Abilities - See Issue #27 */
    let abilities = {
        "Desert Weather": {active: false, execute: function(typeCalc) {return typeCalc;}}, //TODO: Add this ability once we have weather implemented
        "Cave Crasher": {active: false, execute: function(typeCalc) {typeCalc["Ground"] *= 0.5; typeCalc["Rock"] *= 0.5; return typeCalc;}},
        "Dry Skin": {active: false, execute: function(typeCalc) {typeCalc["Water"] *= 0; return typeCalc;}},
        "Storm Drain": {active: false, execute: function(typeCalc) {typeCalc["Water"] *= 0; return typeCalc;}},
        "Water Absorb": {active: false, execute: function(typeCalc) {typeCalc["Water"] *= 0; return typeCalc;}},
        "Flash Fire": {active: false, execute: function(typeCalc) {typeCalc["Fire"] *= 0; return typeCalc;}},
        "Water Bubble": {active: false, execute: function(typeCalc) {typeCalc["Fire"] *= 0.5; return typeCalc;}},
        "Flying Fly Trap": {active: false, execute: function(typeCalc) {typeCalc["Bug"] *= 0.5; typeCalc["Ground"] *= 0.5; return typeCalc;}},
        "Sacred Bell": {active: false, execute: function(typeCalc) {typeCalc["Dark"] *= 0.5; typeCalc["Ghost"] *= 0.5; return typeCalc;}},
        "Heatproof": {active: false, execute: function(typeCalc) {typeCalc["Fire"] *= 0.5; return typeCalc;}},
        "Levitate": {active: false, execute: function(typeCalc) {typeCalc["Ground"] *= 0; return typeCalc;}},
        "Lightning Rod": {active: false, execute: function(typeCalc) {typeCalc["Electric"] *= 0; return typeCalc;}},
        "Motor Drive": {active: false, execute: function(typeCalc) {typeCalc["Electric"] *= 0; return typeCalc;}},
        "Volt Absorb": {active: false, execute: function(typeCalc) {typeCalc["Electric"] *= 0; return typeCalc;}},
        "Mud Dweller": {active: false, execute: function(typeCalc) {typeCalc["Ground"] *= 0.5; typeCalc["Water"] *= 0.5; return typeCalc;}},
        "Sap Sipper": {active: false, execute: function(typeCalc) {typeCalc["Grass"] *= 0; return typeCalc;}},
        "Sun Blanket": {active: false, execute: function(typeCalc) {typeCalc["Fire"] *= 0.5; return typeCalc;}},
        "Thick Fat": {active: false, execute: function(typeCalc) {typeCalc["Fire"] *= 0.5; typeCalc["Ice"] *= 0.5; return typeCalc;}},
        "Tochukaso": {active: false, execute: function(typeCalc) {typeCalc["Bug"] *= 0.5; typeCalc["Poison"] *= 0.5; return typeCalc;}},
        "Windveiled": {active: false, execute: function(typeCalc) {typeCalc["Flying"] *= 0; return typeCalc;}},
        "Winter's Kiss": {active: false, execute: function(typeCalc) {typeCalc["Ice"] *= 0; return typeCalc;}},
        "Tolerance": {active: false, execute: function(typeCalc) {
            for(const [key,value] of Object.entries(typeCalc).filter(x => x[1] < 1)) {
                typeCalc[key] *= 0.5;
            }
            return typeCalc;
        }},
        "Filter": {active: false, execute: function(typeCalc) {
            for(const [key,value] of Object.entries(typeCalc).filter(x => x[1] > 1 && x[1] <= 4)) {
                typeCalc[key] = value == 2 ? 1.25 : 2;
            }
            return typeCalc;
        }},
        "Solid Rock": {active: false, execute: function(typeCalc) {
            for(const [key,value] of Object.entries(typeCalc).filter(x => x[1] > 1 && x[1] <= 4)) {
                typeCalc[key] = value == 2 ? 1.25 : 2;
            }
            return typeCalc;
        }},
        "Wonder Guard": {active: false, execute: function(typeCalc) {
            if(Object.entries(typeCalc).filter(x => x[1] > 1).length == 0) return typeCalc;
            for(const [key,value] of Object.entries(typeCalc).filter(x => x[1] <= 1)) {
                typeCalc[key] *= 0;
            }
            return typeCalc;
        }},
    }

    for(let ability of data.items.filter(x => x.type == "ability")) {
        for(let key of Object.keys(abilities)) {
            if(ability.name?.toLowerCase() == "Sun Blanket [Playtest]".toLowerCase()) break;
            if(ability.name?.toLowerCase() == "Filter [Playtest]".toLowerCase()) break;
            if(ability.name?.toLowerCase() == "Solid Rock [Playtest]".toLowerCase()) break;
            if(ability.name?.toLowerCase().replace("[playtest]","").trim() == key.toLowerCase()) {
                abilities[key].active = true;
                break;
            }
        }
    }

    for(const [key,value] of Object.entries(abilities).filter(x => x[1].active == true)) {
        typeCalc = value.execute(typeCalc);
    }

    const effectivenessModifier = data.data.modifiers?.resistanceSteps?.total ?? 0;
    if(effectivenessModifier != 0) {
        const timesMod = Math.pow((effectivenessModifier > 0 ? 0.5 : 2), Math.abs(effectivenessModifier));

        for(const [type, value] of Object.entries(typeCalc)) {
            typeCalc[type] *= timesMod;
        }
    }

    for(const [typeKey,value] of Object.entries(typeCalc)) {
        if(value < 1) {
            if(value == 0) {
                effectivenesses.Immune.push({[typeKey]: 0});
                effectivenesses.All.push([typeKey, 0])
                continue;
            }
            effectivenesses.Resistant.push({[typeKey]: value});
            effectivenesses.All.push([typeKey, value])
            continue;
        }
        if(value == 1) {
            effectivenesses.Normal.push({[typeKey]: 1});
            effectivenesses.All.push([typeKey, 1])
            continue;
        }
        if(value > 1) {
            effectivenesses.Weakness.push({[typeKey]: value > 2 ? Math.log2(value) : value == 2 ? 1.5 : value});
            effectivenesses.All.push([typeKey, value > 2 ? Math.log2(value) : value == 2 ? 1.5 : value])
            continue;
        }
    }
    
    effectivenesses.All = Object.fromEntries(effectivenesses.All);

    return effectivenesses;
}