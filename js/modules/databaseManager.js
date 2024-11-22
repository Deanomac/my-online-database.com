export const DatabaseManager = {
    db: null,
    dbName: "symphytumDB",
    dbVersion: 1,

    async init() {
        console.log('Initializing database...');
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = (event) => {
                console.error("Database error:", event.target.error);
                reject(event.target.error);
            };

            request.onupgradeneeded = (event) => {
                console.log('Database upgrade needed...');
                const db = event.target.result;
                
                // Create object stores if they don't exist
                if (!db.objectStoreNames.contains("tables")) {
                    const tableStore = db.createObjectStore("tables", { keyPath: "id", autoIncrement: true });
                    tableStore.createIndex("name", "name", { unique: false });
                    console.log('Created tables store');
                }

                if (!db.objectStoreNames.contains("columns")) {
                    const columnStore = db.createObjectStore("columns", { keyPath: "id", autoIncrement: true });
                    columnStore.createIndex("tableId", "tableId", { unique: false });
                    columnStore.createIndex("name", "name", { unique: false });
                    columnStore.createIndex("order", "order", { unique: false });
                    console.log('Created columns store');
                }

                if (!db.objectStoreNames.contains("records")) {
                    const recordStore = db.createObjectStore("records", { keyPath: "id", autoIncrement: true });
                    recordStore.createIndex("tableId", "tableId", { unique: false });
                    console.log('Created records store');
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('Database initialized successfully');
                resolve(this.db);
            };
        });
    }
};