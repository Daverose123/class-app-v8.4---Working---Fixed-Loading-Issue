class AnnouncementWidget extends Widget {
    constructor(config) {
        super(config);
        this.type = 'announcement';
        this.settings = {
            color: '#2ec4b6',
            textSize: 'medium',
            title: 'Announcements',
            scrollSpeed: 5000, // Time in ms between announcements
            announcements: [
                // Default announcement as example
                {
                    id: 1,
                    content: '👋 Welcome to Class! 📚',
                    enabled: true
                }
            ],
            ...config.settings
        };
        this.currentIndex = 0;
        this.scrollInterval = null;
    }

    getIcon() {
        return '<i class="fas fa-bullhorn"></i>';
    }

    render() {
        return `
            <div class="announcement-content" data-size="${this.settings.textSize}">
                <div class="announcement-title" style="color: ${this.settings.color}">
                    ${this.settings.title}
                </div>
                <div class="announcement-display">
                    <button class="btn btn-link prev-announcement">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="announcement-text"></div>
                    <button class="btn btn-link next-announcement">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                <div class="announcement-indicators">
                    ${this.settings.announcements.map((_, index) => `
                        <span class="indicator" data-index="${index}"></span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    onInitialize($widget) {
        this.setupAnnouncementControls($widget);
        this.startAutoScroll();
        this.showAnnouncement(0);
    }

    setupAnnouncementControls($widget) {
        const $prev = $widget.find('.prev-announcement');
        const $next = $widget.find('.next-announcement');
        const $indicators = $widget.find('.indicator');

        $prev.on('click', () => this.previousAnnouncement());
        $next.on('click', () => this.nextAnnouncement());
        $indicators.on('click', (e) => {
            const index = $(e.currentTarget).data('index');
            this.showAnnouncement(index);
        });
    }

    showAnnouncement(index) {
        const $widget = $(`#widget-${this.id}`);
        const announcements = this.settings.announcements.filter(a => a.enabled);
        
        if (announcements.length === 0) {
            $widget.find('.announcement-text').html('<em>No announcements</em>');
            return;
        }

        this.currentIndex = index % announcements.length;
        const announcement = announcements[this.currentIndex];

        $widget.find('.announcement-text')
            .html(announcement.content)
            .hide()
            .fadeIn(300);

        $widget.find('.indicator').removeClass('active')
            .eq(this.currentIndex).addClass('active');
    }

    nextAnnouncement() {
        this.showAnnouncement(this.currentIndex + 1);
    }

    previousAnnouncement() {
        this.showAnnouncement(this.currentIndex - 1);
    }

    startAutoScroll() {
        if (this.scrollInterval) {
            clearInterval(this.scrollInterval);
        }

        this.scrollInterval = setInterval(() => {
            this.nextAnnouncement();
        }, this.settings.scrollSpeed);
    }

    openSettings() {
        const announcementTabs = this.settings.announcements.map((announcement, index) => `
            <li class="nav-item" role="presentation">
                <button class="nav-link ${index === 0 ? 'active' : ''}" 
                        id="announcement-tab-${index}" 
                        data-bs-toggle="tab" 
                        data-bs-target="#announcement-content-${index}">
                    #${index + 1}
                </button>
            </li>
        `).join('');

        const announcementContents = this.settings.announcements.map((announcement, index) => `
            <div class="tab-pane fade ${index === 0 ? 'show active' : ''}" 
                 id="announcement-content-${index}">
                <div class="announcement-entry">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="mb-0">Announcement ${index + 1}</h6>
                        <div>
                            <button type="button" class="btn btn-sm btn-danger remove-announcement" data-index="${index}">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    <div class="mb-2">
                        <div class="rich-text-toolbar btn-group">
                            <button type="button" class="btn btn-sm btn-outline-secondary" data-command="bold">
                                <i class="fas fa-bold"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-secondary" data-command="italic">
                                <i class="fas fa-italic"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-secondary emoji-picker">
                                <i class="fas fa-smile"></i>
                            </button>
                        </div>
                    </div>
                    <div class="form-control announcement-editor" 
                         contenteditable="true" 
                         data-index="${index}">${announcement.content}</div>
                    <div class="form-check mt-2">
                        <input type="checkbox" class="form-check-input" 
                               id="enabled-${index}" ${announcement.enabled ? 'checked' : ''}>
                        <label class="form-check-label" for="enabled-${index}">Enabled</label>
                    </div>
                </div>
            </div>
        `).join('');

        Swal.fire({
            title: 'Announcements Settings',
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
                    <label class="form-label">Scroll Speed (seconds)</label>
                    <input type="number" id="scrollSpeed" class="form-control" 
                           value="${this.settings.scrollSpeed / 1000}" min="1" max="60">
                </div>
                <div class="mb-3">
                    <label class="form-label">Color</label>
                    <input type="color" class="form-control form-control-color" 
                           id="announcementColor" value="${this.settings.color}">
                </div>
                <div class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <label class="form-label mb-0">Announcements</label>
                        <button class="btn btn-sm btn-primary" id="addAnnouncement">
                            <i class="fas fa-plus"></i> Add
                        </button>
                    </div>
                    <div class="announcement-tabs">
                        <ul class="nav nav-tabs" role="tablist">
                            ${announcementTabs}
                        </ul>
                        <div class="tab-content p-3 border border-top-0 rounded-bottom">
                            ${announcementContents}
                        </div>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Save',
            width: '600px',
            didOpen: () => {
                this.setupRichTextEditors();
                this.setupAnnouncementSettingsHandlers();
            },
            preConfirm: () => {
                const announcements = [];
                $('.announcement-editor').each(function(index) {
                    announcements.push({
                        id: Date.now() + index,
                        content: $(this).html(),
                        enabled: $(`#enabled-${index}`).is(':checked')
                    });
                });

                return {
                    title: document.getElementById('widgetTitle').value,
                    textSize: document.getElementById('textSize').value,
                    color: document.getElementById('announcementColor').value,
                    scrollSpeed: document.getElementById('scrollSpeed').value * 1000,
                    announcements
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.settings = result.value;
                const $widget = $(`#widget-${this.id}`);
                $widget.find('.widget-content').html(this.render());
                this.onInitialize($widget);
                this.save();
            }
        });
    }

    setupRichTextEditors() {
        $('.rich-text-toolbar button').on('click', function() {
            const command = $(this).data('command');
            if (command) {
                document.execCommand(command, false, null);
            }
        });

        // Use shared emoji picker service
        $('.emoji-picker').on('click', function(e) {
            e.stopPropagation();
            const $editor = $(this).closest('.announcement-entry').find('.announcement-editor');
            
            window.emojiPicker.showPicker(this, selection => {
                $editor.focus();
                const textSelection = window.getSelection();
                const range = textSelection.getRangeAt(0);
                const node = document.createTextNode(selection.emoji);
                range.insertNode(node);
                range.collapse(false);
            });
        });
    }

    setupAnnouncementSettingsHandlers() {
        $('#addAnnouncement').on('click', () => {
            const newIndex = $('.announcement-editor').length;
            
            // Add new tab
            const newTab = `
                <li class="nav-item" role="presentation">
                    <button class="nav-link" 
                            id="announcement-tab-${newIndex}" 
                            data-bs-toggle="tab" 
                            data-bs-target="#announcement-content-${newIndex}">
                        #${newIndex + 1}
                    </button>
                </li>
            `;
            $('.nav-tabs').append(newTab);

            // Add new content
            const newContent = `
                <div class="tab-pane fade" id="announcement-content-${newIndex}">
                    <div class="announcement-entry">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="mb-0">Announcement ${newIndex + 1}</h6>
                            <div>
                                <button type="button" class="btn btn-sm btn-danger remove-announcement" data-index="${newIndex}">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <div class="mb-2">
                            <div class="rich-text-toolbar btn-group">
                                <button type="button" class="btn btn-sm btn-outline-secondary" data-command="bold">
                                    <i class="fas fa-bold"></i>
                                </button>
                                <button type="button" class="btn btn-sm btn-outline-secondary" data-command="italic">
                                    <i class="fas fa-italic"></i>
                                </button>
                                <button type="button" class="btn btn-sm btn-outline-secondary emoji-picker">
                                    <i class="fas fa-smile"></i>
                                </button>
                            </div>
                        </div>
                        <div class="form-control announcement-editor" 
                             contenteditable="true" 
                             data-index="${newIndex}">New Announcement</div>
                        <div class="form-check mt-2">
                            <input type="checkbox" class="form-check-input" 
                                   id="enabled-${newIndex}" checked>
                            <label class="form-check-label" for="enabled-${newIndex}">Enabled</label>
                        </div>
                    </div>
                </div>
            `;
            $('.tab-content').append(newContent);

            // Setup rich text editor for new content
            this.setupRichTextEditors();

            // Activate the new tab
            $(`#announcement-tab-${newIndex}`).tab('show');
        });

        $(document).on('click', '.remove-announcement', function() {
            const $tabPane = $(this).closest('.tab-pane');
            const tabId = $tabPane.attr('id');
            const $tab = $(`[data-bs-target="#${tabId}"]`).parent();
            
            // If removing active tab, activate first remaining tab
            const wasActive = $tabPane.hasClass('active');
            
            // Remove tab and content
            $tab.remove();
            $tabPane.remove();

            if (wasActive) {
                $('.nav-tabs .nav-link:first').tab('show');
            }

            // Renumber remaining tabs
            $('.nav-tabs .nav-link').each((i, el) => {
                $(el).text(`#${i + 1}`);
            });
        });
    }

    onDestroy() {
        if (this.scrollInterval) {
            clearInterval(this.scrollInterval);
        }
    }
} 