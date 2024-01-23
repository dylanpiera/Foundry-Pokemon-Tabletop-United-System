/**@type {Array<function>} */
itemlabelers = []

/**@param item {PTUItemItem}
 * @return {Set<string>}
 */
function travel(item) {
    const travelNameList = [
        "Bait",
        "Collection Jar",
        "First Aid Kit",
        "Fishing Lure",
        "Saddle",
        "Basic Rope",
        "Utility Rope",
        "Sturdy Rope",
        "Sleeping Bag",
        "Tent",
        "Lighter",
        "Waterproof Lighter",
        "Flashlight",
        "Waterproof Flashlight",
        "Water Filter",
        "Repel",
        "Super Repel",
        "Max Repel"
    ]
    if (travelNameList.includes(item.name)) {
        return new Set(["Travel"])
    }
    return new Set();
}
itemlabelers.push(travel)

/**@param item {PTUItemItem}
 * @return {Set<string>}
 */
function medicine(item) {
    const nameList = [
        "Potion",
        "Super Potion",
        "Hyper Potion",
        "Antidote",
        "Paralyze Heal",
        "Burn Heal",
        "Ice Heal",
        "Full Heal",
        "Full Restore",
        "Revive",
        "Max Revive",
        "Energy Powder",
        "Energy Root",
        "Heal Power",
        "Revival Herb",
        "Bandages",
        "Poultices"
    ];
    if (nameList.includes(item.name)) {
        return new Set(["Medicine"])
    }
    return new Set();
}
itemlabelers.push(medicine)


/**@param item {PTUItemItem}
 * @return {Set<string>}
 */
function equipments(item) {
    const equips = {
        "Light Armor": ["Body"],
        "Heavy Armor": ["Body"],
        "Special Armor": ["Body"],
        "Physical Armor": ["Body"],
        "Stealth Clothes": ["Body"],
        "Fancy Clothes": ["Body"],
        "Dark Vision Goggles": ["Head"],
        "X-Ray Goggles": ["Head"],
        "Gas Mask": ["Head"],
        "Helmet": ["Head"],
        "Re-Breather": ["Head"],
        "Sunglasses": ["Head"],
        "Snow Boots": ["Feet"],
        "Running Shoes": ["Feet"],
        "Flippers": ["Feet"],
        "Jungle Boots": ["Feet"],
        "Fishing Rod": ["Both Hands"],
        "Old Rod": ["Both Hands"],
        "Good Rod": ["Both Hands"],
        "Super Rod": ["Both Hands"],
        "Glue Cannone": ["Both Hands"],
        "Hand Net": ["Both Hands"],
        "Weighted Net": ["Both Hands"],
        "Capture Styler": ["Main Hand"],
        "Shield": ["Off-Hand", "Both Hand"],
        "Wonder Launcher": ["Both Hands"],
        "Focus": ["Accessory"],
        "Snag Machine": ["Accessory"],
        "Mega Ring": ["Accessory"],
    }
    if (Object.keys(equips).includes(item.name)) {
        return new Set(["Equipment", ...equips[item.name]])
    }
    return new Set();
}

itemlabelers.push(equipments)


/**@param item {PTUItemItem}
 * @return {Set<string>}
 */
function xitems(item) {
    const nameList = [
        "X Attack",
        "X Defend",
        "X Special",
        "X Sp. Def.",
        "X Speed",
        "Dire Hit",
        "X Accuracy",
        "Guard Spec",
        "Wonder Launcher"
    ]
    if (nameList.includes(item.name)) {
        return new Set(["X-Item", "Combat"])
    }
    return new Set();
}

itemlabelers.push(xitems)

/**@param item {PTUItemItem}
 * @return {Set<string>}
 */
function books(item) {
    if (/Rank 2.*(Education|Survival)/.test(item.system.effect) && /Rank 1.*(Education|Survival)/.test(item.system.effect)) {
        return new Set(["Book"]);
    }
    return new Set();
}

itemlabelers.push(books)

/**@param item {PTUItemItem}
 * @return {Set<string>}
 */
function berries(item) {
    if (item.name.split(" ").includes("Berry")) {
        if (item.system.cost == 150) return new Set(["Berry", "Tier 1"]);
        if (item.system.cost == 250) return new Set(["Berry", "Tier 1"]);
        if (item.system.cost == 500) return new Set(["Berry", "Tier 1"]);
    }
    return new Set();
}

