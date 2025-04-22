let projects = [
    
];

// DOM Elements
const addProjectBtn = document.getElementById('addProjectBtn');
const projectModal = document.getElementById('projectModal');
const closeModal = document.getElementById('closeModal');
const projectForm = document.getElementById('projectForm');
const progressInput = document.getElementById('progress');
const progressValue = document.getElementById('progressValue');
const projectsTableBody = document.getElementById('projectsTableBody');

// Stats elements
const totalProjectsEl = document.getElementById('totalProjects');
const inProgressCountEl = document.getElementById('inProgressCount');
const completedCountEl = document.getElementById('completedCount');
const overdueCountEl = document.getElementById('overdueCount');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    renderProjects();
    updateStats();
    initCharts();
    
    // Event listeners
    addProjectBtn.addEventListener('click', () => {
        projectModal.classList.remove('hidden');
    });
    
    closeModal.addEventListener('click', () => {
        projectModal.classList.add('hidden');
        projectForm.reset();
    });
    
    progressInput.addEventListener('input', (e) => {
        progressValue.textContent = `${e.target.value}%`;
    });
    
    projectForm.addEventListener('submit', handleFormSubmit);
});

// Render projects to the table
function renderProjects() {
    projectsTableBody.innerHTML = '';
    
    projects.forEach(project => {
        const row = document.createElement('tr');
        
        // Calculate if project is overdue
        const today = new Date();
        const endDate = new Date(project.endDate);
        const isOverdue = today > endDate && project.status !== 'Completed';
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10">
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${project.name}</div>
                        <div class="text-sm text-gray-500">ID: ${project.id}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${formatDate(project.startDate)} - ${formatDate(project.endDate)}</div>
                <div class="text-sm text-gray-500">${calculateDuration(project.startDate, project.endDate)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(project.status)}">
                    ${project.status}
                </span>
                ${isOverdue ? '<span class="ml-2 text-xs text-red-600">Overdue</span>' : ''}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="${getPriorityClass(project.priority)}">
                    ${getPriorityIcon(project.priority)} ${project.priority}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-blue-600 h-2 rounded-full" style="width: ${project.progress}%"></div>
                </div>
                <div class="text-xs text-gray-500 mt-1">${project.progress}% complete</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button class="text-blue-600 hover:text-blue-900 mr-2" onclick="editProject(${project.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600 hover:text-red-900" onclick="deleteProject(${project.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        projectsTableBody.appendChild(row);
    });
}




// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    const newProject = {
        id: projects.length + 1,
        name: document.getElementById('projectName').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        status: document.getElementById('status').value,
        priority: document.getElementById('priority').value,
        progress: parseInt(document.getElementById('progress').value)
    };
    
    projects.push(newProject);
    projectModal.classList.add('hidden');
    projectForm.reset();
    
    renderProjects();
    updateStats();
    
    // Refresh charts
    document.getElementById('statusChart').remove();
    document.getElementById('progressChart').remove();
    const statusContainer = document.querySelector('.h-64');
    statusContainer.innerHTML = '<canvas id="statusChart"></canvas>';
    const progressContainer = document.querySelectorAll('.h-64')[1];
    progressContainer.innerHTML = '<canvas id="progressChart"></canvas>';
    
    initCharts();
}

// Edit project (would be expanded in a real application)
function editProject(id) {
    alert(`Edit project ${id} functionality would go here`);
}

// Delete project
function deleteProject(id) {
    if (confirm('Are you sure you want to delete this project?')) {
        projects = projects.filter(p => p.id !== id);
        renderProjects();
        updateStats();
        
        // Refresh charts
        document.getElementById('statusChart').remove();
        document.getElementById('progressChart').remove();
        const statusContainer = document.querySelector('.h-64');
        statusContainer.innerHTML = '<canvas id="statusChart"></canvas>';
        const progressContainer = document.querySelectorAll('.h-64')[1];
        progressContainer.innerHTML = '<canvas id="progressChart"></canvas>';
        
        initCharts();
    }
}

// Helper functions
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function calculateDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
}



function getPriorityClass(priority) {
    switch (priority) {
        case 'High':
            return 'text-red-600';
        case 'Medium':
            return 'text-yellow-600';
        case 'Low':
            return 'text-green-600';
        default:
            return 'text-gray-600';
    }
}

function getPriorityIcon(priority) {
    switch (priority) {
        case 'High':
            return '<i class="fas fa-arrow-up"></i>';
        case 'Medium':
            return '<i class="fas fa-minus"></i>';
        case 'Low':
            return '<i class="fas fa-arrow-down"></i>';
        default:
            return '';
    }
}