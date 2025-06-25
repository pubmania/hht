// renderer/js/house-model-details-logic.js

import { showLoading, hideLoading } from './utils.js';

// Declare module-level variables. Initialize them to null.
// They will be assigned their DOM element references *only* within the DOMContentLoaded listener.
let houseModelDetailsSectionButtons = null; 
let editModelDetailsBtn = null;             
let houseModelDetailsModal = null;
let closeModelDetailsModalBtn = null;
let roomsContainer = null; 
let featuresContainer = null; 
let saveModelDetailsBtn = null; 
let cancelModelDetailsBtn = null; 

let currentHouseModelId = null; 
let isEditModeActive = false; 

const defaultRoom = { name: "", size: "", has_room: 0 }; 
const defaultFeature = { name: "", has_feature: 1 };


// ===========================================================================
// *** Self-Initialization Logic for this Module ***
// This ensures DOM elements are only accessed AFTER the document is ready.
// ===========================================================================
document.addEventListener("DOMContentLoaded", () => {
    console.log("house-model-details-logic.js: DOMContentLoaded fired. Attempting to initialize module elements and listeners.");

    // Retrieve ALL elements directly here and assign to module-level variables
    houseModelDetailsSectionButtons = document.getElementById('houseModelDetailsSectionButtons'); 
    editModelDetailsBtn = document.getElementById('editModelDetailsBtn');             
    houseModelDetailsModal = document.getElementById('houseModelDetailsModal');
    closeModelDetailsModalBtn = document.getElementById('closeModelDetailsModalBtn');
    roomsContainer = document.getElementById('roomsContainer'); 
    featuresContainer = document.getElementById('featuresContainer'); 
    saveModelDetailsBtn = document.getElementById('saveModelDetailsBtn'); 
    cancelModelDetailsBtn = document.getElementById('cancelModelDetailsBtn'); 

    // --- CRITICAL INITIALIZATION CHECKS ---
    console.log("house-model-details-logic.js: Element status on DOMContentLoaded (Post Retrieval):");
    console.log("  houseModelDetailsSectionButtons:", houseModelDetailsSectionButtons ? 'Found' : 'NOT FOUND', houseModelDetailsSectionButtons);
    console.log("  editModelDetailsBtn:", editModelDetailsBtn ? 'Found' : 'NOT FOUND', editModelDetailsBtn);
    console.log("  houseModelDetailsModal:", houseModelDetailsModal ? 'Found' : 'NOT FOUND', houseModelDetailsModal);
    console.log("  closeModelDetailsModalBtn:", closeModelDetailsModalBtn ? 'Found' : 'NOT FOUND', closeModelDetailsModalBtn);
    console.log("  roomsContainer:", roomsContainer ? 'Found' : 'NOT FOUND', roomsContainer);
    console.log("  featuresContainer:", featuresContainer ? 'Found' : 'NOT FOUND', featuresContainer);
    console.log("  saveModelDetailsBtn:", saveModelDetailsBtn ? 'Found' : 'NOT FOUND', saveModelDetailsBtn);
    console.log("  cancelModelDetailsBtn:", cancelModelDetailsBtn ? 'Found' : 'NOT FOUND', cancelModelDetailsBtn);

    // Assert that critical elements are found. If not, this will throw an error immediately.
    console.assert(houseModelDetailsSectionButtons, "CRITICAL: #houseModelDetailsSectionButtons not found!");
    console.assert(editModelDetailsBtn, "CRITICAL: #editModelDetailsBtn not found!");
    console.assert(houseModelDetailsModal, "CRITICAL: #houseModelDetailsModal not found!");
    console.assert(closeModelDetailsModalBtn, "CRITICAL: #closeModelDetailsModalBtn not found!");
    console.assert(roomsContainer, "CRITICAL: #roomsContainer not found!");
    console.assert(featuresContainer, "CRITICAL: #featuresContainer not found!");
    console.assert(saveModelDetailsBtn, "CRITICAL: #saveModelDetailsBtn not found!");
    console.assert(cancelModelDetailsBtn, "CRITICAL: #cancelModelDetailsBtn not found!");


    // If any critical element is still null after the assertions (e.g. if console.assert doesn't halt execution
    // in all environments or during compilation, this manual check provides a failsafe).
    if (!houseModelDetailsSectionButtons || !editModelDetailsBtn || !houseModelDetailsModal || !closeModelDetailsModalBtn ||
        !roomsContainer || !featuresContainer || !saveModelDetailsBtn || !cancelModelDetailsBtn) {
        const errorMessage = `FATAL ERROR: Some House Model Details elements are missing from the DOM. Cannot initialize module.`;
        console.error("house-model-details-logic.js:", errorMessage);
        alert(errorMessage + " Please check console and form.html for correct IDs and structure.");
        return; // Stop further execution of this module's init
    }
    // --- END CRITICAL INITIALIZATION CHECKS ---

    // Attach event listeners after elements are confirmed to exist and assigned
    editModelDetailsBtn.addEventListener('click', openDetailsModal);
    saveModelDetailsBtn.addEventListener('click', saveModelDetails);
    cancelModelDetailsBtn.addEventListener('click', closeDetailsModal); 
    closeModelDetailsModalBtn.addEventListener('click', closeDetailsModal); 
    
    // Close modal if clicking outside content
    houseModelDetailsModal.addEventListener('click', (event) => {
        if (event.target === houseModelDetailsModal) {
            closeDetailsModal();
        }
    });

    // Initial state: hide the modal and the main form's 'Edit Details' button
    houseModelDetailsModal.classList.add('hidden');
    editModelDetailsBtn.classList.add('hidden');
    houseModelDetailsSectionButtons.classList.add('hidden'); // Also hide its container
});
// ===========================================================================


