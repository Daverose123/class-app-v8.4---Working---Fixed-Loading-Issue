class AchievementService {
    constructor() {
        this.achievements = {};
        this.loadFromStorage();
    }

    loadFromStorage() {
        const savedData = localStorage.getItem('classHubAchievements');
        if (savedData) {
            try {
                this.achievements = JSON.parse(savedData);
            } catch (e) {
                console.error('Error loading achievements data:', e);
                this.achievements = {};
            }
        }
    }

    saveToStorage() {
        localStorage.setItem('classHubAchievements', JSON.stringify(this.achievements));
    }

    getStudentAchievements(studentId) {
        studentId = studentId.toString();
        if (!this.achievements[studentId]) {
            this.initializeStudentAchievements(studentId);
        }
        return this.achievements[studentId] || [];
    }

    addAchievement(studentId, achievement, classId) {
        studentId = studentId.toString();
        
        // Validate student exists using provided classId
        const student = window.studentService.getStudent(classId, studentId);
        if (!student) {
            console.error('Cannot add achievement: Student not found', { studentId, classId });
            return null;
        }

        if (!this.achievements[studentId]) {
            this.achievements[studentId] = [];
        }

        // Get existing achievements of the same type
        const existingTypeAchievements = this.achievements[studentId].filter(
            a => a.type === achievement.type
        );

        // Determine medal level based on previous achievements
        let medalLevel = achievement.medalLevel;
        if (achievement.type !== 'custom') {
            const count = existingTypeAchievements.length;
            medalLevel = this.determineNextMedalLevel(count, existingTypeAchievements);
        }

        const newAchievement = {
            id: Date.now().toString(),
            ...achievement,
            medalLevel, // Use the determined medal level
            studentId: studentId,
            dateAwarded: new Date().toISOString(),
        };
        
        this.achievements[studentId].push(newAchievement);
        this.saveToStorage();
        return newAchievement;
    }

    determineNextMedalLevel(count, existingAchievements) {
        // Define progression levels
        const levels = [
            'bronze',     // Level 1: Starting level
            'silver',     // Level 2: Second achievement
            'gold',       // Level 3: Third achievement
            'platinum',   // Level 4: Fourth achievement
            'ruby',       // Level 5: Fifth achievement
            'sapphire',   // Level 6: Sixth achievement
            'emerald',    // Level 7: Seventh achievement
            'diamond',    // Level 8: Eighth achievement
            'amethyst',   // Level 9: Ninth achievement
            'opal'        // Level 10: Tenth achievement
        ];

        // Check if they already have the highest level
        if (existingAchievements.some(a => a.medalLevel === 'opal')) {
            return 'opal'; // Stay at highest level
        }

        // Requirements for each level
        const requirements = {
            bronze: 0,      // First achievement
            silver: 1,      // 2 achievements
            gold: 2,        // 3 achievements
            platinum: 3,    // 4 achievements
            ruby: 4,        // 5 achievements
            sapphire: 5,    // 6 achievements
            emerald: 6,     // 7 achievements
            diamond: 7,     // 8 achievements
            amethyst: 8,    // 9 achievements
            opal: 9         // 10 achievements
        };

        // Find the appropriate level based on count
        for (let i = levels.length - 1; i >= 0; i--) {
            const level = levels[i];
            if (count >= requirements[level]) {
                return level;
            }
        }

        return 'bronze'; // Default starting level
    }

    getCurrentLevel(existingAchievements) {
        const levels = ['opal', 'amethyst', 'diamond', 'emerald', 'sapphire', 'ruby', 'platinum', 'gold', 'silver', 'bronze'];
        return levels.find(level => existingAchievements.some(a => a.medalLevel === level)) || 'bronze';
    }

    removeAchievement(studentId, achievementId) {
        if (this.achievements[studentId]) {
            this.achievements[studentId] = this.achievements[studentId].filter(a => a.id !== achievementId);
            this.saveToStorage();
        }
    }

    showAddAchievementDialog(studentId, classId) {
        studentId = studentId.toString();
        classId = classId.toString();
        
        const student = window.studentService.getStudent(classId, studentId);
        if (!student) {
            console.error('Student not found:', studentId, classId);
            return;
        }

        const existingAchievements = this.getStudentAchievements(studentId);
        
        Swal.fire({
            title: `Add Achievement - ${student.firstName} ${student.lastName}`,
            html: `
                <div class="achievement-form">
                    <div class="mb-3">
                        <label class="form-label">Achievement Type</label>
                        <select class="form-select" id="achievementType">
                            <option value="weekly_star">Star of the Week</option>
                            <option value="monthly_star">Student of the Month</option>
                            <option value="academic">Academic Excellence</option>
                            <option value="attendance">Perfect Attendance</option>
                            <option value="character">Character Award</option>
                            <option value="custom">Custom Achievement</option>
                        </select>
                    </div>
                    <div class="mb-3 custom-achievement-fields" style="display: none;">
                        <label class="form-label">Achievement Title</label>
                        <input type="text" id="customTitle" class="form-control">
                    </div>
                    <div class="mb-3 medal-level-field" style="display: none;">
                        <label class="form-label">Medal Level</label>
                        <select class="form-select" id="medalLevel">
                            <option value="bronze">Bronze</option>
                            <option value="silver">Silver</option>
                            <option value="gold">Gold</option>
                            <option value="platinum">Platinum</option>
                        </select>
                        <small class="text-muted">Medal level is automatically assigned for standard achievements.</small>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea id="achievementDescription" class="form-control" rows="3"></textarea>
                    </div>
                    ${this.renderAchievementProgress(existingAchievements)}
                </div>
            `,
            didOpen: () => {
                $('#achievementType').on('change', function() {
                    const isCustom = $(this).val() === 'custom';
                    $('.custom-achievement-fields').toggle(isCustom);
                    $('.medal-level-field').toggle(isCustom);
                });
            },
            showCancelButton: true,
            confirmButtonText: 'Award Achievement',
            preConfirm: () => {
                const type = $('#achievementType').val();
                const title = type === 'custom' ? 
                    $('#customTitle').val() : 
                    $('#achievementType option:selected').text();

                if (type === 'custom' && !title) {
                    Swal.showValidationMessage('Please enter a title for the custom achievement');
                    return false;
                }

                return {
                    type,
                    title,
                    medalLevel: $('#medalLevel').val(),
                    description: $('#achievementDescription').val()
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                console.log('Adding achievement:', result.value);
                this.addAchievement(studentId, result.value, classId);
                window.studentService.showStudentProfile(classId, studentId);
            }
        });
    }

    renderAchievements(studentId) {
        const achievements = this.getStudentAchievements(studentId);
        if (!achievements.length) {
            return '<p class="text-muted text-center">No achievements yet.</p>';
        }

        return `
            <div class="achievements-grid">
                ${achievements.map(achievement => this.renderAchievementCard(achievement)).join('')}
            </div>
        `;
    }

    renderAchievementCard(achievement) {
        const medalColors = {
            bronze: '#CD7F32',
            silver: '#C0C0C0',
            gold: '#FFD700',
            platinum: '#E5E4E2',
            ruby: '#E0115F',
            sapphire: '#0F52BA',
            emerald: '#50C878',
            diamond: '#B9F2FF',
            amethyst: '#9966CC',
            opal: '#A8C3BC'
        };

        const medalLabels = {
            bronze: 'Bronze',
            silver: 'Silver',
            gold: 'Gold',
            platinum: 'Platinum',
            ruby: 'Ruby',
            sapphire: 'Sapphire',
            emerald: 'Emerald',
            diamond: 'Diamond',
            amethyst: 'Amethyst',
            opal: 'Opal'
        };

        const medalIcon = this.getMedalIcon(achievement.type, achievement.medalLevel);

        return `
            <div class="achievement-card">
                <div class="achievement-icon-wrapper">
                    <div class="achievement-icon" style="color: ${medalColors[achievement.medalLevel]}">
                        ${medalIcon}
                    </div>
                    <span class="medal-label" style="color: ${medalColors[achievement.medalLevel]}">
                        ${medalLabels[achievement.medalLevel]}
                    </span>
                </div>
                <div class="achievement-content">
                    <h6 class="achievement-title">${achievement.title}</h6>
                    <div class="achievement-date">
                        ${new Date(achievement.dateAwarded).toLocaleDateString()}
                    </div>
                    ${achievement.description ? `
                        <div class="achievement-description">
                            ${achievement.description}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getMedalIcon(type, level) {
        const baseIcon = this.getAchievementTypeIcon(type);
        return `<div class="medal-icon ${level}">${baseIcon}</div>`;
    }

    getAchievementTypeIcon(type) {
        const icons = {
            weekly_star: '<i class="fas fa-star"></i>',
            monthly_star: '<i class="fas fa-crown"></i>',
            academic: '<i class="fas fa-graduation-cap"></i>',
            attendance: '<i class="fas fa-calendar-check"></i>',
            character: '<i class="fas fa-heart"></i>',
            custom: '<i class="fas fa-award"></i>'
        };
        return icons[type] || icons.custom;
    }

    renderAchievementProgress(achievements) {
        const types = ['weekly_star', 'monthly_star', 'academic', 'attendance', 'character'];
        const typeNames = {
            weekly_star: 'Star of the Week',
            monthly_star: 'Student of the Month',
            academic: 'Academic Excellence',
            attendance: 'Perfect Attendance',
            character: 'Character Award'
        };

        return `
            <div class="achievement-progress mt-4">
                <h6 class="mb-3">Achievement Progress</h6>
                ${types.map(type => {
                    const typeAchievements = achievements.filter(a => a.type === type);
                    const count = typeAchievements.length;
                    const currentLevel = this.determineNextMedalLevel(count - 1, typeAchievements);
                    const nextLevel = this.determineNextMedalLevel(count, typeAchievements);
                    
                    return `
                        <div class="achievement-type-progress mb-3">
                            <div class="d-flex justify-content-between align-items-center">
                                <span>${typeNames[type]}</span>
                                <div>
                                    <span class="badge" style="background-color: ${this.getMedalColor(currentLevel)}">
                                        ${currentLevel.charAt(0).toUpperCase() + currentLevel.slice(1)}
                                    </span>
                                    <span class="badge bg-secondary">${count} Awards</span>
                                </div>
                            </div>
                            <div class="progress mt-1" style="height: 5px;">
                                <div class="progress-bar" 
                                     style="width: ${Math.min(count * 10, 100)}%; background-color: ${this.getMedalColor(nextLevel)}">
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    getMedalColor(level) {
        const colors = {
            bronze: '#CD7F32',
            silver: '#C0C0C0',
            gold: '#FFD700',
            platinum: '#E5E4E2',
            ruby: '#E0115F',
            sapphire: '#0F52BA',
            emerald: '#50C878',
            diamond: '#B9F2FF',
            amethyst: '#9966CC',
            opal: '#A8C3BC'
        };
        return colors[level] || colors.bronze;
    }

    initializeStudentAchievements(studentId) {
        if (!this.achievements[studentId]) {
            this.achievements[studentId] = [];
            this.saveToStorage();
        }
    }
}

// Initialize the service globally
window.achievementService = new AchievementService(); 