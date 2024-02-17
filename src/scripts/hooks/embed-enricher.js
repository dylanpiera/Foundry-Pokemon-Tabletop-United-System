export const V11EmbedCompatability = {
    listen: () => {
        // V11 - V12 compatability
        if (TextEditor._enrichEmbeds === undefined) {
            Hooks.on('setup', () => {
                CONFIG.TextEditor.enrichers.push({
                    pattern: /@Embed\[(?<config>[^\]]+)](?:{(?<label>[^}]+)})?/gi,
                    enricher: async (match, options) => {
                        options._embedDepth ??= 0;
                        if (options._embedDepth > CONST.TEXT_ENRICH_EMBED_MAX_DEPTH) {
                            console.warn(`Nested Document embedding is restricted to a maximum depth of ${CONST.TEXT_ENRICH_EMBED_MAX_DEPTH}.`
                                + ` ${match.input} cannot be fully enriched.`);
                            return null;
                        }

                        const parseEmbedConfig = (raw) => {
                            const config = { values: [] };
                            for (const part of raw.match(/(?:[^\s"]+|"[^"]*")+/g)) {
                                if (!part) continue;
                                const [key, value] = part.split("=");
                                const valueLower = value?.toLowerCase();
                                if (value === undefined) config.values.push(key.replace(/(^"|"$)/g, ""));
                                else if ((valueLower === "true") || (valueLower === "false")) config[key] = valueLower === "true";
                                else if (Number.isNumeric(value)) config[key] = Number(value);
                                else config[key] = value.replace(/(^"|"$)/g, "");
                            }

                            // Handle default embed configuration options.
                            if (!("cite" in config)) config.cite = true;
                            if (!("caption" in config)) config.caption = true;
                            if (!("inline" in config)) {
                                const idx = config.values.indexOf("inline");
                                if (idx > -1) {
                                    config.inline = true;
                                    config.values.splice(idx, 1);
                                }
                            }
                            if (!config.uuid) {
                                for (const [i, value] of config.values.entries()) {
                                    try {
                                        const parsed = foundry.utils.parseUuid(value);
                                        if (parsed?.documentId) {
                                            config.uuid = value;
                                            config.values.splice(i, 1);
                                            break;
                                        }
                                    } catch { }
                                }
                            }
                            return config;
                        }

                        const { label } = match.groups;
                        const config = parseEmbedConfig(match.groups.config);
                        const doc = await fromUuid(config.uuid, { relative: options.relativeTo });
                        if (!doc) return null;

                        const buildEmbedHTML = async (text, config, options) => {
                            options = { ...options, _embedDepth: options._embedDepth + 1, relativeTo: options.relativeTo };
                            const enrichedPage = await TextEditor.enrichHTML(text, options);
                            const container = document.createElement("div");
                            container.innerHTML = enrichedPage;
                            return container.children;
                        };

                        const createInlineEmbed = async (content, config, options) => {
                            const section = document.createElement("section");
                            if (content instanceof HTMLCollection) section.append(...content);
                            else section.append(content);
                            return section;
                        }

                        const createFigureEmbed = async (content, { cite, caption, label }, options) => {
                            const figure = document.createElement("figure");
                            if (content instanceof HTMLCollection) figure.append(...content);
                            else figure.append(content);
                            if (cite || caption) {
                                const figcaption = document.createElement("figcaption");
                                if (caption) figcaption.innerHTML += `<strong class="embed-caption">${label || doc.name}</strong>`;
                                if (cite) figcaption.innerHTML += `<cite>${await TextEditor.enrichHTML(`@UUID[${config.uuid}]`, options)}</cite>`;
                                figure.append(figcaption);
                            }
                            return figure;
                        }

                        const toEmbed = async (document, config, options = {}) => {
                            const content = await (async () => {
                                if (document instanceof JournalEntryPage) return await buildEmbedHTML(document.text.content, config, options);
                                if (document?.system?.effect) return await buildEmbedHTML(document.system.effect, config, options);
                            })();
                            if (!content) return null;
                            let embed;
                            if (config.inline) embed = await createInlineEmbed(content, config, options);
                            else embed = await createFigureEmbed(content, config, options);
                            if (embed) {
                                embed.classList.add("content-embed");
                                if (config.classes) embed.classList.add(...config.classes.split(" "));
                            }
                            return embed;
                        }

                        return toEmbed(doc, { label, ...config }, options);
                    }
                });
            });
            //     const anchors = htmlElement.querySelectorAll("a.pokedollar");
            //     for (const anchor of anchors) {
            //         const { amount, item } = anchor.dataset;
            //         anchor.addEventListener("dragstart", ev => {
            //             ev.stopPropagation();
            //             ev.dataTransfer.setData("text/plain", JSON.stringify({ type: "pokedollar", data: { amount, item } }));
            //         });
            //         if (item) {
            //             anchor.addEventListener("click", async ev => {
            //                 ev.preventDefault();
            //                 const document = await fromUuid(item);
            //                 if (!document) return;
            //                 await document.purchase();
            //             });
            //         }
            //         else {
            //             anchor.addEventListener("click", async ev => {
            //                 ev.preventDefault();
            //                 const actor = (() => {
            //                     const character = game.user.character;
            //                     if (character) return character;

            //                     const token = canvas.tokens.controlled[0];
            //                     if (token) return token.actor;

            //                     return null;
            //                 })();
            //                 if (!actor) return ui.notifications.error("No actor selected");
            //                 if (isNaN(Number(amount))) return ui.notifications.error("Invalid amount");
            //                 await actor.update({ "system.money": actor.system.money + Number(amount) });
            //                 ui.notifications.info(`${actor.name} Gained ${amount} Poké (New Total: ${actor.system.money})`);
            //             });
            //         }
            //     }
            // }

            // // These Sheets should be interactive, such that clicking on the anchor actually does something
            // // Due to some performance stutters during development, those are relatively restrictive.
            // // It the anchor appears somehwere where it should also work, add an appropriate hook here
            // Hooks.on("renderJournalTextPageSheet", (journal, $html) => {
            //     // maybe related to why this does do need a filter? https://github.com/foundryvtt/foundryvtt/issues/3088
            //     const journalHtmlElement = $html.filter(".journal-page-content").get(0);
            //     activateListeners(journalHtmlElement)

            // });
            // Hooks.on("renderChatMessage", (message, $html) => {
            //     // maybe related to why this does not need a filter? https://github.com/foundryvtt/foundryvtt/issues/3088
            //     const messageHtmlElement = $html.get(0);
            //     activateListeners(messageHtmlElement)

            //     message.activateListeners($html)
            // });
            // Hooks.on("renderPTUItemSheet", (itemSheet, $html) => {
            //     // maybe related to why this does not need a filter? https://github.com/foundryvtt/foundryvtt/issues/3088
            //     const itemHtmlElement = $html.get(0)
            //     activateListeners(itemHtmlElement)
            // });
        }
    }
};