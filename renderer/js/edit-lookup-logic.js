// renderer/js/edit-lookup-logic.js

import { showLoading, hideLoading } from './utils.js';

/**
 * Initializes inline editing for a lookup dropdown, creating an independent instance.
 * All internal variables and functions are now scoped to this instance via closure.
 *
 * @param {object} elements Object containing DOM references for the lookup control.
 * @param {string} tableName The name of the database table (e.g., 'locations', 'builders').
 * @param {function} refreshFunction The function to call to re-populate the dropdown after changes.
 * @param {function} [parentLookupCheck=null] Optional function (e.g., for developments/house models) to re-evaluate parent selection after an edit.
 * @returns {object} An object with methods to control this specific lookup's editing UI.
 */
export function initEditLookup(elements, tableName, refreshFunction, parentLookupCheck = null) {
    // All these variables are now 'const' or 'let' within this function's scope.
    // They will be unique for each time initEditLookup is called.
    const selectElement = elements.selectElement;
    const addNewBtn = elements.addNewBtn;
    const newContainer = elements.newContainer;
    const newNameInput = elements.newNameInput;
    const saveNewBtn = elements.saveNewBtn;
    const cancelNewBtn = elements.cancelNewBtn;
    const editInputContainer = elements.editInputContainer;
    const editNameInput = elements.editNameInput;
    const saveEditBtn = elements.saveEditBtn;
    const cancelEditBtn = elements.cancelEditBtn;

    const _tableName = tableName;
    const _refreshFunction = refreshFunction;
    const _parentLookupCheck = parentLookupCheck;

    const editBtn = document.createElement('button'); // This button is also unique to this instance
    editBtn.type = 'button';
    editBtn.textContent = 'Edit Name';
    editBtn.className = 'edit-item-btn';
    editBtn.id = `edit${_tableName.slice(0, -1)}Btn`; // Still a unique ID per table type for clarity

    if (selectElement && addNewBtn && addNewBtn.parentNode) {
        // Insert the edit button right after the add new button
        addNewBtn.parentNode.insertBefore(editBtn, addNewBtn.nextSibling); 
        console.log(`edit-lookup-logic.js: ${_tableName} - 'Edit Name' button created and appended.`, editBtn);
    } else {
        console.error(`edit-lookup-logic.js: Could not find parent for ${_tableName} edit button. Elements:`, elements);
        return null; // Critical: return null if initialization fails
    }
    
    editInputContainer.classList.add('hidden');

    // Event listeners are attached directly to the instance's specific buttons
    editBtn.addEventListener('click', showEditInput);
    cancelEditBtn.addEventListener('click', hideEditInput);
    saveEditBtn.addEventListener('click', saveEditedItem);

    console.log(`edit-lookup-logic.js: ${_tableName} - Event listeners attached to 'Edit Name', 'Cancel Edit', 'Save Edit' buttons.`);

    // The select's change event listener triggers this instance's toggleControlStates
    selectElement.addEventListener('change', toggleControlStates);
    
    // Mutation observers are also scoped to this instance
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                if (mutation.target === newContainer || mutation.target === editInputContainer) {
                    // Only trigger if the 'hidden' class actually changed state
                    if (mutation.oldValue.includes('hidden') !== mutation.target.classList.contains('hidden')) {
                         toggleControlStates();
                    }
                }
            }
        });
    });
    observer.observe(newContainer, { attributes: true, attributeFilter: ['class'], attributeOldValue: true });
    observer.observe(editInputContainer, { attributes: true, attributeFilter: ['class'], attributeOldValue: true });

    // Initial state setup for this specific instance
    toggleControlStates(); 
    console.log(`edit-lookup-logic.js: initEditLookup for ${_tableName}. Initial select value: '${selectElement.value}', options count: ${selectElement.options.length}`);


    /**
     * Manages the disabled/enabled states of the select, add button, and edit button
     * based on whether the new or edit input containers are active.
     * This function is now an *internal method* for this specific lookup instance.
     */
    function toggleControlStates() {
        const isAdding = !newContainer.classList.contains('hidden');
        const isEditing = !editInputContainer.classList.contains('hidden');

        if (isAdding || isEditing) {
            selectElement.disabled = true;
            addNewBtn.disabled = true;
            editBtn.disabled = true; 
            console.log(`edit-lookup-logic.js: ${_tableName} - Entering active mode (add/edit). All controls disabled.`);
        } else {
            selectElement.disabled = false;
            addNewBtn.disabled = false;
            editBtn.disabled = !selectElement.value; // Only enabled if an item is selected
            console.log(`edit-lookup-logic.js: ${_tableName} - Exiting active mode. Select value: '${selectElement.value}', Edit Name disabled: ${editBtn.disabled}`);
        }
    }


    function showEditInput() {
        console.log(`edit-lookup-logic.js: ${_tableName} - showEditInput called. Current select value: '${selectElement.value}'`);

        if (!selectElement.value) {
            alert(`Please select a ${_tableName.slice(0, -1)} to edit.`);
            return;
        }

        editInputContainer.classList.remove('hidden');
        editNameInput.value = selectElement.options[selectElement.selectedIndex].text;
        editNameInput.focus();
        editNameInput.disabled = false;

        toggleControlStates();
    }

    function hideEditInput() {
        console.log(`edit-lookup-logic.js: ${_tableName} - hideEditInput called.`);

        editInputContainer.classList.add('hidden');
        editNameInput.value = '';

        toggleControlStates();
    }

    async function saveEditedItem() {
        console.log(`edit-lookup-logic.js: ${_tableName} - saveEditedItem called.`);

        const idToUpdate = selectElement.value;
        const newName = editNameInput.value.trim();

        if (!idToUpdate) {
            alert(`No ${_tableName.slice(0, -1)} selected for editing.`);
            return;
        }
        if (!newName) {
            alert('Please enter a new name.');
            return;
        }

        showLoading();
        try {
            const response = await window.api.updateLookupItem(_tableName, Number(idToUpdate), newName);
            if (response.success) {
                alert(response.message);
                if (_parentLookupCheck && (_tableName === 'developments' || _tableName === 'house_models')) {
                     // Get the parent select element dynamically from the current select's DOM structure
                     // This correctly finds the parent select relative to this instance's selectElement
                     const currentParentSelect = selectElement.closest('.field-with-add-button').parentNode.previousElementSibling.querySelector('select');
                     const currentParentId = currentParentSelect ? currentParentSelect.value : null;
                     await _parentLookupCheck(currentParentId, Number(idToUpdate)); 
                } else {
                     await _refreshFunction(Number(idToUpdate)); // Directly refresh this dropdown
                }
                hideEditInput();
            } else {
                alert(`Failed to update ${_tableName.slice(0, -1)}: ${response.message}`);
            }
        } catch (error) {
            console.error(`edit-lookup-logic.js: Error saving edited ${_tableName.slice(0, -1)}:`, error);
            alert(`Error saving edited ${_tableName.slice(0, -1)}: ${error.message || 'An unexpected error occurred.'}`);
        } finally {
            hideLoading();
        }
    }

    // Return the public interface for this specific instance
    return {
        toggleState: toggleControlStates // This method is now tied to this instance's scope
    };
}
