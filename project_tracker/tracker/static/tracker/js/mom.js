// mom.js - Versi Terbaru untuk Integrasi Django (Fixed)
document.addEventListener('DOMContentLoaded', function() {
    // State management
    let currentProject = null;
    let currentWeek = null;
    let currentMom = null;
    let currentAction = 'add';
    let pendingDeleteAction = null;
    const apiBaseUrl = '';

    // DOM Elements
    const projectListView = document.getElementById('projectListView');
    const weeklyView = document.getElementById('weeklyView');
    const momDetailView = document.getElementById('momDetailView');
    
    // Initialize
    fetchProjects();
    setupEventListeners();

    // Setup event listeners
    function setupEventListeners() {
        // Navigation
        document.getElementById('backToProjects').addEventListener('click', showProjectList);
        document.getElementById('backToWeeks').addEventListener('click', showWeeklyView);
        
        // Modals
        document.getElementById('addWeekBtn').addEventListener('click', openWeekModal);
        document.getElementById('addMomBtn').addEventListener('click', () => openMomModal());
        document.getElementById('closeWeekModal').addEventListener('click', closeWeekModal);
        document.getElementById('cancelWeek').addEventListener('click', closeWeekModal);
        document.getElementById('weekForm').addEventListener('submit', handleWeekSubmit);
        document.getElementById('closeMomModal').addEventListener('click', closeMomModal);
        document.getElementById('cancelMom').addEventListener('click', closeMomModal);
        document.getElementById('momForm').addEventListener('submit', handleMomSubmit);
        document.getElementById('cancelConfirm').addEventListener('click', closeConfirmModal);
        document.getElementById('confirmDelete').addEventListener('click', executeDelete);
        
        // File upload
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('momDocument');
        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileSelect);
    }

    // API Functions
    function fetchProjects() {
        fetch(`${apiBaseUrl}/api/projects/`)
            .then(response => response.json())
            .then(projects => renderProjectList(projects))
            .catch(error => {
                console.error('Error fetching projects:', error);
                showNotification('Failed to load projects', 'error');
            });
    }

    function fetchProjectDetails(projectId) {
        return fetch(`${apiBaseUrl}/api/projects/${projectId}/`)
            .then(response => response.json())
            .catch(error => {
                console.error('Error fetching project details:', error);
                showNotification('Failed to load project details', 'error');
                return null;
            });
    }

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

    function updateMeetingWeek(weekId, data) {
        if (!weekId || isNaN(weekId)) {
            return Promise.reject(new Error('Invalid week ID'));
        }
        
        return fetch(`${apiBaseUrl}/api/meeting-weeks/${weekId}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify(data)
        }).then(handleResponse);
    }

    function deleteMeetingWeek(weekId) {
        if (!weekId || isNaN(weekId)) {
            return Promise.reject(new Error('Invalid week ID'));
        }
        
        return fetch(`${apiBaseUrl}/api/meeting-weeks/${weekId}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCsrfToken()
            }
        }).then(handleResponse);
    }

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

    function deleteMOM(momId) {
        return fetch(`${apiBaseUrl}/api/moms/${momId}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCsrfToken()
            }
        }).then(handleResponse);
    }

    function uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        return fetch(`${apiBaseUrl}/api/upload/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCsrfToken()
            },
            body: formData
        }).then(handleResponse);
    }

    // Helper Functions
    function handleResponse(response) {
        if (!response.ok) {
            return response.json().then(err => { 
                // PERBAIKAN: Tangkap error detail dari backend
                const errorMsg = err.detail || err.message || JSON.stringify(err);
                throw new Error(errorMsg);
            });
        }
        return response.json();
    }

    function getCsrfToken() {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
        return csrfToken ? csrfToken.value : '';
    }

    function getStatusColor(status) {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-800';
            case 'In Progress': return 'bg-blue-100 text-blue-800';
            case 'Not Started': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    function getMomStatusColor(status) {
        switch (status) {
            case 'Open': return 'bg-red-100 text-red-800';
            case 'In Progress': return 'bg-yellow-100 text-yellow-800';
            case 'Closed': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    function formatDate(dateString) {
        try {
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return new Date(dateString).toLocaleDateString('en-US', options);
        } catch (e) {
            return dateString;
        }
    }

    function showNotification(message, type = 'success') {
        // Implementasi notifikasi UI
        console.log(`${type.toUpperCase()}: ${message}`);
        alert(`${type.toUpperCase()}: ${message}`); // Sementara pakai alert
    }

    // Render Functions
    function renderProjectList(projects) {
        const container = projectListView.querySelector('.grid');
        if (!container) return;
        
        container.innerHTML = '';
        
        projects.forEach(project => {
            const statusColor = getStatusColor(project.status);
            const card = document.createElement('div');
            card.className = 'bg-white rounded-xl shadow-md p-6 card-hover cursor-pointer';
            card.onclick = () => showProject(project);
            
            card.innerHTML = `
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-800">${project.name}</h3>
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
                    <div class="flex justify-between items-center text-xs text-gray-500">
                        <span>Weeks: ${project.meeting_weeks?.length || 0}</span>
                        <span>MOMs: ${getTotalMomsCount(project)}</span>
                    </div>
                </div>
            `;
            
            container.appendChild(card);
        });
    }

    function getTotalMomsCount(project) {
        if (!project.meeting_weeks) return 0;
        return project.meeting_weeks.reduce((total, week) => 
            total + (week.meetings?.length || 0), 0);
    }

    async function showProject(project) {
        if (!project || !project.id) {
            showNotification('Invalid project data', 'error');
            return;
        }
        
        const fullProject = await fetchProjectDetails(project.id);
        if (!fullProject) {
            showNotification('Failed to load project', 'error');
            return;
        }
        
        currentProject = fullProject;
        document.getElementById('selectedProjectTitle').textContent = fullProject.name;
        renderWeeklyView(fullProject);
        
        projectListView.classList.add('hidden');
        weeklyView.classList.remove('hidden');
    }

    function renderWeeklyView(project) {
        const container = weeklyView.querySelector('.grid');
        if (!container) return;
        
        container.innerHTML = '';
        
        (project.meeting_weeks || []).forEach(week => {
            // PERBAIKAN: Gunakan week.week_number secara konsisten
            const weekId = week.id;
            const weekNumber = week.week_number || 0;
            const weekName = week.name || `Week ${weekNumber}`;
            
            const momCount = week.meetings?.length || 0;
            const hasActiveMom = week.meetings?.some(mom => mom.status !== 'Closed') || false;
            
            const weekCard = document.createElement('div');
            weekCard.className = 'bg-white rounded-lg shadow-md p-4 card-hover border-l-4 border-blue-500';
            
            weekCard.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <div class="cursor-pointer flex-1 week-clickable" data-week-id="${weekId}">
                        <h4 class="font-semibold text-gray-800">${weekName}</h4>
                        <p class="text-sm text-gray-600">Week ${weekNumber}</p>
                    </div>
                    <div class="flex space-x-1">
                        <button class="text-blue-500 hover:text-blue-700 p-1 edit-week-btn" data-week-id="${weekId}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="text-red-500 hover:text-red-700 p-1 delete-week-btn" data-week-id="${weekId}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        ${hasActiveMom ? '<i class="fas fa-exclamation-circle text-orange-500"></i>' : '<i class="fas fa-check-circle text-green-500"></i>'}
                        <span class="text-sm text-gray-600">MOMs: ${momCount}</span>
                    </div>
                    <div class="text-xs text-gray-500">
                        ${momCount > 0 ? 'Click to view' : 'No meetings'}
                    </div>
                </div>
            `;
            
            container.appendChild(weekCard);
        });
        
        // Add event listeners
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
                if (weekId) deleteWeek(weekId);
            });
        });
    }

    function showWeek(week) {
        if (!week || !week.id) {
            showNotification('Invalid week data', 'error');
            return;
        }
        
        currentWeek = week;
        const weekNumber = week.week_number || 0;
        const weekName = week.name || `Week ${weekNumber}`;
        
        document.getElementById('selectedWeekTitle').textContent = 
            `${weekName} - ${currentProject.name}`;
        
        renderMomList(week.meetings || []);
        
        weeklyView.classList.add('hidden');
        momDetailView.classList.remove('hidden');
    }

    function renderMomList(moms) {
        const container = document.getElementById('momList');
        if (!container) return;
        
        if (!moms || moms.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-clipboard-list text-4xl text-gray-300 mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-600 mb-2">No meetings recorded</h3>
                    <p class="text-gray-500">Click "Add MOM" to create your first meeting minute</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        moms.forEach(mom => {
            const statusColor = getMomStatusColor(mom.status);
            const documentsHtml = mom.documents && mom.documents.length > 0 ? `
                <div class="border-t pt-3">
                    <p class="text-sm font-medium text-gray-600 mb-2">Attachments:</p>
                    <div class="flex flex-wrap gap-2">
                        ${mom.documents.map(doc => `
                            <a href="${doc.url}" target="_blank" class="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100">
                                <i class="fas fa-paperclip mr-1"></i>
                                ${doc.name}
                            </a>
                        `).join('')}
                    </div>
                </div>
            ` : '';
            
            const momCard = document.createElement('div');
            momCard.className = 'bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500';
            momCard.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                            <h4 class="font-semibold text-gray-800">Meeting - ${formatDate(mom.date)}</h4>
                            <span class="px-3 py-1 rounded-full text-sm font-medium ${statusColor}">${mom.status}</span>
                        </div>
                        <p class="text-sm text-gray-600">PIC: ${mom.pic}</p>
                    </div>
                    <div class="flex space-x-2">
                        <button class="text-blue-500 hover:text-blue-700 p-2 edit-mom-btn" data-mom-id="${mom.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="text-red-500 hover:text-red-700 p-2 delete-mom-btn" data-mom-id="${mom.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="mb-4">
                    <p class="text-gray-700">${mom.description}</p>
                </div>
                ${documentsHtml}
            `;
            
            container.appendChild(momCard);
        });
        
        // Add event listeners for buttons
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
                if (momId) deleteMom(momId);
            });
        });
    }

    // CRUD Operations
    function openWeekModal(week = null) {
        currentAction = week ? 'edit' : 'add';
        document.getElementById('weekModalTitle').textContent = week ? 'Edit Week' : 'Add Week';
        
        if (week) {
            // PERBAIKAN: Gunakan week.week_number secara konsisten
            const weekNumber = week.week_number || 0;
            document.getElementById('weekNumber').value = weekNumber;
            document.getElementById('weekName').value = week.name || '';
            currentWeek = week;
        } else {
            document.getElementById('weekForm').reset();
            currentWeek = null;
        }
        
        document.getElementById('weekModal').classList.remove('hidden');
    }

    function closeWeekModal() {
        document.getElementById('weekModal').classList.add('hidden');
    }

    async function handleWeekSubmit(e) {
        e.preventDefault();
        
        const weekNumber = parseInt(document.getElementById('weekNumber').value) || 0;
        const weekName = document.getElementById('weekName').value || `Week ${weekNumber}`;
        
        const data = {
            week_number: weekNumber,
            name: weekName
        };
        
        try {
            if (currentAction === 'add') {
                if (!currentProject || !currentProject.id) {
                    throw new Error('No project selected');
                }
                const response = await createMeetingWeek(currentProject.id, data);
                showNotification('Week added successfully!');
            } else {
                // PERBAIKAN: Validasi lebih ketat
                if (!currentWeek || !currentWeek.id) {
                    throw new Error('Invalid week data for update');
                }
                // Tambahkan log sebelum pengiriman
                console.log('Updating week with data:', data);
                const response = await updateMeetingWeek(currentWeek.id, data);
                showNotification('Week updated successfully!');
                // Tambahkan log setelah respons
                console.log('Update response:', response);
                showNotification('Week updated successfully!');
            }
            
            closeWeekModal();
            // Refresh project data
            const updatedProject = await fetchProjectDetails(currentProject.id);
            if (updatedProject) {
                currentProject = updatedProject;
                renderWeeklyView(updatedProject);
            }
        } catch (error) {
            console.error('Error saving week:', error);
            // Tampilkan error detail dari backend jika ada
            let errorMsg = `Failed to save week: ${error.message}`;
            try {
                const errorData = JSON.parse(error.message);
                if (errorData.details) {
                    errorMsg += `\nDetails: ${JSON.stringify(errorData.details)}`;
                }
             } catch (e) {
                // Bukan JSON, gunakan pesan asli
             }
            showNotification(`Failed to save week: ${error.message}`, 'error');
        }
    }

    function openMomModal(mom = null) {
        currentAction = mom ? 'edit' : 'add';
        document.getElementById('momModalTitle').textContent = mom ? 'Edit Minutes of Meeting' : 'Add Minutes of Meeting';
        document.getElementById('saveMomBtn').textContent = mom ? 'Update MOM' : 'Save MOM';
        
        if (mom) {
            document.getElementById('momDate').value = mom.date;
            document.getElementById('momPic').value = mom.pic;
            document.getElementById('momStatus').value = mom.status;
            document.getElementById('momDescription').value = mom.description;
            currentMom = mom;
        } else {
            document.getElementById('momForm').reset();
            document.getElementById('fileList').innerHTML = '';
            document.getElementById('momDate').valueAsDate = new Date();
            currentMom = null;
        }
        
        document.getElementById('momModal').classList.remove('hidden');
    }

    function closeMomModal() {
        document.getElementById('momModal').classList.add('hidden');
    }

    async function handleMomSubmit(e) {
        e.preventDefault();
        
        const formData = {
            date: document.getElementById('momDate').value,
            pic: document.getElementById('momPic').value,
            status: document.getElementById('momStatus').value,
            description: document.getElementById('momDescription').value,
            documents: currentMom?.documents || []
        };
        
        // Handle file uploads
        const fileInput = document.getElementById('momDocument');
        const files = fileInput.files;
        
        try {
            if (files.length > 0) {
                const uploadPromises = Array.from(files).map(file => uploadFile(file));
                const uploadedFiles = await Promise.all(uploadPromises);
                formData.documents = [...formData.documents, ...uploadedFiles];
            }
            
            if (currentAction === 'add') {
                if (!currentWeek || !currentWeek.id) {
                    throw new Error('No week selected');
                }
                await createMOM(currentWeek.id, formData);
                showNotification('MOM added successfully!');
            } else {
                if (!currentMom || !currentMom.id) {
                    throw new Error('MOM ID is missing');
                }
                await updateMOM(currentMom.id, formData);
                showNotification('MOM updated successfully!');
            }
            
            closeMomModal();
            // Refresh MOM list
            const updatedProject = await fetchProjectDetails(currentProject.id);
            if (updatedProject) {
                currentProject = updatedProject;
                const updatedWeek = updatedProject.meeting_weeks.find(w => w.id == currentWeek.id);
                if (updatedWeek) renderMomList(updatedWeek.meetings);
            }
        } catch (error) {
            console.error('Error saving MOM:', error);
            showNotification(`Failed to save MOM: ${error.message}`, 'error');
        }
    }

    function handleFileSelect(e) {
        const files = Array.from(e.target.files);
        const fileList = document.getElementById('fileList');
        if (!fileList) return;
        
        fileList.innerHTML = '';
        files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'flex items-center justify-between p-2 bg-gray-50 rounded';
            fileItem.innerHTML = `
                <div class="flex items-center space-x-2">
                    <i class="fas fa-file text-gray-500"></i>
                    <span class="text-sm text-gray-700">${file.name}</span>
                    <span class="text-xs text-gray-500">(${(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button type="button" class="text-red-500 hover:text-red-700 remove-file-btn" data-file-name="${file.name}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            fileList.appendChild(fileItem);
        });
        
        // Add remove event listeners
        fileList.querySelectorAll('.remove-file-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const fileName = this.dataset.fileName;
                removeFile(fileName);
            });
        });
    }

    function removeFile(fileName) {
        const fileInput = document.getElementById('momDocument');
        const files = Array.from(fileInput.files);
        const updatedFiles = files.filter(file => file.name !== fileName);
        
        const dataTransfer = new DataTransfer();
        updatedFiles.forEach(file => dataTransfer.items.add(file));
        fileInput.files = dataTransfer.files;
        
        // Refresh file list display
        handleFileSelect({ target: fileInput });
    }

    function deleteWeek(weekId) {
        if (!weekId) {
            showNotification('Invalid week ID', 'error');
            return;
        }
        
        const week = (currentProject.meeting_weeks || []).find(w => w.id == weekId);
        if (!week) return;
        
        const momCount = week.meetings?.length || 0;
        const weekName = week.name || `Week ${week.week_number || 0}`;
        let message = `Are you sure you want to delete "${weekName}"?`;
        
        if (momCount > 0) {
            message += ` This will also delete ${momCount} MOM(s) associated with this week.`;
        }
        
        document.getElementById('confirmMessage').textContent = message;
        pendingDeleteAction = { type: 'week', id: weekId };
        document.getElementById('confirmModal').classList.remove('hidden');
    }

    function deleteMom(momId) {
        if (!momId) {
            showNotification('Invalid MOM ID', 'error');
            return;
        }
        
        const mom = (currentWeek.meetings || []).find(m => m.id == momId);
        if (!mom) return;
        
        const message = `Are you sure you want to delete the MOM from ${formatDate(mom.date)}?`;
        document.getElementById('confirmMessage').textContent = message;
        pendingDeleteAction = { type: 'mom', id: momId };
        document.getElementById('confirmModal').classulList.remove('hidden');
    }

    async function executeDelete() {
        if (!pendingDeleteAction) return;
        
        try {
            if (pendingDeleteAction.type === 'week') {
                await deleteMeetingWeek(pendingDeleteAction.id);
                showNotification('Week deleted successfully!');
                
                // Refresh project data
                const updatedProject = await fetchProjectDetails(currentProject.id);
                if (updatedProject) {
                    currentProject = updatedProject;
                    renderWeeklyView(updatedProject);
                    showWeeklyView();
                }
            } else if (pendingDeleteAction.type === 'mom') {
                await deleteMOM(pendingDeleteAction.id);
                showNotification('MOM deleted successfully!');
                
                // Refresh MOM list
                const updatedProject = await fetchProjectDetails(currentProject.id);
                if (updatedProject) {
                    currentProject = updatedProject;
                    const updatedWeek = updatedProject.meeting_weeks.find(w => w.id == currentWeek.id);
                    if (updatedWeek) renderMomList(updatedWeek.meetings);
                }
            }
        } catch (error) {
            console.error('Error deleting:', error);
            showNotification(`Failed to delete: ${error.message}`, 'error');
        } finally {
            closeConfirmModal();
        }
    }

    // Navigation Functions
    function showProjectList() {
        if (weeklyView) weeklyView.classList.add('hidden');
        if (momDetailView) momDetailView.classList.add('hidden');
        if (projectListView) projectListView.classList.remove('hidden');
        currentProject = null;
        currentWeek = null;
    }

    function showWeeklyView() {
        if (momDetailView) momDetailView.classList.add('hidden');
        if (weeklyView) weeklyView.classList.remove('hidden');
        currentWeek = null;
    }

    function closeConfirmModal() {
        if (document.getElementById('confirmModal')) {
            document.getElementById('confirmModal').classList.add('hidden');
        }
        pendingDeleteAction = null;
    }
});