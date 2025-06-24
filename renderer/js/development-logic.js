// renderer/js/development-logic.js

import { showLoading, hideLoading, populateDropdown } from './utils.js';

// DOM Element References (passed from form-main.js)
let developmentSelect;
let addNewDevelopmentBtn;
let newDevelopmentInputContainer;
let newDevelopmentNameInput;
let saveNewDevelopmentBtn;
let cancelNewDevelopmentBtn;
let locationSelect; // Need reference to parent dropdown for filtering

/**
 * Initializes the development-related DOM elements and attaches event listeners.
 * @param {object} elements Object containing references to relevant DOM elements.
 */
export function initDevelopmentLogic(elements) {
    developmentSelect = elements.developmentSelect;
    addNewDevelopmentBtn = elements.addNewDevelopmentBtn;
    newDevelopmentInputContainer = elements.newDevelopmentInputContainer;
    newDevelopmentNameInput = elements.newDevelopmentNameInput;
    saveNewDevelopmentBtn = elements.saveNewDevelopmentBtn;
    cancelNewDevelopmentBtn = elements.cancelNewDevelopmentBtn;
    locationSelect = elements.locationSelect; // From parent scope for cascading

    // Attach event listeners for adding new development
    addNewDevelopmentBtn.addEventListener('click', showNewDevelopmentInput);
    cancelNewDevelopmentBtn.addEventListener('click', hideNewDevelopmentInput);
    saveNewDevelopmentBtn.addEventListener('click', saveNewDevelopment);
}

/**
 * Populates the Development dropdown based on the selected Location.
 * @param {number|string|null} locationId The ID of the selected location.
 * @param {number|string|null} selectedDevelopmentId The ID of the development to pre-select.
 */
export async function populateDevelopments(locationId, selectedDevelopmentId = null) {
    developmentSelect.disabled = true; // Disable until loaded or if no location
    addNewDevelopmentBtn.disabled = true; // Disable add button as well
    developmentSelect.innerHTML = '<option value="">Select Development</option>'; // Clear existing

    if (!locationId) {
        // No location selected, so no developments to show
        hideLoading(); // Ensure loading is hidden if called without location
        return;
    }

    showLoading();
    try {
        const developments = await window.api.getDevelopmentsByLocation(Number(locationId));
        populateDropdown(developmentSelect, developments, 'Select Development', selectedDevelopmentId);
        developmentSelect.disabled = false; // Enable once populated
        addNewDevelopmentBtn.disabled = false; // Enable add button
    } catch (error) {
        console.error('development-logic.js: Error populating developments:', error);
        alert(`Error loading developments: ${error.message}`);
    } finally {
        hideLoading();
    }
}

/**
 * Reveals the input field and buttons for adding a new development.
 */
function showNewDevelopmentInput() {
    newDevelopmentInputContainer.classList.remove('hidden');
    newDevelopmentNameInput.value = ''; // Clear previous input
    newDevelopmentNameInput.focus();
    newDevelopmentNameInput.disabled = false; // Ensure it's editable
    addNewDevelopmentBtn.style.display = 'none'; // Hide the plus button
}

/**
 * Hides the input field and buttons for adding a new development.
 */
function hideNewDevelopmentInput() {
    newDevelopmentInputContainer.classList.add('hidden');
    newDevelopmentNameInput.value = ''; // Clear the input
    addNewDevelopmentBtn.style.display = ''; // Show the plus button
}

/**
 * Saves a new development to the database and updates the dropdown.
 */
async function saveNewDevelopment() {
    const newDevelopmentName = newDevelopmentNameInput.value.trim();
    const selectedLocationId = locationSelect.value; // Get the currently selected Location ID

    if (!newDevelopmentName) {
        alert('Please enter a name for the new development.');
        return;
    }
    if (!selectedLocationId) {
        alert('Please select a Location before adding a new Development.');
        return;
    }

    showLoading();
    try {
        // Use 'developments' table name and pass locationId as parentId
        const response = await window.api.addLookupItem('developments', newDevelopmentName, Number(selectedLocationId));
        if (response.success) {
            alert(response.message);
            // Re-populate developments and select the new one
            await populateDevelopments(Number(selectedLocationId), response.id);
            hideNewDevelopmentInput(); // Hide the input field
        } else {
            alert(`Failed to add development: ${response.message}`);
        }
    } catch (error) {
        console.error('development-logic.js: Error adding new development:', error);
        alert(`Error adding new development: ${error.message || 'An unexpected error occurred.'}`);
    } finally {
        hideLoading();
    }
}

/**
 * Gathers and returns the selected development ID from the form.
 * @param {FormData} formData The FormData object from the form.
 * @returns {number|null} The selected development ID, or null if not selected.
 */
export function getDevelopmentData(formData) {
    const selectedDevelopmentId = formData.get("development_id");
    if (!selectedDevelopmentId) {
        return null;
    }
    return Number(selectedDevelopmentId);
}
