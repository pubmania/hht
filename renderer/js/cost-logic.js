// renderer/js/cost-logic.js

import { calculateStampDuty, filterNumericInput } from './utils.js';

// DOM Element References (these will be passed from form-main.js)
let costValueField;
let costRangeField;
let costValueInput;
let minCostInput;
let maxCostInput;
let stampDutyInput;
let costKnownRadios; // The radio button group (NodeList)

/**
 * Initializes the cost-related DOM elements.
 * @param {object} elements Object containing references to relevant DOM elements.
 */
export function initCostLogic(elements) {
    costValueField = elements.costValueField;
    costRangeField = elements.costRangeField;
    costValueInput = elements.costValueInput;
    minCostInput = elements.minCostInput;
    maxCostInput = elements.maxCostInput;
    stampDutyInput = elements.stampDutyInput;
    costKnownRadios = elements.costKnownRadios;

    // Attach event listeners
    costKnownRadios.forEach(radio => {
        radio.addEventListener("change", toggleCostFieldsDisplay);
    });

    costValueInput.addEventListener("input", filterNumericInput);
    costValueInput.addEventListener("input", updateStampDuty); // Call updateStampDuty after filterNumericInput

    minCostInput.addEventListener("input", filterNumericInput);
    minCostInput.addEventListener("input", updateStampDuty); // Call updateStampDuty after filterNumericInput

    maxCostInput.addEventListener("input", filterNumericInput);
    maxCostInput.addEventListener("input", updateStampDuty); // Call updateStampDuty after filterNumericInput

    // Initial setup
    toggleCostFieldsDisplay();
}

/**
 * Updates the calculated stamp duty field based on current cost inputs.
 */
export function updateStampDuty() {
    const isCostKnown = costKnownRadios.value === "yes";

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
 * Toggles the display of either the single cost input field or the min/max range fields.
 */
export function toggleCostFieldsDisplay() {
    const isCostKnown = costKnownRadios.value === "yes";
    if (isCostKnown) {
        costValueField.style.display = "block";
        costRangeField.style.display = "none";
        minCostInput.value = ''; // Clear range inputs when switching to known cost
        maxCostInput.value = '';
    } else {
        costValueField.style.display = "none";
        costRangeField.style.display = "block";
        costValueInput.value = ''; // Clear known cost input when switching to range
    }
    updateStampDuty(); // Always update stamp duty after changing field visibility
}

/**
 * Sets the initial values for the cost fields (for edit mode).
 * @param {object} plot The plot object from the database.
 */
export function setCostFields(plot) {
    if (plot.cost_known === 1) { // 1 for true
        costKnownRadios.value = "yes";
        costValueInput.value = plot.cost_value;
    } else {
        costKnownRadios.value = "no";
        if (plot.cost_range) {
            const rangeParts = plot.cost_range.split(' - ').map(s => s.trim());
            if (rangeParts.length === 2) {
                minCostInput.value = rangeParts[0];
                maxCostInput.value = rangeParts[1];
            } else if (rangeParts.length === 1) {
                minCostInput.value = rangeParts[0];
                maxCostInput.value = ''; // Or set max to min if preferred
            }
        } else {
            minCostInput.value = '';
            maxCostInput.value = '';
        }
    }
    toggleCostFieldsDisplay(); // Ensure correct fields are visible
    stampDutyInput.value = plot.stamp_duty || ''; // Set stamp duty from DB
}

/**
 * Gathers and returns cost-related data from the form inputs.
 * @param {FormData} formData The FormData object from the form.
 * @returns {object} An object containing cost_known, cost_value, cost_range, and stamp_duty.
 */
export function getCostData(formData) {
    const costKnown = formData.get("cost_known") === "yes";
    let costValueToSend = null;
    let costRangeToSend = null;
    
    if (costKnown) {
        costValueToSend = parseFloat(formData.get("cost_value") || 0);
    } else {
        const min = parseFloat(formData.get("min_cost"));
        const max = parseFloat(formData.get("max_cost"));
        
        if (!isNaN(min) && !isNaN(max)) {
            costRangeToSend = `${Math.min(min, max)} - ${Math.max(min, max)}`;
        } else if (!isNaN(min)) {
            costRangeToSend = `${min}`;
        } else if (!isNaN(max)) {
            costRangeToSend = `${max}`;
        }
    }
    
    // Get the currently displayed stamp duty value, which is dynamically calculated
    const stampDuty = stampDutyInput.value; 

    return {
        cost_known: costKnown,
        cost_value: costValueToSend,
        cost_range: costRangeToSend,
        stamp_duty: stampDuty
    };
}
