// formManager.js
import { TableRenderManager } from './tableRenderManager.js';
import { AppState } from "./appState.js";
import { UI } from "./ui.js";
import { RecordManager } from "./recordManager.js";
import { ErrorManager } from "./errorManager.js";
import { TableInteractions } from './tableInteractions.js';
import { applyStyleToCells, initializeToolbar, getToolbarState } from './toolbar.js';
import addFormColorPickers from './formColorPickers.js';
import { TableManager } from './tableManager.js'
import { Notifications } from './notifications.js';

const initializeFormStyles = () => {
    const styles = `
    .symphytum-nav-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-md);
      background-color: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
      gap: var(--spacing-lg);
    }

    .symphytum-record-counter {
      font-size: 25px;
      font-weight: bold;
      color: var(--text-primary);
      padding: 8px 16px;
      background-color: var(--bg-primary);
      border-radius: 4px;
      box-shadow: var(--shadow-sm);
    }

    .symphytum-nav-buttons {
      display: flex;
      font-weight: bold;
      font-size: 25px;
      gap: 8px;
    }

    .form-content {
      padding: 20px;
      position: relative;
      height: calc(100vh - 180px);
      overflow-y: auto;
    }

.form-group {
    position: absolute;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-md);
    padding: var(--spacing-lg);
    min-width: 200px;
    min-height: 100px;
    box-shadow: var(--shadow-sm);
    transition: box-shadow 0.2s ease, transform 0.2s ease;
    user-select: none;
    touch-action: none;
}

    .form-group:hover {
      box-shadow: var(--shadow-md);
    }

.form-group.dragging {
    opacity: 0.9;
    box-shadow: var(--shadow-lg);
    cursor: move;
    z-index: 1000;
    pointer-events: none;
    transform: scale(1.02);
    transition: none;
}

.drag-handle {
    position: absolute;
    left: 8px;
    top: 50%;
    transform: translateY(-50%);
    cursor: move;
    padding: 4px;
    color: var(--text-secondary);
    opacity: 0.5;
    transition: opacity 0.2s ease;
}
.form-group:hover .drag-handle {
    opacity: 1;
}

    .resize-handle {
      position: absolute;
      right: 0;
      bottom: 0;
      width: 10px;
      height: 10px;
      cursor: se-resize;
      background-color: var(--border-color);
      border-radius: 0 0 var(--border-radius-md) 0;
    }

    .form-group.resizing {
      opacity: 0.9;
      box-shadow: var(--shadow-lg);
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .form-group input,
    .form-group textarea,
    .form-group select {
      width: 100%;
      padding: 8px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background-color: var(--bg-primary);
      color: var(--text-primary);
    }

    .form-group input:focus,
    .form-group textarea:focus,
    .form-group select:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.1);
    }

    .grid-control {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background: var(--bg-secondary);
      border-radius: 4px;
    }

    .grid-control input[type="number"] {
      width: 60px;
      padding: 4px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
    }

    .grid-control label {
      font-size: 14px;
      color: var(--text-secondary);
    }




    .image-input-container {
        width: 100%;
        display: flex;
        flex-direction: column;
    }

    .image-url-input {
        width: 100%;
        padding: 8px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        margin-bottom: 8px;
    }

    .image-preview {
        max-width: 100%;
        height: auto;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background-color: var(--bg-secondary);
        margin-top: 8px;
    }

    .form-group.image-field {
        height: auto;
        min-height: 200px;
    }
`;

  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
};
export const FormManager = {
  onRecordChange: null, 
    dragState: {
        isDragging: false,
        isResizing: false,
        currentField: null,
        initialX: 0,
        initialY: 0,
        offsetX: 0,
        offsetY: 0,
        scrollTop: 0,
        originalZIndex: 1,
        initialWidth: 0,
        initialHeight: 0,
    },

    displayCurrentRecord(options = {}) {
    const form = UI.elements.recordForm;
    if (!form) return;

    if (!AppState.records.length) {
        form.innerHTML = "<p>No records available.</p>";
        this.updateNavigationCounter(0, 0);
        return;
    }

    const record = AppState.records[AppState.currentRecordIndex];
    if (record) {
        form.innerHTML = '';
        this.loadRecordIntoForm(record);
        this.updateNavigationCounter(
            AppState.currentRecordIndex + 1,
            AppState.records.length
        );
        this.updateNavigationButtons();

        // Only call color callback if not silent
        if (this.onRecordChange && !options.silent) {
            this.onRecordChange();
        }
    }
},

    initialize() {
      initializeFormStyles();
        this.setupFormNavigation();
        this.attachEventListeners();
      this.applyFormStyles();
  
        addFormColorPickers();
   this.displayCurrentRecord();
// Apply any saved colors
    const bgColor = localStorage.getItem('formBgColor');
    const groupColor = localStorage.getItem('formLabelColor');
    const formContent = document.querySelector('.form-content');
    
    if (formContent && bgColor) {
        formContent.style.backgroundColor = bgColor;
    }
    
    if (groupColor) {
        document.querySelectorAll('.form-group').forEach(group => {
            group.style.backgroundColor = groupColor;
        });
    }
        const fontSelect = document.getElementById('symphytumFontSelect');
    if (fontSelect) {
        fontSelect.addEventListener('change', () => this.applyFormStyles());
    }

},

    switchView(view) {
        if (view === 'table') {
            TableRenderManager.renderRecords();
        } else {
            this.displayCurrentRecord();
        }
        
        // Update view visibility
        if (UI.elements.tableView) {
            UI.elements.tableView.style.display = view === 'table' ? 'block' : 'none';
        }
        if (UI.elements.formView) {
            UI.elements.formView.style.display = view === 'table' ? 'none' : 'block';
        }
    },
  
attachEventListeners() {
    // Global mouse event listeners
    document.addEventListener("mousemove", this.handleMouseMove.bind(this));
    document.addEventListener("mouseup", this.handleMouseUp.bind(this));

    // Form submission handler
    const form = UI.elements.recordForm;
    if (form) {
      form.addEventListener("submit", (e) => this.handleSubmit(e));
    }

    // Grid controls handlers
    const snapCheckbox = document.getElementById("snapToGrid");
    const gridSizeInput = document.getElementById("gridSize");

    if (snapCheckbox) {
      snapCheckbox.addEventListener("change", (e) => {
        localStorage.setItem("snapToGrid", e.target.checked);
        if (e.target.checked && gridSizeInput) {
          this.snapAllFieldsToGrid(parseInt(gridSizeInput.value));
        }
      });
    }

    if (gridSizeInput) {
      gridSizeInput.addEventListener("change", (e) => {
        const size = parseInt(e.target.value);
        localStorage.setItem("gridSize", size);
        if (snapCheckbox?.checked) {
          this.snapAllFieldsToGrid(size);
        }
      });
    }

    // Keyboard navigation
    document.addEventListener("keydown", (e) => this.handleKeyboardNavigation(e));
  },

handleKeyboardNavigation(e) {
    if (
      document.activeElement.tagName === "INPUT" ||
      document.activeElement.tagName === "TEXTAREA"
    ) {
      return;
    }

    if (e.key === "ArrowLeft") {
      this.navigateRecord(-1);
    } else if (e.key === "ArrowRight") {
      this.navigateRecord(1);
    }
  },

attachFormFieldListeners(formGroup) {
    const dragHandle = formGroup.querySelector(".drag-handle");
    const resizeHandle = formGroup.querySelector(".resize-handle");

    if (dragHandle) {
      dragHandle.addEventListener("mousedown", (e) =>
        this.startDragging(e, formGroup)
      );
      dragHandle.addEventListener("touchstart", (e) =>
        this.startDragging(e, formGroup)
      );
    }

    if (resizeHandle) {
      resizeHandle.addEventListener("mousedown", (e) =>
        this.startResizing(e, formGroup)
      );
      resizeHandle.addEventListener("touchstart", (e) =>
        this.startResizing(e, formGroup)
      );
    }

    formGroup.setAttribute("tabindex", "0");

    formGroup.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const input = formGroup.querySelector("input, textarea, select");
        if (input) input.focus();
      }
    });
  },
  
