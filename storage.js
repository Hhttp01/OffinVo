const DB = {
    save: (key, data) => {
        localStorage.setItem(`flowpro_${key}`, JSON.stringify(data));
    },
    load: (key) => {
        const data = localStorage.getItem(`flowpro_${key}`);
        return data ? JSON.parse(data) : null;
    },
    exportAll: () => {
        const allData = {
            clients: DB.load('clients') || [],
            history: DB.load('history') || [],
            settings: DB.load('settings') || {}
        };
        const blob = new Blob([JSON.stringify(allData)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_${new Date().toLocaleDateString()}.json`;
        a.click();
    }
};
