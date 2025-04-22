// Project data array
let projects = [];
let currentEditId = null;

// DOM Elements
const addProjectBtn = document.getElementById('addProjectBtn');
const projectModal = document.getElementById('projectModal');
const closeModal = document.getElementById('closeModal');
const projectForm = document.getElementById('projectForm');
const progressInput = document.getElementById('progress');
const progressValue = document.getElementById('progressValue');
const projectsTableBody = document.getElementById('projectsTableBody');
const modalTitle = document.querySelector('#projectModal h3');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Event listeners
    addProjectBtn.addEventListener('click', () => {
        currentEditId = null;
        modalTitle.textContent = 'Add New Project';
        projectForm.reset();
        progressValue.textContent = '0%';
        projectModal.classList.remove('hidden');
    });
    
    closeModal.addEventListener('click', () => {
        projectModal.classList.add('hidden');
    });
    
    progressInput.addEventListener('input', (e) => {
        progressValue.textContent = `${e.target.value}%`;
    });
    
    projectForm.addEventListener('submit', handleFormSubmit);
    
    // Initial render
    renderProjects();
});

// Render projects to the table
function renderProjects() {
    projectsTableBody.innerHTML = '';
    
    projects.forEach(project => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${project.name}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${formatDate(project.startDate)} - ${formatDate(project.endDate)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(project.status)}">
                    ${project.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityClass(project.priority)}">
                    ${project.priority}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="w-full bg-gray-200 rounded-full h-2.5">
                        <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${project.progress}%"></div>
                    </div>
                    <span class="ml-2 text-sm font-medium text-gray-700">${project.progress}%</span>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="editProject(${project.id})" class="text-blue-600 hover:text-blue-900 mr-3">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button onclick="deleteProject(${project.id})" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        
        projectsTableBody.appendChild(row);
    });
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    const projectData = {
        name: document.getElementById('projectName').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        status: document.getElementById('status').value,
        priority: document.getElementById('priority').value,
        progress: parseInt(document.getElementById('progress').value)
    };
    
    if (currentEditId !== null) {
        // Update existing project
        const index = projects.findIndex(p => p.id === currentEditId);
        projects[index] = { ...projects[index], ...projectData };
    } else {
        // Add new project
        projects.push({
            id: projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1,
            ...projectData
        });
    }
    
    projectModal.classList.add('hidden');
    projectForm.reset();
    renderProjects();
}

// Edit project
function editProject(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;
    
    currentEditId = id;
    modalTitle.textContent = 'Edit Project';
    
    // Fill form with project data
    document.getElementById('projectName').value = project.name;
    document.getElementById('startDate').value = project.startDate;
    document.getElementById('endDate').value = project.endDate;
    document.getElementById('status').value = project.status;
    document.getElementById('priority').value = project.priority;
    document.getElementById('progress').value = project.progress;
    progressValue.textContent = `${project.progress}%`;
    
    projectModal.classList.remove('hidden');
}

// Delete project
function deleteProject(id) {
    if (confirm('Are you sure you want to delete this project?')) {
        projects = projects.filter(p => p.id !== id);
        renderProjects();
    }
}

// Helper functions
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function getStatusClass(status) {
    switch (status) {
        case 'Not Started':
            return 'bg-gray-100 text-gray-800';
        case 'In Progress':
            return 'bg-blue-100 text-blue-800';
        case 'Completed':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

function getPriorityClass(priority) {
    switch (priority) {
        case 'High':
            return 'bg-red-100 text-red-800';
        case 'Medium':
            return 'bg-yellow-100 text-yellow-800';
        case 'Low':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}