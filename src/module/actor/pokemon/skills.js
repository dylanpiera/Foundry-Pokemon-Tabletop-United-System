function calculateSkills(skills, speciesData, background, bonus = 0) {
    if (speciesData == null) return skills;
    if (speciesData._id == "ARCEUS") {
        for (let [key, skill] of Object.entries(skills)) {
            skill.value.value = 4;
            skill.modifier.value = 3;
        };
        return skills;
    }

    let speciesSkills = speciesData["Skills"];

    for (let [key, skill] of Object.entries(skills).filter(x => x[1].label.includes("Ed"))) {
        skill.value.value = 1;
    };

    for (let [key, skill] of Object.entries(speciesSkills)) {
        if (key == "TechEd") {
            skills["techEd"].value.value = skill.Dice;
            skills["techEd"].modifier.value = skill.Mod;
        } else {
            skills[key.toLowerCase()].value.value = skill.Dice;
            skills[key.toLowerCase()].modifier.value = skill.Mod;
        }
    }

    for(let skill of Object.values(background.increased)) {
        if(skills[skill]) {
            skills[skill].value.mod += 1;
        }
    }
    for(let skill of Object.values(background.decreased)) {
        if(skills[skill]) {
            skills[skill].value.mod -= 1;
        }
    }

    if(bonus != 0) {
        for(let [key, skill] of Object.entries(skills)) skill.modifier.mod += bonus;
    }

    return skills;
}

export { calculateSkills }