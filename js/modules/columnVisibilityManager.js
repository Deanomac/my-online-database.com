// columnVisibilityManager.js
import { AppState } from './appState.js';
import { TableManager } from './tableManager.js';
import { UI } from './ui.js';
import { DatabaseManager } from './databaseManager.js';
import { ColumnManager } from './columnManager.js';

export const ColumnVisibilityManager = {
init() {
    this.attachEventListeners();
    this.removeExistingContextMenus();
    
    // Add listener for delete toggle changes
    document.getElementById('octoberToggleDelete')?.addEventListener('change', () => {
        if (document.getElementById('columnVisibilityModal')?.style.display === 'block') {
            this.populateColumnList(); // Refresh list if modal is open
        }
    });
},

    attachEventListeners() {
        // Column visibility button handlers
        const columnButtons = document.querySelectorAll('[id^="Columns"]');
        columnButtons.forEach(button => {
            button.addEventListener('click', () => this.showColumnVisibilityModal());
        });

        // Modal close handlers
        document.getElementById('closeColumnVisibilityModal')?.addEventListener('click', 
            () => this.hideColumnVisibilityModal());
        document.getElementById('closeColumnVisibilityBtn')?.addEventListener('click', 
            () => this.hideColumnVisibilityModal());

        // Show all columns handler
        document.getElementById('showAllColumns')?.addEventListener('click', 
            () => this.showAllColumns());
    },

    showColumnVisibilityModal() {
        const modal = document.getElementById('columnVisibilityModal');
        const backdrop = UI.elements.modalBackdrop;
        
        if (!modal || !backdrop) return;

        this.populateColumnList();
        
        modal.style.display = 'block';
        backdrop.style.display = 'block';

        // Focus first checkbox for keyboard accessibility
        const firstCheckbox = modal.querySelector('input[type="checkbox"]');
        if (firstCheckbox) {
            firstCheckbox.focus();
        }
    },

    hideColumnVisibilityModal() {
        const modal = document.getElementById('columnVisibilityModal');
        const backdrop = UI.elements.modalBackdrop;
        
        if (modal) modal.style.display = 'none';
        if (backdrop) backdrop.style.display = 'none';
    },

    getHiddenColumns() {
        try {
            return JSON.parse(localStorage.getItem('hiddenColumns') || '[]');
        } catch {
            return [];
        }
    },

    async toggleColumnVisibility(columnId) {
        let hiddenColumns = this.getHiddenColumns();
        
        if (hiddenColumns.includes(columnId)) {
            // Show column
            hiddenColumns = hiddenColumns.filter(id => id !== columnId);
        } else {
            // Hide column
            hiddenColumns.push(columnId);
        }

        localStorage.setItem('hiddenColumns', JSON.stringify(hiddenColumns));
        await TableManager.renderTable();
    },

    showAllColumns() {
        localStorage.setItem('hiddenColumns', '[]');
        this.populateColumnList();
        TableManager.renderTable();
    },

    async handleDeleteColumn(columnId, columnName) {
        if (confirm(`Are you sure you want to delete the column "${columnName}"? This action cannot be undone.`)) {
            try {
                UI.showLoadingSpinner();
                await ColumnManager.deleteColumn(columnId);
                await TableManager.loadTableData();
                this.populateColumnList(); // Refresh the list
            } catch (error) {
                console.error('Error deleting column:', error);
                alert('Failed to delete column: ' + error.message);
            } finally {
                UI.hideLoadingSpinner();
            }
        }
    },

    removeExistingContextMenus() {
        document.querySelectorAll('.context-menu, [id^="contextMenu"]').forEach(menu => {
            menu.remove();
        });
    },

    populateColumnList() {
    const columnList = document.getElementById('columnList');
    if (!columnList) return;

    columnList.innerHTML = '';
    const hiddenColumns = this.getHiddenColumns();
    const isDeleteEnabled = localStorage.getItem('deleteButtonsVisible') === 'true';

    // Add yellow "Show All Columns" button
    const showAllBtn = document.createElement('div');
    showAllBtn.className = 'show-all-columns';
    showAllBtn.innerHTML = `<button id="showAllColumns">Show All Columns</button>`;
    columnList.appendChild(showAllBtn);

    // Add header row
    const headerRow = document.createElement('div');
    headerRow.className = 'column-header-row';
    headerRow.innerHTML = `
        ${isDeleteEnabled ? '<div class="column-actions-header">Actions</div>' : ''}
        <div class="column-visibility-header">Visible</div>
        <div class="column-name-header">Column Name</div>
        <div class="column-type-header">Type</div>
    `;
    columnList.appendChild(headerRow);

    // Create grid items for each column
    AppState.columns.forEach((column) => {
        if (column.isRecordNumber) return;

        const item = document.createElement('div');
        item.className = 'column-item';
        
        // Build row content based on delete setting
        let rowContent = '';
        
        if (isDeleteEnabled) {
            rowContent += `
                <div class="column-actions-cell">
                    <button class="delete-column-btn" title="Delete Column">×</button>
                </div>
            `;
        }

        rowContent += `
            <div class="column-visibility-cell">
                <input type="checkbox" id="col-visibility-${column.id}" 
                    ${!hiddenColumns.includes(column.id) ? 'checked' : ''}>
            </div>
            <div class="column-name-cell">${column.name}</div>
            <div class="column-type-cell">
                <select class="column-type-select">
                    ${this.getTypeOptions(column.type)}
                </select>
            </div>
        `;

        item.innerHTML = rowContent;

        // Add event listeners
        if (isDeleteEnabled) {
            const deleteBtn = item.querySelector('.delete-column-btn');
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                this.handleDeleteColumn(column.id, column.name);
            };
        }

        const checkbox = item.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => this.toggleColumnVisibility(column.id));

        const typeSelect = item.querySelector('.column-type-select');
        typeSelect.addEventListener('change', async () => {
            try {
                UI.showLoadingSpinner();
                await ColumnManager.updateColumnType(column.id, typeSelect.value);
                await TableManager.loadTableData();
            } catch (error) {
                console.error('Failed to update column type:', error);
                alert('Failed to change column type: ' + error.message);
                typeSelect.value = column.type; // Reset to original value
            } finally {
                UI.hideLoadingSpinner();
            }
        });

        columnList.appendChild(item);
    });
},