/**
 * Opens the house model details modal and populates it.
 * This is primarily triggered by the 'Edit Details' button on the main form.
 */
async function openDetailsModal() {
    console.log("house-model-details-logic.js: openDetailsModal called. currentHouseModelId:", currentHouseModelId);
    console.log("house-model-details-logic.js: Checking houseModelDetailsModal (at call):", houseModelDetailsModal);

    if (!currentHouseModelId) {
        alert("Please select a House Model to edit its details.");
        return;
    }
    
    // Defensive check (though init should have caught it, this is a runtime check)
    if (!houseModelDetailsModal) {
        console.error("house-model-details-logic.js: houseModelDetailsModal is undefined in openDetailsModal. Re-initialization failed or element missing.");
        alert("Internal error: Modal element not found for interaction. Please refresh and check console.");
        return;
    }

    showLoading();
    try {
        const modelData = await window.api.getHouseModelDetailsById(currentHouseModelId);
        let rooms = [];
        let features = [];
        try {
            if (modelData && modelData.rooms_data) rooms = JSON.parse(modelData.rooms_data);
        } catch(e) { console.error("Error parsing rooms data on modal open:", e); rooms = []; }
        try {
            if (modelData && modelData.features_data) features = JSON.parse(modelData.features_data);
        } catch(e) { console.error("Error parsing features data on modal open:", e); features = []; }

        renderRooms(rooms, true); 
        renderFeatures(features, true); 
        setEditMode(true); 
        houseModelDetailsModal.classList.remove('hidden'); 
    } catch (error) {
        console.error("Failed to load house model details for modal:", error);
        alert("Error loading house model details for editing.");
        renderRooms([], true); 
        renderFeatures([], true); 
        setEditMode(true);
        houseModelDetailsModal.classList.remove('hidden'); 
    } finally {
        hideLoading();
    }
}

/**
 * Closes the house model details modal.
 * This is triggered by 'Save Details', 'Cancel Edit', or the 'X' button.
 */
function closeDetailsModal() {
    console.log("house-model-details-logic.js: closeDetailsModal called.");
    // Defensive check
    if (!houseModelDetailsModal) {
        console.error("house-model-details-logic.js: houseModelDetailsModal is undefined in closeDetailsModal.");
        return;
    }

    houseModelDetailsModal.classList.add('hidden'); 
    setEditMode(false); 
    
    if (currentHouseModelId) {
        showLoading();
        window.api.getHouseModelDetailsById(currentHouseModelId)
            .then(modelData => {
                let rooms = [];
                let features = [];
                try {
                    if (modelData && modelData.rooms_data) rooms = JSON.parse(modelData.rooms_data);
                } catch(e) { console.error("Error parsing rooms data on modal close:", e); rooms = []; }
                try {
                    if (modelData && modelData.features_data) features = JSON.parse(modelData.features_data);
                } catch(e) { console.error("Error parsing features data on modal close:", e); features = []; }
                
                displayAndSetEditable(currentHouseModelId, JSON.stringify(rooms), JSON.stringify(features), false); 
            })
            .catch(error => {
                console.error("Failed to re-load house model details after modal close:", error);
                displayAndSetEditable(currentHouseModelId, null, null, false); 
            })
            .finally(() => {
                hideLoading();
            });
    } else {
        displayAndSetEditable(null, null, null, false); 
    }
}


