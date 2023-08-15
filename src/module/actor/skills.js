class PTUSkills {
    /**
     * @param {Number} skillRank 
     * @returns {String} The skill rank's slug
     */
    static getRankSlug(skillRank) {
        switch (skillRank) {
            case 1: return game.i18n.localize("PTU.SkillPathetic");
            case 2: return game.i18n.localize("PTU.SkillUntrained");
            case 3: return game.i18n.localize("PTU.SkillNovice");
            case 4: return game.i18n.localize("PTU.SkillAdept");
            case 5: return game.i18n.localize("PTU.SkillExpert");
            case 6: return game.i18n.localize("PTU.SkillMaster");
            case 8: return game.i18n.localize("PTU.SkillVirtuoso");
            default: return game.i18n.localize("PTU.SkillInvalid");
        }
    }
}

export { PTUSkills }