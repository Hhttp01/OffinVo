/**
 * --- Storage Service ---
 * אחראי על כל הקשר עם ה-LocalStorage וניהול המידע
 */

const STORAGE_KEYS = {
    CLIENTS: 'biz_app_clients',
    HISTORY: 'biz_app_history'
};

const StorageService = {
    // --- פעולות בסיסיות ---
    save: (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error("Error saving to localStorage", e);
        }
    },

    load: (key) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Error loading from localStorage", e);
            return [];
        }
    },

    // --- ניהול לקוחות ---
    getClients: () => StorageService.load(STORAGE_KEYS.CLIENTS),
    
    addClient: (client) => {
        const clients = StorageService.getClients();
        clients.push(client);
        StorageService.save(STORAGE_KEYS.CLIENTS, clients);
        return clients;
    },

    // --- ניהול היסטוריית מסמכים ---
    getHistory: () => StorageService.load(STORAGE_KEYS.HISTORY),
    
    addDocument: (doc) => {
        const history = StorageService.getHistory();
        const newDoc = {
            ...doc,
            id: Date.now(), // מזהה ייחודי למסמך
            timestamp: new Date().toISOString()
        };
        history.push(newDoc);
        StorageService.save(STORAGE_KEYS.HISTORY, history);
        return history;
    },

    updateDocument: (docId, newData) => {
        const history = StorageService.getHistory();
        const index = history.findIndex(d => d.id === docId);
        if (index !== -1) {
            history[index] = { ...history[index], ...newData };
            StorageService.save(STORAGE_KEYS.HISTORY, history);
        }
        return history;
    },

    // --- שאילתות וסיכומים ---
    getClientStats: (clientName) => {
        const history = StorageService.getHistory();
        const clientDocs = history.filter(d => d.client === clientName);
        
        return {
            paid: clientDocs.filter(d => d.paid).reduce((sum, d) => sum + d.total, 0),
            pending: clientDocs.filter(d => !d.paid).reduce((sum, d) => sum + d.total, 0),
            docs: clientDocs
        };
    }
};

// ייצוא אופציונלי אם תרצה להשתמש ב-Modules בעתיד
// export default StorageService;
