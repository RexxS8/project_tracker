// Project data array
let projects = [];
let currentEditId = null;

// Fungsi ambil CSRF Token dari cookie
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

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const addProjectBtn = document.getElementById('addProjectBtn');
    const projectModal = document.getElementById('projectModal');
    const closeModal = document.getElementById('closeModal');
    const projectForm = document.getElementById('projectForm');
    const progressInput = document.getElementById('progress');
    const progressValue = document.getElementById('progressValue');
    const projectsTableBody = document.getElementById('projectsTableBody');
    const modalTitle = document.querySelector('#projectModal h3');

    // Ini ambil elemen yg sudah ADA di HTML
    const importProjectBtn = document.getElementById('importProjectBtn');
    const csvFileInput = document.getElementById('csvFileInput');

    // Button to open add project modal
    addProjectBtn.addEventListener('click', () => {
        currentEditId = null;
        modalTitle.textContent = 'Add New Project';
        projectForm.reset();
        progressValue.textContent = '0%';
        projectModal.classList.remove('hidden');
    });

    // Button to close modal
    closeModal.addEventListener('click', () => {
        projectModal.classList.add('hidden');
    });

    // Update progress value label
    progressInput.addEventListener('input', (e) => {
        progressValue.textContent = `${e.target.value}%`;
    });

    // Submit project form
    projectForm.addEventListener('submit', handleFormSubmit);

    // Button to open file picker
    importProjectBtn.addEventListener('click', () => {
        csvFileInput.click(); // langsung klik input file
    });

    // Handle file selection
    csvFileInput.addEventListener('change', handleCsvUpload);

    // Fetch initial project data
    fetchProjects();
});

// Fetch projects from server
async function fetchProjects() {
    try {
        const response = await fetch('/api/projects/');
        const data = await response.json();
        projects = data;
        renderProjects();
    } catch (error) {
        console.error('Failed to fetch projects:', error);
    }
}

// Handle form submit
async function handleFormSubmit(e) {
    e.preventDefault();

    const projectData = {
        name: document.getElementById('projectName').value,
        start_date: document.getElementById('startDate').value,
        end_date: document.getElementById('endDate').value,
        status: document.getElementById('status').value,
        priority: document.getElementById('priority').value,
        progress: parseInt(document.getElementById('progress').value)
    };

    try {
        let url = '/api/projects/';
        let method = 'POST';

        if (currentEditId !== null) {
            url += `${currentEditId}/`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(projectData)
        });

        if (!response.ok) throw new Error('Failed to save project');

        document.getElementById('projectModal').classList.add('hidden');
        document.getElementById('projectForm').reset();
        fetchProjects();
    } catch (error) {
        console.error(error);
        alert('Error submitting project!');
    }
}

// Handle CSV file upload
async function handleCsvUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        alert('No file selected.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target.result;
        const csvData = parseCsv(text);

        for (const projectData of csvData) {
            try {
                await fetch('/api/projects/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify(projectData)
                });
            } catch (error) {
                console.error('Error saving project from CSV:', error);
            }
        }

        fetchProjects(); // Refresh tampilan
        alert('CSV imported successfully!');
    };
    reader.readAsText(file);
}

// Parse CSV text into project objects
function parseCsv(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const projects = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const project = {};

        headers.forEach((header, index) => {
            let value = values[index];
            if (header === 'progress') {
                value = parseInt(value) || 0;
            }
            project[header] = value;
        });

        projects.push({
            name: project.name || '',
            start_date: project.start_date || '',
            end_date: project.end_date || '',
            status: project.status || 'Not Started',
            priority: project.priority || 'Low',
            progress: project.progress || 0
        });
    }

    return projects;
}

// Render project list to table
function renderProjects() {
    const projectsTableBody = document.getElementById('projectsTableBody');
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
                <div class="text-sm text-gray-900">${formatDate(project.start_date)} - ${formatDate(project.end_date)}</div>
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

// Edit project
function editProject(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;

    const modalTitle = document.querySelector('#projectModal h3');
    const projectForm = document.getElementById('projectForm');
    const progressValue = document.getElementById('progressValue');

    currentEditId = id;
    modalTitle.textContent = 'Edit Project';

    document.getElementById('projectName').value = project.name;
    document.getElementById('startDate').value = project.start_date;
    document.getElementById('endDate').value = project.end_date;
    document.getElementById('status').value = project.status;
    document.getElementById('priority').value = project.priority;
    document.getElementById('progress').value = project.progress;
    progressValue.textContent = `${project.progress}%`;

    document.getElementById('projectModal').classList.remove('hidden');
}

// Format tanggal
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Get status badge class
function getStatusClass(status) {
    switch (status) {
        case 'Not Started': return 'bg-gray-100 text-gray-800';
        case 'In Progress': return 'bg-blue-100 text-blue-800';
        case 'Completed': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

// Get priority badge class
function getPriorityClass(priority) {
    switch (priority) {
        case 'High': return 'bg-red-100 text-red-800';
        case 'Medium': return 'bg-yellow-100 text-yellow-800';
        case 'Low': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

// Delete project
async function deleteProject(id) {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
        const response = await fetch(`/api/projects/${id}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });

        if (!response.ok) throw new Error('Failed to delete project');

        fetchProjects();
    } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete the project.');
    }
}
