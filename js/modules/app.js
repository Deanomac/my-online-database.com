// app.js
import { DatabaseManager } from "./databaseManager.js";
import { UI } from "./ui.js";
import { TableManager } from "./tableManager.js";
import { FormManager } from "./formManager.js";
import { SettingsManager } from './settingsManager.js';
import { Notifications } from './notifications.js';
import { initializeDeleteButtons } from "./toggleDeleteButtons.js";
import { initializeHeaderEditor } from './headerEditor.js';
import { ExportManager } from './exportManager.js';


class App {
    static async initialize() {
        try {
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", async () => {
                    await this.initializeApp();
                });
            } else {
                await this.initializeApp();
            }
        } catch (error) {
            console.error("Error initializing application:", error);
            alert("Error initializing application. Please refresh the page.");
        }
    }

    static async initializeApp() {
        try {
            console.log('Initializing application...');
            
            // Initialize database first
            await DatabaseManager.init();
            console.log('Database initialized');

            // Initialize UI components
            await UI.initialize();
            console.log('UI initialized');

            // Initialize table components
            await TableManager.initialize();
            console.log('Table manager initialized');

            // Initialize delete buttons
            await initializeDeleteButtons();
            console.log('Delete buttons initialized');

            // Initialize other components
            SettingsManager.init();
            FormManager.initialize();
            
            // Initialize search functionality
            this.initializeSearch();
            console.log('Search initialized');
            
            await TableManager.loadTables();
            
            TableManager.switchView('table');
            
            console.log('Application initialized successfully');
        } catch (error) {
            console.error("Error in initializeApp:", error);
            Notifications.error("Failed to initialize application: " + error.message);
        }
    }

    static initializeSearch() {
        const searchInput = document.getElementById("searchInput");
        if (!searchInput) return;

        // Clear search on escape
        searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                searchInput.value = "";
                TableManager.renderRecords();
            }
        });

        // Debounced search
        let searchTimeout;
        searchInput.addEventListener("input", () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                TableManager.renderRecords();
            }, 300);
        });

        // Add global keyboard shortcut for search
        document.addEventListener("keydown", (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "f") {
                e.preventDefault();
                searchInput.focus();
            }
        });
    }
}
document.addEventListener('DOMContentLoaded', () => {
    initializeHeaderEditor();
      ExportManager.init();

});
 App.initialize().catch((error) => {
    console.error("Critical application error:", error);
 });


export default App;