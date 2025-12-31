<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>מערכת ניהול עסקי - Workflow</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Assistant', sans-serif; background-color: #f8fafc; }
        .card { background: white; border-radius: 0.75rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); padding: 1.25rem; }
        .btn { transition: all 0.2s; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; border-radius: 0.5rem; padding: 0.5rem 1rem; font-weight: 600; }
        .btn-primary { background-color: #3b82f6; color: white; }
        .btn-primary:hover { background-color: #2563eb; }
        .btn-ghost { background-color: #f1f5f9; color: #475569; }
        .btn-ghost:hover { background-color: #e2e8f0; }
        .badge { padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; }
    </style>
</head>
<body>

<div id="app" class="max-w-4xl mx-auto p-4 md:p-8">
    <!-- Header -->
    <header class="flex justify-between items-center mb-8">
        <div>
            <h1 class="text-3xl font-bold text-slate-800">העסק שלי</h1>
            <p class="text-slate-500">ניהול לקוחות ומסמכים</p>
        </div>
        <div id="nav-actions"></div>
    </header>

    <!-- Main Content -->
    <main id="main-content"></main>
</div>

<!-- Modal for Alerts -->
<div id="modal-container" class="fixed inset-0 bg-black/50 hidden flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl text-center">
        <div id="modal-icon" class="mb-4 text-4xl"></div>
        <h3 id="modal-title" class="text-xl font-bold mb-2"></h3>
        <p id="modal-body" class="text-slate-600 mb-6"></p>
        <div class="flex gap-3 justify-center">
            <button id="modal-cancel" class="btn btn-ghost">ביטול</button>
            <button id="modal-confirm" class="btn btn-primary">אישור</button>
        </div>
    </div>
</div>

<script>
    // --- State & DB ---
    const DB = {
        save: (key, data) => localStorage.setItem(`biz_app_${key}`, JSON.stringify(data)),
        load: (key) => JSON.parse(localStorage.getItem(`biz_app_${key}`)) || []
    };

    let clients = DB.load('clients');
    let history = DB.load('history');
    let currentView = 'dashboard';
    let activeClientIndex = null;
    let docSearchTerm = '';

    // Initial dummy data if empty
    if (clients.length === 0) {
        clients = [{ name: 'ישראל ישראלי', phone: '050-1234567', email: 'israel@test.com' }];
        DB.save('clients', clients);
    }

    // --- Core Logic ---

    function getNextDocType(currentType) {
        if (currentType === 'הצעת מחיר') return 'חשבונית מס';
        if (currentType === 'חשבונית מס') return 'קבלה';
        return null; 
    }

    function showModal(title, body, onConfirm, icon = '❓') {
        const container = document.getElementById('modal-container');
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-body').innerText = body;
        document.getElementById('modal-icon').innerText = icon;
        
        container.classList.remove('hidden');
        
        const confirmBtn = document.getElementById('modal-confirm');
        const cancelBtn = document.getElementById('modal-cancel');

        const close = () => container.classList.add('hidden');
        
        confirmBtn.onclick = () => { onConfirm(); close(); };
        cancelBtn.onclick = close;
    }

    function promoteDocument(historyIndex) {
        const doc = history[historyIndex];
        const nextType = getNextDocType(doc.type);

        if (!nextType) {
            doc.paid = !doc.paid;
            DB.save('history', history);
            render();
            return;
        }

        showModal(
            `קידום מסמך`,
            `האם להפוך את ה${doc.type} ל-${nextType}?`,
            () => {
                doc.type = nextType;
                if (nextType === 'קבלה') doc.paid = true;
                DB.save('history', history);
                render();
            },
            '🔄'
        );
    }

    function addDocument(clientName, type, amount) {
        if (!amount || amount <= 0) return;
        const newDoc = {
            client: clientName,
            type: type,
            total: parseFloat(amount),
            date: new Date().toLocaleDateString('he-IL'),
            paid: type === 'קבלה'
        };
        history.push(newDoc);
        DB.save('history', history);
        render();
    }

    // --- Views ---

    function renderDashboard() {
        const main = document.getElementById('main-content');
        const nav = document.getElementById('nav-actions');
        
        nav.innerHTML = `<button onclick="navigate('add-client')" class="btn btn-primary">+ לקוח חדש</button>`;
        
        main.innerHTML = `
            <h2 class="text-xl font-bold mb-4">רשימת לקוחות</h2>
            <div class="grid gap-4">
                ${clients.map((c, i) => `
                    <div onclick="navigate('client-detail', ${i})" class="card cursor-pointer hover:border-blue-300 border border-transparent flex justify-between items-center">
                        <div>
                            <h3 class="font-bold text-lg">${c.name}</h3>
                            <p class="text-sm text-slate-500">${c.phone} | ${c.email}</p>
                        </div>
                        <div class="text-blue-500 font-bold">צפייה ></div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderClientDetail(index) {
        activeClientIndex = index;
        const client = clients[index];
        const main = document.getElementById('main-content');
        const nav = document.getElementById('nav-actions');

        const clientDocs = history.filter(h => h.client === client.name);
        const filteredDocs = clientDocs.filter(d => 
            d.type.includes(docSearchTerm) || d.total.toString().includes(docSearchTerm)
        );

        const paidTotal = clientDocs.filter(d => d.paid).reduce((sum, d) => sum + d.total, 0);
        const pendingTotal = clientDocs.filter(d => !d.paid).reduce((sum, d) => sum + d.total, 0);

        nav.innerHTML = `<button onclick="navigate('dashboard')" class="btn btn-ghost">< חזרה</button>`;

        main.innerHTML = `
            <div class="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 class="text-2xl font-bold">${client.name}</h2>
                    <p class="text-slate-500">${client.email}</p>
                </div>
                <div class="flex gap-4">
                    <div class="text-center bg-emerald-50 p-2 px-4 rounded-lg border border-emerald-100">
                        <p class="text-xs text-emerald-600 font-bold">שולם</p>
                        <p class="text-lg font-bold text-emerald-700">₪${paidTotal.toLocaleString()}</p>
                    </div>
                    <div class="text-center bg-orange-50 p-2 px-4 rounded-lg border border-orange-100">
                        <p class="text-xs text-orange-600 font-bold">יתרה</p>
                        <p class="text-lg font-bold text-orange-700">₪${pendingTotal.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div class="card mb-6">
                <h3 class="font-bold mb-3 text-slate-700 underline decoration-blue-200">הפקת מסמך חדש</h3>
                <div class="flex flex-wrap gap-2">
                    <input id="new-doc-amount" type="number" placeholder="סכום (₪)" class="border p-2 rounded w-32 focus:ring-2 focus:ring-blue-400 outline-none">
                    <button onclick="addDocument('${client.name}', 'הצעת מחיר', document.getElementById('new-doc-amount').value)" class="btn btn-ghost text-blue-600 border border-blue-100">הצעת מחיר</button>
                    <button onclick="addDocument('${client.name}', 'חשבונית מס', document.getElementById('new-doc-amount').value)" class="btn btn-ghost text-indigo-600 border border-indigo-100">חשבונית מס</button>
                    <button onclick="addDocument('${client.name}', 'קבלה', document.getElementById('new-doc-amount').value)" class="btn btn-ghost text-emerald-600 border border-emerald-100">קבלה</button>
                </div>
            </div>

            <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold text-slate-700">היסטוריית מסמכים</h3>
                <input oninput="updateSearch(this.value)" value="${docSearchTerm}" type="text" placeholder="חיפוש מסמך..." class="border rounded-lg p-1 px-3 text-sm focus:ring-2 focus:ring-blue-400 outline-none">
            </div>

            <div class="space-y-3">
                ${filteredDocs.length === 0 ? '<p class="text-center py-8 text-slate-400 italic">אין מסמכים להצגה</p>' : ''}
                ${filteredDocs.map((h) => {
                    const hIdx = history.findIndex(item => item === h);
                    const nextStep = getNextDocType(h.type);
                    return `
                        <div class="card flex justify-between items-center border-r-4 ${h.paid ? 'border-emerald-500' : 'border-orange-500'}">
                            <div>
                                <p class="text-[10px] text-slate-400 font-bold">${h.date}</p>
                                <h4 class="font-bold text-slate-800">${h.type}</h4>
                                <p class="text-sm font-bold text-slate-600">₪${h.total.toLocaleString()}</p>
                            </div>
                            <div class="flex items-center gap-3">
                                <span class="badge ${h.paid ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}">
                                    ${h.paid ? 'שולם' : 'ממתין'}
                                </span>
                                <button onclick="promoteDocument(${hIdx})" class="btn btn-ghost text-xs ${nextStep ? 'text-blue-600' : 'text-slate-400'}">
                                    ${nextStep ? `המר ל-${nextStep} 🔄` : (h.paid ? 'סמן כלא שולם' : 'סמן כשולם')}
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function renderAddClient() {
        const main = document.getElementById('main-content');
        const nav = document.getElementById('nav-actions');
        nav.innerHTML = `<button onclick="navigate('dashboard')" class="btn btn-ghost">< חזרה</button>`;
        
        main.innerHTML = `
            <div class="card max-w-md mx-auto">
                <h2 class="text-xl font-bold mb-4">הוספת לקוח חדש</h2>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-bold mb-1">שם מלא</label>
                        <input id="c-name" type="text" class="w-full border p-2 rounded">
                    </div>
                    <div>
                        <label class="block text-sm font-bold mb-1">טלפון</label>
                        <input id="c-phone" type="text" class="w-full border p-2 rounded">
                    </div>
                    <div>
                        <label class="block text-sm font-bold mb-1">אימייל</label>
                        <input id="c-email" type="email" class="w-full border p-2 rounded">
                    </div>
                    <button onclick="saveNewClient()" class="btn btn-primary w-full mt-4">שמור לקוח</button>
                </div>
            </div>
        `;
    }

    // --- Navigation & Actions ---

    function navigate(view, params = null) {
        currentView = view;
        if (view === 'client-detail') activeClientIndex = params;
        render();
    }

    function updateSearch(val) {
        docSearchTerm = val;
        render();
    }

    function saveNewClient() {
        const name = document.getElementById('c-name').value;
        const phone = document.getElementById('c-phone').value;
        const email = document.getElementById('c-email').value;

        if (!name) return;
        clients.push({ name, phone, email });
        DB.save('clients', clients);
        navigate('dashboard');
    }

    function render() {
        if (currentView === 'dashboard') renderDashboard();
        else if (currentView === 'client-detail') renderClientDetail(activeClientIndex);
        else if (currentView === 'add-client') renderAddClient();
    }

    // Init
    window.onload = render;

</script>
</body>
</html>
