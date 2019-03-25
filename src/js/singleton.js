const Singleton = (function () {
    const PREFIX = 'matriz_data';
    const DEFAULT_ROWS = 10;
    const DEFAULT_COLUMNS = 15;
    const DEFAULT_VALUE = () => ({
        value: '',
        style: ''
    });

    // let DATA = [];
    let DATA = initData();
    let instance = null;

    /**
     * Compose the default data
     * @returns {Array[[]]} array with the default rows and columns
     * @private
     */
    function initData () {
        return createArray(DEFAULT_ROWS)
            .map(r => createArray(DEFAULT_COLUMNS)
                .map(c => DEFAULT_VALUE()));
    }

    /**
     * Create an array with the specified length
     * @param {number} length
     * @private
     */
    function createArray(length){
        return Array.from(new Array(length));
    }

    return class Singleton {
        static Subscriptions = Object.freeze({
            'ROW_ADDED': Symbol(`${PREFIX}_ROW_ADDED`),
            'ROW_REMOVED': Symbol(`${PREFIX}_ROW_REMOVED`),
            'COLUMN_ADDED': Symbol(`${PREFIX}_COLUMN_ADDED`),
            'COLUMN_REMOVED': Symbol(`${PREFIX}_COLUMN_REMOVED`),
            'CELL_UPDATED': Symbol(`${PREFIX}_CELL_UPDATED`),
        });
        
        constructor () {
            if(!instance) {
                this.getStorage();
                instance = this;
            }
            return instance;
        }

        /**
         * Getter for the data
         * @returns {Array}
         */
        get data () {
            return DATA;
        }

        addRow () {
            let index = DATA.length;
            let row = createArray(DATA[0].length).map(c => DEFAULT_VALUE())
            DATA.push(row);

            this.updateStorage();
            Mediator.Publish(Singleton.Subscriptions.ROW_ADDED, {index, value: row});
        }

        removeRow (index) {
            if(index <= -1) return false;

            // remove the row
            DATA.splice(index, 1);

            this.updateStorage();
            Mediator.Publish(Singleton.Subscriptions.ROW_REMOVED, {index});
        }

        addColumn (value = DEFAULT_VALUE()) {
            let index = DATA[0].length;
            DATA = DATA.map(row => {
                row.push(value);
                return row;
            });

            this.updateStorage();
            Mediator.Publish(Singleton.Subscriptions.COLUMN_ADDED, {index, value});
            return DATA;
        }

        /**
         * Remove a column
         * @param {number} index
         * @returns {boolean}
         */
        removeColumn (index) {
            if(index <= -1) return false;
            console.log('data remove column', index);

            // remove the column on each row
            DATA.forEach(row => row.splice(index, 1));

            this.updateStorage();
            Mediator.Publish(Singleton.Subscriptions.COLUMN_REMOVED, {index});
        }

        updateColumn (coords, value, style) {
            console.log('update column', coords, value);

            if(!Array.isArray(coords)) return false;
            DATA[coords[0]][coords[1]].value = value;
            DATA[coords[0]][coords[1]].style = style;

            // sync with localstorage
            this.updateStorage();
            Mediator.Publish(Singleton.Subscriptions.CELL_UPDATED, {coords, value});
            return true;
        }

        updateStorage () {
            try {
                let json = JSON.stringify(DATA);
                localStorage.setItem(PREFIX, json);
            } catch (error) {
                console.error(error);
            }
        }

        getStorage () {
            try {
                let data = localStorage.getItem(PREFIX);
                data = JSON.parse(data);
                if(data && Array.isArray(data) && data.length)
                    DATA = data;
            } catch (error) {
                console.error(error);
            }
        }
    }
})();

