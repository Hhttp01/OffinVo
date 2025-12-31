import { StorageService } from '../services/storage.service.js';
import { ValidationService } from '../services/validation.service.js';

export class DocumentManager {
    constructor() {
        this.documents = StorageService.getDocuments();
    }

    getAllDocuments(filters = {}) {
        let filtered = [...this.documents];
        
        if (filters.client) {
            filtered = filtered.filter(doc => doc.client === filters.client);
        }
        
        if (filters.type && filters.type !== 'all') {
            filtered = filtered.filter(doc => doc.type === filters.type);
        }
        
        if (filters.status && filters.status !== 'all') {
            filtered = filtered.filter(doc => 
                filters.status === 'paid' ? doc.paid : !doc.paid
            );
        }
        
        if (filters.dateRange && filters.dateRange !== 'all') {
            const now = new Date();
            let startDate;
            
            switch(filters.dateRange) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                    break;
            }
            
            if (startDate) {
                filtered = filtered.filter(doc => new Date(doc.date) >= startDate);
            }
        }
        
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(doc =>
                doc.client.toLowerCase().includes(searchTerm) ||
                doc.number.toLowerCase().includes(searchTerm) ||
                doc.description.toLowerCase().includes(searchTerm)
            );
        }
        
        if (filters.sortBy) {
            filtered.sort((a, b) => {
                let aValue, bValue;
                
                if (filters.sortBy === 'date') {
                    aValue = new Date(a.date);
                    bValue = new Date(b.date);
                } else if (filters.sortBy === 'total') {
                    aValue = a.total;
                    bValue = b.total;
                } else {
                    aValue = a[filters.sortBy];
                    bValue = b[filters.sortBy];
                }
                
                if (filters.sortOrder === 'asc') {
                    return aValue > bValue ? 1 : -1;
                } else {
                    return aValue < bValue ? 1 : -1;
                }
            });
        }
        
        return filtered;
    }

    getDocumentById(id) {
        return this.documents.find(doc => doc.id === id);
    }

    addDocument(documentData) {
        const validation = ValidationService.validateDocument(documentData);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        const newDocument = StorageService.addDocument(documentData);
        this.documents = StorageService.getDocuments();
        return newDocument;
    }

    updateDocument(id, updates) {
        const validation = ValidationService.validateDocument(updates);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        const updatedDocument = StorageService.updateDocument(id, updates);
        if (updatedDocument) {
            this.documents = StorageService.getDocuments();
        }
        return updatedDocument;
    }

    deleteDocument(id) {
        const newDocuments = StorageService.deleteDocument(id);
        this.documents = newDocuments;
        return newDocuments;
    }

    togglePaymentStatus(id) {
        const document = this.getDocumentById(id);
        if (document) {
            return this.updateDocument(id, { paid: !document.paid });
        }
        return null;
    }

    getDocumentsByClient(clientName) {
        return this.documents.filter(doc => doc.client === clientName);
    }

    getDocumentsSummary() {
        const total = this.documents.length;
        const paid = this.documents.filter(d => d.paid).length;
        const pending = total - paid;
        const totalAmount = this.documents.reduce((sum, doc) => sum + doc.total, 0);
        const paidAmount = this.documents
            .filter(d => d.paid)
            .reduce((sum, doc) => sum + doc.total, 0);
        const pendingAmount = totalAmount - paidAmount;
        
        return {
            total,
            paid,
            pending,
            totalAmount,
            paidAmount,
            pendingAmount
        };
    }

    getRecentDocuments(limit = 5) {
        return [...this.documents]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }

    getDocumentsByDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return this.documents.filter(doc => {
            const docDate = new Date(doc.date);
            return docDate >= start && docDate <= end;
        });
    }

    getTopClients(limit = 5) {
        const clientTotals = {};
        
        this.documents.forEach(doc => {
            if (!clientTotals[doc.client]) {
                clientTotals[doc.client] = 0;
            }
            clientTotals[doc.client] += doc.total;
        });
        
        return Object.entries(clientTotals)
            .map(([client, total]) => ({ client, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, limit);
    }
}
// 📄 src/js/managers/DocumentManager.js - הוספת פונקציות חסרות

getDocumentById(id) {
    return this.documents.find(doc => doc.id === id);
}

togglePaymentStatus(id) {
    const document = this.getDocumentById(id);
    if (document) {
        return this.updateDocument(id, { paid: !document.paid });
    }
    return null;
}

getDocumentsByDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return this.documents.filter(doc => {
        const docDate = new Date(doc.date);
        return docDate >= start && docDate <= end;
    });
}

getTopClients(limit = 5) {
    const clientTotals = {};
    
    this.documents.forEach(doc => {
        if (!clientTotals[doc.client]) {
            clientTotals[doc.client] = 0;
        }
        clientTotals[doc.client] += doc.total;
    });
    
    return Object.entries(clientTotals)
        .map(([client, total]) => ({ client, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);
}

getOverdueDocuments() {
    const today = new Date();
    return this.documents.filter(doc => {
        return doc.dueDate && 
               !doc.paid && 
               new Date(doc.dueDate) < today;
    });
}

getDocumentsSummaryByType() {
    const summary = {};
    
    this.documents.forEach(doc => {
        if (!summary[doc.type]) {
            summary[doc.type] = {
                count: 0,
                total: 0,
                paid: 0
            };
        }
        
        summary[doc.type].count++;
        summary[doc.type].total += doc.total;
        if (doc.paid) {
            summary[doc.type].paid += doc.total;
        }
    });
    
    return summary;
}

generateDocumentNumber(type) {
    const documentsOfType = this.documents.filter(doc => doc.type === type);
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    
    // מציאת המספר הגבוה ביותר לסוג זה השנה
    const currentYearDocs = documentsOfType.filter(doc => {
        const docDate = new Date(doc.date);
        return docDate.getFullYear() === today.getFullYear();
    });
    
    const maxNumber = currentYearDocs.reduce((max, doc) => {
        if (doc.number) {
            const match = doc.number.match(/\d+/);
            if (match) {
                const num = parseInt(match[0]);
                return num > max ? num : max;
            }
        }
        return max;
    }, 0);
    
    return `${type.toUpperCase().substring(0, 3)}${year}${month}${(maxNumber + 1).toString().padStart(3, '0')}`;
}
