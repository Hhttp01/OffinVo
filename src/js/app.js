import { AppConfig } from './config.js';
import { StorageService } from './services/storage.service.js';
import { ClientManager } from './managers/ClientManager.js';
import { DocumentManager } from './managers/DocumentManager.js';
import { UIManager } from './managers/UIManager.js';

class App {
    constructor() {
        this.config = AppConfig;
        this.storage = StorageService;
        this.clientManager = new ClientManager();
        this.documentManager = new DocumentManager();
        this.uiManager = new UIManager(this);
        
        this.init();
    }

    async init() {
        console.log(`🚀 ${this.config.appName} v${this.config.version}`);
        
        // אתחול מנהל ממשק
        await this.uiManager.init();
        
        // עדכון תאריך נוכחי
        this.updateCurrentDate();
        setInterval(() => this.updateCurrentDate(), 60000);
        
        // גיבוי אוטומטי
        this.setupAutoBackup();
        
        // חשיפה לשירותים ל-global scope לשימוש בכפתורים
        window.app = this;
        window.showNotification = this.uiManager.showNotification.bind(this.uiManager);
        
        // הצגת לוח הבקרה
        this.uiManager.showSection('dashboard');
    }

    updateCurrentDate() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString('he-IL', options);
        }
    }

    setupAutoBackup() {
        const lastBackup = localStorage.getItem('lastBackup');
        const now = Date.now();
        
        if (!lastBackup || (now - parseInt(lastBackup)) > this.config.autoBackupInterval) {
            setTimeout(() => {
                this.storage.createBackup();
                localStorage.setItem('lastBackup', now.toString());
                this.uiManager.showNotification('בוצע גיבוי אוטומטי של הנתונים', 'info');
            }, 5000);
        }
        
        // גיבוי כל יום
        setInterval(() => {
            this.storage.createBackup();
            localStorage.setItem('lastBackup', Date.now().toString());
        }, this.config.autoBackupInterval);
    }

    getStats() {
        return this.storage.getOverallStats();
    }

    // פונקציות לשימוש בכפתורים
    addNewClient() {
        this.uiManager.showSection('add-client');
    }

    addNewDocument() {
        this.uiManager.showSection('add-document');
    }

    exportData() {
        this.uiManager.exportData();
    }

    importData() {
        this.uiManager.importData();
    }

    createBackup() {
        const backup = this.storage.createBackup();
        this.uiManager.showNotification(`נוצר גיבוי #${backup.id.substring(0, 8)}`, 'success');
        return backup;
    }
}

// אתחול האפליקציה כאשר הדף נטען
document.addEventListener('DOMContentLoaded', () => {
    new App();
});

export default App;
