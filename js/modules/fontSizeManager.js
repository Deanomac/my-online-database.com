// fontSizeManager.js
export const FontSizeManager = {
    init() {
        this.createUnifiedFontSizeControl();
        this.attachExistingControlListeners();
        this.applyStoredFontSize();
        this.initializeViewChangeListener();
    },

    attachExistingControlListeners() {
        // Handle existing toolbar font size input if it exists
        const toolbarFontInput = document.getElementById('db4sql-fontSizeInput');
        if (toolbarFontInput) {
            toolbarFontInput.addEventListener('input', (e) => {
                let fontSize = parseInt(e.target.value);
                if (fontSize < 1) fontSize = 8;
                if (fontSize > 96) fontSize = 72
                e.target.value = fontSize;
                this.setFontSize(fontSize);
            });

            // Sync unified control with toolbar input
            const unifiedInput = document.getElementById('unifiedFontSize');
            if (unifiedInput) {
                unifiedInput.value = toolbarFontInput.value;
            }
        }
    },

    initializeViewChangeListener() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('#tableViewBtn') || e.target.matches('#formViewBtn')) {
                setTimeout(() => this.applyStoredFontSize(), 100);
            }
        });
    },

    createUnifiedFontSizeControl() {
        const toolbar = document.querySelector('.toolbar');
        if (!toolbar) return;

        // Remove any existing font size controls
        const existingControls = toolbar.querySelectorAll('.font-size-control');
        existingControls.forEach(control => control.remove());

        // Create new unified control
        const fontSizeControl = document.createElement('div');
        fontSizeControl.className = 'font-size-control';

        const label = document.createElement('label');
        label.textContent = 'Font Size:';
        label.htmlFor = 'unifiedFontSize';

        const rangeInput = document.createElement('input');
        rangeInput.type = 'range';
        rangeInput.id = 'unifiedFontSize';
        rangeInput.min = '12';
        rangeInput.max = '48';
        rangeInput.value = localStorage.getItem('appFontSize') || '18';

        const sizeDisplay = document.createElement('span');
        sizeDisplay.className = 'font-size-display';
        sizeDisplay.textContent = `${rangeInput.value}px`;

        rangeInput.addEventListener('input', (e) => {
            const size = e.target.value;
            sizeDisplay.textContent = `${size}px`;
            this.setFontSize(size);

            // Sync with toolbar input if it exists
            const toolbarInput = document.getElementById('db4sql-fontSizeInput');
            if (toolbarInput) {
                toolbarInput.value = size;
            }
        });

        fontSizeControl.appendChild(label);
        fontSizeControl.appendChild(rangeInput);
        fontSizeControl.appendChild(sizeDisplay);

        // Insert before the search container
        const searchContainer = toolbar.querySelector('.search-container');
        if (searchContainer) {
            toolbar.insertBefore(fontSizeControl, searchContainer);
        } else {
            toolbar.appendChild(fontSizeControl);
        }
    },

    setFontSize(size) {
        // Store the size in both storage keys for backwards compatibility
        localStorage.setItem('appFontSize', size);
        localStorage.setItem('db4sql-fontSize', size);

        // Apply to both views
        this.updateTableViewFontSize(size);
        this.updateFormViewFontSize(size);
    },

    updateTableViewFontSize(size) {
        const tableView = document.getElementById('tableView');
        if (!tableView) return;

        const table = tableView.querySelector('table');
        if (table) {
            table.style.fontSize = `${size}px`;

            // Update all cells
            const cells = table.querySelectorAll('th, td');
            cells.forEach(cell => {
                cell.style.fontSize = `${size}px`;
                cell.style.padding = `${Math.max(8, Math.floor(size * 0.5))}px`;
                
                // Handle editing inputs if present
                const input = cell.querySelector('input, textarea');
                if (input) {
                    input.style.fontSize = `${size}px`;
                    input.style.padding = `${Math.max(8, Math.floor(size * 0.5))}px`;
                }
            });
        }

        // Update buttons and controls
        tableView.querySelectorAll('.button, .control').forEach(element => {
            element.style.fontSize = `${size}px`;
        });
    },

    updateFormViewFontSize(size) {
        const formView = document.getElementById('formView');
        if (!formView) return;

        // Update form groups
        const formGroups = formView.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            group.style.fontSize = `${size}px`;
            
            ['label', 'input', 'textarea', 'select'].forEach(selector => {
                const element = group.querySelector(selector);
                if (element) {
                    element.style.fontSize = `${size}px`;
                    if (selector !== 'label') {
                        const padding = Math.max(8, Math.floor(size * 0.5));
                        element.style.padding = `${padding}px`;
                    }
                }
            });
        });

        // Update navigation and controls
        ['form-navigation', 'record-counter', 'button'].forEach(className => {
            formView.querySelectorAll(`.${className}`).forEach(element => {
                element.style.fontSize = `${size}px`;
            });
        });
    },

    applyStoredFontSize() {
        // Check both storage keys and use the most recent
        const unifiedSize = localStorage.getItem('appFontSize');
        const legacySize = localStorage.getItem('db4sql-fontSize');
        const defaultSize = '18';

        const size = unifiedSize || legacySize || defaultSize;
        this.setFontSize(size);

        // Update all font size inputs
        ['unifiedFontSize', 'db4sql-fontSizeInput'].forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.value = size;
            }
        });

        // Update size display if it exists
        const sizeDisplay = document.querySelector('.font-size-display');
        if (sizeDisplay) {
            sizeDisplay.textContent = `${size}px`;
        }
    }
};