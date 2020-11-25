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
    this._dirId = folder._id;
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
}