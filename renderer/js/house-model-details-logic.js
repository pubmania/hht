// renderer/js/house-model-details-logic.js

import { showLoading, hideLoading } from './utils.js';

let houseModelDetailsModal;
let closeModelDetailsModalBtn;
let roomsContainer;
let featuresContainer;
let saveModelDetailsBtn;
let cancelModelDetailsBtn;
// 'addRoomBtn' and 'addFeatureBtn' are removed from HTML, so no need to reference them here.

let houseModelDetailsSectionButtons; 
let editModelDetailsBtn; 

let houseModelSummaryDisplay; 
let summaryRooms;             
let summaryFeatures;          

let currentHouseModelId = null; 
let currentRoomsJson = null;    
let currentFeaturesJson = null; 

// --- Predefined Lists ---
// These are the master lists of rooms and features available for selection.
const PREDEFINED_ROOMS = [
    { name: "Kitchen" },
    { name: "Living Room" },
    { name: "Dining Room" },
    { name: "Bedroom 1" },
    { name: "Bedroom 2" },
    { name: "Bedroom 3" },
    { name: "Bedroom 4" },
    { name: "Bathroom 1" },
    { name: "Bathroom 2" },
    { name: "En-suite" },
    { name: "WC" },
    { name: "Utility Room" },
    { name: "Hallway" },
    { name: "Landing" },
    { name: "Garage" },
    { name: "Study" },
    { name: "Conservatory" },
    { name: "Loft" }
];

const PREDEFINED_FEATURES = [
    { name: "EV Charger" },
    { name: "Turfed Garden" },
    { name: "Fitted Wardrobes" },
    { name: "Integrated Appliances" },
    { name: "Underfloor Heating" },
    { name: "Solar Panels" },
    { name: "Downlights" },
    { name: "Alarm System" },
    { name: "Fireplace" },
    { name: "South-facing Garden" },
    { name: "Side Access" }
];


// --- Module Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    // Retrieve DOM elements
    houseModelDetailsModal = document.getElementById('houseModelDetailsModal');
    closeModelDetailsModalBtn = document.getElementById('closeModelDetailsModalBtn');
    roomsContainer = document.getElementById('roomsContainer');
    featuresContainer = document.getElementById('featuresContainer');
    saveModelDetailsBtn = document.getElementById('saveModelDetailsBtn');
    cancelModelDetailsBtn = document.getElementById('cancelModelDetailsBtn');
    // 'addRoomBtn' and 'addFeatureBtn' no longer exist in HTML

    houseModelDetailsSectionButtons = document.getElementById('houseModelDetailsSectionButtons');
    editModelDetailsBtn = document.getElementById('editModelDetailsBtn');

    houseModelSummaryDisplay = document.getElementById('houseModelSummaryDisplay');
    summaryRooms = document.getElementById('summaryRooms');
    summaryFeatures = document.getElementById('summaryFeatures');

    // Attach event listeners for the modal
    if (closeModelDetailsModalBtn) {
        closeModelDetailsModalBtn.addEventListener('click', hideModal);
    }
    if (cancelModelDetailsBtn) {
        cancelModelDetailsBtn.addEventListener('click', hideModal);
    }
    if (saveModelDetailsBtn) {
        saveModelDetailsBtn.addEventListener('click', saveHouseModelDetails);
    }
    if (editModelDetailsBtn) {
        editModelDetailsBtn.addEventListener('click', () => {
            _openHouseModelDetailsModal(currentHouseModelId, currentRoomsJson, currentFeaturesJson);
        });
    }

    console.log('house-model-details-logic.js: DOMContentLoaded fired. Initializing module elements and listeners.');
    if (houseModelDetailsModal && roomsContainer && featuresContainer && saveModelDetailsBtn && editModelDetailsBtn && houseModelSummaryDisplay) {
        console.log('house-model-details-logic.js: All critical DOM elements for house model details found.');
    } else {
        console.warn('house-model-details-logic.js: Some critical DOM elements for house model details were not found. Check form.html and IDs.');
    }
});


// --- Private Helper Functions ---

/**
 * Opens the house model details modal and populates it with predefined lists.
 * @param {number|null} modelId The ID of the house model, or null for a new model being defined.
 * @param {string|null} roomsJson JSON string of existing rooms data, or null.
 * @param {string|null} featuresJson JSON string of existing features data, or null.
 * @private
 */
