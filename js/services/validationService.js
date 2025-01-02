class ValidationService {
    static validateStudent(student) {
        const errors = [];
        
        if (!student.firstName?.trim()) {
            errors.push('First name is required');
        }

        if (student.email && !this.isValidEmail(student.email)) {
            errors.push('Invalid email format');
        }

        if (student.dateOfBirth && !this.isValidDate(student.dateOfBirth)) {
            errors.push('Invalid date of birth');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static validateClass(classData) {
        const errors = [];
        
        if (!classData.name?.trim()) {
            errors.push('Class name is required');
        }

        if (classData.gradeLevel && !this.isValidGradeLevel(classData.gradeLevel)) {
            errors.push('Invalid grade level');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static validateSpace(space) {
        const errors = [];
        
        if (!space.name?.trim()) {
            errors.push('Space name is required');
        }

        if (!Array.isArray(space.widgets)) {
            errors.push('Invalid widgets array');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Utility validation methods
    static isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    static isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    static isValidGradeLevel(grade) {
        const gradeNum = parseInt(grade);
        return !isNaN(gradeNum) && gradeNum >= 1 && gradeNum <= 12;
    }
}

// Make the service available globally
window.validationService = ValidationService; 