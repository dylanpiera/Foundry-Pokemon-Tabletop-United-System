/**
 * @typedef {Object} CollectionDiff
 * @property {PTUItem[]} inserted
 * @property {string[]} deleted
 * @property {PTUItem[]} updated
 */

import { MigrationBase } from "../base.js"

class MigrationRunnerBase {
    /** @type {MigrationBase[]} */
    migrations = []

    static LATEST_SCHEMA_VERSION = 0.114;
    static MINIMUM_SAFE_VERSION = 0.100;
    static RECOMMENDED_SAFE_VERSION = 0.101;

    /**
     * @param {MigrationBase[]} migrations
     **/
    constructor(migrations = []) {
        this.migrations = migrations.sort((a, b) => a.version - b.version);
    }

    /**
     * @param {number} currentVersion 
     * @returns boolean
     */
    needsMigration(currentVersion) {
        return currentVersion < this.constructor.LATEST_SCHEMA_VERSION;
    }

    /**
     * @param {PTUItem[]} orig
     * @param {PTUItem[]} updated
     * @returns {CollectionDiff}
     */
    diffCollection(orig, updated) {
        /** @type {CollectionDiff} */
        const ret = {
            inserted: [],
            deleted: [],
            updated: [],
        }

        const origSources = new Map();
        for (const source of orig) {
            origSources.set(source._id, source);
        }

        for (const source of updated) {
            const origSource = origSources.get(source._id);
            if (origSource) {
                if (JSON.stringify(origSource) !== JSON.stringify(source)) {
                    ret.updated.push(source);
                }
                origSources.delete(source._id);
            }
            else {
                ret.inserted.push(source);
            }
        }

        for (const source of origSources.values()) {
            ret.deleted.push(source._id);
        }

        return ret;
    }

    /**
     * @param {foundry.document.ActorSource} actorSource 
     * @param {MigrationBase[]} migrations 
     */
    async getUpdatedActor(actorSource, migrations) {
        const currentActor = foundry.utils.deepClone(actorSource);

        for (const migration of migrations) {
            for (const currentItem of currentActor.items) {
                await migration.preUpdateItem?.(currentItem, currentActor);
            }
        }

        for (const migration of migrations) {
            await migration.updateActor?.(currentActor);
            for (const currentItem of currentActor.items) {
                await migration.updateItem?.(currentItem, currentActor);
            }
        }

        if ("game" in globalThis) {
            const latestMigration = migrations.at(-1);
            currentActor.system.schema ??= { version: null, lastMigration: null };
            this.updateSchemaRecord(currentActor.system.schema, latestMigration);
            for (const itemSource of currentActor.items) {
                itemSource.system.schema ??= { version: null, lastMigration: null };
                this.updateSchemaRecord(itemSource.system.schema, latestMigration);
            }
        }

        return currentActor;
    }

    /**
     * @param {foundry.document.ItemSource} itemSource 
     * @param {MigrationBase[]} migrations 
     */
    async getUpdatedItem(itemSource, migrations) {
        const current = foundry.utils.deepClone(itemSource);

        for (const migration of migrations) {
            await migration.preUpdateItem?.(current);
        }

        for (const migration of migrations) {
            await migration.updateItem?.(current);
        }

        if(itemSource.type === "dexentry") return current;
        if (migrations.length > 0) this.updateSchemaRecord(current.system.schema, migrations.at(-1));
        
        return current;
    }

    /**
     * @param {foundry.documents.RollTableSource} tableSource 
     * @param {MigrationBase[]} migrations 
     */
    async getUpdatedTable(tableSource, migrations) {
        const current = foundry.utils.deepClone(tableSource);

        for (const migration of migrations) {
            try {
                await migration.updateTable?.(current);
            } catch (err) {
                console.error(err);
            }
        }

        return current;
    }

    /**
     * @param {foundry.documents.MacroSource} macroSource 
     * @param {MigrationBase[]} migrations 
     */
    async getUpdatedMacro(macroSource, migrations) {
        const current = foundry.utils.deepClone(macroSource);

        for (const migration of migrations) {
            try {
                await migration.updateMacro?.(current);
            } catch (err) {
                console.error(err);
            }
        }

        return current;
    }

    /**
     * @param {foundry.documents.JournalEntrySource} journalSource 
     * @param {MigrationBase[]} migrations 
     */
    async getUpdatedJournalEntry(journalSource, migrations) {
        const clone = foundry.utils.deepClone(journalSource);

        for (const migration of migrations) {
            try {
                await migration.updateJournalEntry?.(clone);
            } catch (err) {
                console.error(err);
            }
        }

        return clone;
    }

    /**
     * @param {TokenDocument} token 
     * @param {MigrationBase[]} migrations 
     */
    async getUpdatedToken(token, migrations) {
        const current = token.toObject();
        for (const migration of migrations) {
            await migration.updateToken?.(current, token.actor, token.scene);
        }

        return current;
    }

    /**
     * @param {foundry.documents.UserSource} userData 
     * @param {MigrationBase[]} migrations 
     */
    async getUpdatedUser(userData, migrations) {
        const current = foundry.utils.deepClone(userData);
        for (const migration of migrations) {
            try {
                await migration.updateUser?.(current);
            } catch (err) {
                console.error(err);
            }
        }

        return current;
    }

    /**
     * @param {Object} schema
     * @param {number} schema.version
     * @param {Object} schema.lastMigration 
     * @param {string} schema.lastMigration.datetime
     * @param {Object} schema.lastMigration.version
     * @param {number} schema.lastMigration.version.schema
     * @param {string?} schema.lastMigration.version.system
     * @param {string?} schema.lastMigration.version.foundry
     * @param {MigrationBase} latestMigration 
     */
    updateSchemaRecord(schema, latestMigration) {
        if (!("game" in globalThis && latestMigration)) return;

        const fromVersion = typeof schema.version === "number" ? schema.version : null;
        schema.version = latestMigration.version;
        schema.lastMigration = {
            datetime: new Date().toISOString(),
            version: {
                schema: fromVersion,
                foundry: "game" in globalThis ? game.version : undefined,
                system: "game" in globalThis ? game.system.version : undefined,
            }
        }
    }
}

export { MigrationRunnerBase }