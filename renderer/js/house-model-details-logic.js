// renderer/js/house-model-details-logic.js

import { showLoading, hideLoading } from './utils.js';

// No global element variables declared here, they will be retrieved directly in init.

// Internal state to track current House Model ID and whether in edit mode
let currentHouseModelId = null;
let isEditModeActive = false; // Tracks if the inputs within the modal are editable

// Default structure for a new room or feature
const defaultRoom = { name: "", size: "", has_room: 0 }; // Default has_room to 0 (unchecked)
const defaultFeature = { name: "", has_feature: 1 };


/**
 * Initializes the house model details section and attaches event listeners.
 * This function now retrieves ALL necessary DOM elements internally using document.getElementById.
 * It no longer accepts an 'elements' parameter.
 */
export function initHouseModelDetails() {
    // Retrieve ALL elements directly here
    const houseModelDetailsSectionButtons = document.getElementById('houseModelDetailsSectionButtons'); 
    const editModelDetailsBtn = document.getElementById('editModelDetailsBtn');             
    const houseModelDetailsModal = document.getElementById('houseModelDetailsModal');
    const closeModelDetailsModalBtn = document.getElementById('closeModelDetailsModalBtn');
    const roomsContainer = document.getElementById('roomsContainer'); 
    const featuresContainer = document.getElementById('featuresContainer'); 
    const saveModelDetailsBtn = document.getElementById('saveModelDetailsBtn'); 
    const cancelModelDetailsBtn = document.getElementById('cancelModelDetailsBtn'); 

    // --- CRITICAL INITIALIZATION CHECKS: Ensure all required elements are found ---
    // Log the status of each element after retrieval
    console.log("house-model-details-logic.js: Initializing. Element status:");
    console.log("  houseModelDetailsSectionButtons:", houseModelDetailsSectionButtons ? 'Found' : 'NOT FOUND', houseModelDetailsSectionButtons);
    console.log("  editModelDetailsBtn:", editModelDetailsBtn ? 'Found' : 'NOT FOUND', editModelDetailsBtn);
    console.log("  houseModelDetailsModal:", houseModelDetailsModal ? 'Found' : 'NOT FOUND', houseModelDetailsModal);
    console.log("  closeModelDetailsModalBtn:", closeModelDetailsModalBtn ? 'Found' : 'NOT FOUND', closeModelDetailsModalBtn);
    console.log("  roomsContainer:", roomsContainer ? 'Found' : 'NOT FOUND', roomsContainer);
    console.log("  featuresContainer:", featuresContainer ? 'Found' : 'NOT FOUND', featuresContainer);
    console.log("  saveModelDetailsBtn:", saveModelDetailsBtn ? 'Found' : 'NOT FOUND', saveModelDetailsBtn);
    console.log("  cancelModelDetailsBtn:", cancelModelDetailsBtn ? 'Found' : 'NOT FOUND', cancelModelDetailsBtn);

    // If any critical element is missing, throw an error to stop execution early
    if (!houseModelDetailsSectionButtons || !editModelDetailsBtn || !houseModelDetailsModal || !closeModelDetailsModalBtn ||
        !roomsContainer || !featuresContainer || !saveModelDetailsBtn || !cancelModelDetailsBtn) {
        const missingElements = [];
        if (!houseModelDetailsSectionButtons) missingElements.push('#houseModelDetailsSectionButtons');
        if (!editModelDetailsBtn) missingElements.push('#editModelDetailsBtn');
        if (!houseModelDetailsModal) missingElements.push('#houseModelDetailsModal');
        if (!closeModelDetailsModalBtn) missingElements.push('#closeModelDetailsModalBtn');
        if (!roomsContainer) missingElements.push('#roomsContainer');
        if (!featuresContainer) missingElements.push('#featuresContainer');
        if (!saveModelDetailsBtn) missingElements.push('#saveModelDetailsBtn');
        if (!cancelModelDetailsBtn) missingElements.push('#cancelModelDetailsBtn');
        
        const errorMessage = `Missing essential house model details elements for initialization: ${missingElements.join(', ')}. Check form.html IDs/structure.`;
        console.error("house-model-details-logic.js: initHouseModelDetails FAILED -", errorMessage);
        throw new Error(errorMessage);
    }
    // --- END CRITICAL INITIALIZATION CHECKS ---


    // Assign to module-level variables (after successful retrieval) for other functions to use
    // (This block ensures these vars are only populated if all elements are found)
    _houseModelDetailsSectionButtons = houseModelDetailsSectionButtons;
    _editModelDetailsBtn = editModelDetailsBtn;
    _houseModelDetailsModal = houseModelDetailsModal;
    _closeModelDetailsModalBtn = closeModelDetailsModalBtn;
    _roomsContainer = roomsContainer;
    _featuresContainer = featuresContainer;
    _saveModelDetailsBtn = saveModelDetailsBtn;
    _cancelModelDetailsBtn = cancelModelDetailsBtn;


    // Attach event listeners (now confident elements exist)
    _editModelDetailsBtn.addEventListener('click', openDetailsModal);
    _saveModelDetailsBtn.addEventListener('click', saveModelDetails);
    _cancelModelDetailsBtn.addEventListener('click', closeDetailsModal); 
    _closeModelDetailsModalBtn.addEventListener('click', closeDetailsModal); 
    
    // Close modal if clicking outside content
    _houseModelDetailsModal.addEventListener('click', (event) => {
        if (event.target === _houseModelDetailsModal) {
            closeDetailsModal();
        }
    });

    // Initial state: hide the modal and the main form's 'Edit Details' button
    _houseModelDetailsModal.classList.add('hidden');
    _editModelDetailsBtn.classList.add('hidden');
    _houseModelDetailsSectionButtons.classList.add('hidden'); // Also hide its container
}

