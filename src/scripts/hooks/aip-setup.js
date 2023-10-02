export const AutocompleteInlinePropertiesSetup = {
    listen: () => {
        Hooks.on("aipSetup", (packageConfig) => {
            const api = game.modules.get("autocomplete-inline-properties").API;
            const DATA_MODE = api.CONST.DATA_MODE;
        
            // Define the config for our package
            const config = {
                packageName: "ptu",
                sheetClasses: [
                    {
                        name: "PTUItemSheet", // this _must_ be the class name of the `Application` you want it to apply to
                        fieldConfigs: [
                            {
                                selector: `input.ae-like-path`,
                                showButton: true,
                                allowHotkey: true,
                                dataMode: DATA_MODE.OWNING_ACTOR_DATA,
                            },
                            // Add more field configs if necessary
                        ]
                    },
                    // {
                    //     name: "PTUItemSheet", // this _must_ be the class name of the `Application` you want it to apply to
                    //     fieldConfigs: [
                    //         {
                    //             selector: `input.selectors`,
                    //             showButton: true,
                    //             allowHotkey: true,
                    //             dataMode: DATA_MODE.CUSTOM,
                    //             customDataGetter: [
                    //                 "initiative",
                    //                 "attack-roll",
                    //                 "damage-roll"
                    //             ]
                    //         },
                    //         // Add more field configs if necessary
                    //     ]
                    // }
                ]
            };
        
            // Add our config
            packageConfig.push(config);
        });
    },
};