attachNavigationEventListeners(navContainer) {
    // Grid controls
    const snapCheckbox = navContainer.querySelector("#snapToGrid");
    const gridSizeInput = navContainer.querySelector("#gridSize");

    if (snapCheckbox) {
        snapCheckbox.addEventListener("change", (e) => {
            localStorage.setItem("snapToGrid", e.target.checked);
            if (e.target.checked && gridSizeInput) {
                this.snapAllFieldsToGrid(parseInt(gridSizeInput.value));
            }
        });
    }

    if (gridSizeInput) {
        gridSizeInput.addEventListener("change", (e) => {
            const size = parseInt(e.target.value);
            localStorage.setItem("gridSize", size);
            if (snapCheckbox?.checked) {
                this.snapAllFieldsToGrid(size);
            }
        });
    }

    // Navigation and action buttons
    const saveBtn = navContainer.querySelector(".symphytum-save-btn");
    if (saveBtn) {
        saveBtn.addEventListener("click", (e) => {
            e.preventDefault();
            this.handleSubmit(new Event("submit"));
        });
    }

    navContainer.querySelector("#prevRecordBtn")?.addEventListener("click", () => this.navigateRecord(-1));
    navContainer.querySelector("#nextRecordBtn")?.addEventListener("click", () => this.navigateRecord(1));
    
    // Reset layout button
    navContainer.querySelector("#resetLayoutBtn")?.addEventListener("click", () => {
        if (confirm("Are you sure you want to reset the form layout?")) {
            this.resetFormLayout();
        }
    });
},
applyRowHeight() {
    const formHeight = TableManager.rowHeight;
    const forms = document.querySelectorAll('.form-group');
    
    forms.forEach(form => {
        // Adjust input and label sizes based on row height
        const inputs = form.querySelectorAll('input, select, textarea');
        const labels = form.querySelectorAll('label');
        
        inputs.forEach(input => {
            if (input.tagName.toLowerCase() === 'textarea') {
                input.style.height = `${formHeight * 2}px`; // Make textareas taller
            } else {
                input.style.height = `${formHeight}px`;
            }
            
            // Adjust padding proportionally
            const padding = Math.max(4, Math.floor(formHeight * 0.1));
            input.style.padding = `${padding}px`;
        });
        
        labels.forEach(label => {
            label.style.marginBottom = `${Math.max(4, Math.floor(formHeight * 0.1))}px`;
        });
    });
},
setupGridControls(navContainer) {
    const gridControl = document.createElement("div");
    gridControl.className = "grid-control";

    const snapLabel = document.createElement("label");
    snapLabel.textContent = "Snap to Grid:";
    snapLabel.htmlFor = "snapToGrid";

    const snapCheckbox = document.createElement("input");
    snapCheckbox.type = "checkbox";
    snapCheckbox.id = "snapToGrid";
    snapCheckbox.checked = localStorage.getItem("snapToGrid") === "true";

    const gridSizeInput = document.createElement("input");
    gridSizeInput.type = "number";
    gridSizeInput.id = "gridSize";
    gridSizeInput.value = localStorage.getItem("gridSize") || "20";
    gridSizeInput.min = "5";
    gridSizeInput.max = "50";
    gridSizeInput.step = "5";

    const pxLabel = document.createElement("span");
    pxLabel.textContent = "px";

    gridControl.append(snapLabel, snapCheckbox, gridSizeInput, pxLabel);
    navContainer.appendChild(gridControl);
},

