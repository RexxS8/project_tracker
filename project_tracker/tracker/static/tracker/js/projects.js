// =================================================================================
// PROJECT TRACKER SCRIPT
// Versi ini mencakup fungsionalitas penuh untuk CRUD Project dan Weekly Progress
// =================================================================================

// Variabel Global
let projects = [];
let currentEditId = null; // Menyimpan ID project yang sedang diedit
let currentProjectId = null; // Menyimpan ID project untuk konteks modal weekly progress
let currentWeeklyProgressEditId = null; // Menyimpan ID weekly progress yang sedang diedit

/**
 * Mengambil CSRF Token dari cookie untuk keamanan request
 * @param {string} name - Nama cookie (biasanya 'csrftoken')
 * @returns {string|null} Nilai cookie atau null
 */
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

// Inisialisasi aplikasi saat dokumen selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
    // === Inisialisasi Elemen DOM ===
    const addProjectBtn = document.getElementById('addProjectBtn');
    const projectModal = document.getElementById('projectModal');
    const closeModalBtn = document.getElementById('closeModal');
    const projectForm = document.getElementById('projectForm');
    const progressInput = document.getElementById('progress');
    const progressValue = document.getElementById('progressValue');
    const importProjectBtn = document.getElementById('importProjectBtn');
    const csvFileInput = document.getElementById('csvFileInput');

    // === Event Listeners ===
    // Buka modal untuk tambah project baru
    addProjectBtn.addEventListener('click', () => {
        currentEditId = null;
        document.querySelector('#projectModal h3').textContent = 'Add New Project';
        projectForm.reset();
        progressValue.textContent = '0%';
        projectModal.classList.remove('hidden');
    });

    // Tutup modal project
    closeModalBtn.addEventListener('click', () => {
        projectModal.classList.add('hidden');
    });

    // Update label persen progress
    progressInput.addEventListener('input', (e) => {
        progressValue.textContent = `${e.target.value}%`;
    });

    // Submit form project (Add/Edit)
    projectForm.addEventListener('submit', handleFormSubmit);

    // Tombol import CSV
    importProjectBtn.addEventListener('click', () => {
        csvFileInput.click();
    });

    // Handle pemilihan file CSV
    csvFileInput.addEventListener('change', handleCsvUpload);

    // Ambil data project dari server saat pertama kali load
    fetchProjects();
});


/**
 * Mengambil semua data project dari server API
 */
