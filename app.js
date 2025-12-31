// נתונים ראשוניים
let clients = DB.load('clients') || [];
let history = DB.load('history') || [];
let activeClient = null;

// פונקציית הניווט הראשית
function router(page) {
    const main = document.getElementById('app-content');
    if (!main) return;

    // עדכון כפתורי תפריט
    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.remove('text-blue-600');
        l.classList.add('text-slate-400');
    });

    // הזרקת תוכן לפי הדף שנבחר
    if (page === 'dashboard') {
        main.innerHTML = renderDashboard();
    } else if (page === 'customers') {
        main.innerHTML = renderCustomersPage();
    } else if (page === 'create') {
        main.innerHTML = renderCreatePage();
    } else if (page === 'history') {
        main.innerHTML = renderHistoryPage();
    }
}

// דף הבית - דשבורד
function renderDashboard() {
    const totalIncome = history.reduce((sum, item) => sum + item.total, 0);
    return `
        <div class="page-fade-in">
            <h2 class="text-2xl font-black mb-6 uppercase tracking-tighter text-slate-800">דשבורד</h2>
            <div class="grid grid-cols-1 gap-4 mb-6">
                <div class="card flex justify-between items-center">
                    <div>
                        <p class="text-xs font-bold text-slate-400 uppercase">הכנסות</p>
                        <p class="text-3xl font-black text-blue-600">₪${totalIncome.toLocaleString()}</p>
                    </div>
                    <i class="fas fa-shekel-sign text-slate-100 text-4xl"></i>
                </div>
                <div class="card flex justify-between items-center">
                    <div>
                        <p class="text-xs font-bold text-slate-400 uppercase">מסמכים</p>
                        <p class="text-3xl font-black text-slate-800">${history.length}</p>
                    </div>
                    <i class="fas fa-file-invoice text-slate-100 text-4xl"></i>
                </div>
            </div>
            <button onclick="router('create')" class="w-full bg-blue-600 text-white p-5 rounded-2xl font-black shadow-lg shadow-blue-100">
                <i class="fas fa-plus ml-2"></i> הנפק מסמך חדש
            </button>
        </div>
    `;
}

// דף לקוחות
function renderCustomersPage() {
    let listHTML = clients.length === 0 
        ? `<div class="card text-center text-slate-400 italic py-10">אין לקוחות. לחץ על הכפתור למעלה להוספה.</div>`
        : clients.map((c, i) => `
            <div class="card flex justify-between items-center mb-3" onclick="selectClientForInvoice(${i})">
                <div><h3 class="font-black">${c.name}</h3><p class="text-xs text-slate-400">${c.phone}</p></div>
                <i class="fas fa-chevron-left text-slate-200"></i>
            </div>
        `).join('');

    return `
        <div class="page-fade-in">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-black">לקוחות</h2>
                <button onclick="addClientPrompt()" class="bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-bold">+ לקוח חדש</button>
            </div>
            ${listHTML}
        </div>
    `;
}

// פונקציות עזר
function addClientPrompt() {
    const name = prompt("שם הלקוח:");
    const phone = prompt("טלפון:");
    if (name && phone) {
        clients.unshift({ name, phone });
        DB.save('clients', clients);
        router('customers');
    }
}

function selectClientForInvoice(index) {
    activeClient = clients[index];
    router('create');
}

// אתחול האפליקציה בטעינה
window.onload = () => {
    router('dashboard'); // מתחיל בדשבורד כדי שתראה את הנתונים מיד
};