// Module-level variables for internal use after successful init
let _houseModelDetailsSectionButtons;
let _editModelDetailsBtn;
let _houseModelDetailsModal;
let _closeModelDetailsModalBtn;
let _roomsContainer;
let _featuresContainer;
let _saveModelDetailsBtn;
let _cancelModelDetailsBtn;


/**
 * Opens the house model details modal and populates it.
 * This is primarily triggered by the 'Edit Details' button on the main form.
 */
async function openDetailsModal() {
    if (!currentHouseModelId) {
        alert("Please select a House Model to edit its details.");
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

        // Render content with editable fields using the module-level variables
        renderRooms(rooms, true); 
        renderFeatures(features, true); 
        setEditMode(true); // Enable all controls within the modal
        _houseModelDetailsModal.classList.remove('hidden'); // Show the modal
    } catch (error) {
        console.error("Failed to load house model details for modal:", error);
        alert("Error loading house model details for editing.");
        // If error, render empty editable fields so user can still add
        renderRooms([], true); 
        renderFeatures([], true); 
        setEditMode(true);
        _houseModelDetailsModal.classList.remove('hidden'); // Still try to open for manual entry
    } finally {
        hideLoading();
    }
}

/**
 * Closes the house model details modal.
 * This is triggered by 'Save Details', 'Cancel Edit', or the 'X' button.
 */
function closeDetailsModal() {
    _houseModelDetailsModal.classList.add('hidden'); // Hide the modal
    setEditMode(false); // Disable fields/hide add/remove buttons inside modal
    
    // After closing modal, re-render the *main form's* read-only display based on latest saved data
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
                
                // Call displayAndSetEditable for the main form's read-only view
                // We pass roomsDataJson and featuresDataJson, NOT the parsed arrays.
                // Re-stringifying for consistency with what displayAndSetEditable expects.
                displayAndSetEditable(currentHouseModelId, JSON.stringify(rooms), JSON.stringify(features), false); 
            })
            .catch(error => {
                console.error("Failed to re-load house model details after modal close:", error);
                // On error, revert to showing 'Edit Details' button but no read-only display
                displayAndSetEditable(currentHouseModelId, null, null, false); 
            })
            .finally(() => {
                hideLoading();
            });
    } else {
        // If no currentHouseModelId (e.g., in "Add New Plot" mode, and modal was opened by "Add New House Model"),
        // ensure the main form's details display (which doesn't exist for a new model) is reset.
        displayAndSetEditable(null, null, null, false); 
    }
}


/**
 * Displays house model details (rooms and features) and manages the 'Edit Details' button visibility.
 * This is now *primarily* used for managing the visibility of the 'Edit Details' button
 * on the main form, and for the initial state when *adding a NEW house model* via the dropdown,
 * which should open the modal directly into edit mode.
 *
 * @param {number|null} houseModelId The ID of the house model to display.
 * @param {string|null} roomsDataJson JSON string of rooms data.
 * @param {string|null} featuresDataJson JSON string of features data.
 * @param {boolean} editable True if fields should be editable (e.g., adding a new model).
 */
