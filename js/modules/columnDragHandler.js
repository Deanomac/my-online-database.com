import { AppState } from './appState.js';
import { DatabaseManager } from './databaseManager.js';
import { UI } from './ui.js';
import { Notifications } from './notifications.js';

export const ColumnDragHandler = {
    dragState: {
        isDragging: false,
        draggedColumn: null,
        startIndex: -1,
        dragOverColumn: null
    },

    initialize() {
        const headerRow = document.querySelector('#dataTable thead tr');
        if (!headerRow) return;

        // Add draggable attributes to columns (skip record number column)
        const headers = headerRow.querySelectorAll('th:not(.row-number-column):not(.actions-column)');
        headers.forEach(th => {
            th.setAttribute('draggable', 'true');
            this.attachDragEvents(th);
        });
    },

    attachDragEvents(th) {
        th.addEventListener('dragstart', (e) => this.handleDragStart(e));
        th.addEventListener('dragover', (e) => this.handleDragOver(e));
        th.addEventListener('dragenter', (e) => this.handleDragEnter(e));
        th.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        th.addEventListener('drop', (e) => this.handleDrop(e));
        th.addEventListener('dragend', (e) => this.handleDragEnd(e));
    },

    handleDragStart(e) {
        const th = e.target.closest('th');
        if (!th || !th.dataset.columnId) return;

        this.dragState.isDragging = true;
        this.dragState.draggedColumn = th;
        this.dragState.startIndex = Array.from(th.parentNode.children).indexOf(th);

        // Create and style ghost image
        const ghost = th.cloneNode(true);
        ghost.style.opacity = '0.5';
        ghost.style.position = 'absolute';
        ghost.style.top = '-1000px';
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 0, 0);
        setTimeout(() => ghost.remove(), 0);

        th.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    },

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const th = e.target.closest('th');
        if (!th || th === this.dragState.draggedColumn || !th.dataset.columnId) return;

        const headers = Array.from(th.parentNode.children);
        const draggedIndex = headers.indexOf(this.dragState.draggedColumn);
        const targetIndex = headers.indexOf(th);

        if (draggedIndex !== targetIndex) {
            const rect = th.getBoundingClientRect();
            const midpoint = rect.x + rect.width / 2;
            const isAfter = e.clientX > midpoint;

            // Show drop indicator
            th.classList.add(isAfter ? 'drop-after' : 'drop-before');
            this.dragState.dragOverColumn = th;
        }
    },

    handleDragEnter(e) {
        e.preventDefault();
        const th = e.target.closest('th');
        if (th && th !== this.dragState.draggedColumn && th.dataset.columnId) {
            th.classList.add('drag-over');
        }
    },

    handleDragLeave(e) {
        const th = e.target.closest('th');
        if (th) {
            th.classList.remove('drag-over', 'drop-before', 'drop-after');
        }
    },

    async handleDrop(e) {
        e.preventDefault();
        const targetTh = e.target.closest('th');
        if (!targetTh || !targetTh.dataset.columnId || !this.dragState.draggedColumn) return;

        try {
            UI.showLoadingSpinner();
            
            const headers = Array.from(targetTh.parentNode.children);
            const draggedIndex = headers.indexOf(this.dragState.draggedColumn);
            const targetIndex = headers.indexOf(targetTh);

            if (draggedIndex !== targetIndex) {
                // Update column orders in database
                await this.updateColumnOrder(draggedIndex, targetIndex);
                
                // Reload and render table
                await this.reloadTable();
                
                Notifications.success('Column order updated successfully');
            }
        } catch (error) {
            console.error('Failed to reorder columns:', error);
            Notifications.error('Failed to reorder columns: ' + error.message);
        } finally {
            UI.hideLoadingSpinner();
        }
    },

    handleDragEnd() {
        if (this.dragState.draggedColumn) {
            this.dragState.draggedColumn.classList.remove('dragging');
        }
        if (this.dragState.dragOverColumn) {
            this.dragState.dragOverColumn.classList.remove('drag-over', 'drop-before', 'drop-after');
        }
        // Reset drag state
        this.dragState = {
            isDragging: false,
            draggedColumn: null,
            startIndex: -1,
            dragOverColumn: null
        };
    },

    async updateColumnOrder(fromIndex, toIndex) {
        const columns = [...AppState.columns];
        const [movedColumn] = columns.splice(fromIndex - 1, 1); // -1 to account for record number column
        columns.splice(toIndex - 1, 0, movedColumn);

        const transaction = DatabaseManager.db.transaction('columns', 'readwrite');
        const store = transaction.objectStore('columns');

        // Update order for all columns
        await Promise.all(columns.map((column, index) => {
            column.order = index;
            return new Promise((resolve, reject) => {
                const request = store.put(column);
                request.onsuccess = resolve;
                request.onerror = () => reject(request.error);
            });
        }));

        AppState.columns = columns;
    },

    async reloadTable() {
        await new Promise(resolve => setTimeout(resolve, 0)); // Let the DOM update
        await TableManager.loadTableData();
        await TableManager.renderTable();
    },

    cleanup() {
        const headers = document.querySelectorAll('#dataTable th');
        headers.forEach(th => {
            th.removeAttribute('draggable');
            const newTh = th.cloneNode(true);
            th.parentNode.replaceChild(newTh, th);
        });
    }
};

// Add styles
const style = document.createElement('style');
style.textContent = `
    th.dragging {
        opacity: 0.5;
        background-color: var(--primary-color) !important;
        border: 2px dashed var(--border-color) !important;
    }

    th.drag-over {
        border: 2px solid var(--primary-color) !important;
    }

    th.drop-before::before,
    th.drop-after::after {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        width: 2px;
        background-color: var(--primary-color);
    }

    th.drop-before::before {
        left: 0;
    }

    th.drop-after::after {
        right: 0;
    }

    .row-number-column,
    .actions-column {
        user-select: none;
        pointer-events: none;
    }
`;
document.head.appendChild(style);

export default ColumnDragHandler;