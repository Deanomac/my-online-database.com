// tableInteractions.js
import { AppState } from './appState.js';
import { RecordManager } from './recordManager.js';
import { TableManager } from './tableManager.js';
import { FormManager } from './formManager.js';
import { ColumnManager } from './columnManager.js';

export const TableInteractions = {

    state: {
        selectedRows: new Set(),
        isSelecting: false,
        lastSelectedIndex: -1,
        currentEditCell: null,
        currentFocusedCell: null,
        contextMenu: null,
        debounceTimeout: null
    },

    initializeContextMenu() {
        const table = document.getElementById('dataTable');
        if (!table) return;

        table.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const row = e.target.closest('tr');
            if (!row || !row.parentElement.tagName === 'TBODY') return;

            if (!this.state.selectedRows.has(row)) {
                this.clearSelection();
                this.selectRow(row);
            }

            this.showContextMenu(e.pageX, e.pageY);
        });
    },

    showContextMenu(x, y) {
        if (!this.state.contextMenu) {
            this.createContextMenu();
        }

        const menu = this.state.contextMenu;
        menu.style.display = 'block';

        // Adjust position to stay within viewport
        const rect = menu.getBoundingClientRect();
        const adjustedX = Math.min(x, window.innerWidth - rect.width);
        const adjustedY = Math.min(y, window.innerHeight - rect.height);

        menu.style.left = `${adjustedX}px`;
        menu.style.top = `${adjustedY}px`;
    },

    hideContextMenu() {
        if (this.state.contextMenu) {
            this.state.contextMenu.style.display = 'none';
        }
    },

    init() {
        const table = document.getElementById('dataTable');
        if (!table) return;

       this.addTableStyles();
        this.addContextMenuStyles();
        this.initializeContextMenu();
        this.initializeTableEvents(table);
        this.initializeGlobalEvents();
    },

    initializeTableEvents(table) {
        // Row selection (single click)
        table.addEventListener('click', this.handleTableClick.bind(this));
        
        // Cell editing (single click)
        table.addEventListener('click', this.handleCellClick.bind(this));
        
        // Keyboard navigation within table
        table.addEventListener('keydown', this.handleTableKeydown.bind(this));
        
        // Context menu
        table.addEventListener('contextmenu', this.handleContextMenu.bind(this));
        
        // Mouse selection
        table.addEventListener('mousedown', this.handleMouseDown.bind(this));
    },

    initializeGlobalEvents() {
        // Document-level events
        document.addEventListener('click', (e) => {
            if (this.state.currentEditCell && !this.state.currentEditCell.contains(e.target)) {
                this.saveEdit(this.state.currentEditCell);
            }
            this.hideContextMenu();
        });

        document.addEventListener('keydown', this.handleGlobalKeydown.bind(this));
        document.addEventListener('copy', this.handleCopy.bind(this));
        document.addEventListener('paste', this.handlePaste.bind(this));
        
        // Window events
        window.addEventListener('resize', () => this.hideContextMenu());
        window.addEventListener('scroll', () => this.hideContextMenu());

        // View switching
        const viewButtons = document.querySelectorAll('#tableViewBtn, #formViewBtn');
        viewButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (this.state.currentEditCell) {
                    this.saveEdit(this.state.currentEditCell);
                }
            });
        });
    },
  
    addTableStyles() {
    const styleId = 'table-interaction-styles';
    if (document.getElementById(styleId)) return;

    const styles = `
        .table-row-selected,
        #dataTable tbody tr.selected {
            background-color: rgba(var(--primary-color-rgb, 74, 109, 167), 0.1) !important;
            border-color: var(--primary-color) !important;
        }

        #dataTable tbody tr.selected td {
            background-color: inherit !important;
            border-color: var(--primary-color) !important;
        }

        #dataTable tbody tr.selected:hover td {
            background-color: rgba(var(--primary-color-rgb, 74, 109, 167), 0.15) !important;
        }

        /* Add a subtle left border to indicate selection */
        #dataTable tbody tr.selected td:first-child {
            border-left: 2px solid var(--primary-color) !important;
        }
    `;

    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
},
  
    handleTableClick(e) {
    const row = e.target.closest('tr');
    if (!row || !row.parentElement.tagName === 'TBODY') return;
    if (e.target.closest('.editing')) return;

    const tbody = row.parentElement;
    const rowIndex = Array.from(tbody.children).indexOf(row);
    
    // Update AppState
    AppState.currentRecordIndex = rowIndex;
    
    // Update visual selection
    tbody.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
    row.classList.add('selected');

    // If you have other selection logic (like handling Ctrl+click or Shift+click),
    // keep it after this basic selection handling
    if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
        this.clearSelection();
        this.selectRow(row);
    } else if (e.ctrlKey || e.metaKey) {
        this.toggleRowSelection(row);
    } else if (e.shiftKey) {
        this.handleShiftSelection(row);
    }
},

