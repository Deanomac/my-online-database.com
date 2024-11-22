import { DatabaseManager } from './databaseManager.js';
import { AppState } from './appState.js';
import { TableManager } from './tableManager.js';
import { ErrorManager } from './errorManager.js';
import { UI } from './ui.js';
import { Notifications } from './notifications.js';
import { actionHistory } from './actionHistoryManager.js';
import { RecordManager } from './recordManager.js'


export const ColumnManager = {
    initialized: false,
    dragState: {
        isDragging: false,
        column: null,
        startX: 0,
        startIndex: -1
    },

    populateColumnList() {
    const columnList = document.getElementById('columnList');
    if (!columnList) return;

    columnList.innerHTML = '';
    const hiddenColumns = JSON.parse(localStorage.getItem('hiddenColumns') || '[]');
    const isDeleteEnabled = localStorage.getItem('deleteButtonsVisible') === 'true';

    // Add "Show All Columns" button
    const showAllBtn = document.createElement('button');
    showAllBtn.className = 'show-all-columns-button';
    showAllBtn.textContent = 'Show All Columns';
    showAllBtn.onclick = () => this.showAllColumns();
    columnList.appendChild(showAllBtn);

    AppState.columns.forEach(column => {
        if (column.isRecordNumber) return;

        const item = document.createElement('div');
        item.className = 'column-item';

        const sortIndicator = column.id === AppState.currentSort?.column ? 
            `<span class="sort-arrow">${AppState.currentSort.direction === 'asc' ? ' ↑' : ' ↓'}</span>` : '';

        const columnContent = `
            ${isDeleteEnabled ? `
                <div class="column-delete-cell">
                    <button class="delete-column-btn" title="Delete Column">×</button>
                </div>
            ` : ''}
            <div class="column-visibility-cell">
                <input type="checkbox" 
                       id="col-visibility-${column.id}" 
                       ${!hiddenColumns.includes(column.id) ? 'checked' : ''}>
            </div>
            <div class="column-name-cell">
                ${column.name}${sortIndicator}
            </div>
            <div class="column-type-cell">
                <select class="column-type-select">
                    ${this.getTypeOptions(column.type)}
                </select>
            </div>
        `;

        item.innerHTML = columnContent;

        // Add event listeners
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                this.toggleColumnVisibility(column.id);
            });
        }

        const deleteBtn = item.querySelector('.delete-column-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete the column "${column.name}"?`)) {
                    try {
                        await this.deleteColumn(column.id);
                        await TableManager.loadTableData();
                        this.populateColumnList();
                    } catch (error) {
                        console.error('Failed to delete column:', error);
                        alert('Failed to delete column: ' + error.message);
                    }
                }
            });
        }

        const typeSelect = item.querySelector('.column-type-select');
        if (typeSelect) {
            typeSelect.addEventListener('change', async (e) => {
                try {
                    await this.updateColumnType(column.id, e.target.value);
                    await TableManager.loadTableData();
                } catch (error) {
                    console.error('Failed to update column type:', error);
                    e.target.value = column.type;
                    alert('Failed to change column type: ' + error.message);
                }
            });
        }

        columnList.appendChild(item);
    });
},
async toggleColumnVisibility(columnId) {
    try {
        let hiddenColumns = JSON.parse(localStorage.getItem('hiddenColumns') || '[]');
        
        if (hiddenColumns.includes(columnId)) {
            // Show column
            hiddenColumns = hiddenColumns.filter(id => id !== columnId);
        } else {
            // Hide column
            hiddenColumns.push(columnId);
        }

        localStorage.setItem('hiddenColumns', JSON.stringify(hiddenColumns));
        
        // Update UI
        await TableManager.renderTable();
        this.populateColumnList(); // Refresh the column list to show updated checkbox states
        
        // Show notification
        const isHidden = hiddenColumns.includes(columnId);
        const column = AppState.columns.find(col => col.id === columnId);
        Notifications.success(`Column "${column?.name}" ${isHidden ? 'hidden' : 'shown'} successfully`);
    } catch (error) {
        console.error('Error toggling column visibility:', error);
        Notifications.error('Failed to toggle column visibility');
    }
},
    getTypeOptions(selectedType) {
    const types = [
        { value: 'text', label: 'Text' },
        { value: 'number', label: 'Number' },
        { value: 'date', label: 'Date' },
        { value: 'email', label: 'Email' },
        { value: 'url', label: 'URL' },
        { value: 'textarea', label: 'Long Text' },
      { value: 'backgroundColor', label: 'Background Color' }
    ];

 
    return types.map(type => `
        <option value="${type.value}" ${type.value === selectedType ? 'selected' : ''}>
            ${type.label}
        </option>
    `).join('');
},

    showAllColumns() {
    localStorage.setItem('hiddenColumns', '[]');
    this.populateColumnList();
    TableManager.renderTable();
},
  
    columnTypes: {
        text: {
            validate: (value) => typeof value === 'string',
            format: (value) => String(value)
        },
        number: {
            validate: (value) => !isNaN(Number(value)),
            format: (value) => Number(value)
        },
        date: {
            validate: (value) => !isNaN(Date.parse(value)),
            format: (value) => new Date(value).toISOString()
        },
        email: {
            validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            format: (value) => value.toLowerCase()
        },
        url: {
            validate: (value) => {
                try {
                    new URL(value);
                    return true;
                } catch {
                    return false;
                }
            },
            format: (value) => value
        },
          backgroundColor: {
        validate: (value) => typeof value === 'string',
        format: (value) => String(value)
    },
        textarea: {
            validate: (value) => typeof value === 'string',
            format: (value) => String(value)
        }
    },
