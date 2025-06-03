// Dummy data
const dummyProjects = [
    {
        id: 1,
        name: "Website Redesign Project",
        status: "In Progress",
        startDate: "2024-01-15",
        endDate: "2024-04-15",
        progress: 65,
        totalWeeks: 12
    },
    {
        id: 2,
        name: "Mobile App Development",
        status: "In Progress",
        startDate: "2024-02-01",
        endDate: "2024-06-01",
        progress: 40,
        totalWeeks: 16
    },
    {
        id: 3,
        name: "Database Migration",
        status: "Completed",
        startDate: "2024-01-01",
        endDate: "2024-03-01",
        progress: 100,
        totalWeeks: 8
    },
    {
        id: 4,
        name: "ERP Implementation",
        status: "Not Started",
        startDate: "2024-04-01",
        endDate: "2024-10-01",
        progress: 0,
        totalWeeks: 24
    }
];

let currentProject = null;
let currentWeek = null;
let currentMom = null;
let currentAction = 'add'; // 'add' or 'edit'
let pendingDeleteAction = null;
let momData = {}; // Store MOM data by project and week
let projectWeeks = {}; // Store custom weeks for each project

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    renderProjectList();
    setupEventListeners();
    
    // Set today's date as default
    document.getElementById('momDate').valueAsDate = new Date();
    
    // Initialize project weeks with default weeks
    dummyProjects.forEach(project => {
        if (!projectWeeks[project.id]) {
            projectWeeks[project.id] = [];
            for (let i = 1; i <= project.totalWeeks; i++) {
                projectWeeks[project.id].push({
                    id: i,
                    number: i,
                    name: `Week ${i}`
                });
            }
        }
    });
});

function setupEventListeners() {
    // Navigation buttons
    document.getElementById('backToProjects').addEventListener('click', showProjectList);
    document.getElementById('backToWeeks').addEventListener('click', showWeeklyView);
    
    // Add buttons
    document.getElementById('addWeekBtn').addEventListener('click', openWeekModal);
    document.getElementById('addMomBtn').addEventListener('click', () => openMomModal());
    
    // Week modal
    document.getElementById('closeWeekModal').addEventListener('click', closeWeekModal);
    document.getElementById('cancelWeek').addEventListener('click', closeWeekModal);
    document.getElementById('weekForm').addEventListener('submit', handleWeekSubmit);
    
    // MOM modal
    document.getElementById('closeMomModal').addEventListener('click', closeMomModal);
    document.getElementById('cancelMom').addEventListener('click', closeMomModal);
    document.getElementById('momForm').addEventListener('submit', handleMomSubmit);
    
    // Confirmation modal
    document.getElementById('cancelConfirm').addEventListener('click', closeConfirmModal);
    document.getElementById('confirmDelete').addEventListener('click', executeDelete);
    
    // File upload
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('momDocument');
    
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
}

function renderProjectList() {
    const container = document.querySelector('#projectListView .grid');
    container.innerHTML = '';
    
    dummyProjects.forEach(project => {
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
                    <span>Weeks: ${getProjectWeekCount(project.id)}</span>
                    <span>MOMs: ${getMomCount(project.id)}</span>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function showProject(project) {
    currentProject = project;
    document.getElementById('selectedProjectTitle').textContent = project.name;
    
    // Generate weekly view
    const container = document.querySelector('#weeklyView .grid');
    container.innerHTML = '';
    
    const weeks = projectWeeks[project.id] || [];
    weeks.forEach(week => {
        const weekCard = document.createElement('div');
        weekCard.className = 'bg-white rounded-lg shadow-md p-4 card-hover border-l-4 border-blue-500';
        
        const momCount = getWeekMomCount(project.id, week.id);
        const hasActiveMom = hasActiveMoms(project.id, week.id);
        
        weekCard.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <div class="cursor-pointer flex-1 week-clickable" data-project-id="${project.id}" data-week-id="${week.id}">
                    <h4 class="font-semibold text-gray-800">${week.name}</h4>
                    <p class="text-sm text-gray-600">Week ${week.number}</p>
                </div>
                <div class="flex space-x-1">
                    <button class="text-blue-500 hover:text-blue-700 p-1 edit-week-btn" data-week-id="${week.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-red-500 hover:text-red-700 p-1 delete-week-btn" data-week-id="${week.id}">
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
    
    // Add event listeners to the newly created elements
    container.querySelectorAll('.week-clickable').forEach(element => {
        element.addEventListener('click', function() {
            const projectId = parseInt(this.dataset.projectId);
            const weekId = parseInt(this.dataset.weekId);
            const week = projectWeeks[projectId].find(w => w.id === weekId);
            showWeek(project, week);
        });
    });
    
    container.querySelectorAll('.edit-week-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const weekId = parseInt(this.dataset.weekId);
            const week = projectWeeks[project.id].find(w => w.id === weekId);
            editWeek(week);
        });
    });
    
    container.querySelectorAll('.delete-week-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const weekId = parseInt(this.dataset.weekId);
            deleteWeek(weekId);
        });
    });
    
    document.getElementById('projectListView').classList.add('hidden');
    document.getElementById('weeklyView').classList.remove('hidden');
}

