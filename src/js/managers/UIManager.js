import { AppConfig } from '../config.js';
import { StorageService } from '../services/storage.service.js';
import { ValidationService } from '../services/validation.service.js';

export class UIManager {
    constructor(app) {
        this.app = app;
        this.currentSection = 'dashboard';
        this.modals = {};
        this.templates = {};
    }

    async init() {
        // טעינת תבניות
        await this.loadTemplates();
        
        // בניית תפריט
        this.buildMenu();
        
        // אתחול מאזינים
        this.setupEventListeners();
        
        // עדכון נתונים ראשוני
        this.updateQuickStats();
    }

    buildMenu() {
        const menuItems = [
            { id: 'dashboard', icon: 'speedometer2', label: 'לוח בקרה' },
            { id: 'clients', icon: 'people', label: 'לקוחות' },
            { id: 'documents', icon: 'file-earmark-text', label: 'מסמכים' },
            { id: 'add-client', icon: 'person-plus', label: 'הוספת לקוח' },
            { id: 'add-document', icon: 'file-earmark-plus', label: 'הוספת מסמך' },
            { id: 'reports', icon: 'graph-up', label: 'דוחות וסטטיסטיקה' },
            { id: 'backup', icon: 'cloud-arrow-up', label: 'גיבוי ושחזור' }
        ];

        const menuContainer = document.getElementById('main-menu');
        if (!menuContainer) return;

        menuContainer.innerHTML = menuItems.map(item => `
            <li class="nav-item">
                <a class="nav-link ${item.id === this.currentSection ? 'active' : ''}" 
                   href="#" data-section="${item.id}">
                    <i class="bi bi-${item.icon}"></i>
                    ${item.label}
                </a>
            </li>
        `).join('');
    }

    async loadTemplates() {
        this.templates = {
            dashboard: await this.loadTemplate('dashboard'),
            clients: await this.loadTemplate('clients'),
            documents: await this.loadTemplate('documents'),
            'add-client': await this.loadTemplate('add-client'),
            'add-document': await this.loadTemplate('add-document'),
            reports: await this.loadTemplate('reports'),
            backup: await this.loadTemplate('backup'),
            'client-card': await this.loadTemplate('client-card'),
            'document-card': await this.loadTemplate('document-card')
        };
    }

    async loadTemplate(name) {
        try {
            // במקום אמיתי, היינו טוענים מקבצי HTML נפרדים
            // לצורך הדוגמה, נחזיר HTML מובנה
            return this.getTemplateHTML(name);
        } catch (error) {
            console.error(`שגיאה בטעינת תבנית ${name}:`, error);
            return `<div class="alert alert-danger">שגיאה בטעינת הדף</div>`;
        }
    }

