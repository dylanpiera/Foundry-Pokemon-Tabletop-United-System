export function CalcBaseStats(specie, nature, items, level, stats) {
  const statKeys = [
    ["hp", "HP"],
    ["atk", "Attack"],
    ["def", "Defense"],
    ["spatk", "Special Attack"],
    ["spdef", "Special Defense"],
    ["spd", "Speed"],
  ];
  for (let element of statKeys) {
    if (specie != null)
      stats[element[0]].value = _calculateBaseStat(
        nature,
        element[1],
        items.filter((x) => x.type == "pokeedge"),
        _fetchSpecieStat(specie, element[1]),
        items.filter((x) => x.type == "ability"),
        level
      );
    else stats[element[0]].value = 0;
  }
  return stats;
}

function _fetchSpecieStat(specie, stat) {
  return specie != null ? specie["Base Stats"][stat] : 0;
}

function _calculateBaseStat(nature, statKey, edges, stat, abilities, level) {
  if (nature == "") return stat;
  if (game.ptu.natureData[nature] == null) return statKey;

  if (game.ptu.natureData[nature][0] == statKey)
    stat += statKey == "HP" ? 1 : 2;
  if (game.ptu.natureData[nature][1] == statKey)
    stat -= statKey == "HP" ? 1 : 2;

  // Underdog's Strength
  if (edges.includes("Underdog's Strength")) stat += 1;

  //Abilities
  for (let ability of Object.entries(abilities)) {
    //Abominable [Playtest]
    if (ability[1].name == "Abominable [Playtest]" && statKey == "HP")
      stat += 5;
    //Huge Power or Pure Power
    if (ability[1].name == "Huge Power" || ability[1].name == "Pure Power")
      if (statKey == "Attack") stat += stat;
    //Huge Power / Pure Power [Playtest]
    if (ability[1].name == "Huge Power / Pure Power [Playtest]")
      if (statKey == "Attack") stat += 5 + Math.floor(level / 10);
    //Heavy Metal [Playtest]
    if (ability[1].name == "Heavy Metal [Playtest]") {
      if (statKey == "Defense") stat += 2;
      if (statKey == "Speed") stat -= 2;
    }
    //Light Metal [Playtest]
    if (ability[1].name == "Light Metal [Playtest]") {
      if (statKey == "Defense") stat -= 2;
      if (statKey == "Speed") stat += 2;
    }
    //Sorcery
    if (ability[1].name == "Sorcery")
      if (statKey == "Special Attack") stat += 5 + Math.floor(level / 10);
  }

  return Math.max(stat, 1);
}

export function CalculateStatTotal(levelUpPoints, stats, species, edges) {
  for (let [key, value] of Object.entries(stats)) {
    let sub = value["value"] + value["mod"] + value["levelUp"];
    levelUpPoints -= value["levelUp"];
    if (value["stage"] > 0) {
      value["total"] = Math.floor(sub * value["stage"] * 0.2 + sub);
    } else {
      if (key == "hp") {
        value["total"] = sub;
      } else {
        value["total"] = Math.ceil(sub * value["stage"] * 0.1 + sub);
      }
    }
  }
  //PokeEdges
  //Check for Mixed Sweeper
  for (let edge of edges)
    if (edge.name.startsWith("Mixed Sweeper Rank")) levelUpPoints += 3;
  //Check for Realized Potential
  for (let edge of edges)
    if (edge.name.includes("Realized Potential")) {
      let total = 0;
      for (let value of Object.entries(species)) total += value[1];
      if (45 - total > 0) levelUpPoints += 45 - total;
      break;
    }

  return {
    levelUpPoints: levelUpPoints,
    stats: stats,
  };
}