itemlabelers.push(berries)

/**@param item {PTUItemItem}
 * @return {Set<string>}
 */
function herbs(item) {
    const nameList = [
        "Energy Root",
        "Revival Herb",
        "Mental Herb",
        "Power Herb",
        "White Herb",
        "Tiny Mushroom",
        "Big Mushroom",
        "Balm Mushroom"
    ]
    if (nameList.includes(item.name)) {
        return new Set(["Herbal"]);
    }
    return new Set();
}

itemlabelers.push(herbs)

/**@param item {PTUItemItem}
 * @return {Set<string>}
 */
function snacks(item) {
    const nameList = [
        "Candy Bar",
        "Honey",
        "Leftovers",
        "Black Sludge"
    ];
    if (nameList.includes(item.name)) {
        return new Set(["Snack", "Food"]);
    }
    return new Set();
}

itemlabelers.push(snacks)

/**@param item {PTUItemItem}
 * @return {Set<string>}
 */
function refreshments(item) {
    const nameList = [
        "Enriched Water",
        "Shuckle's Berry Juice",
        "Super Soda Pop",
        "Sparkling Lemonade",
        "MooMoo Milk"
    ];
    if (nameList.includes(item.name)) {
        return new Set(["Refreshment", "Food"]);
    }
    return new Set();
}

itemlabelers.push(refreshments)

/**@param item {PTUItemItem}
 * @return {Set<string>}
 */
function otherfoods(item) {
    const nameList = [
        "Baby Food"
    ];
    if (nameList.includes(item.name)) {
        return new Set(["Food"]);
    }
    return new Set();
}

itemlabelers.push(otherfoods)

/**@param item {PTUItemItem}
 * @return {Set<string>}
 */
function shards(item) {
    if (item.name.split(" ").includes("Shard")) {
        return new Set(["Shard"]);
    }
    return new Set();
}

itemlabelers.push(shards)

/**@param item {PTUItemItem}
 * @return {Set<string>}
 */
function craftings(item) {
    const nameList = [
        "Chemistry Set",
        "Cooking Set",
        "Dowsing Rod",
        "Poffin Mixer",
        "Poké Ball Tool Box",
        "Portable Grower",
        "Berry Planter"
    ];
    if (nameList.includes(item.name) || shards(item).has("Shard")) {
        return new Set(["Crafting"])
    }
    return new Set();
}

itemlabelers.push(craftings)

/**@param item {PTUItemItem}
 * @return {Set<string>}
 */
function tms(item) {
    if (/TM[0-9]/.test(item.name)) {
        return new Set(["TM"])
    }
    return new Set();
}

itemlabelers.push(tms)

/**@param item {PTUItemItem}
 * @return {Set<string>}
 */
function pkmnhelditems(item) {
    const helddic = {
        "Big Root": [],
        "Bright Powder": [],
        "Choice Item": [],
        "Choice Item (Attack)": [],
        "Choice Item (Defense)": [],
        "Choice Item (Special Attack)": [],
        "Choice Item (Special Defense)": [],
        "Choice Item (Speed)": [],
        "Contest Accessory": [],
        "Contest Fashion": [],
        "Everstone": [],
        "Eviolite": [],
        "Expert Belt": ["Accessory"],
        "Flame Orb": ["Off-Hand"],
        "Focus Band": ["Accessory"],
        "Focus Sash": ["Accessory"],
        "Full Incense": [],
        "Go-Goggles": ["Head"],
        "Iron Ball": ["Main Hand", "Off-Hand"],
        "King's Rock": ["Head"],
        "Lagging Item": [],
        "Lagging Item (Attack)": [],
        "Lagging Item (Defense)": [],
        "Lagging Item (Special Attack)": [],
        "Lagging Item (Special Defense)": [],
        "Lagging Item (Speed)": [],
        "Lax Incense": [],
        "Life Orb": ["Off-Hand"],
        "Luck Incense": [],
        "Quick Claw": ["Accessory"],
        "Razor Claw": ["Accessory"],
        "Razor Fang": ["Accessory"],
        "Safety Goggles": ["Head", "Accessory"],
        "Shell Bell": ["Accessory"],
        "Shock Collar": ["Accessory"],
        "Stat Boosters": ["Accessory"],
        "Toxic Orb": ["Off-Hand"],
        "Type Boosters": ["Accessory"],
        "Type Brace": ["Accessory"],
        "Winter Cloak": ["Accessory"],
        "Type Gem": ["Accessory", "Off-Hand"],
        "Type Plate": ["Accessory"],
        "Mega Stone": [],
        "Metal Powder": [],
        "Rare Leek": [],
        "Thick Club": [],
        "Pink Pearl": [],
    }
    if (Object.keys(helddic).includes(item.name)) {
        return new Set(["Held Item", ...helddic[item.name]])
    }
    const typed = {
        "Type Gem": ["Accessory", "Off-Hand"],
        "Type Plate": ["Accessory"],
        "Type Boosters": ["Accessory"],
        "Type Brace": ["Accessory"],
    }
    const x = Object.keys(typed).find(n => item.name.startsWith(n))
    if(x){
        return new Set(["Held Item", ...typed[x]])
    }
    return new Set();
}