/**
 * Public function to control the display of 'Edit Details' button and potentially open modal
 * This is called from form-main.js and house-model-logic.js.
 * @param {number|null} houseModelId The ID of the house model to display.
 * @param {string|null} roomsDataJson JSON string of rooms data.
 * @param {string|null} featuresDataJson JSON string of features data.
 * @param {boolean} editable True if fields should be editable (e.g., adding a new model).
 */
export function displayAndSetEditable(houseModelId, roomsDataJson, featuresDataJson, editable) {
    currentHouseModelId = houseModelId; // Update internal state

    // Defensive check to ensure elements are ready. If not, log a warning.
    // The main init in DOMContentLoaded should handle initial population.
    if (!houseModelDetailsSectionButtons || !editModelDetailsBtn || !houseModelDetailsModal) {
        console.warn("house-model-details-logic.js: displayAndSetEditable called before module's DOMContentLoaded initialization completed. Elements might be null.");
        return; 
    }


    // Control visibility of the 'Edit Details' button on the main form
    if (houseModelId) {
        houseModelDetailsSectionButtons.classList.remove('hidden'); 
        editModelDetailsBtn.classList.remove('hidden'); 
    } else {
        houseModelDetailsSectionButtons.classList.add('hidden'); 
        editModelDetailsBtn.classList.add('hidden'); 
    }

    if (houseModelId === null && editable === true) {
        let rooms = [];
        let features = [];
        try {
            if (roomsDataJson) rooms = JSON.parse(roomsDataJson);
        } catch(e) { console.error("Error parsing roomsDataJson for new model:", e); }
        try {
            if (featuresDataJson) features = JSON.parse(featuresDataJson);
        } catch(e) { console.error("Error parsing featuresDataJson for new model:", e); }

        renderRooms(rooms, true); 
        renderFeatures(features, true); 
        setEditMode(true); 
        houseModelDetailsModal.classList.remove('hidden'); 
    } 
    else if (editable === false && houseModelDetailsModal && !houseModelDetailsModal.classList.contains('hidden')) {
        closeDetailsModal();
    }
}


/**
 * Sets the edit mode for the details section (inside modal) and updates button visibility.
 * @param {boolean} editMode True to enable editing, false to disable.
 */
function setEditMode(editMode) { 
    isEditModeActive = editMode;

    // Defensive check
    if (!saveModelDetailsBtn || !cancelModelDetailsBtn || !roomsContainer || !featuresContainer) {
        console.error("house-model-details-logic.js: setEditMode called before all elements are populated.");
        return;
    }

    saveModelDetailsBtn.classList.toggle('hidden', !editMode);
    cancelModelDetailsBtn.classList.toggle('hidden', !editMode);
    
    if (editMode) {
        if (roomsContainer.querySelectorAll('.room-item').length === 0 && roomsContainer.querySelector('.add-room-btn')) {
            addRoom(); 
        }
        if (featuresContainer.querySelectorAll('.feature-item').length === 0 && featuresContainer.querySelector('.add-feature-btn')) {
            addFeature(); 
        }
    }

    roomsContainer.querySelectorAll('input, select').forEach(input => {
        if (input.dataset.static !== 'true') { 
            input.disabled = !editMode;
        }
    });
    featuresContainer.querySelectorAll('input, select').forEach(input => {
        if (input.dataset.static !== 'true') {
            input.disabled = !editMode;
        }
    });

    roomsContainer.querySelectorAll('.add-room-btn, .remove-room-btn').forEach(btn => {
        btn.style.display = editMode ? 'inline-block' : 'none';
    });
    featuresContainer.querySelectorAll('.add-feature-btn, .remove-feature-btn').forEach(btn => {
        btn.style.display = editMode ? 'inline-block' : 'none';
    });
}


/**
 * Renders the rooms in the UI.
 * @param {Array} rooms Array of room objects.
 * @param {boolean} editable True if inputs should be editable.
 */
function renderRooms(rooms, editable) {
    if (!roomsContainer) { console.error("roomsContainer is null in renderRooms - this should not happen post-init."); return; }
    roomsContainer.innerHTML = ''; 

    if (rooms && rooms.length > 0) {
        rooms.forEach((room, index) => {
            roomsContainer.appendChild(createRoomElement(room, index, editable));
        });
    } 

    if (editable) {
        const addRoomBtn = document.createElement('button');
        addRoomBtn.type = 'button';
        addRoomBtn.textContent = 'Add Room';
        addRoomBtn.className = 'add-room-btn action-button-secondary mt-2';
        addRoomBtn.addEventListener('click', addRoom);
        roomsContainer.appendChild(addRoomBtn);
    }
}

