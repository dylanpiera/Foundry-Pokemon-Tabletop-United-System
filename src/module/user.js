export class PTUUser extends User {
    /** @override */
    prepareData() {
        super.prepareData();
        if (canvas.ready && canvas.tokens.controlled.length > 0) {
            game.ptu.tokenPanel.refresh();
        }
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.flags = foundry.utils.mergeObject(
            {
                ptu: {
                    settings: {
                        showTokenPanel: true
                    }
                }
            },
            this.flags
        )
    }

    get settings() {
        return this.flags.ptu.settings;
    }

    clearTargets() {
        this.updateTokenTargets();
    }
}