    getTemplateHTML(name) {
        const templates = {
            dashboard: `
                <div id="dashboard-section">
                    <h3 class="mb-4"><i class="bi bi-speedometer2 me-2"></i>לוח בקרה</h3>
                    
                    <div class="row mb-5" id="stats-cards">
                        <!-- כרטיסי סטטיסטיקה יוטענו כאן -->
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6 mb-4">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">לקוחות אחרונים</h5>
                                </div>
                                <div class="card-body">
                                    <div id="recent-clients-list">
                                        <div class="loading"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-6 mb-4">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">מסמכים אחרונים</h5>
                                </div>
                                <div class="card-body">
                                    <div id="recent-documents-list">
                                        <div class="loading"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            
            clients: `
                <div id="clients-section">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h3><i class="bi bi-people me-2"></i>ניהול לקוחות</h3>
                        <button class="btn btn-primary" onclick="app.addNewClient()">
                            <i class="bi bi-person-plus me-1"></i>לקוח חדש
                        </button>
                    </div>
                    
                    <div class="search-container mb-4">
                        <input type="text" id="client-search" class="form-control search-input" 
                               placeholder="חיפוש לקוחות...">
                        <button class="search-btn" id="client-search-btn">
                            <i class="bi bi-search"></i>
                        </button>
                    </div>
                    
                    <div class="filter-container mb-4">
                        <button class="filter-btn active" data-filter="all">כל הלקוחות</button>
                        <button class="filter-btn" data-filter="active">פעילים בלבד</button>
                        <button class="filter-btn" data-filter="inactive">לא פעילים</button>
                    </div>
                    
                    <div id="clients-list">
                        <div class="loading"></div>
                    </div>
                </div>
            `,
            
            // תבניות נוספות...
        };
        
        return templates[name] || `<div>תבנית ${name} לא נמצאה</div>`;
    }

    showSection(sectionId) {
        this.currentSection = sectionId;
        
        // עדכון תפריט
        document.querySelectorAll('#main-menu .nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === sectionId) {
                link.classList.add('active');
            }
        });
        
        // טעינת התוכן
        this.loadSectionContent(sectionId);
    }

    async loadSectionContent(sectionId) {
        const contentContainer = document.getElementById('main-content');
        if (!contentContainer) return;
        
        // הצגת טעינה
        contentContainer.innerHTML = `
            <div class="text-center py-5">
                <div class="loading"></div>
                <p class="mt-3 text-muted">טוען...</p>
            </div>
        `;
        
        try {
            // טעינת תבנית
            const template = this.templates[sectionId] || await this.loadTemplate(sectionId);
            contentContainer.innerHTML = template;
            
            // טעינת נתונים לפי הסקציה
            switch(sectionId) {
                case 'dashboard':
                    await this.loadDashboard();
                    break;
                case 'clients':
                    await this.loadClientsList();
                    break;
                case 'documents':
                    await this.loadDocumentsList();
                    break;
                case 'add-client':
                    await this.setupAddClientForm();
                    break;
                case 'add-document':
                    await this.setupAddDocumentForm();
                    break;
                case 'reports':
                    await this.loadReports();
                    break;
                case 'backup':
                    await this.setupBackupSection();
                    break;
            }
            
            // התקנת מאזינים ספציפיים לסקציה
            this.setupSectionListeners(sectionId);
            
        } catch (error) {
            console.error(`שגיאה בטעינת סקציה ${sectionId}:`, error);
            contentContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    שגיאה בטעינת הדף: ${error.message}
                </div>
            `;
        }
    }

