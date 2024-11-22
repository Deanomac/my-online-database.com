// actionHistoryManager.js
import { DatabaseManager } from './databaseManager.js';
import { TableManager } from './tableManager.js';
import { UI } from './ui.js';
import { AppState } from './appState.js';
import { Notifications } from './notifications.js';

export class ActionHistoryManager {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistory = 10;
        this.initializeUI();
    }

    addAction(action) {
        // Remove any future actions if we're not at the end
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        // Add the new action
        this.history.push(action);
        this.currentIndex++;

        // Keep only the last maxHistory items
        if (this.history.length > this.maxHistory) {
            const excess = this.history.length - this.maxHistory;
            this.history = this.history.slice(excess);
            this.currentIndex = Math.max(0, this.currentIndex - excess);
        }

        this.updateUI();
        this.saveHistoryToLocalStorage();
    }

    async undo() {
        if (!this.canUndo()) return;

        try {
            UI.showLoadingSpinner();
            const action = this.history[this.currentIndex];
            await this.executeUndo(action);
            this.currentIndex--;
            this.updateUI();
            await TableManager.loadTableData();
        } catch (error) {
            console.error('Undo failed:', error);
            Notifications.warning('Failed to undo action: ' + error.message);
        } finally {
            UI.hideLoadingSpinner();
        }
    }

    async redo() {
        if (!this.canRedo()) return;

        try {
            UI.showLoadingSpinner();
            const action = this.history[this.currentIndex + 1];
            await this.executeRedo(action);
            this.currentIndex++;
            this.updateUI();
            await TableManager.loadTableData();
        } catch (error) {
            console.error('Redo failed:', error);
            Notifications.warning('Failed to redo action: ' + error.message);
        } finally {
            UI.hideLoadingSpinner();
        }
    }

// actionHistoryManager.js - Update executeUndo method
async executeUndo(action) {
    const transaction = DatabaseManager.db.transaction(['tables', 'columns', 'records'], 'readwrite');

    try {
        switch (action.type) {
            case 'deleteColumn':
                await this.undoDeleteColumn(action.data, transaction);
                break;
            case 'deleteTable':
                await this.undoDeleteTable(action.data, transaction);
                break;
            case 'deleteRow':
                await this.undoDeleteRow(action.data, transaction);
                break;
            case 'renameColumn':
                await this.undoRenameColumn(action.data, transaction);
                break;
        }
        
        // Commit transaction
        await new Promise((resolve, reject) => {
            transaction.oncomplete = resolve;
            transaction.onerror = () => reject(transaction.error);
        });

    } catch (error) {
        // Rollback by aborting transaction
        transaction.abort();
        throw error;
    }
}

