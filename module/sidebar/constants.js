export const soot_splash_params =
	[{
		filterType: "splash",
		filterId: "sootSplash",
		rank: 5,
		color: 0x999999,
		padding: 30,
		time: Math.random() * 1000,
		seed: Math.random(),
		splashFactor: 1,
		spread: 0.4,
		blend: 1,
		dimX: 2,
		dimY: 2,
		cut: false,
		textureAlphaBlend: true,
		anchorX: 0.32 + (Math.random() * 0.36),
		anchorY: 0.32 + (Math.random() * 0.36)
	}];

export const blood_splash_params =
	[{
		filterType: "splash",
		filterId: "bloodSplash",
		rank: 5,
		color: 0x990505,
		padding: 30,
		time: Math.random() * 1000,
		seed: Math.random(),
		splashFactor: 1,
		spread: 0.4,
		blend: 1,
		dimX: 2,
		dimY: 2,
		cut: false,
		textureAlphaBlend: true,
		anchorX: 0.32 + (Math.random() * 0.36),
		anchorY: 0.32 + (Math.random() * 0.36)
	}];

export const hit_params =
	[{
		filterType: "transform",
		filterId: "hit_shake",
		autoDestroy: true,
		padding: 80,
		animated:
		{
			translationX:
			{
				animType: "sinOscillation",
				val1: 0.05,
				val2: -0.05,
				loops: 5,
				loopDuration: 100
			},
			translationX:
			{
				animType: "cosOscillation",
				val1: 0.05,
				val2: -0.05,
				loops: 5,
				loopDuration: 50
			},
		}
	}];

export const ButtonHeight = 100;
export const RangeFontSize = 14;
export const RangeIconFontSizeOffset = (8);
export const MoveButtonBackgroundColor = "#333333";
export const MoveButtonTextColor = "#cccccc";

export const TypeIconWidth = 97;
export const EffectivenessBorderThickness = 5;

export const TypeIconSuffix = "IC.png";
export const TypeIconSuffixFlipped = "IC_Flipped.png";
export const CategoryIconSuffix = ".png";

// export const TypeIconPath = "systems/ptu/css/images/types/";
// export const CategoryIconPath = "systems/ptu/css/images/categories/";

export const AlternateIconPath = "systems/ptu/images/icons/";

// export const AtWillReadyMark = "∞";

// export const SceneReadyMark = "✅";
// export const SceneExpendedMark = "❌";

// export const EOTReadyMark = "🔳";
// export const EOTCooldownMark = "⏳";

// // export const DailyReadyMark = "🔆";
// export const DailyReadyMark = "<img title='Daily (Ready)' src='" + AlternateIconPath + "daily_ready" + CategoryIconSuffix + "' style='height: "+Number(RangeFontSize)+"px ;border-left-width: 0px;border-top-width: 0px;border-right-width: 0px;border-bottom-width: 0px;'></img>";
// // export const DailyExpendedMark = "💤";
// export const DailyExpendedMark = "<img title='Daily (Ready)' src='" + AlternateIconPath + "daily_expended" + CategoryIconSuffix + "' style='height: "+Number(RangeFontSize)+"px ;border-left-width: 0px;border-top-width: 0px;border-right-width: 0px;border-bottom-width: 0px;'></img>";


// export const ResetEOTMark = "🔁⏳";
// export const ResetSceneMark = "🔁❌";
// export const ResetDailyMark = "🔁💤";

export const ResetEOTMark = "<img title='Reset EOT Frequency' src='" + AlternateIconPath + "FrequencyIcon_ResetEOT.png' style='border:none; width:55px;'>";
export const ResetSceneMark = "<img title='Reset Scene Frequency' src='" + AlternateIconPath + "FrequencyIcon_ResetScene.png' style='border:none; width:55px;'>";
export const ResetDailyMark = "<img title='Reset Daily Frequency' src='" + AlternateIconPath + "FrequencyIcon_ResetDaily.png' style='border:none; width:55px;'>";

export const ResetStandardMark = "<img title='Reset Standard Action' src='" + AlternateIconPath + "reset_Standard.png' style='border:none; width:55px;'>";
export const ResetShiftMark = "<img title='Reset Shift Action' src='" + AlternateIconPath + "reset_Shift.png' style='border:none; width:55px;'>";
export const ResetSwiftMark = "<img title='Reset Swift Action' src='" + AlternateIconPath + "reset_Swift.png' style='border:none; width:55px;'>";

export const TickDamageMark = "<img title='Apply Tick Damage' src='" + AlternateIconPath + "TickDamageIcon.png' style='border:none; width:55px;'>";
export const TickHealMark = "<img title='Heal Tick Damage' src='" + AlternateIconPath + "TickHealIcon.png' style='border:none; width:55px;'>";
export const RestMark = "<img title='Rest' src='" + AlternateIconPath + "RestIcon.png' style='border:none; width:55px;'>";

