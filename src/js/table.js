const Table = (function () {
    const ALPHABET = [
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'V', 'W', 'X', 'Y', 'Z'
    ];
    const PREFIX = 'TABLE';
    return class Table {
        static Subscriptions = Object.freeze({
            'CELL_SELECTED': Symbol(`${PREFIX}_CELL_SELECTED`)
        });

        table = null;
        thead = null;
        tbody = null;
        tfoot = null;
        tfootTh = null;
        selectedCell = null;
        isEditing = false;
        editHandler = null;
        menu = null;
        menuHandler = null;
        selectedRow = null;
        selectedColumn = null;
        menuActions = [
            {
                id: 'addRow',
                text: 'Add Row',
                icon: 'add_box',
                click: () => this.matriz.addRow()
            },
            {
                id: 'addColumn',
                text: 'Add Column',
                icon: 'add_box',
                click: () => this.matriz.addColumn()
            },
            {
                id: 'removeRow',
                text: 'Remove Row',
                icon: 'delete_forever',
                click: () => this.matriz.removeRow(this.selectedRow)
            },
            {
                id: 'removeColumn',
                text: 'Remove Column',
                icon: 'delete_forever',
                click: () => this.matriz.removeColumn(this.selectedColumn)
            }
        ];

        constructor (selector){
            this.selector = document.querySelector(selector);
            this.matriz = new Singleton();

            // subscriptions
            Mediator.Subscribe(Singleton.Subscriptions.ROW_ADDED, this.addRow.bind(this));
            Mediator.Subscribe(Singleton.Subscriptions.ROW_REMOVED, this.removeRow.bind(this));
            Mediator.Subscribe(Singleton.Subscriptions.COLUMN_ADDED, this.addColumn.bind(this));
            Mediator.Subscribe(Singleton.Subscriptions.COLUMN_REMOVED, this.removeColumn.bind(this));

            // print the table in the DOM
            this.render();
        }

        render () {
            this.table = document.createElement('table');
            this.table.classList.add('centered');
            this.table.setAttribute('tabindex', 0); // require for keyup/keydown events

            // compose the table header, body and footer
            this.thead = this.header();
            this.tbody = this.body();
            this.tfoot = this.footer();

            // append the header, body and footer
            this.table.appendChild(this.thead);
            this.table.appendChild(this.tbody);
            this.table.appendChild(this.tfoot);

            // add the table to the container
            this.selector.appendChild(this.table);

            // events
            this.table.addEventListener('keyup', this.keyup.bind(this));
            this.table.addEventListener('contextmenu', this.showMenu.bind(this));
            this.tbody.addEventListener('click', this.selectCell.bind(this));
            this.tbody.addEventListener('dblclick', this.editCell.bind(this));

            // focus the table to listen to keyboard events
            this.table.focus();
        }

        /**
         * Compose the table header with the alphabet letter
         * @returns {HTMLElement}
         */
        header () {
            let counter = 0;
            let total = this.matriz.data[0].length;
            let thead = document.createElement('thead');
            let tr = this.tr();
            tr.appendChild(this.th(''));

            let idx = -1;
            for(let columnIndex = 0; columnIndex < total; columnIndex++){
                idx++;
                if(idx === ALPHABET.length) {
                    idx = 0;
                    counter++;
                }
                let th = this.th(`${ALPHABET[idx]}${counter ? counter : ''}`, 'data-column', columnIndex, this.selectColumn.bind(this));
                if(this.selectedColumn === columnIndex) th.classList.add('selected-col');
                tr.appendChild(th);
            }
            thead.appendChild(tr);
            return thead;
        }

        /**
         * Compose the table body with all the rows and columns
         * @returns {HTMLElement}
         */
        body () {
            let tbody = document.createElement('tbody');

            this.matriz.data.forEach((row, rowIndex) => {
                let tr = this.tr('data-row', rowIndex);
                tr.appendChild(this.th(rowIndex+1, 'data-row', rowIndex, this.selectRow.bind(this)));
                row.forEach((column, columnIndex) => tr.appendChild(this.td(column, rowIndex, columnIndex)));
                tbody.appendChild(tr);
            });

            return tbody;
        }

        /**
         * Compose the table footer
         * @returns {HTMLElement}
         */
        footer () {
            let tfoot = document.createElement('tfoot');
            let tr = this.tr();
            let th = this.th('');
            th.setAttribute('colspan', this.matriz.data[0].length+1);

            this.tfootTh = th;

            tr.appendChild(th);
            tfoot.appendChild(tr);
            return tfoot;
        }

        /**
         * Compose a table row
         * @param {string} data optional
         * @param {number} index
         * @returns {HTMLElement}
         */
        tr (data, index = null) {
            let tr = document.createElement('tr');
            if(data && index !== null) tr.setAttribute(data, index);
            return tr;
        }

        /**
         * Compose a table cell header
         * @param {string} text default ''
         * @param {string} data default null
         * @param {string} index
         * @param {function} click optional
         * @param {function} contextmenu optional
         * @returns {HTMLElement}
         */
        th (text = '', data = null, index, click = null, contextmenu = null) {
            let th = document.createElement('th');
            th.innerText = text;
            if(data) th.setAttribute(data, index);
            if(typeof click === 'function') th.addEventListener('click', click);
            return th;
        }

        /**
         * Compose a table cell
         * @param cell
         * @param rowIndex
         * @param columnIndex
         * @param editable
         * @returns {HTMLElement}
         */
        td (cell, rowIndex, columnIndex, editable = false) {
            let td = document.createElement('td');
            td.innerText = cell.value;
            if(cell.style) td.setAttribute('style', cell.style);

            if(rowIndex >= 0 && columnIndex >= 0) td.setAttribute('data-cell', `${rowIndex}:${columnIndex}`);
            if(editable) td.setAttribute('contenteditable', true);

            return td;
        }

        /**
         * Select a table cell
         * @param {event} event
         * @returns {boolean}
         */
        selectCell (event, element = null) {
            let td = element ? element : event.target;

            if(td.tagName !== 'TD') return false;

            // td.setAttribute('tabindex', 0);
            td.classList.toggle('selected-cell');

            if(this.selectedCell) this.selectedCell.classList.remove('selected-cell');
            this.selectedCell = td;

            // publish the selected cell
            Mediator.Publish(Table.Subscriptions.CELL_SELECTED, {td: this.selectedCell});
        }

        /**
         * Edit a table cell
         * @param {event} event
         * @returns {boolean}
         */
        editCell (event, element = null) {
            let td = element ? element : event.target;

            if(td.tagName !== 'TD') return false;

            // edit the table cell
            td.setAttribute('contenteditable', true);
            td.focus();

            this.isEditing = true;
            this.selectedCell = td;
            this.editHandler = this._stopEdit.bind(this);

            // event when left
            td.addEventListener('focusout', this.editHandler);
        }

        /**
         * Stops the editing on a cell
         * Remove the focusout event on the edited cell
         * @private
         */
        _stopEdit () {
            this.isEditing = false;

            this.selectedCell.setAttribute('contenteditable', false);
            this.selectedCell.removeEventListener('focusout', this.editHandler);

            this.table.focus();
            this.selectedCell.classList.add('selected-cell');

            this.updateCell()
        }

        /**
         * add a new row to the table
         * @param {object} data
         */
        addRow (data){
            // compose the new row and row header
            let tr = this.tr('data-row', data.index);
            tr.appendChild(this.th(data.index+1, 'data-row', data.index, this.selectRow.bind(this)));

            // adds each row column
            data.value.forEach((c, columnIndex) => {
                let td = this.td(c, data.index, columnIndex, true);
                if(this.selectedColumn === columnIndex) td.classList.add('selected-col');
                tr.appendChild(td);
            });

            this.tbody.appendChild(tr);
            this._footerMessage(`Added Row: ${data.index+1}`);
        }

        /**
         * Remove a table row
         * Reset the selected row
         * @param data
         */
        removeRow (data) {
            // reset the selected row
            this.selectedRow = null;
            this._footerMessage(`Row Removed: ${data.index+1}`);

            // finds all the rows
            let rows = Array.from(this.tbody.children);

            // takes only the trs to update
            rows.splice(data.index, rows.length)
                .forEach((row, i) => {
                    if(i === 0) return row.parentNode.removeChild(row);

                    // update the row tr
                    row.setAttribute('data-row', data.index);
                    row.firstChild.innerText = data.index+1;
                    row.firstChild.setAttribute('data-row', data.index);

                    // update the row columns coords
                    Array.from(row.children)
                        .filter(column => column.tagName !== 'TH') // ignores the th
                        .forEach((column, columnIndex) => {
                            column.setAttribute('data-cell', `${data.index}:${columnIndex}`);
                        });

                    data.index++;
                });
        }

        /**
         * Add a new column into the table
         * @param {object} data
         */
        addColumn (data) {
            // finds all the rows and appends the new column
            this.matriz.data.forEach((row, rowIndex) => {
                let tr = document.querySelector(`tr[data-row="${rowIndex}"]`);
                let td = this.td(data.value, rowIndex, data.index, true);
                if(this.selectedRow === rowIndex) td.classList.add('selected-row');
                tr.appendChild(td);
            });

            // update the table header to display the new column header
            this.table.removeChild(this.thead);
            this.thead = this.header();
            this.table.prepend(this.thead);
            this.tfootTh.setAttribute('colspan', this.matriz.data[0].length+1);

            this._footerMessage(`Added Column: ${this.thead.lastChild.lastChild.innerText}`);
        }

        /**
         * Remove a table column
         * @param data
         */
        removeColumn (data) {
            // reset selected column
            this.selectedColumn = null;
            this._footerMessage('Column Removed: '+this.thead.querySelector(`th[data-column="${data.index}"]`).innerText);

            // creates an array with the number of cell to update on each row
            let total = (this.matriz.data[0].length + 1) - data.index;
            let columns = Array.from(new Array(total))
                .map((c, i) => i + data.index);

            // update each row cells
            this.matriz.data.forEach((r, rowIndex) => {
                let columnIndex = data.index;
                columns.forEach(index => {
                    let td = this.tbody.querySelector(`td[data-cell="${rowIndex}:${index}"]`);
                    if(index === data.index) return td.parentNode.removeChild(td);
                    td.setAttribute('data-cell', `${rowIndex}:${columnIndex}`);
                    columnIndex++;
                })
            });

            // update the table header
            this.table.removeChild(this.thead);
            this.thead = this.header();
            this.table.insertBefore(this.thead, this.tbody);

            // update the tfoot
            this.tfootTh.setAttribute('colspan', this.matriz.data[0].length+1);
        }

        /**
         * Updates a cell
         * @param {event} event
         * @returns {*}
         */
        updateCell () {
            if(!this.selectedCell) return false;
            let coords = this.selectedCell.getAttribute('data-cell').split(':');

            // update
            this.matriz.updateColumn(coords, this.selectedCell.innerText, this.selectedCell.getAttribute('style'));
        }

        /**
         * @param {Event} event
         */
        keyup (event) {
            if(!event.target.tagName === 'TD' || !this.selectedCell) return false;

            // enter key to start/stop editing
            if(event.keyCode === 13){
                // ctrl + enter to left
                if(this.isEditing && event.ctrlKey) return this._stopEdit();

                // enter start editing
                if(!this.isEditing) this.editCell(event, this.selectedCell);
            }

            // navigation
            if(!this.isEditing) {
                if(event.keyCode === 37) this._navigate(0, -1); // navigate to left
                if(event.keyCode === 38) this._navigate(-1, 0); // navigate to up
                if(event.keyCode === 39) this._navigate(0, +1); // navigate to right
                if(event.keyCode === 40) this._navigate(+1, 0); // navigate to down
            }
        }

        /**
         * Move to to previus/next/up and down cell
         * Determinates if the cell exists and then navigates
         * @param row
         * @param col
         * @private
         */
        _navigate (row, col) {
            let coords = this.selectedCell.getAttribute('data-cell')
                .split(':')
                .map(c => parseInt(c));

            // finds the td on the table
            let td = document.querySelector(`td[data-cell="${coords[0]+row}:${coords[1]+col}"]`);
            if(!td) return;
            // td.focus();

            // select the td
            this.selectCell(null, td);

            // this.selectedCell.classList.remove('selected-cell');
            // td.classList.add('selected-cell');
            // this.selectedCell = td;
        }

        /**
         * Select the row
         * @param {Event} event
         */
        selectRow (event) {
            let index = parseInt(event.target.getAttribute('data-row'));

            if(this.selectedRow !== null) this._selectRow(this.selectedRow);
            this.selectedRow = index;

            this._selectRow(index);
            this._footerText()
        }

        _selectRow (rowIndex) {
            // select the row
            let tr = document.querySelector(`tr[data-row="${rowIndex}"]`);

            for(let row of tr.children) {
                row.classList.toggle('selected-row');
            }
        }

        selectColumn (event) {
            let index = parseInt(event.target.getAttribute('data-column'));

            if(this.selectedColumn !== null) this._selectColumn(this.selectedColumn);
            this.selectedColumn = index;

            this._selectColumn(this.selectedColumn);
            this._footerText()
        }

        _selectColumn (columnIndex) {
            let query = [`th[data-column="${columnIndex}"]`];
            for(let row = 0; row < this.matriz.data.length; row++){
                query.push(`td[data-cell="${row}:${columnIndex}"]`);
            }
            let cols = this.table.querySelectorAll(query.join(','));
            for(let col of cols) {
                col.classList.toggle('selected-col');
            }
        }

        /**
         * Display a message in the table footer that will be automatically remove after a time
         * @param {string} text
         * @param {number} time miliseconds default 5000
         * @private
         */
        _footerMessage (text, time = 5000) {
            let message = document.createElement('div');
            message.innerText = text;
            this.tfootTh.appendChild(message);

            // remove the message after the time (5000)
            setTimeout(() => this.tfootTh.removeChild(message), time);
        }

        /**
         * Updates the footer text for selected row or column
         * @returns {boolean}
         * @private
         */
        _footerText () {
            if(this.selectedRow === null && this.selectedColumn === null) return false;

            let text = 'Selected ';
            text += this.selectedRow !== null ? this.selectedRow+1 : '';
            text += this.selectedRow !== null && this.selectedColumn !== null ? ':' : '';

            if(this.selectedColumn !== null)
                text += document.querySelector(`th[data-column="${this.selectedColumn}"]`).innerText;

            this.tfootTh.innerText = text;
        }

        /**
         * Display the contextual menu
         * @param {event} event
         * @returns {boolean}
         */
        showMenu (event) {
            if(event.button !== 2) return false;
            event.preventDefault();

            // remove previous menu
            if(this.menu) document.body.removeChild(this.menu);

            this.menu = this._menuUl();
            this.menuHandler = this._checkMenu.bind(this);

            document.body.appendChild(this.menu);
            document.body.addEventListener('click', this.menuHandler);
        }

        /**
         * Compose the menu dropdown list
         * @returns {HTMLElement}
         * @private
         */
        _menuUl () {
            // compose the menu
            let ul = document.createElement('ul');
            ul.classList.add('dropdown-content');
            ul.style = `display: block; opacity: 1; top: ${event.y}px; left: ${event.x}px`;

            let divider = null;
            this.menuActions.forEach(action => {
                if((action.id === 'removeRow' && this.selectedRow === null)
                    || (action.id === 'removeColumn' && this.selectedColumn === null)) return;

                if(action.id === 'removeRow' || action.id === 'removeColumn' && !divider){
                    divider = document.createElement('li');
                    divider.classList.add('divider');
                    ul.appendChild(divider);
                }
                ul.appendChild(this._menuLi(action));
            });

            return ul;
        }

        /**
         * Compose a menu dropdown item
         * @param {object} action menu
         * @returns {HTMLElement}
         * @private
         */
        _menuLi (action) {
            let li = document.createElement('li');
            let a = document.createElement('a');
            a.innerText = action.text;

            if(action.icon) {
                let icon = document.createElement('i');
                icon.classList.add('material-icons');
                icon.innerText = action.icon;
                a.appendChild(icon);
            }

            if(typeof action.click === 'function')
                li.addEventListener('click', action.click);

            li.addEventListener('click', this._removeMenu.bind(this));
            li.appendChild(a);
            return li;
        }

        /**
         * Check if the click element is inside the menu element
         * if the event.target is a child menu element then ignores the click
         * If the event.target is outside the menu element then remove and hides the menu
         * @param {Event} event
         * @returns {boolean}
         * @private
         */
        _checkMenu (event) {
            let element = null;
            let isMenu = Array.from(new Array(3))
                .map(() => element = element ? element.parentNode : event.target)
                .some(node => node.classList.contains('dropdown-content'));

            // is an element inside the menu
            if(isMenu) return false;
            this._removeMenu();
        }

        /**
         * Remove the menu on the DOM
         * @private
         */
        _removeMenu () {
            document.body.removeChild(this.menu);
            document.body.removeEventListener('click', this.menuHandler);
            this.menu = null;
            this.menuHandler = false;
        }

        style (key, value) {
            if(!this.selectedCell || !key || !value) return false;

            // toogle the style
            this._cellStyle({[`${key}`] : value});
        }

        _cellStyle (newStyles) {
            let styles = this.cellStyles;
            let all = Object.assign({}, styles, newStyles);

            // toggle style
            let text = Object.keys(all)
                .filter(key => !(styles[key] && newStyles[key] && styles[key] == newStyles[key]))
                .reduce((t, k) => t += `${k}:${all[k]};`, '');

            this.selectedCell.setAttribute('style', text);
            this.updateCell();
        }

        get cellStyles () {
            let styles = this.selectedCell.getAttribute('style');
            if(!styles) return {};

            // compose each style into an object {key: value}
            return styles.replace(/\s/g, '')
                .split(';')
                .filter(s => s)
                .map(s => s.split(':'))
                .map(s => ({[`${s[0]}`]: s[1]}))
                .reduce((t, c) => Object.assign(t, c), {});
        }
    }
})();