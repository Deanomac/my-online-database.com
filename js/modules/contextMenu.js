import { AppState } from "./appState.js";
import { TableManager } from "./tableManager.js";
import { ColumnManager } from "./columnManager.js";

export const ContextMenu = {
  currentMenu: null,

  init() {
    this.cleanup();

    const table = document.getElementById("dataTable");
    if (!table) return;

    table.addEventListener("contextmenu", (e) => {
      const th = e.target.closest("th");
      if (!th || !th.dataset.columnId) return;

      e.preventDefault();
      e.stopPropagation();

      this.removeExistingMenus();

      this.showColumnMenu(e.pageX, e.pageY, parseInt(th.dataset.columnId));
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".header-context-menu")) {
        this.removeExistingMenus();
      }
    });

    document.addEventListener("contextmenu", (e) => {
      if (e.target.closest(".header-context-menu")) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  },
  showColumnMenu(x, y, columnId) {
    this.removeExistingMenus();

    const menu = document.createElement("div");
    menu.className = "header-context-menu";

    this.currentMenu = menu;

    menu.innerHTML = `
               <button class="menu-item" data-action="rename">Rename Column</button>
               <button class="menu-item" data-action="hide">Hide Column</button>
               <button class="menu-item" data-action="delete">Delete Column</button>
           `;

    menu.style.position = "fixed";
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.zIndex = "9999";

    document.body.appendChild(menu);
    const rect = menu.getBoundingClientRect();

    if (rect.right > window.innerWidth) {
      menu.style.left = `${window.innerWidth - rect.width - 5}px`;
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = `${window.innerHeight - rect.height - 5}px`;
    }

    menu.addEventListener("mousedown", async (e) => {
      e.stopPropagation();
      const action = e.target.dataset.action;
      if (!action) return;

      try {
        switch (action) {
          case "rename":
            this.removeExistingMenus();
            await TableManager.promptRenameColumn(columnId);
            break;
          case "hide":
            this.removeExistingMenus();
            let hiddenColumns = JSON.parse(
              localStorage.getItem("hiddenColumns") || "[]"
            );
            hiddenColumns.push(columnId);
            localStorage.setItem(
              "hiddenColumns",
              JSON.stringify(hiddenColumns)
            );
            await TableManager.renderTable();
            break;
          case "delete":
            this.removeExistingMenus();
            const column = AppState.columns.find((col) => col.id === columnId);
            if (
              column &&
              confirm(
                `Are you sure you want to delete column "${column.name}"?`
              )
            ) {
              await ColumnManager.deleteColumn(columnId);
              await TableManager.loadTableData();
            }
            break;
        }
      } catch (error) {
        console.error("Context menu action failed:", error);
        alert("Operation failed: " + error.message);
      }
    });
  },

  removeExistingMenus() {
    if (this.currentMenu && this.currentMenu.parentNode) {
      this.currentMenu.parentNode.removeChild(this.currentMenu);
    }
    this.currentMenu = null;

    document
      .querySelectorAll(".header-context-menu")
      .forEach((menu) => menu.remove());
  },

  cleanup() {
    this.removeExistingMenus();
    const table = document.getElementById("dataTable");
    if (table) {
      const newTable = table.cloneNode(true);
      table.parentNode.replaceChild(newTable, table);
    }
  },
};

const style = document.createElement("style");
style.textContent = `
    .header-context-menu {
        min-width: 150px;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        box-shadow: var(--shadow-lg);
        padding: 4px;
        user-select: none;
    }

    .header-context-menu .menu-item {
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

    .header-context-menu .menu-item:hover {
        background-color: var(--row-hover);
    }

    .header-context-menu .menu-item:active {
        background-color: var(--primary-color);
        color: white;
    }
`;
document.head.appendChild(style);

export default ContextMenu;
