let clients = DB.load('clients') || [];
let history = DB.load('history') || [];
let settings = DB.load('settings') || { businessName: 'העסק שלי', businessID: '', email: '', phone: '', address: '', logoUrl: '', signatureUrl: '' };
let activeClient = null;
let currentItems = [];
let customerSearchTerm = "";
let docSearchTerm = ""; // חיפוש בתוך כרטיס לקוח

function router(page, data = null) {
    const main = document.getElementById('app-content');
    document.getElementById('preview-modal').classList.add('hidden');

    if (page === 'dashboard') main.innerHTML = renderDashboard();
    else if (page === 'customers') main.innerHTML = renderCustomersPage();
    else if (page === 'client-detail') main.innerHTML = renderClientDetail(data); // דף חדש
    else if (page === 'create') { currentItems = []; main.innerHTML = renderCreatePage(); }
    else if (page === 'history') main.innerHTML = renderHistoryPage();
    else if (page === 'settings') main.innerHTML = renderSettingsPage();
    else if (page === 'reports') main.innerHTML = renderReportsPage();
    
    window.scrollTo(0,0);
}

// --- כרטיס לקוח מפורט ---
function renderClientDetail(index) {
    activeClient = clients[index];
    const clientDocs = history.filter(h => h.client === activeClient.name);
    
    // סינון חיפוש בתוך המסמכים של הלקוח
    const filteredDocs = clientDocs.filter(d => 
        d.date.includes(docSearchTerm) || 
        d.total.toString().includes(docSearchTerm) ||
        d.type.includes(docSearchTerm)
    );

    const paidTotal = clientDocs.filter(d => d.paid).reduce((sum, d) => sum + d.total, 0);
    const pendingTotal = clientDocs.filter(d => !d.paid).reduce((sum, d) => sum + d.total, 0);

    const docList = filteredDocs.map((h, i) => `
        <div class="card mb-3 flex justify-between items-center border-r-4 ${h.paid ? 'border-emerald-500' : 'border-orange-500'}">
            <div>
                <p class="text-[10px] text-slate-400 font-bold">${h.date}</p>
                <h4 class="font-bold text-slate-800">${h.type}</h4>
                <p class="text-[10px] ${h.paid ? 'text-emerald-600' : 'text-orange-600'} font-bold uppercase">${h.paid ? 'סגור (שולם)' : 'פתוח (חוב)'}</p>
            </div>
            <div class="text-left">
                <p class="font-black text-lg italic">₪${h.total.toLocaleString()}</p>
                <button onclick="togglePaidInDetail(${history.indexOf(h)}, ${index})" class="text-[9px] px-2 py-1 rounded bg-slate-100 font-bold mt-1">שנה סטטוס</button>
            </div>
        </div>
    `).join('');

    return `
        <div class="animate-in fade-in space-y-4">
            <button onclick="router('customers')" class="text-blue-600 font-bold text-sm mb-2"><i class="fas fa-arrow-right ml-1"></i> חזור ללקוחות</button>
            
            <div class="card bg-slate-900 text-white">
                <h2 class="text-2xl font-black italic">${activeClient.name}</h2>
                <p class="opacity-60 text-sm">${activeClient.phone}</p>
                <div class="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-800 text-center">
                    <div><p class="text-[10px] uppercase opacity-50">סה"כ סגור</p><p class="text-xl font-black text-emerald-400">₪${paidTotal.toLocaleString()}</p></div>
                    <div><p class="text-[10px] uppercase opacity-50">סה"כ פתוח</p><p class="text-xl font-black text-orange-400">₪${pendingTotal.toLocaleString()}</p></div>
                </div>
            </div>

            <div class="flex gap-2">
                <button onclick="router('create')" class="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg">הנפק מסמך חדש</button>
            </div>

            <div class="relative mt-6">
                <i class="fas fa-search absolute right-4 top-4 text-slate-300"></i>
                <input type="text" placeholder="חיפוש מסמך לפי תאריך או סכום..." 
                    class="w-full p-4 pr-12 rounded-2xl border-none shadow-sm bg-white font-bold outline-none"
                    oninput="docSearchTerm = this.value; router('client-detail', ${index})">
            </div>

            <div class="space-y-2">
                <p class="text-xs font-black text-slate-400 uppercase italic">היסטוריית עסקאות:</p>
                ${docList || '<p class="text-center py-10 opacity-30 italic">לא נמצאו מסמכים תואמים</p>'}
            </div>
        </div>
    `;
}

// פונקציית עזר לעדכון סטטוס מתוך כרטיס לקוח
function togglePaidInDetail(historyIndex, clientIndex) {
    history[historyIndex].paid = !history[historyIndex].paid;
    DB.save('history', history);
    router('client-detail', clientIndex);
}

// עדכון רשימת הלקוחות הראשית שתפתח את הכרטיס
function renderCustomersPage() {
    const filtered = clients.filter(c => c.name.includes(customerSearchTerm) || c.phone.includes(customerSearchTerm));
    let list = filtered.map((c, i) => `
        <div class="card flex justify-between items-center mb-3 animate-in fade-in" onclick="router('client-detail', ${clients.indexOf(c)})">
            <div><p class="font-black text-slate-800 text-lg">${c.name}</p><p class="text-xs text-slate-400 font-bold">${c.phone}</p></div>
            <i class="fas fa-chevron-left text-slate-200"></i>
        </div>
    `).join('');

    return `
        <div class="space-y-4">
            <div class="flex justify-between items-center"><h2 class="text-2xl font-black italic">לקוחות</h2><button onclick="addClientPrompt()" class="bg-blue-600 text-white px-5 py-2 rounded-full font-bold text-xs shadow-lg">+ הוספה</button></div>
            <div class="relative"><i class="fas fa-search absolute right-4 top-4 text-slate-300"></i><input type="text" placeholder="חפש לקוח..." class="w-full p-4 pr-12 rounded-2xl border-none shadow-sm bg-white font-bold outline-none" oninput="customerSearchTerm = this.value; router('customers')"></div>
            <div id="customer-list-container">${list || '<p class="text-center py-10 opacity-30">אין לקוחות</p>'}</div>
        </div>
    `;
}
