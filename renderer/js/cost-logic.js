// renderer/js/cost-logic.js

// Import calculateStampDuty from utils.js
import { calculateStampDuty } from './utils.js'; 

let costValueField;
let costRangeField;
let costValueInput;
let minCostInput;
let maxCostInput;
let stampDutyInput;
let costKnownRadios; // Will be a NodeList

/**
 * Initializes the cost-related DOM elements and attaches event listeners.
 * @param {object} elements Object containing references to relevant DOM elements.
 */
export function initCostLogic(elements) {
    costValueField = elements.costValueField;
    costRangeField = elements.costRangeField;
    costValueInput = elements.costValueInput;
    minCostInput = elements.minCostInput;
    maxCostInput = elements.maxCostInput;
    stampDutyInput = elements.stampDutyInput;
    costKnownRadios = elements.costKnownRadios; // NodeList of radio buttons

    console.log("cost-logic.js: Initializing cost logic with elements:");
    console.log({ costValueField, costRangeField, costValueInput, minCostInput, maxCostInput, stampDutyInput, costKnownRadios });

    // Attach listeners to radio buttons to toggle visibility and update stamp duty
    costKnownRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            toggleCostFields();
            updateStampDuty(); // Update stamp duty when radio button changes (user's suggestion)
        });
    });

    // Attach input listeners for cost fields to update stamp duty automatically
    costValueInput.addEventListener('input', updateStampDuty);
    minCostInput.addEventListener('input', updateStampDuty);
    maxCostInput.addEventListener('input', updateStampDuty);

    // Initial call to set correct field visibility and calculate stamp duty
    toggleCostFields(); 
    updateStampDuty(); // Ensure stamp duty is calculated on initial load
}

/**
 * Toggles the visibility of cost input fields based on the "Cost Known" radio selection.
 */
function toggleCostFields() {
    // Get the currently checked radio button's value
    const isCostKnown = document.querySelector('input[name="cost_known"]:checked')?.value === 'yes';

    if (isCostKnown) {
        costValueField.classList.remove('hidden');
        costRangeField.classList.add('hidden');
        costValueInput.required = true;
        minCostInput.required = false;
        maxCostInput.required = false;
        minCostInput.value = ''; // Clear range values when switching to known
        maxCostInput.value = '';
    } else {
        costValueField.classList.add('hidden');
        costRangeField.classList.remove('hidden');
        costValueInput.required = false;
        minCostInput.required = true; // At least one of min/max should be required or validated on submit
        maxCostInput.required = false;
        costValueInput.value = ''; // Clear known value when switching to range
    }
    // updateStampDuty() is also called here by the radio change listener.
}

/**
 * Updates the calculated stamp duty field based on current cost inputs.
 */
export function updateStampDuty() {
    // Get the currently checked radio button's value
    const isCostKnown = document.querySelector('input[name="cost_known"]:checked')?.value === 'yes';

    if (isCostKnown) {
        const cost = parseFloat(costValueInput.value);
        if (!isNaN(cost) && cost >= 0) {
            stampDutyInput.value = `£${calculateStampDuty(cost).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else {
            stampDutyInput.value = '';
        }
    } else { // Cost is not known, use min/max range
        const minCost = parseFloat(minCostInput.value);
        const maxCost = parseFloat(maxCostInput.value);

        if (!isNaN(minCost) && !isNaN(maxCost) && minCost >= 0 && maxCost >= 0) {
            let actualMin = Math.min(minCost, maxCost);
            let actualMax = Math.max(minCost, maxCost);

            const minDuty = calculateStampDuty(actualMin);
            const maxDuty = calculateStampDuty(actualMax);

            const formattedMinDuty = minDuty.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const formattedMaxDuty = maxDuty.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            if (minDuty === maxDuty) {
                stampDutyInput.value = `£${formattedMinDuty}`;
            } else {
                stampDutyInput.value = `£${formattedMinDuty} - £${formattedMaxDuty}`;
            }
        } else if (!isNaN(minCost) && minCost >= 0) { // Only min cost entered
            stampDutyInput.value = `£${calculateStampDuty(minCost).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else if (!isNaN(maxCost) && maxCost >= 0) { // Only max cost entered
            stampDutyInput.value = `£${calculateStampDuty(maxCost).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else {
            stampDutyInput.value = ''; // Clear if inputs are invalid or incomplete
        }
    }
}

/**
 * Sets the cost fields (radio buttons, value/min/max) based on plot data during edit.
 * This function also triggers an immediate stamp duty update.
 * @param {object} plot The plot object from the database.
 */
export function setCostFields(plot) {
    if (plot.cost_known === 1) {
        document.getElementById('cost_known_yes').checked = true;
        costValueInput.value = plot.cost_value || '';
        minCostInput.value = '';
        maxCostInput.value = '';
    } else {
        document.getElementById('cost_known_no').checked = true;
        minCostInput.value = plot.min_cost || '';
        maxCostInput.value = plot.max_cost || '';
        costValueInput.value = '';
    }
    toggleCostFields(); // Ensure visibility is correct after setting values
    updateStampDuty();  // Call updateStampDuty after setting fields in edit mode
}

/**
 * Gathers and returns cost data from the form.
 * @param {object} options Options object containing raw form values.
 * @returns {object} Processed cost data ready for database.
 */
export function getCostData(options) {
    const isCostKnown = options.isCostKnown;
    const costValue = options.costValue;
    const minCost = options.minCost;
    const maxCost = options.maxCost;
    const stampDuty = options.stampDuty;

    let processedCostValue = null;
    let processedMinCost = null;
    let processedMaxCost = null;

    if (isCostKnown) {
        processedCostValue = costValue !== '' ? parseFloat(costValue) : null;
    } else {
        processedMinCost = minCost !== '' ? parseFloat(minCost) : null;
        processedMaxCost = maxCost !== '' ? parseFloat(maxCost) : null;
    }

    return {
        cost_value: processedCostValue,
        min_cost: processedMinCost,
        max_cost: processedMaxCost,
        stamp_duty: stampDuty
    };
}
