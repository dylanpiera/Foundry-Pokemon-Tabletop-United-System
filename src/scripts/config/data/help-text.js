export const helpText = {
    "Range": (range) => `The range of the move is ${range}m.`,
    "Target": (target) => `This move can target ${target} target${target > 1 ? "s" : ""} at once.`,
    "DamageBase": (db) => `This move has a Damage Base of ${db} (${CONFIG.PTU.data.dbData[db]}).`,
    "Priority": "This move has Priority"
}