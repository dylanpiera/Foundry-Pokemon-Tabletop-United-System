class InventoryConfigSheet extends FormApplication {

    /** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
            title: "Inventory Configuration",
			classes: ['ptu', 'sheet', 'actor', 'gen8', "inventory", "config"],
			template: 'systems/ptu/static/templates/config/inventory-config-sheet.hbs',
			width: 600,
			height: 250,
            resizable: true,
            dragDrop: [{dragSelector: ".item-list .item", dropSelector: ".swsh-box, .item-list .item"}]
		});
	}

    /** @override */
	getData() {
		const data = super.getData();
		// data.dtypes = ['String', 'Number', 'Boolean'];

		// Setup Item Columns
        data.columns = this.object.actor.getFlag("ptu", "itemColumns");
        const categories = new Set([...data.columns.available, ...data.columns.one, ...data.columns.two]);
        const extraCategories = new Set();

        for(const item of this.object.actor.itemTypes.item) {
            const cat = item.system.category || "Misc";
            if(categories.has(cat)) continue;
            extraCategories.add(cat);
        }
        data.columns.available = [...data.columns.available, ...extraCategories];

        data.ballStyle = this.object.ballStyle;

		return data;
	}

    /** @override */
    render(force = false, options = {}) {
        if ($(`.inventory.config form#${this.object.id}`).length > 0 && options.source !== this.id) {
            const appId = $(`.inventory.config form#${this.object.id}`).parents('[data-appid]').data('appid');
            ui.windows[appId].bringToTop();
            return;
        }

        super.render(force, options);

        return this;
    }

    activateListeners(html) {
		super.activateListeners(html);

        html.find('.move-available').click((ev) => this._moveCategory(ev, "available"));
        html.find('.move-one').click((ev) => this._moveCategory(ev, "one"));
        html.find('.move-two').click((ev) => this._moveCategory(ev, "two"));

        html.find('li.item[draggable="true"]').each((i, li) => {
            li.addEventListener('dragstart', this._dragStart.bind(this), false);
        });
    }

    _moveCategory(event, destination) {
        const column = event.currentTarget.parentElement.parentElement.dataset.column;
        const category = event.currentTarget.parentElement.parentElement.dataset.category;
        if(!destination || !column || !category) return;

        const columns = duplicate(this.object.actor.getFlag("ptu", "itemColumns"));
        columns[column] = columns[column].filter(c => c !== category);
        columns[destination].push(category);
        this.object.actor.setFlag("ptu", "itemColumns", columns).then(() => this.render(true, {source: this.id}));
    }

    _dragStart(event) {
        const li = event.currentTarget;
        const category = li.dataset.category;
        const column = li.dataset.column;

        event.dataTransfer.setData('text/plain', JSON.stringify({
            type: "category",
            source: this.id,
            category,
            column
        }));
    }

    /** @override */
    _onDrop(event) {
        const data = JSON.parse(event.dataTransfer.getData('text/plain'));
        if(data.type === "category" && !this._dropBlock) {
            const column = event.currentTarget.dataset.column;
            const category = event.currentTarget.dataset.category;
            const columns = duplicate(this.object.actor.getFlag("ptu", "itemColumns"));

            // Remove from old column
            columns[data.column] = columns[data.column].filter(c => c !== data.category);

            // If it's dropped on another category, insert it before that category
            if(category) 
                columns[column].splice(columns[column].indexOf(category), 0, data.category);
            // Otherwise, just push it to the end
            else 
                columns[column].push(data.category);

            this._dropBlock = true;

            // Save changes
            this.object.actor.setFlag("ptu", "itemColumns", columns).then(() => {
                this.render(true, {source: this.id})
                this._dropBlock = false;
            });
        }
    }

    /** @override */
  async _updateObject() { }
}

export { InventoryConfigSheet }