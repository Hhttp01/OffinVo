import { AppConfig } from '../config.js';

const STORAGE_KEYS = {
    CLIENTS: `${AppConfig.storagePrefix}clients`,
    HISTORY: `${AppConfig.storagePrefix}history`,
    BACKUPS: `${AppConfig.storagePrefix}backups`,
    SETTINGS: `${AppConfig.storagePrefix}settings`
};

export class StorageService {
    static save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('שגיאה בשמירת נתונים:', error);
            this.showError('לא ניתן לשמור נתונים. בדוק את נפח האחסון הזמין.');
            return false;
        }
    }

    static load(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('שגיאה בטעינת נתונים:', error);
            return null;
        }
    }

    static getClients() {
        const clients = this.load(STORAGE_KEYS.CLIENTS) || [];
        return clients.map(client => ({
            id: client.id || this.generateId(),
            name: client.name || 'ללא שם',
            email: client.email || '',
            phone: client.phone || '',
            company: client.company || '',
            address: client.address || '',
            taxId: client.taxId || '',
            notes: client.notes || '',
            active: client.active !== false,
            createdAt: client.createdAt || new Date().toISOString(),
            updatedAt: client.updatedAt || new Date().toISOString()
        }));
    }

    static saveClients(clients) {
        return this.save(STORAGE_KEYS.CLIENTS, clients);
    }

    static getDocuments() {
        const documents = this.load(STORAGE_KEYS.HISTORY) || [];
        return documents.map(doc => ({
            id: doc.id || this.generateId(),
            client: doc.client || '',
            type: doc.type || 'invoice',
            number: doc.number || '',
            date: doc.date || new Date().toISOString().split('T')[0],
            dueDate: doc.dueDate || '',
            total: parseFloat(doc.total) || 0,
            paid: Boolean(doc.paid),
            description: doc.description || '',
            notes: doc.notes || '',
            createdAt: doc.createdAt || new Date().toISOString(),
            updatedAt: doc.updatedAt || new Date().toISOString()
        }));
    }

    static saveDocuments(documents) {
        return this.save(STORAGE_KEYS.HISTORY, documents);
    }

    static addClient(clientData) {
        const clients = this.getClients();
        const newClient = {
            id: this.generateId(),
            ...clientData,
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        clients.push(newClient);
        this.saveClients(clients);
        return newClient;
    }

    static updateClient(clientId, updates) {
        const clients = this.getClients();
        const index = clients.findIndex(c => c.id === clientId);
        if (index !== -1) {
            clients[index] = {
                ...clients[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveClients(clients);
            return clients[index];
        }
        return null;
    }

    static deleteClient(clientId) {
        const clients = this.getClients();
        const filtered = clients.filter(c => c.id !== clientId);
        this.saveClients(filtered);
        return filtered;
    }

    static addDocument(documentData) {
        const documents = this.getDocuments();
        const newDocument = {
            id: this.generateId(),
            ...documentData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        documents.push(newDocument);
        this.saveDocuments(documents);
        return newDocument;
    }

    static updateDocument(documentId, updates) {
        const documents = this.getDocuments();
        const index = documents.findIndex(d => d.id === documentId);
        if (index !== -1) {
            documents[index] = {
                ...documents[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveDocuments(documents);
            return documents[index];
        }
        return null;
    }

    static deleteDocument(documentId) {
        const documents = this.getDocuments();
        const filtered = documents.filter(d => d.id !== documentId);
        this.saveDocuments(filtered);
        return filtered;
    }

    static getClientStats(clientName) {
        const documents = this.getDocuments();
        const clientDocs = documents.filter(d => d.client === clientName);
        
        const paidTotal = clientDocs
            .filter(d => d.paid)
            .reduce((sum, d) => sum + d.total, 0);
            
        const pendingTotal = clientDocs
            .filter(d => !d.paid)
            .reduce((sum, d) => sum + d.total, 0);
        
        return {
            totalDocuments: clientDocs.length,
            paidTotal,
            pendingTotal,
            total: paidTotal + pendingTotal,
            documents: clientDocs
        };
    }

    static getOverallStats() {
        const clients = this.getClients();
        const documents = this.getDocuments();
        
        const paidTotal = documents
            .filter(d => d.paid)
            .reduce((sum, d) => sum + d.total, 0);
            
        const pendingTotal = documents
            .filter(d => !d.paid)
            .reduce((sum, d) => sum + d.total, 0);
        
        const activeClients = clients.filter(c => c.active).length;
        const activeDocuments = documents.length;
        
        return {
            totalClients: clients.length,
            activeClients,
            totalDocuments: activeDocuments,
            paidTotal,
            pendingTotal,
            grandTotal: paidTotal + pendingTotal,
            averageDocumentValue: activeDocuments > 0 ? (paidTotal + pendingTotal) / activeDocuments : 0
        };
    }

    static exportData() {
        return {
            clients: this.getClients(),
            documents: this.getDocuments(),
            settings: this.load(STORAGE_KEYS.SETTINGS) || {},
            exportDate: new Date().toISOString(),
            version: AppConfig.version
        };
    }

    static importData(data) {
        if (data.clients) this.saveClients(data.clients);
        if (data.documents) this.saveDocuments(data.documents);
        if (data.settings) this.save(STORAGE_KEYS.SETTINGS, data.settings);
        return true;
    }

    static createBackup() {
        const backups = this.load(STORAGE_KEYS.BACKUPS) || [];
        const backup = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            data: this.exportData()
        };
        
        backups.push(backup);
        
        // שמירת מספר מוגבל של גיבויים
        if (backups.length > AppConfig.maxBackups) {
            backups.shift();
        }
        
        this.save(STORAGE_KEYS.BACKUPS, backups);
        return backup;
    }

    static getBackups() {
        return this.load(STORAGE_KEYS.BACKUPS) || [];
    }

    static cleanOldBackups(keep = 5) {
        const backups = this.getBackups();
        if (backups.length > keep) {
            const cleaned = backups.slice(-keep);
            this.save(STORAGE_KEYS.BACKUPS, cleaned);
            return cleaned;
        }
        return backups;
    }

    static generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    static showError(message) {
        if (typeof window !== 'undefined' && window.showNotification) {
            window.showNotification(message, 'error');
        } else {
            alert(message);
        }
    }

    static showSuccess(message) {
        if (typeof window !== 'undefined' && window.showNotification) {
            window.showNotification(message, 'success');
        } else {
            alert(message);
        }
    }
}
