class Enricher {
    /**
     * Convert text of the form @UUID[uuid]{name} to anchor elements.
     * @param {Text[]} text                          The existing text content
     * @param {EnrichmentOptions} [options]          Options provided to customize text enrichment
     * @param {boolean} [options.async]              Whether to resolve UUIDs asynchronously
     * @param {ClientDocument} [options.relativeTo]  A document to resolve relative UUIDs against.
     * @returns {Promise<boolean>|boolean}           Whether any content links were replaced and the text nodes need to be
     *                                               updated.
     * @protected
     */
    static enrichContentLinks(text, { async, relativeTo } = {async: true}) {
        const documentTypes = CONST.DOCUMENT_LINK_TYPES.concat(["Compendium", "UUID"]);
        const rgx = new RegExp(`@(${documentTypes.join("|")})\\[([^#\\]]+)(?:#([^\\]]+))?](?:{([^}]+)})?`, "g");
        return this.#replaceTextContent(Array.isArray(text) ? text : [text], rgx, match => this.#createContentLink(match, { async, relativeTo }));
    }

    /**
     * Create a dynamic document link from a regular expression match
     * @param {RegExpMatchArray} match                          The regular expression match
     * @param {object} [options]                                Additional options to configure enrichment behaviour
     * @param {boolean} [options.async=false]                   If asynchronous evaluation is enabled, fromUuid will be
     *                                                          called, allowing comprehensive UUID lookup, otherwise
     *                                                          fromUuidSync will be used.
     * @param {ClientDocument} [options.relativeTo]             A document to resolve relative UUIDs against.
     * @returns {HTMLAnchorElement|Promise<HTMLAnchorElement>}  An HTML element for the document link, returned as a
     *                                                          Promise if async was true and the message contained a
     *                                                          UUID link.
     * @protected
     */
    static #createContentLink(match, { async = false, relativeTo } = {}) {
        let [type, target, hash, name] = match.slice(1, 5);

        // Prepare replacement data
        const data = {
            cls: ["content-link"],
            icon: null,
            dataset: {},
            name
        };

        let doc;
        let broken = false;
        if (type === "UUID") {
            data.dataset = { id: null, uuid: target };
            if (async) doc = fromUuid(target, relativeTo);
            else {
                try {
                    doc = fromUuidSync(target, relativeTo);
                } catch (err) {
                    [type, ...target] = target.split(".");
                    broken = TextEditor._createLegacyContentLink(type, target.join("."), name, data);
                }
            }
        }
        else broken = TextEditor._createLegacyContentLink(type, target, name, data);

        // Flag a link as broken
        if (broken) {
            data.icon = "fas fa-unlink";
            data.cls.push("broken");
        }

        const constructAnchor = doc => {
            if (doc) {
                if (doc.documentName) {
                    const attrs = { draggable: true };
                    if (hash) attrs["data-hash"] = hash;
                    return doc.toAnchor({ attrs, classes: data.cls, name: data.name });
                }
                data.name = data.name || doc.name || target;
                const type = game.packs.get(doc.pack)?.documentName;
                data.dataset.type = type;
                data.dataset.id = doc._id;
                data.dataset.pack = doc.pack;
                if (hash) data.dataset.hash = hash;
                data.icon = CONFIG[type].sidebarIcon;
            } else if (type === "UUID") {
                // The UUID lookup failed so this is a broken link.
                data.icon = "fas fa-unlink";
                data.cls.push("broken");
            }

            const a = document.createElement("a");
            a.classList.add(...data.cls);
            a.draggable = true;
            for (let [k, v] of Object.entries(data.dataset)) {
                a.dataset[k] = v;
            }
            a.innerHTML = `<i class="${data.icon}"></i>${data.name}`;
            return a;
        };

        if (doc instanceof Promise) return doc.then(constructAnchor);
        return constructAnchor(doc);
    }

    /**
     * Facilitate the replacement of text node content using a matching regex rule and a provided replacement function.
     * @param {Text} text             The target text to replace
     * @param {RegExp} rgx            The provided regular expression for matching and replacement
     * @param {function(RegExpMatchArray): HTMLElement|Promise<HTMLElement>} func   The replacement function
     * @private
     */
    static #replaceTextContent(text, rgx, func) {
        let replaced = false;
        const promises = [];
        for (let t of text) {
            const matches = t.textContent.matchAll(rgx);
            for (let match of Array.from(matches).reverse()) {
                let result = func(match);
                // TODO: This logic can be simplified/replaced entirely with await once enrichHTML becomes fully async.
                // We can't mix promises and non-promises.
                if (promises.length && !(result instanceof Promise)) result = Promise.resolve(result);
                if (result instanceof Promise) promises.push(result.then(r => [t, match, r]));
                else if (result) {
                    this.#replaceTextNode(t, match, result);
                    replaced = true;
                }
            }
        }
        if (promises.length) {
            return Promise.all(promises).then(results => results.reduce((replaced, [text, match, result]) => {
                if (!result) return replaced;
                this.#replaceTextNode(text, match, result);
                return true;
            }, replaced));
        }
        return replaced;
    }

    /**
     * Replace a matched portion of a Text node with a replacement Node
     * @param {Text} text
     * @param {RegExpMatchArray} match
     * @param {Node} replacement
     * @private
     */
    static #replaceTextNode(text, match, replacement) {
        let target = text;
        if (match.index > 0) {
            target = text.splitText(match.index);
        }
        if (match[0].length < target.length) {
            target.splitText(match[0].length);
        }
        target.replaceWith(replacement);
    }


}

export { Enricher }