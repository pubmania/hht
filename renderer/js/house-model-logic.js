// renderer/js/house-model-logic.js

import { showLoading, hideLoading, populateDropdown } from './utils.js';
// ********** RE-ENABLE THIS IMPORT **********
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
 */
export function initHouseModelLogic(elements) {
    houseModelSelect = elements.houseModelSelect;
    addNewHouseModelBtn = elements.addNewHouseModelBtn;
    newHouseModelInputContainer = elements.newHouseModelInputContainer;
    newHouseModelNameInput = elements.newHouseModelNameInput;
    saveNewHouseModelBtn = elements.saveNewHouseModelBtn;
    cancelNewHouseModelBtn = elements.cancelNewHouseModelBtn;
    builderSelect = elements.builderSelect; 

    // Assign edit elements for the house model name itself
    editHouseModelInputContainer = elements.editHouseModelInputContainer;
    editHouseModelNameInput = elements.editHouseModelNameInput;
    saveHouseModelBtn = elements.saveHouseModelBtn;
    cancelHouseModelBtn = elements.cancelHouseModelBtn;

    // ***** DEBUG LOG: Check if editHouseModelInputContainer is found on init *****
    console.log("house-model-logic.js: initHouseModelLogic - editHouseModelInputContainer:", editHouseModelInputContainer);


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

    // ***** DEBUG LOG: Check houseModelEditController after initEditLookup *****
    console.log("house-model-logic.js: initHouseModelLogic - houseModelEditController:", houseModelEditController);
    console.log("house-model-logic.js: initHouseModelLogic - houseModelEditController.editInputContainer:", houseModelEditController ? houseModelEditController.editInputContainer : 'N/A');


    // Listen for changes in house model selection to display details
    houseModelSelect.addEventListener('change', async () => {
        const selectedHouseModelId = houseModelSelect.value;
        if (selectedHouseModelId) {
            showLoading();
            try {
                const modelData = await window.api.getHouseModelDetailsById(Number(selectedHouseModelId));
                // ********** RE-ENABLE THIS CALL **********
                displayAndSetEditable(Number(selectedHouseModelId), modelData.rooms_data, modelData.features_data, false); 
            } catch (error) {
                console.error('house-model-logic.js: Error fetching house model details on selection:', error);
                alert('Error loading house model details.');
                // ********** RE-ENABLE THIS CALL **********
                displayAndSetEditable(null, null, null, false); // Clear on error
            } finally {
                hideLoading();
            }
        } else {
            // If no house model is selected, hide details and the 'Edit Details' button
            // ********** RE-ENABLE THIS CALL **********
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
    // ********** RE-ENABLE THIS CALL **********
    displayAndSetEditable(null, null, null, false); 

    // ***** DEBUG LOG: Check houseModelEditController before the problematic line *****
    console.log("house-model-logic.js: populateHouseModels - houseModelEditController:", houseModelEditController);
    console.log("house-model-logic.js: populateHouseModels - houseModelEditController.editInputContainer:", houseModelEditController ? houseModelEditController.editInputContainer : 'N/A');

    if (houseModelEditController) { 
        // This line should now work correctly after edit-lookup-logic.js fix
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
            // ********** RE-ENABLE THIS CALL **********
            displayAndSetEditable(Number(selectedHouseModelId), modelData.rooms_data, modelData.features_data, false);
        } else {
            // If no model is selected or the previously selected one is no longer valid, clear details
            // ********** RE-ENABLE THIS CALL **********
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
    
    // ********** RE-ENABLE THIS CALL **********
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
        // ********** RE-ENABLE THIS CALL **********
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

    // ********** RE-ENABLE THIS CALL **********
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

        // Call addLookupItem with roomsJson and featuresJson
        const response = await window.api.addLookupItem(
            'house_models', newHouseModelName, Number(selectedBuilderId), roomsJson, featuresJson
        );
        if (response.success) {
            alert(response.message);
            // After successful save, populate models, selecting the new one
            await populateHouseModels(Number(selectedBuilderId), response.id);
            hideNewHouseModelInput(); 
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
