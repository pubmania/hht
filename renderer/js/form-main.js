// renderer/js/form-main.js

import { showLoading, hideLoading, filterNumericInput } from './utils.js';
import { initCostLogic, setCostFields, getCostData } from './cost-logic.js';
import { initLocationLogic, populateLocations, getLocationData } from './location-logic.js';
import { initDevelopmentLogic, populateDevelopments, getDevelopmentData } from './development-logic.js';
import { initBuilderLogic, populateBuilders, getBuilderData } from './builder-logic.js';
import { initHouseModelLogic, populateHouseModels, getHouseModelData } from './house-model-logic.js';
// ********** RE-ENABLE THIS IMPORT **********
import { displayAndSetEditable } from './house-model-details-logic.js'; 


document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("plotForm");
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    // --- DOM Element References - DIRECTLY MATCHING form.html IDs/Names ---
    // General Form Elements
    const formTitle = document.getElementById("formTitle");
    const submitButton = document.getElementById("submitButton");
    const plotNumberInput = document.getElementById("plot_number"); 
    const entranceFacingSelect = document.getElementById("entrance_facing"); 
    const cancelButton = document.getElementById('cancelButton'); 
    
    // Cost Section Elements
    const costKnownRadios = document.getElementsByName("cost_known"); 
    const costValueField = document.getElementById("costValueField"); 
    const costRangeField = document.getElementById("costRangeField"); 
    const costValueInput = document.getElementById("cost_value"); 
    const minCostInput = document.getElementById("min_cost"); 
    const maxCostInput = document.getElementById("max_cost"); 
    const stampDutyInput = document.getElementById("stamp_duty"); 

    // Location Section Elements
    const locationSelect = document.getElementById("location_select"); 
    const addNewLocationBtn = document.getElementById('addNewLocationBtn'); 
    const newLocationInputContainer = document.getElementById('newLocationInputContainer'); 
    const newLocationNameInput = newLocationInputContainer ? document.getElementById('newLocationName') : null; // Defensive check
    const saveNewLocationBtn = document.getElementById('saveNewLocationBtn'); 
    const cancelNewLocationBtn = document.getElementById('cancelNewLocationBtn'); 
    const editLocationInputContainer = document.getElementById('editLocationInputContainer'); 
    const editLocationNameInput = document.getElementById('editLocationName'); 
    const saveLocationBtn = document.getElementById('saveLocationBtn'); 
    const cancelLocationBtn = document.getElementById('cancelLocationBtn'); 

    // Development Section Elements
    const developmentSelect = document.getElementById("development_select"); 
    const addNewDevelopmentBtn = document.getElementById('addNewDevelopmentBtn'); 
    const newDevelopmentInputContainer = document.getElementById('newDevelopmentInputContainer'); 
    const newDevelopmentNameInput = document.getElementById('newDevelopmentName'); 
    const saveNewDevelopmentBtn = document.getElementById('saveNewDevelopmentBtn'); 
    const cancelNewDevelopmentBtn = document.getElementById('cancelNewDevelopmentBtn'); 
    const editDevelopmentInputContainer = document.getElementById('editDevelopmentInputContainer'); 
    const editDevelopmentNameInput = document.getElementById('editDevelopmentName'); 
    const saveDevelopmentBtn = document.getElementById('saveDevelopmentBtn'); 
    const cancelDevelopmentBtn = document.getElementById('cancelDevelopmentBtn'); 

    // Builder Section Elements
    const builderSelect = document.getElementById("builder_select"); 
    const addNewBuilderBtn = document.getElementById('addNewBuilderBtn'); 
    const newBuilderInputContainer = document.getElementById('newBuilderInputContainer'); 
    const newBuilderNameInput = newBuilderInputContainer ? document.getElementById('newBuilderName') : null; // Defensive check
    const saveNewBuilderBtn = document.getElementById('saveNewBuilderBtn'); 
    const cancelNewBuilderBtn = document.getElementById('cancelNewBuilderBtn'); 
    const linkBuilderToDevelopmentContainer = document.getElementById('linkBuilderToDevelopmentContainer'); 
    const existingBuilderSelect = document.getElementById('existingBuilderSelect'); 
    const saveLinkBuilderBtn = document.getElementById('saveLinkBuilderBtn'); 
    const cancelLinkBuilderBtn = document.getElementById('cancelLinkBuilderBtn'); 
    const editBuilderInputContainer = document.getElementById('editBuilderInputContainer'); 
    const editBuilderNameInput = document.getElementById('editBuilderName'); 
    const saveBuilderBtn = document.getElementById('saveBuilderBtn'); 
    const cancelBuilderBtn = document.getElementById('cancelBuilderBtn'); 

    // House Model Section Elements
    const houseModelSelect = document.getElementById("house_model_select"); 
    const addNewHouseModelBtn = document.getElementById('addNewHouseModelBtn'); 
    const newHouseModelInputContainer = document.getElementById('newHouseModelInputContainer'); 
    const newHouseModelNameInput = document.getElementById('newHouseModelName'); 
    const saveNewHouseModelBtn = document.getElementById('saveNewHouseModelBtn'); 
    const cancelNewHouseModelBtn = document.getElementById('cancelNewHouseModelBtn'); 
    const editHouseModelInputContainer = document.getElementById('editHouseModelInputContainer'); 
    const editHouseModelNameInput = document.getElementById('editHouseModelName'); 
    const saveHouseModelBtn = document.getElementById('saveHouseModelBtn'); 
    const cancelHouseModelBtn = document.getElementById('cancelHouseModelBtn'); 

    // House Model Details Section Elements (on main form)
    const houseModelDetailsSectionButtons = document.getElementById('houseModelDetailsSectionButtons'); 
    const editModelDetailsBtn = document.getElementById('editModelDetailsBtn'); 


    // --- CRITICAL DEBUGGING LOGS: Verify all elements are found by form-main.js ---
    console.log("form-main.js: Verifying DOM element retrieval for initialization:");
    console.log("  formTitle:", formTitle);
    console.log("  plotNumberInput:", plotNumberInput);
    console.log("  entranceFacingSelect:", entranceFacingSelect);
    console.log("  cancelButton:", cancelButton);
    console.log("  costKnownRadios.length:", costKnownRadios ? costKnownRadios.length : 'null');
    console.log("  costValueField:", costValueField);
    console.log("  costRangeField:", costRangeField);
    console.log("  costValueInput:", costValueInput);
    console.log("  minCostInput:", minCostInput);
    console.log("  maxCostInput:", maxCostInput);
    console.log("  stampDutyInput:", stampDutyInput);
    console.log("  locationSelect:", locationSelect);
    console.log("  addNewLocationBtn:", addNewLocationBtn);
    console.log("  developmentSelect:", developmentSelect);
    console.log("  addNewDevelopmentBtn:", addNewDevelopmentBtn);
    console.log("  builderSelect:", builderSelect);
    console.log("  addNewBuilderBtn:", addNewBuilderBtn);
    console.log("  houseModelSelect:", houseModelSelect);
    console.log("  addNewHouseModelBtn:", addNewHouseModelBtn);
    // Explicitly log the status of the problematic elements
    console.log("  houseModelDetailsSectionButtons (div on main form):", houseModelDetailsSectionButtons);
    console.log("  editModelDetailsBtn (button on main form):", editModelDetailsBtn);
    // Also explicitly log the modal elements, even though HMDL is disabled.
    console.log("  houseModelDetailsModal (modal overlay):", document.getElementById('houseModelDetailsModal'));
    console.log("  roomsContainer (inside modal):", document.getElementById('roomsContainer'));
    console.log("  featuresContainer (inside modal):", document.getElementById('featuresContainer'));
    console.log("  saveModelDetailsBtn (inside modal):", document.getElementById('saveModelDetailsBtn'));
    console.log("  cancelModelDetailsBtn (inside modal):", document.getElementById('cancelModelDetailsBtn'));
    // --- END CRITICAL DEBUGGING LOGS ---


    // --- Initialize Sub-Modules ---
    try { 
        if (!houseModelDetailsSectionButtons || !editModelDetailsBtn) {
            let missing = [];
            if (!houseModelDetailsSectionButtons) missing.push('#houseModelDetailsSectionButtons');
            if (!editModelDetailsBtn) missing.push('#editModelDetailsBtn');
            throw new Error(`form-main.js: Critical UI elements missing: ${missing.join(', ')}. Check form.html IDs/structure.`);
        }

        // All init*Logic calls are now re-enabled.
        initCostLogic({
            costValueField, costRangeField, costValueInput, minCostInput, maxCostInput, stampDutyInput, costKnownRadios
        });
        
        initLocationLogic({
            locationSelect, addNewLocationBtn, newLocationInputContainer, newLocationNameInput, saveNewLocationBtn, cancelNewLocationBtn,
            editLocationInputContainer, editLocationNameInput, saveLocationBtn, cancelLocationBtn
        });
        
        initDevelopmentLogic({
            developmentSelect, addNewDevelopmentBtn, newDevelopmentInputContainer, newDevelopmentNameInput, saveNewDevelopmentBtn, cancelNewDevelopmentBtn,
            locationSelect,
            editDevelopmentInputContainer, editDevelopmentNameInput, saveDevelopmentBtn, cancelDevelopmentBtn
        });
        
        initBuilderLogic({
            builderSelect, addNewBuilderBtn, newBuilderInputContainer, newBuilderNameInput, saveNewBuilderBtn, cancelNewBuilderBtn,
            linkBuilderToDevelopmentContainer, existingBuilderSelect, saveLinkBuilderBtn, cancelLinkBuilderBtn,
            developmentSelect,
            editBuilderInputContainer, editBuilderNameInput, saveBuilderBtn, cancelBuilderBtn
        });

        initHouseModelLogic({
            houseModelSelect, addNewHouseModelBtn, newHouseModelInputContainer, newHouseModelNameInput, saveNewHouseModelBtn, cancelNewHouseModelBtn,
            builderSelect,
            editHouseModelInputContainer, editHouseModelNameInput, saveHouseModelBtn, cancelHouseModelBtn
        });

    } catch (e) {
        console.error("form-main.js: Error during sub-module initialization:", e);
        let alertMessage = `Failed to initialize form elements: ${e.message || 'An unknown error occurred'}.`;
        if (e.message && e.message.includes('Critical UI elements missing')) {
            alertMessage += ` Please check form.html for correct IDs.`;
        }
        alert(alertMessage);
        return; 
    }


    // --- Cascading Event Listeners ---
    locationSelect.addEventListener('change', async () => {
        const selectedLocationId = locationSelect.value;
        await populateDevelopments(selectedLocationId);
        developmentSelect.value = ''; 
        builderSelect.value = '';
        populateBuilders(null);
        houseModelSelect.value = '';
        populateHouseModels(null);
        // ********** RE-ENABLE THIS CALL **********
        displayAndSetEditable(null, null, null, false); 
    });

    developmentSelect.addEventListener('change', async () => {
        const selectedDevelopmentId = developmentSelect.value;
        await populateBuilders(selectedDevelopmentId);
        builderSelect.value = '';
        houseModelSelect.value = '';
        populateHouseModels(null);
        // ********** RE-ENABLE THIS CALL **********
        displayAndSetEditable(null, null, null, false); 
    });

    builderSelect.addEventListener('change', async () => {
        const selectedBuilderId = builderSelect.value;
        await populateHouseModels(selectedBuilderId);
        houseModelSelect.value = '';
        // ********** RE-ENABLE THIS CALL **********
        displayAndSetEditable(null, null, null, false); 
    });


    // --- Page Initialization Logic (Add vs. Edit Mode) ---
    console.log(`form-main.js: DOMContentLoaded fired. Current URL params ID: "${id}"`);

    if (id) {
        formTitle.textContent = "Edit Plot";
        document.title = "Edit Plot";
        submitButton.textContent = "Update";
        console.log("form-main.js: Setting form title to 'Edit Plot'");

        showLoading();
        console.log(`form-main.js: Attempting to fetch plot with ID: ${id}`);
        try {
            const plot = await window.api.getPlotById(Number(id));
            console.log('form-main.js: Fetched plot:', plot); 

            if (plot) {
                plotNumberInput.value = plot.plot_number;
                entranceFacingSelect.value = plot.entrance_facing;
                
                // Keep this re-enabled.
                setCostFields(plot); 
                
                console.log("form-main.js: Populating Locations with plot.location_id:", plot.location_id);
                await populateLocations(plot.location_id); 
                
                if (plot.location_id) {
                    console.log("form-main.js: Populating Developments with plot.location_id:", plot.location_id, "and plot.development_id:", plot.development_id);
                    await populateDevelopments(plot.location_id, plot.development_id);
                    if (plot.development_id) {
                        console.log("form-main.js: Populating Builders with plot.development_id:", plot.development_id, "and plot.builder_id:", plot.builder_id);
                        await populateBuilders(plot.development_id, plot.builder_id);
                        if (plot.builder_id) {
                            console.log("form-main.js: Populating House Models with plot.builder_id:", plot.builder_id, "and plot.house_model_id:", plot.house_model_id);
                            await populateHouseModels(plot.builder_id, plot.house_model_id);
                            // ********** RE-ENABLE THIS CALL **********
                            displayAndSetEditable(plot.house_model_id, plot.rooms_data, plot.features_data, false); 
                        }
                    }
                }

                stampDutyInput.value = plot.stamp_duty || ''; 

            } else {
                console.error(`form-main.js: Plot with ID ${id} not found.`);
                alert(`Error: Plot with ID ${id} not found.`);
                window.location.href = "index.html"; 
            }
        } catch (error) {
            console.error('form-main.js: Error fetching plot by ID:', error);
            let alertMessage = `Error loading plot data: ${error.message}.`;
            alert(alertMessage + ` Please check console for details.`);
            window.location.href = "index.html"; 
        } finally {
            hideLoading();
        }
    } else {
        formTitle.textContent = "Add Plot";
        document.title = "Add Plot";
        submitButton.textContent = "Save";
        console.log("form-main.js: Setting form title to 'Add Plot'");
        
        await populateLocations(); 
        // ********** RE-ENABLE THIS CALL **********
        displayAndSetEditable(null, null, null, false); 
    }

    // --- Main Form Submission Handler ---
    form.addEventListener("submit", async e => {
        e.preventDefault();
        showLoading();

        const selectedCostKnownRadio = document.querySelector('input[name="cost_known"]:checked'); 
        const isCostKnown = selectedCostKnownRadio ? selectedCostKnownRadio.value === 'yes' : false;

        const costData = getCostData({
            isCostKnown: isCostKnown, 
            costValue: costValueInput.value, 
            minCost: minCostInput.value, 
            maxCost: maxCostInput.value, 
            stampDuty: stampDutyInput.value 
        });
        
        const plotNumber = plotNumberInput.value;
        const entranceFacing = entranceFacingSelect.value;


        const selectedLocationId = locationSelect.value;
        const selectedDevelopmentId = developmentSelect.value;
        const selectedBuilderId = builderSelect.value;
        const selectedHouseModelId = houseModelSelect.value;

        // Basic validation for form fields
        if (!plotNumber || !entranceFacing) {
            alert('Please fill in Plot Number and Entrance Facing.');
            hideLoading();
            return;
        }
        if (!selectedCostKnownRadio) { 
             alert('Please select if Cost is Known.');
             hideLoading();
             return;
        }
        if (isCostKnown && (!costData.cost_value || isNaN(costData.cost_value))) {
            alert('Please enter a valid Known Cost.');
            hideLoading();
            return;
        }
        if (!isCostKnown && (!costData.minCost && !costData.maxCost)) { 
            alert('Please enter a Min Cost, Max Cost, or both for the Cost Range.');
            hideLoading();
            return;
        }
        if (!selectedLocationId || isNaN(Number(selectedLocationId))) {
             alert('Please select a Location.');
             hideLoading();
             return;
        }
        if (!selectedDevelopmentId || isNaN(Number(selectedDevelopmentId))) {
             alert('Please select a Development.');
             hideLoading();
             return;
        }
        if (!selectedBuilderId || isNaN(Number(selectedBuilderId))) {
             alert('Please select a Builder.');
             hideLoading();
             return;
        }
        if (!selectedHouseModelId || isNaN(Number(selectedHouseModelId))) {
             alert('Please select a House Model.');
             hideLoading();
             return;
        }

        const plotToSend = {
            id: id ? Number(id) : null,
            plot_number: plotNumber,
            entrance_facing: entranceFacing,
            
            cost_known: isCostKnown ? 1 : 0, 
            cost_value: costData.cost_value,
            cost_range: costData.cost_range, 
            stamp_duty: costData.stamp_duty,

            location_id: Number(selectedLocationId),
            development_id: Number(selectedDevelopmentId),
            builder_id: Number(selectedBuilderId),
            house_model_id: Number(selectedHouseModelId),
        };
        console.log("form-main.js: Plot data to send:", plotToSend);


        try {
            const response = await window.api.savePlot(plotToSend);
            alert(response.message);
            window.location.href = "index.html";
        } catch (error) {
            console.error("form-main.js: Error saving plot:", error);
            alert(`Failed to save plot: ${error.message}`);
        } finally {
            hideLoading();
        }
    });

    // --- Cancel Button Handler ---
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
});