export function displayAndSetEditable(houseModelId, roomsDataJson, featuresDataJson, editable) {
    currentHouseModelId = houseModelId;

    // Control visibility of the 'Edit Details' button on the main form
    if (houseModelId) {
        _houseModelDetailsSectionButtons.classList.remove('hidden'); // Show the container for the button
        _editModelDetailsBtn.classList.remove('hidden'); // Show the button
    } else {
        _houseModelDetailsSectionButtons.classList.add('hidden'); // Hide the container for the button
        _editModelDetailsBtn.classList.add('hidden'); // Hide the button
    }

    // When adding a new House Model via its dropdown's 'Add' button:
    // This function will be called with houseModelId = null and editable = true.
    // In this specific case, we should directly open the modal.
    if (houseModelId === null && editable === true) {
        // Parse data (which will be empty here) to prepare the modal's content
        let rooms = [];
        let features = [];
        try {
            if (roomsDataJson) rooms = JSON.parse(roomsDataJson);
        } catch(e) { console.error("Error parsing roomsDataJson for new model:", e); }
        try {
            if (featuresDataJson) features = JSON.parse(featuresDataJson);
        } catch(e) { console.error("Error parsing featuresDataJson for new model:", e); }

        renderRooms(rooms, true); // Render with editable inputs (likely empty)
        renderFeatures(features, true); // Render with editable inputs (likely empty)
        setEditMode(true); // Ensure all controls within the modal are enabled
        _houseModelDetailsModal.classList.remove('hidden'); // Show the modal
    } 
    // If we're setting to non-editable, and the modal is currently open, close it.
    // This handles cases like changing parent dropdowns, or cancelling a new model entry.
    else if (editable === false && _houseModelDetailsModal && !_houseModelDetailsModal.classList.contains('hidden')) {
        closeDetailsModal();
    }
    // If it's an existing plot being loaded (editable false, houseModelId not null),
    // we don't open the modal; the 'Edit Details' button becomes visible on the main form.
    // The current renderRooms/renderFeatures for the main form is now effectively
    // 'off-screen' as it's within the modal.
}


/**
 * Sets the edit mode for the details section (inside modal) and updates button visibility.
 * @param {boolean} editMode True to enable editing, false to disable.
 */
export function setEditMode(editMode) {
    isEditModeActive = editMode;

    // Toggle main buttons within the modal
    _saveModelDetailsBtn.classList.toggle('hidden', !editMode);
    _cancelModelDetailsBtn.classList.toggle('hidden', !editMode);
    
    // --- IMPORTANT: Logic to add initial empty rows if needed when entering edit mode ---
    // This ensures that when a model with no existing rooms/features is edited,
    // or a brand new model is being defined, an input row is ready.
    if (editMode) {
        // Only add if no room items exist AND the add button is visible (meaning we're in an editable state)
        if (_roomsContainer.querySelectorAll('.room-item').length === 0 && _roomsContainer.querySelector('.add-room-btn')) {
            addRoom(); 
        }
        // Only add if no feature items exist AND the add button is visible (meaning we're in an editable state)
        if (_featuresContainer.querySelectorAll('.feature-item').length === 0 && _featuresContainer.querySelector('.add-feature-btn')) {
            addFeature(); 
        }
    }


    // Set editability of inputs within the modal
    _roomsContainer.querySelectorAll('input, select').forEach(input => {
        if (input.dataset.static !== 'true') { 
            input.disabled = !editMode;
        }
    });
    _featuresContainer.querySelectorAll('input, select').forEach(input => {
        if (input.dataset.static !== 'true') {
            input.disabled = !editMode;
        }
    });

    // Toggle add/remove buttons for rooms and features (within the modal)
    _roomsContainer.querySelectorAll('.add-room-btn, .remove-room-btn').forEach(btn => {
        btn.style.display = editMode ? 'inline-block' : 'none';
    });
    _featuresContainer.querySelectorAll('.add-feature-btn, .remove-feature-btn').forEach(btn => {
        btn.style.display = editMode ? 'inline-block' : 'none';
    });
}


/**
 * Renders the rooms in the UI.
 * @param {Array} rooms Array of room objects.
 * @param {boolean} editable True if inputs should be editable.
 */
