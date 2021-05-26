import { log, debug } from "../ptu.js";
import { GetSpeciesArt } from "../utils/species-command-parser.js";
import { CalcLevel } from '../actor/calculations/level-up-calculator.js';
import { CheckStage } from '../utils/calculate-evolution.js';
import { excavateObj, dataFromPath } from '../utils/generic-helpers.js';
import { CalcBaseStat, CalculateStatTotal } from "../actor/calculations/stats-calculator.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {FormApplication}
 */
export class PTUPokemonCharactermancer extends FormApplication {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["ptu", "charactermancer", "pokemon", "gen8"],
      template: "systems/ptu/templates/forms/charactermancer-pokemon.hbs",
      width: 452,
      height: 1050,
      title: "Charactermancer",
      tabs: [{ 
        navSelector: ".sheet-tabs", 
        contentSelector: ".sheet-body", 
        initial: "species" 
      }]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    debug("Sheet: ",this)

    const data = super.getData();
    data.dtypes = ["String", "Number", "Boolean"];

    data['natures'] = game.ptu.natureData;

    this.allSpecies = game.ptu.pokemonData.map(x => {return {number: x.ptuNumber, name: x._id}}).concat(game.ptu.customSpeciesData.map(x => {return {number: x.ptuNumber, name: x._id}}));
    this.speciesData = game.ptu.GetSpeciesData(this.object.data.data.species ? this.object.data.data.species : this.object.name);
    
    data.selectedSpecies = this.speciesData;

    data.level = this.object.data.data.level.current;
    data.levelUpPoints = this.object.data.data.modifiers.statPoints?.total + 10 + data.level;
    data.nature = this.object.data.data.nature;

    // Stats
    data.stats = this.object.data.data.stats;
    data.stats.hp.value = CalcBaseStat(data.selectedSpecies, data.nature.value, "HP");
    data.stats.atk.value = CalcBaseStat(data.selectedSpecies, data.nature.value, "Attack");
    data.stats.def.value = CalcBaseStat(data.selectedSpecies, data.nature.value, "Defense");
    data.stats.spatk.value = CalcBaseStat(data.selectedSpecies, data.nature.value, "Special Attack");
    data.stats.spdef.value = CalcBaseStat(data.selectedSpecies, data.nature.value, "Special Defense");
    data.stats.spd.value = CalcBaseStat(data.selectedSpecies, data.nature.value, "Speed");

    var result = CalculateStatTotal(data.levelUpPoints, data.stats);
    data.stats = result.stats;

    this._calcStages();
    data.stages = this.stages;

