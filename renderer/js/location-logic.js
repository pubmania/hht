// renderer/js/location-logic.js

import { showLoading, hideLoading, populateDropdown } from './utils.js';

// DOM Element References (these will be passed from form-main.js)
let locationSelect;
let addNewLocationBtn;
let newLocationInputContainer;
let newLocationNameInput;
let saveNewLocationBtn;
let cancelNewLocationBtn;

/**
 * Initializes the location-related DOM elements and attaches event listeners.
 * @param {object} elements Object containing references to relevant DOM elements.
 */
export function initLocationLogic(elements) {
    locationSelect = elements.locationSelect;
    addNewLocationBtn = elements.addNewLocationBtn;
    newLocationInputContainer = elements.newLocationInputContainer;
    newLocationNameInput = elements.newLocationNameInput;
    saveNewLocationBtn = elements.saveNewLocationBtn;
    cancelNewLocationBtn = elements.cancelNewLocationBtn;

    // Attach event listeners for adding new location
    addNewLocationBtn.addEventListener('click', showNewLocationInput);
    cancelNewLocationBtn.addEventListener('click', hideNewLocationInput);
    saveNewLocationBtn.addEventListener('click', saveNewLocation);
}

/**
 * Populates the Location dropdown with data fetched from the main process.
 * @param {number|string|null} selectedLocationId The ID of the location to pre-select.
 */
export async function populateLocations(selectedLocationId = null) {
    showLoading();
    try {
        const locations = await window.api.getLookupItems('locations');
        populateDropdown(locationSelect, locations, 'Select Location', selectedLocationId);
    } catch (error) {
        console.error('location-logic.js: Error populating locations:', error);
        alert(`Error loading locations: ${error.message}`);
    } finally {
        hideLoading();
    }
}

/**
 * Reveals the input field and buttons for adding a new location.
 */
function showNewLocationInput() {
    newLocationInputContainer.classList.remove('hidden');
    newLocationNameInput.value = ''; // Clear previous input
    newLocationNameInput.focus();
    newLocationNameInput.disabled = false; // Ensure it's editable
    addNewLocationBtn.style.display = 'none'; // Hide the plus button
}

/**
 * Hides the input field and buttons for adding a new location.
 */
function hideNewLocationInput() {
    newLocationInputContainer.classList.add('hidden');
    newLocationNameInput.value = ''; // Clear the input
    addNewLocationBtn.style.display = ''; // Show the plus button
}

/**
 * Saves a new location to the database and updates the dropdown.
 */
async function saveNewLocation() {
    const newLocationName = newLocationNameInput.value.trim();
    if (!newLocationName) {
        alert('Please enter a name for the new location.');
        return;
    }

    showLoading();
    try {
        const response = await window.api.addLookupItem('locations', newLocationName);
        if (response.success) {
            alert(response.message);
            await populateLocations(response.id); // Re-populate and select the new item
            hideNewLocationInput(); // Hide the input field
        } else {
            alert(`Failed to add location: ${response.message}`);
        }
    } catch (error) {
        console.error('location-logic.js: Error adding new location:', error);
        alert(`Error adding new location: ${error.message || 'An unexpected error occurred.'}`);
    } finally {
        hideLoading();
    }
}

/**
 * Gathers and returns the selected location ID from the form.
 * @param {FormData} formData The FormData object from the form.
 * @returns {number|null} The selected location ID, or null if not selected.
 */
export function getLocationData(formData) {
    const selectedLocationId = formData.get("location_id");
    if (!selectedLocationId) {
        return null; // Or throw an error if selection is required
    }
    return Number(selectedLocationId);
}

