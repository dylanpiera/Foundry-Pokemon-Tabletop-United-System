# Welcome to the Playtest!


### What is this playtest?
This playtest is being used to gather feedback for a potential new system of calculating a pokemons statistics, it takes inspiration from the Gen III games.

### Why?
The current system of **Base Stat Relations** is flawed. Many people completely ignore it and it has many issues with balancing, especially when comparing full tanks, vs 'glass cannons'. You can find full details of these issues written in this google docs sheet: https://docs.google.com/document/d/1rOlOdksd0QNTiAO2vLU6uYes0aAxGzFe1n5wuDdGmVg/edit

#### But the main points made in this sheet that we are trying to resolve with this playtest is:

- Full Tank is Bad. They invest all their level up points into health and defense stats, and it still only takes a glass cannon one maybe two turns to kill them, whilst they themselves deal no damage, because they have no points in attack/special attack. Meaning if you have two full tanks against eachother it is a wet noodle fight that can take **over 200 turns to resolve.**
- Extreme agression stays consitant across all levels, with  most battles being over in two or less moves even with average rolls. In the case of two glass cannons going against eachother it can often just be down to whoever moves first wins. This is boring, and the opposite problem that we have with the tanks.
- in the middle All Even builds progressively lose time as they level up as we've already established and they would be better off just focusing aggression
- The idea of Base Stat Relations is that your pokemons stats should all increase gradually, as they level up. Even if you have a beefy snorlax their speed will still increase over time, regardless of if you're putting all your points in HP. This should be encouraged! and more well rounded pokemon should be rewarded and not felt like they are being left behind by the more specialised.

### How does it work?
To work out the new stat line of a pokemon we took some inspiration from the Generation III Calculation for the Pokémon games.

![image](https://user-images.githubusercontent.com/43385250/221129214-de5d5ff7-da5f-4da9-966a-c41a766ab102.png)


we have tweaked this calculation so that it works better for our game and helps acheive our objectives and now it looks like this
![image](https://user-images.githubusercontent.com/43385250/221129633-cc843d34-7fdc-4331-97ea-b7476dc37859.png)

This can obviously look confusing, but the main changes from the current system are
- All stats now scale with level as well as how many points you put into them.
- When you assign level up points these will effectively be your pokemons EVs, and though they will not have an immediate impact early game, the impact of the EVs will scale with level. They are more of an investment than an immediate reward.
- Nature is now applied to the final stat, rather than the Base stat as if the nature increases the stat it will increase the stat by 10%, and if the nature decreases the stat is will decrease the stat by 10%. Again this will not make much difference in the early levels, but will have a bigger impact at higher levels.

#### What is that weird Squigly?
![image](https://user-images.githubusercontent.com/43385250/221130475-8a0a894e-5c0f-4ee7-91f8-9683e8b7ac07.png)

This section is what I refer to as the Sigma Modifier.

the σ symbol represents the standard deviation of the pokemons stats, before this modifier and the natures is applied. The basics of this is that the bigger the range of stats (say a glass cannon has put all 100 points into special attack) the bigger this σ value will be, which means that the fraction Level/100σ will be a much smaller number.
In contrast to this if a player evenly distributes their stats the value of σ will be smaller, which means that the Sigma modifier will be bigger, and overall the total of their stats will actually by higher than the specialised glass cannon.
This effect also scales with level, so will have a higher impact in later levels.

<details>
  <summary> Graphs showing this effect </summary>
  
  **A pokemon splitting their points into all stats except HP**
  
  ![image](https://user-images.githubusercontent.com/43385250/221131574-be92bad7-3f34-4ff9-b61a-cd5096d194e4.png)

  Because their stat line is so close together they benefit a lot from the Sigma Modifier, meaning that each of there stats is increase by approximately 5 points by level 100.
  
  **A pokemon that puts all their points into def**
  
  ![image](https://user-images.githubusercontent.com/43385250/221131925-c2eb1eba-630f-413b-b12c-3c7e27e5f82a.png)

  Because they will have a very high σ they benefit very little from the Sigma Modifier. This means that allthough they have the high defence they wanted, the rest of their stats will only scale with level.
  
  Neither of these pokemon put any points into HP, but the generalised mon has a much higher HP stat at level 100.
 </details>

#### Does this change acheives our objectives?

If we go back to the list of objectives that this change had:

**Full Tank was Bad.**
-after doing some turns to kill calculations, using the same point distribution as in the above workbook we found that using this system Tanks take on average twice as long to be killed by the agressive glass cannons. They can actually tank now!
-in addition to this the wet noodle fight of 200+ turns now does not occur, as the attack stats of the tank naturally increase it means that on average fights between full tanks will take around 10 turns if no super effective moves are used. This is obviously not as fast as if two glass cannons were to fight but still much better.

**Glass cannons too stronk**
- Glass cannons have been nerfed as part of this system. with average turns to kill being increased by a range of 1.5-2 times!
- This means that Glass cannons are still powerful and can still kill other mon very quickly, but they will take some damage in the process and be less likely to sweep without the correct setup, clever use of Super Effective Moves, and a few lucky rolls.
- In a fight between two glass cannons, it is still possible for one of them to one-shot the other, but it is no longer a consistant thing, it will rely on super effective moves, crits and high damage rolls. So when it does happen it should hopefully be more of a "WOW!" moment.

**Even builds get left behind**
As demonstrated above we've added the Sigma modifier to make it so that Even builds can be more of the Jack of all Trades. They get an increase to their stats so that a generalised pokemons stat total will actually be higher than the stat total of a glass cannon or a tank. This makes this playstyle much more viable.

**The Essence of Base Stat Relations**
-Because this system scales with Base Stats a naturally fast pokemon, will always be pretty fast, even with zero investment into the stat. This means that we can allow players to point level up points wherever they want without worrying about the essence of the pokemon being effected.
-For example, Pikachu's highest base stat is speed, and it's lowest is defense. If you put all your level up points into defense because you want a chonky season 1 pikachu, not the skinny rubbish they brought out in later seasons, defense doesn't actually become the highest stat until level 20!


### How can I take part?
If you want to play with these playtest stats the GM should go to the PTU Settings and click this checkbox.

![image](https://user-images.githubusercontent.com/43385250/221135503-476c39ec-6581-4db4-a362-6afd95e8b03d.png)

I'd reccomend you let player re-allocate level up points if you do this, espcially if you are currently following the Base Stat Relations Rule.

Any feedback you have for how this new system plays out can be given to us in this [discord channel](https://discord.gg/Y8Wu2jZGzq)
