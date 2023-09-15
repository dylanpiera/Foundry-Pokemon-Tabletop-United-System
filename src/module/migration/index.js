import * as Migrations from './migrations/index.js';
import { MigrationBase } from './base.js';
import { MigrationRunner } from './runner/index.js';

class MigrationList {
    static #list = Object.values(Migrations);

    static get latestVersion() {
        return Math.max(...this.#list.map(M => M.version));
    }

    /**
     * @returns {MigrationBase[]}
     */
    static constructAll() {
        return this.#list.map(M => new M());
    }

    /**
     * @param {number} version 
     * @returns {MigrationBase[]}
     */
    static constructFromVersion(version) {
        const minVersion = Number(version) || MigrationRunner.RECOMMENDED_SAFE_VERSION;
        return this.#list.filter((M) => M.version > minVersion).map((M) => new M());
    }

    /**
     * @param {number} min 
     * @param {number} max 
     * @returns {MigrationBase[]}
     */
    static constructRange(min, max = Infinity) {
        return this.#list.filter((M) => M.version >= min && M.version <= max).map((M) => new M());
    }
}

export { MigrationList }