import { PTUPredicate, StatementValidator } from "./predication.js";

class PredicateField extends foundry.data.fields.ArrayField {
    constructor(options = {}) {
        super(new PredicateStatementField(), {
            ...options,
            required: true,
            nullable: false,
            initial: new PTUPredicate(),
        });
    }

    /** @override */
    _cast(value) {
        return value;
    }

    /** @override */
    initialize(value, model, options = {}) {
        const statements = super.initialize(value, model, options);
        return statements ? new PTUPredicate(...statements) : statements;
    }
}

class PredicateStatementField extends foundry.data.fields.DataField {
    constructor(options = {}) {
        super({
            ...options,
            required: true,
            nullable: false,
            initial: undefined,
            validationError: "PTU | must be recognized predicate statement type",
        });
    }

    /** @override */
    _validateType(value) {
        return StatementValidator.isStatement(value);
    }

    /** @override */
    _cast(value) {
        return value;
    }

    /** @override */
    _cleanType(value) {
        return typeof value === "string" ? value.trim() : value;
    }
}

class ResolvableValueField extends foundry.data.fields.DataField {
    /** @override */
    _validateType(value) {
        return value !== null && ["string", "number", "object", "boolean"].includes(typeof value);
    }

    /** No casting is applied to this value */
    /** @override */
    _cast(value) {
        return value;
    }

    /** @override */
    _cleanType(value) {
        if (typeof value === "string") return value.trim();
        if (typeof value === "object" && Array.isArray(value.brackets)) {
            value.field ??= "actor|system.level.total";
        }

        return value;
    }
}

export { PredicateField, ResolvableValueField}