setupFormNavigation() {
    const formView = UI.elements.formView;
    if (!formView) return;

    let navContainer = formView.querySelector(".form-navigation");
    if (!navContainer) {
        navContainer = document.createElement("div");
        navContainer.className = "form-navigation symphytum-nav-container";
    } else {
        navContainer.innerHTML = "";
    }

    // Style for the navigation container
    navContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 8px 16px;
        background: var(--bg-secondary);
        border-bottom: 1px solid var(--border-color);
    `;


        // Create reset layout button
        const resetButton = document.createElement("button");
        resetButton.className = "button reset-layout-button symphytum-reset-btn";
        resetButton.id = "resetLayoutBtn";
        resetButton.textContent = "Reset Layout";

        // Create save button
        const saveButton = document.createElement("button");
        saveButton.className = "button button-primary symphytum-save-btn";
        saveButton.textContent = "Save";
        saveButton.onclick = (e) => {
            e.preventDefault();
            this.handleSubmit(e);
        };

        // Create counter
        const counter = document.createElement("div");
        counter.className = "record-counter symphytum-record-counter";
        counter.textContent = "No records";

        // Create navigation buttons container
        const buttonsContainer = document.createElement("div");
        buttonsContainer.className = "form-navigation-buttons symphytum-nav-buttons";

        // Create navigation buttons
        const prevButton = document.createElement("button");
        prevButton.className = "button symphytum-prev-btn";
        prevButton.id = "prevRecordBtn";
        prevButton.textContent = " ";

        const nextButton = document.createElement("button");
        nextButton.className = "button symphytum-next-btn";
        nextButton.id = "nextRecordBtn";
        nextButton.textContent = " ";

        // Add grid controls
        this.setupGridControls(navContainer);

        // Assemble the navigation bar
        buttonsContainer.append(prevButton, nextButton);
        navContainer.append(resetButton, saveButton, counter, buttonsContainer);

        // Insert at the beginning of form view
        formView.insertBefore(navContainer, formView.firstChild);

        // Attach event listeners
        this.attachNavigationEventListeners(navContainer);
  navContainer.append(resetButton, saveButton, counter, buttonsContainer);



    },

snapToGrid(value, gridSize) {
    return Math.round(value / gridSize) * gridSize;
},

snapAllFieldsToGrid(gridSize) {
    const formGroups = document.querySelectorAll(".form-group");
    formGroups.forEach((group) => {
        const left = parseInt(group.style.left);
        const top = parseInt(group.style.top);
        const width = parseInt(group.style.width);
        const height = parseInt(group.style.height);

        group.style.left = `${this.snapToGrid(left, gridSize)}px`;
        group.style.top = `${this.snapToGrid(top, gridSize)}px`;
        group.style.width = `${this.snapToGrid(width, gridSize)}px`;
        group.style.height = group.style.height
            ? `${this.snapToGrid(height, gridSize)}px`
            : "auto";

        this.saveDimensions(group);
    });
},

displayCurrentRecord() {
    const form = UI.elements.recordForm;
    if (!form) return;

    if (!AppState.records.length) {
        form.innerHTML = "<p>No records available.</p>";
        this.updateNavigationCounter(0, 0);
        return;
    }

    const record = AppState.records[AppState.currentRecordIndex];
    if (record) {
        form.innerHTML = '';
        this.loadRecordIntoForm(record);
        this.applyRowHeight();
        this.updateNavigationCounter(
            AppState.currentRecordIndex + 1,
            AppState.records.length
        );
        this.updateNavigationButtons();

        // Reapply colors after loading record
        if (this.onRecordChange) {
            this.onRecordChange();
        }
    }
},

updateNavigationButtons() {
    const prevButton = document.getElementById('prevRecordBtn');
    const nextButton = document.getElementById('nextRecordBtn');
    
    if (prevButton) {
        prevButton.disabled = AppState.currentRecordIndex <= 0;
    }
    if (nextButton) {
        nextButton.disabled = AppState.currentRecordIndex >= AppState.records.length - 1;
    }
},

navigateRecord(direction) {
    // Sync current form data before navigating
    this.syncFormWithAppState();
    
    const newIndex = AppState.currentRecordIndex + direction;
    if (newIndex >= 0 && newIndex < AppState.records.length) {
        AppState.currentRecordIndex = newIndex;
        this.displayCurrentRecord();
    }
},
  
loadRecordIntoForm(record) {
        const form = UI.elements.recordForm;
        if (!form) return;

        // Store current values before clearing
        const currentValues = {};
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (input.id) {
                currentValues[input.id] = input.value;
            }
        });

        const formContent = document.createElement("div");
        formContent.className = "form-content";

        const currentFontSize = localStorage.getItem("appFontSize") || "18";

        AppState.columns.forEach((column) => {
            if (!column.isRecordNumber) {
                const formGroup = this.createFormField(column, record, currentFontSize);

                // Restore any unsaved values
                const input = formGroup.querySelector('input, textarea, select');
                if (input && input.id && currentValues[input.id]) {
                    input.value = currentValues[input.id];
                }

                formContent.appendChild(formGroup);
            }
        });

        form.innerHTML = "";
        form.appendChild(formContent);
    },

syncFormWithAppState() {
    const record = AppState.records[AppState.currentRecordIndex];
    if (!record) return;

    const form = UI.elements.recordForm;
    if (!form) return;

    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        if (input.id) {
            record.data[input.id] = input.value || '';
        }
    });
},
  
createFormField(column, record, fontSize) {
        const formGroup = document.createElement("div");
        formGroup.className = "form-group";
        formGroup.setAttribute("data-field-id", column.id);
        formGroup.style.fontSize = `${fontSize}px`;

        // Set position from saved state or default
        const savedPosition = this.getSavedPosition(column.name);
        if (savedPosition) {
            Object.assign(formGroup.style, {
                left: savedPosition.left,
                top: savedPosition.top,
                width: savedPosition.width || "300px",
                zIndex: savedPosition.zIndex || "1",
            });
        } else {
            const index = AppState.columns.indexOf(column);
            Object.assign(formGroup.style, {
                left: `${(index % 3) * 320 + 20}px`,
                top: `${Math.floor(index / 3) * 150 + 20}px`,
                width: "300px",
                zIndex: (index + 1).toString(),
            });
        }

        // Create drag handle
        const dragHandle = document.createElement("div");
        dragHandle.className = "drag-handle";
        dragHandle.innerHTML = "⋮";
        dragHandle.style.fontSize = `${fontSize}px`;
        dragHandle.onmousedown = (e) => this.startDragging(e, formGroup);

        // Create label
        const label = document.createElement("label");
        label.textContent = column.name;
        label.setAttribute("for", column.id);
        label.style.fontSize = `${fontSize}px`;

        // Create field content
        const fieldContent = this.createInputElement(column, record, fontSize);

        // Create resize handle
        const resizeHandle = document.createElement("div");
        resizeHandle.className = "resize-handle";
        resizeHandle.onmousedown = (e) => this.startResizing(e, formGroup);

        // Handle image type specifically
        if (column.type === 'url' || column.name.toLowerCase().includes('image')) {
            formGroup.style.height = 'auto';
            formGroup.style.minHeight = '200px';
        }

        formGroup.append(dragHandle, label, fieldContent, resizeHandle);
        return formGroup;
    },

createInputElement(column, record, fontSize) {
    // Handle image URLs
    if (column.type === 'url' || column.name.toLowerCase().includes('image')) {
        const container = document.createElement("div");
        container.className = "image-input-container";

        // Create input wrapper div
        const inputWrapper = document.createElement("div");
        inputWrapper.style.display = "flex";
        inputWrapper.style.alignItems = "center";
        inputWrapper.style.gap = "8px";
        inputWrapper.style.marginBottom = "8px";

        // Create URL input
        const input = document.createElement("input");
        input.type = "text";
        input.id = column.id;
        input.name = column.id;
        input.className = "image-url-input";
        input.value = record.data[column.id] || "";
        input.style.fontSize = `${fontSize}px`;
        input.style.width = "100%";

        // Create URL button
        const urlButton = document.createElement("a");
        urlButton.href = input.value;
        urlButton.target = "_blank";
        urlButton.style.display = "flex";
        urlButton.style.alignItems = "center";
        urlButton.style.justifyContent = "center";
        urlButton.style.minWidth = "32px";
        urlButton.style.height = "32px";
        urlButton.style.padding = "4px";
        urlButton.style.cursor = "pointer";
        urlButton.style.flexShrink = "0";

        // Add icon image
        const icon = document.createElement("img");
        icon.src = "https://i.imgur.com/4jAj9EM.png";
        icon.alt = "Open URL";
        icon.style.width = "20px";
        icon.style.height = "20px";
        urlButton.appendChild(icon);

        // Update button visibility and href when input changes
        const updateUrlButton = () => {
            const url = input.value.trim();
            if (url) {
                urlButton.href = url;
                urlButton.style.display = "flex";
            } else {
                urlButton.style.display = "none";
            }
        };

        input.addEventListener("input", updateUrlButton);
        input.addEventListener("change", updateUrlButton);

        // Initial button state
        updateUrlButton();

        // Create image preview
        const preview = document.createElement("img");
        preview.className = "image-preview";
        preview.alt = "Image preview";
        preview.style.maxWidth = "100%";
        preview.style.height = "auto";
        preview.style.marginTop = "8px";
        preview.style.border = "1px solid var(--border-color)";
        preview.style.borderRadius = "4px";
        preview.style.display = "none";

        // Update preview on input change
        const updatePreview = () => {
            const url = input.value.trim();
            if (url) {
                if (url.includes('imgur.com')) {
                    const imgurMatch = url.match(/imgur\.com\/([a-zA-Z0-9]+)/i);
                    if (imgurMatch) {
                        preview.src = `https://i.imgur.com/${imgurMatch[1]}.png`;
                    } else {
                        preview.src = url;
                    }
                } else {
                    preview.src = url;
                }
                preview.style.display = "block";
            } else {
                preview.style.display = "none";
            }
        };

        input.addEventListener("input", updatePreview);
        updatePreview();

        // Assemble everything
        inputWrapper.appendChild(input);
        inputWrapper.appendChild(urlButton);
        container.appendChild(inputWrapper);
        container.appendChild(preview);
        return container;
    }

    // Handle other input types
    let input;
    switch (column.type) {
        case "textarea":
            input = document.createElement("textarea");
            input.rows = 4;
            break;
        case "select":
            input = document.createElement("select");
            break;
        default:
            input = document.createElement("input");
            input.type = column.type || "text";
    }

    input.id = column.id;
    input.name = column.id;
    input.value = record.data[column.id] || "";
    input.style.fontSize = `${fontSize}px`;

    const padding = Math.max(8, Math.floor(fontSize * 0.5));
    input.style.padding = `${padding}px`;

    return input;
},
  
