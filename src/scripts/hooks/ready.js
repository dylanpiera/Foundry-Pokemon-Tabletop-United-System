import { MigrationSummary } from "../../module/apps/migration-summary.js";
import { MigrationList } from "../../module/migration/index.js";
import { MigrationRunner } from "../../module/migration/runner/index.js";
import { GamePTU } from "../game-ptu.js"

export const Ready = {
    listen() {
        Hooks.once("ready", () => {
            /** Once the entire VTT framework is initialized, check to see if data migration needs to be performed */
            console.log("PTU System | Starting Pokemon Tabletop Reunited System")

            // Determine if system migration is required and feasible
            const currentVersion = game.settings.get("ptu", "worldSchemaVersion");

            // Save the current world schema version if hasn't before.
            storeInitialWorldVersions().then(async () => {
                // User#isGM is inclusive of both gamemasters and assistant gamemasters, so check for the specific role
                if (!game.user.hasRole(CONST.USER_ROLES.GAMEMASTER)) return;

                // Perform migrations, if any
                const migrationRunner = new MigrationRunner(MigrationList.constructFromVersion(currentVersion));
                if (migrationRunner.needsMigration()) {
                    if (currentVersion && currentVersion < MigrationRunner.MINIMUM_SAFE_VERSION) {
                        ui.notifications.error(
                            `Your PTU system data is from too old a Foundry version and cannot be reliably migrated to the latest version. The process will be attempted, but errors may occur.`,
                            { permanent: true }
                        );
                    }
                    await migrationRunner.runMigration();
                    new MigrationSummary().render(true);
                }

                // Update the world system version
                const previous = game.settings.get("ptu", "worldSystemVersion");
                const current = game.system.version;
                if (foundry.utils.isNewerVersion(current, previous)) {
                    await game.settings.set("ptu", "worldSystemVersion", current);
                }
            });

            GamePTU.onReady();
        })
    }
}

/** Store the world system and schema versions for the first time */
async function storeInitialWorldVersions() {
    if (!game.user.hasRole(CONST.USER_ROLES.GAMEMASTER)) return;

    const storedSystemVersion = game.settings.storage.get("world").getItem("ptu.worldSystemVersion");
    if (!storedSystemVersion) {
        await game.settings.set("ptu", "worldSystemVersion", game.system.version);
    }

    const storedSchemaVersion = game.settings.storage.get("world").getItem("ptu.worldSchemaVersion");
    if (!storedSchemaVersion) {
        const minimumVersion = MigrationRunner.MINIMUM_SAFE_VERSION;
        const currentVersion =
            game.actors.size === 0
                ? game.settings.get("ptu", "worldSchemaVersion")
                : Math.max(
                      Math.min(...new Set(game.actors.map((actor) => actor.schemaVersion ?? minimumVersion))),
                      minimumVersion
                  );
        await game.settings.set("ptu", "worldSchemaVersion", currentVersion);
    }
}
