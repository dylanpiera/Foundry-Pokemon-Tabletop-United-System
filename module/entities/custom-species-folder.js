export default class CustomSpeciesFolder {
    static dirName = "_ptu_custom_species";
    static _dirId = null;

 /**
   * Returns true if directory has been created
   *
   * @param folder
   * @returns {boolean}
   */
  static folderExists() {
    let result = game.journal.directory.folders.find(f => f.name === this.dirName);

    return result !== undefined;
  }

  /**
   * Initializes the creation of folder
   *
   * @returns {Promise<void>}
   */
  static async initializeJournals() {
    let dirExists = this.folderExists();

    if (!dirExists) {
      await Folder.create({name: this.dirName, type: "JournalEntry", parent: null});
    }

    let folder = game.journal.directory.folders.find(f => f.name === this.dirName);
    this._dirId = folder.id;
  }

  /**
   * Retrieves instance of folder
   *
   * @returns {*}
   */
  static get() {
    return game.journal.directory.folders.find(f => f.name === this.dirName);
  }

  /**
   * 
   */
  static updateFolderDisplay(value) {
    if(!value) {
      $(`[data-folder-id='${CustomSpeciesFolder._dirId}'`).hide()
    }
    else {
      $(`[data-folder-id='${CustomSpeciesFolder._dirId}'`).show()
    }
  }

  static findEntry(species) {
    if(species._journalId === undefined) { 
      if(typeof species === 'object') return undefined;
      if(parseInt(species)) {
        let result = game.journal.contents.find(entry => entry.data.name.toLowerCase().includes(species))
        if(result === undefined) result = game.journal.contents.find(entry => entry?.data?.content?.includes(`"ptuNumber":${species}`));
        return result;
      }
      else {
        if(!species) return;
        let result = game.journal.contents.find(entry => entry.data.name.toLowerCase().includes(species.toLowerCase()))
        if(result === undefined) result = game.journal.contents.find(entry => entry?.data?.content?.includes(`"_id":"${species}"`));
        return result;
      }
    }
    return game.journal.get(species._journalId);
  }

  static getSpeciesData(species) {
      let entry = this.findEntry(species);
      if(entry === undefined) return entry;
    
      let json = $(`<p>${entry.data.content}</p>`).text()
      if(!json) return undefined;

      let speciesData = JSON.parse(json);
      if(!speciesData._journalId) {
        speciesData._journalId = entry.data._id;
        entry.update({content: JSON.stringify(speciesData)})
      }

      return speciesData;
  }

  static getAvailableId() {
    let currentList = game.folders.get(this._dirId).contents.map(x => parseInt(x.name)).sort((a,b) => b-a);
    if(currentList) {
      let highest = currentList[0];

      if(highest >= 2000)
        return highest+1;
    }
    return 2000;
  }
}