// FormManager.js
startDragging(e, formGroup) {
    e.preventDefault();

    // Get initial positions including scroll offset
    const rect = formGroup.getBoundingClientRect();
    const container = formGroup.closest('.form-content');
    const scrollTop = container?.scrollTop || 0;

    // Calculate offset within the dragged element
    const mouseOffsetX = e.clientX - rect.left;
    const mouseOffsetY = e.clientY - rect.top;

    this.dragState = {
        isDragging: true,
        currentField: formGroup,
        mouseOffsetX,
        mouseOffsetY,
        scrollTop,
        originalZIndex: formGroup.style.zIndex
    };

    // Bring to front while dragging
    this.bringToFront(formGroup);
    formGroup.classList.add('dragging');

    // Handle dragging
    const handleDrag = (e) => {
        if (!this.dragState.isDragging) return;

        const container = this.dragState.currentField.closest('.form-content');
        if (!container) return;

        // Calculate new position based on mouse offset
        let newX = e.clientX - this.dragState.mouseOffsetX;
        let newY = e.clientY - this.dragState.mouseOffsetY + 
                   (container.scrollTop - this.dragState.scrollTop);

        // Apply grid snapping if enabled
        const snapToGrid = document.getElementById('snapToGrid')?.checked;
        if (snapToGrid) {
            const gridSize = parseInt(document.getElementById('gridSize')?.value || '20');
            newX = Math.round(newX / gridSize) * gridSize;
            newY = Math.round(newY / gridSize) * gridSize;
        }

        // Constrain to container bounds
        const containerRect = container.getBoundingClientRect();
        const fieldRect = this.dragState.currentField.getBoundingClientRect();
        
        newX = Math.max(0, Math.min(newX, containerRect.width - fieldRect.width));
        newY = Math.max(0, newY);

        // Apply new position
        this.dragState.currentField.style.left = `${newX}px`;
        this.dragState.currentField.style.top = `${newY}px`;
    };

    // Handle drag end
    const handleDragEnd = () => {
        if (!this.dragState.currentField) return;
        
        this.dragState.currentField.classList.remove('dragging');
        this.saveDimensions(this.dragState.currentField);
        
        // Reset drag state
        this.dragState = {
            isDragging: false,
            currentField: null,
            mouseOffsetX: 0,
            mouseOffsetY: 0,
            scrollTop: 0,
            originalZIndex: 1
        };

        // Remove event listeners
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', handleDragEnd);
    };

    // Add temporary event listeners
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
},

