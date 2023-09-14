import { RuleElementPTU, isBracketedValue } from "./base.js";

export class TokenImageRuleElement extends RuleElementPTU {
    constructor(data, item, options = {}) {
        const { value, scale, tint, alpha } = data;
        super(data, item, options);

        if (typeof value === "string" || isBracketedValue(value)) {
            this.value = value;
        } else {
            this.value = null;
        }

        if (typeof scale === "number" && scale > 0) {
            this.scale = scale;
        }

        if (typeof tint === "string") {
            this.tint = Color.from(tint).toString();
        }

        if (typeof alpha === "number") {
            this.alpha = alpha;
        }
    }

    /** @override */
    afterPrepareData() {
        let src = this.value;
        if (!this.#srcIsValid(src)) src = this.resolveValue(this.value);

        if (!this.test()) return;

        const texture = {};
        if (this.#srcIsValid(src)) {
            texture.src = src;
        }
        if (this.scale) {
            texture.scaleX = this.scale;
            texture.scaleY = this.scale;
        }

        if (this.tint) {
            texture.tint = this.tint;
        }

        if (typeof this.alpha === "number") {
            this.actor.synthetics.tokenOverrides.alpha = this.alpha;
        }

        this.actor.synthetics.tokenOverrides.texture = texture;
    }

    #srcIsValid(src) {
        if (typeof src !== "string") return false;
        const extension = /(?<=\.)([a-z0-9]{3,4})(\?[a-zA-Z0-9]+)?$/i.exec(src)?.at(1);
        return !!extension && (extension in CONST.IMAGE_FILE_EXTENSIONS || extension in CONST.VIDEO_FILE_EXTENSIONS);
    }
}