handleCellClick(e) {
    const td = e.target.closest('td');
    if (!td || td.classList.contains('actions-column') || 
        td.classList.contains('row-number-cell')) return;

    e.stopPropagation();

    const row = td.closest('tr');
    if (row) {
        const rowIndex = Array.from(row.parentElement.children).indexOf(row);
        AppState.currentRecordIndex = rowIndex;
    }

    const columnId = parseInt(td.dataset.columnId, 10);
    const column = AppState.columns.find(col => col.id === columnId);
    if (!column) return;

    if (column.type === 'backgroundColor') {
        // For backgroundColor cells, open the color picker
        ColumnManager.openColorPicker(td, td.dataset.recordId, td.dataset.columnId);
    } else {
        // For other cells, start editing
        this.startEditing(td);
    }
},

    handleTableKeydown(e) {
        const td = e.target.closest('td');
        if (!td) return;

        switch (e.key) {
            case 'Tab':
                e.preventDefault();
                this.navigateNext(td, e.shiftKey);
                break;
            case 'Enter':
                if (!td.classList.contains('editing')) {
                    e.preventDefault();
                    this.startEditing(td);
                } else if (!e.shiftKey) {
                    e.preventDefault();
                    this.navigateNext(td, false);
                }
                break;
            case 'Escape':
                if (td.classList.contains('editing')) {
                    e.preventDefault();
                    this.cancelEdit(td);
                }
                break;
            case 'ArrowRight':
                if (!td.classList.contains('editing')) {
                    e.preventDefault();
                    this.navigateNext(td, false);
                }
                break;
            case 'ArrowLeft':
                if (!td.classList.contains('editing')) {
                    e.preventDefault();
                    this.navigateNext(td, true);
                }
                break;
            case 'ArrowDown':
                if (!td.classList.contains('editing')) {
                    e.preventDefault();
                    this.navigateVertical(td, 1);
                }
                break;
            case 'ArrowUp':
                if (!td.classList.contains('editing')) {
                    e.preventDefault();
                    this.navigateVertical(td, -1);
                }
                break;
        }
    },

    handleGlobalKeydown(e) {
        if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            this.selectAllRows();
        }
    },

    handleMouseDown(e) {
        if (e.target.closest('.editing')) return;
        
        const row = e.target.closest('tr');
        if (!row || !row.parentElement.tagName === 'TBODY') return;

        this.state.isSelecting = true;
        if (!e.ctrlKey && !e.metaKey) {
            this.clearSelection();
        }

        const handleMouseMove = this.handleMouseMove.bind(this);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', () => {
            this.state.isSelecting = false;
            document.removeEventListener('mousemove', handleMouseMove);
        }, { once: true });
    },

    handleMouseMove(e) {
        if (!this.state.isSelecting) return;

        const row = document.elementFromPoint(e.clientX, e.clientY)?.closest('tr');
        if (row && row.parentElement.tagName === 'TBODY' && !this.state.selectedRows.has(row)) {
            this.selectRow(row);
        }
    },

    handleCopy(e) {
        if (!this.isTableFocused()) return;
        
        e.preventDefault();
        const text = this.getSelectedText();
        e.clipboardData.setData('text/plain', text);
    },

    handlePaste(e) {
        if (!this.state.currentEditCell) return;
        
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        const input = this.state.currentEditCell.querySelector('input, textarea');
        if (input) {
            input.value = text;
        }
    },

    handleContextMenu(e) {
        e.preventDefault();
        const row = e.target.closest('tr');
        if (!row || !row.parentElement.tagName === 'TBODY') return;

        if (!this.state.selectedRows.has(row)) {
            this.clearSelection();
            this.selectRow(row);
        }

        this.showContextMenu(e.pageX, e.pageY);
    },

