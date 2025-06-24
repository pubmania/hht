// renderer/js/house-model-logic.js

import { showLoading, hideLoading, populateDropdown } from './utils.js';
// ONLY import displayAndSetEditable and getHouseModelDetailsData.
// DO NOT import initHouseModelDetails here, as it's initialized by form-main.js.
import { displayAndSetEditable, getHouseModelDetailsData } from './house-model-details-logic.js'; 
import { initEditLookup } from './edit-lookup-logic.js'; 

// DOM Element References (passed from form-main.js)
let houseModelSelect;
let addNewHouseModelBtn;
let newHouseModelInputContainer;
let newHouseModelNameInput;
let saveNewHouseModelBtn;
let cancelNewHouseModelBtn;
let builderSelect; 

// Edit related elements for house model itself
let editHouseModelInputContainer;
let editHouseModelNameInput;
let saveHouseModelBtn;
let cancelHouseModelBtn;

let houseModelEditController; 


/**
 * Initializes the house model-related DOM elements and attaches event listeners.
 * @param {object} elements Object containing references to relevant DOM elements.
 * NOTE: This module NO LONGER calls initHouseModelDetails. That's handled by form-main.js.
 */
export function initHouseModelLogic(elements) {
    houseModelSelect = elements.houseModelSelect;
    addNewHouseModelBtn = elements.addNewHouseModelBtn;
    newHouseModelInputContainer = elements.newHouseModelInputContainer;
    newHouseModelNameInput = elements.newHouseModelNameInput;
    saveNewHouseModelBtn = elements.saveNewHouseModelBtn;
    cancelNewHouseModelBtn = elements.cancelNewHouseModelBtn;
    builderSelect = elements.builderSelect; 

    // **CRITICAL: Removed the problematic call to initHouseModelDetails from here.**
    // It should ONLY be called once from form-main.js to avoid double initialization.

    // Assign edit elements for the house model name itself
    editHouseModelInputContainer = elements.editHouseModelInputContainer;
    editHouseModelNameInput = elements.editHouseModelNameInput;
    saveHouseModelBtn = elements.saveHouseModelBtn;
    cancelHouseModelBtn = elements.cancelHouseModelBtn;

    // Attach event listeners for adding new house model
    addNewHouseModelBtn.addEventListener('click', showNewHouseModelInput);
    cancelNewHouseModelBtn.addEventListener('click', hideNewHouseModelInput);
    saveNewHouseModelBtn.addEventListener('click', saveNewHouseModel);

    // Initialize inline editing for house model name and capture the controller instance
    houseModelEditController = initEditLookup({
        selectElement: houseModelSelect,
        addNewBtn: addNewHouseModelBtn,
        newContainer: newHouseModelInputContainer,
        newNameInput: newHouseModelNameInput,
        saveNewBtn: saveNewHouseModelBtn,
        cancelNewBtn: cancelNewHouseModelBtn,
        editInputContainer: editHouseModelInputContainer,
        editNameInput: editHouseModelNameInput,
        saveEditBtn: saveHouseModelBtn,
        cancelEditBtn: cancelHouseModelBtn
    }, 'house_models', populateHouseModels, populateHouseModels); 


    // Listen for changes in house model selection to display details
    houseModelSelect.addEventListener('change', async () => {
        const selectedHouseModelId = houseModelSelect.value;
        if (selectedHouseModelId) {
            showLoading();
            try {
                const modelData = await window.api.getHouseModelDetailsById(Number(selectedHouseModelId));
                // Display read-only details on the main form, and enable the 'Edit Details' button
                displayAndSetEditable(Number(selectedHouseModelId), modelData.rooms_data, modelData.features_data, false); 
            } catch (error) {
                console.error('house-model-logic.js: Error fetching house model details on selection:', error);
                alert('Error loading house model details.');
                displayAndSetEditable(null, null, null, false); // Clear on error
            } finally {
                hideLoading();
            }
        } else {
            // If no house model is selected, hide details and the 'Edit Details' button
            displayAndSetEditable(null, null, null, false);
        }
    });
}

/**
 * Populates the House Model dropdown based on the selected Builder.
 * @param {number|string|null} builderId The ID of the selected builder.
 * @param {number|string|null} selectedHouseModelId The ID of the house model to pre-select.
 */
