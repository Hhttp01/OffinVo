const DB = {
    save: (key, data) => {
        localStorage.setItem(`flowpro_${key}`, JSON.stringify(data));
    },
    load: (key) => {
        const data = localStorage.getItem(`flowpro_${key}`);
        return data ? JSON.parse(data) : null;
    }
};
