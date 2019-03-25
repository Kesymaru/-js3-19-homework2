(function () {
    let table = null;
    let controls = null;
    let fontSize = null;

    /**
     * Method when a control has been selected
     * @param {Event} event
     * @returns {boolean}
     */
    function controlAction (event){
        let icon = event.target;
        if(icon.tagName !== 'I') return false;

        table.style(icon.getAttribute('data-style'), icon.getAttribute('data-value'));
    }

    /**
     * Method to toggle the controls of the selected cell
     */
    function controlsSelected () {
        let styles = table.cellStyles;

        // remove previus selected
        Array.from(controls.querySelectorAll('li'))
            .forEach(li => li.classList.remove('selected'));

        // reset font size selct
        fontSize.value = '';

        // set the selected styles
        Object.keys(styles)
            .forEach(style => {
                let query = `i[data-style="${style}"]`;
                if(style === 'text-align') query += `[data-value="${styles[style]}"]`;
                else if(style === 'font-size') return fontSize.value = styles[style];

                let icon = controls.querySelector(query);
                if(icon) icon.parentNode.classList.toggle('selected');
            });

        // focus the table for the keyboard events
        table.table.focus();
    }

    /**
     * Main method to start the table and the toolbar
     */
    function main () {
        table = new Table('section');
        controls = document.querySelector('#controls');
        fontSize = controls.querySelector('select');

        // load the font size options
        Array.from(new Array(10)).forEach((v, i) => {
            let option = document.createElement('option');
            let value = `${(i+1) * 5}px`;
            option.setAttribute('value', value);
            option.innerText = value;
            fontSize.appendChild(option);
        });

        // events
        controls.addEventListener('click', controlAction);
        fontSize.addEventListener('change', event => table.style('font-size', event.target.value));

        // subscriptions
        Mediator.Subscribe(Table.Subscriptions.CELL_SELECTED, controlsSelected);
        Mediator.Subscribe(Singleton.Subscriptions.CELL_UPDATED, controlsSelected);
    }

    main();
})();