/**
 * Creates a DOM element for a single room.
 * @param {object} room The room data.
 * @param {number} index The index of the room.
 * @param {boolean} editable True if inputs should be editable.
 * @returns {HTMLElement} The created room element.
 */
function createRoomElement(room, index, editable) {
    const div = document.createElement('div');
    div.className = 'room-item grid grid-cols-room-item gap-2 items-center mb-2 p-2 border rounded-md bg-gray-50';
    div.innerHTML = `
        <input type="text" value="${room.name || ''}" placeholder="Room Name" class="room-name-input input-field" ${editable ? '' : 'disabled'}>
        <div class="flex items-center space-x-2">
            <input type="checkbox" class="room-has-checkbox accent-lime-500" ${room.has_room ? 'checked' : ''} ${editable ? '' : 'disabled'}>
            <label class="text-sm text-gray-700">Has Room</label>
        </div>
        <input type="text" value="${room.size || ''}" placeholder="Size (e.g., 10x12ft)" class="room-size-input input-field ${room.has_room ? '' : 'hidden'}" ${editable ? '' : 'disabled'}>
        <button type="button" class="remove-room-btn action-button-danger text-red-500 hover:text-red-700 ${editable ? '' : 'hidden'}">X</button>
    `;
    
    const removeBtn = div.querySelector('.remove-room-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => removeRoom(div));
    }

    const hasCheckbox = div.querySelector('.room-has-checkbox');
    const sizeInput = div.querySelector('.room-size-input');
    if (hasCheckbox && sizeInput) {
        hasCheckbox.addEventListener('change', () => {
            sizeInput.classList.toggle('hidden', !hasCheckbox.checked);
            if (!hasCheckbox.checked) {
                sizeInput.value = '';
            }
        });
    }
    return div;
}

/**
 * Adds a new empty room input field to the UI.
 */
function addRoom() {
    if (!roomsContainer) { console.error("roomsContainer is null in addRoom - this should not happen post-init."); return; }
    const currentRoomItems = roomsContainer.querySelectorAll('.room-item');
    if (currentRoomItems.length > 0) {
        const lastRoomNameInput = currentRoomItems[currentRoomItems.length - 1].querySelector('.room-name-input');
        if (lastRoomNameInput && lastRoomNameInput.value.trim() === '') {
            lastRoomNameInput.focus();
            return; 
        }
    }
    roomsContainer.insertBefore(createRoomElement(defaultRoom, currentRoomItems.length, true), roomsContainer.lastChild);
}

/**
 * Removes a room element from the UI.
 * @param {HTMLElement} roomElement The room element to remove.
 */
function removeRoom(roomElement) {
    if (!roomsContainer) { console.error("roomsContainer is null in removeRoom - this should not happen post-init."); return; }
    roomElement.remove();
    if (roomsContainer.querySelectorAll('.room-item').length === 0 && isEditModeActive && roomsContainer.querySelector('.add-room-btn')) {
        roomsContainer.insertBefore(createRoomElement(defaultRoom, 0, true), roomsContainer.lastChild);
    }
}


/**
 * Renders the features in the UI.
 * @param {Array} features Array of feature objects.
 * @param {boolean} editable True if inputs should be editable.
 */
function renderFeatures(features, editable) {
    if (!featuresContainer) { console.error("featuresContainer is null in renderFeatures - this should not happen post-init."); return; }
    featuresContainer.innerHTML = ''; 

    if (features && features.length > 0) {
        features.forEach((feature, index) => {
            featuresContainer.appendChild(createFeatureElement(feature, index, editable));
        });
    }

    if (editable) {
        const addFeatureBtn = document.createElement('button');
        addFeatureBtn.type = 'button';
        addFeatureBtn.textContent = 'Add Feature';
        addFeatureBtn.className = 'add-feature-btn action-button-secondary mt-2';
        addFeatureBtn.addEventListener('click', addFeature);
        featuresContainer.appendChild(addFeatureBtn);
    }
}

/**
 * Creates a DOM element for a single feature.
 * @param {object} feature The feature data.
 * @param {number} index The index of the feature.
 * @param {boolean} editable True if inputs should be editable.
 * @returns {HTMLElement} The created feature element.
 */
