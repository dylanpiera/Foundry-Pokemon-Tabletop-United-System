import { Progress } from "../../../util/progress.js";
import { MigrationBase } from "../base.js";
import { MigrationRunnerBase } from "./base.js"

class MigrationRunner extends MigrationRunnerBase {
    /** @override */
    needsMigration() {
        return super.needsMigration(game.settings.get("ptu", "worldSchemaVersion"));
    }

    static get LATEST_SCHEMA_VERSION() {
        return super.LATEST_SCHEMA_VERSION;
    };
    static get MINIMUM_SAFE_VERSION() {
        return super.MINIMUM_SAFE_VERSION;
    }
    static get RECOMMENDED_SAFE_VERSION() {
        return super.RECOMMENDED_SAFE_VERSION
    };

    /**
     * 
     * @param {PTUActor | PTUItem} document 
     * @param {MigrationBase[]} migrations 
     * @returns {Promise<void>}
     */
    static async ensureSchemaVersion(document, migrations) {
        if (migrations.length === 0) return;
        const currentVersion = this.LATEST_SCHEMA_VERSION;

        if ((Number(document.schemaVersion) || 0) < currentVersion) {
            const runner = new this(migrations);
            const source = document._source;
            const updated = await (async () => {
                try {
                    return "items" in source
                        ? await runner.getUpdatedActor(source, migrations)
                        : await runner.getUpdatedItem(source, migrations);
                } catch {
                    return null;
                }
            })();
            if (updated) document.updateSource(updated);
        }

        document.updateSource({ "system.schema.version": currentVersion });
        if ("items" in document && "prototypeToken" in document) {
            for (const item of document.items) {
                if (!item.schemaVersion) {
                    item.updateSource({ "system.schema.version": currentVersion });
                }
            }
        }
    }

    async #migrateDocuments(collection, migrations) {
        const DocumentClass = collection.documentClass;
        const pack = "metadata" in collection ? collection.metadata.id : null;
        const updateGroup = [];

        if(collection.contents?.length && this.progress) {
            this.progress.steps = collection.contents.length;
            this.progress.counter = -1;
            this.progress.advance(game.i18n.format("PTU.Migrations.Progress.Progress", {phase: this.progress.phase, phases: this.progress.phases}));
        }

