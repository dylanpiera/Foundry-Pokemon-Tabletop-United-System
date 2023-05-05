export function RollWithDb(db, damageMod = 0, label = "") {
    let rollCalc = game.ptu.data.DbData[db];
    
    let roll = new Roll(rollCalc + "+" + damageMod, {});
        if(!label) label = `Damage for move with DB: ${db}`;
        roll.evaluate({async: false}).toMessage({
          flavor: label
        });
  }