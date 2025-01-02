class TimerWidget extends Widget {
    constructor(config) {
        super(config);
        this.type = 'timer';
        this.settings = {
            color: '#2ec4b6',
            textSize: 'medium',
            title: 'Timer',
            minutes: 5,
            seconds: 0,
            ...config.settings
        };
        this.remainingTime = null;
        this.interval = null;
        this.isRunning = false;
        console.log('TimerWidget constructed:', this);
    }

    getIcon() {
        return '<i class="fas fa-hourglass-half"></i>';
    }

    render() {
        console.log('Timer render called');
        const minutes = this.remainingTime === null ? 
            this.settings.minutes : 
            Math.floor(this.remainingTime / 60);
        
        const seconds = this.remainingTime === null ? 
            this.settings.seconds : 
            this.remainingTime % 60;

        return `
            <div class="timer-content" data-size="${this.settings.textSize}">
                <div class="timer-title" style="color: ${this.settings.color}">
                    ${this.settings.title}
                </div>
                <div class="timer-display" style="color: ${this.settings.color}">
                    <span class="time-edit" data-type="minutes">${String(minutes).padStart(2, '0')}</span>:<span class="time-edit" data-type="seconds">${String(seconds).padStart(2, '0')}</span>
                </div>
                <div class="timer-controls">
                    <button class="btn btn-primary btn-sm start-timer" 
                            ${this.isRunning ? 'style="display: none;"' : ''}>
                        <i class="fas fa-play"></i> Start
                    </button>
                    <button class="btn btn-danger btn-sm stop-timer" 
                            ${!this.isRunning ? 'style="display: none;"' : ''}>
                        <i class="fas fa-stop"></i> Stop
                    </button>
                    <button class="btn btn-secondary btn-sm reset-timer">
                        <i class="fas fa-redo"></i> Reset
                    </button>
                </div>
            </div>
        `;
    }

    onInitialize($widget) {
        console.log('Timer onInitialize called');
        this.setupTimerControls($widget);
    }

    setupTimerControls($widget) {
        console.log('Setting up timer controls');
        $widget.find('.start-timer').on('click', () => this.startTimer());
        $widget.find('.stop-timer').on('click', () => this.stopTimer());
        $widget.find('.reset-timer').on('click', () => this.resetTimer());

        // Add click handlers for time editing
        $widget.find('.time-edit').on('click', (e) => {
            if (this.isRunning) return; // Don't allow editing while timer is running
            
            const $timeElement = $(e.currentTarget);
            const type = $timeElement.data('type');
            const currentValue = type === 'minutes' ? this.settings.minutes : this.settings.seconds;

            Swal.fire({
                title: `Edit ${type}`,
                input: 'number',
                inputValue: currentValue,
                inputAttributes: {
                    min: 0,
                    max: type === 'minutes' ? 99 : 59,
                    step: 1
                },
                showCancelButton: true,
                confirmButtonText: 'Set',
                inputValidator: (value) => {
                    const numValue = parseInt(value);
                    if (isNaN(numValue) || numValue < 0) {
                        return 'Please enter a valid number';
                    }
                    if (type === 'seconds' && numValue > 59) {
                        return 'Seconds must be less than 60';
                    }
                    if (type === 'minutes' && numValue > 99) {
                        return 'Minutes must be less than 100';
                    }
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const newValue = parseInt(result.value);
                    if (type === 'minutes') {
                        this.settings.minutes = newValue;
                    } else {
                        this.settings.seconds = newValue;
                    }
                    this.remainingTime = null;
                    this.updateDisplay();
                    this.save();
                }
            });
        });
    }

    startTimer() {
        if (this.isRunning) return;

        this.isRunning = true;
        if (this.remainingTime === null) {
            this.remainingTime = this.settings.minutes * 60 + this.settings.seconds;
        }

        this.interval = setInterval(() => {
            if (this.remainingTime > 0) {
                this.remainingTime--;
                this.updateDisplay();
            } else {
                this.stopTimer();
                // Could add notification here
            }
        }, 1000);

        this.updateDisplay();
    }

    stopTimer() {
        if (!this.isRunning) return;

        this.isRunning = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.updateDisplay();
    }

    resetTimer() {
        this.stopTimer();
        this.remainingTime = null;
        this.updateDisplay();
    }

    updateDisplay() {
        const $widget = $(`#widget-${this.id}`);
        $widget.find('.widget-content').html(this.render());
        this.setupTimerControls($widget);
    }

    openSettings() {
        Swal.fire({
            title: 'Timer Settings',
            html: `
                <div class="mb-3">
                    <label class="form-label">Widget Title</label>
                    <input type="text" id="widgetTitle" class="form-control" 
                           value="${this.settings.title}">
                </div>
                <div class="mb-3">
                    <label class="form-label">Minutes</label>
                    <input type="number" id="timerMinutes" class="form-control" 
                           value="${this.settings.minutes}" min="0" max="59">
                </div>
                <div class="mb-3">
                    <label class="form-label">Seconds</label>
                    <input type="number" id="timerSeconds" class="form-control" 
                           value="${this.settings.seconds}" min="0" max="59">
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
                           id="timerColor" value="${this.settings.color}">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Save',
            preConfirm: () => {
                return {
                    title: document.getElementById('widgetTitle').value,
                    minutes: parseInt(document.getElementById('timerMinutes').value) || 0,
                    seconds: parseInt(document.getElementById('timerSeconds').value) || 0,
                    textSize: document.getElementById('textSize').value,
                    color: document.getElementById('timerColor').value
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.settings = result.value;
                this.resetTimer();
                this.updateDisplay();
                this.save();
            }
        });
    }

    onDestroy() {
        if (this.interval) {
            clearInterval(this.interval);
        }
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
                minutes: this.settings.minutes,
                seconds: this.settings.seconds
            }
        };
    }
}

console.log('TimerWidget.js loaded');

// Make sure TimerWidget is available globally
if (typeof window !== 'undefined') {
    window.TimerWidget = TimerWidget;
    console.log('TimerWidget registered globally');
} 