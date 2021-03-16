import { log, debug } from "../ptu.js";
import { GetSpeciesArt } from "../utils/species-command-parser.js";
import { CalcLevel } from '../actor/calculations/level-up-calculator.js';
import { excavateObj, dataFromPath } from '../utils/generic-helpers.js';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {FormApplication}
 */
export class PTUPokemonCharactermancer extends FormApplication {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["ptu", "charactermancer", "pokemon"],
      template: "systems/ptu/templates/forms/charactermancer-pokemon.hbs",
      width: 452,
      height: 1050,
      title: "Charactermancer",
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "stats" }]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    data.dtypes = ["String", "Number", "Boolean"];

    this.allSpecies = game.ptu.pokemonData.map(x => {return {number: x.ptuNumber, name: x._id}}).concat(game.ptu.customSpeciesData.map(x => {return {number: x.ptuNumber, name: x._id}}));
    this.speciesData = game.ptu.GetSpeciesData(this.object.data.data.species ? this.object.data.data.species : this.object.name);
    debug(this.object, this.object.data.species ? this.object.data.species : this.object.name);

    data.selectedSpecies = this.speciesData;

    this._calcStages();
    data.stages = this.stages;
    return data;
  }

  /** @override */
  render(options) {
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
              log(ref.object.getFlag("ptu", "cmbackup"));
            }
          },
          two: {
            label: "Import Data",
            icon: '<i class="fas fa-file-import"></i>',
            callback: () => {
              let paths = excavateObj(flag);
              log(flag, paths);
              for(let path of paths) {
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

    /** Button Logic */

    html.find('.btn').click(function(event) {
      event.preventDefault();
      if(event.screenX == 0 && event.screenY == 0) return;
      let opt = event.target.dataset.value

      switch(opt) {
        case "submit": ref.submit(); ref.close(); return;
        case "next": log("Next"); return;
      }
    });

    /** Page 1 Implementation */

    let speciesField = html.find('#speciesField');
    let speciesIdField = html.find('#speciesIdField');
    let levelField = html.find('#levelField');
    let levelExpField = html.find('#levelExpField');
    let levelBar = html.find('#levelBar');

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
      ref.level = Number(event.target.value);
      if(isNaN(ref.level)) return;
      ref.exp = game.ptu.levelProgression[ref.level]
      if(Number(levelExpField.val()) != ref.exp) {
        levelExpField.val(ref.exp);
        transformXPText();
      }
      levelBar.attr("class", `progress-bar p${ref.level}`)
      transformLevelText();
    })

    levelExpField.keyup(async function(event) {
      ref.exp = Number(event.target.value);
      if(isNaN(ref.exp)) return;
      ref.level = CalcLevel(ref.exp, 50, game.ptu.levelProgression)
      if(Number(levelField.val()) != ref.level) {
        levelField.val(ref.level);
        levelBar.attr("class", `progress-bar p${ref.level}`)
        transformLevelText();
      }
      transformXPText();
    })



    this._updateArt();
    this._updateTyping();
    setTimeout(this._transformText, 50)
    levelBar.attr("class", `progress-bar p${this.object.data.data.level.current}`)
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
    setTimeout(this._transformText, 50)
  }

  _transformText() {
    $('#levelExpInvis').text($('#levelExpField').val())
    $('#levelExpSuffix').css("right", `${($('#levelExpField').width()/2)-($('#levelExpInvis').width())-(300/(Math.pow($('#levelExpInvis').width(), 1.1)))}px`)
    $('#levelInvis').text($('#levelField').val())
    $('#levelPrefix').css("right", `${($('#levelField').width()/2)+($('#levelInvis').width())+7}px`)
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
    log(options, options === undefined, this.object.getFlag("ptu", "cmbackup"));
    if(options === undefined)
      await this.object.setFlag("ptu", "cmbackup", this._getSubmitData());
    else
      await this.object.setFlag("ptu", "cmbackup", null);
  }
}