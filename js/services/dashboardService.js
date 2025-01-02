class DashboardService {
    constructor() {
        this.charts = {};
    }

    async showStudentDashboard(spaceId, classId, studentId) {
        // Handle case where classId contains a student ID format
        if (classId && classId.includes('-')) {
            // We're getting parameters in the order: classId, studentId
            window.studentService.showStudentProfile(spaceId, classId);
            return;
        }

        // Handle case where we have all three parameters
        if (spaceId && classId && studentId) {
            window.studentService.showStudentProfile(classId, studentId);
            return;
        }

        // Handle case where we have a student object
        if (spaceId && spaceId.id) {
            const student = spaceId;
            window.studentService.showStudentProfile(classId, student.id);
            return;
        }

        console.error('Invalid parameters for student dashboard:', { spaceId, classId, studentId });
    }

    // Keep other methods but they won't be used for now
    initializeDashboardCharts(insights) {
        // Method kept for future use
    }

    calculateProgressData(progress) {
        // Method kept for future use
    }

    setupDashboardHandlers(spaceId, classId, studentId) {
        // Method kept for future use
    }

    updateDashboard(insights) {
        // Method kept for future use
    }
}

// Initialize the service globally
window.dashboardService = new DashboardService(); 