import { TableRenderManager } from "./tableRenderManager.js";
import { DatabaseManager } from "./databaseManager.js";
import { AppState } from "./appState.js";
import { UI } from "./ui.js";
import { ColumnManager } from "./columnManager.js";
import { RecordManager } from "./recordManager.js";
import { ErrorManager } from "./errorManager.js";
import { FormManager } from "./formManager.js";
import { DeleteConfirmModal } from "./deleteConfirmModal.js";
import { initFormView } from "./formManager.js";
import { TableInteractions } from "./tableInteractions.js";
import { DeleteColumnManager } from "./deleteColumnManager.js";
import { Notifications } from "./notifications.js";
import { ColumnDragHandler } from './columnDragHandler.js';


const initializeTableStyles = () => {
  const styles = `
.row-number-column,
/* Row Height Styles */
#dataTable tbody tr {
    height: 40px; /* Default row height */
    min-height: 40px;
    transition: height 0.2s ease;
}



.symphytum-image-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.symphytum-image-modal img {
    max-width: 90%;
    max-height: 90%;
    border: 2px solid white;
    border-radius: 8px;
}

.symphytum-close-button {
    position: absolute;
    top: 20px;
    right: 30px;
    font-size: 30px;
    color: white;
    cursor: pointer;
    user-select: none;
}



.column-context-menu {
    position: absolute;
    background-color: #fff;
    border: 1px solid #ddd;
    padding: 5px;
    z-index: 10000;
    box-shadow: 0px 2px 5px rgba(0,0,0,0.2);
}

.column-context-menu button {
    background: none;
    border: none;
    padding: 5px 10px;
    cursor: pointer;
    width: 100%;
    text-align: left;
}

.column-context-menu button:hover {
    background-color: #f5f5f5;
}

th.resizable {
    position: relative;
}

th.resizable .resize-handle {
    position: absolute;
    right: 0;
    top: 0;
    width: 5px;
    height: 100%;
    cursor: col-resize;
    user-select: none;
}

th.sortable {
    cursor: pointer;
}

th.sortable:after {
    content: '';
    float: right;
    margin-left: 5px;
    border-width: 5px;
    border-style: solid;
    border-color: transparent;
    display: none;
}

th.sortable.asc:after {
    display: inline-block;
    border-bottom-color: black;
}

th.sortable.desc:after {
    display: inline-block;
    border-top-color: black;
}

.symphytum-header-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
}

.symphytum-column-name {
    font-weight: 600;
    user-select: none;
}

.symphytum-filter-container {
    position: relative;
    width: 100%;
}

.symphytum-filter-input {
    width: 100%;
    padding: 4px 8px;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-sm);
    font-size: 12px;
    background: var(--bg-primary);
}

.symphytum-filter-input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(74, 109, 167, 0.1);
}

th.dragging {
    opacity: 0.5;
    border: 2px dashed var(--primary-color);
}

.resize-handle {
    position: absolute;
    right: 0;
    top: 0;
    width: 4px;
    height: 100%;
    cursor: col-resize;
    background: transparent;
}

.resize-handle:hover {
    background: var(--primary-color);
}
.row-height-control {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px;
    height: 36px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-md);
    margin-right: 8px;
}

.row-height-control label {
    font-size: 14px;
    color: var(--text-secondary);
    white-space: nowrap;
}

.row-height-control input[type="range"] {
    width: 100px;
    accent-color: var(--primary-color);
}

.row-height-control .height-display {
    min-width: 45px;
    text-align: right;
    color: var(--text-secondary);
    font-size: 14px;
    font-variant-numeric: tabular-nums;
}

/* Customize range input for better cross-browser appearance */
.row-height-control input[type="range"] {
    -webkit-appearance: none;
    height: 4px;
    background: var(--border-color);
    border-radius: 2px;
    outline: none;
}

.row-height-control input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--primary-color);
    cursor: pointer;
    border: none;
}

.row-height-control input[type="range"]::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--primary-color);
    cursor: pointer;
    border: none;
}

/* Make sure table cells transition smoothly */
#dataTable tbody tr,
#dataTable tbody td {
    transition: height 0.2s ease, padding 0.2s ease;
}

/* Ensure inputs/textareas within cells adjust smoothly */
#dataTable td input,
#dataTable td textarea {
    transition: height 0.2s ease;
    box-sizing: border-box;
}
`;

  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  const modalStyles = document.createElement("style");
  modalStyles.textContent = `
        .modal {
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1050;
            background: var(--bg-primary);
            border-radius: var(--border-radius-md);
            box-shadow: var(--shadow-lg);
            min-width: 400px;
        }

        .modal-content {
            padding: var(--spacing-lg);
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: var(--spacing-md);
        }

        .modal-header h3 {
            margin: 0;
        }

        .close-button {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            padding: 4px;
            color: var(--text-primary);
        }

        .modal-body {
            margin-bottom: var(--spacing-lg);
        }

        .form-group {
            margin-bottom: var(--spacing-md);
        }

        .form-group label {
            display: block;
            margin-bottom: var(--spacing-sm);
        }

        .form-input {
            width: 100%;
            padding: var(--spacing-sm);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius-sm);
            font-size: inherit;
        }

        .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: var(--spacing-md);
        }

        .button-primary {
            background-color: var(--primary-color);
            color: white;
        }

        .button-primary:hover {
            background-color: color-mix(in srgb, var(--primary-color) 90%, black);
        }
          .delete-row-btn {
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
        margin: 0 auto;
        padding: 0;
        line-height: 1;
    }

    .delete-row-btn:hover {
        background-color: color-mix(in srgb, var(--danger-color) 80%, black);
    }

    .actions-column {
        width: 50px;
        text-align: center;
    }
    `;
  document.head.appendChild(modalStyles);
};

export const TableManager = {
    initialized: false,
    RowResizeHandler: {
        isResizing: false,
        currentRow: null,
        startY: 0,
        startHeight: 0,
        minHeight: 40,
        maxHeight: 400,

        init() {
    // Add visual feedback for resize handle
    const style = document.createElement('style');
    style.textContent = `
    #dataTable td.editing {
        padding: 0 !important;
    }

    #dataTable td.editing input,
    #dataTable td.editing textarea {
        width: 100%;
        height: 100%;
        padding: 8px 12px;
        border: 2px solid var(--primary-color);
        background-color: var(--bg-primary);
        resize: none;
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;
    }
    /* Add row resize handle */
    #dataTable tr {
        position: relative;
    }

    #dataTable tr::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 4px;
        cursor: row-resize;
        background: transparent;
        transition: background-color 0.2s ease;
    }

    #dataTable tr:hover::after {
        background-color: var(--primary-color);
        opacity: 0.3;
    }

    /* Remove hover cursor restriction */
    #dataTable tr:hover {
        cursor: row-resize;
    }
    `;
    // Append the style element to the document head
    document.head.appendChild(style);

    const table = document.getElementById('dataTable');
    if (!table) return;

    table.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));

    // Handle double-click to reset height
    table.addEventListener('dblclick', (e) => {
        const row = e.target.closest('tr');
        if (row) {
            const rowRect = row.getBoundingClientRect();
            const offsetY = e.clientY - rowRect.top;
            if (offsetY >= rowRect.height - 4) {
                this.resetRowHeight(row);
            }
        }
    });

    this.applySavedHeights();
},


handleMouseDown(e) {
    const row = e.target.closest('tr');
    if (!row) return;

    const rowRect = row.getBoundingClientRect();
    const offsetY = e.clientY - rowRect.top;

    // Check if the click is within the bottom 4 pixels of the row
    if (offsetY < rowRect.height - 4) return;

    this.isResizing = true;
    this.currentRow = row;
    this.startY = e.pageY;
    this.startHeight = row.offsetHeight;

    row.classList.add('resizing');
    document.body.style.cursor = 'row-resize';

    e.preventDefault(); // Prevent text selection
},


handleMouseMove(e) {
    if (!this.isResizing || !this.currentRow) return;

    const delta = e.pageY - this.startY;
    let newHeight = Math.max(
        this.minHeight,
        Math.min(this.maxHeight, this.startHeight + delta)
    );

    this.currentRow.style.height = `${newHeight}px`;

    // Update any inputs or textareas in the row
    const cells = this.currentRow.querySelectorAll('td');
    cells.forEach(cell => {
        const input = cell.querySelector('input, textarea');
        if (input) {
            input.style.height = '100%';
        }
    });

    // Save the height
    const rowId = this.currentRow.getAttribute('data-record-id');
    if (rowId) {
        localStorage.setItem(`row-height-${rowId}`, newHeight);
    }
},

        handleMouseUp() {
            if (!this.isResizing) return;

            this.isResizing = false;
            if (this.currentRow) {
                this.currentRow.classList.remove('resizing');
                this.currentRow = null;
            }
            document.body.style.cursor = '';
        },

        resetRowHeight(row) {
            row.style.height = '';
            const cells = row.querySelectorAll('td');
            cells.forEach(cell => {
                cell.style.height = '';
                const input = cell.querySelector('input, textarea');
                if (input) {
                    input.style.height = '';
                }
            });

            const rowId = row.getAttribute('data-record-id');
            if (rowId) {
                localStorage.removeItem(`row-height-${rowId}`);
            }
        },