    async loadDashboard() {
        const stats = this.app.getStats();
        
        // עדכון כרטיסי סטטיסטיקה
        const statsCards = document.getElementById('stats-cards');
        if (statsCards) {
            statsCards.innerHTML = `
                <div class="col-md-3 col-sm-6 mb-4">
                    <div class="stat-card card text-white bg-primary">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 class="card-title">לקוחות</h5>
                                    <h2 class="mb-0">${stats.totalClients}</h2>
                                </div>
                                <i class="bi bi-people display-6 opacity-50"></i>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-3 col-sm-6 mb-4">
                    <div class="stat-card card text-white bg-success">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 class="card-title">שולם</h5>
                                    <h2 class="mb-0">₪${stats.paidTotal.toLocaleString()}</h2>
                                </div>
                                <i class="bi bi-cash-coin display-6 opacity-50"></i>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-3 col-sm-6 mb-4">
                    <div class="stat-card card text-white bg-warning">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 class="card-title">ממתין לתשלום</h5>
                                    <h2 class="mb-0">₪${stats.pendingTotal.toLocaleString()}</h2>
                                </div>
                                <i class="bi bi-clock-history display-6 opacity-50"></i>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-3 col-sm-6 mb-4">
                    <div class="stat-card card text-white bg-info">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 class="card-title">מסמכים</h5>
                                    <h2 class="mb-0">${stats.totalDocuments}</h2>
                                </div>
                                <i class="bi bi-files display-6 opacity-50"></i>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // טעינת לקוחות אחרונים
        await this.loadRecentClients();
        
        // טעינת מסמכים אחרונים
        await this.loadRecentDocuments();
    }

    async loadRecentClients() {
        const clients = this.app.clientManager.getRecentClients(5);
        const container = document.getElementById('recent-clients-list');
        
        if (!container) return;
        
        if (clients.length === 0) {
            container.innerHTML = '<p class="text-muted">אין לקוחות עדיין</p>';
            return;
        }
        
        container.innerHTML = clients.map(client => `
            <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                <div>
                    <h6 class="mb-1">${client.name}</h6>
                    <small class="text-muted">
                        ${client.company || 'ללא חברה'} | ${client.phone || 'ללא טלפון'}
                    </small>
                </div>
                <small class="text-muted">
                    ${ValidationService.formatDate(client.createdAt)}
                </small>
            </div>
        `).join('');
    }

    async loadRecentDocuments() {
        const documents = this.app.documentManager.getRecentDocuments(5);
        const container = document.getElementById('recent-documents-list');
        
        if (!container) return;
        
        if (documents.length === 0) {
            container.innerHTML = '<p class="text-muted">אין מסמכים עדיין</p>';
            return;
        }
        
        container.innerHTML = documents.map(doc => {
            const statusClass = doc.paid ? 'badge-success' : 'badge-warning';
            const statusText = doc.paid ? 'שולם' : 'ממתין';
            
            return `
                <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                    <div>
                        <h6 class="mb-1">${doc.client}</h6>
                        <small class="text-muted">
                            ${doc.type} | ${doc.description || 'ללא תיאור'}
                        </small>
                    </div>
                    <div class="text-end">
                        <span class="badge ${statusClass}">${statusText}</span>
                        <div class="fw-bold">₪${doc.total.toLocaleString()}</div>
                        <small class="text-muted">
                            ${ValidationService.formatDate(doc.date)}
                        </small>
                    </div>
                </div>
            `;
        }).join('');
    }

    async loadClientsList() {
        const clients = this.app.clientManager.getAllClients();
        const container = document.getElementById('clients-list');
        
        if (!container) return;
        
        if (clients.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle me-2"></i>
                    עדיין אין לקוחות במערכת. הוסף לקוח ראשון.
                </div>
            `;
            return;
        }
        
        container.innerHTML = clients.map(client => {
            const stats = this.app.storage.getClientStats(client.name);
            
            return `
                <div class="client-card">
                    <div class="client-header">
                        <div>
                            <h5>${client.name}</h5>
                            <div class="client-meta">
                                ${client.company ? `<span><i class="bi bi-building"></i> ${client.company}</span>` : ''}
                                ${client.phone ? `<span><i class="bi bi-telephone ms-3"></i> ${client.phone}</span>` : ''}
                                ${client.email ? `<span><i class="bi bi-envelope ms-3"></i> ${client.email}</span>` : ''}
                            </div>
                        </div>
                        <span class="badge ${client.active ? 'bg-success' : 'bg-secondary'}">
                            ${client.active ? 'פעיל' : 'לא פעיל'}
                        </span>
                    </div>
                    
                    ${client.notes ? `<p class="text-muted">${client.notes}</p>` : ''}
                    
                    <div class="client-stats">
                        <span class="stat-badge">
                            <i class="bi bi-file-text"></i>
                            ${stats.totalDocuments} מסמכים
                        </span>
                        <span class="stat-badge paid">
                            <i class="bi bi-check-circle"></i>
                            ₪${stats.paidTotal.toLocaleString()}
                        </span>
                        <span class="stat-badge pending">
                            <i class="bi bi-clock"></i>
                            ₪${stats.pendingTotal.toLocaleString()}
                        </span>
                    </div>
                    
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline-primary btn-icon" 
                                onclick="app.uiManager.editClient('${client.id}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-icon"
                                onclick="app.uiManager.deleteClient('${client.id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    setupEventListeners() {
        // מאזין לתפריט
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-section]') || e.target.closest('[data-section]')) {
                e.preventDefault();
                const link = e.target.matches('[data-section]') ? e.target : e.target.closest('[data-section]');
                const section = link.getAttribute('data-section');
                this.showSection(section);
            }
        });
        
        // מאזין לחיפוש
        document.addEventListener('input', (e) => {
            if (e.target.matches('#client-search')) {
                this.filterClients(e.target.value);
            }
            if (e.target.matches('#document-search')) {
                this.filterDocuments(e.target.value);
            }
        });
        
        // מאזין לסינון
        document.addEventListener('click', (e) => {
            if (e.target.matches('.filter-btn') || e.target.closest('.filter-btn')) {
                const btn = e.target.matches('.filter-btn') ? e.target : e.target.closest('.filter-btn');
                const filter = btn.getAttribute('data-filter');
                
                // הסרת active מכל הכפתורים
                btn.parentElement.querySelectorAll('.filter-btn').forEach(b => {
                    b.classList.remove('active');
                });
                
                // הוספת active לכפתור הנוכחי
                btn.classList.add('active');
                
                // החלת המסנן
                if (this.currentSection === 'clients') {
                    this.applyClientFilter(filter);
                } else if (this.currentSection === 'documents') {
                    this.applyDocumentFilter(filter);
                }
            }
        });
    }

    setupSectionListeners(sectionId) {
        switch(sectionId) {
            case 'add-client':
                this.setupAddClientForm();
                break;
            case 'add-document':
                this.setupAddDocumentForm();
                break;
            case 'backup':
                this.setupBackupSection();
                break;
        }
    }

    async setupAddClientForm() {
        const form = document.getElementById('add-client-form');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const clientData = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                company: formData.get('company'),
                address: formData.get('address'),
                taxId: formData.get('taxId'),
                notes: formData.get('notes')
            };
            
            try {
                await this.app.clientManager.addClient(clientData);
                this.showNotification('הלקוח נוסף בהצלחה!', 'success');
                form.reset();
                this.showSection('clients');
            } catch (error) {
                this.showNotification(`שגיאה: ${error.message}`, 'error');
            }
        });
    }

    async setupAddDocumentForm() {
        const form = document.getElementById('add-document-form');
        if (!form) return;
        
        // מילוי רשימת הלקוחות
        await this.populateClientSelect();
        
        // מילוי רשימת סוגי המסמכים
        this.populateDocumentTypeSelect();
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const documentData = {
                client: formData.get('client'),
                type: formData.get('type'),
                number: formData.get('number'),
                date: formData.get('date'),
                dueDate: formData.get('dueDate') || '',
                total: parseFloat(formData.get('total')),
                paid: formData.get('paid') === 'true',
                description: formData.get('description'),
                notes: formData.get('notes')
            };
            
            try {
                await this.app.documentManager.addDocument(documentData);
                this.showNotification('המסמך נוסף בהצלחה!', 'success');
                form.reset();
                this.showSection('documents');
            } catch (error) {
                this.showNotification(`שגיאה: ${error.message}`, 'error');
            }
        });
    }

    async populateClientSelect() {
        const select = document.getElementById('document-client');
        if (!select) return;
        
        const clients = this.app.clientManager.getAllClients({ activeOnly: true });
        
        select.innerHTML = `
            <option value="">בחר לקוח</option>
            ${clients.map(client => `
                <option value="${client.name}">
                    ${client.name}${client.company ? ` (${client.company})` : ''}
                </option>
            `).join('')}
        `;
    }

    populateDocumentTypeSelect() {
        const select = document.getElementById('document-type');
        if (!select) return;
        
        select.innerHTML = `
            <option value="">בחר סוג מסמך</option>
            ${AppConfig.documentTypes.map(type => `
                <option value="${type.value}">${type.label}</option>
            `).join('')}
        `;
    }

    async editClient(clientId) {
        const client = this.app.clientManager.getClientById(clientId);
        if (!client) return;
        
        // במקום אמיתי, היינו פותחים מודל עריכה
        // לצורך הדוגמה, נעביר לטופס עריכה
        this.showSection('add-client');
        
        // מחכים לטעינת הטופס
        setTimeout(() => {
            const form = document.getElementById('add-client-form');
            if (form) {
                form.querySelector('[name="name"]').value = client.name || '';
                form.querySelector('[name="email"]').value = client.email || '';
                form.querySelector('[name="phone"]').value = client.phone || '';
                form.querySelector('[name="company"]').value = client.company || '';
                form.querySelector('[name="address"]').value = client.address || '';
                form.querySelector('[name="taxId"]').value = client.taxId || '';
                form.querySelector('[name="notes"]').value = client.notes || '';
                
                // שינוי כפתור השליחה
                const submitBtn = form.querySelector('[type="submit"]');
                submitBtn.textContent = 'עדכון לקוח';
                submitBtn.onclick = async (e) => {
                    e.preventDefault();
                    const formData = new FormData(form);
                    const updates = {
                        name: formData.get('name'),
                        email: formData.get('email'),
                        phone: formData.get('phone'),
                        company: formData.get('company'),
                        address: formData.get('address'),
                        taxId: formData.get('taxId'),
                        notes: formData.get('notes')
                    };
                    
                    try {
                        await this.app.clientManager.updateClient(clientId, updates);
                        this.showNotification('פרטי הלקוח עודכנו בהצלחה!', 'success');
                        this.showSection('clients');
                    } catch (error) {
                        this.showNotification(`שגיאה: ${error.message}`, 'error');
                    }
                };
            }
        }, 100);
    }

    async deleteClient(clientId) {
        if (!confirm('האם אתה בטוח שברצונך למחוק לקוח זה? כל המסמכים שלו יישארו במערכת.')) {
            return;
        }
        
        try {
            await this.app.clientManager.deleteClient(clientId);
            this.showNotification('הלקוח נמחק בהצלחה', 'success');
            await this.loadClientsList();
            this.updateQuickStats();
        } catch (error) {
            this.showNotification(`שגיאה: ${error.message}`, 'error');
        }
    }

    filterClients(searchTerm) {
        const clients = this.app.clientManager.searchClients(searchTerm);
        const container = document.getElementById('clients-list');
        
        if (!container) return;
        
        if (clients.length === 0) {
            container.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-search me-2"></i>
                    לא נמצאו לקוחות התואמים לחיפוש.
                </div>
            `;
            return;
        }
        
        // הצגת הלקוחות המסוננים
        // (בפועל, היינו משתמשים ב-virtual DOM או re-render)
        this.loadClientsList();
    }

    applyClientFilter(filter) {
        // החלת מסנן על רשימת הלקוחות
        // (בפועל, היינו מעדכנים את ה-state ומרינדרים מחדש)
        this.loadClientsList();
    }

    updateQuickStats() {
        const stats = this.app.getStats();
        
        const quickClients = document.getElementById('quick-clients-count');
        const quickDocs = document.getElementById('quick-docs-count');
        const quickPaid = document.getElementById('quick-paid-total');
        
        if (quickClients) quickClients.textContent = stats.totalClients;
        if (quickDocs) quickDocs.textContent = stats.totalDocuments;
        if (quickPaid) quickPaid.textContent = `₪${stats.paidTotal.toLocaleString()}`;
    }

    showNotification(message, type = 'info') {
        // יצירת התראה
        const notification = document.createElement('div');
        notification.className = `notification alert alert-${type} alert-dismissible fade show`;
        notification.innerHTML = `
            <i class="bi bi-${this.getNotificationIcon(type)} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // הוספה לדף
        document.body.appendChild(notification);
        
        // הסרה אוטומטית אחרי 5 שניות
        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    async exportData() {
        const data = this.app.storage.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `bizmanager_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('הנתונים יוצאו בהצלחה!', 'success');
    }

    async importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            if (!confirm('ייבוא הנתונים ימחק את כל הנתונים הקיימים. האם להמשיך?')) {
                return;
            }
            
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                await this.app.storage.importData(data);
                this.showNotification('הנתונים יובאו בהצלחה!', 'success');
                
                // רענון הנתונים
                this.app.clientManager.clients = this.app.storage.getClients();
                this.app.documentManager.documents = this.app.storage.getDocuments();
                this.showSection('dashboard');
                
            } catch (error) {
                this.showNotification(`שגיאה בייבוא: ${error.message}`, 'error');
            }
        };
        
        input.click();
    }

    async setupBackupSection() {
        // טעינת רשימת הגיבויים
        const backups = this.app.storage.getBackups();
        const container = document.getElementById('backups-list');
        
        if (container) {
            if (backups.length === 0) {
                container.innerHTML = '<p class="text-muted">אין גיבויים שמורים</p>';
            } else {
                container.innerHTML = backups.map(backup => `
                    <div class="card mb-3">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-1">גיבוי #${backup.id.substring(0, 8)}</h6>
                                    <small class="text-muted">
                                        ${ValidationService.formatDate(backup.timestamp)}
                                    </small>
                                </div>
                                <button class="btn btn-sm btn-outline-primary" 
                                        onclick="app.uiManager.restoreBackup('${backup.id}')">
                                    <i class="bi bi-download"></i> שחזור
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    async restoreBackup(backupId) {
        const backups = this.app.storage.getBackups();
        const backup = backups.find(b => b.id === backupId);
        
        if (!backup) {
            this.showNotification('גיבוי לא נמצא', 'error');
            return;
        }
        
        if (!confirm('שחזור גיבוי זה ימחק את כל הנתונים הנוכחיים. האם להמשיך?')) {
            return;
        }
        
        try {
            await this.app.storage.importData(backup.data);
            this.showNotification('הגיבוי שוחזר בהצלחה!', 'success');
            
            // רענון הנתונים
            this.app.clientManager.clients = this.app.storage.getClients();
            this.app.documentManager.documents = this.app.storage.getDocuments();
            this.showSection('dashboard');
            
        } catch (error) {
            this.showNotification(`שגיאה בשחזור: ${error.message}`, 'error');
        }
    }
}
