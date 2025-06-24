// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getPlots: () => ipcRenderer.invoke('getPlots'),
    getPlotById: (id) => ipcRenderer.invoke('getPlotById', id),
    savePlot: (plot) => ipcRenderer.invoke('savePlot', plot),
    deletePlot: (id) => ipcRenderer.invoke('deletePlot', id),
    getLookupItems: (tableName) => ipcRenderer.invoke('db:get-all-lookup', tableName),
    getDevelopmentsByLocation: (locationId) => ipcRenderer.invoke('db:get-developments-by-location', locationId),
    getHouseModelsByBuilder: (builderId) => ipcRenderer.invoke('db:get-house-models-by-builder', builderId),
    addLookupItem: (tableName, itemName, parentId = null, roomsData = null, featuresData = null) => ipcRenderer.invoke('db:add-lookup-item', tableName, itemName, parentId, roomsData, featuresData),
    getBuildersByDevelopment: (developmentId) => ipcRenderer.invoke('db:get-builders-by-development', developmentId),
    addDevelopmentBuilderLink: (developmentId, builderId) => ipcRenderer.invoke('db:add-development-builder-link', developmentId, builderId),
    getHouseModelDetailsById: (houseModelId) => ipcRenderer.invoke('db:get-house-model-details-by-id', houseModelId),
    // NEW: Expose the handler for updating house model details
    updateHouseModelDetails: (houseModelId, roomsData, featuresData) => ipcRenderer.invoke('db:update-house-model-details', houseModelId, roomsData, featuresData)
});