startResizing(e, formGroup) {
    e.preventDefault();

    const rect = formGroup.getBoundingClientRect();

    this.dragState = {
        isDragging: false,
        isResizing: true,
        currentField: formGroup,
        initialX: e.clientX,
        initialY: e.clientY,
        initialWidth: rect.width,
        initialHeight: rect.height,
    };

    formGroup.classList.add("resizing");
},

handleMouseMove(e) {
    if (this.dragState.isDragging) {
        this.handleDragging(e);
    } else if (this.dragState.isResizing) {
        this.handleResizing(e);
    }
},

handleDragging(e) {
    const { currentField, initialX, initialY, scrollTop } = this.dragState;
    if (!currentField) return;

    const container = currentField.closest(".form-content");
    if (!container) return;

    let newX = e.clientX - initialX;
    let newY = e.clientY - initialY + (container.scrollTop - scrollTop);

    // Apply grid snapping if enabled
    const snapToGrid = document.getElementById("snapToGrid")?.checked;
    if (snapToGrid) {
        const gridSize = parseInt(
            document.getElementById("gridSize")?.value || "20"
        );
        newX = this.snapToGrid(newX, gridSize);
        newY = this.snapToGrid(newY, gridSize);
    }

    // Constrain to container bounds
    const containerRect = container.getBoundingClientRect();
    const fieldRect = currentField.getBoundingClientRect();
    newX = Math.max(0, Math.min(newX, containerRect.width - fieldRect.width));
    newY = Math.max(0, newY);

    currentField.style.left = `${newX}px`;
    currentField.style.top = `${newY}px`;
},