function _openHouseModelDetailsModal(modelId, roomsJson, featuresJson) {
    currentHouseModelId = modelId; 
    roomsContainer.innerHTML = ''; // Clear previous inputs
    featuresContainer.innerHTML = ''; // Clear previous inputs

    let existingRooms = [];
    let existingFeatures = [];

    try {
        if (roomsJson) existingRooms = JSON.parse(roomsJson);
        if (featuresJson) existingFeatures = JSON.parse(featuresJson);
    } catch (e) {
        console.error('house-model-details-logic.js: Error parsing existing rooms/features JSON:', e);
        // Fallback to empty arrays if parsing fails
        existingRooms = [];
        existingFeatures = [];
    }

    // Populate rooms container with predefined rooms and their saved states
    PREDEFINED_ROOMS.forEach(predefinedRoom => {
        const existingRoom = existingRooms.find(r => r.name === predefinedRoom.name);
        const hasRoom = existingRoom ? (existingRoom.has_room === 1) : false;
        const roomSize = existingRoom ? (existingRoom.size || '') : ''; // Ensure size is not null/undefined

        const roomDiv = document.createElement('div');
        roomDiv.className = 'grid-item room-item'; // Add a class for styling individual items
        roomDiv.innerHTML = `
            <label class="checkbox-container room-checkbox-label">
                <input type="checkbox" data-room-name="${predefinedRoom.name}" ${hasRoom ? 'checked' : ''} class="room-has-checkbox">
                <span class="checkmark"></span> ${predefinedRoom.name}
            </label>
            <input type="text" value="${roomSize}" placeholder="Size (e.g., 10x12ft)" 
                   class="room-size-input ${hasRoom ? '' : 'hidden'}">
        `;
        roomsContainer.appendChild(roomDiv);

        // Add event listener to toggle size input visibility
        const checkbox = roomDiv.querySelector('.room-has-checkbox');
        const sizeInput = roomDiv.querySelector('.room-size-input');
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                sizeInput.classList.remove('hidden');
            } else {
                sizeInput.classList.add('hidden');
                sizeInput.value = ''; // Clear size when unchecked
            }
        });
    });

    // Populate features container with predefined features and their saved states
    PREDEFINED_FEATURES.forEach(predefinedFeature => {
        const existingFeature = existingFeatures.find(f => f.name === predefinedFeature.name);
        const hasFeature = existingFeature ? (existingFeature.has_feature === 1) : false;

        const featureDiv = document.createElement('div');
        featureDiv.className = 'grid-item feature-item'; // Add a class for styling individual items
        featureDiv.innerHTML = `
            <label class="checkbox-container feature-checkbox-label">
                <input type="checkbox" data-feature-name="${predefinedFeature.name}" ${hasFeature ? 'checked' : ''} class="feature-has-checkbox">
                <span class="checkmark"></span> ${predefinedFeature.name}
            </label>
        `;
        featuresContainer.appendChild(featureDiv);
    });

    // Show the modal
    houseModelDetailsModal.classList.remove('hidden');
}

/**
 * Hides the house model details modal.
 */
function hideModal() {
    houseModelDetailsModal.classList.add('hidden');
}

/**
 * Gathers room and feature data from the modal's checkboxes and inputs.
 * @returns {object} An object containing rooms and features arrays, filtered by selected items.
 * @public
 */
export function getHouseModelDetailsData() {
    const rooms = [];
    roomsContainer.querySelectorAll('.room-item').forEach(roomItemDiv => {
        const checkbox = roomItemDiv.querySelector('.room-has-checkbox');
        const sizeInput = roomItemDiv.querySelector('.room-size-input');

        if (checkbox && checkbox.checked) {
            const name = checkbox.dataset.roomName;
            const size = sizeInput ? sizeInput.value.trim() : '';
            rooms.push({ name, size, has_room: 1 });
        }
    });

    const features = [];
    featuresContainer.querySelectorAll('.feature-item').forEach(featureItemDiv => {
        const checkbox = featureItemDiv.querySelector('.feature-has-checkbox');
        
        if (checkbox && checkbox.checked) {
            const name = checkbox.dataset.featureName;
            features.push({ name, has_feature: 1 });
        }
    });

    return { rooms, features };
}


/**
 * Saves the house model details (rooms and features) to the database via IPC.
 * This function is called when the "Save Details" button in the modal is clicked.
 * @private
 */
