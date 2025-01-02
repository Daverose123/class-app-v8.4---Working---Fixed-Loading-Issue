class Widget {
    constructor(config) {
        this.id = config.id || Date.now();
        this.type = 'base';
        this.title = '';
        this.position = config.position || { left: 0, top: 0, width: 200, height: 150 };
        this.settings = config.settings || {};
        this.eventListeners = []; // Track event listeners for cleanup
        this.intervals = [];
        this.timeouts = [];
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            position: this.position,
            settings: this.settings
        };
    }

    // This should be implemented by child classes to render their specific content
    render() {
        throw new Error('render() must be implemented');
    }

    // Main widget wrapper with controls
    renderWidget() {
        const style = `left: ${this.position.left}px; 
                      top: ${this.position.top}px; 
                      width: ${this.position.width}px; 
                      height: ${this.position.height}px;`;

        return `
            <div id="widget-${this.id}" class="widget ${this.type}-widget" style="${style}">
                <div class="widget-header d-flex justify-content-between align-items-center">
                    <span>${this.getIcon()}${this.title ? ' ' + this.title : ''}</span>
                    <div class="widget-controls">
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

    // Initialize widget after rendering
    initialize($widget) {
        this.setupEventListeners($widget);
        this.onInitialize($widget);  // Hook for child classes
    }

    // Standard event listeners
    setupEventListeners($widget) {
        $widget.find('.widget-settings').on('click', () => this.openSettings());
        $widget.find('.widget-remove').on('click', () => this.remove());
    }

    // Save widget state
    save() {
        console.log('Saving widget state:', this);
        const space = this.getCurrentSpace();
        if (space) {
            window.classHub.saveSpace(space);
            window.classHub.saveToLocalStorage();
        }
    }

    // Update widget position
    updatePosition(position) {
        this.position = position;
        this.save();
    }

    // Remove widget
    remove() {
        Swal.fire({
            title: 'Remove Widget',
            text: 'Are you sure you want to remove this widget?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, remove it'
        }).then((result) => {
            if (result.isConfirmed) {
                const space = this.getCurrentSpace();
                if (space) {
                    space.widgets = space.widgets.filter(w => w.id !== this.id);
                    window.classHub.saveAndRenderSpace(space);
                }
                this.onDestroy();  // Cleanup hook for child classes
            }
        });
    }

    // Get current space
    getCurrentSpace() {
        const $widget = $(`#widget-${this.id}`);
        const $space = $widget.closest('.learning-space');
        const spaceId = parseInt($space.data('space-id'));
        return window.classHub.spaces.find(s => s.id === spaceId);
    }

    // Methods that can be overridden by child classes
    getIcon() {
        return '<i class="fas fa-puzzle-piece"></i>';
    }

    openSettings() {
        // Override in child class
    }

    onInitialize($widget) {
        // Override in child class if needed
    }

    onDestroy() {
        // Clean up all registered event listeners
        this.eventListeners.forEach(({ $element, eventType, handler }) => {
            $element.off(eventType, handler);
        });
        this.eventListeners = [];

        // Clear any intervals or timeouts
        if (this.intervals) {
            this.intervals.forEach(clearInterval);
        }
        if (this.timeouts) {
            this.timeouts.forEach(clearTimeout);
        }

        // Additional cleanup specific to child classes
        this.cleanup();
    }

    // Add error boundary wrapper
    safeRender() {
        try {
            return this.render();
        } catch (error) {
            console.error(`Error rendering widget ${this.id}:`, error);
            return this.renderErrorState(error);
        }
    }

    renderErrorState(error) {
        return `
            <div class="widget-error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Widget Error</p>
                <small>${error.message}</small>
            </div>
        `;
    }

    // Improved event listener tracking
    addEventListeners($element, eventType, handler) {
        $element.on(eventType, handler);
        this.eventListeners.push({
            $element,
            eventType,
            handler
        });
    }

    // Hook for child classes to implement specific cleanup
    cleanup() {
        // Override in child classes
    }

    // Improved error handling for settings
    validateSettings(settings) {
        // Basic validation - override in child classes for specific validation
        if (!settings || typeof settings !== 'object') {
            throw new Error('Invalid settings object');
        }
        return true;
    }

    updateSettings(newSettings) {
        try {
            if (this.validateSettings(newSettings)) {
                this.settings = {
                    ...this.settings,
                    ...newSettings
                };
                this.save();
                return true;
            }
        } catch (error) {
            console.error(`Error updating settings for widget ${this.id}:`, error);
            return false;
        }
    }
} 