let clients = DB.load('clients') || [];
let history = DB.load('history') || [];
let activeClient = null;

function router(page) {
    const main = document.getElementById('app-content');
    if (!main) return;

    document.getElementById('preview-modal').classList.add('hidden');

    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.replace('text-blue-600', 'text-slate-400');
        if (l.innerText.includes(getPageTitle(page))) {
            l.classList.replace('text-slate-400', 'text-blue-600');
        }
    });

    if (page === 'dashboard') main.innerHTML = renderDashboard();
    else if (page === 'customers') main.innerHTML = renderCustomersPage();
    else if (page === 'create') main.innerHTML = renderCreatePage();
    else if (page === 'history') main.innerHTML = renderHistoryPage();
    
    window.scrollTo(0,0);
}

function getPageTitle(page) {
    const titles = { 'dashboard': 'ראשי', 'customers': 'לקוחות', 'create': 'הנפקה', 'history': 'היסטוריה' };
    return titles[page];
}

function renderDashboard() {
    const totalIncome = history.reduce((sum, item) => sum + item.total, 0);
    return `
        <div class="animate-in fade-in duration-300">
            <h2 class="text-2xl font-black mb-6 text-slate-800">דשבורד</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center">
                    <div>
                        <p class="text-xs font-bold text-slate-400 uppercase">סה"כ הכנסות</p>
                        <p class="text-3xl font-black text-blue-600">₪${totalIncome.toLocaleString()}</p>
                    </div>
                    <div class="bg-blue-50 p-4 rounded-2xl text-blue-500"><i class="fas fa-shekel-sign text-xl"></i></div>
                </div>
                <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center">
                    <div>
                        <p class="text-xs font-bold text-slate-400 uppercase">מסמכים שהופקו</p>
                        <p class="text-3xl font-black text-slate-800">${history.length}</p>
                    </div>
                    <div class="bg-slate-50 p-4 rounded-2xl text-slate-400"><i class="fas fa-file-invoice text-xl"></i></div>
                </div>
            </div>
            <button onclick="router('create')" class="w-full bg-slate-900 text-white p-5 rounded-2xl font-black shadow-lg">הנפק מסמך חדש</button>
        </div>
    `;
}

function renderCustomersPage() {
    let listHTML = clients.length === 0 
        ? `<div class="bg-white p-10 rounded-3xl text-center text-slate-400 italic border border-dashed">אין לקוחות במערכת</div>`
        : clients.map((c, i) => `
            <div class="bg-white p-5 rounded-2xl mb-3 border border-slate-100 shadow-sm flex justify-between items-center cursor-pointer hover:border-blue-300" onclick="selectClientForInvoice(${i})">
                <div><h3 class="font-bold text-slate-800">${c.name}</h3><p class="text-xs text-slate-400">${c.phone}</p></div>
                <div class="flex gap-3">
                    <button onclick="event.stopPropagation(); deleteClient(${i})" class="text-red-200 hover:text-red-500"><i class="fas fa-trash-alt"></i></button>
                    <i class="fas fa-chevron-left text-slate-200"></i>
                </div>
            </div>
        `).join('');

    return `
        <div class="animate-in fade-in duration-300">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-black text-slate-800">לקוחות</h2>
                <button onclick="addClientPrompt()" class="bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-blue-100">+ הוסף לקוח</button>
            </div>
            ${listHTML}
        </div>
    `;
}

function renderCreatePage() {
    if (!activeClient) return `<div class="py-20 text-center"><h2 class="text-xl font-bold mb-4">בחר לקוח מהרשימה</h2><button onclick="router('customers')" class="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold">לרשימת הלקוחות</button></div>`;

    return `
        <div class="animate-in fade-in duration-300">
            <h2 class="text-2xl font-black mb-6 text-slate-800 italic">הנפקה ל: ${activeClient.name}</h2>
            <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <select id="docType" class="w-full bg-slate-50 p-4 rounded-xl font-bold border-none outline-none">
                    <option>חשבונית מס</option><option>הצעת מחיר</option><option>קבלה</option>
                </select>
                <input type="text" id="itemTitle" placeholder="תיאור העבודה" class="w-full border-b-2 p-3 outline-none font-bold">
                <div class="grid grid-cols-2 gap-4">
                    <input type="number" id="itemPrice" placeholder="מחיר" class="w-full border-b-2 p-3 outline-none font-bold">
                    <input type="number" id="taxRate" value="17" class="w-full border-b-2 p-3 outline-none font-bold text-blue-600">
                </div>
                <button onclick="showPreview()" class="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-lg shadow-blue-100 mt-4">תצוגה מקדימה</button>
            </div>
        </div>
    `;
}