function showWeek(project, week) {
    currentWeek = week;
    document.getElementById('selectedWeekTitle').textContent = `${week.name} - ${project.name}`;
    
    renderMomList();
    
    document.getElementById('weeklyView').classList.add('hidden');
    document.getElementById('momDetailView').classList.remove('hidden');
}

function renderMomList() {
    const container = document.getElementById('momList');
    const moms = getMoms(currentProject.id, currentWeek.id);
    
    if (moms.length === 0) {
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
        const momCard = document.createElement('div');
        momCard.className = 'bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500';
        
        const statusColor = getMomStatusColor(mom.status);
        
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
            ${mom.documents && mom.documents.length > 0 ? `
                <div class="border-t pt-3">
                    <p class="text-sm font-medium text-gray-600 mb-2">Attachments:</p>
                    <div class="flex flex-wrap gap-2">
                        ${mom.documents.map(doc => `
                            <span class="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                <i class="fas fa-paperclip mr-1"></i>
                                ${doc.name}
                            </span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;
        
        container.appendChild(momCard);
    });
    
    // Add event listeners for edit and delete buttons
    container.querySelectorAll('.edit-mom-btn').forEach(button => {
        button.addEventListener('click', function() {
            const momId = parseInt(this.dataset.momId);
            const mom = getMoms(currentProject.id, currentWeek.id).find(m => m.id === momId);
            editMom(mom);
        });
    });
    
    container.querySelectorAll('.delete-mom-btn').forEach(button => {
        button.addEventListener('click', function() {
            const momId = parseInt(this.dataset.momId);
            deleteMom(momId);
        });
    });
}

// Week Management Functions
function openWeekModal(week = null) {
    currentAction = week ? 'edit' : 'add';
    document.getElementById('weekModalTitle').textContent = week ? 'Edit Week' : 'Add Week';
    
    if (week) {
        document.getElementById('weekNumber').value = week.number;
        document.getElementById('weekName').value = week.name;
        // Store the current week being edited
        currentWeek = week;
    } else {
        document.getElementById('weekForm').reset();
        // Set next week number
        const weeks = projectWeeks[currentProject.id] || [];
        const maxWeek = weeks.length > 0 ? Math.max(...weeks.map(w => w.number)) : 0;
        document.getElementById('weekNumber').value = maxWeek + 1;
        currentWeek = null;
    }
    
    document.getElementById('weekModal').classList.remove('hidden');
}

function closeWeekModal() {
    document.getElementById('weekModal').classList.add('hidden');
    currentAction = 'add';
    currentWeek = null;
}

function handleWeekSubmit(e) {
    e.preventDefault();
    
    const weekNumber = parseInt(document.getElementById('weekNumber').value);
    const weekName = document.getElementById('weekName').value || `Week ${weekNumber}`;
    
    if (currentAction === 'add') {
        const newWeek = {
            id: Date.now(),
            number: weekNumber,
            name: weekName
        };
        
        if (!projectWeeks[currentProject.id]) {
            projectWeeks[currentProject.id] = [];
        }
        
        projectWeeks[currentProject.id].push(newWeek);
        showNotification('Week added successfully!', 'success');
    } else {
        // Edit existing week
        const weeks = projectWeeks[currentProject.id];
        const weekIndex = weeks.findIndex(w => w.id === currentWeek.id);
        if (weekIndex !== -1) {
            weeks[weekIndex] = { ...weeks[weekIndex], number: weekNumber, name: weekName };
            showNotification('Week updated successfully!', 'success');
        }
    }
    
    closeWeekModal();
    showProject(currentProject);
}

function editWeek(week) {
    openWeekModal(week);
}

function deleteWeek(weekId) {
    const week = projectWeeks[currentProject.id].find(w => w.id === weekId);
    const momCount = getWeekMomCount(currentProject.id, weekId);
    
    let message = `Are you sure you want to delete "${week.name}"?`;
    if (momCount > 0) {
        message += ` This will also delete ${momCount} MOM(s) associated with this week.`;
    }
    
    document.getElementById('confirmMessage').textContent = message;
    pendingDeleteAction = { type: 'week', id: weekId };
    document.getElementById('confirmModal').classList.remove('hidden');
}

// MOM Management Functions
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
    currentAction = 'add';
    currentMom = null;
}

