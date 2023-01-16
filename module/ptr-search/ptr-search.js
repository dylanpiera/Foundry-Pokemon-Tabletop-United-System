/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {FormApplication}
 */
export class PTRSearch extends Application {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["ptr", "search"],
      template: "systems/ptu/module/ptr-search/ptr-search.hbs",
      width: 700,
      height: 800,
      title: "PTR Search",
      resizable: true,
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();

    var scriptTag = document.createElement("script"),
      filePath = "https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.js";

    // And listen to it
    scriptTag.onload = async () => await this.prepareData();
    // Make sure this file actually loads instead of a cached version
    // Add a timestamp onto the URL (i.e. file.js?bust=12345678)
    var cacheBuster = "";

    cacheBuster = "?bust=" + new Date().getTime();

    // Set the type of file and where it can be found
    scriptTag.type = "text/javascript";
    scriptTag.src = filePath + cacheBuster;

    // Finally add it to the <head>
    document.getElementsByTagName("head")[0].appendChild(scriptTag);
    
    return data;
  }

  async prepareData() {
    this.cachedData = {
        mons: await game.ptu.utils.cache.GetOrCreateCachedItem("ptr-mon", async () => {
            return JSON.parse(await $.get("https://raw.githubusercontent.com/pokemon-tabletop-reunited/PTR-Data/master/pokemon-data.json")).map(mon => { return { ...mon, compendium: "mons" }});
        }),
        moves: await game.ptu.utils.cache.GetOrCreateCachedItem("ptr-move", async () => {
            return JSON.parse(await $.get("https://raw.githubusercontent.com/pokemon-tabletop-reunited/PTR-Data/master/moves-data.json")).map(move => { return { ...move, compendium: "moves" }});
        }),
        abilities: await game.ptu.utils.cache.GetOrCreateCachedItem("ptr-ability", async () => {
            return JSON.parse(await $.get("https://raw.githubusercontent.com/pokemon-tabletop-reunited/PTR-Data/master/abilities-data.json")).map(ability => { return { ...ability, compendium: "abilities" }});
        }),
        capabilities: await game.ptu.utils.cache.GetOrCreateCachedItem("ptr-capability", async () => {
            return JSON.parse(await $.get("https://raw.githubusercontent.com/pokemon-tabletop-reunited/PTR-Data/master/capabilities-data.json")).map(capability => { return { ...capability, compendium: "capabilities" }});
        }), 
        edges: await game.ptu.utils.cache.GetOrCreateCachedItem("ptr-edge", async () => {
            return JSON.parse(await $.get("https://raw.githubusercontent.com/pokemon-tabletop-reunited/PTR-Data/master/edges-data.json")).map(edge => { return { ...edge, compendium: "edges" }});
        }),
        feats: await game.ptu.utils.cache.GetOrCreateCachedItem("ptr-feat", async () => { 
            return JSON.parse(await $.get("https://raw.githubusercontent.com/pokemon-tabletop-reunited/PTR-Data/master/feats-data.json")).map(feat => { return { ...feat, compendium: "feats" }});
        }),
        pokeEdges: await game.ptu.utils.cache.GetOrCreateCachedItem("ptr-poke-edge", async () => {
            return JSON.parse(await $.get("https://raw.githubusercontent.com/pokemon-tabletop-reunited/PTR-Data/master/poke-edges-data.json")).map(pokeEdge => { return { ...pokeEdge, compendium: "poke-edges" }});
        }),
        tms: await game.ptu.utils.cache.GetOrCreateCachedItem("ptr-tm", async () => {
            return JSON.parse(await $.get("https://raw.githubusercontent.com/pokemon-tabletop-reunited/PTR-Data/master/tms-data.json")).map(tm => { return { name: tm.move + " (tm)", tmNumber: tm.number, compendium: "tms" }});
        })
    };

    this.fuse = {
        mons: new Fuse(this.cachedData.mons, { 
            includeScore: true,
            keys: [
              { name: "_id", weight: 5 },
              { name: "number", weight: 3 },
              { name: "ptuNumber", weight: 1 },
              { name: "Type", weight: 2 },
            ],
            threshold: 0.25,
        }),
        moves: new Fuse(this.cachedData.moves, {
            includeScore: true,
            keys: [
              { name: "name", weight: 5 },
              { name: "type", weight: 2 },
              { name: "category", weight: 2 },
              { name: "effect", weight: 1 },
            ],
            threshold: 0.25,
          }),
        abilities: new Fuse(this.cachedData.abilities, {
            includeScore: true,
            keys: [
              { name: "name", weight: 5 },
              { name: "frequency", weight: 1 },
              { name: "effect", weight: 1 },
            ],
            threshold: 0.25,
          }),
        capabilities: new Fuse(this.cachedData.capabilities, {
            includeScore: true,
            keys: [
              { name: "name", weight: 5 },
              { name: "effect", weight: 1 },
            ],
            threshold: 0.25,
          }),
        edges: new Fuse(this.cachedData.edges, {
            includeScore: true,
            keys: [
              { name: "name", weight: 5 },
              { name: "prerequisites", weight: 3 },
              { name: "effect", weight: 1 },
            ],
            threshold: 0.25,
          }),
        feats: new Fuse(this.cachedData.feats, {
            includeScore: true,
            keys: [
              { name: "name", weight: 5 },
              { name: "prerequisites", weight: 3 },
              { name: "frequency", weight: 1 },
              { name: "effect", weight: 1 },
            ],
            threshold: 0.25,
          }),
        pokeEdges: new Fuse(this.cachedData.pokeEdges, {
            includeScore: true,
            keys: [
              { name: "name", weight: 5 },
              { name: "effect", weight: 1 },
            ],
            threshold: 0.25,
          }),
        tms: new Fuse(this.cachedData.tms, {
            includeScore: true,
            keys: [
              { name: "tmNumber", weight: 2 },
              { name: "name", weight: 0.5 },
            ],
            threshold: 0.25,
          })
    }

    this.setupListeners();

    this.init();
  }

  init() {
    function getRandomItemFromList(list) {
        return list[Math.floor((Math.random() * list.length))];
    }

    const list = getRandomItemFromList(["mons","moves", "abilities", "capabilities", "edges", "feats", "poke-edges", "tms"]); 
    const item = getRandomItemFromList(this.getCompendium(list));
    renderTemplate("/systems/ptu/module/ptr-search/item.hbs", item).then((html) => {
        $(".data-view").replaceWith(html);
        this.tmLinks();
    });
  }

  getCompendium(name) {
    switch (name) {
      case "mons": return this.cachedData.mons;
      case "moves": return this.cachedData.moves;
      case "abilities": return this.cachedData.abilities;
      case "capabilities": return this.cachedData.capabilities;
      case "edges": return this.cachedData.edges;
      case "feats": return this.cachedData.feats;
      case "poke-edges": return this.cachedData.pokeEdges;
      case "tms": return this.cachedData.tms;
    }
  }

  tmLinks() {
    const that = this;
    $("[data-tm-number]").on("click", async function (event) {
      const tm = event.currentTarget.dataset.tmNumber;
      const tmName = that.getCompendium("tms").find(x => x.tmNumber == tm).name.replace("(tm)", "").trim();
      const data = that.getCompendium("moves").find(x => x.name == tmName);
      const html = await renderTemplate("/systems/ptu/module/ptr-search/item.hbs", data);
      $(".data-view").replaceWith(html);
    });
  }

  setupListeners() {
    const that = this;
    let delayTimer;
    $(".jsonsearchinput").on("keydown", function (event) {
        if (delayTimer) clearTimeout(delayTimer);
        delayTimer = setTimeout(async function () {
        const input = event.currentTarget.value;

        if (input.length > 1) {
            const results = [
            ...that.fuse.mons.search(input),
            ...that.fuse.moves.search(input),
            ...that.fuse.abilities.search(input),
            ...that.fuse.capabilities.search(input),
            ...that.fuse.edges.search(input),
            ...that.fuse.feats.search(input),
            ...that.fuse.pokeEdges.search(input),
            ...that.fuse.tms.search(input),
            ].sort((a, b) => a.score - b.score);

            const html = await renderTemplate("/systems/ptu/module/ptr-search/list.hbs", {
                total: results.length > 12 ? 12 : results.length,
                items: results.length > 12 ? results.slice(0, 12).map(x => x.item) : results.map((x) => x.item),
            });

            $("#searchresults").replaceWith(html);
            $(".result-item").on("click", async function (event) {
            const { name, id, compendium } = event.currentTarget.dataset;
            const data = that.getCompendium(compendium).find((x) => name ? x.name == name : x.ptuNumber == id);
            const html = await renderTemplate("/systems/ptu/module/ptr-search/item.hbs", data);
            $(".data-view").replaceWith(html);
            
            that.tmLinks();
            })

            if (results.length == 1) {
            $(".result-item").click();
            }
        }

        if (input.length < 3) {
            $("#searchresults").hide();
        }
        }, 250);
    });
  }
}