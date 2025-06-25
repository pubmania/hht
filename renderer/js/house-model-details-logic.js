// renderer/js/house-model-details-logic.js

let houseModelDetailsModal;
let closeModelDetailsModalBtn;
let roomsContainer;
let featuresContainer;
let saveModelDetailsBtn;
let cancelModelDetailsBtn;
let houseModelDetailsSectionButtons; // The div on the main form containing the Edit Details button
let editModelDetailsBtn; // The actual button on the main form

let houseModelSummaryDisplay; // NEW: Container for read-only summary
let summaryRooms;             // NEW: Container for read-only rooms list
let summaryFeatures;          // NEW: Container for read-only features list

let currentHouseModelId = null; // To keep track of which house model's details are being edited
let currentRoomsData = null;    // Cache the JSON string for rooms
let currentFeaturesData = null; // Cache the JSON string for features

// Helper for loading overlay (ensure these functions are available, typically from utils.js)
function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}
function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}


// DOMContentLoaded listener for this module to ensure elements exist
document.addEventListener("DOMContentLoaded", () => {
    // Retrieve DOM elements
    houseModelDetailsModal = document.getElementById('houseModelDetailsModal');
    closeModelDetailsModalBtn = document.getElementById('closeModelDetailsModalBtn');
    roomsContainer = document.getElementById('roomsContainer');
    featuresContainer = document.getElementById('featuresContainer');
    saveModelDetailsBtn = document.getElementById('saveModelDetailsBtn');
    cancelModelDetailsBtn = document.getElementById('cancelModelDetailsBtn');
    houseModelDetailsSectionButtons = document.getElementById('houseModelDetailsSectionButtons');
    editModelDetailsBtn = document.getElementById('editModelDetailsBtn');

    houseModelSummaryDisplay = document.getElementById('houseModelSummaryDisplay'); // NEW
    summaryRooms = document.getElementById('summaryRooms');                       // NEW
    summaryFeatures = document.getElementById('summaryFeatures');                 // NEW

    console.log("house-model-details-logic.js: DOMContentLoaded fired. Initializing module elements and listeners.");

    // Basic check for critical elements after retrieval
    if (!houseModelDetailsModal || !closeModelDetailsModalBtn || !roomsContainer || !featuresContainer || 
        !saveModelDetailsBtn || !cancelModelDetailsBtn || !houseModelDetailsSectionButtons || !editModelDetailsBtn ||
        !houseModelSummaryDisplay || !summaryRooms || !summaryFeatures) { // Added new elements to check
        
        let missingElements = [];
        if (!houseModelDetailsModal) missingElements.push('houseModelDetailsModal');
        if (!closeModelDetailsModalBtn) missingElements.push('closeModelDetailsModalBtn');
        if (!roomsContainer) missingElements.push('roomsContainer');
        if (!featuresContainer) missingElements.push('featuresContainer');
        if (!saveModelDetailsBtn) missingElements.push('saveModelDetailsBtn');
        if (!cancelModelDetailsBtn) missingElements.push('cancelModelDetailsBtn');
        if (!houseModelDetailsSectionButtons) missingElements.push('houseModelDetailsSectionButtons');
        if (!editModelDetailsBtn) missingElements.push('editModelDetailsBtn');
        if (!houseModelSummaryDisplay) missingElements.push('houseModelSummaryDisplay');
        if (!summaryRooms) missingElements.push('summaryRooms');
        if (!summaryFeatures) missingElements.push('summaryFeatures');
        
        console.error("house-model-details-logic.js: One or more critical DOM elements are missing:", missingElements.join(', '));
        return; 
    }
    console.log("house-model-details-logic.js: All critical DOM elements found.");

    // Attach event listeners for the modal
    if (closeModelDetailsModalBtn) {
        closeModelDetailsModalBtn.addEventListener('click', hideModal);
    }
    if (cancelModelDetailsBtn) {
        cancelModelDetailsBtn.addEventListener('click', hideModal); // Cancel button also hides modal
    }
    if (saveModelDetailsBtn) {
        saveModelDetailsBtn.addEventListener('click', saveModelDetails);
    }

    // Attach event listener for the "Edit Details" button on the main form
    if (editModelDetailsBtn) {
        editModelDetailsBtn.addEventListener('click', () => {
            console.log("house-model-details-logic.js: 'Edit Details' button clicked.");
            // When this button is clicked, open the modal with the cached data.
            if (currentHouseModelId !== null) {
                _openHouseModelDetailsModal(currentHouseModelId, currentRoomsData, currentFeaturesData);
            } else {
                alert("Please select a House Model first to edit its details.");
            }
        });
    }

    // Add listeners for "Add Room" and "Add Feature" buttons inside the modal
    const addRoomBtn = document.getElementById('addRoomBtn');
    const addFeatureBtn = document.getElementById('addFeatureBtn');

    if (addRoomBtn) addRoomBtn.addEventListener('click', addNewRoom);
    if (addFeatureBtn) addFeatureBtn.addEventListener('click', addNewFeature);
});

