const automation = {
  timing: {
    beforeRoll: "beforeRoll",
    afterRoll: "afterRoll",
    beforeDamage: "beforeDamage",
    afterDamage: "afterDamage",
  },
  target: {
    target: "target",
    move: "move",
    hit: "hit",
    item: "item",
  },
  condition: {
    attackRoll: "attackRoll",
    effectiveness: "effectiveness",
    itemType: "itemType",
    moveType: "moveType",
  },
  rangeIncreases: {
    none: "none",
    effectRange: "effectRange",
  },
  effect: {
    addDamage: "addDamage",
    applyEffect: "applyEffect",
    removeEffect: "removeEffect",
    addEffectiveness: "addEffectiveness",
  },
  modifiers: {
    damage: "damage",
    effectiveness: "effectiveness",
  },
  operators: {
    equals: "==",
    notEquals: "!=",
    greaterThan: ">",
    lessThan: "<",
    greaterThanOrEqual: ">=",
    lessThanOrEqual: "<=",
  },
};

export {automation}