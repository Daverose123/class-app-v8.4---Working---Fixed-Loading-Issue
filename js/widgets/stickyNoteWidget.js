class StickyNoteWidget extends Widget {
    constructor(config) {
        super(config);
        this.type = 'stickynote';
        this.settings = {
            color: '#ffeb3b',
            textSize: '14',
            title: 'Note',
            titleColor: '#2ec4b6',
            content: '<p>Click edit to add a note...</p>',
            ...config.settings
        };
    }

    getIcon() {
        return '<i class="fas fa-sticky-note"></i>';
    }

    render() {
        return `
            <div class="stickynote-content">
                <div class="stickynote-title" style="color: ${this.settings.titleColor}">
                    ${this.settings.title}
                </div>
                <div class="stickynote-display" style="background-color: ${this.settings.color}">
                    ${this.settings.content || '<em>Click edit to add a note...</em>'}
                </div>
            </div>
        `;
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
                        <button class="btn btn-sm btn-link edit-stickynote">
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
        $widget.find('.edit-stickynote').on('click', () => this.openEditor());
    }

    openEditor() {
        Swal.fire({
            title: 'Edit Note',
            html: `
                <div class="rich-text-toolbar-container">
                    <div class="rich-text-toolbar">
                        <div class="toolbar-group">
                            <button class="btn btn-sm btn-link format-bold" title="Bold">
                                <i class="fas fa-bold"></i>
                            </button>
                            <button class="btn btn-sm btn-link format-italic" title="Italic">
                                <i class="fas fa-italic"></i>
                            </button>
                            <button class="btn btn-sm btn-link format-underline" title="Underline">
                                <i class="fas fa-underline"></i>
                            </button>
                        </div>
                        <div class="toolbar-group">
                            <button class="btn btn-sm btn-link format-align-left" title="Align Left">
                                <i class="fas fa-align-left"></i>
                            </button>
                            <button class="btn btn-sm btn-link format-align-center" title="Align Center">
                                <i class="fas fa-align-center"></i>
                            </button>
                            <button class="btn btn-sm btn-link format-align-right" title="Align Right">
                                <i class="fas fa-align-right"></i>
                            </button>
                        </div>
                        <div class="toolbar-group">
                            <button class="btn btn-sm btn-link format-list-ul" title="Bullet List">
                                <i class="fas fa-list-ul"></i>
                            </button>
                            <button class="btn btn-sm btn-link format-list-ol" title="Numbered List">
                                <i class="fas fa-list-ol"></i>
                            </button>
                            <button class="btn btn-sm btn-link format-indent" title="Indent">
                                <i class="fas fa-indent"></i>
                            </button>
                            <button class="btn btn-sm btn-link format-outdent" title="Outdent">
                                <i class="fas fa-outdent"></i>
                            </button>
                        </div>
                    </div>
                    <div class="rich-text-toolbar">
                        <div class="toolbar-group">
                            <input type="color" class="text-color-picker" title="Text Color" value="#000000">
                            <input type="color" class="highlight-color-picker" title="Highlight Color" value="#ffffff">
                        </div>
                        <div class="toolbar-group">
                            <button class="btn btn-sm btn-link add-emoji" title="Add Emoji">
                                <i class="fas fa-smile"></i>
                            </button>
                            <button class="btn btn-sm btn-link clear-format" title="Clear Formatting">
                                <i class="fas fa-remove-format"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="stickynote-editor" contenteditable="true">${this.settings.content}</div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Save',
            customClass: {
                popup: 'wide-popup',
                htmlContainer: 'editor-container'
            },
            didOpen: () => {
                this.setupEditor($(document));
            },
            preConfirm: () => {
                return {
                    content: document.querySelector('.stickynote-editor').innerHTML
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.settings.content = result.value.content;
                this.updateDisplay();
                this.save();
            }
        });
    }

    setupEditor($container) {
        // Text formatting
        $container.find('.format-bold').on('click', () => {
            const editor = document.querySelector('.stickynote-editor');
            editor.focus();
            document.execCommand('bold', false);
            this.saveContent();
        });

        $container.find('.format-italic').on('click', () => {
            const editor = document.querySelector('.stickynote-editor');
            editor.focus();
            document.execCommand('italic', false);
            this.saveContent();
        });

        $container.find('.format-underline').on('click', () => {
            const editor = document.querySelector('.stickynote-editor');
            editor.focus();
            document.execCommand('underline', false);
            this.saveContent();
        });

        // Alignment
        $container.find('.format-align-left').on('click', () => this.execCommand('justifyLeft'));
        $container.find('.format-align-center').on('click', () => this.execCommand('justifyCenter'));
        $container.find('.format-align-right').on('click', () => this.execCommand('justifyRight'));

        // Lists and indentation
        $container.find('.format-list-ul').on('click', () => {
            const editor = document.querySelector('.stickynote-editor');
            editor.focus();
            document.execCommand('insertUnorderedList', false);
            this.saveContent();
        });

        $container.find('.format-list-ol').on('click', () => {
            const editor = document.querySelector('.stickynote-editor');
            editor.focus();
            document.execCommand('insertOrderedList', false);
            this.saveContent();
        });

        $container.find('.format-indent').on('click', () => this.execCommand('indent'));
        $container.find('.format-outdent').on('click', () => this.execCommand('outdent'));

        // Colors
        $container.find('.text-color-picker').on('input', (e) => {
            this.execCommand('foreColor', e.target.value);
        });

        $container.find('.highlight-color-picker').on('input', (e) => {
            this.execCommand('hiliteColor', e.target.value);
        });

        // Clear formatting
        $container.find('.clear-format').on('click', () => {
            this.execCommand('removeFormat');
        });

        // Emoji picker
        $container.find('.add-emoji').on('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            window.emojiPicker.showPicker(e.currentTarget, selection => {
                const editor = document.querySelector('.stickynote-editor');
                if (editor) {
                    const range = window.getSelection().getRangeAt(0);
                    const node = document.createTextNode(selection.unicode);
                    range.insertNode(node);
                    range.collapse(false);
                    editor.focus();
                }
            });
        });

        // Handle paste to strip formatting
        $container.find('.stickynote-editor').on('paste', (e) => {
            e.preventDefault();
            const text = (e.originalEvent.clipboardData || window.clipboardData).getData('text');
            this.execCommand('insertText', text);
        });

        // Update button states on selection
        document.addEventListener('selectionchange', () => {
            this.updateToolbarState($container);
        });

        // Initial focus
        $container.find('.stickynote-editor').focus();

        // Make sure editor has focus when clicking any toolbar button
        $container.find('.rich-text-toolbar button').on('mousedown', (e) => {
            e.preventDefault();
            const editor = document.querySelector('.stickynote-editor');
            editor.focus();
        });
    }

    execCommand(command, value = null) {
        document.execCommand(command, false, value);
        this.saveContent();
    }

    updateToolbarState($container) {
        // Text formatting
        ['bold', 'italic', 'underline'].forEach(command => {
            const state = document.queryCommandState(command);
            $container.find(`.format-${command}`).toggleClass('active', state);
        });

        // Alignment
        ['justifyLeft', 'justifyCenter', 'justifyRight'].forEach(command => {
            const state = document.queryCommandState(command);
            $container.find(`.format-align-${command.toLowerCase().replace('justify', '')}`).toggleClass('active', state);
        });

        // Lists
        ['insertUnorderedList', 'insertOrderedList'].forEach(command => {
            const state = document.queryCommandState(command);
            $container.find(`.format-list-${command.includes('Unordered') ? 'ul' : 'ol'}`).toggleClass('active', state);
        });
    }

    openSettings() {
        Swal.fire({
            title: 'Note Settings',
            html: `
                <div class="mb-3">
                    <label class="form-label">Title</label>
                    <input type="text" id="noteTitle" class="form-control" value="${this.settings.title}">
                </div>
                <div class="mb-3">
                    <label class="form-label">Title Color</label>
                    <input type="color" id="titleColor" class="form-control form-control-color" value="${this.settings.titleColor}">
                </div>
                <div class="mb-3">
                    <label class="form-label">Background Color</label>
                    <input type="color" id="noteColor" class="form-control form-control-color" value="${this.settings.color}">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Save',
            preConfirm: () => {
                return {
                    title: document.getElementById('noteTitle').value,
                    titleColor: document.getElementById('titleColor').value,
                    color: document.getElementById('noteColor').value
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
                content: this.settings.content
            }
        };
    }

    saveContent() {
        const editor = document.querySelector('.stickynote-editor');
        if (editor) {
            this.settings.content = editor.innerHTML;
            this.save();
        }
    }
}

// Make sure StickyNoteWidget is available globally
if (typeof window !== 'undefined') {
    window.StickyNoteWidget = StickyNoteWidget;
}

console.log('StickyNoteWidget loaded'); 