function renderRooms(rooms, editable) {
    _roomsContainer.innerHTML = ''; // Clear existing rooms

    if (rooms && rooms.length > 0) {
        rooms.forEach((room, index) => {
            _roomsContainer.appendChild(createRoomElement(room, index, editable));
        });
    } 
    // The logic for adding an initial empty room if needed is now in setEditMode.
    // So here we only add the 'Add Room' button at the end if in editable mode.

    if (editable) {
        const addRoomBtn = document.createElement('button');
        addRoomBtn.type = 'button';
        addRoomBtn.textContent = 'Add Room';
        addRoomBtn.className = 'add-room-btn action-button-secondary mt-2';
        addRoomBtn.addEventListener('click', addRoom);
        _roomsContainer.appendChild(addRoomBtn);
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
    
    // Attach event listeners
    const removeBtn = div.querySelector('.remove-room-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => removeRoom(div));
    }

    const hasCheckbox = div.querySelector('.room-has-checkbox');
    const sizeInput = div.querySelector('.room-size-input');
    if (hasCheckbox && sizeInput) {
        hasCheckbox.addEventListener('change', () => {
            sizeInput.classList.toggle('hidden', !hasCheckbox.checked);
            // Clear size if unchecked
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
    // Check if the last existing room item has a name. If not, don't add another empty one.
    const currentRoomItems = _roomsContainer.querySelectorAll('.room-item');
    if (currentRoomItems.length > 0) {
        const lastRoomNameInput = currentRoomItems[currentRoomItems.length - 1].querySelector('.room-name-input');
        if (lastRoomNameInput && lastRoomNameInput.value.trim() === '') {
            // If the last one is empty, focus on it instead of adding a new one
            lastRoomNameInput.focus();
            return; 
        }
    }
    // Insert new room element before the 'Add Room' button (which is always the last child if present)
    _roomsContainer.insertBefore(createRoomElement(defaultRoom, currentRoomItems.length, true), _roomsContainer.lastChild);
}

/**
 * Removes a room element from the UI.
 * @param {HTMLElement} roomElement The room element to remove.
 */
function removeRoom(roomElement) {
    roomElement.remove();
    // If all rooms are removed and we are in edit mode, ensure at least one default empty room is present
    // This happens only if the 'Add Room' button is also present, indicating editable state.
    if (_roomsContainer.querySelectorAll('.room-item').length === 0 && isEditModeActive && _roomsContainer.querySelector('.add-room-btn')) {
        _roomsContainer.insertBefore(createRoomElement(defaultRoom, 0, true), _roomsContainer.lastChild);
    }
}


/**
 * Renders the features in the UI.
 * @param {Array} features Array of feature objects.
 * @param {boolean} editable True if inputs should be editable.
 */
function renderFeatures(features, editable) {
    _featuresContainer.innerHTML = ''; // Clear existing features

    if (features && features.length > 0) {
        features.forEach((feature, index) => {
            _featuresContainer.appendChild(createFeatureElement(feature, index, editable));
        });
    }
    // Logic for adding an initial empty feature if needed is now in setEditMode.

    if (editable) {
        const addFeatureBtn = document.createElement('button');
        addFeatureBtn.type = 'button';
        addFeatureBtn.textContent = 'Add Feature';
        addFeatureBtn.className = 'add-feature-btn action-button-secondary mt-2';
        addFeatureBtn.addEventListener('click', addFeature);
        _featuresContainer.appendChild(addFeatureBtn);
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
    // Attach event listener for remove button
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
    // Check if the last existing feature item has a name. If not, don't add another empty one.
    const currentFeatureItems = _featuresContainer.querySelectorAll('.feature-item');
    if (currentFeatureItems.length > 0) {
        const lastFeatureNameInput = currentFeatureItems[currentFeatureItems.length - 1].querySelector('.feature-name-input');
        if (lastFeatureNameInput && lastFeatureNameInput.value.trim() === '') {
            lastFeatureNameInput.focus();
            return;
        }
    }
    _featuresContainer.insertBefore(createFeatureElement(defaultFeature, currentFeatureItems.length, true), _featuresContainer.lastChild);
}

/**
 * Removes a feature element from the UI.
 * @param {HTMLElement} featureElement The feature element to remove.
 */
function removeFeature(featureElement) {
    featureElement.remove();
    if (_featuresContainer.querySelectorAll('.feature-item').length === 0 && isEditModeActive && _featuresContainer.querySelector('.add-feature-btn')) {
        _featuresContainer.insertBefore(createFeatureElement(defaultFeature, 0, true), _featuresContainer.lastChild);
    }
}


/**
 * Gathers the current rooms and features data from the UI.
 * @returns {object} An object containing arrays of room and feature data.
 */
export function getHouseModelDetailsData() {
    const rooms = [];
    _roomsContainer.querySelectorAll('.room-item').forEach(item => {
        const nameInput = item.querySelector('.room-name-input');
        const sizeInput = item.querySelector('.room-size-input');
        const hasCheckbox = item.querySelector('.room-has-checkbox');
        
        // Only include rooms that have a name
        if (nameInput && nameInput.value.trim()) { 
            rooms.push({
                name: nameInput.value.trim(),
                // Include size only if the checkbox is checked, otherwise empty string
                size: (hasCheckbox && hasCheckbox.checked) ? (sizeInput ? sizeInput.value.trim() : "") : "",
                has_room: hasCheckbox ? (hasCheckbox.checked ? 1 : 0) : 0
            });
        }
    });

    const features = [];
    _featuresContainer.querySelectorAll('.feature-item').forEach(item => {
        const nameInput = item.querySelector('.feature-name-input');
        const hasCheckbox = item.querySelector('.feature-has-checkbox');
        
        // Only include features that have a name
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

    // Basic validation: ensure at least one room or feature is defined with a name
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
