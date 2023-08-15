function registerSheets() {
    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("ptu", CONFIG.PTU.Actor.sheetClasses.character, { types: ["character"], makeDefault: true });
    Actors.registerSheet("ptu", CONFIG.PTU.Actor.sheetClasses.pokemon, { types: ["pokemon"], makeDefault: true });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("ptu", CONFIG.PTU.Item.sheetClasses.item, { types: ["item", "ability", "capability", "pokeedge", "dexentry", "condition"], makeDefault: true });
    Items.registerSheet("ptu", CONFIG.PTU.Item.sheetClasses.move, { types: ["move"], makeDefault: true });
    Items.registerSheet("ptu", CONFIG.PTU.Item.sheetClasses.edge, { types: ["edge"], makeDefault: true });
    Items.registerSheet("ptu", CONFIG.PTU.Item.sheetClasses.feat, { types: ["feat"], makeDefault: true });
    Items.registerSheet("ptu", CONFIG.PTU.Item.sheetClasses.effect, { types: ["effect"], makeDefault: true });
    Items.registerSheet("ptu", CONFIG.PTU.Item.sheetClasses.species, { types: ["species"], makeDefault: true });

    // DocumentSheetConfig.registerSheet(ActiveEffect, "core", PTUActiveEffectConfig, { makeDefault: true })
}

export { registerSheets }