function createFeatureElement(feature, index, editable) {
    const div = document.createElement('div');
    div.className = 'feature-item grid grid-cols-feature-item gap-2 items-center mb-2 p-2 border rounded-md bg-gray-50';
    div.innerHTML = `
        <input type="text" value="${feature.name || ''}" placeholder="Feature Name" class="feature-name-input input-field" ${editable ? '' : 'disabled'}>
        <div class="flex items-center space-x-2">
            <input type="checkbox" class="feature-has-checkbox accent-lime-500" ${feature.has_feature ? 'checked' : ''} ${editable ? '' : 'disabled'}>
            <label class="text-sm text-gray-700">Has Feature</label>
        </div>
        <button type="button" class="remove-feature-btn action-button-danger text-red-500 hover:text-red-700 ${editable ? '' : 'hidden'}">X</button>
    `;
    const removeBtn = div.querySelector('.remove-feature-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => removeFeature(div));
    }
    return div;
}

/**
 * Adds a new empty feature input field to the UI.
 */
function addFeature() {
    if (!featuresContainer) { console.error("featuresContainer is null in addFeature - this should not happen post-init."); return; }
    const currentFeatureItems = featuresContainer.querySelectorAll('.feature-item');
    if (currentFeatureItems.length > 0) {
        const lastFeatureNameInput = currentFeatureItems[currentFeatureItems.length - 1].querySelector('.feature-name-input');
        if (lastFeatureNameInput && lastFeatureNameInput.value.trim() === '') {
            lastFeatureNameInput.focus();
            return;
        }
    }
    featuresContainer.insertBefore(createFeatureElement(defaultFeature, currentFeatureItems.length, true), featuresContainer.lastChild);
}

/**
 * Removes a feature element from the UI.
 * @param {HTMLElement} featureElement The feature element to remove.
 */
function removeFeature(featureElement) {
    if (!featuresContainer) { console.error("featuresContainer is null in removeFeature - this should not happen post-init."); return; }
    featureElement.remove();
    if (featuresContainer.querySelectorAll('.feature-item').length === 0 && isEditModeActive && featuresContainer.querySelector('.add-feature-btn')) {
        featuresContainer.insertBefore(createFeatureElement(defaultFeature, 0, true), featuresContainer.lastChild);
    }
}


/**
 * Gathers the current rooms and features data from the UI.
 * @returns {object} An object containing arrays of room and feature data.
 */
export function getHouseModelDetailsData() {
    if (!roomsContainer || !featuresContainer) { 
        console.error("house-model-details-logic.js: getHouseModelDetailsData called before containers are populated. Returning empty data.");
        return { rooms: [], features: [] };
    }

    const rooms = [];
    roomsContainer.querySelectorAll('.room-item').forEach(item => {
        const nameInput = item.querySelector('.room-name-input');
        const sizeInput = item.querySelector('.room-size-input');
        const hasCheckbox = item.querySelector('.room-has-checkbox');
        
        if (nameInput && nameInput.value.trim()) { 
            rooms.push({
                name: nameInput.value.trim(),
                size: (hasCheckbox && hasCheckbox.checked) ? (sizeInput ? sizeInput.value.trim() : "") : "",
                has_room: hasCheckbox ? (hasCheckbox.checked ? 1 : 0) : 0
            });
        }
    });

    const features = [];
    featuresContainer.querySelectorAll('.feature-item').forEach(item => {
        const nameInput = item.querySelector('.feature-name-input');
        const hasCheckbox = item.querySelector('.feature-has-checkbox');
        
        if (nameInput && nameInput.value.trim()) { 
            features.push({
                name: nameInput.value.trim(),
                has_feature: hasCheckbox ? (hasCheckbox.checked ? 1 : 0) : 0
            });
        }
    });

    return { rooms, features };
}


/**
 * Saves the updated house model details to the database.
 */
async function saveModelDetails() {
    if (!currentHouseModelId) {
        alert("No House Model selected to save details for.");
        return;
    }

    const { rooms, features } = getHouseModelDetailsData();

    if (rooms.length === 0 && features.length === 0) {
        alert("Please add at least one room or feature with a name before saving details.");
        return;
    }

    showLoading(); 
    try {
        const roomsJson = JSON.stringify(rooms);
        const featuresJson = JSON.stringify(features);

        const response = await window.api.updateHouseModelDetails(currentHouseModelId, roomsJson, featuresJson);
        if (response.success) {
            alert(response.message);
            closeDetailsModal(); 
        } else {
            alert(`Failed to save details: ${response.message}`);
        }
    } catch (error) {
        console.error("house-model-details-logic.js: Error saving model details:", error);
        alert(`Error saving model details: ${error.message || 'An unexpected error occurred.'}`);
    } finally {
        hideLoading(); 
    }
}
