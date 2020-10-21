function getTypeEffectiveness(targetType) {
    return duplicate(game.ptu.TypeEffectiveness[targetType])
}

export function GetMonEffectiveness(typing) {
    let typeCalc;
    let effectivenesses = {Weakness: [], Normal: [], Resistant: [], Immune: []}
    for(let type of typing) {
        if(!typeCalc) typeCalc = getTypeEffectiveness(type); 
        else 
            for(const [typeKey,effectiveness] of Object.entries(getTypeEffectiveness(type))) {
                typeCalc[typeKey] *= effectiveness;
            }
    }

    /** TODO: Add Abilities - See Issue #27 */

    for(const [typeKey,value] of Object.entries(typeCalc)) {
        if(value < 1) {
            if(value == 0) {
                effectivenesses.Immune.push({[typeKey]: 0});
                continue;
            }
            effectivenesses.Resistant.push({[typeKey]: value});
            continue;
        }
        if(value == 1) {
            effectivenesses.Normal.push({[typeKey]: 1});
            continue;
        }
        if(value >= 2) {
            effectivenesses.Weakness.push({[typeKey]: value > 2 ? Math.log2(value) : value == 2 ? 1.5 : value});
            continue;
        }
    }
    
    return effectivenesses;
}