async function fetchProjects() {
    try {
        const response = await fetch(`/api/projects/`, {
            headers: { 'Cache-Control': 'no-cache' }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        projects = await response.json();
        renderProjects(); // Tampilkan data ke tabel
    } catch (error) {
        console.error('Failed to fetch projects:', error);
        alert('Gagal memuat data project. Silakan refresh halaman.');
    }
}


/**
 * Menampilkan semua project ke dalam tabel HTML
 */
function renderProjects() {
    const projectsTableBody = document.getElementById('projectsTableBody');
    projectsTableBody.innerHTML = '';

    projects.forEach(project => {
        // Buat baris utama untuk setiap project
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm font-medium text-gray-900">${project.name}</div></td>
            <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-900">${formatDate(project.start_date)} - ${formatDate(project.end_date)}</div></td>
            <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(project.status)}">${project.status}</span></td>
            <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityClass(project.priority)}">${project.priority}</span></td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="w-full bg-gray-200 rounded-full h-2.5"><div class="bg-blue-600 h-2.5 rounded-full" style="width: ${project.progress}%"></div></div>
                    <span class="ml-2 text-sm font-medium text-gray-700">${project.progress}%</span>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="editProject(${project.id})" class="text-blue-600 hover:text-blue-900 mr-3"><i class="fas fa-edit"></i> Edit</button>
                <button onclick="deleteProject(${project.id})" class="text-red-600 hover:text-red-900"><i class="fas fa-trash"></i> Delete</button>
            </td>
        `;

        // Event listener untuk toggle dropdown detail saat baris di-klik (bukan tombol)
        row.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                toggleDropdown(project.id);
            }
        });

        // Buat baris tersembunyi untuk detail weekly progress
        const weeklyRow = document.createElement('tr');
        weeklyRow.className = 'hidden';
        weeklyRow.setAttribute('data-weekly', project.id);
        weeklyRow.innerHTML = `
            <td colspan="6" class="px-6 py-4 bg-gray-50">
                <div class="weekly-progress">
                    <div class="man-power-info bg-blue-50 p-3 rounded-lg mb-4">
                        <p class="text-sm text-gray-700"><strong>Man Power:</strong><br>${project.man_power || 'No man power assigned'}</p>
                    </div>
                    <h4 class="font-medium mb-4">Weekly Progress</h4>
                    <div class="overflow-x-auto">
                        <table class="min-w-full bg-white">
                            <thead>
                                <tr class="bg-gray-100">
                                    <th class="py-2 px-4 border-b">Week</th>
                                    <th class="py-2 px-4 border-b">Task Description</th>
                                    <th class="py-2 px-4 border-b">Target</th>
                                    <th class="py-2 px-4 border-b">Submitted</th>
                                    <th class="py-2 px-4 border-b">Revised</th>
                                    <th class="py-2 px-4 border-b">Submitted (%)</th>
                                    <th class="py-2 px-4 border-b">Approved (Comments)</th>
                                    <th class="py-2 px-4 border-b">Approved</th>
                                    <th class="py-2 px-4 border-b">Approved (%)</th>
                                    <th class="py-2 px-4 border-b">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="weekly-entries" id="weekly-${project.id}"></tbody>
                        </table>
                    </div>
                    <button onclick="openWeeklyProgressModal(${project.id})" class="mt-4 bg-green-600 text-white px-3 py-1 rounded">
                        <i class="fas fa-plus"></i> Add Progress
                    </button>
                </div>
            </td>`;
        
        // Panggil fungsi untuk merender data weekly progress ke dalam baris detail
        renderWeeklyProgress(weeklyRow.querySelector(`#weekly-${project.id}`), project.weekly_progress, project.id);
        
        // Masukkan kedua baris (utama dan detail) ke dalam tabel
        projectsTableBody.appendChild(row);
        projectsTableBody.appendChild(weeklyRow);
    });
}


/**
 * Merender daftar weekly progress ke dalam sub-tabel
 * @param {HTMLElement} container - Elemen `<tbody>` untuk menampung baris
 * @param {Array} weeklyData - Array data weekly progress
 * @param {number} projectId - ID dari project induk
 */
function renderWeeklyProgress(container, weeklyData, projectId) {
    if (!weeklyData || weeklyData.length === 0) {
        container.innerHTML = `<tr><td colspan="10" class="text-center py-4 text-gray-500">No weekly progress recorded.</td></tr>`;
        return;
    }

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
                <button onclick="editWeeklyProgress(${week.id}, ${projectId})" class="text-blue-600 mr-2" title="Edit"><i class="fas fa-edit"></i></button>
                <button onclick="deleteWeeklyProgress(${week.id})" class="text-red-600" title="Delete"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}


// ======================================================
// FUNGSI-FUNGSI CRUD (Create, Read, Update, Delete)
// ======================================================

// --- CRUD untuk Project ---

/**
 * Handle submit form untuk tambah atau edit project
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    const projectData = {
        name: document.getElementById('projectName').value,
        start_date: document.getElementById('startDate').value,
        end_date: document.getElementById('endDate').value,
        status: document.getElementById('status').value,
        priority: document.getElementById('priority').value,
        progress: parseInt(document.getElementById('progress').value),
        man_power: document.getElementById('manPower').value,
    };

    let url = '/api/projects/';
    let method = 'POST';
    if (currentEditId !== null) {
        url += `${currentEditId}/`;
        method = 'PUT';
    }

    try {
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
        fetchProjects();
    } catch (error) {
        console.error(error);
        alert('Error submitting project!');
    }
}

/**
 * Membuka modal dan mengisi data untuk edit project
 * @param {number} id - ID project yang akan diedit
 */
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

