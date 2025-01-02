class ClassHub {
    constructor() {
        this.spaces = [];
        this.currentSpaceId = null;
        this.settings = {
            schoolName: 'Class Hub',
            className: '',
            schoolLogo: ''
        };
        this.defaultAvatar = 'https://api.dicebear.com/6.x/bottts/svg?seed=bot_0&backgroundColor=transparent';
        this.spaceClasses = {};
        this.initialized = false;
        this.initPromise = null;
        this.loadSpaceClasses();
    }

    async init() {
        if (this.initialized) {
            console.warn('ClassHub already initialized');
            return;
        }

        try {
            await this._initializeApp();
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize ClassHub:', error);
            await Swal.fire({
                title: 'Initialization Error',
                text: 'Failed to initialize the application. Please refresh the page.',
                icon: 'error'
            });
        }
    }

    async _initializeApp() {
        // Load data from storage
        this.loadFromLocalStorage();
        
        // Validate student data
        await window.studentService.validateStudentData();
        
        // Setup event listeners
        this.setupEventListeners();

        // Check classes and initialize
        const classes = window.classService.getAllClasses();
        
        if (classes.length === 0) {
            await this.handleFirstTimeSetup();
        } else {
            await this.handleNormalInitialization();
        }
    }

    async handleFirstTimeSetup() {
        const result = await Swal.fire({
            title: 'Welcome to Class Hub!',
            text: 'Please create your first class before creating a learning space.',
            icon: 'info',
            confirmButtonText: 'Create Class',
        });

        if (result.isConfirmed) {
            await this.showClassManagement();
        }
    }

    async handleNormalInitialization() {
        this.renderSpaces();
        this.updateHeaderInfo();
        
        await window.studentService.validateStudentSpaceAssignments();
        
        if (this.spaces.length > 0) {
            if (!this.currentSpaceId || !this.spaces.find(s => s.id === this.currentSpaceId)) {
                await this.switchToSpace(this.spaces[0].id);
            } else {
                await this.switchToSpace(this.currentSpaceId);
            }
        }
    }

    // Add method to check initialization status
    async ensureInitialized() {
        if (!this.initialized) {
            if (this.initPromise) {
                await this.initPromise;
            } else {
                await this.init();
            }
        }
    }

    setupEventListeners() {
        $('#addSpaceBtn').on('click', () => this.createNewSpace());
        $('#settingsBtn').on('click', () => this.openSettings());
        $('.sidebar-toggle').on('click', () => {
            $('.sidebar').toggleClass('collapsed');
            localStorage.setItem('sidebarCollapsed', $('.sidebar').hasClass('collapsed'));
        });

        if (localStorage.getItem('sidebarCollapsed') === 'true') {
            $('.sidebar').addClass('collapsed');
        }
    }

    loadFromLocalStorage() {
        const savedSpaces = localStorage.getItem('classHubSpaces');
        if (savedSpaces) {
            try {
                const spacesData = JSON.parse(savedSpaces);
                this.spaces = spacesData.map(spaceData => {
                    const space = {
                        id: spaceData.id,
                        name: spaceData.name,
                        emoji: spaceData.emoji || '📚',
                        centralIdea: spaceData.centralIdea,
                        widgets: []
                    };

                    // Recreate widgets with their saved settings
                    if (spaceData.widgets) {
                        space.widgets = spaceData.widgets.map(widgetData => {
                            const config = {
                                id: widgetData.id,
                                position: widgetData.position,
                                settings: widgetData.settings
                            };

                            switch (widgetData.type) {
                                case 'clock':
                                    return new ClockWidget(config);
                                case 'weather':
                                    return new WeatherWidget(config);
                                case 'materials':
                                    return new MaterialsWidget(config);
                                case 'announcement':
                                    return new AnnouncementWidget(config);
                                case 'homework':
                                    return new HomeworkWidget(config);
                                case 'objective':
                                    return new ObjectiveWidget(config);
                                case 'bellringer':
                                    return new BellRingerWidget(config);
                                case 'timer':
                                    return new TimerWidget(config);
                                case 'stickynote':
                                    return new StickyNoteWidget(config);
                                case 'timetable':
                                    return new TimeTableWidget(config);
                                default:
                                    return null;
                            }
                        }).filter(widget => widget !== null);
                    }
                    return space;
                });
            } catch (e) {
                console.error('Error parsing saved spaces:', e);
                this.spaces = [];
            }
        }

        // Load settings
        const savedSettings = localStorage.getItem('classHubSettings');
        if (savedSettings) {
            try {
                this.settings = JSON.parse(savedSettings);
            } catch (e) {
                console.error('Error parsing saved settings:', e);
            }
        }
    }

    saveToLocalStorage() {
        const spacesData = this.spaces.map(space => ({
            id: space.id,
            name: space.name,
            emoji: space.emoji,
            centralIdea: space.centralIdea,
            widgets: space.widgets.map(widget => ({
                id: widget.id,
                type: widget.type,
                position: widget.position,
                settings: widget.settings
            }))
        }));
        
        localStorage.setItem('classHubSpaces', JSON.stringify(spacesData));
        localStorage.setItem('classHubSettings', JSON.stringify(this.settings));
    }

    createNewSpace() {
        const classes = window.classService.getAllClasses();
        
        Swal.fire({
            title: 'Create New Space',
            html: `
                <div class="mb-3">
                    <label class="form-label">Space Name</label>
                    <input type="text" id="spaceName" class="form-control" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Central Idea</label>
                    <textarea id="centralIdea" class="form-control" rows="3"></textarea>
                </div>
                <div class="mb-3">
                    <label class="form-label">Select Class</label>
                    <select id="classId" class="form-select" required>
                        <option value="">Choose a class...</option>
                        ${classes.map(c => `
                            <option value="${c.id}">${c.name}</option>
                        `).join('')}
                    </select>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Create',
            preConfirm: () => {
                const name = document.getElementById('spaceName').value;
                const centralIdea = document.getElementById('centralIdea').value;
                const classId = document.getElementById('classId').value;

                if (!name || !classId) {
                    Swal.showValidationMessage('Please fill in all required fields');
                    return false;
                }

                return { name, centralIdea, classId };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const space = {
                    id: Date.now().toString(),
                    name: result.value.name,
                    emoji: '📚',
                    centralIdea: result.value.centralIdea,
                    widgets: []
                };

                this.spaces.push(space);
                // Save the class assignment
                this.assignClassToSpace(space.id, result.value.classId);
                this.saveToLocalStorage();
                this.renderSpaces();
                this.switchToSpace(space.id);
            }
        });
    }

    renderSpaces() {
        const $list = $('.learning-spaces-list');
        $list.empty();
        
        this.spaces.forEach((space, index) => {
            const $item = $(`
                <div class="space-item d-flex justify-content-between align-items-center 
                            ${space.id === this.currentSpaceId ? 'active' : ''}" 
                     data-space-id="${space.id}"
                     data-name="${space.name}">
                    <span class="space-name">
                        <span class="space-emoji">${space.emoji || '📚'}</span>
                        <span class="space-text">${space.name}</span>
                    </span>
                    <div class="space-item-controls">
                        <button class="btn btn-sm btn-link move-space-up" ${index === 0 ? 'disabled' : ''}>
                            <i class="fas fa-chevron-up"></i>
                        </button>
                        <button class="btn btn-sm btn-link move-space-down" ${index === this.spaces.length - 1 ? 'disabled' : ''}>
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        <button class="btn btn-sm btn-link space-settings-btn">
                            <i class="fas fa-cog"></i>
                        </button>
                        <button class="btn btn-sm btn-link remove-space-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `);

            // Add click handlers for each space
            $item.find('.space-name').on('click', () => this.switchToSpace(space.id));
            
            // Settings button handler
            $item.find('.space-settings-btn').on('click', (e) => {
                e.stopPropagation();
                this.openSpaceSettings(space.id);
            });
            
            // Remove button handler
            $item.find('.remove-space-btn').on('click', (e) => {
                e.stopPropagation();
                this.removeSpace(space.id);
            });

            $list.append($item);
        });

        // Add click handlers for the move buttons
        $('.move-space-up').on('click', (e) => {
            e.stopPropagation();
            const $item = $(e.target).closest('.space-item');
            const spaceId = parseInt($item.data('space-id'));
            this.moveSpace(spaceId, 'up');
        });

        $('.move-space-down').on('click', (e) => {
            e.stopPropagation();
            const $item = $(e.target).closest('.space-item');
            const spaceId = parseInt($item.data('space-id'));
            this.moveSpace(spaceId, 'down');
        });
    }

    switchToSpace(spaceId) {
        this.currentSpaceId = spaceId;
        const space = this.spaces.find(s => s.id === spaceId);
        if (!space) return;

        // Get the assigned class for this space
        const classId = this.getSpaceClass(spaceId);
        if (classId) {
            space.classId = classId; // Ensure the space has its class ID
        }

        this.renderSpaces();
        this.renderSpaceContent(space);
        this.saveToLocalStorage();
    }

    renderSpaceContent(space) {
        console.log('Rendering space content for space:', space.id);
        console.log('Space widgets data:', space.widgets);
        const $content = $('#content');
        $content.empty();
        
        const learningSpace = new LearningSpace(
            space.id, 
            space.name,
            space.centralIdea
        );
        
        if (space.widgets && Array.isArray(space.widgets)) {
            space.widgets.forEach(widgetData => {
                let widget;
                console.log('Creating widget from data:', widgetData);
                switch (widgetData.type) {
                    case 'clock':
                        widget = new ClockWidget(widgetData);
                        break;
                    case 'weather':
                        widget = new WeatherWidget(widgetData);
                        break;
                    case 'materials':
                        widget = new MaterialsWidget(widgetData);
                        break;
                    case 'announcement':
                        widget = new AnnouncementWidget(widgetData);
                        break;
                    case 'homework':
                        widget = new HomeworkWidget(widgetData);
                        break;
                    case 'objective':
                        widget = new ObjectiveWidget(widgetData);
                        break;
                    case 'bellringer':
                        widget = new BellRingerWidget(widgetData);
                        break;
                    case 'timer':
                        widget = new TimerWidget(widgetData);
                        break;
                    case 'stickynote':
                        widget = new StickyNoteWidget(widgetData);
                        break;
                    case 'timetable':
                        widget = new TimeTableWidget(widgetData);
                        break;
                }
                if (widget) {
                    console.log('Widget created with state:', widget);
                    learningSpace.widgets.push(widget);
                }
            });
        }
        
        learningSpace.init($content);

        // Get the assigned class ID
        const classId = this.getSpaceClass(space.id);

        // Add the footer with spark points panel
        const footer = `
            <div class="space-footer">
                <div class="spark-points-panel collapsed">
                    <div class="spark-points-toggle">
                        <button class="btn btn-primary" onclick="window.sparkPointService.toggleSparkPanel('${classId}')">
                            <i class="fas fa-star"></i> Spark Points
                        </button>
                    </div>
                    <div class="spark-points-content">
                        <!-- Content will be dynamically loaded -->
                    </div>
                </div>
            </div>
        `;

        $content.append(footer);

        // If there's a class assigned, initialize the spark points panel
        if (classId) {
            window.sparkPointService.initializePanel(classId);
        }
    }

    openSettings(activeTab = 'general') {
        // Get current space and class with proper null checks
        const currentSpace = this.spaces.find(s => s.id === this.currentSpaceId);
        const currentClass = currentSpace?.classId ? window.classService.getClass(currentSpace.classId) : null;

        Swal.fire({
            title: 'Settings',
            html: `
                <ul class="nav nav-tabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link ${activeTab === 'general' ? 'active' : ''}" data-bs-toggle="tab" data-bs-target="#general" type="button">General</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link ${activeTab === 'classes' ? 'active' : ''}" data-bs-toggle="tab" data-bs-target="#classes" type="button">Classes</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link ${activeTab === 'attendance' ? 'active' : ''}" data-bs-toggle="tab" data-bs-target="#attendance" type="button">Attendance</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link ${activeTab === 'achievements' ? 'active' : ''}" data-bs-toggle="tab" data-bs-target="#achievements" type="button">Achievements</button>
                    </li>
                </ul>
                <div class="tab-content p-3">
                    <!-- General Tab -->
                    <div class="tab-pane fade ${activeTab === 'general' ? 'show active' : ''}" id="general">
                        <div class="mb-3">
                            <label class="form-label">School Name</label>
                            <input type="text" id="schoolName" class="form-control" value="${this.settings.schoolName || ''}">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">School Logo</label>
                            <input type="file" id="schoolLogo" class="form-control" accept="image/*">
                        </div>
                    </div>
                    
                    <!-- Classes Tab -->
                    <div class="tab-pane fade ${activeTab === 'classes' ? 'show active' : ''}" id="classes">
                        <div class="d-flex justify-content-end mb-3">
                            <button class="btn btn-primary btn-sm" onclick="window.classHub.showCreateClass()">
                                <i class="fas fa-plus"></i> Add Class
                            </button>
                        </div>
                        <div class="class-grid">
                            ${this.renderClassGrid()}
                        </div>
                    </div>

                    <!-- Attendance Tab -->
                    <div class="tab-pane fade ${activeTab === 'attendance' ? 'show active' : ''}" id="attendance">
                        <div class="attendance-classes">
                            ${window.classService.getAllClasses().length > 0 ? `
                                ${window.classService.getAllClasses().map(classObj => `
                                    <div class="attendance-class-item">
                                        <div class="class-info">
                                            <h5 class="class-name">${classObj.name}</h5>
                                            <div class="class-meta">
                                                ${classObj.gradeLevel ? `Grade ${classObj.gradeLevel}` : ''}
                                                ${classObj.academicYear ? `| ${classObj.academicYear}` : ''}
                                            </div>
                                        </div>
                                        <div class="attendance-actions">
                                            <button class="btn btn-outline-secondary" onclick="event.preventDefault(); window.attendanceService.showAttendanceReport('${classObj.id}')">
                                                <i class="fas fa-chart-bar"></i> View Report
                                            </button>
                                            <button class="btn btn-primary" onclick="event.preventDefault(); window.attendanceService.showAttendanceManager('${classObj.id}')">
                                                <i class="fas fa-clipboard-check"></i> Take Attendance
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            ` : `
                                <div class="text-center text-muted">
                                    <p>No classes found. Please create a class first.</p>
                                    <button class="btn btn-primary btn-sm" onclick="window.classHub.showCreateClass()">
                                        Create Class
                                    </button>
                                </div>
                            `}
                        </div>
                    </div>

                    <!-- Achievements Tab -->
                    <div class="tab-pane fade ${activeTab === 'achievements' ? 'show active' : ''}" id="achievements">
                        <div class="achievements-overview">
                            ${this.renderAchievementsOverview()}
                        </div>
                    </div>
                </div>
            `,
            width: '800px',
            showConfirmButton: false,
            showCloseButton: true,
            didOpen: () => {
                this.setupSettingsHandlers();
            }
        });
    }

    renderClassGrid() {
        const classes = window.classService.getAllClasses();
        
        if (classes.length === 0) {
            return `
                <div class="text-center text-muted">
                    <p>No classes created yet.</p>
                    <button class="btn btn-primary btn-sm" onclick="window.classHub.showCreateClass()">
                        Create Your First Class
                    </button>
                </div>
            `;
        }

        return `
            <div class="row g-3">
                ${classes.map(classObj => `
                    <div class="col-md-6 col-lg-4">
                        <div class="class-card">
                            <div class="class-card-header">
                                <h5 class="class-name">${classObj.name}</h5>
                                <div class="class-meta">
                                    ${classObj.gradeLevel ? `Grade ${classObj.gradeLevel}` : ''}
                                    ${classObj.academicYear ? `| ${classObj.academicYear}` : ''}
                                </div>
                            </div>
                            <div class="class-card-body">
                                <div class="student-count">
                                    <i class="fas fa-users"></i>
                                    ${window.studentService.getStudents(classObj.id).length} students
                                </div>
                            </div>
                            <div class="class-card-footer">
                                <button class="btn btn-primary btn-sm" onclick="window.classHub.manageStudents('${classObj.id}')">
                                    <i class="fas fa-users"></i> Students
                                </button>
                                <div class="btn-group">
                                    <button class="btn btn-outline-secondary btn-sm" onclick="window.classHub.editClass('${classObj.id}')">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="btn btn-outline-danger btn-sm" onclick="window.classHub.removeClass('${classObj.id}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    setupSettingsHandlers() {
        // Student management handlers
        $('#addStudentBtn').on('click', () => {
            const currentSpace = this.spaces.find(s => s.id === this.currentSpaceId);
            if (currentSpace && currentSpace.classId) {
                window.studentService.showAddStudentDialog(currentSpace.classId);
            }
        });

        $('#importStudentsBtn').on('click', () => {
            const currentSpace = this.spaces.find(s => s.id === this.currentSpaceId);
            window.studentService.showImportDialog(currentSpace.id, currentSpace.classId);
        });

        // Student action handlers
        $(document).on('click', '.view-student', (e) => {
            const studentId = $(e.target).closest('.student-item').data('student-id');
            const currentSpace = this.spaces.find(s => s.id === this.currentSpaceId);
            window.dashboardService.showStudentDashboard(currentSpace.id, currentSpace.classId, studentId);
        });

        $(document).on('click', '.edit-student', (e) => {
            const studentId = $(e.target).closest('.student-item').data('student-id');
            const currentSpace = this.spaces.find(s => s.id === this.currentSpaceId);
            window.studentService.showEditStudentDialog(currentSpace.id, currentSpace.classId, studentId);
        });

        $(document).on('click', '.remove-student', (e) => {
            const studentId = $(e.target).closest('.student-item').data('student-id');
            const currentSpace = this.spaces.find(s => s.id === this.currentSpaceId);
            window.studentService.showRemoveStudentDialog(currentSpace.id, currentSpace.classId, studentId);
        });
    }

    showAddStudentDialog(spaceId) {
        const classId = this.currentClassId; // Add this property to track current class
        
        Swal.fire({
            title: 'Add New Student',
            html: `
                <div class="mb-3">
                    <label class="form-label">First Name</label>
                    <input type="text" id="firstName" class="form-control" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Last Name</label>
                    <input type="text" id="lastName" class="form-control" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Student ID</label>
                    <input type="text" id="studentId" class="form-control" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Grade Level</label>
                    <input type="number" id="gradeLevel" class="form-control" min="1" max="12">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Add Student',
            preConfirm: () => {
                const firstName = document.getElementById('firstName').value;
                const lastName = document.getElementById('lastName').value;
                const studentId = document.getElementById('studentId').value;
                const gradeLevel = document.getElementById('gradeLevel').value;

                if (!firstName || !lastName || !studentId) {
                    Swal.showValidationMessage('Please fill in all required fields');
                    return false;
                }

                return {
                    firstName,
                    lastName,
                    studentId,
                    gradeLevel
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                window.studentService.addStudent(spaceId, classId, result.value);
                // Refresh the student list
                $('.student-list-container').html(this.renderStudentList(spaceId));
            }
        });
    }

    renderStudentList(classId) {
        const students = window.classService.getStudents(classId);
        
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
                    <button class="btn btn-link view-student" title="View Profile">
                        <i class="fas fa-user"></i>
                    </button>
                    <button class="btn btn-link edit-student" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-link remove-student text-danger" title="Remove">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    removeSpace(spaceId) {
        const space = this.spaces.find(s => s.id === spaceId);
        if (!space) return;

        Swal.fire({
            title: 'Remove Space',
            text: `Are you sure you want to remove "${space.name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, remove it',
            confirmButtonColor: '#dc3545'
        }).then((result) => {
            if (result.isConfirmed) {
                // Remove the space
                this.spaces = this.spaces.filter(s => s.id !== spaceId);
                
                // Save changes
                this.saveToLocalStorage();
                
                // Update UI
                this.renderSpaces();
                
                // If the removed space was currently displayed, show another space or clear content
                if (this.currentSpaceId === spaceId) {
                    if (this.spaces.length > 0) {
                        this.switchToSpace(this.spaces[0].id);
                    } else {
                        $('#content').empty();
                        this.currentSpaceId = null;
                    }
                }

                // Show success message
                Swal.fire({
                    title: 'Removed!',
                    text: `${space.name} has been removed.`,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        });
    }

    openSpaceSettings(spaceId) {
        const space = this.spaces.find(s => s.id === spaceId);
        if (!space) return;

        Swal.fire({
            title: 'Space Settings',
            html: `
                <div class="mb-3">
                    <label class="form-label">Space Icon</label>
                    <div class="input-group">
                        <input type="text" id="spaceEmoji" class="form-control" value="${space.emoji || '📚'}" readonly>
                        <button class="btn btn-outline-secondary emoji-picker-btn" type="button">
                            <i class="fas fa-smile"></i>
                        </button>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Space Name</label>
                    <input type="text" id="spaceName" class="form-control" value="${space.name}">
                </div>
                <div class="mb-3">
                    <label class="form-label">Central Idea</label>
                    <textarea id="centralIdea" class="form-control" rows="3">${space.centralIdea || ''}</textarea>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Save',
            didOpen: () => {
                // Setup emoji picker for space settings
                $('.emoji-picker-btn').on('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.emojiPicker.showPicker(e.currentTarget, emoji => {
                        $('#spaceEmoji').val(emoji.emoji);
                    });
                });
            },
            preConfirm: () => {
                return {
                    name: document.getElementById('spaceName').value,
                    emoji: document.getElementById('spaceEmoji').value,
                    centralIdea: document.getElementById('centralIdea').value
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                space.name = result.value.name;
                space.emoji = result.value.emoji;
                space.centralIdea = result.value.centralIdea;
                this.saveToLocalStorage();
                this.renderSpaces();
                if (this.currentSpaceId === space.id) {
                    this.renderSpaceContent(space);
                }
            }
        });
    }

    updateHeaderInfo() {
        // Update school name in sidebar
        const $sidebarSchoolName = $('#sidebarSchoolName');
        const $sidebarClassName = $('#sidebarClassName');
        const $sidebarSchoolLogo = $('#sidebarSchoolLogo');

        // Update school name
        if ($sidebarSchoolName.length) {
            $sidebarSchoolName.text(this.settings.schoolName || 'Class Hub');
        }

        // Update class name
        if ($sidebarClassName.length) {
            $sidebarClassName.text(this.settings.className || '');
            // Hide/show class name container based on whether there's content
            $sidebarClassName.toggle(Boolean(this.settings.className));
        }

        // Update logo
        if ($sidebarSchoolLogo.length) {
            if (this.settings.schoolLogo) {
                $sidebarSchoolLogo.attr('src', this.settings.schoolLogo).show();
                $('.school-logo').addClass('has-logo').show();
            } else {
                $sidebarSchoolLogo.hide();
                $('.school-logo').removeClass('has-logo').hide();
            }
        }
    }

    saveSpace(space) {
        console.log('Saving space:', space);
        const spaceIndex = this.spaces.findIndex(s => s.id === space.id);
        if (spaceIndex !== -1) {
            // Create a clean copy of the space with its widgets
            const spaceToSave = {
                ...space,
                widgets: space.widgets.map(widget => {
                    // Ensure each widget is a proper instance with its data
                    const WidgetClass = window[widget.type + 'Widget'];
                    if (WidgetClass && !(widget instanceof WidgetClass)) {
                        return new WidgetClass({
                            id: widget.id,
                            position: widget.position,
                            settings: widget.settings
                        });
                    }
                    return widget;
                })
            };
            this.spaces[spaceIndex] = spaceToSave;
            this.saveToLocalStorage();
        }
    }

    saveAndRenderSpace(space) {
        this.saveSpace(space);
        this.saveToLocalStorage();
        this.renderSpaceContent(space);
    }

    createWidget(type, space) {
        console.log('Creating widget of type:', type);
        let widget;
        const defaultPosition = this.getDefaultWidgetPosition(space);
        
        switch (type) {
            case 'timer':
                console.log('Creating timer widget...');
                widget = new TimerWidget({ position: defaultPosition });
                console.log('Timer widget created:', widget);
                break;
            case 'clock':
                widget = new ClockWidget({ position: defaultPosition });
                break;
            case 'weather':
                widget = new WeatherWidget({ position: defaultPosition });
                break;
            case 'materials':
                widget = new MaterialsWidget({ position: defaultPosition });
                break;
            case 'announcement':
                widget = new AnnouncementWidget({ position: defaultPosition });
                break;
            case 'homework':
                widget = new HomeworkWidget({ position: defaultPosition });
                break;
            case 'objective':
                widget = new ObjectiveWidget({ position: defaultPosition });
                break;
            case 'bellringer':
                widget = new BellRingerWidget({ position: defaultPosition });
                break;
            case 'stickynote':
                widget = new StickyNoteWidget({ position: defaultPosition });
                break;
            case 'timetable':
                widget = new TimeTableWidget({ position: defaultPosition });
                break;
        }

        if (widget) {
            console.log('Widget created successfully:', widget);
            space.widgets.push(widget);
            this.saveToLocalStorage();
            this.saveAndRenderSpace(space);
        } else {
            console.error('Failed to create widget of type:', type);
        }
    }

    getDefaultWidgetPosition(space) {
        const offset = (space.widgets.length * 30) % 150;
        return {
            left: offset,
            top: offset,
            width: 200,
            height: 150
        };
    }

    moveSpace(spaceId, direction) {
        const spaceIndex = this.spaces.findIndex(s => s.id === spaceId);
        if (spaceIndex === -1) return;

        if (direction === 'up' && spaceIndex > 0) {
            // Move space up
            [this.spaces[spaceIndex], this.spaces[spaceIndex - 1]] = 
            [this.spaces[spaceIndex - 1], this.spaces[spaceIndex]];
        } else if (direction === 'down' && spaceIndex < this.spaces.length - 1) {
            // Move space down
            [this.spaces[spaceIndex], this.spaces[spaceIndex + 1]] = 
            [this.spaces[spaceIndex + 1], this.spaces[spaceIndex]];
        }

        this.saveToLocalStorage();
        this.renderSpaces();
        
        // Keep the moved space selected if it was selected
        if (this.currentSpaceId === spaceId) {
            this.switchToSpace(spaceId);
        }
    }

    updateWidgetPosition(widget, position) {
        widget.position = position;
        this.saveToLocalStorage();
    }

    removeStudent(spaceId, studentId) {
        const student = window.studentService.getStudent(spaceId, studentId);
        if (!student) return;

        Swal.fire({
            title: 'Remove Student',
            text: `Are you sure you want to remove ${student.firstName} ${student.lastName}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Remove'
        }).then((result) => {
            if (result.isConfirmed) {
                window.studentService.removeStudent(spaceId, studentId);
                // Refresh the student list
                $('.student-list-container').html(this.renderStudentList(spaceId));
            }
        });
    }

    showAchievements(spaceId, classId, studentId) {
        const student = window.studentService.getStudent(spaceId, classId, studentId);
        const achievements = window.studentService.getStudentAchievements(spaceId, classId, studentId);

        Swal.fire({
            title: `Achievements - ${student.firstName} ${student.lastName}`,
            html: `
                <div class="achievements-manager">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h6 class="mb-0">Student Achievements</h6>
                        <button class="btn btn-primary btn-sm add-achievement">
                            <i class="fas fa-plus"></i> Add Achievement
                        </button>
                    </div>
                    <div class="achievements-list">
                        ${achievements.length ? achievements.map(achievement => `
                            <div class="achievement-item" data-achievement-id="${achievement.id}">
                                <div class="achievement-info">
                                    <div class="achievement-title">
                                        <i class="fas fa-trophy text-warning"></i>
                                        ${achievement.title}
                                    </div>
                                    <div class="achievement-details text-muted">
                                        ${new Date(achievement.date).toLocaleDateString()}
                                        ${achievement.category ? `<span class="badge bg-secondary">${achievement.category}</span>` : ''}
                                    </div>
                                    <div class="achievement-description">
                                        ${achievement.description || ''}
                                    </div>
                                </div>
                                <div class="achievement-actions">
                                    <button class="btn btn-sm btn-link edit-achievement">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-link remove-achievement text-danger">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('') : '<p class="text-muted text-center">No achievements yet.</p>'}
                    </div>
                    ${student.awards?.studentOfWeek ? `
                        <div class="student-of-week mt-3">
                            <h6><i class="fas fa-star text-warning"></i> Student of the Week</h6>
                            <div class="award-details">
                                Week of ${new Date(student.awards.studentOfWeek.startDate).toLocaleDateString()}
                                <p class="text-muted mb-0">${student.awards.studentOfWeek.reason}</p>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `,
            width: '800px',
            showCancelButton: true,
            cancelButtonText: 'Close',
            showConfirmButton: false,
            didOpen: () => {
                // Handle add achievement
                $('.add-achievement').on('click', () => {
                    this.showAchievementForm(spaceId, classId, studentId);
                });

                // Handle edit achievement
                $(document).on('click', '.edit-achievement', (e) => {
                    const achievementId = $(e.target).closest('.achievement-item').data('achievement-id');
                    const achievement = achievements.find(a => a.id === achievementId);
                    if (achievement) {
                        this.showAchievementForm(spaceId, classId, studentId, achievement);
                    }
                });

                // Handle remove achievement
                $(document).on('click', '.remove-achievement', (e) => {
                    const achievementId = $(e.target).closest('.achievement-item').data('achievement-id');
                    this.removeAchievement(spaceId, classId, studentId, achievementId);
                });
            }
        });
    }

    showImportDialog(spaceId, classId) {
        Swal.fire({
            title: 'Import Students',
            html: `
                <div class="mb-3">
                    <p class="text-muted">Upload an Excel or CSV file with student data.</p>
                    <p class="small">Required columns: First Name, Last Name, Student ID</p>
                    <div class="mb-3">
                        <input type="file" class="form-control" id="studentFile" 
                               accept=".xlsx,.xls,.csv" required>
                    </div>
                    <div class="mb-3">
                        <a href="#" class="download-template">
                            <i class="fas fa-download"></i> Download Template
                        </a>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Import',
            width: '600px',
            didOpen: () => {
                // Handle template download
                $('.download-template').on('click', (e) => {
                    e.preventDefault();
                    this.downloadImportTemplate();
                });
            },
            preConfirm: () => {
                const fileInput = document.getElementById('studentFile');
                if (!fileInput.files.length) {
                    Swal.showValidationMessage('Please select a file');
                    return false;
                }
                return this.processStudentFile(fileInput.files[0], spaceId, classId);
            }
        });
    }

    // Add these methods to handle file processing
    async processStudentFile(file, spaceId, classId) {
        try {
            const data = await this.readFile(file);
            const students = this.parseStudentData(data, file.name.toLowerCase().endsWith('.csv'));
            
            // Validate required fields
            const missingFields = students.filter(s => !s.firstName || !s.lastName || !s.studentId);
            if (missingFields.length) {
                throw new Error('Some records are missing required fields');
            }

            // Import students
            students.forEach(student => {
                window.studentService.addStudent(spaceId, classId, student);
            });

            // Refresh the list
            $('.student-list-container').html(this.renderStudentList(spaceId));

            return true;
        } catch (error) {
            Swal.showValidationMessage(`Import failed: ${error.message}`);
            return false;
        }
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('File read failed'));
            reader.readAsBinaryString(file);
        });
    }

    parseStudentData(data, isCsv) {
        if (isCsv) {
            return this.parseCSV(data);
        }
        return this.parseExcel(data);
    }

    parseCSV(data) {
        const lines = data.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        return lines.slice(1).map(line => {
            const values = line.split(',');
            const student = {};
            headers.forEach((header, index) => {
                student[this.normalizeHeader(header)] = values[index]?.trim();
            });
            return student;
        });
    }

    parseExcel(data) {
        // We'll need to add the SheetJS library for Excel support
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        return XLSX.utils.sheet_to_json(sheet, { raw: false });
    }

    normalizeHeader(header) {
        const headerMap = {
            'first name': 'firstName',
            'last name': 'lastName',
            'student id': 'studentId',
            'grade level': 'gradeLevel',
            'date of birth': 'dob',
            'gender': 'gender',
            'guardian name': 'guardianName',
            'contact email': 'contactEmail',
            'contact phone': 'contactPhone',
            'notes': 'notes'
        };
        return headerMap[header.toLowerCase()] || header;
    }

    downloadImportTemplate() {
        const headers = [
            'First Name', 'Last Name', 'Student ID', 'Grade Level',
            'Date of Birth', 'Gender', 'Guardian Name', 
            'Contact Email', 'Contact Phone', 'Notes'
        ];
        
        const csv = [
            headers.join(','),
            'John,Doe,12345,9,2008-01-01,male,Jane Doe,jane@example.com,123-456-7890,Example notes'
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'student_import_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    }

    showAchievementForm(spaceId, classId, studentId, achievement = null) {
        Swal.fire({
            title: achievement ? 'Edit Achievement' : 'Add Achievement',
            html: `
                <form id="achievementForm" class="text-start">
                    <div class="mb-3">
                        <label class="form-label">Title</label>
                        <input type="text" class="form-control" id="achievementTitle" 
                               value="${achievement?.title || ''}" required>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Category</label>
                            <select class="form-select" id="achievementCategory">
                                <option value="">Select Category</option>
                                <option value="Academic" ${achievement?.category === 'Academic' ? 'selected' : ''}>Academic</option>
                                <option value="Sports" ${achievement?.category === 'Sports' ? 'selected' : ''}>Sports</option>
                                <option value="Arts" ${achievement?.category === 'Arts' ? 'selected' : ''}>Arts</option>
                                <option value="Leadership" ${achievement?.category === 'Leadership' ? 'selected' : ''}>Leadership</option>
                                <option value="Service" ${achievement?.category === 'Service' ? 'selected' : ''}>Service</option>
                                <option value="Other" ${achievement?.category === 'Other' ? 'selected' : ''}>Other</option>
                            </select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Date</label>
                            <input type="date" class="form-control" id="achievementDate" 
                                   value="${achievement?.date ? new Date(achievement.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}" required>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" id="achievementDescription" rows="3"
                        >${achievement?.description || ''}</textarea>
                    </div>
                    ${!achievement ? `
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="checkbox" id="setAsStudentOfWeek">
                            <label class="form-check-label" for="setAsStudentOfWeek">
                                Set as Student of the Week
                            </label>
                        </div>
                        <div id="studentOfWeekFields" style="display: none;">
                            <div class="mb-3">
                                <label class="form-label">Week Number</label>
                                <input type="number" class="form-control" id="weekNumber" min="1" max="52">
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Start Date</label>
                                    <input type="date" class="form-control" id="weekStartDate">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">End Date</label>
                                    <input type="date" class="form-control" id="weekEndDate">
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Reason</label>
                                <textarea class="form-control" id="studentOfWeekReason" rows="2"></textarea>
                            </div>
                        </div>
                    ` : ''}
                </form>
            `,
            width: '600px',
            showCancelButton: true,
            confirmButtonText: achievement ? 'Update' : 'Add',
            didOpen: () => {
                // Handle Student of Week checkbox
                $('#setAsStudentOfWeek').on('change', function() {
                    $('#studentOfWeekFields').toggle(this.checked);
                });
            },
            preConfirm: () => {
                const form = document.getElementById('achievementForm');
                if (!form.checkValidity()) {
                    form.reportValidity();
                    return false;
                }

                const achievementData = {
                    title: document.getElementById('achievementTitle').value,
                    category: document.getElementById('achievementCategory').value,
                    date: document.getElementById('achievementDate').value,
                    description: document.getElementById('achievementDescription').value
                };

                // Add Student of Week data if checked
                if (!achievement && document.getElementById('setAsStudentOfWeek')?.checked) {
                    achievementData.studentOfWeek = {
                        weekNumber: document.getElementById('weekNumber').value,
                        startDate: document.getElementById('weekStartDate').value,
                        endDate: document.getElementById('weekEndDate').value,
                        reason: document.getElementById('studentOfWeekReason').value
                    };
                }

                return achievementData;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                if (achievement) {
                    window.studentService.updateAchievement(spaceId, classId, studentId, achievement.id, result.value);
                } else {
                    window.studentService.addAchievement(spaceId, classId, studentId, result.value);
                    
                    // Set Student of Week if checked
                    if (result.value.studentOfWeek) {
                        window.studentService.setStudentOfWeek(spaceId, classId, studentId, result.value.studentOfWeek);
                    }
                }

                // Refresh achievements display
                this.showAchievements(spaceId, classId, studentId);
            }
        });
    }

    removeAchievement(spaceId, classId, studentId, achievementId) {
        const achievement = window.studentService.getAchievement(spaceId, classId, achievementId);
        if (!achievement) return;

        Swal.fire({
            title: 'Remove Achievement',
            text: `Are you sure you want to remove "${achievement.title}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Remove'
        }).then((result) => {
            if (result.isConfirmed) {
                window.studentService.removeAchievement(spaceId, classId, studentId, achievementId);
                this.showAchievements(spaceId, classId, studentId);
            }
        });
    }

    showClassManagement() {
        const classes = window.classService.getAllClasses();
        
        Swal.fire({
            title: 'Class Management',
            html: `
                <div class="class-management">
                    <div class="d-flex justify-content-end mb-3">
                        <button class="btn btn-primary btn-sm" onclick="classHub.showAddClassDialog()">
                            <i class="fas fa-plus"></i> Add Class
                        </button>
                    </div>
                    <div class="class-list">
                        ${classes.length > 0 ? classes.map(classObj => `
                            <div class="class-item">
                                <div class="class-info">
                                    <div class="class-name">${classObj.name}</div>
                                    <div class="class-details">
                                        ${classObj.gradeLevel ? `Grade ${classObj.gradeLevel}` : ''}
                                        ${classObj.academicYear ? `| ${classObj.academicYear}` : ''}
                                        <span class="ms-2 text-muted">
                                            <i class="fas fa-users"></i> 
                                            ${window.studentService.getStudents(classObj.id).length} students
                                        </span>
                                    </div>
                                </div>
                                <div class="class-actions">
                                    <button class="btn btn-outline-primary btn-sm" onclick="classHub.manageStudents('${classObj.id}')">
                                        <i class="fas fa-users"></i> Students
                                    </button>
                                    <button class="btn btn-outline-secondary btn-sm" onclick="classHub.editClass('${classObj.id}')">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="btn btn-outline-danger btn-sm" onclick="classHub.removeClass('${classObj.id}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('') : `
                            <div class="text-center text-muted">
                                <p>No classes created yet.</p>
                            </div>
                        `}
                    </div>
                </div>
            `,
            width: '800px',
            showConfirmButton: false,
            showCloseButton: true
        });
    }

    manageStudents(classId) {
        const classObj = window.classService.getClass(classId);
        if (!classObj) return;

        Swal.fire({
            title: `${classObj.name} - Students`,
            html: `
                <div class="student-management">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div class="class-info">
                            ${classObj.gradeLevel ? `Grade ${classObj.gradeLevel}` : ''}
                            ${classObj.academicYear ? `| ${classObj.academicYear}` : ''}
                        </div>
                        <div>
                            <button class="btn btn-outline-secondary btn-sm me-2" onclick="window.studentService.showImportDialog('${classId}')">
                                <i class="fas fa-file-import"></i> Import Students
                            </button>
                            <button class="btn btn-primary btn-sm" onclick="window.studentService.showAddStudentDialog('${classId}')">
                                <i class="fas fa-plus"></i> Add Student
                            </button>
                        </div>
                    </div>
                    <div class="student-list-container">
                        ${window.studentService.renderStudentList(classId)}
                    </div>
                </div>
            `,
            width: '800px',
            showConfirmButton: false,
            showCloseButton: true,
            didOpen: () => {
                // Setup event handlers for student actions
                $(document).on('click', '.view-student', function() {
                    const studentId = $(this).closest('.student-item').data('student-id');
                    window.dashboardService.showStudentDashboard(classId, studentId);
                });

                $(document).on('click', '.edit-student', function() {
                    const studentId = $(this).closest('.student-item').data('student-id');
                    window.studentService.showEditStudentDialog(classId, studentId);
                });

                $(document).on('click', '.remove-student', function() {
                    const studentId = $(this).closest('.student-item').data('student-id');
                    window.studentService.showRemoveStudentDialog(classId, studentId);
                });
            },
            willClose: () => {
                // Clean up event handlers
                $(document).off('click', '.view-student');
                $(document).off('click', '.edit-student');
                $(document).off('click', '.remove-student');
            }
        });
    }

    showAddClassDialog() {
        Swal.fire({
            title: 'Add New Class',
            html: `
                <div class="mb-3">
                    <label class="form-label">Class Name</label>
                    <input type="text" id="className" class="form-control" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Grade Level</label>
                    <input type="number" id="gradeLevel" class="form-control" min="1" max="12">
                </div>
                <div class="mb-3">
                    <label class="form-label">Academic Year</label>
                    <input type="text" id="academicYear" class="form-control" 
                           placeholder="e.g., 2023-2024" pattern="\\d{4}-\\d{4}">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Create Class',
            preConfirm: () => {
                const name = $('#className').val();
                const gradeLevel = $('#gradeLevel').val();
                const academicYear = $('#academicYear').val();

                if (!name) {
                    Swal.showValidationMessage('Class name is required');
                    return false;
                }

                return {
                    name,
                    gradeLevel: gradeLevel || null,
                    academicYear: academicYear || null
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const classId = window.classService.createClass(result.value);
                const currentSpace = this.spaces.find(s => s.id === this.currentSpaceId);
                if (currentSpace) {
                    currentSpace.classId = classId;
                    this.saveToLocalStorage();
                }
                this.showClassManagement();
            }
        });
    }

    showClassSelection() {
        const classes = window.classService.getAllClasses();
        
        Swal.fire({
            title: 'Select Class',
            html: `
                <div class="class-selection">
                    ${classes.length > 0 ? `
                        <div class="mb-3">
                            <label class="form-label">Choose a Class</label>
                            <select class="form-select" id="classSelect">
                                <option value="">Select...</option>
                                ${classes.map(c => `
                                    <option value="${c.id}">${c.name}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="text-center">
                            <button class="btn btn-link" onclick="classHub.showCreateClass()">
                                Or create a new class
                            </button>
                        </div>
                    ` : `
                        <div class="text-center">
                            <p class="text-muted mb-3">No classes found.</p>
                            <button class="btn btn-primary" onclick="classHub.showCreateClass()">
                                Create Your First Class
                            </button>
                        </div>
                    `}
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Select',
            preConfirm: () => {
                const classId = $('#classSelect').val();
                if (!classId && classes.length > 0) {
                    Swal.showValidationMessage('Please select a class');
                    return false;
                }
                return classId;
            }
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                const currentSpace = this.spaces.find(s => s.id === this.currentSpaceId);
                if (currentSpace) {
                    currentSpace.classId = result.value;
                    this.saveToLocalStorage();
                    this.openSettings(); // Refresh the settings dialog
                }
            }
        });
    }

    showCreateClass() {
        Swal.fire({
            title: 'Create New Class',
            html: `
                <div class="mb-3">
                    <label class="form-label">Class Name</label>
                    <input type="text" id="className" class="form-control" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Grade Level</label>
                    <input type="number" id="gradeLevel" class="form-control" min="1" max="12">
                </div>
                <div class="mb-3">
                    <label class="form-label">Academic Year</label>
                    <input type="text" id="academicYear" class="form-control" 
                           placeholder="e.g., 2023-2024" pattern="\\d{4}-\\d{4}">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Create Class',
            preConfirm: () => {
                const name = $('#className').val();
                const gradeLevel = $('#gradeLevel').val();
                const academicYear = $('#academicYear').val();

                if (!name) {
                    Swal.showValidationMessage('Class name is required');
                    return false;
                }

                return {
                    name,
                    gradeLevel: gradeLevel || null,
                    academicYear: academicYear || null
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const classId = window.classService.createClass(result.value);
                const currentSpace = this.spaces.find(s => s.id === this.currentSpaceId);
                if (currentSpace) {
                    currentSpace.classId = classId;
                    this.saveToLocalStorage();
                }
                this.openSettings(); // Refresh the settings dialog
            }
        });
    }

    editClass(classId) {
        const classObj = window.classService.getClass(classId);
        if (!classObj) return;

        Swal.fire({
            title: 'Edit Class',
            html: `
                <div class="mb-3">
                    <label class="form-label">Class Name</label>
                    <input type="text" id="className" class="form-control" value="${classObj.name}" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Grade Level</label>
                    <input type="number" id="gradeLevel" class="form-control" min="1" max="12" value="${classObj.gradeLevel || ''}">
                </div>
                <div class="mb-3">
                    <label class="form-label">Academic Year</label>
                    <input type="text" id="academicYear" class="form-control" 
                           placeholder="e.g., 2023-2024" value="${classObj.academicYear || ''}" pattern="\\d{4}-\\d{4}">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Save Changes',
            preConfirm: () => {
                const name = $('#className').val();
                if (!name) {
                    Swal.showValidationMessage('Class name is required');
                    return false;
                }
                return {
                    name,
                    gradeLevel: $('#gradeLevel').val() || null,
                    academicYear: $('#academicYear').val() || null
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                window.classService.updateClass(classId, result.value);
                this.showClassManagement();
            }
        });
    }

    removeClass(classId) {
        const classObj = window.classService.getClass(classId);
        if (!classObj) return;

        Swal.fire({
            title: 'Remove Class',
            text: `Are you sure you want to remove "${classObj.name}"? This will also remove all student data.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Yes, remove',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                // Remove class and associated student data
                window.classService.removeClass(classId);
                window.studentService.removeClassStudents(classId);
                
                // Update any spaces that were using this class
                this.spaces.forEach(space => {
                    if (space.classId === classId) {
                        space.classId = null;
                    }
                });
                this.saveToLocalStorage();
                
                this.showClassManagement();
            }
        });
    }

    renderAchievementsOverview() {
        const classes = window.classService.getAllClasses();
        if (!classes.length) {
            return `
                <div class="text-center text-muted">
                    <p>No classes found. Please create a class first.</p>
                    <button class="btn btn-primary btn-sm" onclick="window.classHub.showCreateClass()">
                        Create Class
                    </button>
                </div>
            `;
        }

        return `
            <div class="achievements-dashboard">
                ${classes.map(classObj => {
                    const students = window.studentService.getStudents(classObj.id);
                    return `
                        <div class="class-achievements-section mb-4">
                            <h5 class="class-name mb-3">${classObj.name}</h5>
                            <div class="student-achievements-list">
                                ${students.map(student => {
                                    const achievements = window.achievementService.getStudentAchievements(student.id);
                                    return `
                                        <div class="student-achievement-row">
                                            <div class="student-info">
                                                <img src="${student.avatar}" alt="${student.firstName}" class="student-avatar-sm">
                                                <div class="student-details">
                                                    <div class="student-name">${student.firstName} ${student.lastName || ''}</div>
                                                    <div class="achievement-count text-muted">
                                                        ${achievements.length} achievement${achievements.length !== 1 ? 's' : ''}
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="achievement-actions">
                                                <button class="btn btn-primary btn-sm" 
                                                        onclick="event.preventDefault(); window.achievementService.showAddAchievementDialog('${student.id}', '${classObj.id}')">
                                                    <i class="fas fa-plus"></i> Add Achievement
                                                </button>
                                                <button class="btn btn-outline-secondary btn-sm" 
                                                        onclick="event.preventDefault(); window.studentService.showStudentProfile('${classObj.id}', '${student.id}')">
                                                    <i class="fas fa-trophy"></i> View Achievements
                                                </button>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    loadSpaceClasses() {
        const savedClasses = localStorage.getItem('classHubSpaceClasses');
        if (savedClasses) {
            try {
                this.spaceClasses = JSON.parse(savedClasses);
            } catch (e) {
                console.error('Error loading space classes:', e);
                this.spaceClasses = {};
            }
        }
    }

    saveSpaceClasses() {
        localStorage.setItem('classHubSpaceClasses', JSON.stringify(this.spaceClasses));
    }

    assignClassToSpace(spaceId, classId) {
        this.spaceClasses[spaceId] = classId;
        this.saveSpaceClasses();
    }

    getSpaceClass(spaceId) {
        return this.spaceClasses[spaceId];
    }
}

// Initialize the application
$(document).ready(() => {
    window.classHub = new ClassHub();
}); 