// נתונים
let clients = DB.load('clients') || [];
let history = DB.load('history') || [];
let activeClient = null;

// ניווט ראשי
function router(page) {
    const main = document.getElementById('app-content');
    if (!main) return;

    // סגירת מודאלים פתוחים
    const modal = document.getElementById('preview-modal');
    if(modal) modal.classList.add('hidden');

    // עדכון ויזואלי של התפריט
    document.querySelectorAll('.nav-link').forEach(btn => {
        btn.classList.replace('text-blue-600', 'text-slate-400');
        if (btn.getAttribute('onclick').includes(page)) {
            btn.classList.replace('text-slate-400', 'text-blue-600');
        }
    });

    // הזרקת תוכן
    if (page === 'dashboard') main.innerHTML = renderDashboard();
    else if (page === 'customers') main.innerHTML = renderCustomersPage();
    else if (page === 'create') main.innerHTML = renderCreatePage();
    else if (page === 'history') main.innerHTML = renderHistoryPage();
    
    window.scrollTo(0,0);
}

// דשבורד
function renderDashboard() {
    const total = history.reduce((sum, h) => sum + (h.total || 0), 0);
    return `
        <div class="space-y-6">
            <h2 class="text-2xl font-black text-slate-800">סיכום כללי</h2>
            <div class="grid grid-cols-1 gap-4">
                <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex justify-between items-center">
                    <div><p class="text-xs font-bold text-slate-400">הכנסות</p><p class="text-3xl font-black text-blue-600">₪${total.toLocaleString()}</p></div>
                    <i class="fas fa-wallet text-blue-100 text-3xl"></i>
                </div>
                <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex justify-between items-center">
                    <div><p class="text-xs font-bold text-slate-400">מסמכים</p><p class="text-3xl font-black text-slate-800">${history.length}</p></div>
                    <i class="fas fa-file-alt text-slate-100 text-3xl"></i>
                </div>
            </div>
            <button onclick="router('create')" class="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-xl italic">הנפק מסמך חדש +</button>
        </div>
    `;
}

// דף לקוחות
function renderCustomersPage() {
    let list = clients.length ? clients.map((c, i) => `
        <div class="bg-white p-5 rounded-2xl mb-3 border border-slate-50 shadow-sm flex justify-between items-center" onclick="selectClientForInvoice(${i})">
            <div><p class="font-bold text-slate-800">${c.name}</p><p class="text-xs text-slate-400">${c.phone}</p></div>
            <button onclick="event.stopPropagation(); deleteClient(${i})" class="text-red-200 hover:text-red-500 p-2"><i class="fas fa-trash"></i></button>
        </div>
    `).join('') : '<p class="text-center py-20 opacity-30 italic">אין לקוחות רשומים</p>';

    return `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-black text-slate-800 uppercase italic">לקוחות</h2>
            <button onclick="addClientPrompt()" class="bg-blue-600 text-white px-5 py-2 rounded-full font-bold text-xs shadow-lg">+ הוספה</button>
        </div>
        ${list}
    `;
}

// דף הנפקה
function renderCreatePage() {
    if (!activeClient) return `
        <div class="py-20 text-center">
            <p class="text-slate-400 mb-4 font-bold">אנא בחר לקוח כדי להתחיל</p>
            <button onclick="router('customers')" class="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-blue-100">לרשימת הלקוחות</button>
        </div>
    `;

    return `
        <h2 class="text-2xl font-black mb-6 text-slate-800">הנפקה ל: ${activeClient.name}</h2>
        <div class="bg-white p-6 rounded-[2rem] shadow-sm space-y-4 border border-slate-50">
            <select id="docType" class="w-full bg-slate-50 p-4 rounded-xl font-bold border-none outline-none">
                <option>חשבונית מס</option><option>הצעת מחיר</option><option>קבלה</option>
            </select>
            <input type="text" id="itemTitle" placeholder="תיאור העבודה" class="w-full border-b p-3 outline-none font-bold focus:border-blue-600 transition-all">
            <div class="grid grid-cols-2 gap-4">
                <input type="number" id="itemPrice" placeholder="מחיר" class="w-full border-b p-3 outline-none font-bold">
                <input type="number" id="taxRate" value="17" class="w-full border-b p-3 outline-none font-bold text-blue-600">
            </div>
            <button onclick="showPreview()" class="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-blue-100">צפה בתצוגה מקדימה</button>
        </div>
    `;
}

