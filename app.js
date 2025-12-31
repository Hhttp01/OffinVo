// --- לוגיקת גלגול מסמכים (Workflow) ---
function getNextDocType(currentType) {
    if (currentType === 'הצעת מחיר') return 'חשבונית מס';
    if (currentType === 'חשבונית מס') return 'קבלה';
    return null; // קבלה היא השלב הסופי
}

function promoteDocument(historyIndex, clientIndex) {
    const doc = history[historyIndex];
    const nextType = getNextDocType(doc.type);

    if (!nextType) {
        // אם זה כבר קבלה, רק נשנה סטטוס תשלום
        doc.paid = !doc.paid;
        DB.save('history', history);
        router('client-detail', clientIndex);
        return;
    }

    if (confirm(`האם להפוך את ה${doc.type} ל-${nextType}?`)) {
        // גלגול המסמך: משנים את הסוג ומסמנים כלא שולם (כי חשבונית/קבלה דורשות סגירה)
        doc.type = nextType;
        
        // אם הפכנו לקבלה, זה אוטומטית מסומן כ"שולם"
        if (nextType === 'קבלה') {
            doc.paid = true;
        }

        DB.save('history', history);
        router('client-detail', clientIndex);
    }
}

// --- עדכון התצוגה בכרטיס לקוח ---
function renderClientDetail(index) {
    activeClient = clients[index];
    const clientDocs = history.filter(h => h.client === activeClient.name);
    
    const filteredDocs = clientDocs.filter(d => 
        d.date.includes(docSearchTerm) || 
        d.total.toString().includes(docSearchTerm) ||
        d.type.includes(docSearchTerm)
    );

    const paidTotal = clientDocs.filter(d => d.paid).reduce((sum, d) => sum + d.total, 0);
    const pendingTotal = clientDocs.filter(d => !d.paid).reduce((sum, d) => sum + d.total, 0);

    const docList = filteredDocs.map((h, i) => {
        const historyIdx = history.indexOf(h);
        const nextStep = getNextDocType(h.type);
        
        return `
            <div class="card mb-3 flex justify-between items-center border-r-4 ${h.paid ? 'border-emerald-500' : 'border-orange-500'}">
                <div>
                    <p class="text-[10px] text-slate-400 font-bold">${h.date}</p>
                    <h4 class="font-bold text-slate-800">${h.type}</h4>
                    <p class="text-[10px] ${h.paid ? 'text-emerald-600' : 'text-orange-600'} font
