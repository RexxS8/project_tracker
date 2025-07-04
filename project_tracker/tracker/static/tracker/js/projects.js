// Variabel Global
let projects = [];
let currentEditId = null; 
let currentProjectId = null; 
let currentWeeklyProgressEditId = null;
let weeklyProgressFiles = new DataTransfer();

// --- Fungsi Utilitas ---
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

async function uploadFile(file, uploadType) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`/api/upload/${uploadType}/`, {
        method: 'POST',
        headers: { 'X-CSRFToken': getCookie('csrftoken') },
        body: formData
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'File upload failed');
    }
    return response.json();
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getStatusClass(status) {
    const classes = { 'Not Started': 'bg-gray-100 text-gray-800', 'In Progress': 'bg-blue-100 text-blue-800', 'Completed': 'bg-green-100 text-green-800' };
    return classes[status] || 'bg-gray-100 text-gray-800';
}

function getPriorityClass(priority) {
    const classes = { 
        'High': 'bg-red-100 text-red-800', 
        'Medium': 'bg-yellow-100 text-yellow-800', 
        'Low': 'bg-blue-100 text-blue-800'
    };
    return classes[priority] || 'bg-gray-100 text-gray-800';
}

// Inisialisasi Aplikasi
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('addProjectBtn').addEventListener('click', () => {
        currentEditId = null;
        document.querySelector('#projectModal h3').textContent = 'Add New Project';
        document.getElementById('projectForm').reset();
        document.getElementById('progressValue').textContent = '0%';
        document.getElementById('projectModal').classList.remove('hidden');
    });
    document.getElementById('closeModal').addEventListener('click', () => document.getElementById('projectModal').classList.add('hidden'));
    document.getElementById('progress').addEventListener('input', (e) => { document.getElementById('progressValue').textContent = `${e.target.value}%`; });
    document.getElementById('projectForm').addEventListener('submit', handleFormSubmit);
    fetchProjects();
});

// --- Fetch dan Render Data ---
async function fetchProjects() {
    try {
        const response = await fetch(`/api/projects/`, { headers: { 'Cache-Control': 'no-cache', 'X-CSRFToken': getCookie('csrftoken') } });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        projects = await response.json();
        renderProjects();
    } catch (error) {
        console.error('Failed to fetch projects:', error);
    }
}

function renderProjects() {
    const projectsTableBody = document.getElementById('projectsTableBody');
    projectsTableBody.innerHTML = '';
    projects.forEach(project => {
        const row = document.createElement('tr');
        row.className = 'cursor-pointer hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm font-medium text-gray-900">${project.name}</div></td>
            <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-900">${formatDate(project.start_date)} - ${formatDate(project.end_date)}</div></td>
            <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(project.status)}">${project.status}</span></td>
            <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityClass(project.priority)}">${project.priority}</span></td>
            <td class="px-6 py-4 whitespace-nowrap"><div class="flex items-center"><div class="w-full bg-gray-200 rounded-full h-2.5"><div class="bg-blue-600 h-2.5 rounded-full" style="width: ${project.progress}%"></div></div><span class="ml-2 text-sm font-medium text-gray-700">${project.progress}%</span></div></td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><button onclick="event.stopPropagation(); editProject(${project.id})" class="text-blue-600 hover:text-blue-900 mr-3"><i class="fas fa-edit"></i> Edit</button><button onclick="event.stopPropagation(); deleteProject(${project.id})" class="text-red-600 hover:text-red-900"><i class="fas fa-trash"></i> Delete</button></td>`;
        row.addEventListener('click', (e) => { if (!e.target.closest('button')) toggleDropdown(project.id); });
        
        const weeklyRow = document.createElement('tr');
        weeklyRow.className = 'hidden';
        weeklyRow.setAttribute('data-weekly', project.id);
        weeklyRow.innerHTML = `<td colspan="6" class="p-0"><div class="p-4 bg-gray-50"><div class="weekly-progress"><h4 class="font-medium mb-4 text-gray-700">Weekly Progress History</h4><div class="overflow-x-auto border rounded-lg"><table class="min-w-full bg-white"><thead class="bg-gray-100"><tr><th class="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase">Week Period</th><th class="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase">Task & Documents</th><th class="py-2 px-4 border-b text-center text-xs font-medium text-gray-500 uppercase">Target</th><th class="py-2 px-4 border-b text-center text-xs font-medium text-gray-500 uppercase">Submitted</th><th class="py-2 px-4 border-b text-center text-xs font-medium text-gray-500 uppercase">Approved</th><th class="py-2 px-4 border-b text-center text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead><tbody class="weekly-entries" id="weekly-${project.id}"></tbody></table></div><button onclick="openWeeklyProgressModal(${project.id})" class="mt-4 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"><i class="fas fa-plus"></i> Add Progress</button></div></div></td>`;
        
        renderWeeklyProgress(weeklyRow.querySelector(`#weekly-${project.id}`), project.weekly_progress, project.id);
        projectsTableBody.appendChild(row);
        projectsTableBody.appendChild(weeklyRow);
    });
}