// export const OrdersToggleAuto_on_Mark = "<img title='Toggle automatic order if action available at turn end. Currently active.' src='"+AlternateIconPath+"OrdersToggleAuto_on.png' style='border:none; height:25px;'>";
// export const OrdersToggleAuto_off_Mark = "<img title='Toggle automatic order if action available at turn end. Currently inactive.' src='"+AlternateIconPath+"OrdersToggleAuto_off.png' style='border:none; height:25px;'>";

export const OrdersToggleAuto_on_Mark = "<div title='Toggle automatic order if action available at turn end. Currently active.' 								style='background-color: #333333; color:#cccccc; border-left:5px solid green; 	width:100%; color: #009004;			height:25px;font-size:16px;	font-family: Modesto Condensed;	display: flex;	justify-content: center;align-items: center;'>AUTO</div>";
export const OrdersToggleAuto_off_Mark = "<div title='Toggle automatic order if action available at turn end. Currently inactive.' 								style='background-color: #333333; color:#cccccc; border-left:5px solid black; 	width:100%; color: #666;			height:25px;font-size:16px;	font-family: Modesto Condensed;	display: flex;	justify-content: center;align-items: center;'>AUTO</div>";

// export const Orders_Agility_Training_Mark = "<img title='Agility Orders: +1 bonus to Movement Capabilities and +4 to Initiative.' src='"+AlternateIconPath+"OrderButton_Agility_Training.png' style='border:none; width:140px;'>";
// export const Orders_Agility_Training_Mark = "<img title='Agility Orders: +1 bonus to Movement Capabilities and +4 to Initiative.' src='"+AlternateIconPath+"OrderButton_Agility_Training.png' style='border:none; width:134px; margin:none; padding:none;'>"
// export const Orders_Brutal_Training_Mark = "<img title='Brutal Orders: Increase the Critical-Hit and Effect Range of all attacks by +1.' src='"+AlternateIconPath+"OrderButton_Brutal_Training.png' style='border:none; width:134px; margin:none; padding:none;'>";
// export const Orders_Focused_Training_Mark = "<img title='Focused Orders: gain a +1 bonus to Accuracy Rolls and +2 to Skill Checks.' src='"+AlternateIconPath+"OrderButton_Focused_Training.png' style='border:none; width:134px; margin:none; padding:none;'>";
// export const Orders_Inspired_Training_Mark = "<img title='Inspired Orders: +1 bonus to Evasion and +2 to Save Checks.' src='"+AlternateIconPath+"OrderButton_Inspired_Training.png' style='border:none; width:134px; margin:none; padding:none;'>";
// export const Orders_Critical_Moment_Mark = "<img title='Critical Moment: The bonuses from your Pokemon’s [Training] are tripled until the end of your next turn.' src='"+AlternateIconPath+"OrderButton_Critical_Moment.png' style='border:none; width:134px; margin:none; padding:none;'>";

export const Orders_Agility_Training_Mark_off = "<div title='Agility Orders: +1 bonus to Movement Capabilities and +4 to Initiative.' 									style='background-color: #333333; color:#cccccc; border-left:5px solid darkgray; 	width:100%; 					height:25px;font-size:20px;	font-family: Modesto Condensed;	display: flex;	justify-content: center;align-items: center;'>Agility Orders</div>";
export const Orders_Brutal_Training_Mark_off = "<div title='Brutal Orders: Increase the Critical-Hit and Effect Range of all attacks by +1.' 							style='background-color: #333333; color:#cccccc; border-left:5px solid darkgray; 	width:100%; 					height:25px;font-size:20px;	font-family: Modesto Condensed;	display: flex;	justify-content: center;align-items: center;'>Brutal Orders</div>";
export const Orders_Focused_Training_Mark_off = "<div title='Focused Orders: gain a +1 bonus to Accuracy Rolls and +2 to Skill Checks.' 								style='background-color: #333333; color:#cccccc; border-left:5px solid darkgray; 	width:100%; 					height:25px;font-size:20px;	font-family: Modesto Condensed;	display: flex;	justify-content: center;align-items: center;'>Focused Orders</div>";
export const Orders_Inspired_Training_Mark_off = "<div title='Inspired Orders: +1 bonus to Evasion and +2 to Save Checks.' 												style='background-color: #333333; color:#cccccc; border-left:5px solid darkgray; 	width:100%; 					height:25px;font-size:20px;	font-family: Modesto Condensed;	display: flex;	justify-content: center;align-items: center;'>Inspired Orders</div>";
export const Orders_Critical_Moment_Mark_off = "<div title='Critical Moment: The bonuses from your Pokemon’s [Training] are tripled until the end of your next turn.' 		style='background-color: #333333; color:#cccccc; border-left:5px solid darkgray; 	width:100%; 					height:25px;font-size:20px;	font-family: Modesto Condensed;	display: flex;	justify-content: center;align-items: center;'>Critical Moment!</div>";

