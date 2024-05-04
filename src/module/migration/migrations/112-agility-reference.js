import { sluggify } from "../../../util/misc.js";
import { MigrationBase } from "../base.js";

export class Migration112AgilityReference extends MigrationBase {
    static version = 0.112;

    /**
     * @type {MigrationBase['updateItem']} 
     */
    async updateItem(item, actor) {
        if (item.type !== "species") return;

        for (const type of Object.keys(item.system.moves)) {
            for (const move of item.system.moves[type]) {
                if (move.slug === "agility") { move.uuid = "Compendium.ptu.moves.Item.aS33KlxhRCP0s5Zd"; continue; }
                if (item.slug === "palafin" && move.slug === "wave-crash") { move.uuid = "Compendium.ptu.moves.Item.XNmCCgclMJf0MP6C"; continue; }
                if (item.slug === "dipplin" && move.slug === "withdraw") { move.uuid = "Compendium.ptu.moves.Item.PLNrSnH8aJCbQSAq"; continue; }
                if (item.slug === "dipplin" && move.slug === "astonish") { move.uuid = "Compendium.ptu.moves.Item.VtkRa05N67wR9RcG"; continue; }
                if (item.slug === "dipplin" && move.slug === "syrupy-bomb") { move.uuid = "Compendium.ptu.moves.Item.oKd3bholSLtezIEv"; continue; }
            }
        }
    }
}