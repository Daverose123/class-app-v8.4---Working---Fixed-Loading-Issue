class EmojiPickerService {
    constructor() {
        this.picker = null;
        this.currentCallback = null;
        this.init();
    }

    init() {
        const picker = document.createElement('emoji-picker');
        picker.style.position = 'fixed';
        picker.style.zIndex = '10000';
        picker.style.display = 'none';
        document.body.appendChild(picker);
        this.picker = picker;

        // Handle emoji selection
        this.picker.addEventListener('emoji-click', event => {
            if (this.currentCallback) {
                this.currentCallback(event.detail);
            }
            this.hidePicker();
        });

        // Handle clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('emoji-picker') && 
                !e.target.closest('.add-emoji')) {
                this.hidePicker();
            }
        });
    }

    showPicker(button, callback) {
        const rect = button.getBoundingClientRect();
        this.picker.style.left = rect.left + 'px';
        this.picker.style.top = (rect.bottom + 5) + 'px';
        this.picker.style.display = 'block';
        this.currentCallback = callback;
    }

    hidePicker() {
        if (this.picker) {
            this.picker.style.display = 'none';
            this.currentCallback = null;
        }
    }
}

// Initialize the service
window.emojiPicker = new EmojiPickerService();