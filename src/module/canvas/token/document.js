class PTUTokenDocument extends TokenDocument {
    get scene() {
        return this.parent;
    }

    /** @override */
    prepareDerivedData() {
        super.prepareDerivedData();
        if(!(this.actor && this.scene)) return;

        let changedScale = false;

        const { tokenOverrides } = this.actor.synthetics;
        this.name = tokenOverrides.name || this.name;
        
        if(tokenOverrides.texture) {
            this.texture.src = tokenOverrides.texture.src || this.texture.src;
            if("scaleX" in tokenOverrides.texture) {
                this.texture.scaleX = tokenOverrides.texture.scaleX;
                this.texture.scaleY = tokenOverrides.texture.scaleY;
                changedScale = true;
            }
            this.texture.tint = tokenOverrides.texture.tint || this.texture.tint;
        }

        this.alpha = tokenOverrides.alpha || this.alpha;

        if(tokenOverrides.light) {
            this.light = new foundry.data.LightData(tokenOverrides.light, {parent: this});
        }

        PTUTokenDocument.prepareSize(this, this.actor, changedScale);
    }

    static prepareSize(tokenDocument, actor, overriden = false) {
        const {width, height} = ((sizeClass) => {;
            switch (sizeClass) {
                case "Small": return { width: 1, height: 1 };
                case "Medium": return { width: 1, height: 1 };
                case "Large": return { width: 2, height: 2 };
                case "Huge": return { width: 3, height: 3 };
                case "Gigantic": return { width: 4, height: 4 };
                default: return { width: 1, height: 1 };
            }
        })(actor.sizeClass);

        tokenDocument.width = width;
        tokenDocument.height = height;

        //TODO: Add setting
        if(true && !overriden && tokenDocument.flags?.ptu?.autoscale !== false) {
            const absoluteScale = actor.sizeClass === "Small" ? 0.6 : 1;
            const mirrorX = tokenDocument.texture.scaleX < 0 ? -1 : 1;
            const mirrorY = tokenDocument.texture.scaleY < 0 ? -1 : 1;
            tokenDocument.texture.scaleX = absoluteScale * mirrorX;
            tokenDocument.texture.scaleY = absoluteScale * mirrorY;
        }
    }

    /** Re-render token placeable if REs have ephemerally changed any visuals of this token */
    onActorEmbeddedItemChange() {
        if (!(this.isLinked && this.rendered && this.object?.visible)) return;

        this.object.drawEffects().then(() => {
            const preUpdate = this.toObject(false);
            this.reset();
            const postUpdate = this.toObject(false);
            const changes = diffObject(preUpdate, postUpdate);

            if(Object.keys(changes).length > 0) {
                this._onUpdate(changes, {}, game.user.id);
            }

            if(this.combatant?.parent.active) ui.combat.render();
        })
        this.object.drawBars();
    }
}

export { PTUTokenDocument }