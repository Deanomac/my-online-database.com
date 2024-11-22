// ExportManager.js
import { AppState } from "./appState.js";
import { UI } from "./ui.js";
import { Notifications } from "./notifications.js";

export const ExportManager = {
  initialized: false,

  init() {
    if (this.initialized) return;
    try {
      this.validateSetup();
      this.removeExistingButtons();
      this.initializeExportButton();
      this.addStyles();
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize ExportManager:", error);
      Notifications?.error?.("Failed to initialize export functionality");
    }
  },
  // Add this method to sanitize filenames
  sanitizeFilename(filename) {
    return filename.replace(/[^a-z0-9.-]/gi, "_");
  },

  // Add this method for data validation
  validateData(data) {
    if (!data?.columns?.length) {
      throw new Error("No columns found in export data");
    }
    if (!data?.records?.length) {
      throw new Error("No records found in export data");
    }
    // Validate data structure
    const invalidRecords = data.records.filter(
      (record) => !record?.data || typeof record.data !== "object"
    );
    if (invalidRecords.length) {
      throw new Error("Invalid record data structure found");
    }
  },

  removeExistingButtons() {
    document.querySelectorAll(".export-button").forEach((btn) => btn.remove());
  },

  initializeExportButton() {
    const toolbar = document.querySelector(".toolbar");
    const searchContainer = document.querySelector(".search-container");
    if (!toolbar) return;

    const exportButton = this.createExportButton();

    if (searchContainer) {
      toolbar.insertBefore(exportButton, searchContainer);
    } else {
      toolbar.appendChild(exportButton);
    }

    exportButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showExportMenu(exportButton.getBoundingClientRect());
    });
  },

  createExportButton() {
    const button = document.createElement("button");
    button.className = "button export-button";
    button.innerHTML = `
            <span class="button-content">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export
            </span>
        `;
    return button;
  },

  addStyles() {
    const style = document.createElement("style");
    style.textContent = `
            .export-menu {
                position: absolute;
                background: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius-md);
                box-shadow: var(--shadow-lg);
                min-width: 200px;
                z-index: 1000;
                padding: 8px 0;
                opacity: 0;
                transform: scale(0.95);
                transition: opacity 0.2s ease, transform 0.2s ease;
            }

            .export-menu.active {
                opacity: 1;
                transform: scale(1);
            }

            .export-menu-item {
                display: flex;
                align-items: center;
                padding: 8px 16px;
                cursor: pointer;
                color: var(--text-primary);
                transition: background-color 0.2s;
            }

            .export-menu-item:hover {
                background-color: var(--row-hover);
            }

            .export-menu-item:active {
                background-color: var(--primary-color);
                color: white;
            }
        `;
    document.head.appendChild(style);
  },

  showExportMenu(rect) {
    this.removeExistingMenus();

    const menu = document.createElement("div");
    menu.className = "export-menu";

    const formats = [
      { label: "Export as CSV", format: "csv" },
      { label: "Export as JSON", format: "json" },
      { label: "Export as HTML", format: "html" },
    ];

    formats.forEach(({ label, format }) => {
      const item = document.createElement("div");
      item.className = "export-menu-item";
      item.textContent = label;
      item.addEventListener("click", () => this.handleExport(format));
      menu.appendChild(item);
    });

    this.positionMenu(menu, rect);
    this.attachMenuListeners(menu);
  },

  validateSetup() {
    if (!AppState?.columns || !AppState?.records) {
      throw new Error("AppState not properly initialized");
    }
    if (!UI?.showLoadingSpinner || !UI?.hideLoadingSpinner) {
      throw new Error("UI utilities not properly initialized");
    }
    if (!Notifications?.success || !Notifications?.error) {
      throw new Error("Notifications not properly initialized");
    }
  },

  removeExistingMenus() {
    document.querySelectorAll(".export-menu").forEach((menu) => menu.remove());
  },

  positionMenu(menu, rect) {
    document.body.appendChild(menu);
    menu.style.left = `${rect.left}px`;
    menu.style.top = `${rect.bottom + 5}px`;

    requestAnimationFrame(() => {
      const menuRect = menu.getBoundingClientRect();
      if (menuRect.right > window.innerWidth) {
        menu.style.left = `${window.innerWidth - menuRect.width - 10}px`;
      }
      if (menuRect.bottom > window.innerHeight) {
        menu.style.top = `${rect.top - menuRect.height - 5}px`;
      }
      menu.classList.add("active");
    });
  },

  attachMenuListeners(menu) {
    const handleClickOutside = (e) => {
      if (!menu.contains(e.target)) {
        menu.classList.remove("active");
        setTimeout(() => menu.remove(), 200);
        document.removeEventListener("click", handleClickOutside);
      }
    };
    setTimeout(() => document.addEventListener("click", handleClickOutside), 0);
  },

  async handleExport(format) {
    try {
      UI.showLoadingSpinner();
      const data = this.gatherExportData();

      this.validateData(data);

      const timestamp = new Date()
        .toISOString()
        .replace(/[:]/g, "-")
        .slice(0, -5);
      let filename;

      switch (format.toLowerCase()) {
        case "csv":
          filename = this.sanitizeFilename(`export_${timestamp}.csv`);
          await this.exportCSV(data, filename);
          break;
        case "json":
          filename = this.sanitizeFilename(`export_${timestamp}.json`);
          await this.exportJSON(data, filename);
          break;
        case "html":
          filename = this.sanitizeFilename(`export_${timestamp}.html`);
          await this.exportHTML(data, filename);
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      Notifications.success(`Export completed successfully: ${filename}`);
    } catch (error) {
      console.error("Export failed:", error);
      Notifications.error(`Export failed: ${error.message}`);
    } finally {
      UI.hideLoadingSpinner();
      this.removeExistingMenus();
    }
  },

  gatherExportData() {
    const hiddenColumns = JSON.parse(
      localStorage.getItem("hiddenColumns") || "[]"
    );

    const visibleColumns = AppState.columns.filter((col) => {
      if (!col?.id || !col?.name) {
        console.warn("Invalid column structure found:", col);
        return false;
      }
      return !hiddenColumns.includes(col.id);
    });

    if (!visibleColumns.length) {
      throw new Error("No visible columns to export");
    }

    const records = AppState.records.filter(
      (record) => record && typeof record.data === "object"
    );

    return { columns: visibleColumns, records };
  },

  exportCSV(data) {
    const csv = this.convertToCSV(data);
    this.downloadFile(csv, "table_export.csv", "text/csv");
  },

  exportJSON(data) {
    const jsonData = this.convertToJSON(data);
    this.downloadFile(
      JSON.stringify(jsonData, null, 2),
      "table_export.json",
      "application/json"
    );
  },

  exportHTML(data) {
    const html = this.convertToHTML(data);
    this.downloadFile(html, "table_export.html", "text/html");
  },

  convertToCSV(data) {
    const headers = data.columns
      .map((col) => `"${col.name.replace(/"/g, '""')}"`)
      .join(",");

    const rows = data.records.map((record) =>
      data.columns
        .map((col) => {
          const value = record.data[col.id] || "";
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(",")
    );

    return [headers, ...rows].join("\n");
  },

  convertToJSON(data) {
    return data.records.map((record) => {
      const row = {};
      data.columns.forEach((col) => {
        row[col.name] = record.data[col.id] || "";
      });
      return row;
    });
  },

  convertToHTML(data) {
    const headers = data.columns
      .map((col) => `<th>${this.escapeHTML(col.name)}</th>`)
      .join("");

    const rows = data.records
      .map((record) => {
        const cells = data.columns
          .map(
            (col) => `<td>${this.escapeHTML(record.data[col.id] || "")}</td>`
          )
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");

    return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Table Export</title>
                <style>
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f5f5f5; }
                </style>
            </head>
            <body>
                <table>
                    <thead><tr>${headers}</tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </body>
            </html>
        `;
  },

  escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
  },

  downloadFile(content, filename, type) {
    let url;
    try {
      const blob = new Blob([content], { type });
      url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      throw new Error(`Failed to download file: ${error.message}`);
    } finally {
      if (url) URL.revokeObjectURL(url);
    }
  },

  cleanup() {
    this.removeExistingButtons();
    this.removeExistingMenus();
    this.initialized = false;

    // Remove event listeners
    const exportButtons = document.querySelectorAll(".export-button");
    exportButtons.forEach((button) => {
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
    });
  },
};
// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => ExportManager.init());

export default ExportManager;