itemlabelers.push(pkmnhelditems)

/**@param item {PTUItem}
 * @return {Set<string>}
 */
function keepsakes(item) {
    const nameList = [
        "Deep Sea Scale",
        "Deep Sea Tooth",
        "Dragon Scale",
        "Dubious Disc",
        "Electirizer",
        "King’s Rock",
        "Oval Stone",
        "Magmarizer",
        "Metal Coat",
        "Protector",
        "Razor Claw",
        "Razor Fang",
        "Reaper Cloth",
        "Sachet",
        "Up-Grade",
        "Whipped Dream",
    ]
    if (nameList.includes(item.name)) {
        return new Set(["Keepsake"])
    }
    return new Set();
}

itemlabelers.push(keepsakes)

/**@param item {PTUItem}
 * @return {Set<string>}
 */
function vitamins(item) {
    const nameList = [
        "HP Up",
        "Protein",
        "Iron",
        "Calcium",
        "Zinc",
        "Carbos",
        "Heart Booster",
        "PP Up"
    ]
    if (nameList.includes(item.name)) {
        return new Set(["Vitamin"])
    }
    return new Set();
}

itemlabelers.push(vitamins)

/**@param item {PTUItem}
 * @return {Set<string>}
 */
function combats(item) {
    const nameList = [
        "Caltrops",
        "Toxic Caltrops",
        "Dream Mist",
        "Magic Flute",
        "Cleanse Tag",
        "Smoke Ball"
    ]
    if (nameList.includes(item.name) || item.name.includes("Pester Ball")) {
        return new Set(["Combat"])
    }
    return new Set();
}

itemlabelers.push(combats)

/**@param item {PTUItem}
 * @return {Set<string>}
 */
function pokeballs(item) {
    if (item.name.split(" ").includes("Ball") && !item.name.includes("Poké") && !item.name.includes("Pester") && !item.name.includes("Smoke") && !item.name.includes("Iron")) {
        return new Set(["Poké Ball"])
    }
    return new Set();
}

itemlabelers.push(pokeballs)

/**@param item {PTUItem}
 * @return {Set<string>}
 */
function megastones(item) {

    if (item.name.split(" ").some(s => s.endsWith("ite")) && item.name !== "Eviolite" && !item.name.includes("White")) {
        return new Set(["Mega Stone"])
    }
    if (["Mega Stone"].includes(item.name)) {
        return new Set(["Mega Stone"])
    }
    return new Set();
}

itemlabelers.push(megastones)

/**@param item {PTUItem}
 * @return {Set<string>}
 */
function augmentss(item) {
    const augDic = {
        "Datajack": "Augmentation",
        "Enhanced Sight": "Eyes-Augment",
        "Smart Vision": "Eyes-Augment",
        "Synthetic Muscle": "Limbs-Augment",
        "Embedded Weaponry": "Limbs-Augment",
        "Medical Nanobots": "Body-Augment",
        "Wired Reflexes": "Body-Augment",
        "Thermal-Optical Camouflage": "Dermal-Augment",
        "Dermal Plating": "Dermal-Augment",
    }
    if (Object.keys(augDic).includes(item.name)) {
        return new Set(["Augmentation", augDic[item.name]])
    }
    return new Set();
}

itemlabelers.push(augmentss)


/**@param item {PTUItem}
 * @return {Set<string>}
 */
