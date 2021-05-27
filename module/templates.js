export default async function PreloadHandlebarsTemplates() {
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