// --- PERBAIKAN DI SINI ---
function renderWeeklyProgress(container, weeklyData, projectId) {
    if (!weeklyData || weeklyData.length === 0) {
        container.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">No weekly progress recorded.</td></tr>`;
        return;
    }
    // Mengurutkan data dari yang terbaru (tanggal mulai)
    const sortedData = weeklyData.sort((a, b) => new Date(b.week_start_date) - new Date(a.week_start_date));

    container.innerHTML = sortedData.map(week => {
        const documentsHtml = week.documents && week.documents.length > 0 ? `<div class="mt-2 space-x-2">${week.documents.map(doc => `<a href="${doc.file}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center text-xs text-blue-600 hover:underline" title="${doc.name}"><i class="fas fa-paperclip fa-sm mr-1"></i><span>${doc.name || 'document'}</span></a>`).join('')}</div>` : '';
        return `<tr>
                <td class="py-2 px-4 border-b text-sm whitespace-nowrap">${formatDate(week.week_start_date)} - ${formatDate(week.week_end_date)}</td>
                <td class="py-2 px-4 border-b text-sm">${week.task_description}${documentsHtml}</td>
                <td class="py-2 px-4 border-b text-sm text-center">${week.target_completion}</td>
                <td class="py-2 px-4 border-b text-sm text-center">${week.submitted_task}</td>
                <td class="py-2 px-4 border-b text-sm text-center">${week.approved_task}</td>
                <td class="py-2 px-4 border-b text-center"><button onclick="editWeeklyProgress(${week.id}, ${projectId})" class="text-blue-600 mr-2" title="Edit"><i class="fas fa-edit"></i></button><button onclick="deleteWeeklyProgress(${week.id})" class="text-red-600" title="Delete"><i class="fas fa-trash"></i></button></td>
            </tr>`;
    }).join('');
}

// --- CRUD Project ---
async function handleFormSubmit(e) {
    e.preventDefault();
    const projectData = { name: document.getElementById('projectName').value, start_date: document.getElementById('startDate').value, end_date: document.getElementById('endDate').value, status: document.getElementById('status').value, priority: document.getElementById('priority').value, progress: parseInt(document.getElementById('progress').value), man_power: document.getElementById('manPower').value };
    const url = currentEditId ? `/api/projects/${currentEditId}/` : '/api/projects/';
    const method = currentEditId ? 'PUT' : 'POST';
    try {
        await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') }, body: JSON.stringify(projectData) });
        document.getElementById('projectModal').classList.add('hidden');
        fetchProjects();
    } catch (error) { alert('Error: ' + error.message); }
}

function editProject(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;
    currentEditId = id;
    document.querySelector('#projectModal h3').textContent = 'Edit Project';
    document.getElementById('projectName').value = project.name;
    document.getElementById('startDate').value = project.start_date;
    document.getElementById('endDate').value = project.end_date;
    document.getElementById('status').value = project.status;
    document.getElementById('priority').value = project.priority;
    document.getElementById('progress').value = project.progress;
    document.getElementById('manPower').value = project.man_power || '';
    document.getElementById('progressValue').textContent = `${project.progress}%`;
    document.getElementById('projectModal').classList.remove('hidden');
}

async function deleteProject(id) {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
        await fetch(`/api/projects/${id}/`, { method: 'DELETE', headers: { 'X-CSRFToken': getCookie('csrftoken') } });
        fetchProjects();
    } catch (error) { alert('Failed to delete project: ' + error.message); }
}