function artificing(item) {
    const nameList = [
        "Type Gem",
        "Type Plate",
        "Type Booster",
        "Type Brace",
        "Focus",
        "Stat Booster",
        "Rainbow Gem",
        "Shard",
    ]
    if (nameList.some(x => item.name.startsWith(x) || item.name.endsWith(x) )) {
        return new Set(["Artificer"])
    }
    return new Set();
}
itemlabelers.push(artificing)


/**@param item {PTUItem}
 * @return {Set<string>}
 */
function fashioniste(item) {
    const nameList = [
        "Contest Accessory",
        "Contest Fashion",
        "Contest Fashion (Cool)",
        "Contest Fashion (Tough)",
        "Contest Fashion (Smart)",
        "Contest Fashion (Cute)",
        "Contest Fashion (Beauty)",
        "Fancy Clothes",
        "Adorable Fashion",
        "Elegant Fashion",
        "Rad Fashion",
        "Rough Fashion",
        "Slick Fashion",
        "Go-Goggles",
        "Safety Goggles",
        "Winter Cloak",
        "Focus Band",
        "Focus Sash",
        "Lax Incense",
        "Luck Incense",
        "Full Incense"
    ]
    if (nameList.some(x => item.name.startsWith(x) || item.name.endsWith(x) )) {
        return new Set(["Fashionista"])
    }
    return new Set();
}
itemlabelers.push(fashioniste)


/**@param item {PTUItem}
 * @return {Set<string>}
 */
function chef(item) {
    const nameList = [
        "Tasty Snack",
        "Salty Surprise",
        "Spicy Wrap",
        "Sour Candy",
        "Dry Wafer",
        "Bitter Treat",
        "Sweet Confection",
        "Enriched Water",
        "Super Soda Pop",
        "Sparkling Lemonade",
        "MooMoo Milk",
        "Bait",
        "Super Bait",
        "Hearty Meal",
        "Vile Bait",
        "Leftovers",
        "HP Up",
        "Protein",
        "Iron",
        "Calcium",
        "Zinc",
        "Carbos",
        "Stat Suppressant",
        "Stat Suppressant (HP)",
        "Stat Suppressant (Attack)",
        "Stat Suppressant (Defense)",
        "Stat Suppressant (Special Attack)",
        "Stat Suppressant (Special Defense)",
        "Stat Suppressant (Speed)",
    ]
    if (nameList.some(x => item.name.startsWith(x) || item.name.endsWith(x) )) {
        return new Set(["Chef"])
    }
    return new Set();
}
itemlabelers.push(chef)


/**@param item {PTUItem}
 * @return {Set<string>}
 */
function ballcases(item) {
    const nameList = [
        "Bounce Case",
        "Contest Case",
        "Flash Case",
        "Lock Case",
        "Medicine Case",
        "Spray Case",
        "Devil Case",
        "Storage Case",
        "Zap Case",
        "Snag Case",
    ]
    if (nameList.includes(item.name)) {
        return new Set(["Poké Ball Case"])
    }
    return new Set();
}

itemlabelers.push(ballcases)

/**@param item {PTUItem}
 * @return {Set<string>}
 */
function ballacc(item) {
    const nameList = [
        "Bait Attachment",
        "Camera Kit",
        "Poké Ball Alarm",
        "Poké Ball Tracking Chip"
    ]
    if (nameList.includes(item.name)) {
        return new Set(["Poké Ball Accessory"])
    }
    return new Set();
}

itemlabelers.push(ballacc)

/**@param item {PTUItem}
 * @return {Set<string>}
 */
function futuredrugs(item) {
    const nameList = [
        "Anti-Radiation Pills",
        "Prescient Powder",
        "Berserker Bolus",
        "Oxygenation Vial",
        "Puissance Pellet",
        "Rambo Roids",
        "Locus Lozenge",
        "Shock Syringe",
        "White Light",
        "Soldier Pill",
        "Spritz Spray",
        "Volatile Machine"

    ]
    if (nameList.includes(item.name)) {
        return new Set(["Sci-Fi Drug"])
    }
    return new Set();
}

itemlabelers.push(futuredrugs)

// items = [{name: "Razap Berry", system: {effect: "lol"}}]
allitems = await game.packs.get(`ptu.items`).getDocuments();
for (const item of allitems) {
    let words = new Set();
    for (const l of itemlabelers) {
        words = [...words, ...l(item)]
    }
    item.words = words;
}
allitems.sort((a,b) => a.name.localeCompare(b.name)).filter(i => i.words.length === 0)