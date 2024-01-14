import {tagify} from "../../util/tags.js";

export const TagifySheets = {
    listen: () => {
        Hooks.on("renderPTUItemSheet", (sheet, $html) => {
            for(const taggifyElement of $html.find(".ptu-tagify")) {
                tagify(taggifyElement);
            }
        });
    },
};
