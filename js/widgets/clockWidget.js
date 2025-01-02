class ClockWidget extends Widget {
    constructor(config) {
        super(config);
        this.type = 'clock';
        this.title = 'Clock';
        this.settings = {
            showSeconds: true,
            format24: false,
            size: 'medium',
            ...config?.settings
        };
        this.interval = null;
    }

    getIcon() {
        return '<i class="fas fa-clock"></i>';
    }

    render() {
        return `
            <div class="clock-content" data-size="${this.settings.size}">
                <div class="clock-display"></div>
            </div>
        `;
    }

    onInitialize($widget) {
        this.$widget = $widget;
        this.updateClock();
        this.interval = setInterval(() => this.updateClock(), 1000);
    }

    onDestroy() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    updateClock() {
        if (!this.$widget) return;

        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        let period = '';

        if (!this.settings.format24) {
            period = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
        }
        hours = hours.toString().padStart(2, '0');

        let timeString = `${hours}:${minutes}`;
        if (this.settings.showSeconds) {
            timeString += `:${seconds}`;
        }
        if (!this.settings.format24) {
            timeString += ` ${period}`;
        }

        const $display = this.$widget.find('.clock-display');
        if ($display.length && $display.text() !== timeString) {
            $display.text(timeString);
        }
    }

    showSettings() {
        return {
            template: `
                <div class="clock-settings">
                    <div class="form-check mb-3">
                        <input type="checkbox" class="form-check-input" id="showSeconds" 
                               ${this.settings.showSeconds ? 'checked' : ''}>
                        <label class="form-check-label" for="showSeconds">Show Seconds</label>
                    </div>
                    <div class="form-check mb-3">
                        <input type="checkbox" class="form-check-input" id="format24" 
                               ${this.settings.format24 ? 'checked' : ''}>
                        <label class="form-check-label" for="format24">24 Hour Format</label>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Size</label>
                        <select class="form-select" id="size">
                            <option value="small" ${this.settings.size === 'small' ? 'selected' : ''}>Small</option>
                            <option value="medium" ${this.settings.size === 'medium' ? 'selected' : ''}>Medium</option>
                            <option value="large" ${this.settings.size === 'large' ? 'selected' : ''}>Large</option>
                        </select>
                    </div>
                </div>
            `,
            showSeconds: {
                type: 'checkbox',
                label: 'Show Seconds'
            },
            format24: {
                type: 'checkbox',
                label: '24 Hour Format'
            },
            size: {
                type: 'select',
                label: 'Size',
                options: [
                    { value: 'small', label: 'Small' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'large', label: 'Large' }
                ]
            }
        };
    }

    onSettingsChanged() {
        if (this.$widget) {
            this.$widget.find('.clock-content').attr('data-size', this.settings.size);
            this.updateClock();
        }
    }
} 