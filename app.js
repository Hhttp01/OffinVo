// ניהול דפים (Router)
function router(page) {
    const main = document.getElementById('app-content');
    
    // ניקוי כפתורי תפריט
    document.querySelectorAll('.nav-link').forEach(l => l.classList.replace('text-blue-600', 'text-slate-400'));
    
    if (page === 'customers') {
        main.innerHTML = renderCustomersPage();
    } else if (page === 'create') {
        main.innerHTML = renderCreatePage();
    } else if (page === 'history') {
        main.innerHTML = renderHistoryPage();
    }
}

// פונקציות עזר ליצירת HTML (נמלא אותן בעדכון הבא)
function renderCustomersPage() {
    return `<div class="page-fade-in">
        <h2 class="text-2xl font-black mb-6 italic text-slate-800 uppercase tracking-tighter">מאגר לקוחות</h2>
        <div id="clients-list" class="space-y-4">
            </div>
    </div>`;
}

function renderCreatePage() {
    return `<div class="page-fade-in">
        <h2 class="text-2xl font-black mb-6 italic text-slate-800">הנפקה חדשה</h2>
        <div class="card italic text-slate-400 text-center">בחר לקוח כדי להתחיל...</div>
    </div>`;
}

function renderHistoryPage() {
    return `<div class="page-fade-in">
        <h2 class="text-2xl font-black mb-6 italic text-slate-800">היסטוריית מסמכים</h2>
    </div>`;
}

// אתחול האפליקציה
window.onload = () => router('customers');