// Update undoDeleteColumn method
async undoDeleteColumn(data, transaction) {
    const store = transaction.objectStore('columns');
    
    // Check if column already exists
    const existingColumn = await new Promise((resolve) => {
        const request = store.get(data.column.id);
        request.onsuccess = () => resolve(request.result);
    });

    if (existingColumn) {
        throw new Error('Column already exists');
    }

    return new Promise((resolve, reject) => {
        const request = store.add(data.column);
        request.onsuccess = resolve;
        request.onerror = () => reject(request.error);
    });
}

    async executeRedo(action) {
        const transaction = DatabaseManager.db.transaction(['tables', 'columns', 'records'], 'readwrite');

        switch (action.type) {
            case 'deleteColumn':
                await this.redoDeleteColumn(action.data, transaction);
                break;
            case 'deleteTable':
                await this.redoDeleteTable(action.data, transaction);
                break;
            case 'deleteRow':
                await this.redoDeleteRow(action.data, transaction);
                break;
            case 'renameColumn':
                await this.redoRenameColumn(action.data, transaction);
                break;
        }
    }



    async redoDeleteColumn(data, transaction) {
        const store = transaction.objectStore('columns');
        return new Promise((resolve, reject) => {
            const request = store.delete(data.column.id);
            request.onsuccess = resolve;
            request.onerror = () => reject(request.error);
        });
    }

    async undoDeleteTable(data, transaction) {
        const tableStore = transaction.objectStore('tables');
        const columnStore = transaction.objectStore('columns');
        const recordStore = transaction.objectStore('records');

        await Promise.all([
            new Promise((resolve, reject) => {
                const request = tableStore.add(data.table);
                request.onsuccess = resolve;
                request.onerror = () => reject(request.error);
            }),
            ...data.columns.map(column => new Promise((resolve, reject) => {
                const request = columnStore.add(column);
                request.onsuccess = resolve;
                request.onerror = () => reject(request.error);
            })),
            ...data.records.map(record => new Promise((resolve, reject) => {
                const request = recordStore.add(record);
                request.onsuccess = resolve;
                request.onerror = () => reject(request.error);
            }))
        ]);
    }

    async redoDeleteTable(data, transaction) {
        const tableStore = transaction.objectStore('tables');
        return new Promise((resolve, reject) => {
            const request = tableStore.delete(data.table.id);
            request.onsuccess = resolve;
            request.onerror = () => reject(request.error);
        });
    }

    async undoDeleteRow(data, transaction) {
        const store = transaction.objectStore('records');
        return new Promise((resolve, reject) => {
            const request = store.add(data.record);
            request.onsuccess = resolve;
            request.onerror = () => reject(request.error);
        });
    }

    async redoDeleteRow(data, transaction) {
        const store = transaction.objectStore('records');
        return new Promise((resolve, reject) => {
            const request = store.delete(data.record.id);
            request.onsuccess = resolve;
            request.onerror = () => reject(request.error);
        });
    }

    async undoRenameColumn(data, transaction) {
        const store = transaction.objectStore('columns');
        return new Promise((resolve, reject) => {
            const request = store.get(data.columnId);
            request.onsuccess = () => {
                const column = request.result;
                column.name = data.oldName;
                const updateRequest = store.put(column);
                updateRequest.onsuccess = resolve;
                updateRequest.onerror = () => reject(updateRequest.error);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async redoRenameColumn(data, transaction) {
        const store = transaction.objectStore('columns');
        return new Promise((resolve, reject) => {
            const request = store.get(data.columnId);
            request.onsuccess = () => {
                const column = request.result;
                column.name = data.newName;
                const updateRequest = store.put(column);
                updateRequest.onsuccess = resolve;
                updateRequest.onerror = () => reject(updateRequest.error);
            };
            request.onerror = () => reject(request.error);
        });
    }

    canUndo() {
        return this.currentIndex >= 0;
    }

    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

initializeUI() {
    // Look for the toolbar-section instead of toolbar
    const toolbarSection = document.querySelector('.toolbar-section');
    if (!toolbarSection) return;

    const undoButton = document.createElement('button');
    undoButton.className = 'button undo-button';
    undoButton.innerHTML = '↶';
    undoButton.title = 'Undo (Ctrl+Z)';
    undoButton.disabled = !this.canUndo();
    undoButton.onclick = () => this.undo();

    const redoButton = document.createElement('button');
    redoButton.className = 'button redo-button';
    redoButton.innerHTML = '↷';
    redoButton.title = 'Redo (Ctrl+Y)';
    redoButton.disabled = !this.canRedo();
    redoButton.onclick = () => this.redo();

    // Add buttons at the end of toolbar-section
    toolbarSection.appendChild(undoButton);
    toolbarSection.appendChild(redoButton);

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    this.redo();
                } else {
                    this.undo();
                }
            } else if (e.key === 'y') {
                e.preventDefault();
                this.redo();
            }
        }
    });

    // Load history from localStorage
    this.loadHistoryFromLocalStorage();
}

    updateUI() {
        const undoButton = document.querySelector('.undo-button');
        const redoButton = document.querySelector('.redo-button');

        if (undoButton) undoButton.disabled = !this.canUndo();
        if (redoButton) redoButton.disabled = !this.canRedo();
    }

    saveHistoryToLocalStorage() {
        localStorage.setItem('actionHistory', JSON.stringify({
            history: this.history,
            currentIndex: this.currentIndex
        }));
    }

    loadHistoryFromLocalStorage() {
        try {
            const saved = localStorage.getItem('actionHistory');
            if (saved) {
                const { history, currentIndex } = JSON.parse(saved);
                this.history = history;
                this.currentIndex = currentIndex;
                this.updateUI();
            }
        } catch (error) {
            console.error('Failed to load action history:', error);
        }
    }
}

// Create and export singleton instance
export const actionHistory = new ActionHistoryManager();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        .undo-button,
        .redo-button {
            font-size: 18px;
            padding: 4px 8px;
            min-width: 32px;
        }

        .undo-button:disabled,
        .redo-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
            .undo-button,
    .redo-button {
        font-size: 18px;
        padding: 4px 8px;
        min-width: 32px;
        margin-left: 4px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .undo-button:disabled,
    .redo-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    `;
    document.head.appendChild(styleSheet);
});