startEditing(td) {
    if (td.classList.contains('editing')) return;

    const columnId = parseInt(td.dataset.columnId, 10);
    const column = AppState.columns.find(col => col.id === columnId);
    if (!column) return;

    if (column.type === 'backgroundColor') {
        // Do not start editing for backgroundColor cells
        return;
    }

    if (this.state.currentEditCell) {
        this.saveEdit(this.state.currentEditCell);
    }

    const originalValue = td.textContent;
    td.classList.add('editing');

    const input = document.createElement(td.offsetHeight > 50 ? 'textarea' : 'input');
    input.value = originalValue;
    input.dataset.originalValue = originalValue;

    input.addEventListener('click', (e) => e.stopPropagation());
    input.addEventListener('dblclick', (e) => e.stopPropagation());

    td.textContent = '';
    td.appendChild(input);
    input.focus();
    input.select();

    this.state.currentEditCell = td;
    this.state.currentFocusedCell = td;
},

    async saveEdit(td) {
        if (!td.classList.contains('editing')) return;

        const input = td.querySelector('input, textarea');
        if (!input) return;

        const newValue = input.value;
        const originalValue = input.dataset.originalValue;

        if (newValue !== originalValue) {
            const columnId = AppState.columns[td.cellIndex - 1]?.id;
            const rowIndex = td.parentElement.rowIndex - 1;
            const record = AppState.records[rowIndex];

            if (record && columnId) {
                try {
                    const updatedData = { ...record.data, [columnId]: newValue };
                    await RecordManager.updateRecord(record.id, updatedData);
                    AppState.records[rowIndex].data = updatedData;
                    
                    if (rowIndex === AppState.currentRecordIndex) {
                        FormManager.displayCurrentRecord();
                    }
                } catch (error) {
                    console.error('Failed to save edit:', error);
                    td.textContent = originalValue;
                    return;
                }
            }
        }

        td.classList.remove('editing');
        td.textContent = newValue;
        if (td === this.state.currentEditCell) {
            this.state.currentEditCell = null;
        }
    },

    cancelEdit(td) {
        if (!td.classList.contains('editing')) return;

        const input = td.querySelector('input, textarea');
        if (!input) return;

        td.classList.remove('editing');
        td.textContent = input.dataset.originalValue;
        
        if (td === this.state.currentEditCell) {
            this.state.currentEditCell = null;
        }
    },

    navigateNext(currentCell, reverse = false) {
        if (!currentCell) return;

        const row = currentCell.closest('tr');
        const tbody = row.parentElement;
        const cells = Array.from(row.cells).filter(cell => 
            !cell.classList.contains('row-number-cell') && 
            !cell.classList.contains('actions-column')
        );
        
        const currentIndex = cells.indexOf(currentCell);
        let nextCell, nextRow;

        if (reverse) {
            if (currentIndex > 0) {
                nextCell = cells[currentIndex - 1];
            } else {
                nextRow = row.previousElementSibling || tbody.lastElementChild;
                if (nextRow) {
                    const nextCells = Array.from(nextRow.cells).filter(cell => 
                        !cell.classList.contains('row-number-cell') && 
                        !cell.classList.contains('actions-column')
                    );
                    nextCell = nextCells[nextCells.length - 1];
                }
            }
        } else {
            if (currentIndex < cells.length - 1) {
                nextCell = cells[currentIndex + 1];
            } else {
                nextRow = row.nextElementSibling || tbody.firstElementChild;
                if (nextRow) {
                    const nextCells = Array.from(nextRow.cells).filter(cell => 
                        !cell.classList.contains('row-number-cell') && 
                        !cell.classList.contains('actions-column')
                    );
                    nextCell = nextCells[0];
                }
            }
        }

        if (nextCell) {
            if (currentCell.classList.contains('editing')) {
                this.saveEdit(currentCell);
            }
            this.startEditing(nextCell);
            if (nextRow) {
                const newRowIndex = Array.from(tbody.children).indexOf(nextRow);
                AppState.currentRecordIndex = newRowIndex;
            }
        }
    },

    navigateVertical(currentCell, direction) {
        if (!currentCell) return;

        const row = currentCell.closest('tr');
        const tbody = row.parentElement;
        const currentColumnIndex = Array.from(row.cells).indexOf(currentCell);
        const nextRow = direction > 0 ? row.nextElementSibling : row.previousElementSibling;

        if (nextRow) {
            const nextCell = nextRow.cells[currentColumnIndex];
            if (nextCell) {
                if (currentCell.classList.contains('editing')) {
                    this.saveEdit(currentCell);
                }
                this.startEditing(nextCell);
                const newRowIndex = Array.from(tbody.children).indexOf(nextRow);
                AppState.currentRecordIndex = newRowIndex;
            }
        }
    },

    selectRow(row) {
    if (!row) return;
    
    row.classList.add('selected');
    this.state.selectedRows.add(row);
    const rowIndex = Array.from(row.parentNode.children).indexOf(row);
    this.state.lastSelectedIndex = rowIndex;
    
    // Update AppState and Form View
    AppState.currentRecordIndex = rowIndex;
},

    clearSelection() {
        this.state.selectedRows.forEach(row => row.classList.remove('selected'));
        this.state.selectedRows.clear();
        this.state.lastSelectedIndex = -1;
    },

    selectAllRows() {
        const tbody = document.querySelector('#dataTable tbody');
        if (!tbody) return;

        const rows = Array.from(tbody.children);
        this.clearSelection();
        rows.forEach(row => this.selectRow(row));
    },

