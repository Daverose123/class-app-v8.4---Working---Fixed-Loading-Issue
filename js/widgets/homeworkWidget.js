class HomeworkWidget extends Widget {
    constructor(config) {
        super(config);
        this.type = 'homework';
        this.settings = {
            color: '#2ec4b6',
            textSize: 'medium',
            title: 'Homework',
            assignments: [
                {
                    id: Date.now(),
                    title: 'Example Assignment',
                    description: 'Complete pages 10-12',
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    completed: false
                }
            ],
            ...config.settings
        };
        console.log('HomeworkWidget initialized with settings:', this.settings);
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            position: this.position,
            settings: {
                color: this.settings.color,
                textSize: this.settings.textSize,
                title: this.settings.title,
                assignments: this.settings.assignments
            }
        };
    }

    getIcon() {
        return '<i class="fas fa-book-open"></i>';
    }

    render() {
        console.log('Rendering HomeworkWidget with settings:', this.settings);
        const sortedAssignments = [...this.settings.assignments].sort((a, b) => {
            return new Date(a.dueDate) - new Date(b.dueDate);
        });

        return `
            <div class="homework-content" data-size="${this.settings.textSize}">
                <div class="homework-title" style="color: ${this.settings.color}">
                    ${this.settings.title}
                </div>
                <div class="homework-list">
                    ${sortedAssignments.map(assignment => {
                        const dueDate = new Date(assignment.dueDate);
                        const isOverdue = dueDate < new Date() && !assignment.completed;
                        const formattedDate = dueDate.toLocaleDateString();
                        
                        return `
                            <div class="homework-item ${isOverdue ? 'overdue' : ''} 
                                        ${assignment.completed ? 'completed' : ''}"
                                 data-id="${assignment.id}">
                                <div class="homework-item-header">
                                    <div class="homework-checkbox">
                                        <input type="checkbox" 
                                               class="form-check-input toggle-completion"
                                               ${assignment.completed ? 'checked' : ''}>
                                    </div>
                                    <div class="homework-title-area">
                                        <div class="homework-assignment-title">
                                            ${assignment.title}
                                        </div>
                                        <div class="homework-due-date">
                                            Due: ${formattedDate}
                                            ${isOverdue ? '<span class="overdue-badge">Overdue</span>' : ''}
                                        </div>
                                    </div>
                                    <div class="homework-controls">
                                        <button class="btn btn-sm btn-link edit-homework"
                                                title="Edit Assignment">
                                            <i class="fas fa-pen"></i>
                                        </button>
                                        <button class="btn btn-sm btn-link delete-homework"
                                                title="Delete Assignment">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="homework-description">
                                    ${assignment.description}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    onInitialize($widget) {
        console.log('Initializing HomeworkWidget...');
        this.setupEventListeners($widget);
    }

    setupEventListeners($widget) {
        console.log('Setting up HomeworkWidget event listeners...');
        super.setupEventListeners($widget);

        // Add new homework
        $widget.find('.add-homework-btn').on('click', () => {
            console.log('Add homework button clicked');
            this.addHomework();
        });

        // Toggle completion
        $widget.find('.toggle-completion').on('click', (e) => {
            const id = $(e.target).closest('.homework-item').data('id');
            this.toggleCompletion(id);
        });

        // Edit homework
        $widget.find('.edit-homework').on('click', (e) => {
            const id = $(e.target).closest('.homework-item').data('id');
            this.editHomework(id);
        });

        // Delete homework
        $widget.find('.delete-homework').on('click', (e) => {
            const id = $(e.target).closest('.homework-item').data('id');
            this.deleteHomework(id);
        });
    }

    addHomework() {
        this.showHomeworkDialog();
    }

    editHomework(id) {
        const homework = this.settings.assignments.find(h => h.id === id);
        if (homework) {
            this.showHomeworkDialog(homework);
        }
    }

    showHomeworkDialog(homework = null) {
        const isEdit = !!homework;
        
        Swal.fire({
            title: `${isEdit ? 'Edit' : 'Add'} Assignment`,
            html: `
                <div class="mb-3">
                    <label class="form-label">Title</label>
                    <input type="text" id="homework-title" class="form-control" 
                           value="${homework?.title || ''}" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Description</label>
                    <textarea id="homework-description" class="form-control" 
                            rows="3">${homework?.description || ''}</textarea>
                </div>
                <div class="mb-3">
                    <label class="form-label">Due Date</label>
                    <input type="date" id="homework-due-date" class="form-control" 
                           value="${homework?.dueDate || new Date().toISOString().split('T')[0]}" 
                           required>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: isEdit ? 'Save' : 'Add',
            preConfirm: () => {
                const title = document.getElementById('homework-title').value;
                if (!title) {
                    Swal.showValidationMessage('Please enter a title');
                    return false;
                }
                return {
                    id: homework?.id || Date.now(),
                    title: title,
                    description: document.getElementById('homework-description').value,
                    dueDate: document.getElementById('homework-due-date').value,
                    completed: homework?.completed || false
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                if (isEdit) {
                    const index = this.settings.assignments.findIndex(h => h.id === homework.id);
                    if (index !== -1) {
                        this.settings.assignments[index] = result.value;
                    }
                } else {
                    this.settings.assignments.push(result.value);
                }
                this.updateWidget();
            }
        });
    }

    deleteHomework(id) {
        Swal.fire({
            title: 'Delete Assignment',
            text: 'Are you sure you want to delete this assignment?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            confirmButtonColor: '#dc3545'
        }).then((result) => {
            if (result.isConfirmed) {
                this.settings.assignments = this.settings.assignments.filter(h => h.id !== id);
                this.updateWidget();
            }
        });
    }

    toggleCompletion(id) {
        const homework = this.settings.assignments.find(h => h.id === id);
        if (homework) {
            homework.completed = !homework.completed;
            this.updateWidget();
        }
    }

    updateWidget() {
        console.log('Updating HomeworkWidget...');
        const $widget = $(`#widget-${this.id}`);
        $widget.find('.widget-content').html(this.render());
        this.onInitialize($widget);
        this.save();
    }

    openSettings() {
        Swal.fire({
            title: 'Homework Widget Settings',
            html: `
                <div class="mb-3">
                    <label class="form-label">Widget Title</label>
                    <input type="text" id="widgetTitle" class="form-control" 
                           value="${this.settings.title}">
                </div>
                <div class="mb-3">
                    <label class="form-label">Text Size</label>
                    <select id="textSize" class="form-select">
                        <option value="small" ${this.settings.textSize === 'small' ? 'selected' : ''}>Small</option>
                        <option value="medium" ${this.settings.textSize === 'medium' ? 'selected' : ''}>Medium</option>
                        <option value="large" ${this.settings.textSize === 'large' ? 'selected' : ''}>Large</option>
                        <option value="x-large" ${this.settings.textSize === 'x-large' ? 'selected' : ''}>Extra Large</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">Color</label>
                    <input type="color" class="form-control form-control-color" 
                           id="homeworkColor" value="${this.settings.color}">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Save',
            preConfirm: () => {
                return {
                    title: document.getElementById('widgetTitle').value,
                    textSize: document.getElementById('textSize').value,
                    color: document.getElementById('homeworkColor').value,
                    assignments: this.settings.assignments
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.settings = result.value;
                this.updateWidget();
            }
        });
    }

    renderWidget() {
        const style = `left: ${this.position.left}px; 
                      top: ${this.position.top}px; 
                      width: ${this.position.width}px; 
                      height: ${this.position.height}px;`;

        return `
            <div id="widget-${this.id}" class="widget ${this.type}-widget" style="${style}">
                <div class="widget-header d-flex justify-content-between align-items-center">
                    <span>${this.getIcon()}</span>
                    <div class="widget-controls">
                        <button class="btn btn-sm btn-link add-homework-btn" title="Add Assignment">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="btn btn-sm btn-link widget-settings">
                            <i class="fas fa-cog"></i>
                        </button>
                        <button class="btn btn-sm btn-link widget-remove">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="widget-content">
                    ${this.render()}
                </div>
            </div>
        `;
    }
}

console.log('HomeworkWidget.js loaded');

if (typeof window !== 'undefined') {
    console.log('HomeworkWidget registered:', typeof HomeworkWidget);
    window.HomeworkWidget = HomeworkWidget;
} 