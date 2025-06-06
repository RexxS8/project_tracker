// Project data array
let projects = [];
let currentEditId = null;
let currentProjectId = null;

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
    
    // Close weekly modal on outside click
    document.addEventListener('click', (e) => {
        if (e.target.closest('#weeklyModal')) {
            e.target.closest('#weeklyModal').remove();
        }
    });
});

// Fetch projects from server with cache busting
async function fetchProjects() {
    try {
        const response = await fetch(`/api/projects/`, {
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        projects = data;
        renderProjects();
        console.log('Fetched projects:', projects);
    } catch (error) {
        console.error('Failed to fetch projects:', error);
        alert('Gagal memuat data project. Silakan refresh halaman.');
    }
}

// Handle form submit
async function handleFormSubmit(e) {
    e.preventDefault();

    const manPowerSelect = document.getElementById('manPower');
    const selectedManPower = manPowerSelect.value
        .split(',')
        .map(name => name.trim())
        .filter(Boolean);

    const projectData = {
        name: document.getElementById('projectName').value,
        start_date: document.getElementById('startDate').value,
        end_date: document.getElementById('endDate').value,
        status: document.getElementById('status').value,
        priority: document.getElementById('priority').value,
        progress: parseInt(document.getElementById('progress').value),
        man_power: selectedManPower.join(', ') // ✅ kirim dalam bentuk array
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

// Fungsi untuk render weekly progress
function renderWeeklyProgress(container, weeklyData) {
    container.innerHTML = weeklyData.map(week => `
        <tr>
            <td class="py-2 px-4 border-b">${week.week_number}</td>
            <td class="py-2 px-4 border-b">${week.task_description}</td>
            <td class="py-2 px-4 border-b text-center">${week.target_completion}</td>
            <td class="py-2 px-4 border-b text-center">${week.submitted_task}</td>
            <td class="py-2 px-4 border-b text-center">${week.revised}</td>
            <td class="py-2 px-4 border-b text-center">${week.submitted_task_percent}%</td>
            <td class="py-2 px-4 border-b text-center">${week.approved_task_by_comments}</td>
            <td class="py-2 px-4 border-b text-center">${week.approved_task}</td>
            <td class="py-2 px-4 border-b text-center">${week.approved_task_percent}%</td>
            <td class="py-2 px-4 border-b text-center">
                <button onclick="editWeeklyProgress(${week.id})" class="text-blue-600 mr-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteWeeklyProgress(${week.id})" class="text-red-600">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Fungsi toggle dropdown
function toggleDropdown(projectId) {
    const detailRow = document.querySelector(`tr[data-weekly="${projectId}"]`);
    detailRow.classList.toggle('hidden');
    
    // Tampilkan Man Power
    const project = projects.find(p => p.id == projectId);
    const manPowerEl = detailRow.querySelector('.man-power-info');
    if (manPowerEl) {
        manPowerEl.innerHTML = project.man_power || 'No man power assigned';
    }
}

// Render project list to table
function renderProjects() {
    const projectsTableBody = document.getElementById('projectsTableBody');
    projectsTableBody.innerHTML = '';

    projects.forEach(project => {
        console.log(`Project ${project.id} weekly progress:`, project.weekly_progress);

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

        row.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                toggleDropdown(project.id);
            }
        });

        const weeklyRow = document.createElement('tr');
        weeklyRow.className = 'hidden';
        weeklyRow.setAttribute('data-weekly', project.id);
        weeklyRow.innerHTML = `
            <td colspan="6" class="px-6 py-4 bg-gray-50">
                <div class="weekly-progress">
                    <div class="man-power-info bg-blue-50 p-3 rounded-lg mb-4">
                        <p class="text-sm text-gray-700">
                            <strong>Man Power:</strong><br>
                            ${Array.isArray(project.man_power) ? project.man_power.join(', ') : (project.man_power || 'No man power assigned')}
                        </p>
                    </div>
                    <h4 class="font-medium mb-4">Weekly Progress</h4>
                    <div class="overflow-x-auto">
                        <table class="min-w-full bg-white">
                            <thead>
                                <tr class="bg-gray-100">
                                    <th class="py-2 px-4 border-b">Week</th>
                                    <th class="py-2 px-4 border-b">Task Description</th>
                                    <th class="py-2 px-4 border-b">Target Completion</th>
                                    <th class="py-2 px-4 border-b">Submitted Task</th>
                                    <th class="py-2 px-4 border-b">Revised</th>
                                    <th class="py-2 px-4 border-b">Submitted Task (%)</th>
                                    <th class="py-2 px-4 border-b">Approved by Comments</th>
                                    <th class="py-2 px-4 border-b">Approved Task</th>
                                    <th class="py-2 px-4 border-b">Approved Task (%)</th>
                                    <th class="py-2 px-4 border-b">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="weekly-entries" id="weekly-${project.id}">
                                <!-- Weekly entries will be rendered here -->
                            </tbody>
                        </table>
                    </div>
                    <button onclick="handleAddWeek(${project.id})" class="mt-4 bg-green-600 text-white px-3 py-1 rounded">
                        Add Progress
                    </button>
                </div>
            </td>
        `;

        // Render data weekly langsung
        renderWeeklyProgress(weeklyRow.querySelector('.weekly-entries'), project.weekly_progress);

        projectsTableBody.appendChild(row);
        projectsTableBody.appendChild(weeklyRow);
    });
}

// Fungsi untuk status badge
function getWeeklyStatusClass(status) {
    return status === 'At Risk' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
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
    document.getElementById('manPower').value = project.man_power || ''; // 🆕 Tambahkan ini
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

// Handle Add Week
function handleAddWeek(projectId) {
    if (!projectId || isNaN(projectId)) {
        console.error("Invalid projectId:", projectId);
        return;
    }

    // Hapus modal lama jika ada
    const existingModal = document.getElementById('weeklyModal');
    if (existingModal) existingModal.remove();

    // Modal HTML
    const modalHtml = `
        <div id="weeklyModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeWeeklyModal(event)">
            <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6" onclick="event.stopPropagation()">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-medium text-gray-800">Add Weekly Progress</h3>
                    <button onclick="closeWeeklyModal()" class="text-gray-400 hover:text-gray-500">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <form id="weeklyProgressForm" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Week Number</label>
                            <input type="number" id="weekNumber" class="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Task Description</label>
                            <input type="text" id="taskDescription" class="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Target Completion</label>
                            <input type="number" id="targetCompletion" class="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Submitted Task</label>
                            <input type="number" id="submittedTask" class="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Revised</label>
                            <input type="number" id="revised" class="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Approved by Comments</label>
                            <input type="number" id="approvedByComments" class="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Approved Task</label>
                            <input type="number" id="approvedTask" class="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                        </div>
                    </div>

                    <button type="submit" class="bg-green-600 text-white w-full py-2 rounded">Save Progress</button>
                </form>
            </div>
        </div>
    `;

    // Masukkan modal ke halaman
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Tangani form submit
    const weeklyForm = document.getElementById('weeklyProgressForm');
    weeklyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const weekData = {
            week_number: parseInt(document.getElementById('weekNumber').value),
            task_description: document.getElementById('taskDescription').value,
            target_completion: parseInt(document.getElementById('targetCompletion').value),
            submitted_task: parseInt(document.getElementById('submittedTask').value),
            revised: parseInt(document.getElementById('revised').value),
            approved_task_by_comments: parseInt(document.getElementById('approvedByComments').value),
            approved_task: parseInt(document.getElementById('approvedTask').value),
        };

        try {
            const response = await fetch(`/api/projects/${projectId}/weekly-progress/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify(weekData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to submit weekly progress: ${response.statusText} - ${errorText}`);
            }

            const newEntry = await response.json();
            const weeklyContainer = document.querySelector(`#weekly-${projectId}`);
            if (weeklyContainer && typeof renderSingleWeeklyEntry === 'function') {
                renderSingleWeeklyEntry(weeklyContainer, newEntry);
            }

            closeWeeklyModal();
            location.reload();
        } catch (error) {
            alert('Failed to submit weekly progress: ' + error.message);
            console.error(error);
        }
    });
}

// Fungsi bantu render single entry baru (tanpa reload semua)
function renderSingleWeeklyEntry(container, entry) {
    const div = document.createElement('div');
    const manPowerValue = document.getElementById('manPower').value;
    div.className = "p-4 bg-white rounded shadow border";
    div.innerHTML = `
        <div><strong>Week ${entry.week_number}:</strong> ${entry.task_description}</div>
        <div>Target: ${entry.target_completion}, Submitted: ${entry.submitted_task}</div>
        <div>Revised: ${entry.revised}, Approved by Comments: ${entry.approved_task_by_comments}, Approved: ${entry.approved_task}</div>
        <div>Status: ${entry.status}</div>
        <div>${entry.description}</div>
    `;
    container.appendChild(div);
}

// Close weekly modal
function closeWeeklyModal(event) {
    if (!event || event.target.id === 'weeklyModal') {
        const modal = document.getElementById('weeklyModal');
        if (modal) modal.remove();
    }
}

// Edit weekly progress
function toggleProjectDetails(projectId) {
    const project = projects.find(p => p.id === projectId);
    let html = '';
    if (project.weekly_progress.length > 0) {
        project.weekly_progress.forEach(wp => {
            html += `<li>Minggu ${wp.week_number}: ${wp.progress}% - ${wp.status} (${wp.description})</li>`;
        });
    } else {
        html = '<li>Belum ada progress mingguan</li>';
    }
    document.getElementById(`details-${projectId}`).innerHTML = html;
}

// Di akhir file projects.js, tambahkan:
window.handleAddWeek = handleAddWeek;
window.editProject = editProject;
window.deleteProject = deleteProject;
window.toggleDropdown = toggleDropdown;
window.closeWeeklyModal = closeWeeklyModal;