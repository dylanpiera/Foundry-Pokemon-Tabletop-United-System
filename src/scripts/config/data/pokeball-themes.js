export const pokeballStyles = {
    "Air Ball": {
      backgroundColor: "#44899F",
      gradientColors: "#ECDBEB, #DFFFFE",
      topLightColor: "#6EB6CB",
      bandColor: "#222224"
    },
    "Great Ball": {
      backgroundColor: "#0040a1",
      gradientColors: "#ECDBEB, #DFFFFE",
      topLightColor: "#0175c9",
      highlightShape: "greatball-stripes",
      bandColor: "#222224"
    },
    "Ultra Ball": {
      backgroundColor: "#333437",
      gradientColors: "#ECDBEB, #DFFFFE",
      topLightColor: "#424447",
      highlight: "#c69835",
      bandColor: "#222224"
    },
    "Master Ball": {
      backgroundColor: "#37195e",
      gradientColors: "#ECDBEB, #DFFFFE",
      topLightColor: "#46256d",
      highlight: "#76315d",
      bandColor: "#222224"
    },
    "Premier Ball": {
      backgroundColor: "#fffafa",
      gradientColors: "#fffafa, #fffafa",
      topLightColor: "#FFFFFF",
      bandColor: "#C42835"
    },
    "Cherish Ball": {
        backgroundColor: "#E94737",
        gradientColors: "#F37B73, #A33D2D",
        topLightColor: "#F37B73",
        bandColor: "#4A4E52"
    },
    "Dive Ball": {
        backgroundColor: "#6499C3",
        gradientColors: "#6499C3, #7FCAEF",
        topLightColor: "#7FCAEF",
        highlight: "#FFFBF6",
        bandColor: "#222224"
    },
    "Dusk Ball": {
        backgroundColor: "#524746",
        gradientColors: "#524746, #635755",
        topLightColor: "#635755",
        highlight: "#35A03D",
        bandColor: "#ED6E19"
    },
    "Earth Ball": {
        backgroundColor: "#676F24",
        gradientColors: "#ECDBEB, #DFFFFE",
        topLightColor: "#788B20",
        highlight: "",
        bandColor: "#222224"
    },
    "Fabulous Ball": {
        backgroundColor: "#A439CF",
        gradientColors: "#A439CF, #AB5EF2",
        topLightColor: "#AB5EF2",
        highlight: "#DEC3FF",
        bandColor: "#7C97CE"
    },
    "Fast Ball": {
        backgroundColor: "#C56121",
        gradientColors: "#ECDBEB, #DFFFFE",
        topLightColor: "#EA8E49",
        highlight: "#F9C642",
        bandColor: "#222224"
    },
    "Friend Ball": {
        backgroundColor: "#6A963E",
        gradientColors: "#ECDBEB, #DFFFFE",
        topLightColor: "#7FBA43",
        highlight: "#C6614B",
        bandColor: "#222224"
    },
    "Gossamer Ball": {
        backgroundColor: "#E9CFE1",
        gradientColors: "#ECDBEB, #DFFFFE",
        topLightColor: "#F7DFEA",
        highlightShape: "gossamer-heart",
        bandColor: "#222224"
    },
    "Hail Ball": {
        backgroundColor: "#DBE0E0",
        gradientColors: "#ECDBEB, #DFFFFE",
        topLightColor: "#C4F4FF",
        highlight: "#DBE0E0",
        bandColor: "#222224"
    },
    "Heal Ball": {
        backgroundColor: "#DA2E8B",
        gradientColors: "#DA2E8B, #E84E96",
        topLightColor: "#EE4C97",
        highlight: "#FFF4DC",
        bandColor: "#7C97CE"
    },
    "Heavy Ball": {
        backgroundColor: "#797C86",
        gradientColors: "#ECDBEB, #DFFFFE",
        topLightColor: "#9B9FA4",
        highlight: "#5B7AB9",
        bandColor: "#222224"
    },
    "Park Ball": {
        backgroundColor: "#DA9C22",
        gradientColors: "#ECDBEB, #DFFFFE",
        topLightColor: "#F5D152",
        highlight: "",
        bandColor: "#2F6DB7"
    },
    "default": {
        backgroundColor: "#C42835",
        gradientColors: "#ECDBEB, #DFFFFE",
        topLightColor: "#E33242",
        highlight: "",
        bandColor: "#222224"
    }
};

export const pokeballShapes = {
"gossamer-heart": `<div name="highlight" style="width: 120%;
                        height: 120%;
                        display: block;
                        position: absolute;
                        z-index: 2;
                        clip-path: polygon(0 0, 44% 0, 14% 100%, 0% 100%);
                        transform: TranslateX(-80%) TranslateY(-40%) rotate(170deg);">
                        <svg class="gossamer-heart" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" height="315" width="342">
                            <defs>
                            <style type="text/css">                                
                                .outline { stroke:#F8F1F8; stroke-width:10}
                            </style>
                            <g id="heart">
                            <path d="M0 200 v-200 h200 
                                a100,100 90 0,1 0,200
                                a100,100 90 0,1 -200,0
                                z"></path>
                            </g>
                            </defs>
                            <use xlink:href="#heart" class="outline " fill="#FDECF4"></use>
                        </svg>
                        </div>`,
/*********************************************************************************************** */
    "greatball-stripes": `<div name="highlight" style="
                                display: block;
                                position: absolute;
                                z-index: 2;
                            
                                transform: Scale(1.5) TranslateX(-14%) TranslateY(200%) rotate(122deg);">
                                <svg viewBox="0 0 493.778 64.48" width="493.778" height="64.48">
                                    <rect x="-16.403" y="-5.09" width="178.167" height="83.145" style="stroke: rgb(0, 0, 0); fill: rgb(255, 0, 0);"></rect>
                                    <rect x="335.69" y="-8.767" width="178.167" height="83.145" style="stroke: rgb(0, 0, 0); fill: rgb(255, 0, 0);"></rect>
                                </svg>
                            </div>`
}