/**
 * Menghapus project berdasarkan ID
 * @param {number} id - ID project yang akan dihapus
 */
async function deleteProject(id) {
    if (!confirm("Are you sure you want to delete this project and all its progress?")) return;
    try {
        const response = await fetch(`/api/projects/${id}/`, {
            method: 'DELETE',
            headers: { 'X-CSRFToken': getCookie('csrftoken') }
        });
        if (!response.ok) throw new Error('Failed to delete project');
        fetchProjects();
    } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete the project.');
    }
}


// --- CRUD untuk Weekly Progress ---

/**
 * Membuka modal untuk menambah atau mengedit weekly progress.
 * @param {number} projectId - ID project induk.
 * @param {number|null} weekId - ID weekly progress (null jika menambah baru).
 */
async function openWeeklyProgressModal(projectId, weekId = null) {
    currentWeeklyProgressEditId = weekId;
    currentProjectId = projectId;
    
    const existingModal = document.getElementById('weeklyModal');
    if (existingModal) existingModal.remove();

    const modalHtml = `
        <div id="weeklyModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6" onclick="event.stopPropagation()">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-medium text-gray-800">${weekId ? 'Edit' : 'Add'} Weekly Progress</h3>
                    <button onclick="closeWeeklyModal()" class="text-gray-400 hover:text-gray-500"><i class="fas fa-times"></i></button>
                </div>
                <form id="weeklyProgressForm" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label class="block text-sm font-medium">Week Number</label><input type="number" id="weekNumber" class="w-full mt-1 px-3 py-2 border rounded-md" required></div>
                        <div><label class="block text-sm font-medium">Task Description</label><input type="text" id="taskDescription" class="w-full mt-1 px-3 py-2 border rounded-md" required></div>
                        <div><label class="block text-sm font-medium">Target Completion</label><input type="number" id="targetCompletion" class="w-full mt-1 px-3 py-2 border rounded-md" required></div>
                        <div><label class="block text-sm font-medium">Submitted Task</label><input type="number" id="submittedTask" class="w-full mt-1 px-3 py-2 border rounded-md" required></div>
                        <div><label class="block text-sm font-medium">Revised</label><input type="number" id="revised" class="w-full mt-1 px-3 py-2 border rounded-md" required></div>
                        <div><label class="block text-sm font-medium">Approved by Comments</label><input type="number" id="approvedByComments" class="w-full mt-1 px-3 py-2 border rounded-md" required></div>
                        <div><label class="block text-sm font-medium">Approved Task</label><input type="number" id="approvedTask" class="w-full mt-1 px-3 py-2 border rounded-md" required></div>
                    </div>
                    <button type="submit" class="bg-green-600 text-white w-full py-2 rounded-md">Save Progress</button>
                </form>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Jika mode edit, ambil data dan isi form
    if (weekId) {
        try {
            const response = await fetch(`/api/weekly-progress/${weekId}/`);
            if (!response.ok) throw new Error('Failed to fetch weekly progress details');
            const data = await response.json();
            document.getElementById('weekNumber').value = data.week_number;
            document.getElementById('taskDescription').value = data.task_description;
            document.getElementById('targetCompletion').value = data.target_completion;
            document.getElementById('submittedTask').value = data.submitted_task;
            document.getElementById('revised').value = data.revised;
            document.getElementById('approvedByComments').value = data.approved_task_by_comments;
            document.getElementById('approvedTask').value = data.approved_task;
        } catch (error) {
            console.error(error);
            alert(error.message);
            closeWeeklyModal();
        }
    }
    
    document.getElementById('weeklyProgressForm').addEventListener('submit', handleWeeklyFormSubmit);
}

/**
 * Handle submit untuk form weekly progress (Add/Edit)
 */
async function handleWeeklyFormSubmit(e) {
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
    
    let url, method;
    if (currentWeeklyProgressEditId) { // Mode Edit
        url = `/api/weekly-progress/${currentWeeklyProgressEditId}/`;
        method = 'PUT';
    } else { // Mode Add
        url = `/api/projects/${currentProjectId}/weekly-progress/`;
        method = 'POST';
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(weekData)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to save weekly progress: ${response.statusText} - ${errorText}`);
        }
        closeWeeklyModal();
        fetchProjects(); // Refresh seluruh data
    } catch (error) {
        alert('Failed to save weekly progress: ' + error.message);
        console.error(error);
    }
}

