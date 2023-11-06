export function pokedex() {
    const species = game.user.targets.first()?.actor?.species;
    if (!species) return ui.notifications.error("Please target a pokemon");
    species.sheet.render(true)

    const dex = game.user.character?.system?.dex;
    if (!dex) return;
    const seen = [...dex.seen, species.slug];
    return game.user.character.update({ "system.dex.seen": seen });
}