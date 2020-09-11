export function RollWithDb(db, damageMod = 0, label = "") {
    let rollCalc = game.ptu.DbData[db];
    
    let roll = new Roll(rollCalc + "+" + damageMod, {});
        if(!label) label = `Damage for move with DB: ${db}`;
        roll.roll().toMessage({
          flavor: label
        });
  }