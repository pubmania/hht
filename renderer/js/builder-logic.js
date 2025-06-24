// renderer/js/builder-logic.js

import { showLoading, hideLoading, populateDropdown } from './utils.js';

// DOM Element References (passed from form-main.js)
let builderSelect;
let addNewBuilderBtn;
let newBuilderInputContainer;
let newBuilderNameInput;
let saveNewBuilderBtn;
let cancelNewBuilderBtn;
let linkBuilderToDevelopmentContainer; // For linking existing builder
let existingBuilderSelect;
let saveLinkBuilderBtn;
let cancelLinkBuilderBtn;
let developmentSelect; // Need reference to parent dropdown for filtering and linking

// State to keep track of if we're in 'add new builder' mode or 'link existing' mode
let currentAddMode = null; // 'new' or 'link'

/**
 * Initializes the builder-related DOM elements and attaches event listeners.
 * @param {object} elements Object containing references to relevant DOM elements.
 */
export function initBuilderLogic(elements) {
    builderSelect = elements.builderSelect;
    addNewBuilderBtn = elements.addNewBuilderBtn;
    newBuilderInputContainer = elements.newBuilderInputContainer;
    newBuilderNameInput = elements.newBuilderNameInput;
    saveNewBuilderBtn = elements.saveNewBuilderBtn;
    cancelNewBuilderBtn = elements.cancelNewBuilderBtn;
    linkBuilderToDevelopmentContainer = elements.linkBuilderToDevelopmentContainer;
    existingBuilderSelect = elements.existingBuilderSelect;
    saveLinkBuilderBtn = elements.saveLinkBuilderBtn;
    cancelLinkBuilderBtn = elements.cancelLinkBuilderBtn;
    developmentSelect = elements.developmentSelect; // From parent scope for cascading

    // Attach event listeners for adding new builder / linking
    addNewBuilderBtn.addEventListener('click', toggleNewBuilderInput);
    cancelNewBuilderBtn.addEventListener('click', hideNewBuilderInput);
    saveNewBuilderBtn.addEventListener('click', saveNewBuilder);

    cancelLinkBuilderBtn.addEventListener('click', hideLinkBuilderInput);
    saveLinkBuilderBtn.addEventListener('click', saveLinkBuilder);
}

/**
 * Toggles the display of the new builder input container (prompts user for 'new' or 'link').
 */
function toggleNewBuilderInput() {
    const selectedDevelopmentId = developmentSelect.value;
    if (!selectedDevelopmentId) {
        alert('Please select a Development before adding or linking a Builder.');
        return;
    }

    // Instead of directly showing newBuilderInputContainer, we'll offer a choice
    // For now, simplify and just show newBuilderInputContainer.
    // A more advanced UI would present "Add New" or "Link Existing" buttons.
    showNewBuilderInput(); // Directly show the 'add new' input for simplicity in this step
}


/**
 * Reveals the input field and buttons for adding a new builder.
 * This function also populates the 'link existing' dropdown, but keeps it hidden initially.
 */
async function showNewBuilderInput() {
    // Populate the existing builders for the "Link Existing" dropdown first
    await populateExistingBuildersToLink(); // Populate this dropdown
    
    newBuilderInputContainer.classList.remove('hidden');
    newBuilderNameInput.value = ''; // Clear previous input
    newBuilderNameInput.focus();
    newBuilderNameInput.disabled = false; // Ensure it's editable
    addNewBuilderBtn.style.display = 'none'; // Hide the plus button

    // Initially hide the 'link existing' section and show 'add new' by default
    linkBuilderToDevelopmentContainer.classList.add('hidden');
    currentAddMode = 'new'; // Set mode to 'new'

    // You could add buttons here to switch between 'new' and 'link'
    // For this step, we'll just show the 'new' input by default.
    // The 'link existing' section is only for a future enhancement, not active here.
}

/**
 * Hides the input field and buttons for adding a new builder.
 */
function hideNewBuilderInput() {
    newBuilderInputContainer.classList.add('hidden');
    newBuilderNameInput.value = ''; // Clear the input
    addNewBuilderBtn.style.display = ''; // Show the plus button
    hideLinkBuilderInput(); // Ensure link section is also hidden
    currentAddMode = null;
}

/**
 * Hides the input field and buttons for linking an existing builder.
 */
function hideLinkBuilderInput() {
    linkBuilderToDevelopmentContainer.classList.add('hidden');
    existingBuilderSelect.value = '';
    currentAddMode = null;
}

/**
 * Populates the Builder dropdown based on the selected Development.
 * @param {number|string|null} developmentId The ID of the selected development.
 * @param {number|string|null} selectedBuilderId The ID of the builder to pre-select.
 */