handleResizing(e) {
    const { currentField, initialX, initialY, initialWidth, initialHeight } =
        this.dragState;
    if (!currentField) return;

    let newWidth = Math.max(200, initialWidth + (e.clientX - initialX));
    let newHeight = Math.max(100, initialHeight + (e.clientY - initialY));

    // Apply grid snapping if enabled
    const snapToGrid = document.getElementById("snapToGrid")?.checked;
    if (snapToGrid) {
        const gridSize = parseInt(
            document.getElementById("gridSize")?.value || "20"
        );
        newWidth = this.snapToGrid(newWidth, gridSize);
        newHeight = this.snapToGrid(newHeight, gridSize);
    }

    currentField.style.width = `${newWidth}px`;
    currentField.style.height = `${newHeight}px`;
},

handleMouseUp() {
    const field = this.dragState.currentField;
    if (field) {
        field.classList.remove("dragging", "resizing");
        this.saveDimensions(field);
    }

    this.dragState = {
        isDragging: false,
        isResizing: false,
        currentField: null,
        initialX: 0,
        initialY: 0,
        offsetX: 0,
        offsetY: 0,
        scrollTop: 0,
        originalZIndex: 1,
        initialWidth: 0,
        initialHeight: 0,
    };
},

bringToFront(element) {
    const formGroups = document.querySelectorAll(".form-group");
    let maxZ = Math.max(
        ...Array.from(formGroups).map((el) => parseInt(el.style.zIndex || "0"))
    );
    element.style.zIndex = (maxZ + 1).toString();
},

