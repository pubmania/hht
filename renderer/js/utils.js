// Common utility functions (loading, numeric input, dropdown population)

// renderer/js/utils.js

// --- Loading Overlay Helpers ---
/**
 * Shows the loading overlay.
 */
export function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('hidden');
    }
}

/**
 * Hides the loading overlay.
 */
export function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
}

// --- Stamp Duty Calculation ---
/**
 * Calculates the stamp duty based on a given property value.
 * @param {number} value The property value.
 * @returns {number} The calculated stamp duty.
 */
export function calculateStampDuty(value) {
    if (value <= 125000) return 0;
    if (value <= 250000) return (value - 125000) * 0.02;
    if (value <= 925000) return (125000 * 0.02) + (value - 250000) * 0.05;
    if (value <= 1500000) return (125000 * 0.02) + (675000 * 0.05) + (value - 925000) * 0.10;
    return (125000 * 0.02) + (675000 * 0.05) + (575000 * 0.10) + (value - 1500000) * 0.12;
}

// --- Numeric Input Filtering ---
/**
 * Filters input to allow only numbers and a single decimal point.
 * This is meant to be used as an event listener for the 'input' event.
 * @param {Event} event The input event object.
 */
export function filterNumericInput(event) {
    let value = event.target.value;
    // 1. Remove any characters that are not digits or a decimal point
    value = value.replace(/[^0-9.]/g, '');
    // 2. Handle multiple decimal points: keep only the first one
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    event.target.value = value;
    // Note: updateStampDuty is called by the component using this utility,
    // not directly from here, to keep utilities decoupled.
}

// --- Dropdown Population Helper ---
/**
 * Populates a select (dropdown) element with options from a given array of items.
 * Assumes items have 'id' and 'name' properties.
 * @param {HTMLSelectElement} selectElement The <select> DOM element to populate.
 * @param {Array<Object>} items An array of objects with 'id' and 'name' properties.
 * @param {string} defaultOptionText The text for the default/placeholder option (e.g., "Select Location").
 * @param {number|string|null} selectedId The ID of the item to pre-select, or null.
 */
export function populateDropdown(selectElement, items, defaultOptionText, selectedId = null) {
    selectElement.innerHTML = `<option value="">${defaultOptionText}</option>`; // Clear and add default
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.name;
        selectElement.appendChild(option);
    });
    if (selectedId !== null) {
        selectElement.value = selectedId;
    }
}
