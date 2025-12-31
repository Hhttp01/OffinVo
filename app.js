let clients = DB.load('clients') || [];
let history = DB.load('history') || [];
let settings = DB.load('settings') || { businessName: 'העסק שלי', businessID: '', email: '', phone: '', address: '', logoUrl: '', signatureUrl: '' };
let activeClient = null;
let currentItems = [];
let customerSearchTerm = "";

function router(page) {
    const main = document.getElementById('app-content');
    document.getElementById('preview-modal').classList.add('hidden');

    if (page === 'dashboard') main.innerHTML = renderDashboard();
    else if (page === 'customers') main.innerHTML = renderCustomersPage();
    else if (page === 'create') { currentItems = []; main.innerHTML = renderCreatePage(); }
    else if (page === 'history') main.innerHTML = renderHistoryPage();
    else if (page === 'settings') main.innerHTML = renderSettingsPage();
    else if (page === 'reports') main.innerHTML = renderReportsPage();
    
    window.scrollTo(0,0);
}

// --- 1. שיתוף PDF ו-Web Share ---
async function sharePDF() {
    const element = document.getElementById('print-area');
    const opt = {
        margin: 0.2,
        filename: `document_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
    const file = new File([pdfBlob], `${document.getElementById('docType').value}_${activeClient.name}.pdf`, { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: 'מסמך עסקי',
                text: `מצורף מסמך מאת ${settings.businessName}`
            });
        } catch (err) {
            console.log("שיתוף בוטל או נכשל");
        }
    } else {
        html2pdf().set(opt).from(element).save();
        alert("הדפדפן לא תומך בשיתוף קבצים - הקובץ הורד למכשיר");
    }
}

// --- 2. ייצוא לגיבוי (CSV/Excel) ---
function exportToExcel() {
    if (history.length === 0) return alert("אין נתונים לייצוא");
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // תמיכה בעברית
    csvContent += "תאריך,לקוח,סוג מסמך,סכום כולל,סטטוס תשלום\n";
    
    history.forEach(h => {
        const row = [h.date, h.client, h.type, h.total, h.paid ? "שולם" : "חוב"].join(",");
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `גיבוי_הכנסות_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
}

// --- 3. חיפוש לקוחות חכם ---
function renderCustomersPage() {
    const filtered = clients.filter(c => 
        c.name.includes(customerSearchTerm) || c.phone.includes(customerSearchTerm)
    );

    let list = filtered.map((c, i) => `
        <div class="card flex justify-between items-center mb-3 animate-in fade-in" onclick="selectClientForInvoice(${clients.indexOf(c)})">
            <div><p class="font-black text-slate-800">${c.name}</p><p class="text-xs text-slate-400">${c.phone}</p></div>
            <button onclick="event.stopPropagation(); deleteClient(${clients.indexOf(c)})" class="text-red-200 p-2"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');

    return `
        <div class="space-y-4">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-black italic">לקוחות</h2>
                <button onclick="addClientPrompt()" class="bg-blue-600 text-white px-5 py-2 rounded-full font-bold text-xs shadow-lg">+ הוספה</button>
            </div>
            <div class="relative">
                <i class="fas fa-search absolute right-4 top-4 text-slate-300"></i>
                <input type="text" placeholder="חיפוש לפי שם או טלפון..." 
                    class="w-full p-4 pr-12 rounded-2xl border-none shadow-inner bg-white font-bold outline-none focus:ring-2 focus:ring-blue-100"
                    oninput="customerSearchTerm = this.value; refreshCustomerList()">
            </div>
            <div id="customer-list-container">${list || '<p class="text-center py-10 opacity-30">לא נמצאו לקוחות</p>'}</div>
        </div>
    `;
}

function refreshCustomerList() {
    const container = document.getElementById('customer-list-container');
    if (container) {
        const filtered = clients.filter(c => c.name.includes(customerSearchTerm) || c.phone.includes(customerSearchTerm));
        container.innerHTML = filtered.map((c, i) => `
            <div class="card flex justify-between items-center mb-3 animate-in fade-in" onclick="selectClientForInvoice(${clients.indexOf(c)})">
                <div><p class="font-black text-slate-800">${c.name}</p><p class="text-xs text-slate-400">${c.phone}</p></div>
                <button onclick="event.stopPropagation(); deleteClient(${clients.indexOf(c)})" class="text-red-200 p-2"><i class="fas fa-trash"></i></button>
            </div>
        `).join('') || '<p class="text-center py-10 opacity-30">לא נמצאו לקוחות</p>';
    }
}

// --- פונקציות הליבה (דוחות ותצוגה מקדימה עם שיתוף) ---
function showPreview() {
    if (currentItems.length === 0) return alert("הוסף שורה");
    const subtotal = currentItems.reduce((sum, item) => sum + item.price, 0);
    const tax = subtotal * 0.17;
    const total = subtotal + tax;

    document.getElementById('preview-modal').innerHTML = `
        <div class="p-4 bg-slate-100 flex justify-between items-center sticky top-0 no-print border-b z-50">
            <button onclick="document.getElementById('preview-modal').classList.add('hidden')" class="font-bold text-slate-400">חזור</button>
            <div class="flex gap-2">
                <button onclick="sharePDF()" class="bg-emerald-600 text-white px-4 py-2 rounded-full font-bold text-xs shadow-md"><i class="fab fa-whatsapp ml-1"></i> שתף PDF</button>
                <button onclick="finalizeAndPrint()" class="bg-blue-600 text-white px-4 py-2 rounded-full font-bold text-xs shadow-md">שמור והדפס</button>
            </div>
        </div>
        <div id="print-area" class="invoice-paper p-12 max-w-[800px] mx-auto bg-white my-5 text-right border shadow-lg min-h-[1000px]">
            <div class="flex justify-between items-start border-b-2 pb-6 mb-8">
                <div>
                    ${settings.logoUrl ? `<img src="${settings.logoUrl}" class="h-20 mb-2">` : `<h1 class="text-3xl font-black text-blue-600 italic uppercase">${settings.businessName}</h1>`}
                    <p class="text-[10px] text-slate-500 font-bold">${settings.businessName} | ע.מ: ${settings.businessID}</p>
                    <p class="text-[10px] text-slate-400">${settings.phone}</p>
                </div>
                <div class="text-left font-bold">
                    <h2 class="text-3xl font-black text-slate-800">${document.getElementById('docType').value}</h2>
                    <p class="text-slate-300 text-xs mt-1">מספר: #${Date.now().toString().slice(-6)}</p>
                    <p class="text-slate-400 text-xs">${new Date().toLocaleDateString('he-IL')}</p>
                </div>
            </div>
            <div class="mb-10">
                <p class="text-[10px] text-blue-600 font-bold uppercase mb-1">לכבוד:</p>
                <h3 class="text-2xl font-black text-slate-900">${activeClient.name}</h3>
                <p class="text-slate-500 font-bold text-sm">${activeClient.phone}</p>
            </div>
            <table class="w-full mb-10">
                <tr class="bg-slate-900 text-white text-xs uppercase italic"><th class="p-4 text-right">תיאור</th><th class="p-4 text-left">סה"כ</th></tr>
                ${currentItems.map(item => `<tr class="border-b"><td class="p-4 font-bold text-slate-700">${item.title}</td><td class="p-4 text-left font-black">₪${item.price.toLocaleString()}</td></tr>`).join('')}
            </table>
            <div class="flex justify-between items-end mt-20">
                <div>${settings.signatureUrl ? `<p class="text-[10px] text-slate-400 font-bold mb-1 italic">חתימת העסק:</p><img src="${settings.signatureUrl}" class="h-20 opacity-90">` : ''}</div>
                <div class="w-64 space-y-1 font-bold">
                    <div class="flex justify-between text-slate-400 text-xs"><span>סה"כ:</span> <span>₪${subtotal.toLocaleString()}</span></div>
                    <div class="flex justify-between text-slate-400 text-xs border-b pb-2"><span>מע"מ (17%):</span> <span>₪${tax.toLocaleString()}</span></div>
                    <div class="flex justify-between text-2xl text-blue-600 pt-3 font-black italic"><span>לתשלום:</span> <span>₪${total.toLocaleString()}</span></div>
                </div>
            </div>
        </div>
    `;
    document.getElementById('preview-modal').classList.remove('hidden');
}

// --- כל שאר הפונקציות (דשבורד, היסטוריה, הגדרות) נשארות כבעבר ---
function renderDashboard() {
    const totalPaid = history.filter(h => h.paid).reduce((sum, h) => sum + h.total, 0);
    const totalPending = history.filter(h => !h.paid).reduce((sum, h) => sum + h.total, 0);
    return `<div class="space-y-4 animate-in fade-in"><h2 class="text-2xl font-black italic uppercase">תזרים מזומנים</h2><div class="grid grid-cols-2 gap-3"><div class="card border-emerald-100 bg-emerald-50/20"><p class="text-[10px] font-bold text-emerald-600 uppercase">נכנס</p><p class="text-2xl font-black text-emerald-700">₪${totalPaid.toLocaleString()}</p></div><div class="card border-red-100 bg-red-50/20"><p class="text-[10px] font-bold text-red-600 uppercase">חובות</p><p class="text-2xl font-black text-red-700">₪${totalPending.toLocaleString()}</p></div></div><div onclick="router('create')" class="card bg-slate-900 text-white flex justify-between items-center p-8"><div><p class="text-xl font-black italic uppercase">הנפקה חדשה</p></div><i class="fas fa-plus-circle text-3xl text-blue-500"></i></div></div>`;
}

function renderHistoryPage() {
    let list = history.map((h, i) => `<div class="card mb-3 flex justify-between items-center"><div><p class="text-[10px] text-slate-400 font-bold">${h.date}</p><h4 class="font-black text-slate-800">${h.client}</h4><p class="text-[10px] text-blue-500 font-bold">${h.type}</p></div><div class="text-left"><p class="font-black text-lg italic">₪${h.total.toLocaleString()}</p><button onclick="togglePaid(${i})" class="text-[9px] px-3 py-1 rounded-full font-bold mt-1 ${h.paid ? 'status-paid' : 'status-pending'}">${h.paid ? 'שולם' : 'לא שולם'}</button></div></div>`).join('');
    return `<h2 class="text-2xl font-black mb-6 italic">היסטוריה</h2>${list || '<p class="opacity-20 text-center py-20 italic">אין מסמכים</p>'}`;
}

function renderReportsPage() {
    const months = {};
    history.forEach(h => { const m = h.date.split('.')[1] + '/' + h.date.split('.')[2]; months[m] = (months[m] || 0) + h.total; });
    const list = Object.entries(months).map(([m, t]) => `<div class="card flex justify-between items-center mb-2"><span class="font-bold text-slate-500 uppercase">${m}</span><span class="font-black text-blue-600 text-xl italic">₪${t.toLocaleString()}</span></div>`).join('');
    return `<h2 class="text-2xl font-black mb-6 italic uppercase">דוח הכנסות חודשי</h2><div class="space-y-2">${list || '<p class="opacity-20 text-center py-20 italic font-black">אין נתונים</p>'}</div>`;
}

function renderSettingsPage() {
    return `<div class="space-y-4 animate-in fade-in"><h2 class="text-2xl font-black italic uppercase">הגדרות עסק</h2><div class="card space-y-4"><div><label class="text-[10px] font-bold text-slate-400">לינק ללוגו</label><input type="text" id="set-logo" value="${settings.logoUrl || ''}" class="w-full border-b p-2 outline-none font-bold"></div><div><label class="text-[10px] font-bold text-slate-400">לינק לחתימה</label><input type="text" id="set-sig" value="${settings.signatureUrl || ''}" class="w-full border-b p-2 outline-none font-bold"></div><div><label class="text-[10px] font-bold text-slate-400">שם העסק</label><input type="text" id="set-name" value="${settings.businessName}" class="w-full border-b p-2 outline-none font-bold text-lg"></div><div class="grid grid-cols-2 gap-4"><div><label class="text-[10px] font-bold text-slate-400">ח.פ / עוסק</label><input type="text" id="set-id" value="${settings.businessID}" class="w-full border-b p-2 outline-none font-bold"></div><div><label class="text-[10px] font-bold text-slate-400">טלפון</label><input type="text" id="set-phone" value="${settings.phone}" class="w-full border-b p-2 outline-none font-bold"></div></div><button onclick="saveSettings()" class="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl mt-4 italic uppercase tracking-widest">עדכן פרופיל</button></div></div>`;
}

function finalizeAndPrint() { const total = currentItems.reduce((sum, item) => sum + item.price, 0) * 1.17; history.unshift({ client: activeClient.name, type: document.getElementById('docType').value, total: total, date: new Date().toLocaleDateString('he-IL'), paid: false }); DB.save('history', history); window.print(); router('dashboard'); }
function saveSettings() { settings = { businessName: document.getElementById('set-name').value, businessID: document.getElementById('set-id').value, phone: document.getElementById('set-phone').value, logoUrl: document.getElementById('set-logo').value, signatureUrl: document.getElementById('set-sig').value, email: '', address: '' }; DB.save('settings', settings); alert("ההגדרות נשמרו!"); router('dashboard'); }
function addItemRow() { const t = document.getElementById('tempTitle').value, p = parseFloat(document.getElementById('tempPrice').value); if(t && p) { currentItems.push({title:t, price:p}); document.getElementById('tempTitle').value=''; document.getElementById('tempPrice').value=''; renderItemsList(); } }
function renderItemsList() { document.getElementById('items-list').innerHTML = currentItems.map((item, i) => `<div class="card flex justify-between items-center py-3 border-r-4 border-blue-500 shadow-sm"><span class="font-bold text-sm text-slate-700">${item.title}</span><span class="font-black text-slate-900">₪${item.price.toLocaleString()}</span></div>`).join(''); }
function togglePaid(i) { history[i].paid = !history[i].paid; DB.save('history', history); router('history'); }
function addClientPrompt() { const n = prompt("שם:"), p = prompt("טלפון:"); if(n && p) { clients.unshift({name:n, phone:p}); DB.save('clients', clients); router('customers'); } }
function selectClientForInvoice(i) { activeClient = clients[i]; router('create'); }
function deleteClient(i) { if(confirm("למחוק?")) { clients.splice(i,1); DB.save('clients', clients); router('customers'); } }
function renderCreatePage() {
    if (!activeClient) return `<div class="py-20 text-center"><button onclick="router('customers')" class="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg">בחר לקוח להנפקה</button></div>`;
    return `<div class="space-y-4 animate-in slide-in-from-left-4"><h2 class="text-2xl font-black mb-4 italic uppercase">הנפקה: ${activeClient.name}</h2><div class="card space-y-4 mb-4"><select id="docType" class="w-full bg-slate-50 p-4 rounded-xl font-black text-blue-600 outline-none"><option>חשבונית מס</option><option>הצעת מחיר</option><option>קבלה</option></select><div class="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-slate-200"><input type="text" id="tempTitle" placeholder="תיאור" class="w-full bg-transparent border-b mb-3 p-2 outline-none font-bold"><div class="flex gap-2"><input type="number" id="tempPrice" placeholder="מחיר" class="w-1/2 bg-transparent border-b p-2 outline-none font-black text-lg"><button onclick="addItemRow()" class="w-1/2 bg-blue-600 text-white rounded-xl font-black">הוסף שורה</button></div></div></div><div id="items-list" class="space-y-2 mb-6"></div><button onclick="showPreview()" class="w-full bg-slate-900 text-white py-5 rounded-2xl font-black italic shadow-2xl">סיים וצפה במסמך</button></div>`;
}

window.onload = () => router('dashboard');