function handleMomSubmit(e) {
    e.preventDefault();
    
    const files = Array.from(document.getElementById('momDocument').files);
    
    const formData = {
        date: document.getElementById('momDate').value,
        pic: document.getElementById('momPic').value,
        status: document.getElementById('momStatus').value,
        description: document.getElementById('momDescription').value,
        documents: files.map(file => ({ name: file.name, size: file.size })),
        updatedAt: new Date().toISOString()
    };
    
    const projectId = currentProject.id;
    const weekId = currentWeek.id;
    
    if (!momData[projectId]) {
        momData[projectId] = {};
    }
    if (!momData[projectId][weekId]) {
        momData[projectId][weekId] = [];
    }
    
    if (currentAction === 'add') {
        const newMom = {
            ...formData,
            id: Date.now(),
            createdAt: new Date().toISOString()
        };
        momData[projectId][weekId].push(newMom);
        showNotification('MOM added successfully!', 'success');
    } else {
        // Edit existing MOM
        const momIndex = momData[projectId][weekId].findIndex(m => m.id === currentMom.id);
        if (momIndex !== -1) {
            momData[projectId][weekId][momIndex] = { ...currentMom, ...formData };
            showNotification('MOM updated successfully!', 'success');
        }
    }
    
    closeMomModal();
    renderMomList();
}

function editMom(mom) {
    openMomModal(mom);
}

function deleteMom(momId) {
    const mom = getMoms(currentProject.id, currentWeek.id).find(m => m.id === momId);
    const message = `Are you sure you want to delete the MOM from ${formatDate(mom.date)}?`;
    
    document.getElementById('confirmMessage').textContent = message;
    pendingDeleteAction = { type: 'mom', id: momId };
    document.getElementById('confirmModal').classList.remove('hidden');
}

// Navigation Functions
function showProjectList() {
    document.getElementById('weeklyView').classList.add('hidden');
    document.getElementById('momDetailView').classList.add('hidden');
    document.getElementById('projectListView').classList.remove('hidden');
    currentProject = null;
    currentWeek = null;
}

function showWeeklyView() {
    document.getElementById('momDetailView').classList.add('hidden');
    document.getElementById('weeklyView').classList.remove('hidden');
    currentWeek = null;
}

// Confirmation Modal Functions
function closeConfirmModal() {
    document.getElementById('confirmModal').classList.add('hidden');
    pendingDeleteAction = null;
}

function executeDelete() {
    if (!pendingDeleteAction) return;
    
    if (pendingDeleteAction.type === 'week') {
        const weekId = pendingDeleteAction.id;
        // Remove week
        projectWeeks[currentProject.id] = projectWeeks[currentProject.id].filter(w => w.id !== weekId);
        
        // Remove associated MOMs
        if (momData[currentProject.id] && momData[currentProject.id][weekId]) {
            delete momData[currentProject.id][weekId];
        }
        
        showNotification('Week deleted successfully!', 'success');
        showProject(currentProject);
    } else if (pendingDeleteAction.type === 'mom') {
        const momId = pendingDeleteAction.id;
        const projectId = currentProject.id;
        const weekId = currentWeek.id;
        
        if (momData[projectId] && momData[projectId][weekId]) {
            momData[projectId][weekId] = momData[projectId][weekId].filter(m => m.id !== momId);
        }
        
        showNotification('MOM deleted successfully!', 'success');
        renderMomList();
    }
    
    closeConfirmModal();
}

// File Upload Functions
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    const fileList = document.getElementById('fileList');
    
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
            <button type="button" onclick="removeFile('${file.name}')" class="text-red-500 hover:text-red-700">
                <i class="fas fa-times"></i>
            </button>
        `;
        fileList.appendChild(fileItem);
    });
}

function removeFile(filename) {
    const fileInput = document.getElementById('momDocument');
    const dt = new DataTransfer();
    
    Array.from(fileInput.files).forEach(file => {
        if (file.name !== filename) {
            dt.items.add(file);
        }
    });
    
    fileInput.files = dt.files;
    handleFileSelect({ target: fileInput });
}

// Utility Functions
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

function getMomCount(projectId) {
    if (!momData[projectId]) return 0;
    let total = 0;
    Object.values(momData[projectId]).forEach(weekMoms => {
        total += weekMoms.length;
    });
    return total;
}

function getWeekMomCount(projectId, weekId) {
    return momData[projectId] && momData[projectId][weekId] ? momData[projectId][weekId].length : 0;
}

function hasActiveMoms(projectId, weekId) {
    if (!momData[projectId] || !momData[projectId][weekId]) return false;
    return momData[projectId][weekId].some(mom => mom.status !== 'Closed');
}

function getMoms(projectId, weekId) {
    return momData[projectId] && momData[projectId][weekId] ? momData[projectId][weekId] : [];
}

function getProjectWeekCount(projectId) {
    return projectWeeks[projectId] ? projectWeeks[projectId].length : 0;
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
    }`;
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}