export const Orders_Agility_Training_Mark_on = "<div title='Agility Orders: +1 bonus to Movement Capabilities and +4 to Initiative.' 									style='background-color: #333333; color:#cccccc; border-left:5px solid green; 		width:100%; 					height:25px;font-size:20px;	font-family: Modesto Condensed;	display: flex;	justify-content: center;align-items: center;'>Agility Orders</div>";
export const Orders_Brutal_Training_Mark_on = "<div title='Brutal Orders: Increase the Critical-Hit and Effect Range of all attacks by +1.' 								style='background-color: #333333; color:#cccccc; border-left:5px solid green; 		width:100%; 					height:25px;font-size:20px;	font-family: Modesto Condensed;	display: flex;	justify-content: center;align-items: center;'>Brutal Orders</div>";
export const Orders_Focused_Training_Mark_on = "<div title='Focused Orders: gain a +1 bonus to Accuracy Rolls and +2 to Skill Checks.' 								style='background-color: #333333; color:#cccccc; border-left:5px solid green; 		width:100%; 					height:25px;font-size:20px;	font-family: Modesto Condensed;	display: flex;	justify-content: center;align-items: center;'>Focused Orders</div>";
export const Orders_Inspired_Training_Mark_on = "<div title='Inspired Orders: +1 bonus to Evasion and +2 to Save Checks.' 												style='background-color: #333333; color:#cccccc; border-left:5px solid green; 		width:100%; 					height:25px;font-size:20px;	font-family: Modesto Condensed;	display: flex;	justify-content: center;align-items: center;'>Inspired Orders</div>";
export const Orders_Critical_Moment_Mark_on = "<div title='Critical Moment: The bonuses from your Pokemon’s [Training] are tripled until the end of your next turn.' 		style='background-color: #333333; color:#cccccc; border-left:5px solid green; 		width:100%; 					height:25px;font-size:20px;	font-family: Modesto Condensed;	display: flex;	justify-content: center;align-items: center;'>Critical Moment!</div>";


export const EffectivenessColors = {
	0: "black",
	0.25: "darkred",
	0.5: "#cc6666",
	1: "white",
	1.25: "#89b3b5",
	1.5: "#6699cc",
	2: "blue",
	3: "blue",
	4: "blue",
};

export const nature_flavor_table =
{
	"Cuddly": ["salty", "spicy"],
	"Distracted": ["salty", "sour"],
	"Proud": ["salty", "dry"],
	"Decisive": ["salty", "bitter"],
	"Patient": ["salty", "sweet"],
	"Desperate": ["spicy", "salty"],
	"Lonely": ["spicy", "sour"],
	"Adamant": ["spicy", "dry"],
	"Naughty": ["spicy", "bitter"],
	"Brave": ["spicy", "sweet"],
	"Stark": ["sour", "salty"],
	"Bold": ["sour", "spicy"],
	"Impish": ["sour", "dry"],
	"Lax": ["sour", "bitter"],
	"Relaxed": ["sour", "sweet"],
	"Curious": ["dry", "salty"],
	"Modest": ["dry", "spicy"],
	"Mild": ["dry", "sour"],
	"Rash": ["dry", "bitter"],
	"Quiet": ["dry", "sweet"],
	"Dreamy": ["bitter", "salty"],
	"Calm": ["bitter", "spicy"],
	"Gentle": ["bitter", "sour"],
	"Careful": ["bitter", "dry"],
	"Sassy": ["bitter", "sweet"],
	"Skittish": ["sweet", "salty"],
	"Timid": ["sweet", "spicy"],
	"Hasty": ["sweet", "sour"],
	"Jolly": ["sweet", "dry"],
	"Naive": ["sweet", "bitter"],
	"Hardy": ["neutral", "neutral"],
	"Docile": ["neutral", "neutral"],
	"Bashful": ["neutral", "neutral"],
	"Quirky": ["neutral", "neutral"],
	"Serious": ["neutral", "neutral"],
	"Composed": ["neutral", "neutral"]
};