createContextMenu() {
    // Remove any existing menus
    if (this.state.contextMenu) {
        this.state.contextMenu.remove();
    }

    // Create new context menu
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.display = 'none';
    menu.style.position = 'fixed';
    menu.style.zIndex = '9999';
    
    // Add to document body, not table
    document.body.appendChild(menu);
    this.state.contextMenu = menu;
},

handleContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();

    // Check if clicking on header or body
    const th = e.target.closest('th');
    const row = e.target.closest('tr');
    const cell = e.target.closest('td');

    if (th && th.dataset.columnId) {
        // Column header context menu
        this.showColumnMenu(e.pageX, e.pageY, parseInt(th.dataset.columnId));
    } else if (row && cell && row.parentElement.tagName === 'TBODY') {
        // Table cell context menu
        if (!this.state.selectedRows.has(row)) {
            this.clearSelection();
            this.selectRow(row);
        }
        this.showRowMenu(e.pageX, e.pageY);
    }
},

showColumnMenu(x, y, columnId) {
    if (!this.state.contextMenu) {
        this.createContextMenu();
    }

    const menu = this.state.contextMenu;
    menu.innerHTML = `
        <button class="menu-item" data-action="rename">Rename Column</button>
        <button class="menu-item" data-action="hide">Hide Column</button>
        
    `;

    menu.dataset.columnId = columnId;
    this.positionMenu(menu, x, y);

    // Handle column menu actions
    menu.onclick = async (e) => {
        const action = e.target.dataset.action;
        if (!action) return;

        try {
            switch (action) {
                case 'rename':
                    await TableManager.promptRenameColumn(columnId);
                    break;
                case 'hide':
                    let hiddenColumns = JSON.parse(localStorage.getItem('hiddenColumns') || '[]');
                    hiddenColumns.push(columnId);
                    localStorage.setItem('hiddenColumns', JSON.stringify(hiddenColumns));
                    await TableManager.renderTable();
                    break;
                case 'delete':
                    const column = AppState.columns.find(col => col.id === columnId);
                    if (column && confirm(`Are you sure you want to delete column "${column.name}"?`)) {
                        await ColumnManager.deleteColumn(columnId);
                        await TableManager.loadTableData();
                    }
                    break;
            }
        } catch (error) {
            console.error('Context menu action failed:', error);
            alert('Operation failed: ' + error.message);
        }

        this.hideContextMenu();
    };
},

showRowMenu(x, y) {
    if (!this.state.contextMenu) {
        this.createContextMenu();
    }

    const menu = this.state.contextMenu;
    menu.innerHTML = `
        <button class="menu-item" data-action="edit">Edit</button>
        <button class="menu-item" data-action="copy">Copy</button>
        <button class="menu-item" data-action="delete">Delete</button>
    `;

    this.positionMenu(menu, x, y);

    // Handle row menu actions
    menu.onclick = (e) => {
        const action = e.target.dataset.action;
        if (!action) return;

        this.handleContextMenuAction(action);
        this.hideContextMenu();
    };
},

