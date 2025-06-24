document.addEventListener('DOMContentLoaded', function() {
    let calendar;

    // --- Fungsi Helper ---
    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    
    function getStatusClass(status) {
        const classes = { 
            'Not Started': 'bg-gray-200 text-gray-800', 
            'In Progress': 'bg-blue-200 text-blue-800', 
            'Completed': 'bg-green-200 text-green-800' 
        };
        return classes[status] || 'bg-gray-200 text-gray-800';
    }

    // --- Inisialisasi Kalender ---
    function initializeCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return;

        try {
            if (calendar) calendar.destroy();
            const events = JSON.parse(calendarEl.dataset.projects);

            calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,listWeek'
                },
                events: events,
                
                eventDidMount: function(info) {
                    let color = '#6b7280'; // Default: gray-500
                    const priority = info.event.extendedProps.priority;
                    
                    if (priority === 'High') color = '#ef4444'; // Red-500
                    else if (priority === 'Medium') color = '#f59e0b'; // Amber-500
                    else if (priority === 'Low') color = '#3b82f6'; // Blue-500
                    
                    info.el.style.backgroundColor = color;
                    info.el.style.borderColor = color;
                },

                eventClick: function(info) {
                    info.jsEvent.preventDefault();
                    const projectId = info.event.id;
                    showProjectDetailsInModal(projectId);
                }
            });

            calendar.render();
        } catch (error) {
            console.error('Calendar error:', error);
        }
    }

    // --- Fungsi Modal Kalender ---
    async function showProjectDetailsInModal(projectId) {
        const modal = document.getElementById('calendarProjectModal');
        const contentEl = document.getElementById('modalProjectContent');
        const titleEl = document.getElementById('modalProjectTitle');
        const loadingEl = document.getElementById('modal-loading-placeholder');

        if (!modal || !contentEl || !titleEl || !loadingEl) return;

        modal.classList.remove('hidden');
        titleEl.textContent = 'Loading...';
        contentEl.style.display = 'none';
        loadingEl.style.display = 'block';

        try {
            const response = await fetch(`/api/projects/${projectId}/`);
            if (!response.ok) throw new Error('Failed to fetch project details');
            
            const project = await response.json();

            titleEl.textContent = project.name;
            
            const detailsHtml = `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                    <div class="bg-gray-50 p-3 rounded-lg"><p class="font-semibold text-gray-600">Status</p><p class="px-2 py-1 mt-1 inline-block text-xs font-semibold rounded-full ${getStatusClass(project.status)}">${project.status}</p></div>
                    <div class="bg-gray-50 p-3 rounded-lg"><p class="font-semibold text-gray-600">Timeline</p><p>${formatDate(project.start_date)} - ${formatDate(project.end_date)}</p></div>
                    <div class="bg-gray-50 p-3 rounded-lg"><p class="font-semibold text-gray-600">Man Power</p><p class="truncate" title="${project.man_power || 'N/A'}">${project.man_power || 'N/A'}</p></div>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-4 mb-4"><div class="bg-blue-600 h-4 rounded-full text-center text-white text-xs leading-tight flex items-center justify-center" style="width: ${project.progress}%">${project.progress}%</div></div>
            `;
            
            let weeklyProgressHtml = `
                <h4 class="text-lg font-semibold text-gray-700 mt-6 mb-2">Weekly Progress History</h4>
                <div class="overflow-x-auto border rounded-lg">
                    <table class="min-w-full bg-white"><thead class="bg-gray-50">
                        <tr>
                            <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">WEEK</th>
                            <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">TASK</th>
                            <th class="py-2 px-3 text-center text-xs font-medium text-gray-500 uppercase">APPROVED (%)</th>
                        </tr>
                    </thead><tbody class="divide-y divide-gray-200">`;

            if (project.weekly_progress && project.weekly_progress.length > 0) {
                project.weekly_progress.forEach(wp => {
                    weeklyProgressHtml += `
                        <tr>
                            <td class="py-3 px-3 text-sm">${formatDate(wp.week_start_date)} - ${formatDate(wp.week_end_date)}</td>
                            <td class="py-3 px-3 text-sm">${wp.task_description}</td>
                            <td class="py-3 px-3 text-sm text-center font-medium">${wp.approved_task_percent}%</td>
                        </tr>`;
                });
            } else {
                weeklyProgressHtml += `<tr><td colspan="3" class="text-center py-4 text-gray-500">No weekly progress recorded.</td></tr>`;
            }

            weeklyProgressHtml += `</tbody></table></div>`;
            contentEl.innerHTML = detailsHtml + weeklyProgressHtml;

        } catch (error) {
            console.error("Error showing project details:", error);
            contentEl.innerHTML = `<p class="text-red-500 text-center py-8">Could not load project details. Please try again later.</p>`;
        } finally {
            loadingEl.style.display = 'none';
            contentEl.style.display = 'block';
        }
    }

    document.getElementById('closeCalendarModal').addEventListener('click', () => {
        document.getElementById('calendarProjectModal').classList.add('hidden');
    });

    // --- Inisialisasi Grafik ---
    function initCharts() {
        const statusChartEl = document.getElementById('statusChart');
        const progressChartEl = document.getElementById('progressChart');
        if (!statusChartEl || !progressChartEl) return;
        
        if (window.statusChart instanceof Chart) window.statusChart.destroy();
        if (window.progressChart instanceof Chart) window.progressChart.destroy();

        // --- PERUBAHAN DI SINI ---
        // Status Chart (Pie)
        window.statusChart = new Chart(statusChartEl.getContext('2d'), {
            type: 'pie',
            data: { 
                labels: Object.keys(statusCounts), 
                datasets: [{ 
                    data: Object.values(statusCounts), 
                    backgroundColor: ['#9CA3AF', '#60A5FA', '#34D399'], // Abu-abu, Biru, Hijau
                    hoverOffset: 4
                }] 
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom', // Memindahkan legenda ke bawah
                    }
                }
            }
        });

        // --- PERUBAHAN DI SINI ---
        // Progress Chart (Bar)
        window.progressChart = new Chart(progressChartEl.getContext('2d'), {
            type: 'bar',
            data: { 
                labels: progressData.map(p => p.name), 
                datasets: [{ 
                    label: 'Progress (%)', 
                    data: progressData.map(p => p.progress), 
                    backgroundColor: '#60a5fa' 
                }] 
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                scales: { 
                    y: { 
                        beginAtZero: true, 
                        max: 100 
                    } 
                },
                plugins: {
                    legend: {
                        display: false, // Untuk Bar chart, legenda seringkali tidak diperlukan
                    }
                }
            }
        });
    }

    initializeCalendar();
    initCharts();
});