export const digestionsBuffs =
{
	"candy bar": { "description": "Snack. Grants a Digestion Buff that heals 5 Hit Points.", "self_effects": { "healing": 5 } },
	"honey": { "description": "Snack. Grants a Digestion Buff that heals 5 Hit Points. May be used as Bait.", "self_effects": { "healing": 5 } },
	"leftovers": { "description": "Snack. When their Digestion Buff is traded in, the user recovers 1/16th of their max Hit Points at the beginning of each turn for the rest of the encounter.", "self_effects": { "healing_fraction": 16 }, "duration": { "scene": true } },
	"black sludge": { "description": "Poison-Type Pokémon may consume the Black Sludge as a Snack Item; when the Digestion Buff is traded in, they recover 1/8th of their Max Hit Points at the beginning of each turn for the rest of the encounter.", "self_effects": { "healing_fraction": 8 }, "duration": { "scene": true } },

	"salty surprise": { "description": "The user may trade in this Snack’s Digestion Buff when being hit by an attack to gain 5 Temporary Hit Points. If the user likes Salty Flavors, they gain 10 Temporary Hit Points Instead. If the user dislikes Salty Food, they become Enraged.", "flavor": "salty", "self_effects": { "healing": 5 }, "enjoyed_effects": { "healing": 10 }, "disliked_effects": { "condition_inflict": "Rage" }, },
	"spicy wrap": { "description": "The user may trade in this Snack’s Digestion Buff when making a Physical attack to deal +5 additional Damage. If the user prefers Spicy Food, it deals +10 additional Damage instead. If the user dislikes Spicy Food, they become Enraged.", "flavor": "spicy", "self_effects": { "physical_damage_mod": 5 }, "enjoyed_effects": { "physical_damage_mod": 10 }, "disliked_effects": { "condition_inflict": "Rage" }, },
	"sour candy": { "description": "The user may trade in this Snack’s Digestion Buff when being hit by a Physical Attack to increase their Damage Reduction by +5 against that attack. If the user prefers Sour Food, they gain +10 Damage Reduction instead. If the user dislikes Sour Food, they become Enraged.", "flavor": "sour", "self_effects": { "physical_damage_reduction_mod": 5 }, "enjoyed_effects": { "physical_damage_reduction_mod": 10 }, "disliked_effects": { "condition_inflict": "Rage" }, },
	"dry wafer": { "description": "The user may trade in this Snack’s Digestion Buff when making a Special attack to deal +5 additional Damage. If the user prefers Dry Food, it deals +10 additional Damage instead. If the user dislikes Dry Food, they become Enraged.", "flavor": "dry", "self_effects": { "special_damage_mod": 5 }, "enjoyed_effects": { "special_damage_mod": 10 }, "disliked_effects": { "condition_inflict": "Rage" }, },
	"bitter treat": { "description": "The user may trade in this Snack’s Digestion Buff when being hit by a Special Attack to increase their Damage Reduction by +5 against that attack. If the user prefers Bitter Food, they gain +10 Damage Reduction instead. If the user dislikes Bitter Food, they become Enraged.", "flavor": "bitter", "self_effects": { "special_damage_reduction_mod": 5 }, "enjoyed_effects": { "special_damage_reduction_mod": 10 }, "disliked_effects": { "condition_inflict": "Rage" }, },
	"sweet confection": { "description": "The user may trade in this Snack’s Digestion Buff to gain +4 Evasion until the end of their next turn. If the user prefers Sweet Food, they gain +4 Accuracy as well. If the user dislikes Sweet Food, they become Enraged.", "flavor": "sweet", "self_effects": { "evasion_mod": 4 }, "enjoyed_effects": { "evasion_mod": 4, "accuracy_mod": 4 }, "disliked_effects": { "condition_inflict": "Rage" }, "duration": { "rounds": 1 } },

	"mental herb": { "description": "Cures all Volatile Status Effects.", "self_effects": { "cure_condition": "BadSleep", "cure_condition": "Sleep", "cure_condition": "Flinch", "cure_condition": "Cursed", "cure_condition": "Confused", "cure_condition": "Disabled", "cure_condition": "Infatuation", "cure_condition": "Rage", "cure_condition": "Suppressed", } },
	"power herb": { "description": "Eliminates the Set-Up turn of Moves with the Set-Up Keyword.", "self_effects": { "negate_setup": true } },
	"white herb": { "description": "Any negative Combat Stages are set to 0.", "self_effects": { "reset_negative_combat_stages": true } },

	"cheri berry": { "description": "Cures Paralysis, Cool Poffin Ingredient.", "self_effects": { "cure_condition": "Paralysis" } },
	"chesto berry": { "description": "Cures Sleep, Beauty Poffin Ingredient", "self_effects": { "cure_condition": "Sleep" } },
	"pecha berry": { "description": "Cures Poison, Cute Poffin Ingredient", "self_effects": { "cure_condition": "Poisoned" } },
	"rawst berry": { "description": "Cures Burn, Smart Poffin Ingredient", "self_effects": { "cure_condition": "Burned" } },
	"aspear berry": { "description": "Cures Freeze, Tough Poffin Ingredient", "self_effects": { "cure_condition": "Frozen" } },
	"oran berry": { "description": "Restores 5 Hit Points", "self_effects": { "healing": 5 } },
	"persim berry": { "description": "Cures Confusion", "self_effects": { "cure_condition": "Confused" } },
	"razz berry": { "description": "Cool Poffin Ingredient" },
	"bluk berry": { "description": "Beauty Poffin Ingredient" },
	"nanab berry": { "description": "Cute Poffin Ingredient" },
	"wepear berry": { "description": "Smart Poffin Ingredient" },
	"pinap berry": { "description": "Tough Poffin Ingredient" },
	"lum berry": { "description": "Cures any single status ailment", "self_effects": { "cure_any_one_condition": true } },
	"sitrus berry": { "description": "Restores 15 Hit Points", "self_effects": { "healing": 15 } },
	"figy berry": { "description": "Spicy Treat, Cool Poffin Ingredient.", "flavor": "spicy", "self_effects": { "healing_fraction_divisor": 8 }, "enjoyed_effects": { "healing_fraction_divisor": 6 }, "disliked_effects": { "condition_inflict": "Confused" }, },
	"wiki berry": { "description": "Dry Treat, Beauty Poffin Ingredient.", "flavor": "dry", "self_effects": { "healing_fraction_divisor": 8 }, "enjoyed_effects": { "healing_fraction_divisor": 6 }, "disliked_effects": { "condition_inflict": "Confused" }, },
	"mago berry": { "description": "Sweet Treat, Cute Poffin Ingredient.", "flavor": "sweet", "self_effects": { "healing_fraction_divisor": 8 }, "enjoyed_effects": { "healing_fraction_divisor": 6 }, "disliked_effects": { "condition_inflict": "Confused" }, },
	"aguav berry": { "description": "Bitter Treat, Smart Poffin Ingredient.", "flavor": "bitter", "self_effects": { "healing_fraction_divisor": 8 }, "enjoyed_effects": { "healing_fraction_divisor": 6 }, "disliked_effects": { "condition_inflict": "Confused" }, },
	"iapapa berry": { "description": "Sour Treat, Tough Poffin Ingredient.", "flavor": "sour", "self_effects": { "healing_fraction_divisor": 8 }, "enjoyed_effects": { "healing_fraction_divisor": 6 }, "disliked_effects": { "condition_inflict": "Confused" }, },
	"liechi berry": { "description": "+1 Attack CS.", "self_effects": { "stage_change": { "atk": 1 }, } },
	"ganlon berry": { "description": "+1 Defense CS.", "self_effects": { "stage_change": { "def": 1 }, } },
	"salac berry": { "description": "+1 Speed CS.", "self_effects": { "stage_change": { "spd": 1 }, } },
	"petaya berry": { "description": "+1 Special Attack CS.", "self_effects": { "stage_change": { "spatk": 1 }, } },
	"apicot berry": { "description": "+1 Special Defense CS.", "self_effects": { "stage_change": { "spdef": 1 }, } },
	"lansat berry": { "description": "Increases Critical Range by +1 for the remainder of the encounter.", "self_effects": { "crit_mod": { "value": 1, "duration": { "scene": true } }, } },
	"starf berry": { "description": "+2 CS to a random Stat. May be used only at 25% HP or lower.", "self_effects": { "stage_change": { "random": 2 }, } },
	"enigma berry": { "description": "User gains Temporary HP equal to 1/6th of their Max HP when hit by a Super Effective Move", "self_effects": { "temp_pct_HP_divisor": 6, } },
	"micle berry": { "description": "Increases Accuracy by +1", "self_effects": { "accuracy_mod": { "value": 1, "duration": { "scene": true } }, } },
	"jaboca berry": { "description": "Foe dealing Physical Damage to the user loses 1/8 of their Maximum HP.", "physical_damager_effects": { "damage_pct_divisor": 8, } },
	"rowap berry": { "description": "Foe dealing Special Damage to the user loses 1/8 of their Maximum HP.", "special_damager_effects": { "damage_pct_divisor": 8, } },
	"cornn berry": { "description": "Cures Disabled Condition", "self_effects": { "cure_condition": "Disabled" } },
	"magost berry": { "description": "Cures Disabled Condition", "self_effects": { "cure_condition": "Rage" } },
	"rabuta berry": { "description": "Cures Disabled Condition", "self_effects": { "cure_condition": "Suppressed" } },
	"nomel berry": { "description": "Cures Disabled Condition", "self_effects": { "cure_condition": "Infatuated" } },
	"spelon berry": { "description": "Cool or Beauty Poffin Ingredient" },
	"pamtre berry": { "description": "Cute or Beauty Poffin Ingredient" },
	"watmel berry": { "description": "Cute or Smart Poffin Ingredient" },
	"durin berry": { "description": "Smart or Tough Poffin Ingredient" },
	"belue berry": { "description": "Cool or Tough Poffin Ingredient" },
	"leppa berry": { "description": "Restores a Scene Move.", "self_effects": { "refresh_one_scene_move": true } },
	"pomeg berry": { "description": "HP Suppressant." },
	"kelpsy berry": { "description": "Attack Suppressant." },
	"qualot berry": { "description": "Defense Suppressant." },
	"hondew berry": { "description": "Special Attack Suppressant." },
	"grepa berry": { "description": "Special Defense Suppressant." },
	"tamato berry": { "description": "Speed Suppressant." },
	"occa berry": { "description": "Weakens foe’s super effective Fire-type move.", "self_effects": { "resist_SE_move_of_type": "fire" } },
	"passho berry": { "description": "Weakens foe’s super effective Water-type move.", "self_effects": { "resist_SE_move_of_type": "water" } },
	"wacan berry": { "description": "Weakens foe’s super effective Electric-type move.", "self_effects": { "resist_SE_move_of_type": "electric" } },
	"rindo berry": { "description": "Weakens foe’s super effective Grass-type move.", "self_effects": { "resist_SE_move_of_type": "grass" } },
	"yache berry": { "description": "Weakens foe’s super effective Ice-type move.", "self_effects": { "resist_SE_move_of_type": "ice" } },
	"chople berry": { "description": "Weakens foe’s super effective Fighting-type move.", "self_effects": { "resist_SE_move_of_type": "fighting" } },
	"kebia berry": { "description": "Weakens foe’s super effective Poison-type move.", "self_effects": { "resist_SE_move_of_type": "poison" } },
	"shuca berry": { "description": "Weakens foe’s super effective Ground-type move.", "self_effects": { "resist_SE_move_of_type": "ground" } },
	"coba berry": { "description": "Weakens foe’s super effective Flying-type move.", "self_effects": { "resist_SE_move_of_type": "flying" } },
	"payapa berry": { "description": "Weakens foe’s super effective Psychic-type move.", "self_effects": { "resist_SE_move_of_type": "psychic" } },
	"tanga berry": { "description": "Weakens foe’s super effective Bug-type move.", "self_effects": { "resist_SE_move_of_type": "bug" } },
	"charti berry": { "description": "Weakens foe’s super effective Rock-type move.", "self_effects": { "resist_SE_move_of_type": "rock" } },
	"kasib berry": { "description": "Weakens foe’s super effective Ghost-type move.", "self_effects": { "resist_SE_move_of_type": "ghost" } },
	"haban berry": { "description": "Weakens foe’s super effective Dragon-type move.", "self_effects": { "resist_SE_move_of_type": "dragon" } },
	"colbur berry": { "description": "Weakens foe’s super effective Dark-type move.", "self_effects": { "resist_SE_move_of_type": "dark" } },
	"babiri berry": { "description": "Weakens foe’s super effective Steel-type move.", "self_effects": { "resist_SE_move_of_type": "steel" } },
	"chilan berry": { "description": "Weakens foe’s super effective Normal-type move.", "self_effects": { "resist_SE_move_of_type": "normal" } },
	"roseli berry": { "description": "Weakens foe’s super effective Fairy-type move.", "self_effects": { "resist_SE_move_of_type": "fairy" } },
	"custap berry": { "description": "Grants the Priority keyword to any Move. May only be used at 25% HP or lower.", "self_effects": { "grant_priority": true } },
	"kee berry": { "description": "+1 Defense CS. Activates as a Free Action when hit by a Physical Move.", "self_effects": { "stage_change": { "def": 1 }, } },
	"maranga berry": { "description": "+1 Special Defense CS. Activates as a Free Action when hit by a Special Move.", "self_effects": { "stage_change": { "spdef": 1 }, } },

};

