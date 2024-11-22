// tableRenderManager.js
import { TableManager } from './tableManager.js';
import { AppState } from './appState.js';
import { UI } from './ui.js';

export const TableRenderManager = {
    renderRecords() {
        try {
            const table = document.getElementById('dataTable');
            if (!table) {
                console.warn('Table element not found');
                return;
            }

            let tbody = table.querySelector('tbody');
            if (!tbody) {
                tbody = document.createElement('tbody');
                table.appendChild(tbody);
            }

            // Cache scroll position and selected cells
            const scrollPosition = {
                top: window.pageYOffset,
                left: window.pageXOffset
            };
            const activeElement = document.activeElement;
            const wasEditing = activeElement?.closest('td')?.classList.contains('editing');

            // Clear and rebuild table
            tbody.innerHTML = '';
            const currentIndex = AppState.currentRecordIndex;

            // Get filtered and sorted records
            const filteredRecords = TableManager.filterRecords();
            const sortedRecords = TableManager.sortRecords(filteredRecords);

            // Create fragment for better performance
            const fragment = document.createDocumentFragment();

            sortedRecords.forEach((record, index) => {
                if (!record) return;

                const tr = document.createElement('tr');
                tr.className = 'symphytum-table-row';
                if (index === currentIndex) {
                    tr.classList.add('selected');
                }

                // Add row number cell first
                const rowNumCell = document.createElement('td');
                rowNumCell.className = 'row-number-cell';
                rowNumCell.textContent = (index + 1).toString();
                tr.appendChild(rowNumCell);

                // Add data cells
                AppState.columns.forEach(column => {
                    if (TableManager.isColumnHidden(column.id)) return;

                    const td = document.createElement('td');
                    td.setAttribute('data-column-id', column.id);
                    td.setAttribute('data-record-id', record.id);
                    
                    const value = record.data[column.id] || '';
                    TableManager.renderCell(td, value, column.type);

                    // Make cell editable on click
                    td.addEventListener('click', (e) => {
                        if (!td.classList.contains('editing')) {
                            TableManager.startEditingCell(td);
                        }
                    });

                    tr.appendChild(td);
                });

                // Add actions column if needed
                if (TableManager.isDeleteEnabled()) {
                    const actionsTd = document.createElement('td');
                    actionsTd.className = 'actions-column';
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'delete-row-btn';
                    deleteBtn.innerHTML = '×';
                    deleteBtn.onclick = (e) => {
                        e.stopPropagation();
                        TableManager.handleDeleteRow(record.id);
                    };
                    actionsTd.appendChild(deleteBtn);
                    tr.appendChild(actionsTd);
                }

                fragment.appendChild(tr);
            });

            tbody.appendChild(fragment);

            // Restore scroll position
            window.scrollTo(scrollPosition.left, scrollPosition.top);

            // Restore editing state if needed
            if (wasEditing) {
                const newCell = document.querySelector(`td[data-record-id="${activeElement.closest('td').dataset.recordId}"]`);
                if (newCell) {
                    TableManager.startEditingCell(newCell);
                }
            }

        } catch (error) {
            console.error('Error rendering records:', error);
            this.showErrorMessage(table);
        }
    },

    showErrorMessage(table) {
        const tbody = table.querySelector('tbody') || table.appendChild(document.createElement('tbody'));
        const errorRow = document.createElement('tr');
        const errorCell = document.createElement('td');
        errorCell.colSpan = (AppState.columns?.length || 1) + 1;
        errorCell.textContent = 'Error loading records. Please refresh the page.';
        errorCell.style.textAlign = 'center';
        errorCell.style.padding = '20px';
        errorRow.appendChild(errorCell);
        tbody.appendChild(errorRow);
    },

    initialize() {
        const table = document.getElementById('dataTable');
        if (table && !table.querySelector('tbody')) {
            table.appendChild(document.createElement('tbody'));
        }
        
        if (!Array.isArray(AppState.records)) {
            AppState.records = [];
        }
        
        this.renderRecords();
    }
};

export default TableRenderManager;