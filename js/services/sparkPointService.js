class SparkPointService {
    constructor() {
        this.sparkPoints = {};
        this.loadFromStorage();
    }

    loadFromStorage() {
        const savedData = localStorage.getItem('classHubSparkPoints');
        if (savedData) {
            try {
                this.sparkPoints = JSON.parse(savedData);
            } catch (e) {
                console.error('Error loading spark points data:', e);
                this.sparkPoints = {};
            }
        }
    }

    saveToStorage() {
        localStorage.setItem('classHubSparkPoints', JSON.stringify(this.sparkPoints));
    }

    addSparkPoints(studentId, points, category) {
        studentId = studentId.toString();
        if (!this.sparkPoints[studentId]) {
            this.sparkPoints[studentId] = [];
        }

        // Get current space name
        const currentSpace = window.classHub.spaces.find(s => s.id === window.classHub.currentSpaceId);
        const spaceName = currentSpace ? currentSpace.name : 'Unknown Space';

        const sparkRecord = {
            id: Date.now(),
            points: points,
            category: category,
            spaceName: spaceName,
            timestamp: new Date().toISOString(),
        };

        this.sparkPoints[studentId].push(sparkRecord);
        this.saveToStorage();
        return sparkRecord;
    }

    getStudentSparkPoints(studentId) {
        studentId = studentId.toString();
        if (!this.sparkPoints[studentId]) {
            this.initializeStudentPoints(studentId);
        }
        return this.sparkPoints[studentId] || [];
    }

    getTotalSparkPoints(studentId) {
        const points = this.getStudentSparkPoints(studentId);
        return points.reduce((total, record) => total + record.points, 0);
    }

    toggleSparkPanel(classId) {
        const panel = document.querySelector('.spark-points-panel');
        if (!panel) return;

        if (panel.classList.contains('expanded')) {
            this.collapsePanel(panel);
        } else {
            this.expandPanel(panel, classId);
        }
    }

    expandPanel(panel, classId) {
        panel.classList.add('expanded');
        const content = panel.querySelector('.spark-points-content');
        
        // Load the students grid
        const students = window.studentService.getStudents(classId);
        const classObj = window.classService.getClass(classId);

        if (!classObj) {
            content.innerHTML = `
                <div class="text-center text-muted p-4">
                    <p>No class assigned to this space.</p>
                </div>
            `;
            return;
        }

        content.innerHTML = `
            <div class="spark-points-grid">
                <div class="spark-points-header mb-3">
                    <h5>${classObj.name}</h5>
                    <div class="spark-points-filters">
                        <!-- Add filters here later -->
                    </div>
                </div>
                <div class="students-grid">
                    ${students.map(student => this.renderStudentSparkCard(student)).join('')}
                </div>
            </div>
        `;

        // Update toggle button
        const toggleBtn = panel.querySelector('.spark-points-toggle button');
        toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i> Close Spark Points';
    }

    collapsePanel(panel) {
        panel.classList.remove('expanded');
        
        // Update toggle button
        const toggleBtn = panel.querySelector('.spark-points-toggle button');
        toggleBtn.innerHTML = '<i class="fas fa-star"></i> Spark Points';
    }

    renderStudentSparkCard(student) {
        const totalPoints = this.getTotalSparkPoints(student.id);

        return `
            <div class="student-spark-card" data-student-id="${student.id}" 
                 onclick="window.sparkPointService.showPointsKeypad('${student.id}', '${student.firstName}')">
                <div class="student-info-compact">
                    <div class="avatar-container">
                        <img src="${student.avatar}" alt="${student.firstName}" class="student-avatar">
                        <div class="points-badge">
                            <i class="fas fa-star"></i> ${totalPoints}
                        </div>
                    </div>
                    <div class="student-name">${student.firstName}</div>
                </div>
            </div>
        `;
    }

    quickAddSparks(studentId, points) {
        const categories = {
            1: 'Participation',
            2: 'Good Answer',
            3: 'Great Effort',
            4: 'Outstanding Work',
            5: 'Exceptional Achievement'
        };

        const record = this.addSparkPoints(studentId, points, categories[points]);
        this.updateStudentCard(studentId);
        this.showSparkAnimation(studentId, points);
    }

    updateStudentCard(studentId) {
        // Get the current space to find the assigned class
        const currentSpace = window.classHub.spaces.find(s => s.id === window.classHub.currentSpaceId);
        if (!currentSpace) return;

        const student = window.studentService.getStudent(currentSpace.classId, studentId);
        const cardElement = document.querySelector(`.student-spark-card[data-student-id="${studentId}"]`);
        if (cardElement && student) {
            cardElement.outerHTML = this.renderStudentSparkCard(student);
        }

        // Update all instances of this student's total sparks
        const totalPoints = this.getTotalSparkPoints(studentId);
        document.querySelectorAll(`.student-spark-card[data-student-id="${studentId}"] .total-sparks`)
            .forEach(el => {
                el.innerHTML = `<i class="fas fa-star"></i> ${totalPoints} Sparks`;
            });
    }

    showSparkAnimation(studentId, points) {
        const card = document.querySelector(`.student-spark-card[data-student-id="${studentId}"]`);
        if (card) {
            // Update points badge with animation
            const badge = card.querySelector('.points-badge');
            badge.classList.add('points-updated');
            
            // Create floating animation
            const sparkEl = document.createElement('div');
            sparkEl.className = 'spark-animation';
            sparkEl.innerHTML = `+${points} ✨`;
            card.appendChild(sparkEl);
            
            setTimeout(() => {
                sparkEl.remove();
                badge.classList.remove('points-updated');
            }, 1000);
        }
    }

    initializePanel(classId) {
        const panel = document.querySelector('.spark-points-panel');
        if (panel && classId) {
            // Load the initial state
            const content = panel.querySelector('.spark-points-content');
            const students = window.studentService.getStudents(classId);
            const classObj = window.classService.getClass(classId);

            if (classObj) {
                content.innerHTML = `
                    <div class="spark-points-grid">
                        <div class="spark-points-header mb-3">
                            <h5>${classObj.name}</h5>
                            <div class="spark-points-filters">
                                <!-- Add filters here later -->
                            </div>
                        </div>
                        <div class="students-grid">
                            ${students.map(student => this.renderStudentSparkCard(student)).join('')}
                        </div>
                    </div>
                `;
            }
        }
    }

    showPointsKeypad(studentId, studentName) {
        Swal.fire({
            title: `Award Sparks to ${studentName}`,
            html: `
                <div class="points-keypad-container">
                    <div class="points-keypad positive">
                        ${[1,2,3,4,5].map(points => `
                            <button class="btn btn-spark-large add" onclick="window.sparkPointService.quickAddSparks('${studentId}', ${points})">
                                +${points}
                            </button>
                        `).join('')}
                    </div>
                    <div class="points-keypad negative">
                        ${[1,2,3,4,5].map(points => `
                            <button class="btn btn-spark-large remove" onclick="window.sparkPointService.quickAddSparks('${studentId}', -${points})">
                                -${points}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `,
            showConfirmButton: false,
            showCloseButton: true,
            width: '300px'
        });
    }

    initializeStudentPoints(studentId) {
        if (!this.sparkPoints[studentId]) {
            this.sparkPoints[studentId] = [];
            this.saveToStorage();
        }
    }
}

// Initialize the service globally
window.sparkPointService = new SparkPointService(); 