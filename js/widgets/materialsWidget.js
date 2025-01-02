class MaterialsWidget extends Widget {
    constructor(config) {
        super(config);
        this.type = 'materials';
        this.settings = {
            color: '#2ec4b6',
            textSize: 'medium',
            title: 'Required Materials',
            materials: [
                // Default materials as examples
                { id: 1, name: 'Pencil Case', icon: 'fa-pencil-ruler' },
                { id: 2, name: 'Workbook', icon: 'fa-book' }
            ],
            ...config.settings
        };
    }

    getIcon() {
        return '<i class="fas fa-list-check"></i>';
    }

    render() {
        return `
            <div class="materials-content" data-size="${this.settings.textSize}">
                <div class="materials-title" style="color: ${this.settings.color}">
                    ${this.settings.title}
                </div>
                <div class="materials-grid">
                    ${this.settings.materials.map(material => `
                        <div class="material-item" style="border-color: ${this.settings.color}">
                            <div class="material-quick-edit">
                                <button class="btn btn-sm btn-link edit-material" 
                                        data-id="${material.id}" 
                                        title="Quick Edit">
                                    <i class="fas fa-pen"></i>
                                </button>
                            </div>
                            <div class="material-icon" style="color: ${this.settings.color}">
                                <i class="fas ${material.icon}"></i>
                            </div>
                            <div class="material-name">${material.name}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    openSettings() {
        // Predefined icons for materials
        const availableIcons = [
            { icon: 'fa-pencil-ruler', name: 'Pencil Case' },
            { icon: 'fa-book', name: 'Book' },
            { icon: 'fa-calculator', name: 'Calculator' },
            { icon: 'fa-compass', name: 'Compass' },
            { icon: 'fa-palette', name: 'Art Supplies' },
            { icon: 'fa-laptop', name: 'Laptop' },
            { icon: 'fa-headphones', name: 'Headphones' },
            { icon: 'fa-scissors', name: 'Scissors' },
            { icon: 'fa-ruler', name: 'Ruler' },
            { icon: 'fa-pen', name: 'Pen' }
        ];

        const materialsList = this.settings.materials.map((material, index) => `
            <div class="material-entry d-flex align-items-center mb-2">
                <input type="text" class="form-control me-2" 
                       value="${material.name}" 
                       placeholder="Material name"
                       data-index="${index}">
                <select class="form-select me-2" style="width: auto;" data-index="${index}">
                    ${availableIcons.map(icon => `
                        <option value="${icon.icon}" ${material.icon === icon.icon ? 'selected' : ''}>
                            ${icon.name}
                        </option>
                    `).join('')}
                </select>
                <button class="btn btn-danger btn-sm remove-material" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');

        Swal.fire({
            title: 'Materials Settings',
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
                           id="materialColor" value="${this.settings.color}">
                </div>
                <div class="mb-3">
                    <label class="form-label">Materials</label>
                    <div id="materialsList">
                        ${materialsList}
                    </div>
                    <button class="btn btn-primary btn-sm mt-2" id="addMaterial">
                        <i class="fas fa-plus"></i> Add Material
                    </button>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Save',
            width: '600px',
            didOpen: () => {
                // Add material button handler
                $('#addMaterial').on('click', () => {
                    const newIndex = $('#materialsList .material-entry').length;
                    const newMaterialHtml = `
                        <div class="material-entry d-flex align-items-center mb-2">
                            <input type="text" class="form-control me-2" 
                                   placeholder="Material name"
                                   data-index="${newIndex}">
                            <select class="form-select me-2" style="width: auto;" data-index="${newIndex}">
                                ${availableIcons.map(icon => `
                                    <option value="${icon.icon}">${icon.name}</option>
                                `).join('')}
                            </select>
                            <button class="btn btn-danger btn-sm remove-material" data-index="${newIndex}">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `;
                    $('#materialsList').append(newMaterialHtml);
                });

                // Remove material button handler
                $(document).on('click', '.remove-material', function() {
                    $(this).closest('.material-entry').remove();
                });
            },
            preConfirm: () => {
                const materials = [];
                $('.material-entry').each(function() {
                    const name = $(this).find('input').val();
                    const icon = $(this).find('select').val();
                    if (name) {
                        materials.push({
                            id: Date.now() + materials.length,
                            name,
                            icon
                        });
                    }
                });

                return {
                    title: document.getElementById('widgetTitle').value,
                    textSize: document.getElementById('textSize').value,
                    color: document.getElementById('materialColor').value,
                    materials
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.settings = result.value;
                const $widget = $(`#widget-${this.id}`);
                $widget.find('.widget-content').html(this.render());
                this.save();
            }
        });
    }

    onInitialize($widget) {
        $widget.find('.edit-material').on('click', (e) => {
            const materialId = $(e.currentTarget).data('id');
            const material = this.settings.materials.find(m => m.id === materialId);
            if (!material) return;

            // Predefined icons for materials
            const availableIcons = [
                { icon: 'fa-pencil-ruler', name: 'Pencil Case' },
                { icon: 'fa-book', name: 'Book' },
                { icon: 'fa-calculator', name: 'Calculator' },
                { icon: 'fa-compass', name: 'Compass' },
                { icon: 'fa-palette', name: 'Art Supplies' },
                { icon: 'fa-laptop', name: 'Laptop' },
                { icon: 'fa-headphones', name: 'Headphones' },
                { icon: 'fa-scissors', name: 'Scissors' },
                { icon: 'fa-ruler', name: 'Ruler' },
                { icon: 'fa-pen', name: 'Pen' }
            ];

            Swal.fire({
                title: 'Quick Edit Material',
                html: `
                    <div class="mb-3">
                        <label class="form-label">Name</label>
                        <input type="text" id="materialName" class="form-control" 
                               value="${material.name}">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Icon</label>
                        <select id="materialIcon" class="form-select">
                            ${availableIcons.map(icon => `
                                <option value="${icon.icon}" ${material.icon === icon.icon ? 'selected' : ''}>
                                    ${icon.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Save',
                preConfirm: () => {
                    return {
                        name: document.getElementById('materialName').value,
                        icon: document.getElementById('materialIcon').value
                    };
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    // Update the material
                    const materialIndex = this.settings.materials.findIndex(m => m.id === materialId);
                    if (materialIndex !== -1) {
                        this.settings.materials[materialIndex] = {
                            ...this.settings.materials[materialIndex],
                            ...result.value
                        };
                        // Update widget and save
                        const $widget = $(`#widget-${this.id}`);
                        $widget.find('.widget-content').html(this.render());
                        this.onInitialize($widget);
                        this.save();
                    }
                }
            });
        });
    }
} 