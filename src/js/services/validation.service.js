export class ValidationService {
    static validateClient(client) {
        const errors = [];
        
        if (!client.name || client.name.trim() === '') {
            errors.push('שם הלקוח הוא שדה חובה');
        }
        
        if (client.email && !this.isValidEmail(client.email)) {
            errors.push('כתובת האימייל אינה תקינה');
        }
        
        if (client.phone && !this.isValidPhone(client.phone)) {
            errors.push('מספר הטלפון אינו תקין');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static validateDocument(document) {
        const errors = [];
        
        if (!document.client || document.client.trim() === '') {
            errors.push('יש לבחור לקוח');
        }
        
        if (!document.type || document.type.trim() === '') {
            errors.push('יש לבחור סוג מסמך');
        }
        
        if (!document.total || document.total <= 0) {
            errors.push('סכום המסמך חייב להיות גדול מ-0');
        }
        
        if (!document.date || document.date.trim() === '') {
            errors.push('תאריך המסמך הוא שדה חובה');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static isValidPhone(phone) {
        const re = /^[\d\s\-\+\(\)]{8,}$/;
        return re.test(phone.replace(/\s/g, ''));
    }

    static isValidTaxId(taxId) {
        if (!taxId) return true;
        const re = /^\d{9}$/;
        return re.test(taxId);
    }

    static formatPhone(phone) {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 9) {
            return cleaned.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3');
        } else if (cleaned.length === 10) {
            return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
        }
        return phone;
    }

    static formatCurrency(amount) {
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS'
        }).format(amount);
    }

    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}