async function saveHouseModelDetails() {
    if (currentHouseModelId === null) {
        alert('Cannot save details for an undefined house model. Please select or create a house model first.');
        return;
    }

    const { rooms, features } = getHouseModelDetailsData();
    const roomsJson = JSON.stringify(rooms);
    const featuresJson = JSON.stringify(features);

    showLoading();
    try {
        console.log("house-model-details-logic.js: Saving details for model ID:", currentHouseModelId);
        console.log("  Rooms JSON:", roomsJson);
        console.log("  Features JSON:", featuresJson);

        const response = await window.api.updateHouseModelDetails(
            currentHouseModelId, roomsJson, featuresJson
        );

        if (response.success) {
            alert(response.message);
            hideModal(); 
            
            // After saving, update the cached data and refresh the summary display
            currentRoomsJson = roomsJson; 
            currentFeaturesJson = featuresJson; 
            showHouseModelSummaryAndButton(currentHouseModelId, currentRoomsJson, currentFeaturesJson);
        } else {
            alert(`Failed to save details: ${response.message}`);
        }
    } catch (error) {
        console.error('house-model-details-logic.js: Error saving house model details:', error);
        alert(`Error saving house model details: ${error.message || 'An unexpected error occurred.'}`);
    } finally {
        hideLoading();
    }
}


// --- Public Functions ---

/**
 * Displays the house model summary on the main form and shows/hides the edit button.
 * This function should be called whenever the selected house model changes or its details are saved.
 * @param {number|null} modelId The ID of the selected house model.
 * @param {string|null} roomsJson The JSON string of rooms for the model.
 * @param {string|null} featuresJson The JSON string of features for the model.
 * @public
 */
export function showHouseModelSummaryAndButton(modelId, roomsJson, featuresJson) {
    console.log('house-model-details-logic.js: showHouseModelSummaryAndButton called.');
    console.log(`  modelId: ${modelId}, roomsJson (received): ${roomsJson}, featuresJson (received): ${featuresJson}`);

    // Update current cached data for modal opening later
    currentHouseModelId = modelId;
    currentRoomsJson = roomsJson;
    currentFeaturesJson = featuresJson;

    if (modelId && roomsJson && featuresJson) {
        let rooms = [];
        let features = [];
        try {
            rooms = JSON.parse(roomsJson);
            features = JSON.parse(featuresJson);
        } catch (e) {
            console.error('Error parsing rooms/features JSON for summary display:', e);
            rooms = [];
            features = [];
        }

        // Display summary of rooms (only selected ones)
        const selectedRooms = rooms.filter(r => r.has_room);
        if (selectedRooms.length > 0) {
            summaryRooms.innerHTML = '<strong>Rooms:</strong> ' + selectedRooms
                .map(r => `${r.name}` + (r.size ? ` (${r.size})` : ''))
                .join(', ');
        } else {
            summaryRooms.innerHTML = '<strong>Rooms:</strong> No specific room details selected.';
        }

        // Display summary of features (only selected ones)
        const selectedFeatures = features.filter(f => f.has_feature);
        if (selectedFeatures.length > 0) {
            summaryFeatures.innerHTML = '<strong>Features:</strong> ' + selectedFeatures
                .map(f => f.name)
                .join(', ');
        } else {
            summaryFeatures.innerHTML = '<strong>Features:</strong> No specific feature details selected.';
        }

        houseModelSummaryDisplay.classList.remove('hidden'); 
        houseModelDetailsSectionButtons.classList.remove('hidden'); 
    } else {
        // Hide summary and button if no model is selected or details are not available
        houseModelSummaryDisplay.classList.add('hidden');
        houseModelDetailsSectionButtons.classList.add('hidden');
        summaryRooms.innerHTML = ''; 
        summaryFeatures.innerHTML = ''; 
    }
}

/**
 * Specifically opens the house model details modal for a BRAND NEW house model,
 * where details need to be defined for the first time.
 * @public
 */
export function openNewHouseModelModalForDefinition(newModelId) {
    // When defining a new model, rooms/features are empty. We just need the ID to save against.
    if (newModelId) {
        currentHouseModelId = newModelId; 
        _openHouseModelDetailsModal(newModelId, null, null); // Open with empty data, which populates all predefined options
    } else {
        alert('Error: Cannot open details for a new model without an ID.');
    }
}