updateNavigationCounter(current, total) {
    const counter = document.querySelector(".symphytum-record-counter");
    if (counter) {
        counter.textContent = total > 0 ? `Record ${current}/${total}` : "No records";
    }
},

navigateRecord(direction) {
    // Sync current form data before navigating
    this.syncFormWithAppState();
    
    const newIndex = AppState.currentRecordIndex + direction;
    if (newIndex >= 0 && newIndex < AppState.records.length) {
        AppState.currentRecordIndex = newIndex;
        this.displayCurrentRecord();
    }
},
  
getSavedPosition(fieldName) {
    try {
        const saved = localStorage.getItem(`form-field-${fieldName}`);
        return saved ? JSON.parse(saved) : null;
    } catch (error) {
        console.error("Error getting saved position:", error);
        return null;
    }
},

saveDimensions(field) {
    if (!field) return;

    const fieldName = field.querySelector("label")?.textContent;
    if (fieldName) {
        const position = {
            left: field.style.left,
            top: field.style.top,
            width: field.style.width,
            height: field.style.height,
            zIndex: field.style.zIndex,
        };
        localStorage.setItem(`form-field-${fieldName}`, JSON.stringify(position));
    }
},

// FormManager.js
async handleSubmit(e) {
    if (e) e.preventDefault();

    const form = UI.elements.recordForm;
    if (!form) return;

    const data = {};
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        if (!input.id) return;
        data[input.id] = input.value || '';
    });

    const recordId = AppState.records[AppState.currentRecordIndex]?.id;
    if (!recordId) {
        ErrorManager.showError("No record selected", new Error("No record selected"));
        return;
    }

    try {
        UI.showLoadingSpinner();
        
        // Silent update - no notification from RecordManager
        await RecordManager.updateRecord(recordId, data, { silent: true });
        
        // Single notification from form submission
        Notifications.success('Record saved successfully');

        // Update form view silently
        await this.displayCurrentRecord({ silent: true });

    } catch (error) {
        ErrorManager.showError("Failed to update record", error);
    } finally {
        UI.hideLoadingSpinner();
    }
},

