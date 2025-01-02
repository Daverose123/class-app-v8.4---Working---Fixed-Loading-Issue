class AttendanceService {
    constructor() {
        this.attendance = {};
        this.loadFromStorage();
    }

    loadFromStorage() {
        const savedData = localStorage.getItem('classHubAttendance');
        if (savedData) {
            try {
                this.attendance = JSON.parse(savedData);
            } catch (e) {
                console.error('Error loading attendance data:', e);
                this.attendance = {};
            }
        }
    }

    saveToStorage() {
        localStorage.setItem('classHubAttendance', JSON.stringify(this.attendance));
    }

    takeAttendance(classId, date, records) {
        if (!this.attendance[classId]) {
            this.attendance[classId] = {};
        }
        this.attendance[classId][date] = records;
        this.saveToStorage();
    }

    getAttendance(classId, date) {
        return this.attendance[classId]?.[date] || {};
    }

    getClassAttendance(classId) {
        return this.attendance[classId] || {};
    }

    showAttendanceManager(classId) {
        const classObj = window.classService.getClass(classId);
        const students = window.studentService.getStudents(classId);
        const today = new Date().toISOString().split('T')[0];
        const existingAttendance = this.getAttendance(classId, today);

        // Close any existing modal first
        Swal.close();

        // Then open the attendance manager
        setTimeout(() => {
            Swal.fire({
                title: `Take Attendance - ${classObj.name}`,
                html: `
                    <div class="attendance-manager">
                        <div class="attendance-header mb-4">
                            <button class="btn btn-link back-button" onclick="window.classHub.openSettings('attendance')">
                                <i class="fas fa-arrow-left"></i> Back to Classes
                            </button>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <div class="attendance-date">
                                <label class="form-label">Date</label>
                                <input type="date" id="attendanceDate" class="form-control" value="${today}">
                            </div>
                            <div class="attendance-actions">
                                <button class="btn btn-outline-secondary btn-sm" onclick="window.attendanceService.markAllPresent()">
                                    Mark All Present
                                </button>
                            </div>
                        </div>
                        <div class="attendance-list">
                            ${students.map(student => `
                                <div class="attendance-item" data-student-id="${student.id}">
                                    <div class="student-info">
                                        <img src="${student.avatar}" alt="${student.firstName}" class="student-avatar-sm">
                                        <div class="student-name">
                                            ${student.firstName} ${student.lastName || ''}
                                        </div>
                                    </div>
                                    <div class="attendance-status">
                                        <select class="form-select form-select-sm attendance-select" 
                                                data-student-id="${student.id}">
                                            <option value="present" ${existingAttendance[student.id] === 'present' ? 'selected' : ''}>Present</option>
                                            <option value="absent" ${existingAttendance[student.id] === 'absent' ? 'selected' : ''}>Absent</option>
                                            <option value="late" ${existingAttendance[student.id] === 'late' ? 'selected' : ''}>Late</option>
                                            <option value="excused" ${existingAttendance[student.id] === 'excused' ? 'selected' : ''}>Excused</option>
                                        </select>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `,
                width: '600px',
                showCancelButton: true,
                confirmButtonText: 'Save Attendance',
                showCloseButton: false,
                preConfirm: () => {
                    const date = document.getElementById('attendanceDate').value;
                    const records = {};
                    document.querySelectorAll('.attendance-select').forEach(select => {
                        records[select.dataset.studentId] = select.value;
                    });
                    return { date, records };
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    this.takeAttendance(classId, result.value.date, result.value.records);
                    this.showAttendanceReport(classId);
                }
            });
        }, 100);
    }

    showAttendanceReport(classId) {
        const classObj = window.classService.getClass(classId);
        const attendance = this.getClassAttendance(classId);
        const dates = Object.keys(attendance).sort().reverse();

        Swal.fire({
            title: `Attendance Report - ${classObj.name}`,
            html: `
                <div class="attendance-report">
                    <div class="table-responsive">
                        <table class="table table-bordered table-sm">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Present</th>
                                    <th>Absent</th>
                                    <th>Late</th>
                                    <th>Excused</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${dates.map(date => {
                                    const dayRecords = attendance[date];
                                    const stats = {
                                        present: 0, absent: 0, late: 0, excused: 0
                                    };
                                    Object.values(dayRecords).forEach(status => {
                                        stats[status]++;
                                    });
                                    return `
                                        <tr>
                                            <td>${new Date(date).toLocaleDateString()}</td>
                                            <td>${stats.present}</td>
                                            <td>${stats.absent}</td>
                                            <td>${stats.late}</td>
                                            <td>${stats.excused}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `,
            width: '800px',
            showCloseButton: true,
            showConfirmButton: false
        });
    }

    markAllPresent() {
        document.querySelectorAll('.attendance-select').forEach(select => {
            select.value = 'present';
        });
    }
}

// Initialize the service globally
window.attendanceService = new AttendanceService(); 