// תצוגה מקדימה
function showPreview() {
    const type = document.getElementById('docType').value;
    const title = document.getElementById('itemTitle').value;
    const price = parseFloat(document.getElementById('itemPrice').value) || 0;
    const tax = parseFloat(document.getElementById('taxRate').value) || 0;
    const total = price * (1 + tax/100);

    const modal = document.getElementById('preview-modal');
    modal.innerHTML = `
        <div class="p-6 bg-slate-50 flex justify-between items-center border-b sticky top-0 z-50">
            <button onclick="document.getElementById('preview-modal').classList.add('hidden')" class="font-bold text-slate-400">ביטול</button>
            <button onclick="finalizeAndPrint()" class="bg-blue-600 text-white px-8 py-2 rounded-full font-bold shadow-lg">אשר והדפס</button>
        </div>
        <div class="p-10 max-w-[800px] mx-auto bg-white my-10 shadow-2xl text-right border" id="print-content">
            <div class="flex justify-between items-center border-b-4 border-slate-900 pb-6 mb-10">
                <h1 class="text-3xl font-black italic">Flow<span class="text-blue-600">Pro</span></h1>
                <div class="text-left"><h2 class="text-xl font-bold uppercase">${type}</h2><p class="text-slate-400">מקור</p></div>
            </div>
            <div class="mb-10"><p class="text-[10px] text-blue-600 font-bold uppercase">לכבוד:</p><h3 class="text-2xl font-black">${activeClient.name}</h3><p class="text-slate-500">${activeClient.phone}</p></div>
            <table class="w-full mb-10 border-collapse">
                <tr class="bg-slate-900 text-white"><th class="p-4 text-right">תיאור</th><th class="p-4 text-left">סה"כ</th></tr>
                <tr class="border-b"><td class="p-4 font-bold text-slate-700">${title || 'שירות כללי'}</td><td class="p-4 text-left font-bold">₪${price.toLocaleString()}</td></tr>
            </table>
            <div class="flex justify-end text-left"><div class="w-48 space-y-2 font-bold"><div class="flex justify-between text-slate-400 text-xs"><span>מע"מ:</span> <span>${tax}%</span></div><div class="flex justify-between text-xl text-blue-600 border-t pt-2 font-black"><span>לתשלום:</span> <span>₪${total.toLocaleString()}</span></div></div></div>
        </div>
    `;
    modal.classList.remove('hidden');
}

// פונקציות שמירה
function finalizeAndPrint() {
    const price = parseFloat(document.getElementById('itemPrice').value) || 0;
    const tax = parseFloat(document.getElementById('taxRate').value) || 0;
    const total = price * (1 + tax/100);

    history.unshift({
        client: activeClient.name,
        type: document.getElementById('docType').value,
        item: document.getElementById('itemTitle').value,
        total: total,
        date: new Date().toLocaleDateString('he-IL')
    });
    
    DB.save('history', history);
    window.print();
    router('dashboard');
}

function renderHistoryPage() {
    let list = history.length ? history.map(h => `
        <div class="bg-white p-5 rounded-2xl mb-3 border border-slate-50 flex justify-between items-center shadow-sm">
            <div><p class="text-[10px] font-bold text-slate-400">${h.date}</p><p class="font-bold">${h.client}</p><p class="text-[10px] text-blue-500 font-bold">${h.type}</p></div>
            <p class="text-lg font-black text-slate-800">₪${h.total.toLocaleString()}</p>
        </div>
    `).join('') : '<p class="text-center py-20 opacity-30 italic">אין היסטוריית מסמכים</p>';

    return `<h2 class="text-2xl font-black mb-6 text-slate-800">היסטוריה</h2>${list}`;
}

// לוגיקת לקוחות
function addClientPrompt() {
    const name = prompt("שם הלקוח:");
    const phone = prompt("טלפון:");
    if (name && phone) {
        clients.unshift({ name, phone });
        DB.save('clients', clients);
        router('customers');
    }
}

function deleteClient(index) {
    if (confirm("למחוק לקוח?")) {
        clients.splice(index, 1);
        DB.save('clients', clients);
        router('customers');
    }
}

function selectClientForInvoice(index) {
    activeClient = clients[index];
    router('create');
}

// הפעלה בטעינה
window.addEventListener('DOMContentLoaded', () => {
    router('dashboard');
});
