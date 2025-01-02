class LearningSpace {
    constructor(id, name, centralIdea) {
        this.id = id;
        this.name = name;
        this.centralIdea = centralIdea;
        this.widgets = [];
    }

    // Initialize the learning space
    init($container) {
        this.$container = $container;
        this.render();
        this.setupWidgetControls();
    }

    render() {
        this.$container.empty();
        this.$container.append(`
            <div class="learning-space" data-space-id="${this.id}">
                <div class="space-header d-flex justify-content-between align-items-center mb-3">
                    <div class="space-title">
                        <h2>${this.name}</h2>
                        ${this.centralIdea ? `
                            <div class="central-idea">
                                <span class="central-idea-label">Central Idea:</span>
                                <span class="central-idea-text">${this.centralIdea}</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="space-controls">
                        <button class="btn btn-primary add-widget-btn">
                            <i class="fas fa-plus"></i> Add Widget
                        </button>
                    </div>
                </div>
                <div class="widgets-container position-relative" style="height: calc(100vh - 150px);">
                    ${this.renderWidgets()}
                </div>
            </div>
        `);
    }

    renderWidgets() {
        return this.widgets.map(widget => widget.renderWidget()).join('');
    }

    setupWidgetControls() {
        // Add widget button handler
        this.$container.find('.add-widget-btn').on('click', () => this.showAddWidgetDialog());

        // Make widgets draggable and resizable with save triggers
        this.$container.find('.widget').each((_, element) => {
            $(element).draggable({
                handle: '.widget-header',
                containment: 'parent',
                start: () => {
                    // Bring widget to front when dragging
                    $(element).css('z-index', this.getTopZIndex() + 1);
                },
                stop: () => {
                    this.saveWidgetPositions();
                    this.saveLayout();
                }
            }).resizable({
                containment: 'parent',
                minHeight: 100,
                minWidth: 150,
                stop: () => {
                    this.saveWidgetPositions();
                    this.saveLayout();
                }
            });
        });

        // Initialize widgets after setting up controls
        this.initializeWidgets();
    }

    showAddWidgetDialog() {
        // Check if HomeworkWidget class exists
        console.log('HomeworkWidget exists:', typeof HomeworkWidget !== 'undefined');
        
        const widgets = [
            {
                type: 'clock',
                icon: 'fa-clock',
                title: 'Clock Widget',
                description: 'Display time in different formats and timezones'
            },
            {
                type: 'weather',
                icon: 'fa-cloud-sun',
                title: 'Weather Widget',
                description: 'Show weather information for any location'
            },
            {
                type: 'materials',
                icon: 'fa-list-check',
                title: 'Materials List',
                description: 'Display required materials for the lesson'
            },
            {
                type: 'announcement',
                icon: 'fa-bullhorn',
                title: 'Announcements',
                description: 'Display scrolling announcements with rich text and emojis'
            },
            {
                type: 'homework',
                icon: 'fa-book-open',
                title: 'Homework',
                description: 'Manage and track homework assignments'
            },
            {
                type: 'objective',
                icon: 'fa-bullseye',
                title: 'Lesson Objective',
                description: 'Display and edit lesson objectives with rich text formatting'
            },
            {
                type: 'bellringer',
                icon: 'fa-bell',
                title: 'Bell Ringer',
                description: 'Display and edit warm-up activities with rich text formatting'
            },
            {
                type: 'timer',
                icon: 'fa-hourglass-half',
                title: 'Timer',
                description: 'Countdown timer for activities'
            },
            {
                type: 'stickynote',
                icon: 'fa-sticky-note',
                title: 'Sticky Note',
                description: 'Create rich text notes with emoji support'
            },
            {
                type: 'timetable',
                icon: 'fa-clock',
                title: 'Class Timetable',
                description: 'Display daily class schedule with current and upcoming periods'
            }
        ];

        console.log('Widgets array:', widgets);

        Swal.fire({
            title: 'Add Widget',
            html: `
                <div class="widget-grid">
                    ${widgets.map(widget => {
                        console.log('Processing widget:', widget.type);
                        return `
                            <div class="widget-option" data-widget-type="${widget.type}">
                                <div class="widget-option-icon">
                                    <i class="fas ${widget.icon}"></i>
                                </div>
                                <div class="widget-option-content">
                                    <h4>${widget.title}</h4>
                                    <p>${widget.description}</p>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `,
            showCancelButton: true,
            showConfirmButton: false,
            width: '600px',
            customClass: {
                popup: 'widget-selector',
                htmlContainer: 'widget-selector-container'
            },
            didOpen: () => {
                console.log('Dialog opened, widget options:', $('.widget-option').length);
                $('.widget-option').on('click', (e) => {
                    const widgetType = $(e.currentTarget).data('widget-type');
                    console.log('Widget clicked:', widgetType);
                    this.addWidget(widgetType);
                    Swal.close();
                });
            }
        });
    }

    addWidget(widgetType) {
        console.log('Adding widget:', widgetType); // Debug log
        const space = window.classHub.spaces.find(s => s.id === this.id);
        if (space) {
            window.classHub.createWidget(widgetType, space);
        }
    }

    getDefaultWidgetPosition() {
        // Calculate a position that doesn't overlap with existing widgets
        const offset = this.widgets.length * 30;
        return {
            left: offset,
            top: offset,
            width: 200,
            height: 150
        };
    }

    saveWidgetPositions() {
        this.widgets.forEach(widget => {
            const $widgetElement = this.$container.find(`#widget-${widget.id}`);
            const position = $widgetElement.position();
            widget.position = {
                left: position.left,
                top: position.top,
                width: $widgetElement.width(),
                height: $widgetElement.height()
            };
        });
        this.saveLayout();
        window.classHub.saveToLocalStorage();
    }

    saveLayout() {
        const space = window.classHub.spaces.find(s => s.id === this.id);
        if (space) {
            space.widgets = this.widgets.map(widget => ({
                id: widget.id,
                type: widget.type,
                position: { ...widget.position },
                settings: JSON.parse(JSON.stringify(widget.settings))
            }));
            window.classHub.saveToLocalStorage();
        }
    }

    getTopZIndex() {
        let maxZ = 0;
        this.$container.find('.widget').each((_, element) => {
            const z = parseInt($(element).css('z-index')) || 0;
            maxZ = Math.max(maxZ, z);
        });
        return maxZ;
    }

    removeWidget(widgetId) {
        this.widgets = this.widgets.filter(w => w.id !== widgetId);
        this.render();
        this.setupWidgetControls();
        window.classHub.saveToLocalStorage();
    }

    initializeWidgets() {
        this.widgets.forEach(widget => {
            const $widget = this.$container.find(`#widget-${widget.id}`);
            if ($widget.length) {
                widget.initialize($widget);
            }
        });
    }
} 