// Helper method to generate type options
getTypeOptions(selectedType) {
    const types = [
        { value: 'text', label: 'Text' },
        { value: 'number', label: 'Number' },
        { value: 'date', label: 'Date' },
        { value: 'email', label: 'Email' },
        { value: 'url', label: 'URL' },
        { value: 'textarea', label: 'Long Text' }
    ];

    return types.map(type => `
        <option value="${type.value}" ${type.value === selectedType ? 'selected' : ''}>
            ${type.label}
        </option>
    `).join('');
},

    createTypeSelector(column) {
        const select = document.createElement('select');
        select.className = 'column-type-select';
        
        const types = [
            { value: 'text', label: 'Text' },
            { value: 'number', label: 'Number' },
            { value: 'date', label: 'Date' },
            { value: 'email', label: 'Email' },
            { value: 'url', label: 'URL' },
            { value: 'textarea', label: 'Long Text' }
        ];

        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type.value;
            option.textContent = type.label;
            option.selected = type.value === column.type;
            select.appendChild(option);
        });

        select.addEventListener('change', async () => {
            try {
                UI.showLoadingSpinner();
                await ColumnManager.updateColumnType(column.id, select.value);
                await TableManager.loadTableData();
            } catch (error) {
                console.error('Failed to update column type:', error);
                alert('Failed to change column type: ' + error.message);
                select.value = column.type; // Reset to original value
            } finally {
                UI.hideLoadingSpinner();
            }
        });

        return select;
    }
};

// Add styles
const style = document.createElement('style');
style.textContent = `
.show-all-columns {
        padding: 10px;
        background: #fff8dc;
        border: 1px solid #ffb6c1;
        border-radius: 4px;
        margin-bottom: 10px;
    }

    .show-all-columns button {
        width: 100%;
        padding: 8px;
        background: none;
        border: none;
        cursor: pointer;
        color: #0000ff;
        text-decoration: underline;
    }

    .column-header-row {
        display: grid;
        grid-template-columns: ${localStorage.getItem('deleteButtonsVisible') === 'true' ? 
            'auto auto 1fr 150px' : 'auto 1fr 150px'};
        gap: 8px;
        padding: 8px;
        background: #fff0f5;
        border-bottom: 1px solid #ffb6c1;
        color: #ff1493;
        font-weight: bold;
    }

    .column-item {
        display: grid;
        grid-template-columns: ${localStorage.getItem('deleteButtonsVisible') === 'true' ? 
            'auto auto 1fr 150px' : 'auto 1fr 150px'};
        gap: 8px;
        padding: 8px;
        align-items: center;
        border-bottom: 1px solid #ffb6c1;
        background: #fff0f5;
    }

    .delete-column-btn {
        background: #ff1493;
        color: white;
        border: none;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 16px;
    }

    .column-type-select {
        width: 100%;
        padding: 4px;
        border: 1px solid #ffb6c1;
        border-radius: 4px;
        background: #fff8dc;
    }

    .column-visibility-cell {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .column-name-cell {
        color: #ff1493;
    }
    .column-item {
        display: flex;
        align-items: center;
        padding: 8px;
        border-bottom: 1px solid var(--border-color);
    }

    .column-label-container {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-left: 8px;
    }

    .column-name-label {
        flex: 1;
        margin-right: 8px;
    }

    .delete-column-btn {
        background: var(--danger-color);
        color: white;
        border: none;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s ease;
    }

    .delete-column-btn:hover {
        background-color: color-mix(in srgb, var(--danger-color) 80%, black);
        transform: scale(1.1);
    }

    .delete-column-btn:active {
        transform: scale(0.95);
    }

    .column-header-row {
        display: grid;
        grid-template-columns: auto 1fr 150px auto;
        gap: 8px;
        padding: 8px;
        background: var(--bg-secondary);
        border-bottom: 2px solid var(--border-color);
        font-weight: bold;
    }

    .column-item {
        display: grid;
        grid-template-columns: auto 1fr 150px auto;
        gap: 8px;
        padding: 8px;
        align-items: center;
        border-bottom: 1px solid var(--border-color);
    }

    .column-visibility-cell {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .column-name-cell {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .column-type-cell {
        padding-right: 8px;
    }

    .column-type-select {
        width: 100%;
        padding: 4px;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-sm);
        background: var(--bg-primary);
    }

    .column-actions-cell {
        display: flex;
        justify-content: flex-end;
    }

    .delete-column-btn {
        background: var(--danger-color);
        color: white;
        border: none;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s ease;
    }

    .delete-column-btn:hover {
        background-color: color-mix(in srgb, var(--danger-color) 80%, black);
        transform: scale(1.1);
    }

    .delete-column-btn:active {
        transform: scale(0.95);
    }

    #columnList {
        max-height: 70vh;
        overflow-y: auto;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        background: var(--bg-primary);
    }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    ColumnVisibilityManager.init();
});

export default ColumnVisibilityManager;