applySavedHeights() {
    const rows = document.querySelectorAll('#dataTable tbody tr');
    rows.forEach(row => {
        const rowId = row.getAttribute('data-record-id');
        if (rowId) {
            const savedHeight = localStorage.getItem(`row-height-${rowId}`);
            if (savedHeight) {
                row.style.height = `${savedHeight}px`;
                // No need to set cell heights
            }
        }
    });
},

        cleanup() {
            const table = document.getElementById('dataTable');
            if (table) {
                table.removeEventListener('mousedown', this.handleMouseDown);
            }
            document.removeEventListener('mousemove', this.handleMouseMove);
            document.removeEventListener('mouseup', this.handleMouseUp);
            
            this.isResizing = false;
            this.currentRow = null;
        }
    },
    async initialize() {
        if (this.initialized) return;

        try {
            initializeTableStyles();

            const table = document.getElementById("dataTable");
            if (!table) {
                console.warn("Table element not found, creating it");
                this.createTableStructure();
            }

            this.addHeaderStyles();
            this.initializeEventListeners();
            this.initializeDragAndDrop();
            this.RowResizeHandler.init(); // Initialize row resize handler
            ColumnDragHandler.initialize();

            this.initialized = true;
            console.log("TableManager initialized successfully");
            return true;
        } catch (error) {
            console.error("Error initializing TableManager:", error);
            throw error;
        }
    },

    createTableStructure() {
        const tableView = document.getElementById("tableView");
        if (!tableView) return;

        const table = document.createElement("table");
        table.id = "dataTable";

        const thead = document.createElement("thead");
        thead.innerHTML = '<tr><th style="width: 25px">#</th></tr>';

        const tbody = document.createElement("tbody");

        table.appendChild(thead);
        table.appendChild(tbody);
        tableView.appendChild(table);
    },

    renderRecords() {
        const tbody = UI.elements.dataTable?.querySelector("tbody");
        if (!tbody) return;

        tbody.innerHTML = "";
        const filteredRecords = this.filterRecords();
        const sortedRecords = this.sortRecords(filteredRecords);

        sortedRecords.forEach((record, displayIndex) => {
            if (!record) return;

            const tr = document.createElement("tr");
            tr.className = "symphytum-table-row";
            if (displayIndex === AppState.currentRecordIndex) {
                tr.classList.add("selected");
            }

            tr.dataset.recordId = record.id;

            const rowNumCell = document.createElement("td");
            rowNumCell.className = "row-number-cell";
            rowNumCell.dataset.originalRow = record.id;
            rowNumCell.textContent = displayIndex + 1;
            tr.appendChild(rowNumCell);

            AppState.columns.forEach((column) => {
                if (this.isColumnHidden(column.id)) return;

                const td = document.createElement("td");
                td.setAttribute("data-record-id", record.id);
                td.setAttribute("data-column-id", column.id);
                const value = record.data[column.id] ?? "";
                this.renderCell(td, value, column.type);
                tr.appendChild(td);
            });

            if (!this.isDeleteDisabled()) {
                const actionsTd = document.createElement("td");
                actionsTd.className = "actions-column";
                const deleteBtn = document.createElement("button");
                deleteBtn.className = "delete-row-btn";
                deleteBtn.innerHTML = "×";
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.handleDeleteRow(record.id);
                };
                actionsTd.appendChild(deleteBtn);
                tr.appendChild(actionsTd);
            }

            tbody.appendChild(tr);
        });

        // Apply saved row heights after rendering
        this.RowResizeHandler.applySavedHeights();
    },

  resizeState: {
    isResizing: false,
    currentHeader: null,
    startX: 0,
    startWidth: 0,
  },

  dragState: {
    isDragging: false,
    draggedColumn: null,
    placeholder: null,
    startIndex: -1,
  },

  columnFilters: {},
  
  currentFont: "Noto Sans",
  
  currentContextMenu: null,

  fontOptions: {
    system: [
      {
        name: "System Default",
        value:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
      },
      { name: "Arial", value: "Arial, sans-serif" },
      { name: "Helvetica", value: "Helvetica, Arial, sans-serif" },
      { name: "Times New Roman", value: "Times New Roman, Times, serif" },
      { name: "Georgia", value: "Georgia, Times New Roman, serif" },
      { name: "Courier New", value: "Courier New, Courier, monospace" },
      { name: "Verdana", value: "Verdana, Geneva, sans-serif" },
      { name: "Roboto Slab", value: "Roboto Slab" },
    ],

    google: [
      { name: "Noto Sans", value: "Noto Sans" },
      { name: "Fira Code", value: "Fira Code" },
      { name: "Comic Sans", value: "Comic Sans MS, Comic Sans, cursive" },
      { name: "Roboto", value: "Roboto" },
      { name: "Open Sans", value: "Open Sans" },
      { name: "Lato", value: "Lato" },
      { name: "Montserrat", value: "Montserrat" },
      { name: "Poppins", value: "Poppins" },
      { name: "Source Sans Pro", value: "Source Sans Pro" },
      { name: "Raleway", value: "Raleway" },
      { name: "Work Sans", value: "Work Sans" },
      { name: "Nunito Sans", value: "Nunito Sans" },
      { name: "Merriweather", value: "Merriweather" },
      { name: "Playfair Display", value: "Playfair Display" },
      { name: "Lora", value: "Lora" },
      { name: "PT Serif", value: "PT Serif" },
      { name: "Libre Baskerville", value: "Libre Baskerville" },
      { name: "Inconsolata", value: "Inconsolata" },
      { name: "Slabo 27px/13px", value: "Slabo 27px/13px" },
      { name: "Oswald", value: "Oswald" },
      { name: "Honk", value: "Honk, system-ui" },
      { name: "Nabla", value: "Nabla, system-ui" },
      { name: "Sixtyfour Convergence", value: "Sixtyfour Convergence, serif" },
    ],
  },

  async initialize() {
    try {
      initializeTableStyles();
      this.initializeViews();

      this.createRenameColumnModal();

      this.initializeFontControls();
      this.initializeEventListeners();
      this.initializeDragAndDrop();
      TableRenderManager.initialize();

      this.initialized = true;

      console.log("TableManager initialized successfully");
    } catch (error) {
      console.error("Error initializing TableManager:", error);
      throw new Error("Failed to initialize TableManager: ${error.message}");
    }
  },

  selectedRowIndex: -1,

  initializeTableInteractions() {
    const table = document.getElementById("dataTable");
    if (!table) return;

    table.addEventListener("click", (e) => {
      const row = e.target.closest("tr");
      if (!row || !row.parentElement.tagName === "TBODY") return;

      const tbody = row.parentElement;
      const rowIndex = Array.from(tbody.children).indexOf(row);

      tbody
        .querySelectorAll("tr")
        .forEach((r) => r.classList.remove("selected"));

      row.classList.add("selected");
      this.selectedRowIndex = rowIndex;
      AppState.currentRecordIndex = rowIndex;
    });

    table.addEventListener("dblclick", (e) => {
      const td = e.target.closest("td");
      if (!td || td.classList.contains("actions-column")) return;

      this.makeEditable(td);
    });

    table.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
        const td = e.target.closest("td");
        if (td) {
          this.saveEdit(td);
        }
      } else if (e.key === "Escape") {
        const td = e.target.closest("td");
        if (td) {
          this.cancelEdit(td);
        }
      }
    });

    const formViewBtn = document.getElementById("formViewBtn");
    if (formViewBtn) {
      formViewBtn.addEventListener("click", () => {
        if (this.selectedRowIndex !== -1) {
          AppState.currentRecordIndex = this.selectedRowIndex;
          FormManager.displayCurrentRecord();
        }
        this.switchView("form");
      });
    }
  },

  createUrlLink(url) {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.textContent = url;
    link.className = "symphytum-url-link";

    const container = document.createElement("div");
    container.className = "symphytum-url-container";
    container.appendChild(link);

    return container;
  },

  makeEditable(td) {
    if (td.classList.contains('editing')) return;

    const originalValue = td.textContent;
    td.classList.add('editing');

    const input = document.createElement(td.offsetHeight > 50 ? 'textarea' : 'input');
    input.value = originalValue;
    input.dataset.originalValue = originalValue;

    input.addEventListener('blur', () => this.saveEdit(td));
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.saveEdit(td);
        } else if (e.key === 'Escape') {
            this.cancelEdit(td);
        }
    });

    td.textContent = '';
    td.appendChild(input);
    input.focus();
    input.select();
},

  async saveEdit(td) {
    if (!td.classList.contains('editing')) return;

    const input = td.querySelector('input, textarea');
    if (!input) return;

    const newValue = input.value;
    const originalValue = input.dataset.originalValue;

    if (newValue !== originalValue) {
        const columnId = td.dataset.columnId;
        const recordId = parseInt(td.dataset.recordId);
        const record = AppState.records.find(r => r.id === recordId);

        if (record && columnId) {
            try {
                const updatedData = { ...record.data, [columnId]: newValue };
                // Silent update from table edit
                await RecordManager.updateRecord(recordId, updatedData, { silent: true });
                
                // Single notification for table edit
                Notifications.success('Cell updated successfully');

                // Update form view silently if needed
                const recordIndex = AppState.records.findIndex(r => r.id === recordId);
                if (recordIndex === AppState.currentRecordIndex) {
                    await FormManager.displayCurrentRecord({ silent: true });
                }
            } catch (error) {
                console.error('Failed to save edit:', error);
                td.textContent = originalValue;
                Notifications.error('Failed to update cell: ' + error.message);
                return;
            }
        }
    }

    td.classList.remove('editing');
    td.textContent = newValue;
    if (td === this.currentEditCell) {
        this.currentEditCell = null;
    }
},

  cancelEdit(td) {
    if (!td.classList.contains('editing')) return;

    const input = td.querySelector('input, textarea');
    if (!input) return;

    td.classList.remove('editing');
    td.textContent = input.dataset.originalValue;
},

  navigateNext(reverse = false) {
    const currentCell = document.querySelector(".editing");
    if (!currentCell) return;

    const row = currentCell.parentElement;
    const tbody = row.parentElement;
    const cells = Array.from(row.cells).filter(
      (cell) => !cell.classList.contains("row-number-cell")
    );
    const currentIndex = cells.indexOf(currentCell);

    let nextCell;
    let nextRow;

    if (reverse) {
      if (currentIndex > 0) {
        nextCell = cells[currentIndex - 1];
      } else {
        nextRow = row.previousElementSibling || tbody.lastElementChild;
        const nextCells = Array.from(nextRow.cells).filter(
          (cell) => !cell.classList.contains("row-number-cell")
        );
        nextCell = nextCells[nextCells.length - 1];
      }
    } else {
      if (currentIndex < cells.length - 1) {
        nextCell = cells[currentIndex + 1];
      } else {
        nextRow = row.nextElementSibling || tbody.firstElementChild;
        const nextCells = Array.from(nextRow.cells).filter(
          (cell) => !cell.classList.contains("row-number-cell")
        );
        nextCell = nextCells[0];
      }
    }

    if (nextCell) {
      this.saveEdit(currentCell);
      this.makeEditable(nextCell);
      if (nextRow) {
        const newRowIndex = Array.from(tbody.children).indexOf(nextRow);
        AppState.currentRecordIndex = newRowIndex;
        FormManager.displayCurrentRecord();
      }
    }
  },

  handleRowSelection(row) {
    if (!row) return;

    const tbody = row.parentElement;
    const rowIndex = Array.from(tbody.children).indexOf(row);

    tbody.querySelectorAll("tr").forEach((r) => r.classList.remove("selected"));
    row.classList.add("selected");

    AppState.currentRecordIndex = rowIndex;
    FormManager.displayCurrentRecord();
  },
  
  cancelEdit(td) {
    if (!td.classList.contains("editing")) return;

    const input = td.querySelector("input, textarea");
    if (!input) return;

    td.classList.remove("editing");
    td.textContent = input.dataset.originalValue;
  },

  renderRecords() {
    const tbody = UI.elements.dataTable.querySelector("tbody");
    if (!tbody) return;

    const activeElement = document.activeElement;
    const activeElementRect = activeElement?.getBoundingClientRect();
    const scrollPosition = {
      top: window.pageYOffset,
      left: window.pageXOffset,
    };

    const currentIndex = AppState.currentRecordIndex;
    tbody.innerHTML = "";

    const filteredRecords = this.filterRecords();
    const sortedRecords = this.sortRecords(filteredRecords);

    sortedRecords.forEach((record, index) => {
      const tr = document.createElement("tr");
      tr.className = "symphytum-table-row";

      if (index === currentIndex) {
        tr.classList.add("selected");
      }

      tr.setAttribute("data-record-id", record.id);

      this.createRecordRow(tr, record, index);
      tbody.appendChild(tr);
    });

    window.scrollTo(scrollPosition.left, scrollPosition.top);
    if (activeElement && activeElement.tagName === "INPUT") {
      const newCell = document.querySelector(
        `td[data-record-id='${activeElement.closest("td").dataset.recordId}']`
      );
      if (newCell) {
        const input = newCell.querySelector("input");
        if (input) {
          input.focus();
          input.setSelectionRange(
            activeElement.selectionStart,
            activeElement.selectionEnd
          );
        }
      }
    }

    this.reapplyCellStyles();
  },

  initializeEventListeners() {
    document.removeEventListener("mousemove", this.handleResize.bind(this));
    document.removeEventListener("mouseup", this.stopResize.bind(this));
    document.removeEventListener("click", this.hideContextMenu.bind(this));

    document.addEventListener("mousemove", this.handleResize.bind(this));
    document.addEventListener("mouseup", this.stopResize.bind(this));
    document.addEventListener("click", this.hideContextMenu.bind(this));

    const table = UI.elements.dataTable;
    if (table) {
      table.addEventListener("input", (e) => {
        if (e.target.classList.contains("symphytum-filter-input")) {
          const columnId = e.target.closest("th")?.dataset.columnId;
          if (columnId) {
            this.columnFilters[columnId] = e.target.value;
            this.renderRecords();
          }
        }
      });
    }

    this.attachHeaderEventListeners();
  },

  initializeDragAndDrop() {
    const headerRow = UI.elements.dataTable?.querySelector("thead tr");
    if (!headerRow) {
      console.warn(
        "Table header row not found, skipping drag and drop initialization"
      );
      return;
    }

    headerRow.addEventListener("dragstart", this.handleDragStart.bind(this));
    headerRow.addEventListener("dragover", this.handleDragOver.bind(this));
    headerRow.addEventListener("dragend", this.handleDragEnd.bind(this));
    headerRow.addEventListener("drop", this.handleDrop.bind(this));
  },

  attachHeaderEventListeners() {
    const headerRow = UI.elements.dataTable.querySelector("thead tr");
    if (headerRow) {
      headerRow.addEventListener("click", this.handleHeaderClick.bind(this));
      const headerCells = headerRow.querySelectorAll("th");
      headerCells.forEach((th) => {
        th.addEventListener(
          "contextmenu",
          this.handleHeaderContextMenu.bind(this)
        );
      });
    }
  },

  initializeFontControls() {
    const toolbar = document.querySelector(".toolbar");
    if (!toolbar) {
      console.warn("Toolbar not found, skipping font controls initialization");
      return;
    }

    let fontControl = toolbar.querySelector(".symphytum-font-control");
    if (fontControl) {
      fontControl.remove();
    }

    fontControl = document.createElement("div");
    fontControl.className = "symphytum-font-control";

    const fontSelect = document.createElement("select");
    fontSelect.id = "symphytumFontSelect";
    fontSelect.className = "symphytum-select";

    const fonts = [
      { label: "Current Fonts", options: this.fontOptions.google },
      { label: "System Fonts", options: this.fontOptions.system },
    ];

    fonts.forEach((group) => {
      const optgroup = document.createElement("optgroup");
      optgroup.label = group.label;

      group.options.forEach((font) => {
        const option = document.createElement("option");
        option.value = font.value;
        option.textContent = font.name;
        option.style.fontFamily = font.value;
        optgroup.appendChild(option);
      });

      fontSelect.appendChild(optgroup);
    });

    const savedFont = localStorage.getItem("symphytumTableFont") || "Noto Sans";
    fontSelect.value = savedFont;
    this.setTableFont(savedFont);

    fontSelect.addEventListener("change", (e) => {
      this.setTableFont(e.target.value);
    });

    fontControl.appendChild(fontSelect);

    const searchContainer = toolbar.querySelector(".search-container");
    if (searchContainer) {
      toolbar.insertBefore(fontControl, searchContainer);
    } else {
      toolbar.appendChild(fontControl);
    }
  },

  setTableFont(fontFamily) {
    this.currentFont = fontFamily;
    const table = UI.elements.dataTable;
    if (table) {
      table.style.fontFamily = fontFamily;
    }
    localStorage.setItem("symphytumTableFont", fontFamily);
  },
    
  handleDragStart(e) {
        const th = e.target.closest('th');
        if (!th || !th.dataset.columnId || th.classList.contains('row-number-column') || th.classList.contains('actions-column')) {
            e.preventDefault();
            return;
        }

        AppState.draggedColumn = th;
        th.classList.add('dragging');

        // Create and style ghost image
        const ghost = th.cloneNode(true);
        ghost.style.opacity = '0.5';
        ghost.style.position = 'absolute';
        ghost.style.left = '-9999px';
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 0, 0);
        setTimeout(() => ghost.remove(), 0);

        AppState.dragStartIndex = Array.from(th.parentElement.children).indexOf(th);
    },

  handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const th = e.target.closest('th');
        if (!th || 
            !AppState.draggedColumn || 
            th === AppState.draggedColumn || 
            !th.dataset.columnId ||
            th.classList.contains('row-number-column') ||
            th.classList.contains('actions-column')) {
            return;
        }

        const headerRow = th.parentNode;
        const children = Array.from(headerRow.children);
        const draggedIndex = children.indexOf(AppState.draggedColumn);
        const targetIndex = children.indexOf(th);

        if (draggedIndex !== targetIndex) {
            // Show drop indicator
            const rect = th.getBoundingClientRect();
            const afterElement = e.clientX > rect.left + rect.width / 2;
            
            headerRow.querySelectorAll('.drop-before, .drop-after').forEach(el => {
                el.classList.remove('drop-before', 'drop-after');
            });
            
            th.classList.add(afterElement ? 'drop-after' : 'drop-before');
            AppState.dropTarget = { th, afterElement };
        }
    },

  handleDragEnd(e) {
        if (AppState.draggedColumn) {
            AppState.draggedColumn.classList.remove('dragging');
            
            document.querySelectorAll('.drop-before, .drop-after').forEach(el => {
                el.classList.remove('drop-before', 'drop-after');
            });
        }
        
        AppState.draggedColumn = null;
        AppState.dropTarget = null;
    },

  async handleDrop(e) {
        e.preventDefault();
        
        const targetTh = e.target.closest('th');
        if (!targetTh || 
            !targetTh.dataset.columnId || 
            !AppState.draggedColumn || 
            targetTh.classList.contains('row-number-column') ||
            targetTh.classList.contains('actions-column')) {
            return;
        }

        try {
            UI.showLoadingSpinner();

            const headerRow = targetTh.parentNode;
            const children = Array.from(headerRow.children);
            const draggedIndex = children.indexOf(AppState.draggedColumn);
            const targetIndex = children.indexOf(targetTh);
            
            if (draggedIndex !== targetIndex) {
                await this.updateColumnOrder(draggedIndex, targetIndex);
                await this.loadTableData();
                await this.renderTable();
            }

        } catch (error) {
            console.error('Failed to reorder columns:', error);
            Notifications.error('Failed to reorder columns: ' + error.message);
        } finally {
            UI.hideLoadingSpinner();
            this.handleDragEnd(e);
        }
    },

  async updateColumnOrder(fromIndex, toIndex) {
        // Adjust indices to account for the record number column
        fromIndex = Math.max(0, fromIndex - 1);
        toIndex = Math.max(0, toIndex - 1);

        const columns = [...AppState.columns];
        const [movedColumn] = columns.splice(fromIndex, 1);
        columns.splice(toIndex, 0, movedColumn);

        const transaction = DatabaseManager.db.transaction('columns', 'readwrite');
        const store = transaction.objectStore('columns');

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

  async createNewTable(tableName) {
    const transaction = DatabaseManager.db.transaction("tables", "readwrite");
    const store = transaction.objectStore("tables");
    const table = {
      name: tableName,
      created: new Date().toISOString(),
    };

    try {
      const tableId = await new Promise((resolve, reject) => {
        const request = store.add(table);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      AppState.currentTableId = tableId;
      await this.loadTables();
      return tableId;
    } catch (error) {
      console.error("Error creating table:", error);
      throw error;
    }
  },

  async deleteCurrentTable() {
    if (!AppState.currentTableId) {
      alert("No table selected to delete.");
      return;
    }
    DeleteConfirmModal.show(AppState.currentTableId, "table");
  },

  async loadTables() {
    const transaction = DatabaseManager.db.transaction("tables", "readonly");
    const store = transaction.objectStore("tables");

    try {
      const tables = await new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      AppState.tables = tables;
      this.renderTableList();

      if (UI.elements.deleteTableBtn) {
        const hasCurrentTable = Boolean(AppState.currentTableId);
        UI.elements.deleteTableBtn.disabled = !hasCurrentTable;
        UI.elements.deleteTableBtn.style.display = hasCurrentTable
          ? "inline-flex"
          : "none";
      }

      if (tables.length > 0 && !AppState.currentTableId) {
        await this.switchTable(tables[0].id);
      }
    } catch (error) {
      console.error("Error loading tables:", error);
      throw error;
    }
  },

  async loadTableData() {
    if (!AppState.currentTableId) return;

    try {
      const columns = await ColumnManager.loadColumns(AppState.currentTableId);
      const records = await RecordManager.loadRecords(AppState.currentTableId);

      AppState.columns = columns;
      AppState.records = records;

      await this.renderTable();
      FormManager.displayCurrentRecord();
    } catch (error) {
      console.error("Error loading table data:", error);
      ErrorManager.showError("Failed to load table data", error);
    }
  },

  renderTableList() {
    const tableSelect = UI.elements.tableSelect;
    if (!tableSelect) return;

    tableSelect.innerHTML = "";
    AppState.tables.forEach((table) => {
      const option = document.createElement("option");
      option.value = table.id;
      option.textContent = table.name;
      option.selected = table.id === AppState.currentTableId;
      tableSelect.appendChild(option);
    });
  },

  async renderTable() {
    this.renderColumns();
    this.renderRecords();
    this.updateTableDisplay();
  },

  renderColumns() {
    const headerRow = UI.elements.dataTable?.querySelector("thead tr");
    if (!headerRow) return;

    headerRow.innerHTML = "";

    const rowNumberTh = document.createElement("th");
    rowNumberTh.className = "row-number-column";
    rowNumberTh.textContent = "#";
    headerRow.appendChild(rowNumberTh);

    AppState.columns.forEach((column) => {
        if (this.isColumnHidden(column.id)) return;

        const th = document.createElement("th");
      th.setAttribute('draggable', 'true');
        th.className = "sortable resizable";
        th.setAttribute("data-column-id", column.id);

        const headerContent = document.createElement("div");
        headerContent.className = "symphytum-header-content";

        const columnName = document.createElement("span");
        columnName.className = "symphytum-column-name";
        columnName.textContent = column.name;

        // Add sort indicator if this is the sorted column
        if (AppState.currentSort.column === column.id) {
            const arrow = document.createElement("span");
            arrow.className = "sort-arrow";
            arrow.textContent = AppState.currentSort.direction === "asc" ? " ↑" : " ↓";
            columnName.appendChild(arrow);
        }

        headerContent.appendChild(columnName);

        // Add filter input
        const filterContainer = document.createElement("div");
        filterContainer.className = "symphytum-filter-container";

        const filterInput = document.createElement("input");
        filterInput.type = "text";
        filterInput.className = "symphytum-filter-input";
        filterInput.placeholder = `Filter ${column.name}...`;
        filterInput.value = this.columnFilters[column.id] || "";

        filterContainer.appendChild(filterInput);
        headerContent.appendChild(filterContainer);

        const resizeHandle = document.createElement("div");
        resizeHandle.className = "resize-handle";
        resizeHandle.addEventListener("mousedown", (e) => this.startResize(e, th));

        th.appendChild(headerContent);
        th.appendChild(resizeHandle);
        headerRow.appendChild(th);
    });

    // Add actions column if needed
    if (this.isDeleteEnabled()) {
        const actionsTh = document.createElement("th");
        actionsTh.className = "actions-column";
        actionsTh.textContent = "Actions";
        headerRow.appendChild(actionsTh);
    }
},

  attachHeaderEventListeners() {
    const headerRow = UI.elements.dataTable?.querySelector("thead tr");
    if (!headerRow) return;

    // Handle column clicks for sorting
    headerRow.addEventListener("click", (e) => {
      const th = e.target.closest("th");
      if (
        !th ||
        !th.dataset.columnId ||
        e.target.classList.contains("symphytum-filter-input")
      )
        return;

      const columnId = parseInt(th.dataset.columnId);
      if (AppState.currentSort.column === columnId) {
        AppState.currentSort.direction =
          AppState.currentSort.direction === "asc" ? "desc" : "asc";
      } else {
        AppState.currentSort.column = columnId;
        AppState.currentSort.direction = "asc";
      }

      // Update UI and re-render
      this.renderColumns();
      this.renderRecords();
    });

    // Handle filter inputs
    headerRow.querySelectorAll(".symphytum-filter-input").forEach((input) => {
      input.addEventListener("input", (e) => {
        e.stopPropagation(); // Prevent sort trigger
        const th = e.target.closest("th");
        if (th?.dataset.columnId) {
          this.columnFilters[th.dataset.columnId] = e.target.value;
          this.renderRecords();
        }
      });

      // Prevent sort trigger when clicking filter
      input.addEventListener("click", (e) => e.stopPropagation());
    });

    // Handle context menu
    headerRow.addEventListener("contextmenu", (e) => {
      const th = e.target.closest("th");
      if (!th || !th.dataset.columnId) return;
      e.preventDefault();
      this.handleHeaderContextMenu(e, parseInt(th.dataset.columnId));
    });
  },

  addHeaderStyles() {
    const style = document.createElement("style");
    style.textContent = `
        th.sortable {
            cursor: pointer;
            user-select: none;
            position: relative;
            padding: var(--spacing-md);
            background-color: var(--header-bg);
        }

        th.sortable:hover {
            background-color: var(--row-hover);
        }

        .sort-arrow {
            margin-left: 8px;
            color: var(--primary-color);
            font-weight: bold;
        }

        .sortable.asc .sort-arrow,
        .sortable.desc .sort-arrow {
            color: var(--primary-color);
        }

        .symphytum-header-content {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 8px;
        }

        .symphytum-column-name {
            display: flex;
            align-items: center;
            font-weight: 600;
            user-select: none;
        }
        .sortable {
    cursor: pointer;
    user-select: none;
    position: relative;
    padding-right: 25px !important;
}

.sortable:hover {
    background-color: var(--row-hover);
}

.sort-arrow {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary);
    font-size: 0.8em;
    opacity: 0.5;
}

th.asc .sort-arrow,
th.desc .sort-arrow {
    color: var(--primary-color);
    opacity: 1;
}

.sortable::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: var(--primary-color);
    transform: scaleX(0);
    transition: transform var(--transition-fast);
}

.sortable:hover::after {
    transform: scaleX(1);
}

/* Ensure sort indicators are visible in all themes */
.theme-dark .sort-arrow {
    color: var(--text-primary);
}

.theme-dark th.asc .sort-arrow,
.theme-dark th.desc .sort-arrow {
    color: var(--primary-color);
}
    `;
    document.head.appendChild(style);
  },

  createColumnHeader(column) {
    const th = document.createElement("th");
    th.className = "draggable resizable sortable";
    th.setAttribute("draggable", "true");
    th.dataset.columnId = column.id.toString();

    const headerContent = document.createElement("div");
    headerContent.className = "symphytum-header-content";

    const nameSpan = document.createElement("span");
    nameSpan.className = "symphytum-column-name";
    nameSpan.textContent = column.name;
    headerContent.appendChild(nameSpan);

    if (AppState.currentSort.column === column.id) {
      const arrow = document.createElement("span");
      arrow.className = "sort-arrow";
      arrow.textContent =
        AppState.currentSort.direction === "asc" ? " ↑" : " ↓";
      headerContent.appendChild(arrow);
    }

    const filterContainer = document.createElement("div");
    filterContainer.className = "symphytum-filter-container";

    const filterInput = document.createElement("input");
    filterInput.type = "text";
    filterInput.className = "symphytum-filter-input";
    filterInput.placeholder = `Filter ${column.name}...`;
    filterInput.value = this.columnFilters[column.id] || "";

    filterContainer.appendChild(filterInput);
    headerContent.appendChild(filterContainer);

    th.appendChild(headerContent);

    const resizeHandle = document.createElement("div");
    resizeHandle.className = "resize-handle";
    resizeHandle.addEventListener("mousedown", (e) => this.startResize(e, th));
    th.appendChild(resizeHandle);

    return th;
  },

  createTypeSelector(column) {
    const typeContainer = document.createElement("div");
    typeContainer.className = "column-type-container";

    const select = document.createElement("select");
    select.className = "column-type-select";
    select.title = "Change column type";

    const types = [
      { value: "text", label: "Text" },
      { value: "number", label: "Number" },
      { value: "date", label: "Date" },
      { value: "email", label: "Email" },
      { value: "url", label: "URL" },
      { value: "textarea", label: "Long Text" },
    ];

    types.forEach((type) => {
      const option = document.createElement("option");
      option.value = type.value;
      option.textContent = type.label;
      option.selected = type.value === column.type;
      select.appendChild(option);
    });

    select.addEventListener("change", async (e) => {
      try {
        UI.showLoadingSpinner();
        await this.changeColumnType(column.id, e.target.value);
        UI.hideLoadingSpinner();
      } catch (error) {
        UI.hideLoadingSpinner();
        ErrorManager.showError("Failed to change column type", error);
        select.value = column.type;
      }
    });

    typeContainer.appendChild(select);
    return typeContainer;
  },

  async changeColumnType(columnId, newType) {
    const column = AppState.columns.find((col) => col.id === columnId);
    if (!column) throw new Error("Column not found");

    const transaction = DatabaseManager.db.transaction("columns", "readwrite");
    const store = transaction.objectStore("columns");

    try {
      column.type = newType;
      await new Promise((resolve, reject) => {
        const request = store.put(column);
        request.onsuccess = resolve;
        request.onerror = () => reject(request.error);
      });

      await this.loadTableData();
      return true;
    } catch (error) {
      console.error("Error changing column type:", error);
      throw error;
    }
  },

  createRenameColumnModal() {
    const existingModal = document.getElementById("renameColumnCustomModal");
    if (existingModal) {
      existingModal.remove();
    }

    const modalHtml = `
            <div id="renameColumnCustomModal" class="modal" role="dialog" aria-labelledby="renameColumnTitle">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="renameColumnTitle">Rename Column</h3>
                        <button id="closeRenameColumnCustomModal" class="close-button" aria-label="Close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="renameColumnCustomInput">New Column Name:</label>
                            <input type="text" id="renameColumnCustomInput" class="form-input">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="cancelRenameColumnCustomBtn" class="button">Cancel</button>
                        <button id="saveRenameColumnCustomBtn" class="button button-primary">Save</button>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
  },

  promptRenameColumn(columnId) {
    const numericColumnId = Number(columnId);
    const column = AppState.columns.find((col) => col.id === numericColumnId);

    if (!column) {
      console.error("Column not found:", columnId);
      return;
    }

    // Ensure modal exists
    if (!document.getElementById("renameColumnCustomModal")) {
      this.createRenameColumnModal();
    }

    const modal = document.getElementById("renameColumnCustomModal");
    const input = document.getElementById("renameColumnCustomInput");
    const backdrop = UI.elements.modalBackdrop;

    if (!modal || !input || !backdrop) {
      console.error("Required modal elements not found");
      return;
    }

    // Set current column name
    input.value = column.name;

    // Show modal
    modal.style.display = "block";
    backdrop.style.display = "block";
    input.focus();
    input.select();

    // Define handlers
    const handleSave = async () => {
      const newName = input.value.trim();
      if (!newName) {
        alert("Column name cannot be empty");
        return;
      }

      if (newName !== column.name) {
        try {
          UI.showLoadingSpinner();
          await ColumnManager.renameColumn(numericColumnId, newName);
          await this.renderColumns();
          closeModal();
        } catch (error) {
          console.error("Error renaming column:", error);
          alert("Failed to rename column: " + error.message);
        } finally {
          UI.hideLoadingSpinner();
        }
      } else {
        closeModal();
      }
    };

    const closeModal = () => {
      modal.style.display = "none";
      backdrop.style.display = "none";
      removeListeners();
    };

    // Add event listeners
    const saveBtn = document.getElementById("saveRenameColumnCustomBtn");
    const cancelBtn = document.getElementById("cancelRenameColumnCustomBtn");
    const closeBtn = document.getElementById("closeRenameColumnCustomModal");

    const handleKeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        closeModal();
      }
    };

    const removeListeners = () => {
      input.removeEventListener("keydown", handleKeydown);
      saveBtn?.removeEventListener("click", handleSave);
      cancelBtn?.removeEventListener("click", closeModal);
      closeBtn?.removeEventListener("click", closeModal);
    };

    input.addEventListener("keydown", handleKeydown);
    saveBtn?.addEventListener("click", handleSave);
    cancelBtn?.addEventListener("click", closeModal);
    closeBtn?.addEventListener("click", closeModal);
  },

  initialize() {
    initializeTableStyles();
    this.initializeFontControls();
    this.initializeEventListeners();
    this.initializeDragAndDrop();

    const table = UI.elements.dataTable;
    if (table && !table.querySelector("tbody")) {
      table.appendChild(document.createElement("tbody"));
    }

    this.renderRecords();
  },

  createRecordRow(tr, record, index) {
    const rowNumberTd = document.createElement("td");
    rowNumberTd.className = "row-number-cell";
    rowNumberTd.textContent = index + 1;
    tr.appendChild(rowNumberTd);

    AppState.columns.forEach((column) => {
      if (this.isColumnHidden(column.id)) return;
      const td = document.createElement("td");
   
    td.setAttribute("data-record-id", record.id);
    td.setAttribute("data-column-id", column.id);

      td.setAttribute("data-record-id", record.id);
      const value = record.data[column.id] ?? "";
      this.renderCell(td, value, column.type);
      tr.appendChild(td);
    });

    if (!this.isDeleteDisabled()) {
      const actionsTd = document.createElement("td");
      actionsTd.className = "actions-column";
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-row-btn";
      deleteBtn.innerHTML = "×";
      deleteBtn.title = "Delete Row";
      deleteBtn.setAttribute("aria-label", "Delete Row");

      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this record?")) {
          try {
            await RecordManager.deleteRecord(record.id);
            await this.loadTableData();
          } catch (error) {
            console.error("Failed to delete record:", error);
            alert("Failed to delete record: " + error.message);
          }
        }
      });

      actionsTd.appendChild(deleteBtn);
      tr.appendChild(actionsTd);
    }
  },

renderCell(td, value, type) {
  if (type === "backgroundColor") {
    // Create a container div for the cell content
    const container = document.createElement("div");
    container.className = "background-color-cell";
    container.style.background = value || ""; // Apply the background color
    container.textContent = ""; // Ensure there's no text

    // Add click event listener to open the color picker
    container.addEventListener("click", () => {
      ColumnManager.openColorPicker(container, td.dataset.recordId, td.dataset.columnId);
    });

    td.appendChild(container);
  } else if (type === "url" && value) {
    // Existing code for 'url' type
    const container = document.createElement("div");
    container.className = "url-cell-container";

    try {
      if (this.isImageUrl(value)) {
        container.appendChild(this.createImagePreview(value));
      } else {
        container.appendChild(this.createUrlLink(value));
      }
    } catch (error) {
      console.error("Error creating URL cell:", error);
      container.textContent = value;
    }

    td.appendChild(container);
  } else {
    // Existing code for other types
    td.textContent = value;
  }

  return td;
},


  switchView(view) {
    try {
      AppState.viewMode = view;
      const isTableView = view === "table";

      const tableView = document.getElementById("tableView");
      const formView = document.getElementById("formView");
      const tableViewBtn = document.getElementById("tableViewBtn");
      const formViewBtn = document.getElementById("formViewBtn");

      if (!tableView || !formView) {
        console.error("View elements not found:", { tableView, formView });
        return;
      }

      tableView.style.display = isTableView ? "block" : "none";
      formView.style.display = isTableView ? "none" : "block";

      if (tableViewBtn) {
        tableViewBtn.classList.toggle("active", isTableView);
      }
      if (formViewBtn) {
        formViewBtn.classList.toggle("active", !isTableView);
      }

      document.body.setAttribute("data-view", view);

      if (isTableView) {
        this.renderRecords();
      } else {
        FormManager.displayCurrentRecord();

        const formContent = document.querySelector(".form-content");
        const bgColor = localStorage.getItem("formBgColor");
        const labelColor = localStorage.getItem("formLabelColor");

        if (formContent && bgColor) {
          formContent.style.backgroundColor = bgColor;
        }

        if (labelColor) {
          document.querySelectorAll(".form-group label").forEach((label) => {
            label.style.color = labelColor;
          });
        }
      }
    } catch (error) {
      console.error("Error switching view:", error);

      if (document.getElementById("tableView")) {
        document.getElementById("tableView").style.display = "block";
      }
      if (document.getElementById("formView")) {
        document.getElementById("formView").style.display = "none";
      }
    }
  },
  
  initializeViews() {
    let tableView = document.getElementById("tableView");
    let formView = document.getElementById("formView");

    if (!tableView) {
      tableView = document.createElement("div");
      tableView.id = "tableView";
      tableView.className = "table-container";
      tableView.innerHTML =
        '<table id="dataTable"><thead><tr><th style="width: 25px">#</th></tr></thead><tbody></tbody></table>';
      document.getElementById("app-container").appendChild(tableView);
    }

    if (!formView) {
      formView = document.createElement("div");
      formView.id = "formView";
      formView.className = "form-view";
      formView.innerHTML = `
        <div class="form-navigation"></div>
        <form id="recordForm"></form>
    `;
      document.getElementById("app-container").appendChild(formView);
    }
  },
  
  renderRecords(options = { silent: false }) {
    let table;
    try {
        table = document.getElementById('dataTable');
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

                // Make cell editable on click using makeEditable instead of startEditingCell
                td.addEventListener('click', (e) => {
                    if (!td.classList.contains('editing')) {
                        TableManager.makeEditable(td);
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
                TableManager.makeEditable(newCell);
            }
        }

        // Only update form view if this is not a silent render
        if (!options.silent && AppState.viewMode === 'form') {
            FormManager.displayCurrentRecord({ silent: true });
        }

    } catch (error) {
        console.error('Error rendering records:', error);
        if (table) {
            this.showErrorMessage(table);
        } else {
            console.error('Cannot show error message: table element not found');
            if (typeof Notifications !== 'undefined') {
                Notifications.error('Failed to render table: ' + error.message);
            }
        }
    }
},
  
  async handleDeleteRow(recordId) {
    try {
      if (!confirm("Are you sure you want to delete this record?")) return;

      UI.showLoadingSpinner();
      await RecordManager.deleteRecord(recordId);

      AppState.records = AppState.records.filter(
        (record) => record.id !== recordId
      );

      this.renderRecords();

      const actionsCells = document.querySelectorAll(".actions-column");
      const isDeleteEnabled =
        localStorage.getItem("deleteButtonsVisible") === "true";

      actionsCells.forEach((cell) => {
        cell.style.display = isDeleteEnabled ? "table-cell" : "none";
      });

      UI.hideLoadingSpinner();
    } catch (error) {
      console.error("Failed to delete record:", error);
      UI.hideLoadingSpinner();
      alert("Failed to delete record: " + error.message);
    }
  },

  isDeleteEnabled() {
    return localStorage.getItem("deleteButtonsVisible") === "true";
  },

  async switchTable(tableId) {
    AppState.currentTableId = tableId;
    if (UI.elements.deleteTableBtn) {
      UI.elements.deleteTableBtn.disabled = !tableId;
      UI.elements.deleteTableBtn.style.display = tableId
        ? "inline-flex"
        : "none";
    }
    await this.loadTableData();
  },

  startResize(e, header) {
    e.stopPropagation();
    e.preventDefault();

    this.resizeState = {
      isResizing: true,
      currentHeader: header,
      startX: e.pageX,
      startWidth: header.offsetWidth,
    };

    header.classList.add("resizing");
  },

  handleResize(e) {
    if (!this.resizeState.isResizing) return;

    const delta = e.pageX - this.resizeState.startX;
    const newWidth = Math.max(50, this.resizeState.startWidth + delta);
    this.resizeState.currentHeader.style.width = `${newWidth}px`;

    const columnId = this.resizeState.currentHeader.dataset.columnId;
    localStorage.setItem(`column-width-${columnId}`, `${newWidth}px`);
  },

  stopResize() {
    if (!this.resizeState.isResizing) return;

    this.resizeState.currentHeader?.classList.remove("resizing");
    this.resizeState = {
      isResizing: false,
      currentHeader: null,
      startX: 0,
      startWidth: 0,
    };
  },

  handleHeaderClick(e) {
    const th = e.target.closest("th");
    if (!th || !th.dataset.columnId || e.target.classList.contains("symphytum-filter-input")) return;

    const columnId = parseInt(th.dataset.columnId);
    const column = AppState.columns.find((col) => col.id === columnId);

    if (!column || column.isRecordNumber) return;

    try {
        // Toggle sort direction if clicking same column, otherwise start with ascending
        if (AppState.currentSort.column === columnId) {
            AppState.currentSort.direction =
                AppState.currentSort.direction === "asc" ? "desc" : "asc";
        } else {
            AppState.currentSort.column = columnId;
            AppState.currentSort.direction = "asc";
        }

        // Update sort indicators in UI
        this.updateSortIndicators();
        this.renderRecords();
    } catch (error) {
        console.error('Sort failed:', error);
        throw error;
    }
},

  updateSortIndicators() {
    const headers = document.querySelectorAll('#dataTable th');
    headers.forEach((th) => {
        // Remove existing sort classes and arrows
        th.classList.remove('asc', 'desc');
        const arrow = th.querySelector('.sort-arrow');
        if (arrow) arrow.remove();

        // Add new sort indicator if this is the sorted column
        if (th.dataset.columnId == AppState.currentSort.column) {
            const direction = AppState.currentSort.direction;
            th.classList.add(direction);
            
            const arrow = document.createElement('span');
            arrow.className = 'sort-arrow';
            arrow.textContent = direction === 'asc' ? ' ↑' : ' ↓';
            th.appendChild(arrow);
        }
    });
},
  
  async deleteSpecificTable(tableId) {
    if (!tableId) {
      throw new Error("No table ID provided");
    }

    try {
      const transaction = DatabaseManager.db.transaction(
        ["tables", "columns", "records"],
        "readwrite"
      );

      const table = AppState.tables.find((t) => t.id === tableId);
      const columns = AppState.columns;
      const records = AppState.records;

      await new Promise((resolve, reject) => {
        const tableStore = transaction.objectStore("tables");
        const request = tableStore.delete(tableId);
        request.onsuccess = resolve;
        request.onerror = () => reject(request.error);
      });

      const columnStore = transaction.objectStore("columns");
      const columnIndex = columnStore.index("tableId");
      const columnRequest = columnIndex.getAll(tableId);

      await new Promise((resolve, reject) => {
        columnRequest.onsuccess = async () => {
          const columns = columnRequest.result;
          for (const column of columns) {
            await new Promise((res, rej) => {
              const req = columnStore.delete(column.id);
              req.onsuccess = res;
              req.onerror = () => rej(req.error);
            });
          }
          resolve();
        };
        columnRequest.onerror = () => reject(columnRequest.error);
      });

      const recordStore = transaction.objectStore("records");
      const recordIndex = recordStore.index("tableId");
      const recordRequest = recordIndex.getAll(tableId);

      await new Promise((resolve, reject) => {
        recordRequest.onsuccess = async () => {
          const records = recordRequest.result;
          for (const record of records) {
            await new Promise((res, rej) => {
              const req = recordStore.delete(record.id);
              req.onsuccess = res;
              req.onerror = () => rej(req.error);
            });
          }
          resolve();
        };
        recordRequest.onerror = () => reject(recordRequest.error);
      });

      await new Promise((resolve, reject) => {
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(new Error("Transaction aborted"));
      });

      if (AppState.currentTableId === tableId) {
        AppState.currentTableId = null;
        AppState.columns = [];
        AppState.records = [];
      }

      return true;
    } catch (error) {
      console.error("Error deleting table:", error);
      throw new Error(`Failed to delete table: ${error.message}`);
    }
  },

  async updateBackgroundColor(color) {
    // Store the color preference
    localStorage.setItem("db4sql-backgroundColor", color);

    // Get the table and rows
    const table = document.getElementById("dataTable");
    if (!table) return;

    const rows = table.querySelectorAll("tbody tr");

    // Calculate alternating colors
    const baseColor = this.hexToRgba(color, 0.3);
    const alternateColor = this.hexToRgba(color, 0.1);

    // Apply colors to rows
    rows.forEach((row, index) => {
      row.style.backgroundColor = index % 2 === 0 ? baseColor : alternateColor;
    });

    // Save the alternating colors
    localStorage.setItem("db4sql-baseRowColor", baseColor);
    localStorage.setItem("db4sql-alternateRowColor", alternateColor);
  },

  adjustColor(color, percent) {
    try {
      const rgb = this.hexToRgb(color) || { r: 255, g: 255, b: 255 };
      const factor = percent / 100;

      return `rgba(${Math.min(255, rgb.r + (255 - rgb.r) * factor)}, 
                      ${Math.min(255, rgb.g + (255 - rgb.g) * factor)}, 
                      ${Math.min(255, rgb.b + (255 - rgb.b) * factor)}, 0.3)`;
    } catch (error) {
      console.error("Error adjusting color:", error);
      return color;
    }
  },

  hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  },

  getContrastColor(hexcolor) {
    const rgb = this.hexToRgb(hexcolor);
    if (!rgb) return "#000000";

    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.5 ? "#000000" : "#ffffff";
  },
  
  async handleHeaderClick(event) {
    const th = event.target.closest("th");
    if (!th || !th.dataset.columnId) return;

    const columnId = parseInt(th.dataset.columnId);
    const column = AppState.columns.find((col) => col.id === columnId);

    if (!column || column.isRecordNumber) return;

    try {
      UI.showLoadingSpinner();

      // Toggle sort direction
      if (AppState.currentSort.column === columnId) {
        AppState.currentSort.direction =
          AppState.currentSort.direction === "asc" ? "desc" : "asc";
      } else {
        AppState.currentSort.column = columnId;
        AppState.currentSort.direction = "asc";
      }

      // Update sort indicators in UI
      const headers = document.querySelectorAll("#dataTable th");
      headers.forEach((header) => {
        header.classList.remove("asc", "desc");
        const arrow = header.querySelector(".sort-arrow");
        if (arrow) arrow.remove();
      });

      // Add sort indicator to current column
      if (AppState.currentSort.direction) {
        th.classList.add(AppState.currentSort.direction);
        const arrow = document.createElement("span");
        arrow.className = "sort-arrow";
        arrow.textContent =
          AppState.currentSort.direction === "asc" ? " ↑" : " ↓";
        th.appendChild(arrow);
      }

      // Re-render the records with new sort
      await this.renderRecords();
    } catch (error) {
      console.error("Sort failed:", error);
      Notifications.error("Failed to sort table: " + error.message);
    } finally {
      UI.hideLoadingSpinner();
    }
  },

  sortRecords(records) {
    if (!AppState.currentSort.column) return records;

    // Create a stable array of records with all their data
    const recordsWithData = records.map(record => ({
        id: record.id,
        data: { ...record.data },
        originalRecord: record
    }));

    // Sort while maintaining all data relationships
    const sorted = recordsWithData.sort((a, b) => {
        const columnId = AppState.currentSort.column;
        const column = AppState.columns.find(col => col.id === columnId);
        if (!column) return 0;

        const aVal = a.data[columnId] ?? "";
        const bVal = b.data[columnId] ?? "";

        let comparison;
        switch (column.type) {
            case "number":
                const aNum = aVal === "" ? -Infinity : Number(aVal);
                const bNum = bVal === "" ? -Infinity : Number(bVal);
                comparison = aNum - bNum;
                break;

            case "date":
                const aDate = aVal ? new Date(aVal).getTime() : -Infinity;
                const bDate = bVal ? new Date(bVal).getTime() : -Infinity;
                comparison = aDate - bDate;
                break;

            default:
                // Add secondary sort by record ID to maintain stable order
                comparison = String(aVal).localeCompare(String(bVal), undefined, {
                    numeric: true,
                    sensitivity: "base"
                });
                if (comparison === 0) {
                    return a.id - b.id; // Stable secondary sort
                }
                break;
        }

        // Apply sort direction
        return AppState.currentSort.direction === "asc" ? comparison : -comparison;
    });

    // Update the AppState currentRecordIndex to follow the selected record
    const selectedRecord = AppState.records[AppState.currentRecordIndex];
    if (selectedRecord) {
        const newIndex = sorted.findIndex(item => item.id === selectedRecord.id);
        if (newIndex !== -1) {
            AppState.currentRecordIndex = newIndex;
        }
    }

    // Return the sorted records while preserving all data
    return sorted.map(item => item.originalRecord);
},

  filterRecords() {
    const query = UI.elements.searchInput?.value?.toLowerCase().trim();
    const hasColumnFilters = Object.values(this.columnFilters).some(
      (filter) => filter
    );

    return AppState.records.filter((record) => {
      if (query) {
        const matchesGlobal = AppState.columns.some((column) => {
          if (this.isColumnHidden(column.id)) return false;
          const value = record.data[column.id];
          if (!value) return false;

          const stringValue = String(value).toLowerCase();

          switch (column.type) {
            case "url":
              return this.filterUrlValue(stringValue, query);
            case "number":
              return stringValue === query;
            case "date":
              return this.filterDateValue(value, query);
            default:
              return stringValue.includes(query);
          }
        });
        if (!matchesGlobal) return false;
      }

      if (hasColumnFilters) {
        return Object.entries(this.columnFilters).every(
          ([columnId, filterValue]) => {
            if (!filterValue) return true;
            const value = record.data[columnId];
            if (!value) return false;
            return String(value)
              .toLowerCase()
              .includes(filterValue.toLowerCase());
          }
        );
      }

      return true;
    });
  },

  filterUrlValue(url, query) {
    try {
      const parts = url.replace(/\\/g, "/").split("/");
      const fileName = parts.filter((part) => part).pop() || "";
      return fileName.toLowerCase().includes(query) || url.includes(query);
    } catch {
      return url.includes(query);
    }
  },

  filterDateValue(value, query) {
    try {
      const dateStr = new Date(value).toLocaleDateString();
      return dateStr.toLowerCase().includes(query);
    } catch {
      return String(value).toLowerCase().includes(query);
    }
  },

  handleHeaderContextMenu(e) {
    e.preventDefault();
    const th = e.target.closest("th");
    if (!th || !th.dataset.columnId) return;

    const columnId = parseInt(th.dataset.columnId, 10);
    const column = AppState.columns.find((col) => col.id === columnId);

    if (!column || column.isRecordNumber) return;

    this.showColumnContextMenu(e.pageX, e.pageY, columnId);
  },

  showColumnContextMenu(x, y, columnId) {
    this.hideContextMenu();

    const menu = document.createElement("div");
    menu.className = "column-context-menu";
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    const renameButton = document.createElement("button");
    renameButton.textContent = "Rename Column";
    renameButton.onclick = () => {
      this.hideContextMenu();
      this.promptRenameColumn(columnId);
    };

    const hideButton = document.createElement("button");
    hideButton.textContent = "Hide Column";
    hideButton.onclick = () => {
      this.hideContextMenu();
      this.hideColumn(columnId);
    };

    menu.appendChild(renameButton);
    menu.appendChild(hideButton);
    document.body.appendChild(menu);

    menu.offsetHeight;
    menu.classList.add("active");

    this.currentContextMenu = menu;

    const closeHandler = (e) => {
      if (!menu.contains(e.target)) {
        this.hideContextMenu();
        document.removeEventListener("click", closeHandler);
      }
    };

    setTimeout(() => {
      document.addEventListener("click", closeHandler);
    }, 0);
  },

  hideContextMenu() {
    if (this.currentContextMenu) {
      this.currentContextMenu.classList.remove("active");
      setTimeout(() => {
        if (this.currentContextMenu && this.currentContextMenu.parentNode) {
          this.currentContextMenu.parentNode.removeChild(
            this.currentContextMenu
          );
        }
        this.currentContextMenu = null;
      }, 200);
    }
  },

  promptRenameColumn(columnId) {
    const numericColumnId = Number(columnId);
    const column = AppState.columns.find((col) => col.id === numericColumnId);

    if (!column) {
      console.error("Column not found:", columnId);
      return;
    }

    const modal = document.getElementById("renameColumnCustomModal");
    const input = document.getElementById("renameColumnCustomInput");
    const backdrop = UI.elements.modalBackdrop;

    if (!modal || !input || !backdrop) {
      console.error("Required modal elements not found");
      return;
    }

    input.value = column.name;

    modal.style.display = "block";
    backdrop.style.display = "block";
    input.focus();
    input.select();

    const handleSave = async () => {
      const newName = input.value.trim();
      if (!newName) {
        alert("Column name cannot be empty");
        return;
      }

      if (newName !== column.name) {
        try {
          UI.showLoadingSpinner();
          await ColumnManager.renameColumn(numericColumnId, newName);
          await this.renderColumns();
          closeModal();
        } catch (error) {
          console.error("Error renaming column:", error);
          alert("Failed to rename column: " + error.message);
        } finally {
          UI.hideLoadingSpinner();
        }
      } else {
        closeModal();
      }
    };

    const closeModal = () => {
      modal.style.display = "none";
      backdrop.style.display = "none";
      removeListeners();
    };

    const saveBtn = document.getElementById("saveRenameColumnCustomBtn");
    const cancelBtn = document.getElementById("cancelRenameColumnCustomBtn");
    const closeBtn = document.getElementById("closeRenameColumnCustomModal");

    const handleKeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        closeModal();
      }
    };

    const removeListeners = () => {
      input.removeEventListener("keydown", handleKeydown);
      saveBtn?.removeEventListener("click", handleSave);
      cancelBtn?.removeEventListener("click", closeModal);
      closeBtn?.removeEventListener("click", closeModal);
    };

    input.addEventListener("keydown", handleKeydown);
    saveBtn?.addEventListener("click", handleSave);
    cancelBtn?.addEventListener("click", closeModal);
    closeBtn?.addEventListener("click", closeModal);
  },

  hideColumn(columnId) {
    let hiddenColumns = JSON.parse(
      localStorage.getItem("hiddenColumns") || "[]"
    );
    if (!hiddenColumns.includes(columnId)) {
      hiddenColumns.push(columnId);
      localStorage.setItem("hiddenColumns", JSON.stringify(hiddenColumns));
      this.renderTable();
    }
  },

  isColumnHidden(columnId) {
    const hiddenColumns = JSON.parse(
      localStorage.getItem("hiddenColumns") || "[]"
    );
    return hiddenColumns.includes(columnId);
  },

  isDeleteDisabled() {
    return localStorage.getItem("deleteButtonsVisible") !== "true";
  },

  updateTableDisplay() {
    const isDeleteEnabled = this.isDeleteEnabled();

    this.renderColumns();

    this.renderRecords();

    document
      .querySelectorAll(".delete-column-btn, .delete-row-btn")
      .forEach((btn) => {
        btn.style.display = isDeleteEnabled ? "flex" : "none";
      });

    document.querySelectorAll(".column-type-container").forEach((container) => {
      container.style.display = isDeleteEnabled ? "block" : "none";
    });

    const table = document.getElementById("dataTable");
    if (!table) return;

    const actionsCells = table.querySelectorAll(".actions-column");
    actionsCells.forEach((cell) => {
      if (isDeleteEnabled) {
        cell.style.display = "table-cell";
        cell.style.width = "50px";
        cell.style.padding = "0";
        cell.style.textAlign = "center";
        cell.style.borderRight = "1px solid var(--border-color)";
      } else {
        cell.style.display = "none";
        cell.style.width = "0";
        cell.style.padding = "0";
        cell.style.border = "none";
      }
    });

    const rows = table.querySelectorAll("tr");
    rows.forEach((row) => {
      const cells = row.querySelectorAll("td, th");
      cells.forEach((cell) => {
        if (!cell.classList.contains("actions-column")) {
          cell.style.borderRight = "1px solid var(--border-color)";
        }
      });
    });

    table.style.display = "none";
    table.offsetHeight;
    table.style.display = "";
  },

  isImageUrl(url) {
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp)$/i;
    const imgurPattern = /imgur\.com\/[a-zA-Z0-9]+/i;
    return imageExtensions.test(url) || imgurPattern.test(url);
  },

  getImgurUrl(url) {
    const imgurMatch = url.match(
      /(?:https?:\/\/)?(?:i\.)?imgur\.com\/([a-zA-Z0-9]+)(?:\.[a-zA-Z]+)?/i
    );
    if (imgurMatch) {
      const id = imgurMatch[1];
      return `https://i.imgur.com/${id}.jpg`;
    }
    return url;
  },

  createImagePreview(value) {
    const previewContainer = document.createElement("div");
    previewContainer.className = "symphytum-preview-container";

    const img = document.createElement("img");
    img.className = "symphytum-preview-image";
    img.src = this.getImgurUrl(value);
    img.alt = "Image preview";

    img.style.width = "100px";
    img.style.height = "100px";
    img.style.objectFit = "cover";

    img.addEventListener("click", () => this.showExpandedPreview(img.src));

    previewContainer.appendChild(img);

    const urlText = document.createElement("div");
    urlText.className = "symphytum-url-text";
    urlText.textContent = value;

    const wrapper = document.createElement("div");
    wrapper.appendChild(previewContainer);
    wrapper.appendChild(urlText);

    return wrapper;
  },

  getImgurUrl(url) {
    const imgurMatch = url.match(
      /(?:https?:\/\/)?(?:i\.)?imgur\.com\/([a-zA-Z0-9]+)(?:\.[a-zA-Z]+)?/i
    );
    if (imgurMatch) {
      const id = imgurMatch[1];
      return `https://i.imgur.com/${id}.jpg`;
    }
    return url;
  },

  createImagePreview(value) {
    const previewContainer = document.createElement("div");
    previewContainer.className = "symphytum-preview-container";

    const img = document.createElement("img");
    img.className = "symphytum-preview-image";
    img.src = this.getImgurUrl(value);
    img.alt = "Image preview";

    img.style.width = "100px";
    img.style.height = "100px";
    img.style.objectFit = "cover";
    img.style.cursor = "pointer";
    img.style.borderRadius = "4px";

    img.addEventListener("click", (e) => {
      e.stopPropagation();
      this.showExpandedPreview(img.src);
    });

    previewContainer.appendChild(img);

    const urlText = document.createElement("div");
    urlText.className = "symphytum-url-text";
    urlText.textContent = value;
    urlText.style.marginTop = "4px";
    urlText.style.fontSize = "12px";
    urlText.style.wordBreak = "break-all";

    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.alignItems = "center";
    wrapper.appendChild(previewContainer);
    wrapper.appendChild(urlText);

    return wrapper;
  },

  showExpandedPreview(imageUrl) {
    const existingModal = document.querySelector(".symphytum-image-modal");
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement("div");
    modal.className = "symphytum-image-modal";

    const container = document.createElement("div");
    container.style.position = "relative";
    container.style.maxWidth = "90%";
    container.style.maxHeight = "90%";

    const closeButton = document.createElement("span");
    closeButton.className = "symphytum-close-button";
    closeButton.innerHTML = "&times;";
    closeButton.style.position = "absolute";
    closeButton.style.right = "-40px";
    closeButton.style.top = "-40px";
    closeButton.style.fontSize = "30px";
    closeButton.style.color = "white";
    closeButton.style.cursor = "pointer";
    closeButton.style.padding = "10px";
    closeButton.style.zIndex = "10001";

    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = "Expanded preview";
    img.style.maxWidth = "100%";
    img.style.maxHeight = "90vh";
    img.style.objectFit = "contain";
    img.style.borderRadius = "8px";
    img.style.boxShadow = "0 0 20px rgba(0,0,0,0.3)";

    container.appendChild(closeButton);
    container.appendChild(img);
    modal.appendChild(container);

    const closeModal = () => {
      modal.remove();
      document.body.style.overflow = "";
    };

    closeButton.addEventListener("click", (e) => {
      e.stopPropagation();
      closeModal();
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closeModal();
        document.removeEventListener("keydown", handleKeyDown);
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    document.body.appendChild(modal);
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      modal.style.opacity = "0";
      modal.offsetHeight;
      modal.style.transition = "opacity 0.3s ease-in-out";
      modal.style.opacity = "1";
    });
  },

  async deleteSpecificTable(tableId) {
    if (!tableId) {
      throw new Error("No table ID provided");
    }

    try {
      // Start a transaction that includes all required object stores
      const transaction = DatabaseManager.db.transaction(
        ["tables", "columns", "records"],
        "readwrite"
      );

      // Store current table data for potential undo
      const table = AppState.tables.find((t) => t.id === tableId);
      const columns = AppState.columns;
      const records = AppState.records;

      // Delete from tables store
      await new Promise((resolve, reject) => {
        const tableStore = transaction.objectStore("tables");
        const request = tableStore.delete(tableId);
        request.onsuccess = resolve;
        request.onerror = () => reject(request.error);
      });

      // Delete associated columns
      await this.deleteTableColumns(transaction, tableId);

      // Delete associated records
      await this.deleteTableRecords(transaction, tableId);

      // Wait for transaction to complete
      await new Promise((resolve, reject) => {
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(new Error("Transaction aborted"));
      });

      // Update AppState
      if (AppState.currentTableId === tableId) {
        AppState.currentTableId = null;
        AppState.columns = [];
        AppState.records = [];
      }

      return true;
    } catch (error) {
      console.error("Error deleting table:", error);
      throw new Error(`Failed to delete table: ${error.message}`);
    }
  },

  async deleteTableColumns(transaction, tableId) {
    const store = transaction.objectStore("columns");
    const index = store.index("tableId");
    const request = index.getAll(tableId);

    await new Promise((resolve, reject) => {
      request.onsuccess = async () => {
        const columns = request.result;
        for (const column of columns) {
          await new Promise((res, rej) => {
            const req = store.delete(column.id);
            req.onsuccess = res;
            req.onerror = () => rej(req.error);
          });
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  },

  async deleteTableRecords(transaction, tableId) {
    const store = transaction.objectStore("records");
    const index = store.index("tableId");
    const request = index.getAll(tableId);

    await new Promise((resolve, reject) => {
      request.onsuccess = async () => {
        const records = request.result;
        for (const record of records) {
          await new Promise((res, rej) => {
            const req = store.delete(record.id);
            req.onsuccess = res;
            req.onerror = () => rej(req.error);
          });
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  },

  adjustColor(color, percent) {
    let rgba = this.colorToRgba(color);
    if (!rgba) return color;

    rgba.r = Math.min(
      255,
      Math.max(0, rgba.r + (255 - rgba.r) * (percent / 100))
    );
    rgba.g = Math.min(
      255,
      Math.max(0, rgba.g + (255 - rgba.g) * (percent / 100))
    );
    rgba.b = Math.min(
      255,
      Math.max(0, rgba.b + (255 - rgba.b) * (percent / 100))
    );

    return `rgba(${Math.round(rgba.r)}, ${Math.round(rgba.g)}, ${Math.round(
      rgba.b
    )}, ${rgba.a})`;
  },

  colorToRgba(color) {
    let ctx = document.createElement("canvas").getContext("2d");
    ctx.fillStyle = color;
    let computed = ctx.fillStyle;
    ctx.fillStyle = computed;

    let rgba = ctx.fillStyle.match(/rgba?\(([\d\s.,]+)\)/);
    if (rgba) {
      let parts = rgba[1].split(",").map(Number);
      return {
        r: parts[0],
        g: parts[1],
        b: parts[2],
        a: parts[3] !== undefined ? parts[3] : 1,
      };
    }
    return null;
  },

  reapplyCellStyles() {
    const styles = {
      fontWeight: localStorage.getItem("db4sql-fontWeight") || "normal",
      fontStyle: localStorage.getItem("db4sql-fontStyle") || "normal",
      textDecoration: localStorage.getItem("db4sql-textDecoration") || "none",
      textAlign: localStorage.getItem("db4sql-textAlign") || "left",
      backgroundColor: localStorage.getItem("db4sql-backgroundColor") || "",
      fontSize: localStorage.getItem("db4sql-fontSize") || "14",
    };

    const tableCells = document.querySelectorAll(
      "#dataTable td, #dataTable th"
    );
    tableCells.forEach((cell) => {
      Object.assign(cell.style, {
        fontWeight: styles.fontWeight,
        fontStyle: styles.fontStyle,
        textDecoration: styles.textDecoration,
        textAlign: styles.textAlign,
        fontSize: styles.fontSize + "px", // Corrected line
      });
    });

    if (styles.backgroundColor) {
      const tableRows = document.querySelectorAll("#dataTable tbody tr");
      const lightColor = this.lightenColor(styles.backgroundColor, 90);

      tableRows.forEach((row, index) => {
        row.style.backgroundColor = index % 2 === 0 ? lightColor : "#ffffff";
      });
    }

    const formInputs = document.querySelectorAll(
      "#recordForm input, #recordForm textarea"
    );
    formInputs.forEach((input) => {
      Object.assign(input.style, {
        fontWeight: styles.fontWeight,
        fontStyle: styles.fontStyle,
        textDecoration: styles.textDecoration,
        textAlign: styles.textAlign,
        fontSize: styles.fontSize + "px", // Corrected line
      });
    });
  },
  
  lightenColor(color, percent) {
    try {
      const ctx = document.createElement("canvas").getContext("2d");
      ctx.fillStyle = color;
      const rgb = ctx.fillStyle.match(/\d+/g)?.map(Number);

      if (!rgb) return color;

      return `rgba(${rgb
        .map((c) => {
          const lightened = c + (255 - c) * (percent / 100);
          return Math.min(255, Math.round(lightened));
        })
        .join(", ")}, 0.3)`;
    } catch (error) {
      console.error("Error lightening color:", error);
      return color;
    }
  },

  renderTable() {
    this.renderColumns();
    this.renderRecords();
    this.reapplyCellStyles();
  },

  initializeTableInteractions() {
    if (this.initialized) return;
    this.reapplyCellStyles();
    this.initialized = true;
  },

  cleanup() {
    document.removeEventListener("mousemove", this.handleResize.bind(this));
    document.removeEventListener("mouseup", this.stopResize.bind(this));
    document.removeEventListener("click", this.hideContextMenu.bind(this));

    const modal = document.getElementById("renameColumnCustomModal");
    if (modal) {
      modal.remove();
    }
ColumnDragHandler.cleanup();
    this.initialized = false;
    this.columnFilters = {};
    this.dragState = {
      isDragging: false,
      draggedColumn: null,
      placeholder: null,
      startIndex: -1,
    };
  },
};

window.addEventListener("unload", () => {
  try {
    TableManager.cleanup();
  } catch (error) {
    console.error("Error during cleanup:", error);
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await TableManager.initialize();

  } catch (error) {
    console.error("Error in TableManager initialization:", error);
  }
});

export default TableManager;