/**
 * Fungsi yang dipanggil saat tombol edit weekly progress diklik
 */
function editWeeklyProgress(weekId, projectId) {
    openWeeklyProgressModal(projectId, weekId);
}

/**
 * Fungsi yang dipanggil saat tombol delete weekly progress diklik
 */
async function deleteWeeklyProgress(weekId) {
    if (!confirm("Are you sure you want to delete this weekly progress entry?")) return;
    try {
        const response = await fetch(`/api/weekly-progress/${weekId}/`, {
            method: 'DELETE',
            headers: { 'X-CSRFToken': getCookie('csrftoken') }
        });
        if (!response.ok) throw new Error('Failed to delete weekly progress');
        fetchProjects();
    } catch (error) {
        console.error('Error deleting weekly progress:', error);
        alert('Failed to delete the weekly progress entry.');
    }
}


// ======================================================
// FUNGSI-FUNGSI UTILITAS (Pembantu)
// ======================================================

/**
 * Handle upload dan parsing file CSV
 */
async function handleCsvUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        const csvData = parseCsv(e.target.result);
        for (const projectData of csvData) {
            try {
                await fetch('/api/projects/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
                    body: JSON.stringify(projectData)
                });
            } catch (error) {
                console.error('Error saving project from CSV:', error);
            }
        }
        fetchProjects();
        alert('CSV imported successfully!');
    };
    reader.readAsText(file);
}

/**
 * Mem-parsing teks CSV menjadi array objek project
 */
function parseCsv(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const projects = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const project = {};
        headers.forEach((header, index) => {
            project[header] = values[index];
        });
        projects.push({
            name: project.name || '',
            start_date: project.start_date || '',
            end_date: project.end_date || '',
            status: project.status || 'Not Started',
            priority: project.priority || 'Low',
            progress: parseInt(project.progress) || 0
        });
    }
    return projects;
}

/**
 * Menampilkan atau menyembunyikan baris detail
 */
function toggleDropdown(projectId) {
    const detailRow = document.querySelector(`tr[data-weekly="${projectId}"]`);
    if (detailRow) {
        detailRow.classList.toggle('hidden');
    }
}

/**
 * Menutup modal weekly progress
 */
function closeWeeklyModal() {
    const modal = document.getElementById('weeklyModal');
    if (modal) modal.remove();
    // Reset ID
    currentWeeklyProgressEditId = null;
    currentProjectId = null;
}

/**
 * Memformat string tanggal menjadi format yang lebih mudah dibaca
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
}

/**
 * Mendapatkan kelas CSS untuk badge status
 */
function getStatusClass(status) {
    const classes = {
        'Not Started': 'bg-gray-100 text-gray-800',
        'In Progress': 'bg-blue-100 text-blue-800',
        'Completed': 'bg-green-100 text-green-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Mendapatkan kelas CSS untuk badge prioritas
 */
function getPriorityClass(priority) {
    const classes = {
        'High': 'bg-red-100 text-red-800',
        'Medium': 'bg-yellow-100 text-yellow-800',
        'Low': 'bg-green-100 text-green-800'
    };
    return classes[priority] || 'bg-gray-100 text-gray-800';
}


// ======================================================
// EXPOSE FUNGSI KE GLOBAL SCOPE (WINDOW)
// Ini penting agar fungsi bisa dipanggil dari atribut `onclick` di HTML
// ======================================================
window.editProject = editProject;
window.deleteProject = deleteProject;
window.toggleDropdown = toggleDropdown;
window.openWeeklyProgressModal = openWeeklyProgressModal;
window.editWeeklyProgress = editWeeklyProgress;
window.deleteWeeklyProgress = deleteWeeklyProgress;
window.closeWeeklyModal = closeWeeklyModal;