export const AppConfig = {
    // הגדרות אפליקציה
    appName: 'BizManager',
    version: '1.0.0',
    env: 'development',
    
    // הגדרות אחסון
    storagePrefix: 'biz_app_',
    maxBackups: 10,
    autoBackupInterval: 24 * 60 * 60 * 1000,
    
    // הגדרות UI
    defaultTheme: 'light',
    defaultLanguage: 'he',
    itemsPerPage: 20,
    
    // הגדרות אבטחה
    enableEncryption: false,
    sessionTimeout: 30 * 60 * 1000,
    
    // הגדרות תאריך
    dateFormat: 'he-IL',
    timeFormat: 'he-IL',
    
    // הגדרות מסמכים
    documentTypes: [
        { value: 'invoice', label: 'חשבונית' },
        { value: 'receipt', label: 'קבלה' },
        { value: 'estimate', label: 'הערכת מחיר' },
        { value: 'contract', label: 'חוזה' },
        { value: 'proforma', label: 'חשבונית זמנית' },
        { value: 'order', label: 'הזמנה' },
        { value: 'other', label: 'אחר' }
    ],
    
    // הגדרות מסננים
    defaultFilters: {
        clients: {
            activeOnly: true,
            sortBy: 'name',
            sortOrder: 'asc'
        },
        documents: {
            dateRange: 'all',
            status: 'all',
            sortBy: 'date',
            sortOrder: 'desc'
        }
    }
};
