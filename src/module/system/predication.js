class PTUPredicate extends Array {
    constructor(...args) {
        if(Array.isArray(args[0])) {
            super(...args[0]);
        }
        else {
            super(...args);
        }
        this.isValid = PTUPredicate.isValid(this);
    }

    static isValid(predicate) {
        return this.isArray(predicate);
    }

    /** @override */
    static isArray(predicate) {
        return super.isArray(predicate) && predicate.every((s) => StatementValidator.isStatement(s));
    }

    static test(predicate, options) {
        return predicate instanceof PTUPredicate 
            ? predicate.test(options)
            : new PTUPredicate(predicate).test(options);
    }

    test(options = []) {
        if(this.length === 0) return true;
        if(!this.isValid) {
            console.error("PTU | Invalid predicate", this);
            return false;
        }

        return this.every((s) => this._isTrue(s, options instanceof Set ? options : new Set(options)));
    }

    toObject() {
        return deepClone([...this]);
    }

    clone() {
        return new PTUPredicate(this.toObject());
    }

    _isTrue(statement, domain) {
        return (
            (typeof statement === "string" && domain.has(statement)) ||
            (StatementValidator.isBinaryOp(statement) && this._testBinaryOp(statement, domain)) ||
            (StatementValidator.isCompound(statement) && this._testCompound(statement, domain)) 
        )
    }

    _testBinaryOp(statement, domain) {
        if("eq" in statement) {
            return domain.has(`${statement.eq[0]}:${statement.eq[1]}`) || statement.eq[0] == statement.eq[1];
        }
        const operator = Object.keys(statement)[0];

        const [left, right] = Object.values(statement)[0];
        const domainArray = Array.from(domain);
        const getValues = (operand) => {
            const number = Number(operand);
            if(!isNaN(number)) return [number];
            const pattern = new RegExp(String.raw`^${operand}:(^:]+)$`);
            return domainArray.map((s) => Number(pattern.exec(s)?.[1] || NaN)).filter((v) => !isNaN(v));
        }
        const leftValues = getValues(left);
        const rightValues = getValues(right);

        switch(operator) {
            case "gt": return leftValues.some((l) => rightValues.some((r) => l > r));
            case "gte": return leftValues.some((l) => rightValues.some((r) => l >= r));
            case "lt": return leftValues.some((l) => rightValues.some((r) => l < r));
            case "lte": return leftValues.some((l) => rightValues.some((r) => l <= r));
            default:
                console.warn("PTU | Invalid binary operator", operator);
                return false;
        }
    }

    _testCompound(statement, domain) {
        return (
            ("and" in statement && statement.and.every((s) => this._isTrue(s, domain))) ||
            ("nand" in statement && statement.nand.every((s) => this._isTrue(s, domain))) ||
            ("or" in statement && statement.or.some((s) => this._isTrue(s, domain))) ||
            ("nor" in statement && statement.nor.some((s) => this._isTrue(s, domain))) ||
            ("not" in statement && !this._isTrue(statement.not, domain)) ||
            ("if" in statement && !(this._isTrue(statement.if, domain) && !this._isTrue(statement.then, domain)))
        );
    }
}

class StatementValidator {
    static isStatement(statement) {
        return statement instanceof Object
            ? this.isCompound(statement) || this.isBinaryOp(statement)
            : typeof statement === "string"
            ? this.isAtomic(statement)
            : false;
    }

    static isAtomic(statement) {
        return typeof statement === "string" && statement.length > 0 || this.isBinaryOp(statement);
    }

    static get binaryOperators() {
        return new Set(["eq", "gt", "gte", "lt", "lte"]);
    }    

    static isBinaryOp(statement) {
        if(!(typeof statement === "object" )) return false;
        const entries = Object.entries(statement);
        if(entries.length > 1) return false;
        const [operator, operands] = entries[0];
        return (
            this.binaryOperators.has(operator) &&
            Array.isArray(operands) &&
            operands.length === 2 &&
            typeof operands[0] === "string" &&
            ["string", "number"].includes(typeof operands[1])
        );
    }

    static isCompound(statement) {
        return (
            typeof statement === "object" &&
            (
                this.isAnd(statement) ||
                this.isOr(statement) ||
                this.isNand(statement) ||
                this.isNor(statement) ||
                this.isNot(statement) ||
                this.isIf(statement)
            )
        );
    }

    static isAnd(statement) {
        return (
            Object.keys(statement).length === 1 &&
            Array.isArray(statement.and) &&
            statement.and.every((s) => this.isStatement(s))
        );
    }
    
    static isNand(statement) {
        return (
            Object.keys(statement).length === 1 &&
            Array.isArray(statement.nand) &&
            statement.nand.every((s) => this.isStatement(s))
        );
    }

    static isOr(statement) {
        return (
            Object.keys(statement).length === 1 &&
            Array.isArray(statement.or) &&
            statement.or.every((s) => this.isStatement(s))
        );
    }

    static isNor(statement) {
        return (
            Object.keys(statement).length === 1 &&
            Array.isArray(statement.nor) &&
            statement.nor.every((s) => this.isStatement(s))
        );
    }

    static isNot(statement) {
        return (
            Object.keys(statement).length === 1 && 
            !!statement.not && 
            this.isStatement(statement.not)
        );
    }

    static isIf(statement) {
        return (
            Object.keys(statement).length === 2 &&
            this.isStatement(statement.if) &&
            this.isStatement(statement.then)
        );
    }
}

export { PTUPredicate, StatementValidator }