// db.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db; // This will hold the database instance, scoped to this module

/**
 * Initializes the SQLite database and registers IPC handlers for database operations.
 * @param {string} appPath The __dirname from main.js to resolve paths correctly.
 * @param {object} ipcMain The ipcMain object from Electron to register handlers.
 * @returns {Database} The initialized better-sqlite3 database instance.
 * @throws {Error} If database initialization fails.
 */
function initialize(appPath, ipcMain) {
    const dataDir = path.join(appPath, 'data');
    const dbPath = path.join(dataDir, 'house-hunting.db');

    if (!fs.existsSync(dataDir)) {
        console.log(`db.js: Creating database directory: ${dataDir}`);
        fs.mkdirSync(dataDir, { recursive: true });
    }

    try {
        db = new Database(dbPath, { verbose: console.log });
        console.log('db.js: Database opened successfully at:', dbPath);

        db.exec(`
            CREATE TABLE IF NOT EXISTS locations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            );
            CREATE TABLE IF NOT EXISTS developments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                location_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS builders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            );
            CREATE TABLE IF NOT EXISTS house_models (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                builder_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                rooms_data TEXT,    -- NEW LOCATION FOR ROOMS DATA
                features_data TEXT, -- NEW LOCATION FOR FEATURES DATA
                FOREIGN KEY (builder_id) REFERENCES builders(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS development_builders (
                development_id INTEGER NOT NULL,
                builder_id INTEGER NOT NULL,
                PRIMARY KEY (development_id, builder_id),
                FOREIGN KEY (development_id) REFERENCES developments(id) ON DELETE CASCADE,
                FOREIGN KEY (builder_id) REFERENCES builders(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS HouseHuntingTracker (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                plot_number TEXT,
                entrance_facing TEXT,
                cost_known INTEGER,
                cost_value REAL,
                cost_range TEXT,
                stamp_duty TEXT,
                location_id INTEGER,
                development_id INTEGER,
                builder_id INTEGER,
                house_model_id INTEGER,
                FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
                FOREIGN KEY (development_id) REFERENCES developments(id) ON DELETE SET NULL,
                FOREIGN KEY (builder_id) REFERENCES builders(id) ON DELETE SET NULL,
                FOREIGN KEY (house_model_id) REFERENCES house_models(id) ON DELETE SET NULL,
                UNIQUE (plot_number, development_id)
            );
        `);
        console.log('db.js: Tables checked/created. Schema updated for house_models.');

        // --- Seed Initial Data ---
        const locationsCountRow = db.prepare("SELECT COUNT(*) AS count FROM locations;").get();
        if (locationsCountRow.count === 0) {
            console.log('db.js: Seeding initial data into lookup tables...');
            db.exec(`
                INSERT INTO locations (name) VALUES ('London'), ('Manchester'), ('Birmingham'), ('Leeds');
                INSERT INTO builders (name) VALUES ('Barratt Homes'), ('Taylor Wimpey'), ('Redrow'), ('Persimmon');
            `);
            const londonId = db.prepare("SELECT id FROM locations WHERE name = 'London';").get().id;
            const manchesterId = db.prepare("SELECT id FROM locations WHERE name = 'Manchester';").get().id;
            const barrattId = db.prepare("SELECT id FROM builders WHERE name = 'Barratt Homes';").get().id;
            const taylorWimpeyId = db.prepare("SELECT id FROM builders WHERE name = 'Taylor Wimpey';").get().id;
            const redrowId = db.prepare("SELECT id FROM builders WHERE name = 'Redrow';").get().id;
            const persimmonId = db.prepare("SELECT id FROM builders WHERE name = 'Persimmon';").get().id;

            db.exec(`
                INSERT INTO developments (location_id, name) VALUES
                    (${londonId}, 'Green Meadows'),
                    (${londonId}, 'City Views'),
                    (${manchesterId}, 'Riverside Heights'),
                    (${manchesterId}, 'The Orchards');
            `);
            const greenMeadowsId = db.prepare("SELECT id FROM developments WHERE name = 'Green Meadows';").get().id;
            const cityViewsId = db.prepare("SELECT id FROM developments WHERE name = 'City Views';").get().id;
            const riversideHeightsId = db.prepare("SELECT id FROM developments WHERE name = 'Riverside Heights';").get().id;
            const theOrchardsId = db.prepare("SELECT id FROM developments WHERE name = 'The Orchards';").get().id;

            // Define sample rooms and features for models
            const roseRooms = JSON.stringify([
                {name: "Kitchen", has_room: 1, size: "10x12ft"},
                {name: "Living Room", has_room: 1, size: "15x18ft"},
                {name: "Bedroom 1", has_room: 1, size: "12x14ft"},
                {name: "Ensuite 1", has_room: 1, size: "5x7ft"}
            ]);
            const roseFeatures = JSON.stringify([
                {name: "EV Charger", has_feature: 1},
                {name: "Turfed Garden", has_feature: 1}
            ]);

            const gosfordRooms = JSON.stringify([
                {name: "Kitchen/Dining", has_room: 1, size: "14x16ft"},
                {name: "Lounge", has_room: 1, size: "12x15ft"},
                {name: "Bedroom 1", has_room: 1, size: "11x13ft"},
                {name: "Bedroom 2", has_room: 1, size: "9x11ft"},
                {name: "Bathroom", has_room: 1, size: "7x7ft"}
            ]);
            const gosfordFeatures = JSON.stringify([
                {name: "Integrated Appliances", has_feature: 1},
                {name: "Fitted Wardrobes", has_feature: 0}
            ]);

            // UPDATED: house_models inserts now include rooms_data and features_data
            db.prepare(`
                INSERT INTO house_models (builder_id, name, rooms_data, features_data) VALUES
                (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?);
            `).run(
                barrattId, 'The Rose', roseRooms, roseFeatures,
                barrattId, 'The Cherry', null, null, // Example: Cherry might not have details yet
                taylorWimpeyId, 'The Gosford', gosfordRooms, gosfordFeatures,
                taylorWimpeyId, 'The Dadford', null, null,
                redrowId, 'The Cambridge', null, null,
                redrowId, 'The Oxford', null, null,
                persimmonId, 'The Rufford', null, null,
                persimmonId, 'The Hadleigh', null, null
            );

            // Seed initial development_builders relationships (Many-to-Many)
            db.prepare(`INSERT INTO development_builders (development_id, builder_id) VALUES (?, ?);`).run(greenMeadowsId, barrattId);
            db.prepare(`INSERT INTO development_builders (development_id, builder_id) VALUES (?, ?);`).run(cityViewsId, barrattId);
            db.prepare(`INSERT INTO development_builders (development_id, builder_id) VALUES (?, ?);`).run(riversideHeightsId, taylorWimpeyId);
            db.prepare(`INSERT INTO development_builders (development_id, builder_id) VALUES (?, ?);`).run(greenMeadowsId, taylorWimpeyId);
            db.prepare(`INSERT INTO development_builders (development_id, builder_id) VALUES (?, ?);`).run(theOrchardsId, redrowId);

            console.log('db.js: Initial lookup data seeded.');
        }

        const trackerCountRow = db.prepare("SELECT COUNT(*) AS count FROM HouseHuntingTracker;").get();
        if (trackerCountRow.count === 0) {
            console.log('db.js: Seeding initial plot data...');
            const plotALocationId = db.prepare("SELECT id FROM locations WHERE name = 'London';").get().id;
            const plotADevelopmentId = db.prepare("SELECT id FROM developments WHERE name = 'Green Meadows';").get().id;
            const plotABuilderId = db.prepare("SELECT id FROM builders WHERE name = 'Barratt Homes';").get().id;
            const plotAModelId = db.prepare("SELECT id FROM house_models WHERE name = 'The Rose';").get().id; // Get Rose Model ID

            const plotBLocationId = db.prepare("SELECT id FROM locations WHERE name = 'Manchester';").get().id;
            const plotBDevelopmentId = db.prepare("SELECT id FROM developments WHERE name = 'Riverside Heights';").get().id;
            const plotBBuilderId = db.prepare("SELECT id FROM builders WHERE name = 'Taylor Wimpey';").get().id;
            const plotBModelId = db.prepare("SELECT id FROM house_models WHERE name = 'The Gosford';").get().id; // Get Gosford Model ID


            db.prepare(`
                INSERT INTO HouseHuntingTracker (
                    plot_number, entrance_facing, cost_known, cost_value, cost_range, stamp_duty,
                    location_id, development_id, builder_id, house_model_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            `).run(
                'Plot 5', 'North', 1, 350000, null, '£7,500.00',
                plotALocationId, plotADevelopmentId, plotABuilderId, plotAModelId // Use The Rose model
            );

            db.prepare(`
                INSERT INTO HouseHuntingTracker (
                    plot_number, entrance_facing, cost_known, cost_value, cost_range, stamp_duty,
                    location_id, development_id, builder_id, house_model_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            `).run(
                'Plot 5', 'South East', 0, null, '280000 - 320000', '£5,000.00 - £7,500.00',
                plotBLocationId, plotBDevelopmentId, plotBBuilderId, plotBModelId // Use The Gosford model
            );
            console.log('db.js: Initial plot data seeded with two "Plot 5" entries in different developments, linked to house models.');
        }

    } catch (error) {
        console.error('db.js: Error initializing database:', error);
        throw error;
    }

    // --- Register IPC Handlers ---
    ipcMain.handle('getPlots', () => {
        return db.prepare(`
            SELECT 
                h.id, h.plot_number, h.entrance_facing, h.cost_known, h.cost_value, h.cost_range, h.stamp_duty,
                l.name AS location_name,
                d.name AS development_name,
                b.name AS builder_name,
                hm.name AS house_model_name,
                hm.rooms_data,     -- Fetch rooms_data from house_models
                hm.features_data   -- Fetch features_data from house_models
            FROM HouseHuntingTracker h
            LEFT JOIN locations l ON h.location_id = l.id
            LEFT JOIN developments d ON h.development_id = d.id
            LEFT JOIN builders b ON h.builder_id = b.id
            LEFT JOIN house_models hm ON h.house_model_id = hm.id
            ORDER BY h.plot_number
        `).all();
    });

    ipcMain.handle('getPlotById', (event, id) => {
        const parsedId = parseInt(id); // Ensure ID is integer
        console.log(`db.js: getPlotById - received id: ${id}, type: ${typeof id}, parsedId: ${parsedId}`);
        return db.prepare(`
            SELECT 
                h.id, h.plot_number, h.entrance_facing, h.cost_known, h.cost_value, h.cost_range, h.stamp_duty,
                h.location_id, l.name AS location_name,
                h.development_id, d.name AS development_name,
                h.builder_id, b.name AS builder_name,
                h.house_model_id, hm.name AS house_model_name,
                hm.rooms_data,     -- Fetch rooms_data from house_models
                hm.features_data   -- Fetch features_data from house_models
            FROM HouseHuntingTracker h
            LEFT JOIN locations l ON h.location_id = l.id
            LEFT JOIN developments d ON h.development_id = d.id
            LEFT JOIN builders b ON h.builder_id = b.id
            LEFT JOIN house_models hm ON h.house_model_id = hm.id
            WHERE h.id = ?
        `).get(parsedId);
    });

    ipcMain.handle('db:get-all-lookup', async (event, tableName) => {
        try {
            if (!['locations', 'developments', 'builders', 'house_models'].includes(tableName)) {
                throw new Error(`Invalid table name: ${tableName}`);
            }
            return db.prepare(`SELECT id, name FROM ${tableName} ORDER BY name`).all();
        } catch (error) {
            console.error(`db.js: Error getting all from ${tableName}:`, error);
            throw error;
        }
    });

    ipcMain.handle('db:get-developments-by-location', async (event, locationId) => {
        try {
            const idToQuery = parseInt(locationId);
            console.log(`db.js: get-developments-by-location - received locationId: ${locationId}, type: ${typeof locationId}, parsed: ${idToQuery}`);
            if (isNaN(idToQuery)) {
                console.warn(`db.js: Invalid locationId received: ${locationId}. Returning empty array.`);
                return [];
            }
            return db.prepare(`SELECT id, name FROM developments WHERE location_id = ? ORDER BY name`).all(idToQuery);
        } catch (error) {
            console.error(`db.js: Error getting developments for location ${locationId}:`, error);
            throw error;
        }
    });

    ipcMain.handle('db:get-house-models-by-builder', async (event, builderId) => {
        try {
            const idToQuery = parseInt(builderId);
            console.log(`db.js: get-house-models-by-builder - received builderId: ${builderId}, type: ${typeof builderId}, parsed: ${idToQuery}`);
            if (isNaN(idToQuery)) {
                console.warn(`db.js: Invalid builderId received: ${builderId}. Returning empty array.`);
                return [];
            }
            return db.prepare(`SELECT id, name FROM house_models WHERE builder_id = ? ORDER BY name`).all(idToQuery);
        } catch (error) {
            console.error(`db.js: Error getting house models for builder ${builderId}:`, error);
            throw error;
        }
    });

    ipcMain.handle('db:get-house-model-details-by-id', async (event, houseModelId) => {
        try {
            const idToQuery = parseInt(houseModelId);
            console.log(`db.js: get-house-model-details-by-id - received houseModelId: ${houseModelId}, type: ${typeof houseModelId}, parsed: ${idToQuery}`);
            if (isNaN(idToQuery)) {
                console.warn(`db.js: Invalid houseModelId received: ${houseModelId}. Returning null.`);
                return null;
            }
            return db.prepare(`SELECT id, name, rooms_data, features_data FROM house_models WHERE id = ?`).get(idToQuery);
        } catch (error) {
            console.error(`db.js: Error getting house model details for ID ${houseModelId}:`, error);
            throw error;
        }
    });

    // NEW IPC HANDLER: Update rooms_data and features_data for a specific house model
    ipcMain.handle('db:update-house-model-details', async (event, houseModelId, roomsData, featuresData) => {
        try {
            const idToUpdate = parseInt(houseModelId);
            console.log(`db.js: update-house-model-details - updating model ID: ${idToUpdate}`);
            if (isNaN(idToUpdate)) {
                throw new Error('Invalid House Model ID provided for update.');
            }
            db.prepare(`UPDATE house_models SET rooms_data = ?, features_data = ? WHERE id = ?`)
              .run(roomsData, featuresData, idToUpdate);
            return { success: true, message: 'House Model details updated successfully.' };
        } catch (error) {
            console.error(`db.js: Error updating house model details for ID ${houseModelId}:`, error);
            throw error;
        }
    });


    ipcMain.handle('db:get-builders-by-development', async (event, developmentId) => {
        try {
            if (!developmentId) {
                return [];
            }
            const idToQuery = parseInt(developmentId);
            console.log(`db.js: get-builders-by-development - received developmentId: ${developmentId}, type: ${typeof developmentId}, parsed: ${idToQuery}`);
            if (isNaN(idToQuery)) {
                console.warn(`db.js: Invalid developmentId received: ${developmentId}. Returning empty array.`);
                return [];
            }
            return db.prepare(`
                SELECT b.id, b.name 
                FROM builders b
                JOIN development_builders db_link ON b.id = db_link.builder_id
                WHERE db_link.development_id = ?
                ORDER BY b.name
            `).all(idToQuery);
        } catch (error) {
            console.error(`db.js: Error getting builders for development ${developmentId}:`, error);
            throw error;
        }
    });

    ipcMain.handle('db:add-development-builder-link', async (event, developmentId, builderId) => {
        try {
            const devId = parseInt(developmentId);
            const buildId = parseInt(builderId);
            console.log(`db.js: add-development-builder-link - devId: ${devId}, buildId: ${buildId}`);

            if (isNaN(devId) || isNaN(buildId)) {
                throw new Error('Invalid Development ID or Builder ID provided for linking.');
            }

            const existing = db.prepare(`SELECT 1 FROM development_builders WHERE development_id = ? AND builder_id = ?`).get(devId, buildId);
            if (existing) {
                throw new Error('This builder is already linked to this development.');
            }
            db.prepare(`INSERT INTO development_builders (development_id, builder_id) VALUES (?, ?)`).run(devId, buildId);
            return { success: true, message: 'Builder linked to development successfully.' };
        } catch (error) {
            console.error(`db.js: Error adding development-builder link:`, error);
            throw error;
        }
    });

    ipcMain.handle('db:add-lookup-item', async (event, tableName, itemName, parentId = null, roomsData = null, featuresData = null) => {
        try {
            if (!['locations', 'developments', 'builders', 'house_models'].includes(tableName)) {
                throw new Error(`Invalid table name for adding item: ${tableName}`);
            }
            
            let query = `SELECT id FROM ${tableName} WHERE name = ? COLLATE NOCASE`;
            let params = [itemName];
            let actualParentId = null; 

            if (tableName === 'developments' || tableName === 'house_models') {
                query += ` AND ${tableName === 'developments' ? 'location_id' : 'builder_id'} = ?`;
                actualParentId = parentId !== null && parentId !== '' ? parseInt(parentId) : null;
                params.push(actualParentId);
                if (isNaN(actualParentId) && (tableName === 'developments' || tableName === 'house_models')) {
                     throw new Error(`Invalid parent ID for ${tableName}: ${parentId}`);
                }
            }

            const existing = db.prepare(query).get(params);
            if (existing) {
                throw new Error(`${tableName.slice(0, -1)} '${itemName}' already exists.`);
            }

            let insertQuery;
            let insertParams;

            if (tableName === 'developments') {
                if (actualParentId === null) throw new Error('Development requires a parent Location ID.');
                insertQuery = `INSERT INTO developments (name, location_id) VALUES (?, ?)`;
                insertParams = [itemName, actualParentId];
            } else if (tableName === 'house_models') {
                if (actualParentId === null) throw new Error('House Model requires a parent Builder ID.');
                insertQuery = `INSERT INTO house_models (name, builder_id, rooms_data, features_data) VALUES (?, ?, ?, ?)`;
                insertParams = [itemName, actualParentId, roomsData, featuresData];
            } else { // This is for 'locations' and 'builders'
                insertQuery = `INSERT INTO ${tableName} (name) VALUES (?)`;
                insertParams = [itemName];
            }

            const info = db.prepare(insertQuery).run(...insertParams);
            return { success: true, message: `${itemName} added successfully.`, id: info.lastInsertRowid };
        } catch (error) {
            console.error(`db.js: Error adding new ${tableName.slice(0, -1)}:`, error);
            throw error;
        }
    });

    ipcMain.handle('savePlot', (event, plot) => {
        const { 
            id, plot_number, entrance_facing, cost_known, cost_value, cost_range, stamp_duty, 
            location_id, development_id, builder_id, house_model_id
        } = plot;

        const parsedLocationId = location_id !== null && location_id !== '' ? parseInt(location_id) : null;
        const parsedDevelopmentId = development_id !== null && development_id !== '' ? parseInt(development_id) : null;
        const parsedBuilderId = builder_id !== null && builder_id !== '' ? parseInt(builder_id) : null;
        const parsedHouseModelId = house_model_id !== null && house_model_id !== '' ? parseInt(house_model_id) : null;

        if (isNaN(parsedLocationId)) throw new Error('Invalid Location ID.');
        if (isNaN(parsedDevelopmentId)) throw new Error('Invalid Development ID.');
        if (isNaN(parsedBuilderId)) throw new Error('Invalid Builder ID.');
        if (isNaN(parsedHouseModelId)) throw new Error('Invalid House Model ID.');

        const params = [
            plot_number,
            entrance_facing,
            cost_known ? 1 : 0,
            cost_value,
            cost_range,
            stamp_duty,
            parsedLocationId,
            parsedDevelopmentId,
            parsedBuilderId,
            parsedHouseModelId
        ];

        try {
            if (id) {
                const parsedPlotId = parseInt(id);
                if (isNaN(parsedPlotId)) throw new Error('Invalid Plot ID for update.');
                console.log(`db.js: Updating plot ID ${parsedPlotId} with plot_number: ${plot_number}`);
                db.prepare(`
                    UPDATE HouseHuntingTracker SET 
                        plot_number = ?, entrance_facing = ?, cost_known = ?, cost_value = ?, cost_range = ?, stamp_duty = ?, 
                        location_id = ?, development_id = ?, builder_id = ?, house_model_id = ?
                    WHERE id = ?
                `).run(...params, parsedPlotId);
                return { success: true, message: 'Plot updated successfully.' };
            } else {
                const existing = db.prepare('SELECT id FROM HouseHuntingTracker WHERE plot_number = ? AND development_id = ?').get(plot_number, parsedDevelopmentId);
                if (existing) {
                    throw new Error(`Plot number '${plot_number}' already exists in the selected development.`);
                }
                console.log(`db.js: Inserting new plot with plot_number: ${plot_number}`);
                const info = db.prepare(`
                    INSERT INTO HouseHuntingTracker (
                        plot_number, entrance_facing, cost_known, cost_value, cost_range, stamp_duty, 
                        location_id, development_id, builder_id, house_model_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(...params);
                return { success: true, message: 'Plot saved successfully.', id: info.lastInsertRowid };
            }
        } catch (error) {
            console.error('db.js: Error in savePlot:', error);
            if (error.message && error.message.includes('SQLITE_CONSTRAINT: UNIQUE constraint failed')) {
                throw new Error(`A plot with number '${plot_number}' already exists in the selected development.`);
            }
            throw error;
        }
    });

    ipcMain.handle('deletePlot', (event, id) => {
        const parsedId = parseInt(id); // Ensure ID is integer
        if (isNaN(parsedId)) throw new Error('Invalid Plot ID for delete.');
        console.log(`db.js: Deleting plot ID ${parsedId}`);
        try {
            db.prepare('DELETE FROM HouseHuntingTracker WHERE id = ?').run(parsedId);
            return { success: true, message: 'Plot deleted successfully.' };
        } catch (error) {
            console.error(`db.js: Error deleting plot with ID ${parsedId}:`, error);
            throw error;
        }
    });

    return db;
}

module.exports = { initialize };