/**
 * Shows or hides the "Edit Details" button and the read-only summary on the main form.
 * This function DOES NOT open the modal.
 * @param {number|null} modelId The ID of the house model, or null if no model is selected.
 * @param {string|null} roomsJson JSON string of rooms data, or null.
 * @param {string|null} featuresJson JSON string of features data, or null.
 */
export function showHouseModelSummaryAndButton(modelId, roomsJson, featuresJson) {
    console.log("house-model-details-logic.js: showHouseModelSummaryAndButton called.");
    console.log("  modelId:", modelId, "roomsJson (received):", roomsJson, "featuresJson (received):", featuresJson);

    // Cache the data so the modal can access it when opened
    currentHouseModelId = modelId;
    currentRoomsData = roomsJson;
    currentFeaturesData = featuresJson;

    // Clear previous summary content
    if (summaryRooms) summaryRooms.innerHTML = '';
    if (summaryFeatures) summaryFeatures.innerHTML = '';

    if (modelId) {
        // A model is selected, show the section, the button, and populate summary
        if (houseModelDetailsSectionButtons) houseModelDetailsSectionButtons.classList.remove('hidden');
        if (editModelDetailsBtn) editModelDetailsBtn.classList.remove('hidden');
        if (houseModelSummaryDisplay) houseModelSummaryDisplay.classList.remove('hidden');

        // Populate summary
        if (roomsJson) {
            try {
                const rooms = JSON.parse(roomsJson);
                if (rooms.length > 0) {
                    summaryRooms.innerHTML = '<h4>Rooms:</h4><ul>' + 
                        rooms.filter(r => r.has_room || r.name).map(room => 
                            `<li>${room.name}${room.has_room && room.size ? ` (${room.size})` : ''}${room.has_room ? '' : ' (Not Included)'}</li>`
                        ).join('') + '</ul>';
                } else {
                    summaryRooms.innerHTML = '<p>No room details available.</p>';
                }
            } catch (e) {
                console.error("house-model-details-logic.js: Error parsing roomsJson for summary:", e);
                summaryRooms.innerHTML = '<p>Error loading room details.</p>';
            }
        } else {
            summaryRooms.innerHTML = '<p>No room details available.</p>';
        }

        if (featuresJson) {
            try {
                const features = JSON.parse(featuresJson);
                if (features.length > 0) {
                    summaryFeatures.innerHTML = '<h4>Features:</h4><ul>' + 
                        features.filter(f => f.has_feature || f.name).map(feature => 
                            `<li>${feature.name}${feature.has_feature ? '' : ' (Not Included)'}</li>`
                        ).join('') + '</ul>';
                } else {
                    summaryFeatures.innerHTML = '<p>No feature details available.</p>';
                }
            } catch (e) {
                console.error("house-model-details-logic.js: Error parsing featuresJson for summary:", e);
                summaryFeatures.innerHTML = '<p>Error loading feature details.</p>';
            }
        } else {
            summaryFeatures.innerHTML = '<p>No feature details available.</p>';
        }

    } else {
        // No model selected, hide the section, the button, and the summary
        if (houseModelDetailsSectionButtons) houseModelDetailsSectionButtons.classList.add('hidden');
        if (editModelDetailsBtn) editModelDetailsBtn.classList.add('hidden');
        if (houseModelSummaryDisplay) houseModelSummaryDisplay.classList.add('hidden');
        summaryRooms.innerHTML = '';
        summaryFeatures.innerHTML = '';
    }
}

/**
 * INTERNAL: Opens the house model details modal and populates it with data for editing.
 * This function is called by the 'Edit Details' button click or when adding a new house model.
 * NOT EXPORTED.
 * @param {number|null} modelId The ID of the house model, or null if adding a new one.
 * @param {string|null} roomsJson JSON string of rooms data, or null.
 * @param {string|null} featuresJson JSON string of features data, or null.
 */