export async function populateBuilders(developmentId, selectedBuilderId = null) {
    builderSelect.disabled = true; // Disable until loaded or if no development
    addNewBuilderBtn.disabled = true; // Disable add button as well
    builderSelect.innerHTML = '<option value="">Select Builder</option>'; // Clear existing

    if (!developmentId) {
        // No development selected, so no builders to show
        hideLoading(); // Ensure loading is hidden if called without development
        return;
    }

    showLoading();
    try {
        // Get builders specific to this development via the junction table
        const builders = await window.api.getBuildersByDevelopment(Number(developmentId));
        populateDropdown(builderSelect, builders, 'Select Builder', selectedBuilderId);
        builderSelect.disabled = false; // Enable once populated
        addNewBuilderBtn.disabled = false; // Enable add button
    } catch (error) {
        console.error('builder-logic.js: Error populating builders:', error);
        alert(`Error loading builders: ${error.message}`);
    } finally {
        hideLoading();
    }
}

/**
 * Populates the 'Select Builder to Link' dropdown with all existing builders.
 * This is used when the user wants to link an existing builder to the current development.
 */
async function populateExistingBuildersToLink() {
    showLoading();
    try {
        const allBuilders = await window.api.getLookupItems('builders');
        populateDropdown(existingBuilderSelect, allBuilders, 'Select Builder to Link');
    } catch (error) {
        console.error('builder-logic.js: Error populating existing builders for linking:', error);
        alert(`Error loading existing builders: ${error.message}`);
    } finally {
        hideLoading();
    }
}

/**
 * Saves a new builder to the database and optionally links it to the current development.
 */
async function saveNewBuilder() {
    const newBuilderName = newBuilderNameInput.value.trim();
    const selectedDevelopmentId = developmentSelect.value; // Get the currently selected Development ID

    if (!newBuilderName) {
        alert('Please enter a name for the new builder.');
        return;
    }
    if (!selectedDevelopmentId) { // Should not happen if button is disabled, but good check
        alert('Please select a Development before adding a new Builder.');
        return;
    }

    showLoading();
    try {
        // Add the new builder to the 'builders' table
        const response = await window.api.addLookupItem('builders', newBuilderName);
        if (response.success) {
            alert(response.message);
            const newBuilderId = response.id;
            
            // Now, link this new builder to the currently selected development
            const linkResponse = await window.api.addDevelopmentBuilderLink(Number(selectedDevelopmentId), newBuilderId);
            if (linkResponse.success) {
                alert(linkResponse.message);
                // Re-populate builders for the current development and select the new one
                await populateBuilders(Number(selectedDevelopmentId), newBuilderId);
                hideNewBuilderInput(); // Hide the input field
            } else {
                alert(`Failed to link new builder to development: ${linkResponse.message}`);
                // Even if linking fails, the builder is added, so we should still update
                await populateBuilders(Number(selectedDevelopmentId), newBuilderId);
                hideNewBuilderInput();
            }
        } else {
            alert(`Failed to add builder: ${response.message}`);
        }
    } catch (error) {
        console.error('builder-logic.js: Error adding new builder:', error);
        alert(`Error adding new builder: ${error.message || 'An unexpected error occurred.'}`);
    } finally {
        hideLoading();
    }
}

/**
 * Links an existing builder to the currently selected development.
 */
async function saveLinkBuilder() {
    const builderToLinkID = existingBuilderSelect.value;
    const selectedDevelopmentId = developmentSelect.value;

    if (!builderToLinkID) {
        alert('Please select a builder to link.');
        return;
    }
    if (!selectedDevelopmentId) { // Should not happen if button disabled
        alert('Please select a Development before linking a Builder.');
        return;
    }

    showLoading();
    try {
        const response = await window.api.addDevelopmentBuilderLink(Number(selectedDevelopmentId), Number(builderToLinkID));
        if (response.success) {
            alert(response.message);
            // Re-populate builders for the current development and select the linked one
            await populateBuilders(Number(selectedDevelopmentId), Number(builderToLinkID));
            hideLinkBuilderInput(); // Hide the linking field
        } else {
            alert(`Failed to link builder: ${response.message}`);
        }
    } catch (error) {
        console.error('builder-logic.js: Error linking builder:', error);
        alert(`Error linking builder: ${error.message || 'An unexpected error occurred.'}`);
    } finally {
        hideLoading();
    }
}


/**
 * Gathers and returns the selected builder ID from the form.
 * @param {FormData} formData The FormData object from the form.
 * @returns {number|null} The selected builder ID, or null if not selected.
 */
export function getBuilderData(formData) {
    const selectedBuilderId = formData.get("builder_id");
    if (!selectedBuilderId) {
        return null;
    }
    return Number(selectedBuilderId);
}