openColorPicker(cell, recordId, columnId) {
  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.style.position = 'fixed';
  colorInput.style.left = '-9999px'; // Hide the input off-screen
  document.body.appendChild(colorInput);

  // Set the initial value to the current color (if available)
  const currentColor = cell.style.backgroundColor || '#ffffff';
  colorInput.value = this.rgbToHex(currentColor);

  colorInput.addEventListener('input', async (e) => {
    const colorValue = e.target.value;
    cell.style.background = colorValue;
    try {
      await this.updateCellValue(recordId, columnId, colorValue);
    } catch (error) {
      console.error('Error updating cell value:', error);
      Notifications.error('Failed to update cell value');
    }
  });

  colorInput.click();

  colorInput.addEventListener('blur', () => {
    colorInput.remove();
  });
},

// Helper function
rgbToHex(rgb) {
  const result = rgb.match(/\d+/g);
  if (!result) return '#ffffff'; // Default to white if no match

  const r = parseInt(result[0], 10);
  const g = parseInt(result[1], 10);
  const b = parseInt(result[2], 10);

  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
},

async updateCellValue(recordId, columnId, newValue) {
  try {
    const numericRecordId = Number(recordId);
    const numericColumnId = Number(columnId);

    const record = AppState.records.find(r => r.id === numericRecordId);
    if (!record) {
      console.error(`Record with ID ${numericRecordId} not found.`);
      return;
    }

    // Update the record's data
    record.data[numericColumnId] = newValue;

    // Update the record in the database
    await RecordManager.updateRecord(numericRecordId, record.data);

    // Show success notification
    Notifications.success('Cell updated successfully');
  } catch (error) {
    console.error('Error updating cell value:', error);
    Notifications.error('Failed to update cell value');
  }
},


    async initialize() {
        if (this.initialized) return;
        try {
            this.createColumnButtons();
            this.attachEventListeners();
            this.initialized = true;
        } catch (error) {
            console.error("Failed to initialize ColumnManager:", error);
            throw error;
        }
    },
  
    createColumnButtons() {
        const columnsBtn = document.getElementById('Columns');
        const columnVisibilityModal = document.getElementById('columnVisibilityModal');
        const closeColumnVisibilityBtn = document.getElementById('closeColumnVisibilityModal');
        const modalBackdrop = document.getElementById('modalBackdrop');

        if (columnsBtn) {
            columnsBtn.addEventListener('click', () => {
                if (columnVisibilityModal) {
                    columnVisibilityModal.style.display = 'block';
                    modalBackdrop.style.display = 'block';
                    this.populateColumnList();
                }
            });
        }

        if (closeColumnVisibilityBtn) {
            closeColumnVisibilityBtn.addEventListener('click', () => {
                columnVisibilityModal.style.display = 'none';
                modalBackdrop.style.display = 'none';
            });
        }
    },

    attachEventListeners() {
        // Add Column Modal Events
        const addColumnBtn = document.getElementById('addColumnBtn');
        if (addColumnBtn) {
            addColumnBtn.addEventListener('click', () => this.showAddColumnModal());
        }

        // Save Column Events
        const saveColumnBtn = document.getElementById('saveColumnBtn');
        if (saveColumnBtn) {
            saveColumnBtn.addEventListener('click', (e) => this.handleSaveColumn(e));
        }

        // Close/Cancel Column Modal Events
        ['closeColumnModal', 'cancelColumnBtn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => this.hideAddColumnModal());
            }
        });

        // Modal Backdrop Click Event
        const modalBackdrop = document.getElementById('modalBackdrop');
        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', () => this.hideAddColumnModal());
        }
    },

    showAddColumnModal() {
        const modal = document.getElementById('addColumnModal');
        const backdrop = document.getElementById('modalBackdrop');
        const columnNameInput = document.getElementById('columnName');

        if (!modal || !backdrop || !columnNameInput) return;

        columnNameInput.value = '';
        document.getElementById('columnType').value = 'text';

        modal.style.display = 'block';
        backdrop.style.display = 'block';
        columnNameInput.focus();
    },

    hideAddColumnModal() {
        const modal = document.getElementById('addColumnModal');
        const backdrop = document.getElementById('modalBackdrop');

        if (modal) modal.style.display = 'none';
        if (backdrop) backdrop.style.display = 'none';
    },

    async handleSaveColumn(e) {
        e.preventDefault();

        const columnName = document.getElementById('columnName')?.value.trim();
        const columnType = document.getElementById('columnType')?.value;

        if (!columnName) {
            Notifications.error('Please enter a column name');
            return;
        }

        try {
            UI.showLoadingSpinner();
            await this.addColumn(columnName, columnType);
            this.hideAddColumnModal();
            document.getElementById('columnForm')?.reset();
        } catch (error) {
            console.error('Failed to add column:', error);
            Notifications.error('Failed to add column: ' + error.message);
        } finally {
            UI.hideLoadingSpinner();
        }
    },

    async addColumn(name, type) {
        try {
            if (!AppState.currentTableId) {
                throw new Error('No table selected');
            }

            // Check for existing column with same name
            const existingColumns = await this.loadColumns(AppState.currentTableId);
            if (existingColumns.some(col => col.name === name)) {
                throw new Error('A column with this name already exists');
            }

            const transaction = DatabaseManager.db.transaction("columns", "readwrite");
            const store = transaction.objectStore("columns");

            const newColumn = {
                name,
                type,
                tableId: AppState.currentTableId,
                order: existingColumns.length,
                created: new Date().toISOString()
            };

            const columnId = await new Promise((resolve, reject) => {
                const request = store.add(newColumn);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            AppState.columns = await this.loadColumns(AppState.currentTableId);
            await TableManager.renderTable();

            Notifications.success('Column added successfully');
            return true;
        } catch (error) {
            console.error("Error adding column:", error);
            Notifications.error('Failed to add column: ' + error.message);
            throw error;
        }
    },

    async loadColumns(tableId) {
        if (!tableId) return [];

        try {
            const transaction = DatabaseManager.db.transaction("columns", "readonly");
            const store = transaction.objectStore("columns");
            const index = store.index("tableId");

            return new Promise((resolve, reject) => {
                const request = index.getAll(tableId);
                request.onsuccess = () => {
                    const columns = request.result.sort((a, b) => a.order - b.order);
                    resolve(columns);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error("Error loading columns:", error);
            throw error;
        }
    },

    async deleteColumn(columnId) {
        try {
            const column = AppState.columns.find(col => col.id === columnId);
            if (!column) {
                throw new Error("Column not found");
            }

            // Store column data for undo
            const columnData = {
                column: { ...column },
                records: await this.getColumnRecords(columnId)
            };

            const transaction = DatabaseManager.db.transaction(['columns', 'records'], 'readwrite');
            const columnStore = transaction.objectStore('columns');
            const recordStore = transaction.objectStore('records');

            // Delete column
            await new Promise((resolve, reject) => {
                const request = columnStore.delete(columnId);
                request.onsuccess = resolve;
                request.onerror = () => reject(request.error);
            });

            // Update records
            const records = await new Promise((resolve, reject) => {
                const request = recordStore.index('tableId').getAll(AppState.currentTableId);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            for (const record of records) {
                if (record.data[columnId]) {
                    delete record.data[columnId];
                    await new Promise((resolve, reject) => {
                        const request = recordStore.put(record);
                        request.onsuccess = resolve;
                        request.onerror = () => reject(request.error);
                    });
                }
            }

            // Add to action history
            actionHistory.addAction({
                type: 'deleteColumn',
                data: columnData
            });

            // Update AppState and UI
            AppState.columns = await this.loadColumns(AppState.currentTableId);
            await TableManager.renderTable();

            Notifications.success('Column deleted successfully');
            return true;

        } catch (error) {
            console.error("Error deleting column:", error);
            Notifications.error(error.message);
            throw error;
        }
    },

    async renameColumn(columnId, newName) {
        try {
            // Validate new name
            const validatedName = await this.validateColumnName(newName);

            const transaction = DatabaseManager.db.transaction("columns", "readwrite");
            const store = transaction.objectStore("columns");

            const column = await new Promise((resolve, reject) => {
                const request = store.get(columnId);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            if (!column) {
                throw new Error('Column not found');
            }

            // Store old name for undo
            const oldName = column.name;

            // Update column
            column.name = validatedName;
            column.modified = new Date().toISOString();

            await new Promise((resolve, reject) => {
                const request = store.put(column);
                request.onsuccess = resolve;
                request.onerror = () => reject(request.error);
            });

            // Add to action history
            actionHistory.addAction({
                type: 'renameColumn',
                data: {
                    columnId,
                    oldName,
                    newName: validatedName
                }
            });

            // Update AppState and UI
            AppState.columns = await this.loadColumns(AppState.currentTableId);
            await TableManager.renderTable();

            Notifications.success('Column renamed successfully');
            return true;

        } catch (error) {
            console.error('Error renaming column:', error);
            Notifications.error(error.message);
            throw error;
        }
    },

    async updateColumnType(columnId, newType) {
        try {
            if (!this.columnTypes[newType]) {
                throw new Error('Invalid column type');
            }

            const transaction = DatabaseManager.db.transaction(['columns', 'records'], 'readwrite');
            const columnStore = transaction.objectStore('columns');
            const recordStore = transaction.objectStore('records');

            // Get current column data
            const column = await new Promise((resolve, reject) => {
                const request = columnStore.get(columnId);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            if (!column) {
                throw new Error('Column not found');
            }

            // Store old type for undo
            const oldType = column.type;

            // Update column type
            column.type = newType;
            column.modified = new Date().toISOString();
            column.options = this.getDefaultOptions(newType);

            await new Promise((resolve, reject) => {
                const request = columnStore.put(column);
                request.onsuccess = resolve;
                request.onerror = () => reject(request.error);
            });

            // Convert existing data
            const records = await new Promise((resolve, reject) => {
                const request = recordStore.index('tableId').getAll(AppState.currentTableId);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            for (const record of records) {
                if (record.data[columnId] !== undefined) {
                    try {
                        record.data[columnId] = this.convertValue(
                            record.data[columnId],
                            oldType,
                            newType
                        );
                        await new Promise((resolve, reject) => {
                            const request = recordStore.put(record);
                            request.onsuccess = resolve;
                            request.onerror = () => reject(request.error);
                        });
                    } catch (error) {
                        console.warn(`Failed to convert value for record ${record.id}:`, error);
                        record.data[columnId] = ''; // Reset to empty if conversion fails
                    }
                }
            }

            // Add to action history
            actionHistory.addAction({
                type: 'updateColumnType',
                data: {
                    columnId,
                    oldType,
                    newType
                }
            });

            // Update AppState and UI
            AppState.columns = await this.loadColumns(AppState.currentTableId);
            await TableManager.renderTable();

            Notifications.success('Column type updated successfully');
            return true;

        } catch (error) {
            console.error("Error updating column type:", error);
            Notifications.error(error.message);
            throw error;
        }
    },

    async validateColumnName(name) {
        const sanitized = name.trim();
        
        if (!sanitized) {
            throw new Error('Column name cannot be empty');
        }
        
        if (sanitized.length < 2) {
            throw new Error('Column name must be at least 2 characters long');
        }
        
        if (sanitized.length > 50) {
            throw new Error('Column name must be less than 50 characters');
        }
        
        const validNameRegex = /^[a-zA-Z0-9\s_-]+$/;
        if (!validNameRegex.test(sanitized)) {
            throw new Error('Column name can only contain letters, numbers, spaces, underscores and hyphens');
        }
        
        return sanitized;
    },

    getDefaultOptions(type) {
        const commonOptions = {
            required: false,
            unique: false,
            defaultValue: null
        };

        switch (type) {
            case 'number':
                return {
                    ...commonOptions,
                    min: null,
                    max: null,
                    decimal: false
                };
            case 'text':
                return {
                    ...commonOptions,
                    minLength: null,
                    maxLength: null,
                    pattern: null
                };
            case 'date':
                return {
                    ...commonOptions,
                    minDate: null,
                    maxDate: null,
                    format: 'YYYY-MM-DD'
                };
            default:
                return commonOptions;
        }
    },

    convertValue(value, fromType, toType) {
        if (value === null || value === undefined || value === '') {
            return '';
        }

        try {
            // First convert to a standardized format
            const standardValue = this.columnTypes[fromType].format(value);

            // Then convert to the new type
            return this.columnTypes[toType].format(standardValue);
        } catch (error) {
            console.warn('Value conversion failed:', error);
            return '';
        }
    },

    async getColumnRecords(columnId) {
        const transaction = DatabaseManager.db.transaction('records', 'readonly');
        const store = transaction.objectStore('records');
        
        return new Promise((resolve, reject) => {
            const request = store.index('tableId').getAll(AppState.currentTableId);
            request.onsuccess = () => {
                const records = request.result
                    .filter(record => record.data[columnId] !== undefined)
                    .map(record => ({
                        recordId: record.id,
                        value: record.data[columnId]
                    }));
                resolve(records);
            };
            request.onerror = () => reject(request.error);
        });
    },

    initializeContextMenu() {
        document.addEventListener('contextmenu', (e) => {
            const th = e.target.closest('th');
            if (!th || !th.dataset.columnId) return;

            e.preventDefault();
            this.showColumnContextMenu(e, parseInt(th.dataset.columnId));
        });
    },

    showColumnContextMenu(event, columnId) {
        const existingMenu = document.querySelector('.column-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const menu = document.createElement('div');
        menu.className = 'column-context-menu';
        menu.innerHTML = `
            <button class="menu-item" data-action="rename">Rename Column</button>
            <button class="menu-item" data-action="hide">Hide Column</button>
            <button class="menu-item" data-action="delete">Delete Column</button>
        `;

        menu.style.position = 'fixed';
        menu.style.left = `${event.pageX}px`;
        menu.style.top = `${event.pageY}px`;
        document.body.appendChild(menu);

        // Adjust position if menu would go off screen
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            menu.style.left = `${window.innerWidth - rect.width - 5}px`;
        }
        if (rect.bottom > window.innerHeight) {
            menu.style.top = `${window.innerHeight - rect.height - 5}px`;
        }

        menu.addEventListener('click', async (e) => {
            const action = e.target.dataset.action;
          if (!action) return;

            try {
                switch (action) {
                    case 'rename':
                        await this.promptRenameColumn(columnId);
                        break;
                    case 'hide':
                        this.hideColumn(columnId);
                        break;
                    case 'delete':
                        if (confirm('Are you sure you want to delete this column? This action can be undone.')) {
                            await this.deleteColumn(columnId);
                        }
                        break;
                }
            } catch (error) {
                console.error('Context menu action failed:', error);
                Notifications.error(error.message);
            } finally {
                menu.remove();
            }
        });

        // Close menu when clicking outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 0);
    },

    hideColumn(columnId) {
        let hiddenColumns = JSON.parse(localStorage.getItem('hiddenColumns') || '[]');
        if (!hiddenColumns.includes(columnId)) {
            hiddenColumns.push(columnId);
            localStorage.setItem('hiddenColumns', JSON.stringify(hiddenColumns));
            TableManager.renderTable();
        }
    },

    initializeDragAndDrop() {
        const headerRow = document.querySelector('#dataTable thead tr');
        if (!headerRow) return;

        headerRow.addEventListener('dragstart', this.handleDragStart.bind(this));
        headerRow.addEventListener('dragover', this.handleDragOver.bind(this));
        headerRow.addEventListener('drop', this.handleDrop.bind(this));
        headerRow.addEventListener('dragend', this.handleDragEnd.bind(this));
    },

    handleDragStart(e) {
        const th = e.target.closest('th');
        if (!th || !th.dataset.columnId) return;

        this.dragState = {
            isDragging: true,
            column: th,
            startX: e.clientX,
            startIndex: Array.from(th.parentNode.children).indexOf(th)
        };

        th.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    },

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const th = e.target.closest('th');
        if (!th || !this.dragState.column || th === this.dragState.column) return;

        const children = Array.from(th.parentNode.children);
        const draggedIndex = children.indexOf(this.dragState.column);
        const targetIndex = children.indexOf(th);

        if (draggedIndex !== targetIndex) {
            th.parentNode.insertBefore(
                this.dragState.column,
                draggedIndex < targetIndex ? th.nextSibling : th
            );
        }
    },

    async handleDrop(e) {
        e.preventDefault();
        if (!this.dragState.isDragging) return;

        const th = e.target.closest('th');
        if (!th || !th.dataset.columnId) return;

        const newIndex = Array.from(th.parentNode.children).indexOf(th);
        await this.updateColumnOrder(this.dragState.startIndex, newIndex);
    },

    handleDragEnd(e) {
        if (this.dragState.column) {
            this.dragState.column.classList.remove('dragging');
        }
        this.dragState = {
            isDragging: false,
            column: null,
            startX: 0,
            startIndex: -1
        };
    },

    async updateColumnOrder(fromIndex, toIndex) {
        try {
            const columns = [...AppState.columns];
            const [movedColumn] = columns.splice(fromIndex, 1);
            columns.splice(toIndex, 0, movedColumn);

            // Update order property for all affected columns
            columns.forEach((column, index) => {
                column.order = index;
            });

            const transaction = DatabaseManager.db.transaction('columns', 'readwrite');
            const store = transaction.objectStore('columns');

            await Promise.all(columns.map(column => {
                return new Promise((resolve, reject) => {
                    const request = store.put(column);
                    request.onsuccess = resolve;
                    request.onerror = () => reject(request.error);
                });
            }));

            AppState.columns = columns;
            await TableManager.renderTable();

            Notifications.success('Column order updated');
        } catch (error) {
            console.error('Error updating column order:', error);
            Notifications.error('Failed to update column order');
            throw error;
        }
    },

    async loadSavedColumnStates() {
        try {
            const hiddenColumns = JSON.parse(localStorage.getItem('hiddenColumns') || '[]');
            const columnWidths = JSON.parse(localStorage.getItem('columnWidths') || '{}');

            // Apply saved states to table headers
            document.querySelectorAll('#dataTable th[data-column-id]').forEach(th => {
                const columnId = parseInt(th.dataset.columnId);
                if (hiddenColumns.includes(columnId)) {
                    th.style.display = 'none';
                }
                if (columnWidths[columnId]) {
                    th.style.width = columnWidths[columnId];
                }
            });
        } catch (error) {
            console.error('Error loading saved column states:', error);
        }
    },

    cleanup() {
        // Remove event listeners
        const headerRow = document.querySelector('#dataTable thead tr');
        if (headerRow) {
            const newRow = headerRow.cloneNode(true);
            headerRow.parentNode.replaceChild(newRow, headerRow);
        }

        // Clear state
        this.dragState = {
            isDragging: false,
            column: null,
            startX: 0,
            startIndex: -1
        };
        
        this.initialized = false;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ColumnManager.initialize().catch(error => {
        console.error('Failed to initialize ColumnManager:', error);
        ErrorManager.showError('Failed to initialize column management system', error);
    });
});

export default ColumnManager;