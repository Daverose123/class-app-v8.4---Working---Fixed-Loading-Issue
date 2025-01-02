class StudentService {
    constructor() {
        this.students = {};
        this.loadFromStorage();
    }

    loadFromStorage() {
        const savedData = localStorage.getItem('classHubStudents');
        if (savedData) {
            try {
                this.students = JSON.parse(savedData);
            } catch (e) {
                console.error('Error loading student data:', e);
                this.students = {};
            }
        }
    }

    saveToStorage() {
        localStorage.setItem('classHubStudents', JSON.stringify(this.students));
    }

    showAddStudentDialog(classId) {
        Swal.fire({
            title: 'Add New Student',
            html: `
                <div class="student-form">
                    ${this.showAvatarSelector()}
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">First Name*</label>
                            <input type="text" id="firstName" class="form-control" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Last Name</label>
                            <input type="text" id="lastName" class="form-control">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Student ID</label>
                            <input type="text" id="studentId" class="form-control">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Grade Level</label>
                            <input type="number" id="grade" class="form-control" min="1" max="12">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Date of Birth</label>
                            <input type="date" id="dateOfBirth" class="form-control">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Gender</label>
                            <select id="gender" class="form-select">
                                <option value="">Select...</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Email</label>
                        <input type="email" id="email" class="form-control">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Phone</label>
                        <input type="tel" id="phone" class="form-control">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Address</label>
                        <textarea id="address" class="form-control" rows="2"></textarea>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Parent/Guardian Name</label>
                        <input type="text" id="guardianName" class="form-control">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Parent/Guardian Contact</label>
                        <input type="tel" id="guardianContact" class="form-control">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Additional Notes</label>
                        <textarea id="notes" class="form-control" rows="3"></textarea>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Add Student',
            width: '800px',
            preConfirm: () => {
                const firstName = $('#firstName').val();
                if (!firstName) {
                    Swal.showValidationMessage('First name is required');
                    return false;
                }
                return {
                    firstName,
                    lastName: $('#lastName').val(),
                    studentId: $('#studentId').val(),
                    grade: $('#grade').val(),
                    dateOfBirth: $('#dateOfBirth').val(),
                    gender: $('#gender').val(),
                    email: $('#email').val(),
                    phone: $('#phone').val(),
                    address: $('#address').val(),
                    guardianName: $('#guardianName').val(),
                    guardianContact: $('#guardianContact').val(),
                    notes: $('#notes').val(),
                    avatar: this.generateAvatar($('#firstName').val(), $('#lastName').val())
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.addStudent(classId, result.value);
                window.classHub.openSettings(); // Refresh the settings dialog
            }
        });
    }

    addStudent(classId, studentData) {
        if (!this.students[classId]) {
            this.students[classId] = [];
        }

        // Get current space context or use provided spaceId
        const currentSpace = window.classHub.spaces.find(s => s.id === window.classHub.currentSpaceId);
        
        const newStudent = {
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            ...studentData,
            spaceId: studentData.spaceId || (currentSpace ? currentSpace.id : null)
        };

        this.students[classId].push(newStudent);
        this.saveToStorage();
        return newStudent.id;
    }

    getStudents(classId) {
        return this.students[classId] || [];
    }

    getStudent(classId, studentId) {
        classId = classId.toString();
        studentId = studentId.toString();
        
        if (!this.students[classId]) {
            console.error('Class not found:', classId);
            return null;
        }

        const student = this.students[classId].find(s => s.id.toString() === studentId);
        if (!student) {
            console.error('Student not found in class:', { classId, studentId });
            return null;
        }

        return student;
    }

    updateStudent(classId, studentId, updatedData) {
        studentId = studentId.toString();
        const studentIndex = this.students[classId]?.findIndex(s => s.id.toString() === studentId);
        if (studentIndex !== -1) {
            this.students[classId][studentIndex] = {
                ...this.students[classId][studentIndex],
                ...updatedData
            };
            this.saveToStorage();
            return true;
        }
        return false;
    }

    removeStudent(classId, studentId) {
        studentId = studentId.toString();
        if (this.students[classId]) {
            this.students[classId] = this.students[classId].filter(s => s.id.toString() !== studentId);
            this.saveToStorage();
            return true;
        }
        return false;
    }

    showEditStudentDialog(classId, studentId) {
        const student = this.getStudent(classId, studentId);
        if (!student) return;

        Swal.fire({
            title: 'Edit Student',
            html: `
                <div class="student-form">
                    ${this.showAvatarSelector(student.avatar)}
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">First Name*</label>
                            <input type="text" id="firstName" class="form-control" value="${student.firstName}" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Last Name</label>
                            <input type="text" id="lastName" class="form-control" value="${student.lastName || ''}">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Student ID</label>
                            <input type="text" id="studentId" class="form-control" value="${student.studentId || ''}">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Grade Level</label>
                            <input type="number" id="grade" class="form-control" min="1" max="12" value="${student.grade || ''}">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Date of Birth</label>
                            <input type="date" id="dateOfBirth" class="form-control" value="${student.dateOfBirth || ''}">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Gender</label>
                            <select id="gender" class="form-select">
                                <option value="">Select...</option>
                                <option value="male" ${student.gender === 'male' ? 'selected' : ''}>Male</option>
                                <option value="female" ${student.gender === 'female' ? 'selected' : ''}>Female</option>
                                <option value="other" ${student.gender === 'other' ? 'selected' : ''}>Other</option>
                            </select>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Email</label>
                        <input type="email" id="email" class="form-control" value="${student.email || ''}">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Phone</label>
                        <input type="tel" id="phone" class="form-control" value="${student.phone || ''}">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Address</label>
                        <textarea id="address" class="form-control" rows="2">${student.address || ''}</textarea>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Parent/Guardian Name</label>
                        <input type="text" id="guardianName" class="form-control" value="${student.guardianName || ''}">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Parent/Guardian Contact</label>
                        <input type="tel" id="guardianContact" class="form-control" value="${student.guardianContact || ''}">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Additional Notes</label>
                        <textarea id="notes" class="form-control" rows="3">${student.notes || ''}</textarea>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Save Changes',
            width: '800px',
            preConfirm: () => {
                const firstName = $('#firstName').val();
                if (!firstName) {
                    Swal.showValidationMessage('First name is required');
                    return false;
                }
                return {
                    firstName,
                    lastName: $('#lastName').val(),
                    studentId: $('#studentId').val(),
                    grade: $('#grade').val(),
                    dateOfBirth: $('#dateOfBirth').val(),
                    gender: $('#gender').val(),
                    email: $('#email').val(),
                    phone: $('#phone').val(),
                    address: $('#address').val(),
                    guardianName: $('#guardianName').val(),
                    guardianContact: $('#guardianContact').val(),
                    notes: $('#notes').val(),
                    avatar: $('#avatarData').val() || student.avatar
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.updateStudent(classId, studentId, result.value);
                window.classHub.manageStudents(classId); // Refresh the student list
            }
        });
    }

    showRemoveStudentDialog(classId, studentId) {
        const student = this.getStudent(classId, studentId);
        if (!student) return;

        Swal.fire({
            title: 'Remove Student',
            text: `Are you sure you want to remove ${student.firstName} ${student.lastName || ''}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Yes, remove'
        }).then((result) => {
            if (result.isConfirmed) {
                this.removeStudent(classId, studentId);
                window.classHub.openSettings(); // Refresh the settings dialog
            }
        });
    }

    generateAvatar(firstName, lastName) {
        const seed = `${firstName}_${lastName}`.toLowerCase();
        return `https://api.dicebear.com/6.x/bottts/svg?seed=${seed}&backgroundColor=transparent`;
    }

    renderStudentList(classId) {
        const students = this.getStudents(classId);
        
        if (!students.length) {
            return '<p class="text-center text-muted">No students added yet.</p>';
        }

        return students.map(student => `
            <div class="student-item" data-student-id="${student.id}">
                <img src="${student.avatar}" alt="${student.firstName}" class="student-avatar">
                <div class="student-info">
                    <div class="student-name">${student.firstName} ${student.lastName || ''}</div>
                    <div class="student-details">
                        ${student.studentId ? `ID: ${student.studentId}` : ''}
                        ${student.grade ? `| Grade: ${student.grade}` : ''}
                    </div>
                </div>
                <div class="student-actions">
                    <button class="btn btn-link view-student" onclick="window.studentService.showStudentProfile('${classId}', '${student.id}')">
                        <i class="fas fa-user"></i>
                    </button>
                    <button class="btn btn-link edit-student" onclick="window.studentService.showEditStudentDialog('${classId}', '${student.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-link remove-student text-danger" onclick="window.studentService.showRemoveStudentDialog('${classId}', '${student.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    removeClassStudents(classId) {
        delete this.students[classId];
        this.saveToStorage();
    }

    showImportDialog(classId) {
        Swal.fire({
            title: 'Import Students',
            html: `
                <div class="mb-3">
                    <p class="text-muted">Download the template first, fill it with student data, then upload it.</p>
                    <button class="btn btn-outline-secondary btn-sm mb-3" onclick="window.studentService.downloadTemplate()">
                        <i class="fas fa-download"></i> Download Template
                    </button>
                    <input type="file" id="importFile" class="form-control" accept=".csv,.xlsx,.xls">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Import',
            preConfirm: () => {
                const file = document.getElementById('importFile').files[0];
                if (!file) {
                    Swal.showValidationMessage('Please select a file');
                    return false;
                }
                return file;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.processImportFile(result.value, classId);
            }
        });
    }

    downloadTemplate() {
        const headers = [
            'First Name*', 'Last Name', 'Student ID', 'Grade Level', 
            'Date of Birth', 'Gender', 'Email', 'Phone',
            'Address', 'Guardian Name', 'Guardian Contact', 'Notes'
        ];
        
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Students');
        XLSX.writeFile(wb, 'student_import_template.xlsx');
    }

    processImportFile(file, classId) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                
                // Remove header row
                rows.shift();
                
                // Get current space context safely
                const currentSpace = window.classHub?.spaces?.find(s => s.id === window.classHub.currentSpaceId) 
                                   || window.classHub?.spaces?.[0];
                
                // Process each row with unique IDs
                const students = rows.map(row => {
                    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    
                    return {
                        id: uniqueId,
                        firstName: row[0],
                        lastName: row[1] || '',
                        studentId: row[2] || uniqueId,
                        grade: row[3] || '',
                        dateOfBirth: row[4] || '',
                        gender: row[5] || '',
                        email: row[6] || '',
                        phone: row[7] || '',
                        address: row[8] || '',
                        guardianName: row[9] || '',
                        guardianContact: row[10] || '',
                        notes: row[11] || '',
                        avatar: this.generateAvatar(row[0], row[1] || ''),
                        spaceId: currentSpace?.id || null // Safely assign space ID
                    };
                });

                // Validate and import students
                const validStudents = students.filter(s => s.firstName);
                
                // Initialize data structures for each student
                for (const student of validStudents) {
                    const studentId = await this.addStudent(classId, student);
                    
                    if (student.spaceId) {
                        // Initialize achievements and spark points only if we have a valid space
                        window.achievementService.initializeStudentAchievements(studentId);
                        window.sparkPointService.initializeStudentPoints(studentId);
                    }
                }

                await this.saveToStorage();

                // Run space validation after import
                this.validateStudentSpaceAssignments();

                Swal.fire({
                    title: 'Import Complete',
                    text: `Successfully imported ${validStudents.length} students.`,
                    icon: 'success'
                }).then(() => {
                    window.classHub.manageStudents(classId);
                });
            } catch (error) {
                console.error('Import error:', error);
                Swal.fire({
                    title: 'Import Error',
                    text: error.message || 'There was an error processing the file.',
                    icon: 'error'
                });
            }
        };
        reader.readAsArrayBuffer(file);
    }

    showAvatarSelector(currentAvatar = null) {
        return `
            <div class="avatar-selection mb-3">
                <div class="current-avatar text-center mb-3">
                    <img src="${currentAvatar || this.generateAvatar('', '')}" 
                         alt="Current Avatar" id="currentAvatar">
                </div>
                <div class="avatar-options">
                    <div class="d-flex justify-content-center gap-2 mb-3">
                        <button class="btn btn-outline-primary btn-sm" onclick="window.studentService.generateRandomAvatar()">
                            <i class="fas fa-dice"></i> Random Avatar
                        </button>
                        <button class="btn btn-outline-secondary btn-sm" onclick="document.getElementById('photoUpload').click()">
                            <i class="fas fa-upload"></i> Upload Photo
                        </button>
                    </div>
                    <input type="file" id="photoUpload" class="d-none" accept="image/*" 
                           onchange="window.studentService.handlePhotoUpload(event)">
                    <input type="hidden" id="avatarData" value="${currentAvatar || ''}">
                </div>
            </div>
        `;
    }

    generateRandomAvatar() {
        const seed = Math.random().toString(36).substring(7);
        const newAvatar = `https://api.dicebear.com/6.x/bottts/svg?seed=${seed}&backgroundColor=transparent`;
        document.getElementById('currentAvatar').src = newAvatar;
        document.getElementById('avatarData').value = newAvatar;
    }

    handlePhotoUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('currentAvatar').src = e.target.result;
                document.getElementById('avatarData').value = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    showStudentProfile(classId, studentId) {
        // Ensure we're working with string IDs
        classId = classId.toString();
        studentId = studentId.toString();

        const student = this.getStudent(classId, studentId);
        if (!student) {
            console.error('Student not found:', { classId, studentId });
            Swal.fire({
                title: 'Error',
                text: 'Student not found',
                icon: 'error'
            });
            return;
        }

        // Get student's spark points
        const totalSparks = window.sparkPointService.getTotalSparkPoints(studentId);
        const sparkHistory = window.sparkPointService.getStudentSparkPoints(studentId);

        // Get student's achievements
        const achievements = window.achievementService.getStudentAchievements(studentId);

        // Close any existing modal first
        Swal.close();

        // Then open the student profile
        setTimeout(() => {
            Swal.fire({
                title: `${student.firstName} ${student.lastName || ''}`,
                html: `
                    <div class="student-profile">
                        <div class="profile-header">
                            <img src="${student.avatar}" alt="${student.firstName}" class="student-profile-avatar">
                            <div class="profile-header-info">
                                <div class="profile-meta">
                                    ${student.studentId ? `<span><i class="fas fa-id-card"></i> ${student.studentId}</span>` : ''}
                                    ${student.grade ? `<span><i class="fas fa-graduation-cap"></i> Grade ${student.grade}</span>` : ''}
                                </div>
                                <div class="spark-points-summary">
                                    <i class="fas fa-star text-warning"></i> ${totalSparks} Spark Points
                                </div>
                            </div>
                        </div>
                        <div class="profile-content">
                            <ul class="nav nav-tabs mb-3" role="tablist">
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#info" type="button">
                                        Information
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" data-bs-toggle="tab" data-bs-target="#achievements" type="button">
                                        Achievements & Points
                                    </button>
                                </li>
                            </ul>
                            <div class="tab-content">
                                <div class="tab-pane fade show active" id="info">
                                    <div class="info-grid">
                                        ${student.dateOfBirth ? `
                                            <div class="info-item">
                                                <label><i class="fas fa-birthday-cake"></i> Date of Birth</label>
                                                <span>${student.dateOfBirth}</span>
                                            </div>
                                        ` : ''}
                                        ${student.gender ? `
                                            <div class="info-item">
                                                <label><i class="fas fa-venus-mars"></i> Gender</label>
                                                <span>${student.gender}</span>
                                            </div>
                                        ` : ''}
                                        ${student.email ? `
                                            <div class="info-item">
                                                <label><i class="fas fa-envelope"></i> Email</label>
                                                <span>${student.email}</span>
                                            </div>
                                        ` : ''}
                                        ${student.phone ? `
                                            <div class="info-item">
                                                <label><i class="fas fa-phone"></i> Phone</label>
                                                <span>${student.phone}</span>
                                            </div>
                                        ` : ''}
                                        ${student.address ? `
                                            <div class="info-item full-width">
                                                <label><i class="fas fa-home"></i> Address</label>
                                                <span>${student.address}</span>
                                            </div>
                                        ` : ''}
                                        ${student.guardianName ? `
                                            <div class="info-item">
                                                <label><i class="fas fa-user"></i> Guardian Name</label>
                                                <span>${student.guardianName}</span>
                                            </div>
                                        ` : ''}
                                        ${student.guardianContact ? `
                                            <div class="info-item">
                                                <label><i class="fas fa-phone"></i> Guardian Contact</label>
                                                <span>${student.guardianContact}</span>
                                            </div>
                                        ` : ''}
                                        ${student.notes ? `
                                            <div class="info-item full-width">
                                                <label><i class="fas fa-sticky-note"></i> Notes</label>
                                                <div class="notes-content">${student.notes}</div>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                                <div class="tab-pane fade" id="achievements">
                                    <div class="spark-points-section mb-4">
                                        <h5 class="mb-3">Spark Points History</h5>
                                        <div class="spark-points-list">
                                            ${sparkHistory.length ? sparkHistory.reverse().map(record => `
                                                <div class="spark-history-item">
                                                    <div class="spark-details">
                                                        <span class="spark-amount ${record.points < 0 ? 'negative' : 'positive'}">
                                                            ${record.points > 0 ? '+' : ''}${record.points}
                                                        </span>
                                                    </div>
                                                    <div class="spark-space">
                                                        <i class="fas fa-map-marker-alt"></i> ${record.spaceName || 'Unknown Space'}
                                                    </div>
                                                    <div class="spark-time">
                                                        ${new Date(record.timestamp).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            `).join('') : '<p class="text-muted">No spark points earned yet.</p>'}
                                        </div>
                                    </div>
                                    <div class="achievements-section">
                                        <div class="d-flex justify-content-between align-items-center mb-3">
                                            <h5 class="mb-0">Achievements</h5>
                                            <button class="btn btn-primary btn-sm" onclick="event.preventDefault(); window.achievementService.showAddAchievementDialog('${student.id}', '${classId}')">
                                                <i class="fas fa-plus"></i> Add Achievement
                                            </button>
                                        </div>
                                        ${window.achievementService.renderAchievements(student.id)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `,
                width: '600px',
                showCloseButton: true,
                showConfirmButton: false,
                didOpen: () => {
                    // Initialize Bootstrap tabs
                    const tabElements = document.querySelectorAll('button[data-bs-toggle="tab"]');
                    tabElements.forEach(tab => {
                        new bootstrap.Tab(tab);
                    });
                }
            });
        }, 100);
    }

    validateStudentData() {
        Object.keys(this.students).forEach(classId => {
            this.students[classId].forEach(student => {
                // Ensure student has all required data structures
                window.achievementService.initializeStudentAchievements(student.id);
                window.sparkPointService.initializeStudentPoints(student.id);
                
                // Verify student ID consistency
                if (!student.id) {
                    console.error('Student missing ID:', student);
                    student.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                }
                
                // Ensure student ID is string
                student.id = student.id.toString();
            });
        });
        this.saveToStorage();
    }

    validateStudentSpaceAssignments() {
        // Check if ClassHub is initialized
        if (!window.classHub || !window.classHub.spaces) {
            console.log('Deferring space validation until ClassHub is initialized');
            return;
        }

        const defaultSpace = window.classHub.spaces[0];
        if (!defaultSpace) {
            console.log('No spaces available yet, skipping space assignments');
            return;
        }
        
        Object.keys(this.students).forEach(classId => {
            this.students[classId].forEach(student => {
                if (!student.spaceId) {
                    console.log('Fixing missing space assignment for student:', student.id);
                    student.spaceId = defaultSpace.id;
                }
            });
        });
        
        this.saveToStorage();
    }
}

// Initialize the service globally
window.studentService = new StudentService(); 