function _openHouseModelDetailsModal(modelId, roomsJson, featuresJson) {
    console.log("house-model-details-logic.js: _openHouseModelDetailsModal called. Populating modal.");
    console.log("  modelId:", modelId, "roomsJson:", roomsJson, "featuresJson:", featuresJson);

    currentHouseModelId = modelId; // Ensure this is set for saving within the modal

    // Clear previous content in the modal
    if (roomsContainer) roomsContainer.innerHTML = '';
    if (featuresContainer) featuresContainer.innerHTML = '';

    // Parse and populate rooms in the modal
    if (roomsJson) {
        try {
            const rooms = JSON.parse(roomsJson);
            console.log("house-model-details-logic.js: Parsed rooms for modal:", rooms);
            rooms.forEach(room => addRoomField(room.name, room.has_room, room.size));
        } catch (e) {
            console.error("house-model-details-logic.js: Error parsing roomsJson for modal:", e);
            alert("Error loading rooms data for modal: Invalid format.");
        }
    } else {
        console.log("house-model-details-logic.js: No roomsJson for modal.");
    }

    // Parse and populate features in the modal
    if (featuresJson) {
        try {
            const features = JSON.parse(featuresJson);
            console.log("house-model-details-logic.js: Parsed features for modal:", features);
            features.forEach(feature => addFeatureField(feature.name, feature.has_feature));
        } catch (e) {
            console.error("house-model-details-logic.js: Error parsing featuresJson for modal:", e);
            alert("Error loading features data for modal: Invalid format.");
        }
    } else {
        console.log("house-model-details-logic.js: No featuresJson for modal.");
    }

    // Show the modal
    if (houseModelDetailsModal) {
        houseModelDetailsModal.classList.remove('hidden');
    }
}

/**
 * Hides the house model details modal.
 */
function hideModal() {
    if (houseModelDetailsModal) {
        houseModelDetailsModal.classList.add('hidden');
    }
    // Clear content of modal after hiding to ensure fresh load next time
    if (roomsContainer) roomsContainer.innerHTML = '';
    if (featuresContainer) featuresContainer.innerHTML = '';
}

/**
 * Adds a room input field to the rooms container.
 * @param {string} name The initial name of the room.
 * @param {number} initialHasRoom 1 if the room is present, 0 otherwise.
 * @param {string} initialSize The initial size of the room.
 */
function addRoomField(name = '', initialHasRoom = 0, initialSize = '') {
    if (!roomsContainer) return;

    const roomDiv = document.createElement('div');
    roomDiv.className = 'room-item';
    roomDiv.innerHTML = `
        <input type="text" value="${name}" placeholder="Room Name" class="input-field room-name-input">
        <input type="text" value="${initialSize}" placeholder="Size (e.g., 10x12ft)" class="input-field room-size-input">
        <label class="flex items-center gap-2">
            <input type="checkbox" ${initialHasRoom ? 'checked' : ''} class="room-has-checkbox"> Has Room
        </label>
        <button type="button" class="remove-room-btn">X</button>
    `;

    const hasRoomCheckbox = roomDiv.querySelector('.room-has-checkbox');
    const sizeInput = roomDiv.querySelector('.room-size-input');
    const removeBtn = roomDiv.querySelector('.remove-room-btn');

    // Initial state of size input based on checkbox
    if (!initialHasRoom) {
        sizeInput.style.display = 'none'; // Initially hide if not checked
        sizeInput.disabled = true;
    } else {
        sizeInput.style.display = ''; // Ensure visible if checked
        sizeInput.disabled = false;
    }
    
    // Add event listener to toggle size input visibility and disabled state
    hasRoomCheckbox.addEventListener('change', () => {
        if (hasRoomCheckbox.checked) {
            sizeInput.style.display = ''; // Show
            sizeInput.disabled = false;
            sizeInput.focus(); // Focus when enabled
        } else {
            sizeInput.style.display = 'none'; // Hide
            sizeInput.disabled = true;
            sizeInput.value = ''; // Clear value when hidden
        }
    });

    removeBtn.addEventListener('click', () => roomDiv.remove());

    roomsContainer.appendChild(roomDiv);
}

/**
 * Adds a feature input field to the features container.
 * @param {string} name The initial name of the feature.
 * @param {number} initialHasFeature 1 if the feature is present, 0 otherwise.
 */
