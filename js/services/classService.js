class ClassService {
    constructor() {
        this.classes = [];
        this.loadFromStorage();
    }

    loadFromStorage() {
        const savedData = localStorage.getItem('classHubClasses');
        if (savedData) {
            try {
                this.classes = JSON.parse(savedData);
            } catch (e) {
                console.error('Error loading class data:', e);
                this.classes = [];
            }
        }
    }

    saveToStorage() {
        localStorage.setItem('classHubClasses', JSON.stringify(this.classes));
    }

    getAllClasses() {
        return this.classes;
    }

    getClass(classId) {
        return this.classes.find(c => c.id === classId);
    }

    createClass(classData) {
        const newClass = {
            id: Date.now().toString(),
            ...classData,
            createdAt: new Date().toISOString()
        };
        this.classes.push(newClass);
        this.saveToStorage();
        return newClass.id;
    }

    updateClass(classId, updatedData) {
        const classIndex = this.classes.findIndex(c => c.id === classId);
        if (classIndex !== -1) {
            this.classes[classIndex] = {
                ...this.classes[classIndex],
                ...updatedData,
                updatedAt: new Date().toISOString()
            };
            this.saveToStorage();
            return true;
        }
        return false;
    }

    removeClass(classId) {
        this.classes = this.classes.filter(c => c.id !== classId);
        this.saveToStorage();
    }
}

// Initialize the service globally
window.classService = new ClassService(); 