positionMenu(menu, x, y) {
    menu.style.display = 'block';
    
    // Adjust position to stay within viewport
    const rect = menu.getBoundingClientRect();
    const adjustedX = Math.min(x, window.innerWidth - rect.width - 5);
    const adjustedY = Math.min(y, window.innerHeight - rect.height - 5);

    menu.style.left = `${adjustedX}px`;
    menu.style.top = `${adjustedY}px`;
},

hideContextMenu() {
    if (this.state.contextMenu) {
        this.state.contextMenu.style.display = 'none';
    }
},

    hideContextMenu() {
        if (this.state.contextMenu) {
            this.state.contextMenu.style.display = 'none';
        }
    },

    handleContextMenuAction(action) {
        const selectedRows = Array.from(this.state.selectedRows);
        if (!selectedRows.length) return;

        switch (action) {
            case 'edit':
                const firstRow = selectedRows[0];
                const firstCell = Array.from(firstRow.cells).find(cell => 
                    !cell.classList.contains('row-number-cell') && 
                    !cell.classList.contains('actions-column')
                );
                if (firstCell) {
                    this.startEditing(firstCell);
                }
                break;

            case 'copy':
                const text = this.getSelectedText();
                navigator.clipboard.writeText(text)
                    .catch(err => console.error('Failed to copy:', err));
                break;

            case 'delete':
                selectedRows.forEach(row => {
                    const rowIndex = row.rowIndex - 1;
                    const record = AppState.records[rowIndex];
                    if (record) {
                        RecordManager.deleteRecord(record.id);
                    }
                });
                break;
        }
    },

    handleShiftSelection(targetRow) {
        const tbody = targetRow.parentElement;
        const rows = Array.from(tbody.children);
        const targetIndex = rows.indexOf(targetRow);
        
        const [start, end] = [
            Math.min(this.state.lastSelectedIndex, targetIndex),
            Math.max(this.state.lastSelectedIndex, targetIndex)
        ];

        this.clearSelection();
        for (let i = start; i <= end; i++) {
            this.selectRow(rows[i]);
        }
    },

    toggleRowSelection(row) {
        if (this.state.selectedRows.has(row)) {
            row.classList.remove('selected');
            this.state.selectedRows.delete(row);
        } else {
            this.selectRow(row);
        }
    },

    isTableFocused() {
        const table = document.getElementById('dataTable');
        return table && (
            table.contains(document.activeElement) || 
            document.activeElement === document.body
        );
    },

    getSelectedText() {
        return Array.from(this.state.selectedRows)
            .map(row => {
                return Array.from(row.cells)
                    .slice(1) // Skip row number cell
                    .map(cell => cell.textContent.trim())
                    .join('\t');
            })
            .join('\n');
    },

    cleanup() {
        // Remove context menu
        if (this.state.contextMenu && this.state.contextMenu.parentNode) {
            this.state.contextMenu.parentNode.removeChild(this.state.contextMenu);
        }

        // Clear state
        this.state = {
            selectedRows: new Set(),
            isSelecting: false,
            lastSelectedIndex: -1,
            currentEditCell: null,
            currentFocusedCell: null,
            contextMenu: null,
            debounceTimeout: null
        };

        // Remove any remaining event listeners
        const table = document.getElementById('dataTable');
        if (table) {
            const newTable = table.cloneNode(true);
            table.parentNode.replaceChild(newTable, table);
        }
    },

    addContextMenuStyles() {
        const styleId = 'table-interactions-styles';
        if (document.getElementById(styleId)) return;

        const styles = `
            .context-menu {
                position: fixed;
                background: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius-md);
                padding: 4px;
                min-width: 150px;
                box-shadow: var(--shadow-lg);
                z-index: 9999;
                user-select: none;
            }

            .context-menu button {
                display: block;
                width: 100%;
                padding: 8px 12px;
                text-align: left;
                background: none;
                border: none;
                border-radius: 4px;
                color: var(--text-primary);
                cursor: pointer;
                font-size: 14px;
                transition: background-color 0.2s;
            }

            .context-menu button:hover {
                background-color: var(--row-hover);
            }

            .context-menu button:active {
                background-color: var(--primary-color);
                color: white;
            }
        `;

        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }
};


document.addEventListener('DOMContentLoaded', () => {
    TableInteractions.init();
});

export default TableInteractions;