function addFeatureField(name = '', initialHasFeature = 0) {
    if (!featuresContainer) return;

    const featureDiv = document.createElement('div');
    featureDiv.className = 'feature-item';
    featureDiv.innerHTML = `
        <input type="text" value="${name}" placeholder="Feature Name" class="input-field feature-name-input">
        <label class="flex items-center gap-2">
            <input type="checkbox" ${initialHasFeature ? 'checked' : ''} class="feature-has-checkbox"> Has Feature
        </label>
        <button type="button" class="remove-feature-btn">X</button>
    `;

    const removeBtn = featureDiv.querySelector('.remove-feature-btn');
    removeBtn.addEventListener('click', () => featureDiv.remove());

    featuresContainer.appendChild(featureDiv);
}

// Function to add new empty room/feature fields
export function addNewRoom() {
    addRoomField(); // Call with default empty values
}

export function addNewFeature() {
    addFeatureField(); // Call with default empty values
}


/**
 * Gathers all room and feature data from the modal.
 * @returns {object} An object containing arrays of rooms and features.
 * IMPORTANT: This function is EXPORTED because house-model-logic.js needs it
 * when saving a new house model, and the modal's save button also uses it.
 */
export function getHouseModelDetailsData() {
    const rooms = [];
    roomsContainer.querySelectorAll('.room-item').forEach(roomDiv => {
        const nameInput = roomDiv.querySelector('.room-name-input');
        const hasCheckbox = roomDiv.querySelector('.room-has-checkbox');
        const sizeInput = roomDiv.querySelector('.room-size-input'); // Get the size input

        rooms.push({
            name: nameInput ? nameInput.value.trim() : '',
            has_room: hasCheckbox ? (hasCheckbox.checked ? 1 : 0) : 0,
            size: sizeInput && hasCheckbox.checked ? sizeInput.value.trim() : '' // Only include size if 'has room' is checked
        });
    });

    const features = [];
    featuresContainer.querySelectorAll('.feature-item').forEach(featureDiv => {
        const nameInput = featureDiv.querySelector('.feature-name-input');
        const hasCheckbox = featureDiv.querySelector('.feature-has-checkbox');
        features.push({
            name: nameInput ? nameInput.value.trim() : '',
            has_feature: hasCheckbox ? (hasCheckbox.checked ? 1 : 0) : 0
        });
    });

    console.log("house-model-details-logic.js: getHouseModelDetailsData - Rooms:", rooms);
    console.log("house-model-details-logic.js: getHouseModelDetailsData - Features:", features);

    return { rooms, features };
}

/**
 * Handles saving the house model details (triggered by the modal's Save button).
 * This will call the main process to update the house_models table.
 */
async function saveModelDetails() {
    if (currentHouseModelId === null) {
        alert("Cannot save details: No house model selected. This usually happens if you try to save a brand new model without saving its name first.");
        return;
    }

    const { rooms, features } = getHouseModelDetailsData();

    // Basic validation for rooms/features
    if (rooms.length === 0 && features.length === 0) {
        if (!confirm("No rooms or features entered. Do you want to save with empty details?")) {
            return;
        }
    }

    // Ensure at least one room/feature has a name if present
    const hasNamedRoom = rooms.some(room => room.name !== '');
    const hasNamedFeature = features.some(feature => feature.name !== '');

    if (!hasNamedRoom && !hasNamedFeature && (rooms.length > 0 || features.length > 0)) {
        if (!confirm("Some rooms or features have no names. Save anyway?")) {
            return;
        }
    }

    showLoading();
    try {
        const roomsJson = JSON.stringify(rooms);
        const featuresJson = JSON.stringify(features);

        console.log("house-model-details-logic.js: Saving details for model ID:", currentHouseModelId);
        console.log("  Rooms JSON:", roomsJson);
        console.log("  Features JSON:", featuresJson);

        const response = await window.api.updateHouseModelDetails(
            currentHouseModelId, roomsJson, featuresJson
        );

        if (response.success) {
            alert(response.message);
            hideModal(); // Close modal on successful save
            // After saving, ensure the cached data for this model is updated
            // and the summary display is also updated.
            currentRoomsData = roomsJson;
            currentFeaturesData = featuresJson;
            showHouseModelSummaryAndButton(currentHouseModelId, currentRoomsData, currentFeaturesData);
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

// This function will be called by house-model-logic.js to specifically open the modal for
// a brand new house model (no existing data).
export function openNewHouseModelModalForDefinition() {
    // When defining a new model, we don't have a modelId yet, and rooms/features are empty.
    _openHouseModelDetailsModal(null, null, null);
}