// export const AbilityIcon = "Ability: ";
export const AbilityIcon = "";

export const RangeIcon = "<img title='Ranged' src='" + AlternateIconPath + "ranged" + CategoryIconSuffix + "'></img>";
export const MeleeIcon = "<img title='Melee' src='" + AlternateIconPath + "melee" + CategoryIconSuffix + "'></img>";
export const SelfIcon = "<img title='Self' src='" + AlternateIconPath + "self" + CategoryIconSuffix + "'></img>";
export const BurstIcon = "<img title='Burst' src='" + AlternateIconPath + "burst" + CategoryIconSuffix + "'></img>";
export const BlastIcon = "<img title='Blast' src='" + AlternateIconPath + "blast" + CategoryIconSuffix + "'></img>";
export const ConeIcon = "<img title='Cone' src='" + AlternateIconPath + "cone" + CategoryIconSuffix + "'></img>";
export const LineIcon = "<img title='Line' src='" + AlternateIconPath + "line" + CategoryIconSuffix + "'></img>";
export const BlessingIcon = "<img title='Blessing' src='" + AlternateIconPath + "blessing" + CategoryIconSuffix + "'></img>";
export const FriendlyIcon = "<img title='Friendly' src='" + AlternateIconPath + "friendly" + CategoryIconSuffix + "'></img>";
export const SonicIcon = "<img title='Sonic' src='" + AlternateIconPath + "sonic" + CategoryIconSuffix + "'></img>";
export const SocialIcon = "<img title='Social' src='" + AlternateIconPath + "social" + CategoryIconSuffix + "'></img>";
export const InterruptIcon = "<img title='Interrupt' src='" + AlternateIconPath + "interrupt" + CategoryIconSuffix + "'></img>";
export const ShieldIcon = "<img title='Shield' src='" + AlternateIconPath + "shield" + CategoryIconSuffix + "'></img>";
export const TriggerIcon = "<img title='Trigger' src='" + AlternateIconPath + "trigger" + CategoryIconSuffix + "'></img>";
export const HealingIcon = "<img title='Healing' src='" + AlternateIconPath + "healing" + CategoryIconSuffix + "'></img>";
export const DoubleStrikeIcon = "<img title='Double Strike' src='" + AlternateIconPath + "doublestrike_icon" + CategoryIconSuffix + "'></img>";
export const FiveStrikeIcon = "<img title='Five Strike' src='" + AlternateIconPath + "fivestrike_icon" + CategoryIconSuffix + "'></img>";
export const GroundsourceIcon = "<img title='Groundsource' src='" + AlternateIconPath + "groundsource" + CategoryIconSuffix + "'></img>";
export const FieldIcon = "<img title='Field' src='" + AlternateIconPath + "field" + CategoryIconSuffix + "'></img>";
export const SmiteIcon = "<img title='Smite' src='" + AlternateIconPath + "smite" + CategoryIconSuffix + "'></img>";
export const ExhaustIcon = "<img title='Exhaust' src='" + AlternateIconPath + "exhaust" + CategoryIconSuffix + "'></img>";
export const SwiftActionIcon = "<img title='Swift Action' src='" + AlternateIconPath + "SwiftAction" + CategoryIconSuffix + "'></img>";
export const ShiftActionIcon = "<img title='Shift Action' src='" + AlternateIconPath + "ShiftAction" + CategoryIconSuffix + "'></img>";
export const StandardActionIcon = "<img title='Standard Action' src='" + AlternateIconPath + "StandardAction" + CategoryIconSuffix + "'></img>";
export const FullActionIcon = "<img title='Full (Standard + Shift) Action' src='" + AlternateIconPath + "FullAction" + CategoryIconSuffix + "'></img>";
export const SetupIcon = "<img title='Setup' src='" + AlternateIconPath + "setup" + CategoryIconSuffix + "'></img>";
export const PassIcon = "<img title='Pass' src='" + AlternateIconPath + "pass" + CategoryIconSuffix + "'></img>";
export const IllusionIcon = "<img title='Illusion' src='" + AlternateIconPath + "illusion" + CategoryIconSuffix + "'></img>";
export const CoatIcon = "<img title='Coat' src='" + AlternateIconPath + "coat" + CategoryIconSuffix + "'></img>";

