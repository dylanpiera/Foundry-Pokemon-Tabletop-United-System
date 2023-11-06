/**
 * @typedef {import('../../actor/base').PTUActor} PTUActor
 * @typedef {import('../../item/base').PTUItem} PTUItem
 * @typedef {import('../../actor/modifiers').PTUModifier} PTUModifier
 */

/**
 * @typedef {Object} StatisticData
 * @property {string} slug
 * @property {string} label
 * @property {StatisticCheckData} check
 * @property {StatisticDifficultyClassData} dc
 * @property {string[]?} domains
 * @property {PTUModifier[]?} modifiers
 * @property {ModifierFilter?} filter
 * @property {string[]?} rollOptions
 */

/**
 * @callback ModifierFilter
 * @param {PTUModifier}
 * @returns {boolean}
 */

/**
 * @typedef {Object} StatisticCheckData
 * @property {string} type
 * @property {string?} label
 * @property {string[]?} domains Additional domains for fetching actor roll options
 * @property {PTUModifier[]?} modifiers Modifiers not retrieved from the actor's synthetics record
 */

/**
 * @typedef {Object} StatisticDifficultyClassData
 * @property {number?} base
 * @property {string?} label
 * @property {string[]?} domains Additional domains for fetching actor roll options
 * @property {PTUModifier[]?} modifiers Modifiers not retrieved from the actor's synthetics record
 */

/**
 * @typedef {Object} RollOptionsParameters
 * @property {string[]?} extraRollOptions
 * @property {PTUItem | null} item
 * @property {PTUActor | null} origin
 * @property {PTUActor | null} target
 * */