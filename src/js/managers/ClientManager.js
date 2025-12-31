import { StorageService } from '../services/storage.service.js';
import { ValidationService } from '../services/validation.service.js';

export class ClientManager {
    constructor() {
        this.clients = StorageService.getClients();
    }

    getAllClients(filters = {}) {
        let filtered = [...this.clients];
        
        if (filters.activeOnly) {
            filtered = filtered.filter(client => client.active);
        }
        
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(client =>
                client.name.toLowerCase().includes(searchTerm) ||
                client.email.toLowerCase().includes(searchTerm) ||
                client.phone.includes(searchTerm) ||
                (client.company && client.company.toLowerCase().includes(searchTerm))
            );
        }
        
        if (filters.sortBy) {
            filtered.sort((a, b) => {
                const aValue = a[filters.sortBy];
                const bValue = b[filters.sortBy];
                
                if (filters.sortOrder === 'asc') {
                    return aValue > bValue ? 1 : -1;
                } else {
                    return aValue < bValue ? 1 : -1;
                }
            });
        }
        
        return filtered;
    }

    getClientById(id) {
        return this.clients.find(client => client.id === id);
    }

    addClient(clientData) {
        const validation = ValidationService.validateClient(clientData);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        const newClient = StorageService.addClient(clientData);
        this.clients = StorageService.getClients();
        return newClient;
    }

    updateClient(id, updates) {
        const validation = ValidationService.validateClient(updates);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        const updatedClient = StorageService.updateClient(id, updates);
        if (updatedClient) {
            this.clients = StorageService.getClients();
        }
        return updatedClient;
    }

    deleteClient(id) {
        const newClients = StorageService.deleteClient(id);
        this.clients = newClients;
        return newClients;
    }

    toggleClientStatus(id) {
        const client = this.getClientById(id);
        if (client) {
            return this.updateClient(id, { active: !client.active });
        }
        return null;
    }

    getClientDocuments(clientName) {
        const documents = StorageService.getDocuments();
        return documents.filter(doc => doc.client === clientName);
    }

    getClientSummary(clientId) {
        const client = this.getClientById(clientId);
        if (!client) return null;
        
        const stats = StorageService.getClientStats(client.name);
        
        return {
            client,
            stats,
            lastDocuments: stats.documents.slice(0, 5)
        };
    }

    searchClients(query) {
        if (!query.trim()) return this.clients;
        
        const searchTerm = query.toLowerCase();
        return this.clients.filter(client =>
            client.name.toLowerCase().includes(searchTerm) ||
            client.email.toLowerCase().includes(searchTerm) ||
            client.phone.includes(query) ||
            (client.company && client.company.toLowerCase().includes(searchTerm))
        );
    }

    getActiveClientsCount() {
        return this.clients.filter(client => client.active).length;
    }

    getRecentClients(limit = 5) {
        return [...this.clients]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);
    }
}
