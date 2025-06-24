const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
// Import the initialize function from your new db.js module
const { initialize } = require('./db'); 

let dbInstance; // To hold the database instance for closing it later

function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
    // win.webContents.openDevTools(); // Uncomment for debugging
}

app.whenReady().then(() => {
    try {
        // Initialize the database and register IPC handlers from db.js
        dbInstance = initialize(__dirname, ipcMain); 
        console.log('main.js: Database module initialized successfully.');
        createWindow();
    } catch (error) {
        console.error('main.js: Application failed to start due to database initialization error:', error);
        app.quit(); // Quit the app if database fails to initialize
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // Close the database connection when the app is closing
        if (dbInstance) {
            dbInstance.close();
            console.log('main.js: Database connection closed.');
        }
        app.quit();
    }
});