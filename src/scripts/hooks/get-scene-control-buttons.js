export const GetSceneControlButtons = {
    listen: () => {
        Hooks.on('getSceneControlButtons', function (hudButtons) {
            const hud = hudButtons.find(val => val.name == "token")
            if (hud) {
              hud.tools.push({
                name: "PTU.DexButtonName",
                title: "PTU.DexButtonHint",
                icon: "fas fa-tablet-alt",
                button: true,
                onClick: game.ptu.macros.pokedex
              });
              if(game.user.isGM) {
                hud.tools.push({
                  name: "PTU.WeatherButtonName",
                  title: "PTU.WeatherButtonHint",
                  icon: "fas fa-cloud-sun-rain",
                  button: true,
                  onClick: game.ptu.weather.openWeatherMenu
                });
              }
            }
          });
    },
};
