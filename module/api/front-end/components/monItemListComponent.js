import { debug } from '../../../ptu.js';
import Component from '../lib/component.js';

export default class MonItemListComponent extends Component {
    constructor(store, id, type) {
        super({
            store, 
            element: $(`#${id}`)
        })
        this.type = type;
    }

    /**
     * React to the state changes and render the component's HTML
     * 
     * @returns {void}
     */
    async render() {
        if(this.noRerender) {
            this.noRerender = false
            return;
        }
        
        if (this.state.availableMoves?.length < 1 && (this.type == "known-moves" || this.type == "available-moves")) //don't show moves list if no moves are available to learn
            return;

        if (this.state.newAbilities?.length < 1 && this.type == "new-abilities")
            return;
        if (this.state.oldAbilities?.length < 1 && this.type == "old-abilities")
            return;

        this.element.html(`
            ${(this.type == "known-moves") ? `<p class="mb-2">Known Moves - ` + String(document.querySelectorAll('[data-type="known-moves"]').length) + `</p>`: ""}
            ${(this.type == "available-moves") ? `<p class="mb-2">Available Moves</p>` : ""}
            ${(this.type == "old-abilities") ? `<p class="mb-2">Old Abilities</p>` : ""}
            ${(this.type == "new-abilities") ? `<p class="mb-2">new Abilities</p>` : ""}
            $
            <ol class="inventory-list w-100" style="padding: unset; text-align:center;">
                ${this._renderElements(this.type)}
            </ol>
        `)              

        this.element.find(`.known-moves-name`).on("click", (e) => {
            this.store.dispatch('movesFinalToAvailable', e.target.name);
        })
        this.element.find('.available-moves-name').on("click", (e) => {
            this.store.dispatch('movesAvailableToFinal', e.target.name);
        })
    }   

    _renderElements(type){
        switch(type) {
            case "known-moves": {
                return this.state.finalMoves
                    .sort((a,b) => a.level - b.level)
                    .reduce((html, move) => html += this._renderKnownMoveElement(move), "")
            }
            case "available-moves": {
                return this.state.availableMoves
                    .sort((a,b) => a.level - b.level)
                    .reduce((html, move) => html += this._renderAvailableMoveElement(move), "")
            }
            case "old-abilities": {
                return this.state.finalAbilities
                    .reduce((html, ability) => html += this._renderOldAbilityElement(ability), "")
            }
            case "new-abilities": {
                return this.state.newAbilities
                    .reduce((html, ability) => html += this._renderNewAbilityElement(ability), "")
            }
            case "ability-choices": {
                return html += this._renderAbilityChoices();
            }
        }
    }

    _renderKnownMoveElement(move) {
        return `
            <li class="itemflexrow p-1" data-type="${this.type}" data-id="${move.id}" styly="flex-wrap: nowrap;">
                <button class="mr-1 ml-1 ${this.type}-name" style="flex: 1 0 30%" name = "${move.name}" value="${move.name}" index="${move.system.effect}">${move.name}</button>
            </li>`;
    }

    _renderAvailableMoveElement(move) {
        return `
            <li class="itemflexrow p-1" data-type="${this.type}" data-id="${move.id}" styly="flex-wrap: nowrap;">
                <button class="mr-1 ml-1 ${this.type}-name" style="flex: 1 0 30%" name = "${move.name}" value="${move.name}" index="${move.system.effect}">${move.name}</button>
            </li>
        `;
    }

    _renderOldAbilityElement(ability) {
        return `
            <li class="itemflexrow p-1" data-type="${this.type}" data-id="${ability.id}" styly="flex-wrap: nowrap;">
                <button class="mr-1 ml-1 ${this.type}-name" style="flex: 1 0 30%" name = "${ability.name}" value="${ability.name}" index="${ability.system.effect}" disabled>${ability.name}</button>
            </li>
        `;
    }

    _renderNewAbilityElement(ability){
        return `
            <li class="itemflexrow p-1" data-type="${this.type}" data-id="${ability.id}" styly="flex-wrap: nowrap;">
                <button class="mr-1 ml-1 ${this.type}-name" style="flex: 1 0 30%" name = "${ability.name}" value="${ability.name}" index="${ability.system.effect}" disabled>${ability.name}</button>
            </li>
        `;
    }

    _renderAbilityChoices() {
        return `
            <div id="${this.type}"></div>

            <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
            <script>
            $(document).ready(function() {
            const newAbilityChoices = ${this.state.newAbilityChoices}
            
            $.each(newAbilityChoices, function(key, abilities) {
                if (abilities.length > 0) {
                // Create a new row for this ability category
                const $row = $('<div>');
                $row.addClass('ability-row');
                $row.append('<h3>' + key + ' Abilities:</h3>');
                
                // Create a radio button for each ability in this category
                $.each(abilities, function(index, ability) {
                    const $label = $('<label>');
                    const $radio = $('<input>');
                    $radio.attr({
                    'type': 'radio',
                    'name': key,
                    'value': ability
                    });
                    $label.append($radio);
                    $label.append(ability);
                    $row.append($label);
                });
                
                // Add the row to the page
                $('#ability-choices').append($row);
                
                // Select the first radio button by default
                $row.find(':radio:first').prop('checked', true);
                }
            });
            });
            </script>
        `
    }
}