        for (const document of collection.contents) {
            this.progress?.advance(game.i18n.format("PTU.Migrations.Progress.Progress", {phase: this.progress?.phase, phases: this.progress?.phases}));
            if (updateGroup.length === 50) {
                try {
                    await DocumentClass.updateDocuments(updateGroup, { noHook: true, pack })
                } catch (error) {
                    console.warn(error);
                } finally {
                    updateGroup.length = 0;
                }
            }
            const updated =
                "items" in document
                    ? await this.#migrateActor(migrations, document, { pack })
                    : await this.#migrateItem(migrations, document, { pack });
            if (updated) updateGroup.push(updated);
        }
        if (updateGroup.length > 0) {
            try {
                await DocumentClass.updateDocuments(updateGroup, { noHook: true, pack })
            } catch (error) {
                console.warn(error);
            }
        }
    }

    /**
     * @param {MigrationBase[]} migrations 
     * @param {PTUActor} actor 
     * @param {Object} options
     * @param {string} options.pack
     */
    async #migrateActor(migrations, actor, options = {}) {
        const { pack } = options;
        const baseActor = actor.toObject();
        const updatedActor = await (async () => {
            try {
                return await this.getUpdatedActor(baseActor, migrations);
            } catch (error) {
                if (error instanceof Error)
                    console.error(`Error thrown while migrating actor ${actor.uuid}`, error);
                return null;
            }
        })();
        if (!updatedActor) return null;

        const baseItems = [...baseActor.items];
        const baseAEs = [...baseActor.effects];
        const updatedItems = [...updatedActor.items];
        const updatedAEs = [...updatedActor.effects];

        const itemDiff = this.diffCollection(baseItems, updatedItems);
        if (itemDiff.deleted.length > 0) {
            try {
                const finalDeleted = itemDiff.deleted.filter(id => actor.items.some(item => item.id == id));
                await actor.deleteEmbeddedDocuments("Item", finalDeleted, { noHook: true, pack });
            } catch (error) {
                console.warn(error);
            }
        }

        const aeDiff = this.diffCollection(baseAEs, updatedAEs);
        if (aeDiff.deleted.length > 0) {
            try {
                const finalDeleted = aeDiff.deleted.filter((deletedId) =>
                    actor.effects.some((effect) => effect.id === deletedId)
                );
                await actor.deleteEmbeddedDocuments("ActiveEffect", finalDeleted, { noHook: true, pack });
            } catch (error) {
                console.warn(error);
            }
        }

        if (itemDiff.inserted.length > 0) {
            try {
                await actor.createEmbeddedDocuments("Item", itemDiff.inserted, { noHook: true, pack });
            } catch (error) {
                console.warn(error)
            }
        }

        updatedActor.items = actor.isToken ? updatedItems : itemDiff.updated;
        return updatedActor;
    }

    /**
     * @param {MigrationBase[]} migrations 
     * @param {PTUItem} item 
     * @param {Object} options
     * @param {string} options.pack
     */
    async #migrateItem(migrations, item, options = {}) {
        const { pack } = options;
        const baseItem = item.toObject();
        const updatedItem = await (() => {
            try {
                return this.getUpdatedItem(baseItem, migrations);
            } catch (error) {
                if (error instanceof Error) {
                    console.error(`Error thrown while migrating ${item.uuid}: ${error.message}`);
                }
                return null;
            }
        })();
        if (!updatedItem) return null;

        return updatedItem;
    }

    /**
     * @param {MigrationBase[]} migrations 
     * @param {JournalEntry} journalEntry 
     * @param {Object} options
     * @param {string} options.pack
     */
    async #migrateWorldJournalEntry(journalEntry, migrations) {
        if (!migrations.some((migration) => !!migration.updateJournalEntry)) return;

        try {
            const updated = await this.getUpdatedJournalEntry(journalEntry.toObject(), migrations);
            const changes = foundry.utils.diffObject(journalEntry.toObject(), updated);
            if (Object.keys(changes).length > 0) {
                await journalEntry.update(changes, { noHook: true });
            }
        } catch (error) {
            console.warn(error);
        }
    }

    /**
     * @param {MigrationBase[]} migrations 
     * @param {Macro} macro 
     * @param {Object} options
     * @param {string} options.pack
     */
    async #migrateWorldMacro(macro, migrations) {
        if (!migrations.some((migration) => !!migration.updateMacro)) return;

        try {
            const updatedMacro = await this.getUpdatedMacro(macro.toObject(), migrations);
            const changes = foundry.utils.diffObject(macro.toObject(), updatedMacro);
            if (Object.keys(changes).length > 0) {
                await macro.update(changes, { noHook: true });
            }
        } catch (error) {
            console.warn(error);
        }
    }

    /**
     * @param {MigrationBase[]} migrations 
     * @param {RollTable} table 
     * @param {Object} options
     * @param {string} options.pack
     */
    async #migrateWorldTable(table, migrations) {
        if (!migrations.some((migration) => !!migration.updateTable)) return;

        try {
            const updatedMacro = await this.getUpdatedTable(table.toObject(), migrations);
            const changes = foundry.utils.diffObject(table.toObject(), updatedMacro);
            if (Object.keys(changes).length > 0) {
                table.update(changes, { noHook: true });
            }
        } catch (error) {
            console.warn(error);
        }
    }

    /**
     * @param {MigrationBase[]} migrations 
     * @param {TokenDocument} token 
     * @param {Object} options
     * @param {string} options.pack
     */
    async #migrateSceneToken(token, migrations) {
        if (!migrations.some((migration) => !!migration.updateToken)) return token.toObject();

        try {
            const updatedToken = await this.getUpdatedToken(token, migrations);
            const changes = foundry.utils.diffObject(token.toObject(), updatedToken);

            if (Object.keys(changes).length > 0) {
                try {
                    await token.update(changes, { noHook: true });
                } catch (error) {
                    console.warn(error);
                }
            }
            return updatedToken;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    /**
     * @param {MigrationBase[]} migrations 
     * @param {User} user 
     * @param {Object} options
     * @param {string} options.pack
     */
    async #migrateUser(user, migrations) {
        if (!migrations.some((migration) => !!migration.updateUser)) return;

        try {
            const baseUser = user.toObject();
            const updatedUser = await this.getUpdatedUser(baseUser, migrations);
            const changes = foundry.utils.diffObject(user.toObject(), updatedUser);
            if (Object.keys(changes).length > 0) {
                await user.update(changes, { noHook: true });
            }
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * @param {CompendiumCollection} compendium 
     */
    async runCompendiumMigration(compendium) {
        ui.notifications.info(game.i18n.format("PTU.Migrations.Starting", { version: game.system.version }), {
            permanent: true,
        });

        const documents = await compendium.getDocuments();
        const lowestSchemaVersion = Math.min(
            MigrationRunner.LATEST_SCHEMA_VERSION,
            ...documents.map((d) => d.system.schema.version === null ? MigrationRunner.MINIMUM_SAFE_VERSION : d.system.schema.version ).filter((d) => !!d)
        );

        const migrations = this.migrations.filter((migration) => migration.version > lowestSchemaVersion);
        await this.#migrateDocuments(compendium, migrations);

        ui.notifications.info(game.i18n.format("PTU.Migrations.Finished", { version: game.system.version }), {
            permanent: true,
        });
    }

    /**
     * @param {MigrationBase[]} migrations 
     */
    async runMigrations(migrations) {
        if (migrations.length === 0) return;

        // Migrate World Actors
        await this.#migrateDocuments(game.actors, migrations);

        // Migrate World Items
        await this.#migrateDocuments(game.items, migrations);

        // Migrate world journal entries
        for (const entry of game.journal) {
            await this.#migrateWorldJournalEntry(entry, migrations);
        }

        const promises = [];
        // Migrate World Macros
        for (const macro of game.macros) {
            promises.push(this.#migrateWorldMacro(macro, migrations));
        }

        // Migrate World RollTables
        for (const table of game.tables) {
            promises.push(this.#migrateWorldTable(table, migrations));
        }

        for (const user of game.users) {
            promises.push(this.#migrateUser(user, migrations));
        }

        // call the free-form migration function. can really do anything
        for (const migration of migrations) {
            if (migration.migrate) promises.push(migration.migrate());
        }

        // Then we should wait for the promises to complete before updating the tokens
        // because the unlinked tokens might not need to be updated anymore since they
        // base their data on global actors
        await Promise.allSettled(promises);

        // Migrate tokens and synthetic actors
        for (const scene of game.scenes) {
            for (const token of scene.tokens) {
                const { actor } = token;
                if (!actor) continue;

                const wasSuccessful = !!(await this.#migrateSceneToken(token, migrations));
                if (!wasSuccessful) continue;

                // Only migrate if the synthetic actor has replaced migratable data
                const hasMigratableData =
                    token._source.delta && (
                        !!token._source.delta.flags?.ptu ||
                        Object.keys(token._source.delta).some((k) => ["items", "system"].includes(k))
                    );

                if (actor.isToken && hasMigratableData) {
                    const updated = await this.#migrateActor(migrations, actor);
                    if (updated) {
                        try {
                            await actor.update(updated);
                        } catch (error) {
                            console.warn(error);
                        }
                    }
                }
            }
        }
    }

    async runMigration(force = false) {
        const schemaVersion = {
            latest: MigrationRunner.LATEST_SCHEMA_VERSION,
            current: game.settings.get("ptu", "worldSchemaVersion"),
        };
        const systemVersion = game.system.version;

        ui.notifications.info(game.i18n.format("PTU.Migrations.Starting", { version: systemVersion }), {
            permanent: true,
        });

        const migrationsToRun = force
            ? this.migrations
            : this.migrations.filter((x) => schemaVersion.current < x.version);

        // We need to break the migration into phases sometimes.
        // for instance, if a migration creates an item, we need to push that to
        // the foundry backend in order to get an id for the item.
        // This way if a later migration depends on the item actually being created,
        // it will work.
        const migrationPhases = [[]];
        for (const migration of migrationsToRun) {
            migrationPhases[migrationPhases.length - 1].push(migration);
            if (migration.requiresFlush) {
                migrationPhases.push([]);
            }
        }

        const progress = this.progress = new Progress({steps: migrationPhases.length});
        progress.phases = migrationPhases.length;
        progress.phase = 0;
        progress.advance(game.i18n.localize("PTU.Migrations.Progress.Starting"))
        for (const migrationPhase of migrationPhases) {
            if (migrationPhase.length > 0) {
                await this.runMigrations(migrationPhase);
                progress.phase++;
            }
        }
        progress.close(game.i18n.localize("PTU.Migrations.Progress.Completed"));

        await game.settings.set("ptu", "worldSchemaVersion", schemaVersion.latest);
    }
}

export { MigrationRunner }