// --- CRUD Weekly Progress ---
async function openWeeklyProgressModal(projectId, weekId = null) {
    currentWeeklyProgressEditId = weekId;
    currentProjectId = projectId;
    document.getElementById('weeklyModal')?.remove();
    weeklyProgressFiles = new DataTransfer();

    const modalHtml = `
        <div id="weeklyModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6" onclick="event.stopPropagation()">
                <div class="flex justify-between items-center mb-6"><h3 class="text-lg font-medium text-gray-800">${weekId ? 'Edit' : 'Add'} Weekly Progress</h3><button onclick="closeWeeklyModal()" class="text-gray-400 hover:text-gray-500">&times;</button></div>
                <form id="weeklyProgressForm" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label class="block text-sm font-medium">Week Start Date</label><input type="date" id="weekStartDate" class="w-full mt-1 px-3 py-2 border rounded-md" required></div>
                        <div><label class="block text-sm font-medium">Week End Date</label><input type="date" id="weekEndDate" class="w-full mt-1 px-3 py-2 border rounded-md" required></div>
                        <div class="md:col-span-2"><label class="block text-sm font-medium">Task Description</label><input type="text" id="taskDescription" class="w-full mt-1 px-3 py-2 border rounded-md" required></div>
                        <div><label class="block text-sm font-medium">Target Completion</label><input type="number" id="targetCompletion" class="w-full mt-1 px-3 py-2 border rounded-md" required></div>
                        <div><label class="block text-sm font-medium">Submitted Task</label><input type="number" id="submittedTask" class="w-full mt-1 px-3 py-2 border rounded-md" required></div>
                        <div><label class="block text-sm font-medium">Revised</label><input type="number" id="revised" class="w-full mt-1 px-3 py-2 border rounded-md" required></div>
                        <div><label class="block text-sm font-medium">Approved by Comments</label><input type="number" id="approvedByComments" class="w-full mt-1 px-3 py-2 border rounded-md" required></div>
                        <div><label class="block text-sm font-medium">Approved Task</label><input type="number" id="approvedTask" class="w-full mt-1 px-3 py-2 border rounded-md" required></div>
                    </div>
                    <div><label class="block text-sm font-medium mb-1">Supporting Documents</label><div class="border-2 border-dashed rounded-lg p-4"><input type="file" id="wpDocumentInput" multiple class="hidden"><div id="wpDropZone" class="text-center cursor-pointer"><i class="fas fa-cloud-upload-alt text-2xl text-gray-400 mb-2"></i><p class="text-sm text-gray-600">Click to upload or drag and drop</p></div><div id="wpFileList" class="mt-3 space-y-2"></div></div></div>
                    <button type="submit" class="bg-green-600 text-white w-full py-2 rounded-md hover:bg-green-700">Save Progress</button>
                </form>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('wpDropZone').addEventListener('click', () => document.getElementById('wpDocumentInput').click());
    document.getElementById('wpDocumentInput').addEventListener('change', handleWeeklyFileSelect);
    document.getElementById('weeklyProgressForm').addEventListener('submit', handleWeeklyFormSubmit);
    
    if (weekId) {
        try {
            const response = await fetch(`/api/weekly-progress/${weekId}/`);
            const data = await response.json();
            document.getElementById('weekStartDate').value = data.week_start_date;
            document.getElementById('weekEndDate').value = data.week_end_date;
            document.getElementById('taskDescription').value = data.task_description;
            document.getElementById('targetCompletion').value = data.target_completion;
            document.getElementById('submittedTask').value = data.submitted_task;
            document.getElementById('revised').value = data.revised;
            document.getElementById('approvedByComments').value = data.approved_task_by_comments;
            document.getElementById('approvedTask').value = data.approved_task;
            if (data.documents && data.documents.length > 0) renderWeeklyFileList(data.documents);
        } catch (error) { alert(error.message); closeWeeklyModal(); }
    }
}

async function handleWeeklyFormSubmit(e) {
    e.preventDefault();
    const saveButton = e.target.querySelector('button[type="submit"]');
    saveButton.disabled = true; saveButton.textContent = 'Saving...';
    
    const weekData = {
        week_start_date: document.getElementById('weekStartDate').value,
        week_end_date: document.getElementById('weekEndDate').value,
        task_description: document.getElementById('taskDescription').value,
        target_completion: parseInt(document.getElementById('targetCompletion').value),
        submitted_task: parseInt(document.getElementById('submittedTask').value),
        revised: parseInt(document.getElementById('revised').value),
        approved_task_by_comments: parseInt(document.getElementById('approvedByComments').value),
        approved_task: parseInt(document.getElementById('approvedTask').value),
        documents: []
    };
    
    if(currentWeeklyProgressEditId) { const progress = projects.find(p => p.id === currentProjectId)?.weekly_progress.find(wp => wp.id === currentWeeklyProgressEditId); if (progress?.documents) weekData.documents = progress.documents; }
    
    try {
        const newFilesToUpload = Array.from(weeklyProgressFiles.files);
        if (newFilesToUpload.length > 0) { const uploadPromises = newFilesToUpload.map(file => uploadFile(file, 'weekly_progress')); const uploadedFiles = await Promise.all(uploadPromises); weekData.documents.push(...uploadedFiles); }
        
        const url = currentWeeklyProgressEditId ? `/api/weekly-progress/${currentWeeklyProgressEditId}/` : `/api/projects/${currentProjectId}/weekly-progress/`;
        const method = currentWeeklyProgressEditId ? 'PUT' : 'POST';
        await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') }, body: JSON.stringify(weekData) });
        
        closeWeeklyModal();
        fetchProjects();
    } catch (error) { 
        alert('Failed to save weekly progress: ' + error.message);
    } finally { 
        saveButton.disabled = false; saveButton.textContent = 'Save Progress'; 
    }
}

function editWeeklyProgress(weekId, projectId) { openWeeklyProgressModal(projectId, weekId); }
async function deleteWeeklyProgress(weekId) { if (confirm("Are you sure?")) { await fetch(`/api/weekly-progress/${weekId}/`, { method: 'DELETE', headers: { 'X-CSRFToken': getCookie('csrftoken') } }); fetchProjects(); } }
function closeWeeklyModal() { document.getElementById('weeklyModal')?.remove(); }
function handleWeeklyFileSelect(event) { Array.from(event.target.files).forEach(file => weeklyProgressFiles.items.add(file)); renderWeeklyFileList(null, weeklyProgressFiles.files); }
function renderWeeklyFileList(existingFiles, newFiles) { const fileListContainer = document.getElementById('wpFileList'); if (!fileListContainer) return; fileListContainer.innerHTML = ''; if (existingFiles) { existingFiles.forEach(file => { const fileItem = document.createElement('div'); fileItem.className = 'flex items-center justify-between p-2 bg-gray-100 rounded'; fileItem.innerHTML = `<div class="flex items-center space-x-2 overflow-hidden"><i class="fas fa-check-circle text-green-500"></i><a href="${file.file}" target="_blank" class="text-sm text-gray-700 truncate hover:underline" title="${file.name}">${file.name}</a></div>`; fileListContainer.appendChild(fileItem); }); } if (newFiles) { Array.from(newFiles).forEach(file => { const fileItem = document.createElement('div'); fileItem.className = 'flex items-center justify-between p-2 bg-blue-50 rounded'; fileItem.innerHTML = `<div class="flex items-center space-x-2 overflow-hidden"><i class="fas fa-file-alt text-blue-500"></i><span class="text-sm text-gray-700 truncate">${file.name}</span></div><button type="button" onclick="removeWeeklyFile('${file.name}')" class="text-red-500 hover:text-red-700">&times;</button>`; fileListContainer.appendChild(fileItem); }); } }
function removeWeeklyFile(fileName) { const newFileList = new DataTransfer(); Array.from(weeklyProgressFiles.files).filter(file => file.name !== fileName).forEach(file => newFileList.items.add(file)); weeklyProgressFiles = newFileList; const fileListContainer = document.getElementById('wpFileList'); let existingDocs = []; if(currentWeeklyProgressEditId) { const progress = projects.find(p => p.id === currentProjectId)?.weekly_progress.find(wp => wp.id === currentWeeklyProgressEditId); if (progress?.documents) existingDocs = progress.documents; } renderWeeklyFileList(existingDocs, weeklyProgressFiles.files); }
function toggleDropdown(projectId) { document.querySelector(`tr[data-weekly="${projectId}"]`).classList.toggle('hidden'); }

window.editProject = editProject;
window.deleteProject = deleteProject;
window.toggleDropdown = toggleDropdown;
window.openWeeklyProgressModal = openWeeklyProgressModal;
window.editWeeklyProgress = editWeeklyProgress;
window.deleteWeeklyProgress = deleteWeeklyProgress;
window.closeWeeklyModal = closeWeeklyModal;
window.removeWeeklyFile = removeWeeklyFile;
