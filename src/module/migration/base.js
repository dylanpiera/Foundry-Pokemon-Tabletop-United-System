/**
 * This is the base class for a migration.
 * If you make a change to the database schema (i.e. anything in template.json),
 * you should create a migration. To do so, there are several steps:
 * - Bump the schema number in system.json
 * - Make a class that inherits this base class and implements `updateActor` or `updateItem` using the
 *   new value of the schema number as the version
 * - Add this class to getAllMigrations() in src/module/migrations/index.js
 * @abstract
 */
class MigrationBase {
    /**
     * This is the schema version. Make sure it matches the new version in system.json
     * @type {number}
     * @readonly
     */
    static version;

    version = this.constructor.version;

    /**
     * Setting requiresFlush to true will indicate that the migration runner should not call any more
     * migrations after this in a batch. Use this if you are adding items to actors for instance.
     */
    requiresFlush = false;

    /**
     * Update the actor to the latest schema version.
     * @param {PTUActor} source This should be effectively a `ActorSource` from the previous version.
     */
    async updateActor(source) {}

    /**
     * Update the item to the latest schema version, handling changes that must happen before any other migration in a
     * given list.
     * @param {PTUItem} source Item to update. This should be an `ItemData` from the previous version
     * @param {PTUActor?} actorSource If the item is part of an actor, this is set to the actor source
     */
    async preUpdateItem(source, actorSource) {}

    /**
     * Update the item to the latest schema version.
     * @param {PTUItem} source Item to update. This should be an `ItemData` from the previous version.
     * @param {PTUActor?} actorSource If the item is part of an actor, this is set to the actor. For instance
     */
    async updateItem(source, actorSource) {}

    /**
     * Update the macro to the latest schema version.
     * @param source Macro data to update. This should be a `JournelEntryData` from the previous version.
     */
    async updateJournalEntry(source) {}

    /**
     * Update the macro to the latest schema version.
     * @param source Macro data to update. This should be a `MacroData` from the previous version.
     */
    async updateMacro(source) {}

    /**
     * Update the rollable table to the latest schema version.
     * @param source Rolltable data to update. This should be a `RollTableData` from the previous version.
     */
    async updateTable(source) {}

    /**
     * Update the token to the latest schema version.
     * @param tokenData Token data to update. This should be a `TokenData` from the previous version.
     */
    async updateToken(
        tokenData,
        actor,
        scene
    ) {}

    /**
     * Update the user to the latest schema version.
     * @param userData User's data to update. This should be a `UserData` from the previous version.
     */
    async updateUser(userData) {}

    /**
     * Run migrations for this schema version.
     * Sometimes there needs to be custom steps run during a migration. For instance, if the change
     * isn't actor or item related. This function will be called during the migration.
     */
    async migrate() {}
}

export { MigrationBase }