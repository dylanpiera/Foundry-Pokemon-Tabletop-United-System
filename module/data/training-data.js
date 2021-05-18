export default function(training, isOrder = false) {
    switch(training) {
        case "agility": return {
            changes: [
                {"key":"data.modifiers.initiative.mod","mode":2,"value":4,"priority":isOrder ? -2 : 20},
                {"key":"data.modifiers.capabilities.mod","mode":2,"value":1,"priority":isOrder ? -2 : 20}
            ]
        }
        case "brutal": return {
            changes: [
                {"key":"data.modifiers.critRange.mod","mode":2,"value":1,"priority":isOrder ? -2 : 20},
                {"key":"data.modifiers.effectRange.mod","mode":2,"value":1,"priority":isOrder ? -2 : 20}
            ]
        }
        case "focused": return {
            changes: [
                {"key":"data.modifiers.acBonus.mod","mode":2,"value":1,"priority":isOrder ? -2 : 20},
                {"key":"data.modifiers.skillBonus.mod","mode":2,"value":2,"priority":isOrder ? -2 : 20}
            ]
        }
        case "inspired": return {
            changes: [
                {"key":"data.modifiers.saveChecks.mod","mode":2,"value":2,"priority":isOrder ? -2 : 20},
                {"key":"data.modifiers.evasion.physical.mod","mode":2,"value":1,"priority":isOrder ? -2 : 20},
                {"key":"data.modifiers.evasion.special.mod","mode":2,"value":1,"priority":isOrder ? -2 : 20},
                {"key":"data.modifiers.evasion.speed.mod","mode":2,"value":1,"priority":isOrder ? -2 : 20}
            ]
        }
        case "critical": return {
            changes: [
                {"key":"data.modifiers.initiative.mod", "mode": 1,"value": 3, "priority": -1},
                {"key":"data.modifiers.capabilities.mod", "mode": 1,"value": 3, "priority": -1},
                {"key":"data.modifiers.critRange.mod", "mode": 1,"value": 3, "priority": -1},
                {"key":"data.modifiers.effectRange.mod", "mode": 1,"value": 3, "priority": -1},
                {"key":"data.modifiers.acBonus.mod", "mode": 1,"value": 3, "priority": -1},
                {"key":"data.modifiers.skillBonus.mod", "mode": 1,"value": 3, "priority": -1},
                {"key":"data.modifiers.saveChecks.mod", "mode": 1,"value": 3, "priority": -1},
                {"key":"data.modifiers.evasion.physical.mod", "mode": 1,"value": 3, "priority": -1},
                {"key":"data.modifiers.evasion.special.mod", "mode": 1,"value": 3, "priority": -1},
                {"key":"data.modifiers.evasion.speed.mod", "mode": 1,"value": 3, "priority": -1}
            ]
        }
        default: return;
    }
}

export const HardenedChanges = {
    0: [
        {"key":"data.modifiers.hardened", "mode": 5, "value": true, "priority": 50}
    ],
    1: [
        {"key":"data.modifiers.critRange.mod", "mode":2, "value":1, "priority": 20},
        {"key":"data.modifiers.effectRange.mod", "mode":2, "value":1, "priority": 20}
    ],
    3: [
        {"key":"data.modifiers.initiative.mod", "mode":2, "value":5, "priority": 20},
        {"key":"data.modifiers.evasion.physical.mod", "mode":2, "value":1, "priority": 20},
        {"key":"data.modifiers.evasion.special.mod", "mode":2, "value":1, "priority": 20},
        {"key":"data.modifiers.evasion.speed.mod", "mode":2, "value":1, "priority": 20}
    ],
    5: [
        {"key":"data.modifiers.damageReduction.physical.mod", "mode":2, "value":5, "priority": 20},
        {"key":"data.modifiers.damageReduction.special.mod", "mode":2, "value":5, "priority": 20},
    ],
    7: [
        {"key":"data.modifiers.immuneToEffectDamage", "mode":5, "value":true, "priority": 50},
    ],
    9: [
        {"key":"data.modifiers.resistanceSteps.mod", "mode":2, "value":1, "priority": 20},
    ]
}