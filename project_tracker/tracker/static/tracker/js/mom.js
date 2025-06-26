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

    function setupEventListeners() {
        document.getElementById('backToProjects').addEventListener('click', showProjectList);
        document.getElementById('backToWeeks').addEventListener('click', showWeeklyView);
        document.getElementById('addWeekBtn').addEventListener('click', () => openWeekModal());
        document.getElementById('addMomBtn').addEventListener('click', () => openMomModal());
        document.getElementById('weekForm').addEventListener('submit', handleWeekSubmit);
        document.getElementById('momForm').addEventListener('submit', handleMomSubmit);
        document.getElementById('closeWeekModal').addEventListener('click', closeWeekModal);
        document.getElementById('cancelWeek').addEventListener('click', closeWeekModal);
        document.getElementById('closeMomModal').addEventListener('click', closeMomModal);
        document.getElementById('cancelMom').addEventListener('click', closeMomModal);
        document.getElementById('cancelConfirm').addEventListener('click', closeConfirmModal);
        document.getElementById('confirmDelete').addEventListener('click', executeDelete);
        
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('momDocument');
        if (dropZone) {
            dropZone.addEventListener('click', () => fileInput.click());
            dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('border-blue-500'); });
            dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-blue-500'));
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('border-blue-500');
                fileInput.files = e.dataTransfer.files;
                handleFileSelect({ target: fileInput });
            });
        }
        if (fileInput) { fileInput.addEventListener('change', handleFileSelect); }
    }

    // --- API Functions ---
    function fetchProjects() {
        fetch(`${apiBaseUrl}/api/projects/`).then(handleResponse).then(renderProjectList).catch(err => console.error('Fetch Projects Error:', err));
    }
    function fetchProjectDetails(projectId) {
        return fetch(`${apiBaseUrl}/api/projects/${projectId}/`).then(handleResponse);
    }
    function createMeetingWeek(projectId, data) {
        return fetch(`${apiBaseUrl}/api/projects/${projectId}/meeting-weeks/`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() }, body: JSON.stringify(data) }).then(handleResponse);
    }
    function updateMeetingWeek(weekId, data) {
        return fetch(`${apiBaseUrl}/api/meeting-weeks/${weekId}/`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() }, body: JSON.stringify(data) }).then(handleResponse);
    }
    function deleteMeetingWeek(weekId) {
        return fetch(`${apiBaseUrl}/api/meeting-weeks/${weekId}/`, { method: 'DELETE', headers: { 'X-CSRFToken': getCsrfToken() } }).then(res => res.ok ? null : handleResponse(res));
    }
    function createMOM(weekId, data) {
        return fetch(`${apiBaseUrl}/api/meeting-weeks/${weekId}/moms/`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() }, body: JSON.stringify(data) }).then(handleResponse);
    }
    function updateMOM(momId, data) {
        return fetch(`${apiBaseUrl}/api/moms/${momId}/`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() }, body: JSON.stringify(data) }).then(handleResponse);
    }
    function deleteMOM(momId) {
        return fetch(`${apiBaseUrl}/api/moms/${momId}/`, { method: 'DELETE', headers: { 'X-CSRFToken': getCsrfToken() } }).then(res => res.ok ? null : handleResponse(res));
    }
    function uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);
        return fetch(`${apiBaseUrl}/api/upload/moms/`, { method: 'POST', headers: { 'X-CSRFToken': getCsrfToken() }, body: formData }).then(handleResponse);
    }

    // --- Helper & UI Functions ---
    async function handleResponse(response) {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
            throw new Error(errorData.detail || errorData.error || JSON.stringify(errorData));
        }
        return response.status === 204 ? null : response.json();
    }
    function getCsrfToken() { return document.querySelector('[name=csrfmiddlewaretoken]').value; }
    function getStatusColor(status) { return { 'Completed': 'bg-green-100 text-green-800', 'In Progress': 'bg-blue-100 text-blue-800', 'Not Started': 'bg-gray-100 text-gray-800' }[status] || 'bg-gray-100'; }
    function getMomStatusColor(status) { return { 'Open': 'bg-red-100 text-red-800', 'In Progress': 'bg-yellow-100 text-yellow-800', 'Closed': 'bg-green-100 text-green-800' }[status] || 'bg-gray-100'; }
    function formatDate(dateString) { if (!dateString) return 'N/A'; return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    function showNotification(message, type = 'success') { alert(`${type.toUpperCase()}: ${message}`); }

    // --- Render Functions ---
    function renderProjectList(projects) {
        const container = projectListView.querySelector('.grid');
        container.innerHTML = '';
        if (!projects || projects.length === 0) { container.innerHTML = `<p class="text-center text-gray-500 col-span-full">No projects found.</p>`; return; }
        projects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-xl shadow-md p-6 card-hover cursor-pointer';
            card.onclick = () => showProject(project);
            card.innerHTML = `<div class="flex items-center justify-between mb-4"><h3 class="text-lg font-semibold text-gray-800 truncate" title="${project.name}">${project.name}</h3><i class="fas fa-folder-open text-blue-500"></i></div><div class="space-y-3"><div class="flex justify-between items-center"><span class="text-sm text-gray-600">Status:</span><span class="px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}">${project.status}</span></div><div class="flex justify-between items-center"><span class="text-sm text-gray-600">Progress:</span><span class="text-sm font-medium">${project.progress}%</span></div><div class="w-full bg-gray-200 rounded-full h-2"><div class="bg-blue-600 h-2 rounded-full" style="width: ${project.progress}%"></div></div><div class="flex justify-between items-center text-xs text-gray-500 pt-2"><span>Weeks: ${project.meeting_weeks?.length || 0}</span><span>MOMs: ${project.total_moms_count || 0}</span></div></div>`;
            container.appendChild(card);
        });
    }

    async function showProject(project) {
        const fullProject = await fetchProjectDetails(project.id);
        if (!fullProject) return;
        currentProject = fullProject;
        document.getElementById('selectedProjectTitle').textContent = fullProject.name;
        renderWeeklyView(fullProject);
        projectListView.classList.add('hidden');
        weeklyView.classList.remove('hidden');
        momDetailView.classList.add('hidden');
    }

    function renderWeeklyView(project) {
        const container = weeklyView.querySelector('.grid');
        container.innerHTML = '';
        const sortedWeeks = (project.meeting_weeks || []).sort((a, b) => a.week_number - b.week_number);
        if (sortedWeeks.length === 0) { container.innerHTML = `<div class="text-center py-12 col-span-full"><i class="fas fa-calendar-times text-4xl text-gray-300 mb-4"></i><h3 class="text-lg font-medium text-gray-600">No weeks created yet</h3><p class="text-gray-500">Click "Add Week" to get started.</p></div>`; return; }
        sortedWeeks.forEach(week => {
            const weekName = week.name || `Week ${week.week_number}`;
            const hasActiveMom = week.meetings?.some(mom => mom.status !== 'Closed') || false;
            const weekCard = document.createElement('div');
            weekCard.className = 'bg-white rounded-lg shadow-md p-4 card-hover border-l-4 border-blue-500';
            weekCard.innerHTML = `<div><div class="flex justify-between items-start mb-3"><div class="cursor-pointer flex-1 week-clickable" data-week-id="${week.id}"><h4 class="font-semibold text-gray-800" title="${weekName}">${weekName}</h4><p class="text-sm text-gray-600">Week ${week.week_number}</p></div><div class="flex space-x-1"><button class="text-blue-500 hover:text-blue-700 p-1 edit-week-btn" title="Edit Week" data-week-id="${week.id}"><i class="fas fa-edit"></i></button><button class="text-red-500 hover:text-red-700 p-1 delete-week-btn" title="Delete Week" data-week-id="${week.id}"><i class="fas fa-trash"></i></button></div></div></div><div class="flex items-center justify-between mt-2 pt-2 border-t"><div class="flex items-center space-x-2">${hasActiveMom ? '<i class="fas fa-exclamation-circle text-orange-500 animate-pulse"></i>' : '<i class="fas fa-check-circle text-green-500"></i>'}<span class="text-sm text-gray-600">MOMs: ${week.meetings?.length || 0}</span></div><div class="text-xs text-gray-500">${week.meetings?.length > 0 ? 'Click to view' : ''}</div></div>`;
            container.appendChild(weekCard);
        });
        container.querySelectorAll('.week-clickable').forEach(el => el.onclick = () => showWeek((currentProject.meeting_weeks || []).find(w => w.id == el.dataset.weekId)));
        container.querySelectorAll('.edit-week-btn').forEach(btn => btn.onclick = (e) => { e.stopPropagation(); openWeekModal((currentProject.meeting_weeks || []).find(w => w.id == btn.dataset.weekId)); });
        container.querySelectorAll('.delete-week-btn').forEach(btn => btn.onclick = (e) => { e.stopPropagation(); confirmDelete('week', btn.dataset.weekId); });
    }
    
    function showWeek(week) {
        if (!week) return;
        currentWeek = week;
        document.getElementById('selectedWeekTitle').textContent = `${week.name || `Week ${week.week_number}`} - ${currentProject.name}`;
        renderMomList(week.meetings || []);
        weeklyView.classList.add('hidden');
        momDetailView.classList.remove('hidden');
    }

    // --- PERUBAHAN DI SINI: Render MOM List ---
    function renderMomList(moms) {
        const container = document.getElementById('momList');
        if (!container) return;
        if (!moms || moms.length === 0) { container.innerHTML = `<div class="text-center py-12"><i class="fas fa-clipboard-list text-4xl text-gray-300 mb-4"></i><h3 class="text-lg font-medium text-gray-600 mb-2">No meetings recorded</h3><p class="text-gray-500">Click "Add MOM" to create your first meeting minute.</p></div>`; return; }
        
        container.innerHTML = '';
        const sortedMoms = moms.sort((a, b) => new Date(b.date) - new Date(a.date));
        sortedMoms.forEach(mom => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDate = mom.due_date ? new Date(mom.due_date + 'T00:00:00') : null;
            let isOverdue = dueDate && mom.status !== 'Closed' && dueDate < today;
            let dueDateHtml = mom.due_date ? `<p class="text-sm ${isOverdue ? 'text-red-500 font-bold animate-pulse' : 'text-gray-500'}"><i class="fas fa-calendar-check mr-2"></i>Due: ${formatDate(mom.due_date)}</p>` : '';
            const documentsHtml = mom.documents && mom.documents.length > 0 ? `<div class="border-t pt-3 mt-4"><p class="text-sm font-medium text-gray-600 mb-2">Attachments:</p><div class="flex flex-wrap gap-2">${mom.documents.map(doc => `<a href="${doc.file}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100"><i class="fas fa-paperclip mr-1.5"></i><span class="truncate">${doc.name || 'document'}</span></a>`).join('')}</div></div>` : '';
            
            const momCard = document.createElement('div');
            const borderColor = mom.status === 'Open' ? 'border-red-500' : mom.status === 'In Progress' ? 'border-yellow-500' : 'border-green-500';
            momCard.className = `bg-white rounded-lg shadow-md p-6 border-l-4 ${borderColor}`;
            
            // --- MODIFIKASI TATA LETAK DI SINI ---
            momCard.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                            <h4 class="font-semibold text-gray-800">Meeting - ${formatDate(mom.date)}</h4>
                            <span class="px-2 py-0.5 rounded-full text-xs font-medium ${getMomStatusColor(mom.status)}">${mom.status}</span>
                        </div>
                        <div class="flex items-center space-x-4 text-sm text-gray-600">
                            <p><i class="fas fa-user-tie mr-2"></i>PIC: ${mom.pic}</p>
                            ${dueDateHtml}
                        </div>
                    </div>
                    <div class="flex space-x-1 flex-shrink-0">
                        <button class="text-blue-500 hover:text-blue-700 p-2 edit-mom-btn" title="Edit MOM" data-mom-id="${mom.id}"><i class="fas fa-edit"></i></button>
                        <button class="text-red-500 hover:text-red-700 p-2 delete-mom-btn" title="Delete MOM" data-mom-id="${mom.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="mb-4 text-gray-700 whitespace-pre-wrap">${mom.description}</div>
                ${documentsHtml}
            `;
            container.appendChild(momCard);
        });
        container.querySelectorAll('.edit-mom-btn').forEach(btn => btn.onclick = () => openMomModal((currentWeek.meetings || []).find(m => m.id == btn.dataset.momId)));
        container.querySelectorAll('.delete-mom-btn').forEach(btn => btn.onclick = () => confirmDelete('mom', btn.dataset.momId));
    }

    // --- CRUD and Modal Logic ---
    function openWeekModal(week = null) {
        currentAction = week ? 'edit' : 'add';
        document.getElementById('weekModalTitle').textContent = week ? 'Edit Week' : 'Add New Week';
        document.getElementById('weekForm').reset();
        if (week) {
            document.getElementById('weekNumber').value = week.week_number;
            document.getElementById('weekName').value = week.name || '';
        }
        currentWeek = week ? currentProject.meeting_weeks.find(w => w.id === week.id) : null;
        document.getElementById('weekModal').classList.remove('hidden');
    }

    function closeWeekModal() { document.getElementById('weekModal').classList.add('hidden'); }

    async function handleWeekSubmit(e) {
        e.preventDefault();
        const weekNumber = parseInt(document.getElementById('weekNumber').value, 10);
        if (isNaN(weekNumber) || weekNumber <= 0) { showNotification('Week number must be a positive integer.', 'error'); return; }
        const data = { week_number: weekNumber, name: document.getElementById('weekName').value.trim() || `Week ${weekNumber}` };
        try {
            if (currentAction === 'add') await createMeetingWeek(currentProject.id, data);
            else await updateMeetingWeek(currentWeek.id, data);
            closeWeekModal();
            showProject(currentProject);
        } catch (error) { showNotification(`Failed to save week: ${error.message}`, 'error'); }
    }
    
    function openMomModal(mom = null) {
        currentAction = mom ? 'edit' : 'add';
        document.getElementById('momModalTitle').textContent = mom ? 'Edit Minutes of Meeting' : 'Add Minutes of Meeting';
        document.getElementById('saveMomBtn').textContent = mom ? 'Update MOM' : 'Save MOM';
        document.getElementById('momForm').reset();
        document.getElementById('fileList').innerHTML = '';
        if (mom) {
            document.getElementById('momDate').value = mom.date;
            document.getElementById('momDueDate').value = mom.due_date || '';
            document.getElementById('momPic').value = mom.pic;
            document.getElementById('momStatus').value = mom.status;
            document.getElementById('momDescription').value = mom.description;
            currentMom = mom;
        } else {
            document.getElementById('momDate').valueAsDate = new Date();
            currentMom = null;
        }
        document.getElementById('momModal').classList.remove('hidden');
    }

    function closeMomModal() { document.getElementById('momModal').classList.add('hidden'); }

    async function handleMomSubmit(e) {
        e.preventDefault();
        if (!currentWeek.id) { showNotification('Parent week is not selected.', 'error'); return; }
        
        const dueDateValue = document.getElementById('momDueDate').value;
        const payload = {
            date: document.getElementById('momDate').value,
            due_date: dueDateValue ? dueDateValue : null,
            pic: document.getElementById('momPic').value,
            status: document.getElementById('momStatus').value,
            description: document.getElementById('momDescription').value,
            documents: currentMom?.documents || []
        };
        
        try {
            const files = document.getElementById('momDocument').files;
            if (files.length > 0) {
                const uploadedFiles = await Promise.all(Array.from(files).map(uploadFile));
                payload.documents = [...payload.documents, ...uploadedFiles];
            }
            
            if (currentAction === 'add') await createMOM(currentWeek.id, payload);
            else await updateMOM(currentMom.id, payload);
            
            closeMomModal();
            const updatedProject = await fetchProjectDetails(currentProject.id);
            if (updatedProject) {
                currentProject = updatedProject;
                const updatedWeek = updatedProject.meeting_weeks.find(w => w.id == currentWeek.id);
                if (updatedWeek) {
                    currentWeek = updatedWeek;
                    renderMomList(updatedWeek.meetings);
                }
            }
        } catch (error) { showNotification(`Failed to save MOM: ${error.message}`, 'error'); }
    }

    function handleFileSelect(e) {
        const files = Array.from(e.target.files);
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '';
        files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'flex items-center justify-between p-2 bg-gray-50 rounded';
            fileItem.innerHTML = `<div class="flex items-center space-x-2 overflow-hidden"><i class="fas fa-file text-gray-500"></i><span class="text-sm text-gray-700 truncate">${file.name}</span><span class="text-xs text-gray-500 flex-shrink-0">(${(file.size / 1024).toFixed(1)} KB)</span></div><button type="button" class="text-red-500 hover:text-red-700 remove-file-btn" data-file-name="${file.name}">&times;</button>`;
            fileList.appendChild(fileItem);
        });
        fileList.querySelectorAll('.remove-file-btn').forEach(btn => btn.onclick = () => removeFileFromInput(btn.dataset.fileName));
    }

    function removeFileFromInput(fileName) {
        const fileInput = document.getElementById('momDocument');
        const dt = new DataTransfer();
        for (let file of fileInput.files) { if (file.name !== fileName) dt.items.add(file); }
        fileInput.files = dt.files;
        handleFileSelect({ target: fileInput });
    }

    function confirmDelete(type, id) {
        if (!id) return;
        let message = '';
        if (type === 'week') {
            const week = (currentProject.meeting_weeks || []).find(w => w.id == id);
            if (!week) return;
            message = `Are you sure you want to delete "${week.name || `Week ${week.week_number}`}"? This will also delete ${week.meetings?.length || 0} associated MOM(s).`;
        } else if (type === 'mom') {
            const mom = (currentWeek.meetings || []).find(m => m.id == id);
            if (!mom) return;
            message = `Are you sure you want to delete the MOM from ${formatDate(mom.date)}?`;
        }
        document.getElementById('confirmMessage').textContent = message;
        pendingDeleteAction = { type, id };
        document.getElementById('confirmModal').classList.remove('hidden');
    }
    
    async function executeDelete() {
        if (!pendingDeleteAction) return;
        const { type, id } = pendingDeleteAction;
        try {
            if (type === 'week') await deleteMeetingWeek(id);
            else if (type === 'mom') await deleteMOM(id);
            
            const updatedProject = await fetchProjectDetails(currentProject.id);
            currentProject = updatedProject;
            if (type === 'week') {
                renderWeeklyView(updatedProject);
            } else {
                const updatedWeek = updatedProject.meeting_weeks.find(w => w.id == currentWeek.id);
                if (updatedWeek) { currentWeek = updatedWeek; renderMomList(updatedWeek.meetings); }
                else { showWeeklyView(); renderWeeklyView(updatedProject); }
            }
        } catch (error) { showNotification(`Failed to delete: ${error.message}`, 'error'); } 
        finally { closeConfirmModal(); }
    }

    function showProjectList() { projectListView.classList.remove('hidden'); weeklyView.classList.add('hidden'); momDetailView.classList.add('hidden'); }
    function showWeeklyView() { weeklyView.classList.remove('hidden'); momDetailView.classList.add('hidden'); currentWeek = null; }
    function closeConfirmModal() { document.getElementById('confirmModal').classList.add('hidden'); pendingDeleteAction = null; }
});
