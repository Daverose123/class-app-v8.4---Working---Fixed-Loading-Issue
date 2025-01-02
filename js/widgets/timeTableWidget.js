class TimeTableWidget extends Widget {
    constructor(config) {
        super(config);
        this.type = 'timetable';
        this.settings = {
            color: '#2ec4b6',
            textSize: 'medium',
            title: 'Class Timetable',
            titleColor: '#2ec4b6',
            schedule: {
                monday: [
                    { time: '09:00', name: 'Period 1', subject: 'Math' },
                    { time: '10:00', name: 'Period 2', subject: 'English' }
                ],
                tuesday: [
                    { time: '09:00', name: 'Period 1', subject: 'Science' },
                    { time: '10:00', name: 'Period 2', subject: 'History' }
                ],
                wednesday: [
                    { time: '09:00', name: 'Period 1', subject: 'Math' },
                    { time: '10:00', name: 'Period 2', subject: 'Art' }
                ],
                thursday: [
                    { time: '09:00', name: 'Period 1', subject: 'English' },
                    { time: '10:00', name: 'Period 2', subject: 'Science' }
                ],
                friday: [
                    { time: '09:00', name: 'Period 1', subject: 'History' },
                    { time: '10:00', name: 'Period 2', subject: 'Math' }
                ]
            },
            ...config.settings
        };
    }

    getIcon() {
        return '<i class="fas fa-clock"></i>';
    }

    getCurrentDay() {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = days[new Date().getDay()];
        return today;
    }

    getCurrentPeriod() {
        const today = this.getCurrentDay();
        const periods = this.settings.schedule[today] || [];
        if (!periods.length) return null;

        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        for (let i = 0; i < periods.length; i++) {
            const currentPeriod = periods[i];
            const nextPeriod = periods[i + 1];
            
            if (nextPeriod && currentTime >= currentPeriod.time && currentTime < nextPeriod.time) {
                return {
                    current: currentPeriod,
                    next: nextPeriod
                };
            }
        }
        
        return null;
    }

    render() {
        const today = this.getCurrentDay();
        const schedule = this.getCurrentPeriod();
        const todaySchedule = this.settings.schedule[today] || [];

        return `
            <div class="timetable-content" data-size="${this.settings.textSize}">
                <div class="timetable-title" style="color: ${this.settings.titleColor}">
                    ${this.settings.title} - ${today.charAt(0).toUpperCase() + today.slice(1)}
                </div>
                <div class="current-status">
                    ${schedule ? `
                        <div class="status-scroll">
                            <span>Current: ${schedule.current.name} - ${schedule.current.subject}</span>
                            <span class="separator">|</span>
                            <span>Next: ${schedule.next.name} - ${schedule.next.subject}</span>
                        </div>
                    ` : '<p>No classes scheduled</p>'}
                </div>
                <div class="timetable-display">
                    <div class="full-schedule">
                        ${todaySchedule.map(period => `
                            <div class="period-item">
                                <span class="period-time">${period.time}</span>
                                <span class="period-name">${period.name}</span>
                                <span class="period-subject">${period.subject}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    openEditor() {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        
        Swal.fire({
            title: 'Edit Timetable',
            html: `
                <div class="timetable-editor">
                    <ul class="nav nav-tabs" id="dayTabs" role="tablist">
                        ${days.map((day, index) => `
                            <li class="nav-item" role="presentation">
                                <button class="nav-link ${index === 0 ? 'active' : ''}" 
                                        id="${day}-tab" 
                                        data-bs-toggle="tab" 
                                        data-bs-target="#${day}" 
                                        type="button" 
                                        role="tab">${day.charAt(0).toUpperCase() + day.slice(1)}</button>
                            </li>
                        `).join('')}
                    </ul>
                    <div class="tab-content" id="dayTabsContent">
                        ${days.map((day, index) => `
                            <div class="tab-pane fade ${index === 0 ? 'show active' : ''}" 
                                 id="${day}" 
                                 role="tabpanel">
                                <div class="day-schedule" data-day="${day}">
                                    ${(this.settings.schedule[day] || []).map((period, periodIndex) => `
                                        <div class="period-entry mb-3">
                                            <h6>Period ${periodIndex + 1}</h6>
                                            <div class="input-group mb-2">
                                                <input type="time" class="form-control period-time" 
                                                       value="${period.time}" data-index="${periodIndex}">
                                                <input type="text" class="form-control period-name" 
                                                       placeholder="Period Name" value="${period.name}" data-index="${periodIndex}">
                                                <input type="text" class="form-control period-subject" 
                                                       placeholder="Subject" value="${period.subject}" data-index="${periodIndex}">
                                            </div>
                                        </div>
                                    `).join('')}
                                    <button type="button" class="btn btn-outline-primary add-period" data-day="${day}">
                                        <i class="fas fa-plus"></i> Add Period
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Save',
            width: '800px',
            didOpen: () => {
                // Setup add period buttons
                document.querySelectorAll('.add-period').forEach(button => {
                    button.addEventListener('click', () => {
                        const day = button.dataset.day;
                        const daySchedule = document.querySelector(`.day-schedule[data-day="${day}"]`);
                        const index = daySchedule.querySelectorAll('.period-entry').length;
                        
                        const newPeriod = document.createElement('div');
                        newPeriod.className = 'period-entry mb-3';
                        newPeriod.innerHTML = `
                            <h6>Period ${index + 1}</h6>
                            <div class="input-group mb-2">
                                <input type="time" class="form-control period-time" data-index="${index}">
                                <input type="text" class="form-control period-name" 
                                       placeholder="Period Name" data-index="${index}">
                                <input type="text" class="form-control period-subject" 
                                       placeholder="Subject" data-index="${index}">
                            </div>
                        `;
                        button.before(newPeriod);
                    });
                });
            },
            preConfirm: () => {
                const schedule = {};
                days.forEach(day => {
                    const periods = [];
                    document.querySelectorAll(`.day-schedule[data-day="${day}"] .period-entry`).forEach(entry => {
                        periods.push({
                            time: entry.querySelector('.period-time').value,
                            name: entry.querySelector('.period-name').value,
                            subject: entry.querySelector('.period-subject').value
                        });
                    });
                    schedule[day] = periods;
                });
                return { schedule };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.settings.schedule = result.value.schedule;
                this.updateDisplay();
                this.save();
            }
        });
    }

    openSettings() {
        Swal.fire({
            title: 'Timetable Settings',
            html: `
                <div class="mb-3">
                    <label class="form-label">Title</label>
                    <input type="text" id="widgetTitle" class="form-control" value="${this.settings.title}">
                </div>
                <div class="mb-3">
                    <label class="form-label">Title Color</label>
                    <input type="color" id="titleColor" class="form-control form-control-color" 
                           value="${this.settings.titleColor}">
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
            `,
            showCancelButton: true,
            confirmButtonText: 'Save',
            preConfirm: () => {
                return {
                    title: document.getElementById('widgetTitle').value,
                    titleColor: document.getElementById('titleColor').value,
                    textSize: document.getElementById('textSize').value,
                    schedule: this.settings.schedule
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.settings = { ...this.settings, ...result.value };
                this.updateDisplay();
                this.save();
            }
        });
    }

    updateDisplay() {
        const $widget = $(`#widget-${this.id}`);
        $widget.find('.widget-content').html(this.render());
        this.setupEventListeners($widget);
        this.onInitialize($widget);
        this.save();
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
                titleColor: this.settings.titleColor,
                schedule: this.settings.schedule
            }
        };
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
                        <button class="btn btn-sm btn-link edit-timetable">
                            <i class="fas fa-edit"></i>
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

    onInitialize($widget) {
        $widget.find('.edit-timetable').on('click', () => this.openEditor());
        
        // Update display every minute to keep current period accurate
        setInterval(() => this.updateDisplay(), 60000);
    }
}

console.log('TimeTableWidget.js loaded'); 