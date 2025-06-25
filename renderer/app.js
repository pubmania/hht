// renderer/js/app.js

// Get DOM elements for app.js
const plotTableBody = document.getElementById("plotTable");
const addPlotBtn = document.getElementById("addPlotBtn");
const noPlotsMessage = document.getElementById("noPlotsMessage");

// Helper for loading overlay
function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}
function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

// Function to populate the plot table
async function populatePlotTable() {
    showLoading();
    try {
        console.log('app.js: Attempting to fetch plots...');
        const plots = await window.api.getPlots(); // Fetch all plots from main process
        console.log('app.js: Plots fetched:', plots); 

        plotTableBody.innerHTML = ''; // Clear existing rows

        if (plots.length === 0) {
            noPlotsMessage.classList.remove('hidden');
            const tableElement = document.getElementById('trackerTable'); 
            if (tableElement) {
                tableElement.style.display = 'none'; // Hide the table if no data
            }
            console.log('app.js: No plots found, displaying message and hiding table.');
        } else {
            noPlotsMessage.classList.add('hidden');
            const tableElement = document.getElementById('trackerTable');
            if (tableElement) {
                tableElement.style.display = ''; // Show the table
            }
            plots.forEach(plot => {
                console.log('app.js: Processing plot:', plot); 
                const row = plotTableBody.insertRow();
                
                row.insertCell().textContent = plot.plot_number;
                row.insertCell().textContent = plot.entrance_facing;
                
                // ********** Use cost_display_string directly from the plot object **********
                // This string is now pre-formatted by db.js (e.g., "£350000.00" or "£280000.00 - £320000.00")
                row.insertCell().textContent = plot.cost_display_string || 'N/A';
                // **************************************************************************

                row.insertCell().textContent = plot.stamp_duty || 'N/A';
                
                // ********** UNCOMMENTED: Display all lookup fields **********
                row.insertCell().textContent = plot.location_name || 'N/A';
                row.insertCell().textContent = plot.development_name || 'N/A';
                row.insertCell().textContent = plot.builder_name || 'N/A';
                row.insertCell().textContent = plot.house_model_name || 'N/A';
                // ************************************************************

                const actionsCell = row.insertCell();
                actionsCell.className = 'flex-row-buttons';

                const editButton = document.createElement('button');
                editButton.textContent = 'Edit';
                editButton.className = 'action-button edit';
                editButton.onclick = () => {
                    window.location.href = `form.html?id=${plot.id}`;
                };
                actionsCell.appendChild(editButton);

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.className = 'action-button delete';
                deleteButton.onclick = async () => {
                    if (confirm(`Are you sure you want to delete plot ${plot.plot_number}?`)) {
                        try {
                            const response = await window.api.deletePlot(plot.id);
                            if (response.success) {
                                alert(response.message);
                                await populatePlotTable();
                            } else {
                                alert(`Error deleting plot: ${response.message}`);
                            }
                        } catch (error) {
                            console.error('app.js: Error deleting plot:', error);
                            alert(`Failed to delete plot: ${error.message}`);
                        }
                    }
                };
                actionsCell.appendChild(deleteButton);
            });
            console.log('app.js: Table populated with records.');
        }
    } catch (error) {
        console.error('app.js: Failed to load plots:', error);
        alert(`Failed to load plots: ${error.message}`);
    } finally {
        hideLoading();
    }
}

addPlotBtn.addEventListener("click", () => {
    window.location.href = "form.html";
});

document.addEventListener("DOMContentLoaded", populatePlotTable);
