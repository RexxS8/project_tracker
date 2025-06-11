// mom.js - Versi Terbaru untuk Integrasi Django (Fixed)
document.addEventListener('DOMContentLoaded', function() {
    // State management
    let currentProject = null;
    let currentWeek = null;
    let currentMom = null;
    let currentAction = 'add';
    let pendingDeleteAction = null;
    const apiBaseUrl = ''; // Kosongkan jika backend di host yang sama

    // DOM Elements
    const projectListView = document.getElementById('projectListView');
    const weeklyView = document.getElementById('weeklyView');
    const momDetailView = document.getElementById('momDetailView');
    
    // Initialize
    fetchProjects();
    setupEventListeners();

    // Setup event listeners for all interactive elements
    function setupEventListeners() {
        // Navigation buttons
        document.getElementById('backToProjects').addEventListener('click', showProjectList);
        document.getElementById('backToWeeks').addEventListener('click', showWeeklyView);
        
        // Modal triggers and forms
        document.getElementById('addWeekBtn').addEventListener('click', () => openWeekModal());
        document.getElementById('addMomBtn').addEventListener('click', () => openMomModal());
        
        document.getElementById('weekForm').addEventListener('submit', handleWeekSubmit);
        document.getElementById('momForm').addEventListener('submit', handleMomSubmit);

        // Modal close/cancel buttons
        document.getElementById('closeWeekModal').addEventListener('click', closeWeekModal);
        document.getElementById('cancelWeek').addEventListener('click', closeWeekModal);
        document.getElementById('closeMomModal').addEventListener('click', closeMomModal);
        document.getElementById('cancelMom').addEventListener('click', closeMomModal);
        
        // Confirmation modal buttons
        document.getElementById('cancelConfirm').addEventListener('click', closeConfirmModal);
        document.getElementById('confirmDelete').addEventListener('click', executeDelete);
        
        // File upload drag-and-drop and input handling
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('momDocument');
        if (dropZone) {
            dropZone.addEventListener('click', () => fileInput.click());
            // Optional: Add drag/drop event listeners for a better UX
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('border-blue-500');
            });
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('border-blue-500');
            });
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('border-blue-500');
                fileInput.files = e.dataTransfer.files;
                handleFileSelect({ target: fileInput }); // Trigger file list update
            });
        }
        if (fileInput) {
            fileInput.addEventListener('change', handleFileSelect);
        }
    }

    // --- API Functions ---

    /**
     * Fetches the list of all projects from the API.
     */
    function fetchProjects() {
        fetch(`${apiBaseUrl}/api/projects/`)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(projects => renderProjectList(projects))
            .catch(error => {
                console.error('Error fetching projects:', error);
                showNotification('Failed to load projects. Please check the console for details.', 'error');
            });
    }

    /**
     * Fetches detailed information for a single project, including its weeks and MOMs.
     * @param {number} projectId - The ID of the project to fetch.
     * @returns {Promise<object|null>} A promise that resolves to the project object or null on error.
     */
    function fetchProjectDetails(projectId) {
        return fetch(`${apiBaseUrl}/api/projects/${projectId}/`)
            .then(response => {
                 if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                 return response.json();
            })
            .catch(error => {
                console.error('Error fetching project details:', error);
                showNotification('Failed to load project details.', 'error');
                return null;
            });
    }

    /**
     * Creates a new meeting week for a specific project.
     * @param {number} projectId - The ID of the project.
     * @param {object} data - The week data (week_number, name).
     */
    function createMeetingWeek(projectId, data) {
        return fetch(`${apiBaseUrl}/api/projects/${projectId}/meeting-weeks/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify(data)
        }).then(handleResponse);
    }

    /**
     * Updates an existing meeting week.
     * @param {number} weekId - The ID of the week to update.
     * @param {object} data - The updated week data.
     */
    function updateMeetingWeek(weekId, data) {
        return fetch(`${apiBaseUrl}/api/meeting-weeks/${weekId}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify(data)
        }).then(handleResponse);
    }

    /**
     * Deletes a meeting week.
     * @param {number} weekId - The ID of the week to delete.
     */
    function deleteMeetingWeek(weekId) {
        return fetch(`${apiBaseUrl}/api/meeting-weeks/${weekId}/`, {
            method: 'DELETE',
            headers: { 'X-CSRFToken': getCsrfToken() }
        }).then(response => (response.status === 204 ? null : handleResponse(response)));
    }

    /**
     * Creates a new MOM for a specific week.
     * @param {number} weekId - The ID of the parent week.
     * @param {object} data - The MOM data to be created.
     */
    function createMOM(weekId, data) {
        return fetch(`${apiBaseUrl}/api/meeting-weeks/${weekId}/moms/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify(data)
        }).then(handleResponse);
    }

    /**
     * Updates an existing MOM.
     * @param {number} momId - The ID of the MOM to update.
     * @param {object} data - The updated MOM data.
     */
    function updateMOM(momId, data) {
        return fetch(`${apiBaseUrl}/api/moms/${momId}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify(data)
        }).then(handleResponse);
    }

    /**
     * Deletes a MOM.
     * @param {number} momId - The ID of the MOM to delete.
     */
    function deleteMOM(momId) {
        return fetch(`${apiBaseUrl}/api/moms/${momId}/`, {
            method: 'DELETE',
            headers: { 'X-CSRFToken': getCsrfToken() }
        }).then(response => (response.status === 204 ? null : handleResponse(response)));
    }

    /**
     * Uploads a single file to the server.
     * @param {File} file - The file to upload.
     * @returns {Promise<object>} A promise that resolves to the uploaded file's data (e.g., {id, name, url}).
     */
    function uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        return fetch(`${apiBaseUrl}/api/upload/`, {
            method: 'POST',
            headers: { 'X-CSRFToken': getCsrfToken() },
            body: formData
        }).then(handleResponse);
    }

    // --- Helper Functions ---

    /**
     * A generic response handler for fetch calls. It checks for errors and parses JSON.
     * @param {Response} response - The fetch response object.
     * @returns {Promise<object>} A promise that resolves with the JSON body.
     */
    async function handleResponse(response) {
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                // If the error response is not JSON, use the status text.
                throw new Error(response.statusText || `HTTP error! status: ${response.status}`);
            }
            // Use a detailed error message from the backend if available.
            const errorMessage = errorData.detail || errorData.error || JSON.stringify(errorData);
            throw new Error(errorMessage);
        }
        // Handle successful but empty responses (e.g., 204 No Content).
        return response.status === 204 ? null : response.json();
    }
    
    /**
     * Retrieves the CSRF token from the DOM.
     * @returns {string} The CSRF token value.
     */
    function getCsrfToken() {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
        return csrfToken ? csrfToken.value : '';
    }

    /**
     * Returns Tailwind CSS classes based on project status.
     * @param {string} status - The project status string.
     * @returns {string} Tailwind CSS classes.
     */
    function getStatusColor(status) {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-800';
            case 'In Progress': return 'bg-blue-100 text-blue-800';
            case 'Not Started': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }
    
    /**
     * Returns Tailwind CSS classes based on MOM status.
     * @param {string} status - The MOM status string.
     * @returns {string} Tailwind CSS classes.
     */
    function getMomStatusColor(status) {
        switch (status) {
            case 'Open': return 'bg-red-100 text-red-800';
            case 'In Progress': return 'bg-yellow-100 text-yellow-800';
            case 'Closed': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    /**
     * Formats a date string into a more readable format (e.g., "Jun 11, 2025").
     * @param {string} dateString - The date string to format (e.g., "2025-06-11").
     * @returns {string} The formatted date string.
     */
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const options = { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' };
            return new Date(dateString).toLocaleDateString('en-US', options);
        } catch (e) {
            return dateString;
        }
    }

    /**
     * Displays a UI notification. (Currently uses alert as a placeholder).
     * @param {string} message - The message to display.
     * @param {string} type - The type of notification ('success' or 'error').
     */
    function showNotification(message, type = 'success') {
        // TODO: Replace with a more sophisticated notification library like Toastify or a custom element.
        console.log(`${type.toUpperCase()}: ${message}`);
        alert(`${type.toUpperCase()}: ${message}`);
    }


    // --- Render Functions ---

    /**
     * Renders the list of projects on the main view.
     * @param {Array<object>} projects - An array of project objects.
     */
    function renderProjectList(projects) {
        const container = projectListView.querySelector('.grid');
        if (!container) return;
        
        container.innerHTML = ''; // Clear previous content
        
        if (!projects || projects.length === 0) {
             container.innerHTML = `<p class="text-center text-gray-500 col-span-full">No projects found.</p>`;
             return;
        }

        projects.forEach(project => {
            const statusColor = getStatusColor(project.status);
            const card = document.createElement('div');
            card.className = 'bg-white rounded-xl shadow-md p-6 card-hover cursor-pointer transition-transform transform hover:-translate-y-1';
            card.onclick = () => showProject(project);
            
            card.innerHTML = `
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-800 truncate" title="${project.name}">${project.name}</h3>
                    <i class="fas fa-folder-open text-blue-500"></i>
                </div>
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600">Status:</span>
                        <span class="px-2 py-1 rounded-full text-xs font-medium ${statusColor}">${project.status}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600">Progress:</span>
                        <span class="text-sm font-medium">${project.progress}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-blue-600 h-2 rounded-full" style="width: ${project.progress}%"></div>
                    </div>
                    <div class="flex justify-between items-center text-xs text-gray-500 pt-2">
                        <span>Weeks: ${project.meeting_weeks?.length || 0}</span>
                        <span>MOMs: ${project.total_moms_count || 0}</span>
                    </div>
                </div>
            `;
            
            container.appendChild(card);
        });
    }

    /**
     * Fetches and displays the weekly view for a selected project.
     * @param {object} project - The project object to display.
     */
    async function showProject(project) {
        if (!project || !project.id) {
            showNotification('Invalid project data', 'error');
            return;
        }
        
        // Fetch the full project details to ensure data is fresh
        const fullProject = await fetchProjectDetails(project.id);
        if (!fullProject) {
            showNotification('Failed to load project details.', 'error');
            return;
        }
        
        currentProject = fullProject;
        document.getElementById('selectedProjectTitle').textContent = fullProject.name;
        renderWeeklyView(fullProject);
        
        // Switch views
        projectListView.classList.add('hidden');
        weeklyView.classList.remove('hidden');
        momDetailView.classList.add('hidden');
    }

    /**
     * Renders the list of meeting weeks for a project.
     * @param {object} project - The project object containing meeting_weeks.
     */
    function renderWeeklyView(project) {
        const container = weeklyView.querySelector('.grid');
        if (!container) return;
        
        container.innerHTML = '';
        
        const sortedWeeks = (project.meeting_weeks || []).sort((a, b) => a.week_number - b.week_number);

        if (sortedWeeks.length === 0) {
            container.innerHTML = `<div class="text-center py-12 col-span-full">
                <i class="fas fa-calendar-times text-4xl text-gray-300 mb-4"></i>
                <h3 class="text-lg font-medium text-gray-600">No weeks created yet</h3>
                <p class="text-gray-500">Click "Add Week" to get started.</p>
            </div>`;
            return;
        }

        sortedWeeks.forEach(week => {
            if (!week.id || week.week_number === undefined) {
                console.warn('Skipping render for incomplete week data:', week);
                return;
            }
            const weekName = week.name || `Week ${week.week_number}`;
            const hasActiveMom = week.meetings?.some(mom => mom.status !== 'Closed') || false;
            
            const weekCard = document.createElement('div');
            weekCard.className = 'bg-white rounded-lg shadow-md p-4 card-hover border-l-4 border-blue-500 flex flex-col justify-between';
            
            weekCard.innerHTML = `
                <div>
                    <div class="flex justify-between items-start mb-3">
                        <div class="cursor-pointer flex-1 week-clickable" data-week-id="${week.id}">
                            <h4 class="font-semibold text-gray-800" title="${weekName}">${weekName}</h4>
                            <p class="text-sm text-gray-600">Week ${week.week_number}</p>
                        </div>
                        <div class="flex space-x-1 flex-shrink-0">
                            <button class="text-blue-500 hover:text-blue-700 p-1 edit-week-btn" title="Edit Week" data-week-id="${week.id}"><i class="fas fa-edit"></i></button>
                            <button class="text-red-500 hover:text-red-700 p-1 delete-week-btn" title="Delete Week" data-week-id="${week.id}"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
                <div class="flex items-center justify-between mt-2 pt-2 border-t">
                    <div class="flex items-center space-x-2">
                        ${hasActiveMom ? '<i class="fas fa-exclamation-circle text-orange-500 animate-pulse" title="Has open MOMs"></i>' : '<i class="fas fa-check-circle text-green-500" title="All MOMs are closed"></i>'}
                        <span class="text-sm text-gray-600">MOMs: ${week.meetings?.length || 0}</span>
                    </div>
                    <div class="text-xs text-gray-500">
                        ${week.meetings?.length > 0 ? 'Click to view' : 'No meetings'}
                    </div>
                </div>
            `;
            
            container.appendChild(weekCard);
        });
        
        // Re-attach event listeners for the newly created elements
        container.querySelectorAll('.week-clickable').forEach(el => {
            el.addEventListener('click', function() {
                const weekId = this.dataset.weekId;
                const week = (currentProject.meeting_weeks || []).find(w => w.id == weekId);
                if (week) showWeek(week);
            });
        });
        
        container.querySelectorAll('.edit-week-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const weekId = this.dataset.weekId;
                const week = (currentProject.meeting_weeks || []).find(w => w.id == weekId);
                if (week) openWeekModal(week);
            });
        });
        
        container.querySelectorAll('.delete-week-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const weekId = this.dataset.weekId;
                if (weekId) confirmDelete('week', weekId);
            });
        });
    }
    
    /**
     * Displays the MOM list for a selected week.
     * @param {object} week - The week object containing meetings.
     */
    function showWeek(week) {
        if (!week || !week.id) {
            showNotification('Invalid week data.', 'error');
            return;
        }
        
        currentWeek = week;
        document.getElementById('selectedWeekTitle').textContent = `${week.name || `Week ${week.week_number}`} - ${currentProject.name}`;
        
        renderMomList(week.meetings || []);
        
        // Switch views
        weeklyView.classList.add('hidden');
        momDetailView.classList.remove('hidden');
    }

    /**
     * Renders the list of MOMs for the currently selected week.
     * @param {Array<object>} moms - An array of MOM objects.
     */
    function renderMomList(moms) {
        const container = document.getElementById('momList');
        if (!container) return;
        
        if (!moms || moms.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-clipboard-list text-4xl text-gray-300 mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-600 mb-2">No meetings recorded</h3>
                    <p class="text-gray-500">Click "Add MOM" to create your first meeting minute.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        const sortedMoms = moms.sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedMoms.forEach(mom => {
            const statusColor = getMomStatusColor(mom.status);
            const documentsHtml = mom.documents && mom.documents.length > 0 ? `
                <div class="border-t pt-3 mt-4">
                    <p class="text-sm font-medium text-gray-600 mb-2">Attachments:</p>
                    <div class="flex flex-wrap gap-2">
                        ${mom.documents.map(doc => `
                            <a href="${doc.file}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100 transition-colors" title="${doc.name || 'Download file'}">
                                <i class="fas fa-paperclip mr-1.5"></i>
                                <span class="truncate">${doc.name || doc.file.split('/').pop()}</span>
                            </a>
                        `).join('')}
                    </div>
                </div>` : '';
            
            const momCard = document.createElement('div');
            const borderColor = mom.status === 'Open' ? 'border-red-500' : mom.status === 'In Progress' ? 'border-yellow-500' : 'border-green-500';
            momCard.className = `bg-white rounded-lg shadow-md p-6 border-l-4 ${borderColor}`;
            momCard.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                            <h4 class="font-semibold text-gray-800">Meeting - ${formatDate(mom.date)}</h4>
                            <span class="px-3 py-1 rounded-full text-sm font-medium ${statusColor}">${mom.status}</span>
                        </div>
                        <p class="text-sm text-gray-600">PIC: ${mom.pic}</p>
                    </div>
                    <div class="flex space-x-2 flex-shrink-0">
                        <button class="text-blue-500 hover:text-blue-700 p-2 edit-mom-btn" title="Edit MOM" data-mom-id="${mom.id}"><i class="fas fa-edit"></i></button>
                        <button class="text-red-500 hover:text-red-700 p-2 delete-mom-btn" title="Delete MOM" data-mom-id="${mom.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="mb-4">
                    <p class="text-gray-700 whitespace-pre-wrap">${mom.description}</p>
                </div>
                ${documentsHtml}
            `;
            
            container.appendChild(momCard);
        });
        
        // Re-attach event listeners
        container.querySelectorAll('.edit-mom-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const momId = this.dataset.momId;
                const mom = (currentWeek.meetings || []).find(m => m.id == momId);
                if (mom) openMomModal(mom);
            });
        });
        
        container.querySelectorAll('.delete-mom-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const momId = this.dataset.momId;
                if (momId) confirmDelete('mom', momId);
            });
        });
    }

    // --- CRUD and Modal Logic ---

    /**
     * Opens the week modal for adding or editing a week.
     * @param {object|null} week - The week object to edit, or null to add a new one.
     */
    function openWeekModal(week = null) {
        currentAction = week ? 'edit' : 'add';
        document.getElementById('weekModalTitle').textContent = week ? 'Edit Week' : 'Add New Week';
        
        if (week) {
            if (!week.id) {
                showNotification('Cannot edit week: Invalid ID.', 'error');
                return;
            }
            document.getElementById('weekNumber').value = week.week_number || '';
            document.getElementById('weekName').value = week.name || '';
            // Store the whole week object being edited
            currentWeek = currentProject.meeting_weeks.find(w => w.id === week.id);
        } else {
            document.getElementById('weekForm').reset();
            // Not editing, so no specific week is selected for the action
            currentWeek = null; 
        }
        
        document.getElementById('weekModal').classList.remove('hidden');
    }

    function closeWeekModal() {
        document.getElementById('weekModal').classList.add('hidden');
    }

    /**
     * Handles the submission of the week form (add/edit).
     * @param {Event} e - The form submission event.
     */
    async function handleWeekSubmit(e) {
        e.preventDefault();
        
        const weekNumberInput = document.getElementById('weekNumber');
        const weekNumber = parseInt(weekNumberInput.value, 10);
        
        if (isNaN(weekNumber) || weekNumber <= 0) {
            showNotification('Week number must be a positive integer.', 'error');
            weekNumberInput.focus();
            return;
        }
        
        const weekName = document.getElementById('weekName').value.trim() || `Week ${weekNumber}`;
        const data = { week_number: weekNumber, name: weekName };
        
        try {
            if (!currentProject || !currentProject.id) {
                throw new Error('No project selected. Cannot save week.');
            }

            if (currentAction === 'add') {
                await createMeetingWeek(currentProject.id, data);
                showNotification('Week added successfully!');
            } else if (currentAction === 'edit') {
                if (!currentWeek || !currentWeek.id) {
                    throw new Error('Invalid week data for update: Missing ID.');
                }
                await updateMeetingWeek(currentWeek.id, data);
                showNotification('Week updated successfully!');
            }
            
            closeWeekModal();
            // Refresh the entire project to get the updated list of weeks
            await showProject(currentProject);
        } catch (error) {
            console.error('Error saving week:', error);
            showNotification(`Failed to save week: ${error.message}`, 'error');
        }
    }
    
    /**
     * Opens the MOM modal for adding or editing.
     * @param {object|null} mom - The MOM object to edit, or null for a new MOM.
     */
    function openMomModal(mom = null) {
        currentAction = mom ? 'edit' : 'add';
        document.getElementById('momModalTitle').textContent = mom ? 'Edit Minutes of Meeting' : 'Add Minutes of Meeting';
        document.getElementById('saveMomBtn').textContent = mom ? 'Update MOM' : 'Save MOM';
        
        document.getElementById('momForm').reset();
        document.getElementById('fileList').innerHTML = '';

        if (mom) {
            document.getElementById('momDate').value = mom.date;
            document.getElementById('momPic').value = mom.pic;
            document.getElementById('momStatus').value = mom.status;
            document.getElementById('momDescription').value = mom.description;
            currentMom = mom;
        } else {
            // Set default date for new MOMs
            document.getElementById('momDate').valueAsDate = new Date();
            currentMom = null;
        }
        
        document.getElementById('momModal').classList.remove('hidden');
    }

    function closeMomModal() {
        document.getElementById('momModal').classList.add('hidden');
    }

    /**
     * Handles the submission of the MOM form (add/edit).
     * @param {Event} e - The form submission event.
     */
    async function handleMomSubmit(e) {
        e.preventDefault();
        
        const parentWeekId = currentWeek.id;
        if (!parentWeekId) {
            showNotification('Cannot save MOM: parent week is not selected.', 'error');
            return;
        }
        
        const payload = {
            date: document.getElementById('momDate').value,
            pic: document.getElementById('momPic').value,
            status: document.getElementById('momStatus').value,
            description: document.getElementById('momDescription').value,
            // Saat edit, sertakan objek dokumen yang sudah ada
            documents: currentMom?.documents || []
        };
        
        const fileInput = document.getElementById('momDocument');
        const files = fileInput.files;
        
        try {
            // Step 1: Upload new files if any
            if (files.length > 0) {
                const uploadPromises = Array.from(files).map(file => uploadFile(file));
                // uploadedFiles akan menjadi array dari objek: [{name, size, file}, ...]
                const uploadedFiles = await Promise.all(uploadPromises);

                // GABUNGKAN OBJEK DOKUMEN BARU DENGAN YANG SUDAH ADA
                payload.documents = [...payload.documents, ...uploadedFiles];
            }
            
            // Step 2: Create or Update the MOM with the final payload
            if (currentAction === 'add') {
                await createMOM(parentWeekId, payload);
                showNotification('MOM added successfully!');
            } else {
                if (!currentMom || !currentMom.id) {
                    throw new Error('Cannot update MOM: ID is missing.');
                }
                await updateMOM(currentMom.id, payload);
                showNotification('MOM updated successfully!');
            }
            
            closeMomModal();
            // Step 3: Refresh project data to show the updated MOM list
            const updatedProject = await fetchProjectDetails(currentProject.id);
            if (updatedProject) {
                currentProject = updatedProject;
                const updatedWeek = updatedProject.meeting_weeks.find(w => w.id == parentWeekId);
                if (updatedWeek) {
                    currentWeek = updatedWeek; // Update state
                    renderMomList(updatedWeek.meetings);
                }
            }
        } catch (error) {
            console.error('Error saving MOM:', error);
            showNotification(`Failed to save MOM: ${error.message}`, 'error');
        }
    }

    /**
     * Handles the file selection from the file input and displays the list.
     * @param {Event} e - The change event from the file input.
     */
    function handleFileSelect(e) {
        const files = Array.from(e.target.files);
        const fileList = document.getElementById('fileList');
        if (!fileList) return;
        
        fileList.innerHTML = ''; // Clear previous list
        files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'flex items-center justify-between p-2 bg-gray-50 rounded';
            fileItem.innerHTML = `
                <div class="flex items-center space-x-2 overflow-hidden">
                    <i class="fas fa-file text-gray-500"></i>
                    <span class="text-sm text-gray-700 truncate" title="${file.name}">${file.name}</span>
                    <span class="text-xs text-gray-500 flex-shrink-0">(${(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button type="button" class="text-red-500 hover:text-red-700 remove-file-btn" data-file-name="${file.name}" title="Remove file"><i class="fas fa-times"></i></button>
            `;
            fileList.appendChild(fileItem);
        });
        
        // Add event listeners to the remove buttons
        fileList.querySelectorAll('.remove-file-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                removeFileFromInput(this.dataset.fileName);
            });
        });
    }

    /**
     * Removes a selected file from the file input list before uploading.
     * @param {string} fileName - The name of the file to remove.
     */
    function removeFileFromInput(fileName) {
        const fileInput = document.getElementById('momDocument');
        const dataTransfer = new DataTransfer();
        const files = Array.from(fileInput.files);

        // Add all files except the one to be removed to the DataTransfer object
        files.filter(file => file.name !== fileName).forEach(file => {
            dataTransfer.items.add(file);
        });
        
        // Assign the updated file list back to the input
        fileInput.files = dataTransfer.files;
        
        // Refresh the displayed file list
        handleFileSelect({ target: fileInput });
    }

    /**
     * Opens a confirmation modal before deleting an item.
     * @param {string} type - The type of item to delete ('week' or 'mom').
     * @param {number} id - The ID of the item to delete.
     */
    function confirmDelete(type, id) {
        if (!id) {
            showNotification('Invalid ID for deletion.', 'error');
            return;
        }

        let message = '';
        if (type === 'week') {
            const week = (currentProject.meeting_weeks || []).find(w => w.id == id);
            if (!week) return;
            const weekName = week.name || `Week ${week.week_number}`;
            const momCount = week.meetings?.length || 0;
            message = `Are you sure you want to delete "${weekName}"?`;
            if (momCount > 0) {
                message += ` This will also delete ${momCount} associated MOM(s).`;
            }
        } else if (type === 'mom') {
            const mom = (currentWeek.meetings || []).find(m => m.id == id);
            if (!mom) return;
            message = `Are you sure you want to delete the MOM from ${formatDate(mom.date)}?`;
        }

        document.getElementById('confirmMessage').textContent = message;
        pendingDeleteAction = { type, id };
        document.getElementById('confirmModal').classList.remove('hidden');
    }
    
    /**
     * Executes the delete operation confirmed by the user.
     */
    async function executeDelete() {
        if (!pendingDeleteAction) return;
        
        const { type, id } = pendingDeleteAction;

        try {
            if (type === 'week') {
                await deleteMeetingWeek(id);
                showNotification('Week deleted successfully!');
                // Refresh project data to show the updated week list
                await showProject(currentProject);
            } else if (type === 'mom') {
                await deleteMOM(id);
                showNotification('MOM deleted successfully!');
                // Refresh project data to get updated MOM list
                const updatedProject = await fetchProjectDetails(currentProject.id);
                if(updatedProject) {
                    currentProject = updatedProject;
                    const updatedWeek = updatedProject.meeting_weeks.find(w => w.id == currentWeek.id);
                    if (updatedWeek) {
                         currentWeek = updatedWeek;
                         renderMomList(updatedWeek.meetings);
                    } else {
                        // The whole week might have been deleted, go back to week view
                        showWeeklyView();
                        renderWeeklyView(updatedProject);
                    }
                }
            }
        } catch (error) {
            console.error('Error deleting:', error);
            showNotification(`Failed to delete: ${error.message}`, 'error');
        } finally {
            closeConfirmModal();
        }
    }


    // --- View Navigation & Modal Management ---
    
    function showProjectList() {
        projectListView.classList.remove('hidden');
        weeklyView.classList.add('hidden');
        momDetailView.classList.add('hidden');
        currentProject = null;
        currentWeek = null;
    }

    function showWeeklyView() {
        weeklyView.classList.remove('hidden');
        momDetailView.classList.add('hidden');
        currentWeek = null;
    }

    function closeConfirmModal() {
        document.getElementById('confirmModal').classList.add('hidden');
        pendingDeleteAction = null;
    }
});