export const RangeIconPath = AlternateIconPath + "ranged" + CategoryIconSuffix;
export const MeleeIconPath = AlternateIconPath + "melee" + CategoryIconSuffix;
export const SelfIconPath = AlternateIconPath + "self" + CategoryIconSuffix;
export const BurstIconPath = AlternateIconPath + "burst" + CategoryIconSuffix;
export const BlastIconPath = AlternateIconPath + "blast" + CategoryIconSuffix;
export const ConeIconPath = AlternateIconPath + "cone" + CategoryIconSuffix;
export const LineIconPath = AlternateIconPath + "line" + CategoryIconSuffix;
export const BlessingIconPath = AlternateIconPath + "blessing" + CategoryIconSuffix;
export const FriendlyIconPath = AlternateIconPath + "friendly" + CategoryIconSuffix;
export const SonicIconPath = AlternateIconPath + "sonic" + CategoryIconSuffix;
export const SocialIconPath = AlternateIconPath + "social" + CategoryIconSuffix;
export const InterruptIconPath = AlternateIconPath + "interrupt" + CategoryIconSuffix;
export const ShieldIconPath = AlternateIconPath + "shield" + CategoryIconSuffix;
export const TriggerIconPath = AlternateIconPath + "trigger" + CategoryIconSuffix;
export const HealingIconPath = AlternateIconPath + "healing" + CategoryIconSuffix;
export const DoubleStrikeIconPath = AlternateIconPath + "doublestrike_icon" + CategoryIconSuffix;
export const FiveStrikeIconPath = AlternateIconPath + "fivestrike_icon" + CategoryIconSuffix;
export const GroundsourceIconPath = AlternateIconPath + "groundsource" + CategoryIconSuffix;
export const FieldIconPath = AlternateIconPath + "field" + CategoryIconSuffix;
export const SmiteIconPath = AlternateIconPath + "smite" + CategoryIconSuffix;
export const ExhaustIconPath = AlternateIconPath + "exhaust" + CategoryIconSuffix;
export const SwiftActionIconPath = AlternateIconPath + "SwiftAction" + CategoryIconSuffix;
export const ShiftActionIconPath = AlternateIconPath + "ShiftAction" + CategoryIconSuffix;
export const StandardActionIconPath = AlternateIconPath + "StandardAction" + CategoryIconSuffix;
export const FullActionIconPath = AlternateIconPath + "FullAction" + CategoryIconSuffix;
export const SetupIconPath = AlternateIconPath + "setup" + CategoryIconSuffix;
export const PassIconPath = AlternateIconPath + "pass" + CategoryIconSuffix;
export const IllusionIconPath = AlternateIconPath + "illusion" + CategoryIconSuffix;
export const CoatIconPath = AlternateIconPath + "coat" + CategoryIconSuffix;