function showPreview() {
    const type = document.getElementById('docType').value;
    const title = document.getElementById('itemTitle').value;
    const price = parseFloat(document.getElementById('itemPrice').value) || 0;
    const tax = parseFloat(document.getElementById('taxRate').value) || 0;
    const taxAmount = price * (tax / 100);
    const total = price + taxAmount;

    const modal = document.getElementById('preview-modal');
    modal.innerHTML = `
        <div class="p-6 no-print bg-slate-100 flex justify-between items-center sticky top-0 border-b">
            <button onclick="document.getElementById('preview-modal').classList.add('hidden')" class="font-bold text-slate-500">ביטול</button>
            <button onclick="finalizeAndPrint()" class="bg-blue-600 text-white px-8 py-2 rounded-full font-bold">אישור והדפסה</button>
        </div>
        <div class="p-10 max-w-[800px] mx-auto bg-white shadow-xl my-10 min-h-[1000px] text-right">
            <div class="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-10">
                <h1 class="text-3xl font-black text-blue-600 italic">FlowPro</h1>
                <div class="text-left"><h2 class="text-2xl font-bold">${type}</h2><p class="text-slate-400">#1001</p></div>
            </div>
            <div class="mb-10">
                <p class="text-xs font-bold text-blue-600 uppercase">לקוח:</p>
                <h3 class="text-2xl font-black">${activeClient.name}</h3>
                <p class="text-slate-500">${activeClient.phone}</p>
            </div>
            <table class="w-full mb-10">
                <tr class="bg-slate-900 text-white">
                    <th class="p-4 text-right">תיאור השירות</th>
                    <th class="p-4 text-left">סכום</th>
                </tr>
                <tr class="border-b">
                    <td class="p-4 font-bold">${title || 'שירות'}</td>
                    <td class="p-4 text-left font-bold">₪${price.toLocaleString()}</td>
                </tr>
            </table>
            <div class="flex justify-end">
                <div class="w-64 space-y-2">
                    <div class="flex justify-between"><span>סה"כ:</span> <span>₪${price.toLocaleString()}</span></div>
                    <div class="flex justify-between border-b pb-2"><span>מע"מ (${tax}%):</span> <span>₪${taxAmount.toLocaleString()}</span></div>
                    <div class="flex justify-between text-2xl font-black text-blue-600 pt-2"><span>לתשלום:</span> <span>₪${total.toLocaleString()}</span></div>
                </div>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
}

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
    let historyHTML = history.length === 0
        ? `<div class="bg-white p-10 rounded-3xl text-center text-slate-400 italic border">טרם הופקו מסמכים</div>`
        : history.map(h => `
            <div class="bg-white p-5 rounded-2xl mb-3 border border-slate-100 flex justify-between items-center shadow-sm">
                <div><p class="text-[10px] font-bold text-slate-400">${h.date} | ${h.type}</p><h3 class="font-bold">${h.client}</h3></div>
                <p class="text-lg font-black text-blue-600">₪${h.total.toLocaleString()}</p>
            </div>
        `).join('');

    return `<div class="animate-in fade-in duration-300"><h2 class="text-2xl font-black mb-6 text-slate-800">היסטוריה</h2>${historyHTML}</div>`;
}

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
    if (confirm("למחוק?")) {
        clients.splice(index, 1);
        DB.save('clients', clients);
        router('customers');
    }
}

function selectClientForInvoice(index) {
    activeClient = clients[index];
    router('create');
}

window.onload = () => router('dashboard');
