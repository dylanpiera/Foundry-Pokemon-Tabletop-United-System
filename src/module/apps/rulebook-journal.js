/**
 * The custom Journal Sheet used for Kingmaker content.
 */
export default class PTURuleBookJournal extends JournalSheet {
    constructor(doc, options) {
      super(doc, options);
      this.options.classes.push("ptu", "rulebook");
    }
  }
  