export const SwiftActionBackground = AlternateIconPath + "SwiftActionBackground" + CategoryIconSuffix;
export const StandardActionBackground = AlternateIconPath + "StandardActionBackground" + CategoryIconSuffix;
export const ShiftActionBackground = AlternateIconPath + "ShiftActionBackground" + CategoryIconSuffix;
export const FullActionBackground = AlternateIconPath + "FullActionBackground" + CategoryIconSuffix;
export const StaticBackground = AlternateIconPath + "StaticBackground" + CategoryIconSuffix;
export const FreeActionBackground = AlternateIconPath + "FreeActionBackground" + CategoryIconSuffix;
export const ExtendedActionBackground = AlternateIconPath + "ExtendedActionBackground" + CategoryIconSuffix;


export const bodyBackground = AlternateIconPath + "BodyBackground" + CategoryIconSuffix;
export const mindBackground = AlternateIconPath + "MindBackground" + CategoryIconSuffix;
export const spiritBackground = AlternateIconPath + "SpiritBackground" + CategoryIconSuffix;


export const SkillColors = {
	"Pathetic": "#cfe2f3",
	"Untrained": "#9fc5e8",
	"Novice": "#6fa8dc",
	"Adept": "#3d85c6",
	"Expert": "#0b5394",
	"Master": "#073763"
};

