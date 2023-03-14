import { PrepareMoveData } from "../ptu.js";
import { TypeEffectiveness } from "../data/effectiveness-data.js";

const isTypeDefaultType = (typeName) => Object.keys(TypeEffectiveness).includes(typeName);

export async function preloadHandlebarsTemplates() {
    return loadTemplates([
        
        // Actor Sheet Partials
        "systems/ptu/templates/partials/active-effects.hbs",
        "systems/ptu/templates/partials/mod-field.hbs",
        "systems/ptu/templates/partials/item-display-partial.hbs",
        
        // Charactermancer Partials
        "systems/ptu/templates/partials/charactermancer-evolution-partial.hbs",
        "/systems/ptu/templates/partials/charactermancer/stat-block-partial.hbs"
    ]);
  };

export function registerHandlebars() {
    Handlebars.registerHelper("concat", function () {
      var outStr = '';
      for (var arg in arguments) {
        if (typeof arguments[arg] != 'object') {
          outStr += arguments[arg];
        }
      }
      return outStr;
    });
  
    Handlebars.registerHelper("toLowerCase", function (str) {
      return str.toLowerCase ? str.toLowerCase() : str;
    });
  
    Handlebars.registerHelper("isdefined", function (value) {
      return value !== undefined;
    });
  
    Handlebars.registerHelper("key", function (obj) {
      return Object.keys(obj)[0];
    });
  
    Handlebars.registerHelper("is", function (a, b) { return a == b });
    Handlebars.registerHelper("bigger", function (a, b) { return a > b });
    Handlebars.registerHelper("biggerOrEqual", function (a, b) { return a >= b });
    Handlebars.registerHelper("and", function (a, b) { return a && b });
    Handlebars.registerHelper("or", function (a, b) { return a || b });
    Handlebars.registerHelper("not", function (a, b) { return a != b });
    Handlebars.registerHelper("itemDescription", function (name) {
      if (!name) return "";
      if (name || 0 !== name.length) {
        let item = game.ptu.data.items.find(i => i.name.toLowerCase().includes(name.toLowerCase()));
        if (item) return item.system.effect;
      }
      return "";
    });
    Handlebars.registerHelper("getGameSetting", function (key) { return game.settings.get("ptu", key) });
    Handlebars.registerHelper("getDb", function (db) {
      return game.ptu.data.DbData[db];
    });
    Handlebars.registerHelper("calcDb", function (move) {
      return (move.damageBase.toString().match(/^[0-9]+$/) != null) ? move.stab ? parseInt(move.damageBase) + 2 : move.damageBase : move.damageBase;
    });
    Handlebars.registerHelper("calcDbCalc", _calcMoveDb);
    Handlebars.registerHelper("calcAc", function (move) {
      return -parseInt(move.ac) + parseInt(move.acBonus);
    });
    Handlebars.registerHelper("calcMoveDb", function (actorData, move, bool = false) {
      return _calcMoveDb(PrepareMoveData(actorData, move), bool);
    });
    Handlebars.registerHelper("calcCritRange", function (actorData) {
      return actorData.modifiers.critRange?.total ? actorData.modifiers.critRange?.total : 0;
    });
    Handlebars.registerHelper("calcCritRangeMove", function (move) {
      return move.owner ? move.owner.critRange : 0;
    });
    Handlebars.registerHelper("getProperty", getProperty);
    Handlebars.registerHelper("aeTypes", function (id) {
      const types = Object.entries(CONST.ACTIVE_EFFECT_MODES).reduce((obj, e) => {
        obj[e[1]] = game.i18n.localize("EFFECT.MODE_" + e[0]);
        return obj;
      }, {});
      return id ? types[id] : types;
    })
  
    Handlebars.registerHelper("calcFrequencyIconPath", function (frequency, currentUseCount) {
      const basePath = "systems/ptu/images/icons/";
      const useCount = Number(currentUseCount);
      switch (frequency) {
        case "At-Will":
        case "":
          return basePath + "AtWill" + ".png";
        case "EOT":
          return basePath + (useCount == 0 ? "EOT_1" : "EOT_0") + ".png";
        case "Scene":
          return basePath + (useCount >= 1 ? "Scene1_0" : "Scene1_1") + ".png";
        case "Scene x2":
          return basePath + (useCount >= 2 ? "Scene2_0" : useCount == 1 ? "Scene2_1" : "Scene2_2") + ".png";
        case "Scene x3":
          return basePath + (useCount >= 3 ? "Scene3_0" : useCount == 2 ? "Scene3_1" : useCount == 1 ? "Scene3_2" : "Scene3_3") + ".png";
        case "Daily":
          return basePath + (useCount >= 1 ? "daily1_0" : "daily1_1") + ".png";
        case "Daily x2":
          return basePath + (useCount >= 2 ? "daily2_0" : useCount == 1 ? "daily2_1" : "daily2_2") + ".png";
        case "Daily x3":
          return basePath + (useCount >= 3 ? "daily3_0" : useCount == 2 ? "daily3_1" : useCount == 1 ? "daily3_2" : "daily3_3") + ".png";
      }
    })
  
    function keyToNatureStat(key) {
      switch (key) {
        case "hp": return "HP";
        case "atk": return "Attack";
        case "def": return "Defense";
        case "spatk": return "Special Attack";
        case "spdef": return "Special Defense";
        case "spd": return "Speed";
      }
    }
  
    Handlebars.registerHelper("natureCheck", function (nature, stat) {
      let statUp = game.ptu.data.natureData[nature][0] == keyToNatureStat(stat);
      let statDown = game.ptu.data.natureData[nature][1] == keyToNatureStat(stat)
  
      return statUp && !statDown ? "nature-up" : statDown && !statUp ? "nature-down" : "";
    });
  
    Handlebars.registerHelper("minMaxDiceCheck", function (roll, faces) {
      return roll == 1 ? "min" : roll == faces ? "max" : "";
    });
  
    Handlebars.registerHelper("hideAcOrDb", function (text) {
      return text == "" || text == "--";
    });
  
    Handlebars.registerHelper("loadTypeImages", function (types, includeSlash = true) {
      // TypeEffectiveness here is imported from source and only contains the default types
      // in contract, game.ptu.data.TypeEffectiveness contains custom types as well
      let customDir = game.settings.get("ptu", "typeEffectivenessCustomImageDirectory");
      if (customDir.slice(-1) !== "/") customDir += "/"
      if (customDir.charAt(0) !== "/") customDir = "/" + customDir
      if (!types) return;
      return types.reduce((html, type, index, array) => {
        if (type == "null") type = "Untyped";
        if (isTypeDefaultType(type)) return html += `<img class="mr-1 ml-1" src="/systems/ptu/css/images/types/${type}IC.webp">` + (includeSlash ? (index != (array.length - 1) ? "<span>/</span>" : "") : "");
        else return html += `<img class="mr-1 ml-1" src="${customDir}${type}IC.webp">` + (includeSlash ? (index != (array.length - 1) ? "<span>/</span>" : "") : "");
      }, "")
    });
  
    Handlebars.registerHelper("loadTypeImage", function (type) {
      // TypeEffectiveness here is imported from source and only contains the default types
      // in contract, game.ptu.data.TypeEffectiveness contains custom types as well
      let customDir = game.settings.get("ptu", "typeEffectivenessCustomImageDirectory");
      if (customDir.slice(-1) !== "/") customDir += "/"
      if (customDir.charAt(0) !== "/") customDir = "/" + customDir
      if (isTypeDefaultType(type)) return `<img src="/systems/ptu/css/images/types/${type}IC.webp">`;
      else return `<img src="${customDir}${type}IC.webp">`
    });

    Handlebars.registerHelper("loadTypeImageUrl", function (type) {
      // TypeEffectiveness here is imported from source and only contains the default types
      // in contract, game.ptu.data.TypeEffectiveness contains custom types as well
      let customDir = game.settings.get("ptu", "typeEffectivenessCustomImageDirectory");
      if (customDir.slice(-1) !== "/") customDir += "/"
      if (customDir.charAt(0) !== "/") customDir = "/" + customDir
      if (isTypeDefaultType(type) || type == "Special" || type == "Physical" || type == "Status") return `/systems/ptu/css/images/types2/${type}IC.png`;
      else return `${customDir}${type}IC.webp`
    });

    Handlebars.registerHelper("typeSelect", function (selectedType) {        
        return `<option value="Untyped"></option>` + Object.keys(game.ptu.data.TypeEffectiveness).filter(type => type != "Untyped").reduce((html, type) => 
            html += `<option ${type == selectedType ? "selected" : ""} style="color: #191813;" value="${type}">${type}</option>`
        , "");
    });
  
    Handlebars.registerHelper("isGm", function () {
      return game.user.isGM;
    })
  
    Handlebars.registerHelper("ld", function (key, value) {
      return { hash: { [key]: value } };
    })
  
    Handlebars.registerHelper("toReadableEffectMode", function (effectId) {
      return Object.entries(CONST.ACTIVE_EFFECT_MODES).reduce((obj, e) => {
        obj[e[1]] = game.i18n.localize("EFFECT.MODE_" + e[0]);
        return obj;
      }, {})[effectId]
    })
  
    Handlebars.registerHelper('getEffectivenessColor', function (effectiveness) {
      const value = Number(effectiveness);
      if (isNaN(value)) return "regular";
  
      if(value === -1) return "none";
      if (value < 1) {
        if (value == 0) {
          return "immune";
        }
        if(value <= 0.25) {
          return "doubly_resisted";
        }
        return "resisted";
      }
      if (value > 1) {
        if(value >= 2) {
          return "doubly_effective";
        }
        return "effective";
      }
      return "regular";
    })
  
    Handlebars.registerHelper('contains', function (needle, haystack) {
      needle = Handlebars.escapeExpression(needle);
      haystack = Handlebars.escapeExpression(haystack);
      return (haystack.indexOf(needle) > -1) ? true : false;
    });
  
    Handlebars.registerHelper('ifContains', function (needle, haystack, options) {
      needle = Handlebars.escapeExpression(needle);
      haystack = Handlebars.escapeExpression(haystack);
      return (haystack.indexOf(needle) > -1) ? options.fn(this) : options.inverse(this);
    });
  
    Handlebars.registerHelper("inc", function (num) { return Number(num) + 1 })
  
    Handlebars.registerHelper("tmName", function (tmNum) { return game.ptu.data.TMsData.get(tmNum) });
  
    /** If furnace ain't installed... */
    if (!Object.keys(Handlebars.helpers).includes("divide")) {
  
      Handlebars.registerHelper("divide", (value1, value2) => Number(value1) / Number(value2));
      Handlebars.registerHelper("multiply", (value1, value2) => Number(value1) * Number(value2));
      Handlebars.registerHelper("floor", (value) => Math.floor(Number(value)));
      Handlebars.registerHelper("capitalizeFirst", (e) => { return "string" != typeof e ? e : e.charAt(0).toUpperCase() + e.slice(1) });
    }

    Handlebars.registerHelper("capitalize", function (input) {
      var i, j, str, lowers, uppers;
      str = input.replace(/([^\W_]+[^\s-]*) */g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    
      // Certain minor words should be left lowercase unless 
      // they are the first or last words in the string
      lowers = ['A', 'An', 'The', 'And', 'But', 'Or', 'For', 'Nor', 'As', 'At', 
      'By', 'For', 'From', 'In', 'Into', 'Near', 'Of', 'On', 'Onto', 'To', 'With'];
      for (i = 0, j = lowers.length; i < j; i++)
        str = str.replace(new RegExp('\\s' + lowers[i] + '\\s', 'g'), 
          function(txt) {
            return txt.toLowerCase();
          });
    
      // Certain words such as initialisms or acronyms should be left uppercase
      uppers = ['Id', 'Tv'];
      for (i = 0, j = uppers.length; i < j; i++)
        str = str.replace(new RegExp('\\b' + uppers[i] + '\\b', 'g'), 
          uppers[i].toUpperCase());
    
      return str;
    });
    Handlebars.registerHelper("newline", function (a) { return a.replace("\\n", "\n") });

    Handlebars.registerHelper("lpad", function (str, len, char) {
      str = str.toString();
      while (str.length < len) str = char + str;
      return str;
    });
  
    function _calcMoveDb(move, bool = false) {
      if (move.category === "Status") return;
      let bonus = (move.owner ? move.category === "Physical" ? (move.owner.stats.atk.total + (move.owner.damageBonus?.physical?.total ?? 0)) : (move.owner.stats.spatk.total + (move.owner.damageBonus?.special?.total ?? 0)) : 0) + (move.damageBonus ?? 0);
      if (move.damageBase.toString().match(/^[0-9]+$/) != null) {
        let db = game.ptu.data.DbData[move.stab ? parseInt(move.damageBase) + 2 : move.damageBase];
        if (db) return db + (bool ? " + " : "#") + bonus;
        return -1;
      }
      let db = game.ptu.data.DbData[move.damageBase];
      if (db) return db;
      return -1;
    }
  }