// deleteColumnManager.js
import { ColumnManager } from './columnManager.js';
import { TableManager } from './tableManager.js';
import { ErrorManager } from './errorManager.js';


export const DeleteColumnManager = {
    init() {
        this.createDeleteButtons();
        this.attachEventListeners();
        this.updateVisibility();
    },

    createDeleteButtons() {
        const headers = document.querySelectorAll('#dataTable th:not(.row-number-column):not(.actions-column)');
        headers.forEach(header => {
            // Remove any existing delete buttons
            const existingBtn = header.querySelector('.delete-column-btn');
            if (existingBtn) existingBtn.remove();

            // Create new delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-column-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.style.display = 'none'; // Hidden by default
            deleteBtn.setAttribute('aria-label', 'Delete Column');
            deleteBtn.title = 'Delete Column';

            // Style the button
            Object.assign(deleteBtn.style, {
                position: 'absolute',
                right: '4px',
                top: '4px',
                background: 'var(--danger-color)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                lineHeight: '1',
                padding: '0'
            });

            header.style.position = 'relative';
            header.appendChild(deleteBtn);
        });
    },

    attachEventListeners() {
        document.addEventListener('click', async (e) => {
            if (e.target.matches('.delete-column-btn')) {
                const header = e.target.closest('th');
                const columnId = parseInt(header.dataset.columnId);
                
                if (confirm('Are you sure you want to delete this column? This action cannot be undone.')) {
                    try {
                        await ColumnManager.deleteColumn(columnId);
                        await TableManager.loadTableData();
                        this.init(); // Reinitialize delete buttons
                    } catch (error) {
                        ErrorManager.showError('Failed to delete column', error);
                    }
                }
            }
        });

        // Listen for changes to the delete toggle
        const toggleSwitch = document.getElementById('octoberToggleDelete');
        if (toggleSwitch) {
            toggleSwitch.addEventListener('change', () => {
                this.updateVisibility();
            });
        }
    },

    updateVisibility() {
        const isDeleteEnabled = localStorage.getItem('deleteButtonsVisible') === 'true';
        const deleteButtons = document.querySelectorAll('.delete-column-btn');
        
        deleteButtons.forEach(btn => {
            btn.style.display = isDeleteEnabled ? 'flex' : 'none';
        });

        // Also update row delete buttons visibility
        const rowDeleteButtons = document.querySelectorAll('.delete-row-btn');
        rowDeleteButtons.forEach(btn => {
            btn.style.display = isDeleteEnabled ? 'flex' : 'none';
        });

        // Update action column visibility
        const actionsCells = document.querySelectorAll('.actions-column');
        actionsCells.forEach(cell => {
            cell.style.display = isDeleteEnabled ? 'table-cell' : 'none';
        });
    }
};

// Add styles to the document
const style = document.createElement('style');
style.textContent = `
    .delete-column-btn:hover {
        background-color: color-mix(in srgb, var(--danger-color) 80%, black) !important;
        transform: scale(1.1);
    }

    .delete-column-btn:active {
        transform: scale(0.95);
    }

    th {
        position: relative;
    }

    .actions-column {
        display: none; /* Hidden by default */
    }
`;
document.head.appendChild(style);

export default DeleteColumnManager;