    this.data = data;
    debug(this.data)
    return data;
  }

  /** @override */
  render(options) {
    ui.notifications.notify("Charactermancer is temporarily disabled as it's undergoing changes", "warning"); return;
    if($('.charactermancer').length > 0) return;
    super.render(options);
  }

  /** @override */
	async activateListeners(html) {
    super.activateListeners(html);
    const ref = this;

    /** Backup Logic */

    let flag = this.object.getFlag("ptu", "cmbackup");
    if(flag) {
      this.d = new Dialog({
        title: "Backup Data Found!",
        content: "<p class='readable pb-2 pt-1'>It seems you didn't properly close the Charactermancer the last time you used it.<br>Would you like us to import your old data or delete it?</p>",
        buttons: {
          one: {
            label: "Delete Data",
            icon: '<i class="fas fa-trash"></i>',
            callback: async () => {
              await ref.object.setFlag("ptu", "cmbackup", null);
            }
          },
          two: {
            label: "Import Data",
            icon: '<i class="fas fa-file-import"></i>',
            callback: () => {
              debug("TEST", flag)
              let paths = excavateObj(flag);
              debug("TEST", paths)
              for(let path of paths) {
                debug("TEST", path, dataFromPath(flag, path))
                $(`[name="${path}"]`).val(dataFromPath(flag, path))
              }
              ref._refreshAll();
            }
          }
        },
        render: html => html.parent().parent().css('box-shadow', '0 0 15px 5px #ff0000d0'),
        close: html => {
          $('.charactermancer').css('pointer-events', 'unset')
          $('.charactermancer').css('-webkit-filter', 'unset')
        }
      })
      $('.charactermancer').css('pointer-events', 'none')
      $('.charactermancer').css('-webkit-filter', 'grayscale(1)')
      this.d.render(true);
    }

    /** Page 1 Implementation */

    let speciesField = html.find('#speciesField');
    let speciesIdField = html.find('#speciesIdField');
    let levelField = html.find('#levelField');
    let levelExpField = html.find('#levelExpField');

    /** Button Logic */

    html.find('.btn').click(function(event) {
      event.preventDefault();
      if(event.screenX == 0 && event.screenY == 0) return;
      let opt = event.target.dataset.value

      switch(opt) {
        case "submit": ref.submit(); ref.close(); return;
        case "species-next": 
          $('.btn[data-value="species-next"]').attr('disabled', true)
          let species = CheckStage(Number(levelField.val()), ref.speciesData)
          if(species.number != ref.speciesData.number) {
            debug("Evolution detected!", ref.speciesData._id, species._id);

            this.d = new Dialog({
              title: "Evolution Detected!",
              content: `<p class='readable pb-2 pt-1'>Wow! It looks like ${ref.object.name} is about to evolve into<br><br><b>${species._id}</b>!<br><br>Will you let it?</p>`,
              buttons: {
                one: {
                  label: "Stop Evolution",
                  // icon: '<i class="fas fa-times"></i>',
                },
                two: {
                  label: "Evolve",
                  // icon: '<i class="fas fa-plus"></i>',
                  callback: () => {
                    ref.speciesData = species;
                    speciesField.val(species._id)
                    speciesIdField.val(Number(species.number))
                    ref._refreshAll();
                  }
                }
              },
              //render: html => html.parent().parent().css('box-shadow', '0 0 15px 5px #ff0000d0'),
              close: html => setTimeout(function () {
                $('.charactermancer').css('pointer-events', 'unset');
                $('.charactermancer').css('-webkit-filter', 'unset');
                ref._tabs[0].activate("stats");
              }, 100)
            })
            $('.charactermancer').css('pointer-events', 'none')
            $('.charactermancer').css('-webkit-filter', 'grayscale(1)')
            this.d.render(true);
            return;
          }
          ref._tabs[0].activate("stats")
          return;
      }
    });

    speciesField.autocomplete({
			source: this.allSpecies.map(x => x.name),
			autoFocus: true,
      minLength: 1,
      select: () => setTimeout(() => speciesField.trigger("change"), 100)
    });

    speciesField.change(async function(event) {
      let mon = duplicate(event.target.value);
      if(!isNaN(mon)) ref.speciesData = game.ptu.GetSpeciesData(parseInt(mon));
      else ref.speciesData = game.ptu.GetSpeciesData(mon);
      
      if(ref.speciesData) {
        if(Number(speciesIdField.val()) != Number(ref.speciesData.number)) speciesIdField.val(Number(ref.speciesData.number));
        await ref._updateArt(event);
        ref._updateTyping();
        ref._calcStages()
      }
    });

    speciesIdField.change(async function(event) {
      let monId = Number(event.target.value);
      if(isNaN(monId)) return;
      ref.speciesData = game.ptu.GetSpeciesData(monId);

      if(ref.speciesData) {
        if(speciesField.val().toLowerCase() != ref.speciesData._id.toLowerCase()) speciesField.val(ref.speciesData._id);
        await ref._updateArt(event);
        ref._updateTyping();
        ref._calcStages()
      }
    })

    let transformXPText = () => {
      $('#levelExpInvis').text(levelExpField.val())
      $('#levelExpSuffix').css("right", `${(levelExpField.width()/2)-($('#levelExpInvis').width())-(300/(Math.pow($('#levelExpInvis').width(), 1.1)))}px`)
    };
    let transformLevelText = () => {
      $('#levelInvis').text(levelField.val())
      $('#levelPrefix').css("right", `${(levelField.width()/2)+($('#levelInvis').width())+7}px`)
    };

    levelField.keyup(async function(event) {
      ref.data.level = Number(event.target.value);
      if(isNaN(ref.data.level)) return;
      ref.data.exp = game.ptu.levelProgression[ref.data.level]
      if(Number(levelExpField.val()) != ref.data.exp) {
        levelExpField.val(ref.data.exp);
        transformXPText();
      }
      $('#levelBar').attr("class", `progress-bar p${ref.data.level}`)
      transformLevelText();
    })

    levelExpField.keyup(async function(event) {
      ref.data.exp = Number(event.target.value);
      if(isNaN(ref.data.exp)) return;
      ref.data.level = CalcLevel(ref.data.exp, 50, game.ptu.levelProgression)
      if(Number(levelField.val()) != ref.data.level) {
        levelField.val(ref.data.level);
        $('#levelBar').attr("class", `progress-bar p${ref.data.level}`)
        transformLevelText();
      }
      transformXPText();
    })

    $('#natureSelect').change(ref._updateNature.bind(ref));

    $('.charactermancer .stats.levelUp input').change(function () {
      let e = $(this);
      let key = e.data().key

      ref.data.stats[key].levelUp = Number(e.val());
      ref._reCalcStats();
      // let base = Number(e.parent().parent().children('.base').children('input').val());
      // let levelUp = Number(e.val());
      // let total = e.parent().parent().children('.total').children('input');
      // total.val(base + levelUp);
  })

    this._updateArt();
    this._updateTyping();
    this._updateNature();
    levelField.val(this.data.level);
    setTimeout(this._transformText, 50)
    $('#levelBar').attr("class", `progress-bar p${this.object.data.data.level.current}`)
  }

  _refreshAll() {
    let mon = $('#speciesField').val();
    if(!isNaN(mon)) this.speciesData = game.ptu.GetSpeciesData(parseInt(mon));
      else this.speciesData = game.ptu.GetSpeciesData(mon);

    if(this.speciesData) {
      if(Number($('#speciesIdField').val()) != Number(this.speciesData.number)) $('#speciesIdField').val(Number(this.speciesData.number));
    }

    this._updateArt();
    this._updateTyping();
    this._calcStages();
    this._updateNature();
    setTimeout(this._transformText, 50)
    $('#levelBar').attr("class", `progress-bar p${this.object.data.data.level.current}`)
  }

  _reCalcStats() {
    this.data.levelUpPoints = this.object.data.data.modifiers.statPoints?.total + 10 + this.data.level;
    this.data.stats = this.object.data.data.stats;
    this.data.stats.hp.value = CalcBaseStat(this.data.selectedSpecies, this.data.nature.value, "HP");
    this.data.stats.atk.value = CalcBaseStat(this.data.selectedSpecies, this.data.nature.value, "Attack");
    this.data.stats.def.value = CalcBaseStat(this.data.selectedSpecies, this.data.nature.value, "Defense");
    this.data.stats.spatk.value = CalcBaseStat(this.data.selectedSpecies, this.data.nature.value, "Special Attack");
    this.data.stats.spdef.value = CalcBaseStat(this.data.selectedSpecies, this.data.nature.value, "Special Defense");
    this.data.stats.spd.value = CalcBaseStat(this.data.selectedSpecies, this.data.nature.value, "Speed");

    var result = CalculateStatTotal(this.data.levelUpPoints, this.data.stats);
    this.data.stats = result.stats;
    this.data.levelUpPoints = result.levelUpPoints;
    
    for(let key of Object.keys(this.data.stats)) this._updateStat(key);
  }

  _updateStat(key) {
    let baseValue = this.data.stats[key].value;
    let base = $(`.charactermancer .stats.${key}.base input`);
    let levelUp = $(`.charactermancer .stats.${key}.levelUp input`);
    let total = $(`.charactermancer .stats.${key}.total input`);
    let levelUpPoints = $('.charactermancer input[name="data.levelUpPoints"]');

    if(base && levelUp && total) {
      if(Number(base.val()) != baseValue) base.val(Number(baseValue));
      levelUpPoints.val(Number(this.data.levelUpPoints));
      total.val(Number(base.val()) + Number(levelUp.val()));
    }
  }

  _transformText() {
    $('#levelExpInvis').text($('#levelExpField').val())
    $('#levelExpSuffix').css("right", `${($('#levelExpField').width()/2)-($('#levelExpInvis').width())-(300/(Math.pow($('#levelExpInvis').width(), 1.1)))}px`)
    $('#levelInvis').text($('#levelField').val())
    $('#levelPrefix').css("right", `${($('#levelField').width()/2)+($('#levelInvis').width())+7}px`)
  }

  _updateNature() {
    let down = $('#natureDown');
    let up = $('#natureUp');

    let nature = $('#natureSelect').val();

    let nd = game.ptu.natureData[nature]
    if(!nd) return;

    debug(this);
    this.data.nature.value = nature;
    
    let getShortName = (stat) => {
        switch(stat) {
          case "HP": return "HP";
          case "Attack": return "ATK";
          case "Defense": return "DEF";
          case "Special Attack": return "SPATK";
          case "Special Defense": return "SPDEF";
          case "Speed": return "SPD";
      }
    }

    up.val("+"+getShortName(nd[0]));
    down.val("-"+getShortName(nd[1]));

    let stats = {
      hp: $('.charactermancer .bar.hp'),
      atk: $('.charactermancer .bar.atk'),
      def: $('.charactermancer .bar.def'),
      spatk: $('.charactermancer .bar.spatk'),
      spdef: $('.charactermancer .bar.spdef'),
      spd: $('.charactermancer .bar.spd'),
    }
    
    for(let [key, value] of Object.entries(stats)) {
        value.children().children(".nature-up").removeClass("nature-up");
        value.children().children(".nature-down").removeClass("nature-down");
    
        let cur = Handlebars.helpers.natureCheck(nature, key);
        if(cur) value.children().children(".key").addClass(cur);
    }

    this._reCalcStats();
  }

  async _calcStages(refreshData = true) {
    if(!this.speciesData) return;

    if(refreshData) {
      this.stages = {1: [], 2: [], 3: []};
      for(let e of this.speciesData.Evolution) {
        let temp = {
          stage: e[0], 
          name: e[1], 
          level: e[2], 
          restriction: e[3],
          data: game.ptu.GetSpeciesData(e[1].replace(/ /g, "-")),
        }
        let imgSrc = game.settings.get("ptu", "defaultPokemonImageDirectory");
        if(imgSrc) {
          let imgPath = await GetSpeciesArt(temp.data, imgSrc);
          if(imgPath) {
            temp.image = imgPath;
          }
        }
        this.stages[e[0]].push(temp)
      }
    }
    
    const ref = this;

    renderTemplate(`/systems/ptu/templates/partials/charactermancer-evolution-partial.hbs`, this).then(html => {
      $('#evolutionContainer').html(html);
      
      $('#evolutionContainer div[data-stage] select').change(function(event) {
        let stage = event.target.dataset.stage;
        let id = event.target.value; 

        ref.stages[stage].selected = ref.stages[stage].findIndex(x => x.data._id.toLowerCase() == id.toLowerCase().replace(/ /g, "-"));
        if(stage == 2 && ref.stages[3].length > 1) {
          ref.stages[3].selected = ref.stages[stage].selected;
        }

        ref._calcStages(false);
      })
    });
  }
  
  async _updateArt(event) {
    let imgSrc = game.settings.get("ptu", "defaultPokemonImageDirectory");
    if(imgSrc) {
      let imgPath = await GetSpeciesArt(this.speciesData ? this.speciesData : this.object.species.data ? {_id: this.object.data.species} : {_id: this.object.name}, imgSrc);
      if(imgPath) {
        this.image = imgPath;

        $("#preview-img").html(`<img src="${this.image}"><input type="hidden" name="img" value="${this.image}">`);
      }
      else {
        $("#preview-img").html(`<img src="/icons/svg/mystery-man-black.svg" style="height: 404px; width: 100%;">`);
      }
    }
  }

  _updateTyping() {
    this.typing = undefined;

    if(this.speciesData) {
      this.typing = {
        type1: `/systems/ptu/css/images/types2/${this.speciesData.Type[0]}IC.png`,
        type2: `/systems/ptu/css/images/types2/${this.speciesData.Type[1] != "null" ? this.speciesData.Type[1] + `IC_Flipped` : "IC_Flipped"}.png`
      }

      $('#type1').attr("src",this.typing.type1);
      $('#type2').attr("src",this.typing.type2);
    }
  }

  /* -------------------------------------------- */
  
  /** @override */
  async _updateObject(event, formData) {
    await this.object.update(formData);
  }

  /** @override */
  async close(options) {
    if(this.d) {
      this.d?.close();
    }
    await super.close(options);
    if(options === undefined)
      await this.object.setFlag("ptu", "cmbackup", this._getSubmitData());
    else
      await this.object.setFlag("ptu", "cmbackup", null);
  }
}