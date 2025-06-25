// renderer/js/cost-logic.js

let costValueField;
let costRangeField;
let costValueInput;
let minCostInput;
let maxCostInput;
let stampDutyInput;
let costKnownRadios;

export function initCostLogic(elements) {
    costValueField = elements.costValueField;
    costRangeField = elements.costRangeField;
    costValueInput = elements.costValueInput;
    minCostInput = elements.minCostInput;
    maxCostInput = elements.maxCostInput;
    stampDutyInput = elements.stampDutyInput;
    costKnownRadios = elements.costKnownRadios;

    costKnownRadios.forEach(radio => {
        radio.addEventListener('change', toggleCostFields);
    });

    // Initial state setup based on default checked radio or first one
    toggleCostFields(); 
}

function toggleCostFields() {
    const selectedCostKnownRadio = document.querySelector('input[name="cost_known"]:checked');
    const isCostKnown = selectedCostKnownRadio && selectedCostKnownRadio.value === 'yes';

    if (isCostKnown) {
        costValueField.classList.remove('hidden');
        costRangeField.classList.add('hidden');
        costValueInput.required = true;
        minCostInput.required = false;
        maxCostInput.required = false;
        minCostInput.value = ''; // Clear range fields if switching to known
        maxCostInput.value = '';
    } else {
        costValueField.classList.add('hidden');
        costRangeField.classList.remove('hidden');
        costValueInput.required = false;
        minCostInput.required = false; 
        maxCostInput.required = false; 
        costValueInput.value = ''; // Clear value field if switching to range
    }
}

/**
 * Sets the cost fields on the form when editing a plot.
 * @param {object} plot The plot data object.
 */
export function setCostFields(plot) {
    console.log("cost-logic.js: setCostFields called with plot:", plot);
    
    // Set the correct radio button based on plot.cost_known
    if (plot.cost_known == 1) { // If cost is known
        document.getElementById('cost_known_yes').checked = true;
        costValueInput.value = plot.cost_value || '';
        minCostInput.value = ''; // Ensure these are cleared if known cost is selected
        maxCostInput.value = '';
    } else { // If cost is a range
        document.getElementById('cost_known_no').checked = true;
        costValueInput.value = ''; // Ensure this is cleared if range cost is selected

        // Directly assign min_cost and max_cost from the plot object
        // They will be null or numbers from the database
        minCostInput.value = plot.min_cost || ''; 
        maxCostInput.value = plot.max_cost || ''; 
        
        console.log("cost-logic.js: setCostFields - Loaded min_cost:", plot.min_cost, "max_cost:", plot.max_cost);
    }
    
    // Trigger toggleCostFields to ensure visibility is correct
    // based on the newly set radio button.
    toggleCostFields(); 

    // Assign stamp_duty as a string directly (no parsing needed)
    stampDutyInput.value = plot.stamp_duty || '';
    console.log("cost-logic.js: setCostFields - Stamp Duty set to:", plot.stamp_duty);
}

export function getCostData(elements) {
    const isCostKnown = elements.isCostKnown;
    let costValue = null;
    let minCost = null; // Will now be separate
    let maxCost = null; // Will now be separate

    if (isCostKnown) {
        costValue = parseFloat(elements.costValue);
        if (isNaN(costValue)) costValue = null;
    } else {
        // Get values from the respective input fields directly as numbers
        minCost = parseFloat(elements.minCost);
        maxCost = parseFloat(elements.maxCost);

        // Ensure they are null if not valid numbers
        if (isNaN(minCost)) minCost = null;
        if (isNaN(maxCost)) maxCost = null;
    }

    // Do NOT parseFloat for stampDuty, pass as string
    const stampDuty = elements.stampDuty; 

    return {
        cost_value: costValue,
        min_cost: minCost,   // New: Pass min_cost
        max_cost: maxCost,   // New: Pass max_cost
        stamp_duty: stampDuty
    };
}