export async function populateHouseModels(builderId, selectedHouseModelId = null) {
    houseModelSelect.disabled = true;
    addNewHouseModelBtn.disabled = true;
    houseModelSelect.innerHTML = '<option value="">Select House Model</option>';
    // Always clear details and hide the button when repopulating models
    displayAndSetEditable(null, null, null, false); 

    if (houseModelEditController) { 
        houseModelEditController.editInputContainer.classList.add('hidden'); // Ensure edit input is hidden
    }


    if (!builderId) {
        hideLoading();
        return;
    }

    showLoading();
    try {
        const houseModels = await window.api.getHouseModelsByBuilder(Number(builderId));
        populateDropdown(houseModelSelect, houseModels, 'Select House Model', selectedHouseModelId);
        houseModelSelect.disabled = false;
        addNewHouseModelBtn.disabled = false;

        // After populating, tell this specific instance to update its control states
        if (houseModelEditController) {
            houseModelEditController.toggleState();
        }

        // If a model was selected (e.g., on plot load), display its details in read-only mode
        if (selectedHouseModelId && houseModels.some(model => model.id == selectedHouseModelId)) {
            const modelData = await window.api.getHouseModelDetailsById(Number(selectedHouseModelId));
            displayAndSetEditable(Number(selectedHouseModelId), modelData.rooms_data, modelData.features_data, false);
        } else {
            // If no model is selected or the previously selected one is no longer valid, clear details
            displayAndSetEditable(null, null, null, false);
        }

    } catch (error) {
        console.error('house-model-logic.js: Error populating house models:', error);
        alert(`Error loading house models: ${error.message}`);
    } finally {
        hideLoading();
    }
}

/**
 * Reveals the input field and buttons for adding a new house model.
 * After showing the name input, it should immediately open the details modal
 * for the user to define rooms/features for this *new* model.
 */
function showNewHouseModelInput() {
    newHouseModelInputContainer.classList.remove('hidden');
    newHouseModelNameInput.value = '';
    newHouseModelNameInput.focus();
    newHouseModelNameInput.disabled = false;
    
    // When adding a new model, we pass null for houseModelId, but editable: true.
    // This tells displayAndSetEditable to open the modal with empty editable fields.
    displayAndSetEditable(null, null, null, true); 
}

/**
 * Hides the input field and buttons for adding a new house model.
 * Also closes the modal if it was opened for a new model creation.
 */
function hideNewHouseModelInput() {
    newHouseModelInputContainer.classList.add('hidden');
    newHouseModelNameInput.value = '';
    
    // After hiding new model input, reset the details display.
    // If a model was previously selected, re-populate to revert.
    const selectedHouseModelId = houseModelSelect.value;
    if (selectedHouseModelId) {
        populateHouseModels(builderSelect.value, selectedHouseModelId); 
    } else {
        displayAndSetEditable(null, null, null, false);
    }
}

/**
 * Saves a new house model to the database and updates the dropdown.
 */
async function saveNewHouseModel() {
    const newHouseModelName = newHouseModelNameInput.value.trim();
    const selectedBuilderId = builderSelect.value;

    if (!newHouseModelName) {
        alert('Please enter a name for the new house model.');
        return;
    }
    if (!selectedBuilderId) {
        alert('Please select a Builder before adding a new House Model.');
        return;
    }

    // Get rooms and features data from the currently active modal
    const { rooms, features } = getHouseModelDetailsData();

    // Basic validation for rooms/features when adding a new model
    if (rooms.length === 0 && features.length === 0) {
        alert("Please add at least one room or feature with a name for the new house model.");
        return;
    }

    showLoading();
    try {
        const roomsJson = JSON.stringify(rooms);
        const featuresJson = JSON.stringify(features);

        const response = await window.api.addLookupItem(
            'house_models', newHouseModelName, Number(selectedBuilderId), roomsJson, featuresJson
        );
        if (response.success) {
            alert(response.message);
            // After successful save, populate models, selecting the new one
            await populateHouseModels(Number(selectedBuilderId), response.id);
            hideNewHouseModelInput(); // This will also close the modal if it was open for new model entry
        } else {
            alert(`Failed to add house model: ${response.message}`);
        }
    } catch (error) {
        console.error('house-model-logic.js: Error adding new house model:', error);
        alert(`Error adding new house model: ${error.message || 'An unexpected error occurred.'}`);
    } finally {
        hideLoading();
    }
}

/**
 * Gathers and returns the selected house model ID from the form.
 * @param {FormData} formData The FormData object from the form.
 * @returns {number|null} The selected house model ID, or null if not selected.
 */
export function getHouseModelData(formData) {
    const selectedHouseModelId = formData.get("house_model_id");
    if (!selectedHouseModelId) {
        return null;
    }
    return Number(selectedHouseModelId);
}
