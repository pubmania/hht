// renderer/js/edit-lookup-logic.js

/**
 * Manages the inline adding/editing functionality for lookup fields.
 * This class abstracts the logic for showing/hiding input fields and handling
 * save/cancel actions for dynamic dropdown options.
 */
class EditLookupController {
    constructor(elements, lookupType, populateFunction, refreshParentDropdown) {
        this.selectElement = elements.selectElement;
        this.addNewBtn = elements.addNewBtn;
        this.newContainer = elements.newContainer;
        this.newNameInput = elements.newNameInput;
        this.saveNewBtn = elements.saveNewBtn;
        this.cancelNewBtn = elements.cancelNewBtn;

        // ******* CRITICAL FIX HERE *******
        // Ensure editInputContainer is correctly assigned
        this.editInputContainer = elements.editInputContainer; 
        // *********************************

        this.editNameInput = elements.editNameInput;
        this.saveEditBtn = elements.saveEditBtn;
        this.cancelEditBtn = elements.cancelEditBtn;

        this.lookupType = lookupType;
        this.populateFunction = populateFunction;
        this.refreshParentDropdown = refreshParentDropdown; // Function to call to refresh parent dropdown after item link/unlink

        this.initEventListeners();
        this.toggleState(); // Set initial state
    }

    initEventListeners() {
        // Event listeners for adding new item
        if (this.addNewBtn) {
            this.addNewBtn.addEventListener('click', this.showNewInput.bind(this));
        }
        if (this.cancelNewBtn) {
            this.cancelNewBtn.addEventListener('click', this.hideNewInput.bind(this));
        }
        if (this.saveNewBtn) {
            this.saveNewBtn.addEventListener('click', this.saveNewItem.bind(this));
        }

        // Event listeners for editing existing item
        // The edit button needs to be dynamically created and attached later by populateDropdown
        // This controller just provides the handlers.
        if (this.saveEditBtn) {
            this.saveEditBtn.addEventListener('click', this.saveEditedItem.bind(this));
        }
        if (this.cancelEditBtn) {
            this.cancelEditBtn.addEventListener('click', this.hideEditInput.bind(this));
        }
    }

    // Toggles the visibility and state of 'Add New' and 'Edit' sections
    toggleState() {
        if (this.newContainer) {
            this.newContainer.classList.add('hidden'); // Hide 'Add New' by default
            if (this.newNameInput) this.newNameInput.value = '';
        }
        // ******* CRITICAL FIX HERE *******
        // This ensures the edit container is also hidden initially or after state changes
        if (this.editInputContainer) {
             console.log(`edit-lookup-logic.js: ${this.lookupType} - Toggling editInputContainer to hidden.`);
            this.editInputContainer.classList.add('hidden'); // Hide 'Edit Item' by default
            if (this.editNameInput) this.editNameInput.value = '';
        } else {
             console.warn(`edit-lookup-logic.js: ${this.lookupType} - editInputContainer is null/undefined during toggleState.`);
        }
        // *********************************
       
        // Enable/disable add button based on parent selection
        if (this.addNewBtn && this.selectElement) {
            // Assume the selectElement's selected value determines if an 'add new' can occur
            // For locations, this might always be true. For developments, it depends on location.
            // This logic is typically handled by the calling module (e.g. form-main.js)
            // disabling/enabling the addNewBtn directly or by passing null to populateFunction.
        }
    }

    showNewInput() {
        if (this.newContainer) {
            this.newContainer.classList.remove('hidden');
        }
        if (this.newNameInput) {
            this.newNameInput.value = '';
            this.newNameInput.focus();
        }
        // Hide edit input if 'Add New' is shown
        if (this.editInputContainer) {
            this.editInputContainer.classList.add('hidden');
        }
    }

    hideNewInput() {
        if (this.newContainer) {
            this.newContainer.classList.add('hidden');
        }
        if (this.newNameInput) {
            this.newNameInput.value = '';
        }
        this.populateFunction(this.selectElement.value, this.selectElement.value); // Re-populate to restore selected value
    }