resetFormLayout() {
    try {
        UI.showLoadingSpinner();

        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("form-field-")) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach((key) => localStorage.removeItem(key));

        const formGroups = document.querySelectorAll(".form-group");
        formGroups.forEach((group, index) => {
            const column = index % 3;
            const row = Math.floor(index / 3);

            Object.assign(group.style, {
                position: "absolute",
                left: `${column * 320 + 20}px`,
                top: `${row * 150 + 20}px`,
                width: "300px",
                height: "auto",
                zIndex: "1",
            });

            const fieldName = group.querySelector("label")?.textContent;
            if (fieldName) {
                const defaultPosition = {
                    left: group.style.left,
                    top: group.style.top,
                    width: group.style.width,
                    height: group.style.height,
                    zIndex: group.style.zIndex,
                };
                localStorage.setItem(
                    `form-field-${fieldName}`,
                    JSON.stringify(defaultPosition)
                );
            }
        });

        const record = AppState.records[AppState.currentRecordIndex];
        if (record) {
            this.loadRecordIntoForm(record);
        }
    } catch (error) {
        console.error("Error resetting form layout:", error);
        alert("Failed to reset form layout. Please try again.");
    } finally {
        UI.hideLoadingSpinner();
    }
},
  
applyFormStyles() {
    const currentFont = localStorage.getItem('symphytumTableFont') || 'Noto Sans';
    const currentSize = localStorage.getItem('appFontSize') || '14';
    
    // Apply to form container
    const formView = document.getElementById('formView');
    if (formView) {
        formView.style.fontFamily = currentFont;
    }

    // Apply to all form elements
    const formElements = document.querySelectorAll('#recordForm input, #recordForm textarea, #recordForm select, .form-group, .form-group label');
    formElements.forEach(element => {
        element.style.fontFamily = currentFont;
        element.style.fontSize = `${currentSize}px`;
        
        // Adjust padding based on font size
        if (element.tagName !== 'LABEL') {
            const padding = Math.max(8, Math.floor(parseInt(currentSize) * 0.5));
            element.style.padding = `${padding}px`;
        }
    });
},

reapplyInputStyles() {
        const currentFontSize = localStorage.getItem("appFontSize") || "14";
        const fontWeight = localStorage.getItem("db4sql-fontWeight") || "normal";
        const fontStyle = localStorage.getItem("db4sql-fontStyle") || "normal";
        const textDecoration = localStorage.getItem("db4sql-textDecoration") || "none";
        const textAlign = localStorage.getItem("db4sql-textAlign") || "left";
        const backgroundColor = localStorage.getItem("db4sql-backgroundColor") || "";

        const formInputs = document.querySelectorAll(
            "#recordForm input, #recordForm textarea, #recordForm select"
        );
        formInputs.forEach((input) => {
            input.style.fontSize = `${currentFontSize}px`;
            input.style.padding = `${Math.max(8, Math.floor(currentFontSize * 0.5))}px`;
            input.style.fontWeight = fontWeight;
            input.style.fontStyle = fontStyle;
            input.style.textDecoration = textDecoration;
            input.style.textAlign = textAlign;
            input.style.backgroundColor = backgroundColor;
        });
    },
};

// Initialize form manager when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    if (UI.elements?.formView) {
        FormManager.initialize();
    }
});


// Export form view initialization function
export const initFormView = () => {
    if (UI.elements?.formView) {
        FormManager.initialize();
    }
};

export default FormManager;