export const SkillRankNumberColors = {
	1: "#cfe2f3",
	2: "#9fc5e8",
	3: "#6fa8dc",
	4: "#3d85c6",
	5: "#0b5394",
	6: "#073763"
};

export const VolatileAfflictions = [
	"Flinch",
	"Sleep",
	"Cursed",
	"Confused",
	"Disabled",
	"Infatuation",
	"Rage",
	"BadSleep",
	"Suppressed",
];

export const UIButtonClickSound = "buttonclickrelease.wav";
export const UIPopupSound = "packopen_6_A_cardflip.wav";

export const RefreshEOTMovesSound = "In-Battle%20Recall%20Switch%20Flee%20Run.mp3";
export const RefreshSceneMovesSound = "In-Battle%20Recall%20Switch%20Flee%20Run.mp3";
export const RefreshDailyMovesSound = "In-Battle%20Recall%20Switch%20Flee%20Run.mp3";

export const stat_up_sound_file = "Stat%20Rise%20Up.mp3";
export const stat_zero_sound_file = "Stat%20Fall%20Down.mp3";
export const stat_down_sound_file = "Stat%20Fall%20Down.mp3";
export const heal_sound_file = "In-Battle%20Held%20Item%20Activate.mp3";
export const damage_sound_file = "Hit%20Weak%20Not%20Very%20Effective.mp3";

export const PhysicalIcon = "Physical.png";
export const SpecialIcon = "Special.png";
export const StatusIcon = "Status.png";

export const DISPOSITION_HOSTILE = -1;
export const DISPOSITION_NEUTRAL = 0;
export const DISPOSITION_FRIENDLY = 1;

export const MoveMessageTypes = {
	DAMAGE: 'damage',
	TO_HIT: 'to-hit',
	DETAILS: 'details',
	FULL_ATTACK: 'full-attack'
};