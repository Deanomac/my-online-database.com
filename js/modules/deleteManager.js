// deleteManager.js
import { AppState } from './appState.js';
import { DatabaseManager } from './databaseManager.js';
import { UI } from './ui.js';
import { TableManager } from './tableManager.js';
import { actionHistory } from './actionHistoryManager.js';

export const DeleteManager = {
    init() {
       if (this.initialized) return; 
        this.initializeDeleteRowButton();
        this.enhanceContextMenu();
        this.attachEventListeners();
    },

    initializeDeleteRowButton() {
        // Remove any existing delete row buttons first
        document.querySelectorAll('.delete-row-button').forEach(btn => btn.remove());

        // Create delete row button for toolbar
        const toolbar = document.querySelector('.toolbar');
        if (!toolbar) return;

        const deleteRowBtn = document.createElement('button');
        deleteRowBtn.className = 'button delete-row-button';
        deleteRowBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
            Delete Row
        `;
        deleteRowBtn.style.display = 'none'; // Hidden by default

        // Insert before search container
        const searchContainer = toolbar.querySelector('.search-container');
        if (searchContainer) {
            toolbar.insertBefore(deleteRowBtn, searchContainer);
        } else {
            toolbar.appendChild(deleteRowBtn);
        }
    },


    enhanceContextMenu() {
        const contextMenu = document.getElementById('contextMenu');
        if (!contextMenu) return;

        // Add delete column option to context menu
        const deleteColumnOption = document.createElement('div');
        deleteColumnOption.className = 'context-menu-item';
        deleteColumnOption.textContent = 'Delete Column';
        deleteColumnOption.onclick = (e) => {
            e.stopPropagation();
            this.handleDeleteColumn();
        };

        contextMenu.appendChild(deleteColumnOption);
    },

    attachEventListeners() {
        // Watch for delete button visibility setting changes
        document.getElementById('octoberToggleDelete')?.addEventListener('change', (e) => {
            const deleteRowBtn = document.querySelector('.delete-row-button');
            if (deleteRowBtn) {
                deleteRowBtn.style.display = e.target.checked ? 'inline-flex' : 'none';
            }
        });

        // Handle delete row button clicks
        document.querySelector('.delete-row-button')?.addEventListener('click', () => {
            this.handleDeleteRow();
        });
    },

    async handleDeleteColumn() {
        const columnId = this.getSelectedColumnId();
        if (!columnId) return;

        if (!confirm('Are you sure you want to delete this column? This action can be undone.')) return;

        try {
            UI.showLoadingSpinner();

            // Get column data before deletion for undo
            const column = AppState.columns.find(col => col.id === columnId);
            
            // Store all records that have data in this column
            const affectedRecords = AppState.records.filter(record => record.data[columnId] !== undefined)
                .map(record => ({...record}));

            // Delete the column
            await this.deleteColumn(columnId);

            // Add to action history
            actionHistory.addAction({
                type: 'deleteColumn',
                data: {
                    column: {...column},
                    tableId: AppState.currentTableId,
                    affectedRecords
                }
            });

            await TableManager.loadTableData();
            alert('Column deleted successfully. Use Ctrl+Z to undo if needed.');
        } catch (error) {
            console.error('Error deleting column:', error);
            alert('Failed to delete column: ' + error.message);
        } finally {
            UI.hideLoadingSpinner();
        }
    },

    async handleDeleteRow() {
        const selectedRecords = this.getSelectedRecords();
        if (!selectedRecords.length) {
            alert('Please select one or more rows to delete');
            return;
        }

        if (!confirm(`Are you sure you want to delete ${selectedRecords.length} row(s)? This action can be undone.`)) return;

        try {
            UI.showLoadingSpinner();

            for (const record of selectedRecords) {
                await this.deleteRecord(record.id);
                
                // Add to action history
                actionHistory.addAction({
                    type: 'deleteRow',
                    data: {
                        record: {...record},
                        tableId: AppState.currentTableId
                    }
                });
            }

            await TableManager.loadTableData();
            alert('Row(s) deleted successfully. Use Ctrl+Z to undo if needed.');
        } catch (error) {
            console.error('Error deleting row(s):', error);
            alert('Failed to delete row(s): ' + error.message);
        } finally {
            UI.hideLoadingSpinner();
        }
    },

    async deleteColumn(columnId) {
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

        // Remove column data from records
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
    },

    async deleteRecord(recordId) {
        const transaction = DatabaseManager.db.transaction('records', 'readwrite');
        const store = transaction.objectStore('records');
        
        return new Promise((resolve, reject) => {
            const request = store.delete(recordId);
            request.onsuccess = resolve;
            request.onerror = () => reject(request.error);
        });
    },

    getSelectedColumnId() {
        // Get column ID from right-clicked header
        const header = document.querySelector('th.context-menu-target');
        return header ? parseInt(header.dataset.columnId) : null;
    },

    getSelectedRecords() {
        // Get selected row records
        return Array.from(document.querySelectorAll('#dataTable tbody tr.selected'))
            .map(row => {
                const index = Array.from(row.parentNode.children).indexOf(row);
                return AppState.records[index];
            })
            .filter(Boolean);
    }
};

// Add styles
const style = document.createElement('style');
style.textContent = `
    .delete-row-button {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background-color: var(--danger-color);
        color: white;
    }

    .delete-row-button:hover {
        background-color: color-mix(in srgb, var(--danger-color) 90%, black);
        color: white;
    }

    .delete-row-button svg {
        stroke: currentColor;
        stroke-width: 2;
    }

    .context-menu-item {
        padding: 8px 12px;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .context-menu-item:hover {
        background-color: var(--row-hover);
    }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    DeleteManager.init();
});

export default DeleteManager;