    async saveNewItem() {
        const newName = this.newNameInput.value.trim();
        if (!newName) {
            alert(`Please enter a name for the new ${this.lookupType.replace('_', ' ')}.`);
            return;
        }

        const parentId = this.selectElement ? Number(this.selectElement.value) : null;

        // Special handling for house models to include rooms/features
        let roomsData = null;
        let featuresData = null;
        if (this.lookupType === 'house_models') {
            // ********** CRITICAL DEBUG STEP **********
            // getHouseModelDetailsData is currently commented out in house-model-logic.js
            // and house-model-details-logic.js is renamed. So we can't call this.
            // Re-enable this when house-model-details-logic.js is restored.
            // if (typeof getHouseModelDetailsData !== 'undefined') {
            //     const details = getHouseModelDetailsData();
            //     roomsData = JSON.stringify(details.rooms);
            //     featuresData = JSON.stringify(details.features);
            // } else {
            //     console.warn("getHouseModelDetailsData is not available. Saving house model without details.");
            // }
            // *******************************************
        }

        showLoading();
        try {
            const response = await window.api.addLookupItem(this.lookupType, newName, parentId, roomsData, featuresData);
            if (response.success) {
                alert(response.message);
                this.hideNewInput(); // This will also refresh the dropdown
                await this.populateFunction(parentId, response.id); // Refresh dropdown and select new item
                // If this is a child lookup (e.g., Development after Location), also refresh the parent dropdown if needed
                if (this.refreshParentDropdown && this.lookupType === 'developments' && this.selectElement) {
                    await this.refreshParentDropdown(this.selectElement.value, response.id);
                }
            } else {
                alert(`Failed to add ${this.lookupType.replace('_', ' ')}: ${response.message}`);
            }
        } catch (error) {
            console.error(`Error adding new ${this.lookupType.replace('_', ' ')}:`, error);
            alert(`Error adding new ${this.lookupType.replace('_', ' ')}: ${error.message || 'An unexpected error occurred.'}`);
        } finally {
            hideLoading();
        }
    }

    showEditInput(itemId, currentName) {
        if (this.editInputContainer) {
            this.editInputContainer.classList.remove('hidden');
        }
        if (this.editNameInput) {
            this.editNameInput.value = currentName;
            this.editNameInput.dataset.editingId = itemId; // Store ID being edited
            this.editNameInput.focus();
        }
        // Hide new input if 'Edit' is shown
        if (this.newContainer) {
            this.newContainer.classList.add('hidden');
        }
    }

    hideEditInput() {
        if (this.editInputContainer) {
            this.editInputContainer.classList.add('hidden');
        }
        if (this.editNameInput) {
            this.editNameInput.value = '';
            delete this.editNameInput.dataset.editingId;
        }
        this.populateFunction(this.selectElement.value, this.selectElement.value); // Re-populate to restore selected value
    }

    async saveEditedItem() {
        const editedName = this.editNameInput.value.trim();
        const itemId = this.editNameInput.dataset.editingId;
        
        if (!editedName) {
            alert(`Please enter a name for the ${this.lookupType.replace('_', ' ')}.`);
            return;
        }
        if (!itemId) {
            alert('No item selected for editing.');
            return;
        }

        // Special handling for house models to include rooms/features if they were edited
        let roomsData = null;
        let featuresData = null;
        if (this.lookupType === 'house_models') {
             // ********** CRITICAL DEBUG STEP **********
             // getHouseModelDetailsData is currently commented out in house-model-logic.js
             // and house-model-details-logic.js is renamed. So we can't call this.
             // Re-enable this when house-model-details-logic.js is restored.
            // if (typeof getHouseModelDetailsData !== 'undefined') {
            //     const details = getHouseModelDetailsData();
            //     roomsData = JSON.stringify(details.rooms);
            //     featuresData = JSON.stringify(details.features);
            // } else {
            //     console.warn("getHouseModelDetailsData is not available. Updating house model without details.");
            // }
            // *******************************************
        }

        showLoading();
        try {
            const response = await window.api.updateLookupItem(this.lookupType, Number(itemId), editedName, roomsData, featuresData);
            if (response.success) {
                alert(response.message);
                this.hideEditInput(); // This will also refresh the dropdown
                await this.populateFunction(this.selectElement.value, Number(itemId)); // Refresh dropdown and re-select edited item
            } else {
                alert(`Failed to update ${this.lookupType.replace('_', ' ')}: ${response.message}`);
            }
        } catch (error) {
            console.error(`Error updating ${this.lookupType.replace('_', ' ')}:`, error);
            alert(`Error updating ${this.lookupType.replace('_', ' ')}: ${error.message || 'An unexpected error occurred.'}`);
        } finally {
            hideLoading();
        }
    }
}

/**
 * Factory function to create and return an instance of EditLookupController.
 * This is the public interface for other modules to use this functionality.
 * @param {object} elements Object containing references to relevant DOM elements.
 * @param {string} lookupType The type of lookup item (e.g., 'locations', 'developments', 'builders', 'house_models').
 * @param {function} populateFunction The function from the calling module to refresh its dropdown.
 * @param {function} refreshParentDropdown Optional: Function to refresh parent dropdown (e.g. for development linking to location).
 * @returns {EditLookupController} An instance of the controller.
 */
export function initEditLookup(elements, lookupType, populateFunction, refreshParentDropdown = null) {
    console.log(`edit-lookup-logic.js: initEditLookup for ${lookupType}. Initial select value: '${elements.selectElement ? elements.selectElement.value : ''}', options count: ${elements.selectElement ? elements.selectElement.options.length : 0}`);
    return new EditLookupController(elements, lookupType, populateFunction, refreshParentDropdown);
}
