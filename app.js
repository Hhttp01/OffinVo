// משתנים גלובליים
let clients = DB.load('clients') || [];
let history = DB.load('history') || [];
let activeClient = null;

// ניהול דפים (Router)
function router(page) {
    const main = document.getElementById('app-content');
    
    // ניקוי ועדכון ויזואלי של התפריט התחתון
    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.replace('text-blue-600', 'text-slate-400');
        if (l.getAttribute('onclick').includes(page)) {
            l.classList.replace('text-slate-400', 'text-blue-600');
        }
    });
    
    // טעינת התוכן הרלוונטי
    switch(page) {
        case 'customers': main.innerHTML = renderCustomersPage(); break;
        case 'create': main.innerHTML = renderCreatePage(); break;
        case 'history': main.innerHTML = renderHistoryPage(); break;
    }
    window.scrollTo(0,0);
}

// --- דף לקוחות ---
function renderCustomersPage() {
    let listHTML = clients.length === 0 
        ? `<div class="card text-center text-slate-400 italic py-10">אין לקוחות במאגר. לחץ על הפלוס למטה להוספה.</div>`
        : clients.map((c, i) => `
            <div class="card flex justify-between items-center mb-3 hover:border-blue-500 cursor-pointer" onclick="selectClientForInvoice(${i})">
                <div>
                    <h3 class="font-black text-slate-800">${c.name}</h3>
                    <p class="text-xs text-slate-400"><i class="fas fa-phone ml-1"></i>${c.phone}</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="event.stopPropagation(); deleteClient(${i})" class="text-slate-300 hover:text-red-500 p-2"><i class="fas fa-trash"></i></button>
                    <i class="fas fa-chevron-left text-slate-200"></i>
                </div>
            </div>
        `).join('');

    return `
        <div class="page-fade-in">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-black italic text-slate-800 uppercase tracking-tighter">מאגר לקוחות</h2>
                <button onclick="addClientPrompt()" class="bg-blue-600 text-white px-4 py-2 rounded-full font-bold text-xs shadow-lg shadow-blue-100">+ לקוח חדש</button>
            </div>
            ${listHTML}
        </div>
    `;
}

// --- דף הנפקה ---
function renderCreatePage() {
    if (!activeClient) {
        return `
            <div class="page-fade-in flex flex-col items-center justify-center py-20 text-center">
                <div class="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center text-slate-300 mb-4">
                    <i class="fas fa-user-plus text-3xl"></i>
                </div>
                <h2 class="text-xl font-black text-slate-800 mb-2">טרם נבחר לקוח</h2>
                <p class="text-sm text-slate-400 mb-6">בחר לקוח מרשימת הלקוחות כדי להפיק מסמך</p>
                <button onclick="router('customers')" class="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold">לרשימת הלקוחות</button>
            </div>
        `;
    }

    return `
        <div class="page-fade-in">
            <h2 class="text-2xl font-black mb-6 italic text-slate-800">הנפקה ללקוח: ${activeClient.name}</h2>
            
            <div class="card space-y-5">
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase">סוג מסמך</label>
                    <select id="docType" class="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none font-bold">
                        <option>חשבונית מס</option>
                        <option>הצעת מחיר</option>
                        <option>קבלה</option>
                    </select>
                </div>

                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase">תיאור העבודה</label>
                    <input type="text" id="itemTitle" placeholder="למשל: בניית אתר אינטרנט" class="w-full border-b-2 p-3 outline-none focus:border-blue-600 font-bold">
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase">סכום (לפני מע"מ)</label>
                        <input type="number" id="itemPrice" placeholder="0.00" class="w-full border-b-2 p-3 outline-none font-bold">
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase">מע"מ (%)</label>
                        <input type="number" id="taxRate" value="17" class="w-full border-b-2 p-3 outline-none font-bold text-blue-600">
                    </div>
                </div>

                <button onclick="finalizeInvoice()" class="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl mt-4">צור מסמך עכשיו</button>
            </div>
        </div>
    `;
}

// --- דף היסטוריה ---
function renderHistoryPage() {
    let historyHTML = history.length === 0
        ? `<div class="card text-center text-slate-400 italic py-10">טרם הופקו מסמכים.</div>`
        : history.map(h => `
            <div class="card mb-3 border-r-4 border-blue-600">
