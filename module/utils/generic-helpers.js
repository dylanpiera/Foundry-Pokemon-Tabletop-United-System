/* -- Helper Functions -- */

import { pokemonData } from "../data/species-data.js";
import { levelProgression } from "../data/level-progression.js";
import { CalcLevel } from "../actor/calculations/level-up-calculator.js";
import { GetOrCacheMoves } from "./cache-helper.js";

export function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}

export function lpad(value, padding) {
    var zeroes = new Array(padding+1).join("0");
    return (zeroes + value).slice(-padding);
}

export function excavateObj(input, basePath = "") {
    let arr = [];
    
    for(let obj of Object.entries(input)) {
        if(obj[1] !== null && typeof obj[1] === "object") {
            arr = arr.concat(excavateObj(obj[1], basePath + obj[0] + "."));
        }
        else arr.push(basePath + obj[0]);
    }
    return arr;
}

window.excavateObj = excavateObj;

export function dataFromPath(obj, path, rec = false) {
    let loc = rec ? path : path.split('.');
    if(loc.length > 1) return dataFromPath(obj?.[loc?.[0]], loc?.slice(1), true)
    return obj?.[loc?.[0]];
}

window.dataFromPath = dataFromPath

window.match = function(value, patterns) {
    for(const p of patterns) {
        if(p.test(value)) return p.result(value);
    }
}

export function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function capitalizeFirstLetter(string) {
    return string[0].toUpperCase() + string.slice(1);
}

Hooks.on("preUpdateActor", async (oldActor, changes, options, sender) => {
    //check if this is turned off in settings
    const setting = game.settings.get("ptu", "pokemonLearnMovesMessage")
    if(!setting) return; // option turned off by GM

    if(changes.system?.level?.exp === undefined) return;

    const oldLvl = CalcLevel(oldActor.system.level.exp, 50, levelProgression);
    const newLvl = CalcLevel(changes.system.level.exp, 50, levelProgression);
    
    
    if(newLvl > oldLvl) {
        //mons dex entry
        const dexEntry = pokemonData.find(e => e._id.toLowerCase() === oldActor.system.species.toLowerCase() )
       
        const newMoveNames=[dexEntry["Level Up Move List"]][0].filter(m => m.Level > oldLvl && m.Level <= newLvl).map(m => m.Move);
        const allMoves =  await GetOrCacheMoves()
        const newMoves = [...allMoves].filter(m => newMoveNames.includes(m.name));

        if(newMoves.length > 0) {
            //show dialog
            let d = new Dialog({
                title: `${oldActor.name} is trying to learn new moves!`,
                content: "Please click buttons to add the moves to your pokemon's move list.<br> You can remove them later if you want.<br><br><br>",
                buttons: {},
                default: "done"                          
            });

            d.position.width = 600;
            d.options.resizable = true;

            newMoves.forEach((move, i) => {
                d.data.buttons[`move${i}`] = {
                    label: `${move.name}`,
                    classes: ["learn-moves"],
                    callback: async () => {                                                           
                        d.render(true);//don't close the dialog
                        //check if old actor already has the move
                        if(oldActor.moves.find(m => m.name.toLowerCase() === move.name.toLowerCase())) {
                            ui.notifications.info(`${oldActor.name} already knows ${move.name}!`);
                        } else {
                            //add the move to the actors list of moves
                            await oldActor.createEmbeddedDocuments("Item", [move]);
                        }                                
                    }
                };
            });

            d.data.buttons["done"] = {
                label: "Done",
                classes: ["learn-moves"],
                callback: () => {
                    d.close();
                    const closed = new Dialog({
                        title: oldActor.name,
                        content: `${oldActor.name} now knows ${oldActor.moves.length} moves! Please remove some if needed.<br><br><br>`,
                        buttons: {
                            ["ok"]: {
                                label: "OK",
                                callback: () => {
                                    closed.close();
                                }
                            }
                        }
                    })

                    if(oldActor.moves.length > 6) 
                        closed.render(true);
                }
            }

            d.render(true);
            
        }
    }
});
