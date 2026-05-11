// ===== admin_secure_live_classroom_v15_customization_studio.html :: inline-script-01 =====
(function initFirebaseCompat(){
            function markError(message){
                window.firebaseLoadError = message;
                console.error(message);
            }
            try {
                if (!window.firebase || !firebase.initializeApp) {
                    markError('مكتبات Firebase لم تتحمل. تأكد أن الإنترنت يعمل وأن gstatic غير محجوب ثم أعد تحميل الصفحة.');
                    return;
                }
                const firebaseConfig = {
                    apiKey: "AIzaSyDgMV79LTyiQerEOZvtuszH6ONaOAset5c",
                    authDomain: "programming-cc297.firebaseapp.com",
                    databaseURL: "https://programming-cc297-default-rtdb.firebaseio.com",
                    projectId: "programming-cc297",
                    storageBucket: "programming-cc297.firebasestorage.app",
                    messagingSenderId: "131761323515",
                    appId: "1:131761323515:web:50641907e66eed129e9f5e"
                };
                if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

// ===== TITAN V14 SaaS Tenant Patch =====
window.TitanSaaS = window.TitanSaaS || {};
(function(){
  const params = new URLSearchParams(location.search);
  const rawTenant = params.get('tenant') || localStorage.getItem('titanTenantId') || 'titan';
  const tenantId = String(rawTenant).trim().toLowerCase().replace(/[^a-z0-9_-]/g,'') || 'titan';
  localStorage.setItem('titanTenantId', tenantId);
  window.TitanSaaS.tenantId = tenantId;
  window.TitanSaaS.tenantPath = function(path){ return 'tenants/' + tenantId + (path ? '/' + path : ''); };
  window.TitanSaaS.url = function(file){ return file + '?tenant=' + encodeURIComponent(tenantId); };
  const TENANT_ROOTS = new Set([
    'admins','students','content','online_exams','community','support','grades','invoices','expenses','attendance','homework','staff','schedule',
    'registration_requests','assignments','submissions','live_classes','live_recordings','notifications','question_bank','student_reports',
    'admin_profiles','audit_logs','active_sessions','student_activity','lesson_progress','live_attendance','student_notifications','notification_reads',
    'mega_records','campaigns','automation_rules','payment_plans','coupons','learning_paths','risk_alerts','library_files','lesson_quizzes',
    'parent_messages','qr_attendance','qr_attendance_sessions','badges','certificates','leaderboard','leaderboard_weekly','settings','academy_subscription'
  ]);
  function mapPath(path){
    if(path === undefined || path === null || path === '') return 'tenants/' + tenantId;
    path = String(path).replace(/^\/+/, '');
    const first = path.split('/')[0];
    if(path.startsWith('tenants/') || path.startsWith('super_admins/') || path.startsWith('user_tenants/') || path.startsWith('public_tenants/')) return path;
    if(TENANT_ROOTS.has(first)) return 'tenants/' + tenantId + '/' + path;
    return path;
  }
  const originalDatabase = firebase.database.bind(firebase);
  function patchedDatabase(){
    const d = originalDatabase.apply(firebase, arguments);
    if(!d.__titanSaasPatched){
      const originalRef = d.ref.bind(d);
      d.ref = function(path){ return originalRef(mapPath(path)); };
      d.__titanSaasPatched = true;
    }
    return d;
  }
  try {
    Object.getOwnPropertyNames(originalDatabase).forEach(k => { try { patchedDatabase[k] = originalDatabase[k]; } catch(e){} });
  } catch(e) {}
  firebase.database = patchedDatabase;
})();

                const db = firebase.database();
                const auth = firebase.auth();
                const storage = firebase.storage ? firebase.storage() : null;
                const helperApp = firebase.apps.find(a => a.name === 'student-auth-helper') || firebase.initializeApp(firebaseConfig, 'student-auth-helper');
                const studentAuth = helperApp.auth();

                window.db = db; window.auth = auth; window.storage = storage;
                window.fbRef = function(database, path){ return database.ref(path); };
                window.fbPush = function(refObj, data){ return refObj.push(data); };
                window.fbSet = function(refObj, data){ return refObj.set(data); };
                window.fbUpdate = function(refObj, data){ return refObj.update(data); };
                window.fbRemove = function(refObj){ return refObj.remove(); };
                window.fbOnValue = function(refObj, callback){ return refObj.on('value', callback); };
                window.fbGet = function(refObj){ return refObj.once('value'); };

                function makeStudentEmail(code) {
                    const safeCode = String(code || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
                    return `${safeCode}@students.titan-academy.app`;
                }
                window.makeStudentEmail = makeStudentEmail;
                window.createStudentAuthAccount = async function(code, phone) {
                    const email = makeStudentEmail(code);
                    const password = String(phone || '').trim();
                    if (email.startsWith('@') || password.length < 6) {
                        throw new Error('كود الطالب غير صالح أو رقم الهاتف أقل من 6 أرقام.');
                    }
                    try {
                        const cred = await studentAuth.createUserWithEmailAndPassword(email, password);
                        await studentAuth.signOut();
                        return { uid: cred.user.uid, email, existed: false };
                    } catch (err) {
                        // لو الحساب موجود بنفس كلمة المرور، نستخدمه بدلاً من تعطيل الموافقة.
                        if (err && err.code === 'auth/email-already-in-use') {
                            const cred = await studentAuth.signInWithEmailAndPassword(email, password);
                            await studentAuth.signOut();
                            return { uid: cred.user.uid, email, existed: true };
                        }
                        throw err;
                    }
                };

                let adminSyncStarted = false;
                function startAdminDataSync() {
                    if (adminSyncStarted) return;
                    adminSyncStarted = true;
                    fbOnValue(fbRef(db, 'students'), (snap) => {
                        window.db_students = snap.val() ? Object.entries(snap.val()).map(([k, v]) => ({...v, fbKey: k})) : [];
                        renderStudents(); updateStats(); syncDropdowns();
                    });
                    fbOnValue(fbRef(db, 'content'), (snap) => {
                        window.db_content = snap.val() ? Object.entries(snap.val()).map(([k, v]) => ({...v, fbKey: k})) : [];
                        renderContent(); updateStats();
                    });
                    fbOnValue(fbRef(db, 'community'), (snap) => {
                        window.db_community = snap.val() ? Object.entries(snap.val()).map(([k, v]) => ({...v, fbKey: k})) : [];
                        renderAdminCommunity();
                    });
                    fbOnValue(fbRef(db, 'invoices'), (snap) => {
                        window.db_invoices = snap.val() ? Object.entries(snap.val()).map(([k, v]) => ({...v, fbKey: k})) : [];
                        renderInvoices(); updateStats();
                    });
                    fbOnValue(fbRef(db, 'online_exams'), (snap) => {
                        window.db_online_exams = snap.val() ? Object.entries(snap.val()).map(([k, v]) => ({...v, fbKey: k})) : [];
                        renderOnlineExams();
                    });
                    fbOnValue(fbRef(db, 'support'), (snap) => {
                        window.db_support = snap.val() ? Object.entries(snap.val()).map(([k, v]) => ({...v, fbKey: k})) : [];
                        if(window.renderSupportAdmin) window.renderSupportAdmin();
                    });
                    fbOnValue(fbRef(db, 'assignments'), (snap) => {
                        window.db_assignments = snap.val() ? Object.entries(snap.val()).map(([k, v]) => ({...v, fbKey: k})) : [];
                        if(window.renderAssignmentsAdmin) window.renderAssignmentsAdmin(); updateStats();
                    });
                    fbOnValue(fbRef(db, 'submissions'), (snap) => {
                        window.db_submissions = snap.val() ? Object.entries(snap.val()).map(([k, v]) => ({...v, fbKey: k})) : [];
                        if(window.renderSubmissionsAdmin) window.renderSubmissionsAdmin();
                    });
                    fbOnValue(fbRef(db, 'registration_requests'), (snap) => {
                        window.db_registration_requests = snap.val() ? Object.entries(snap.val()).map(([k, v]) => ({...v, fbKey: k})) : [];
                        if(window.renderAccountRequests) window.renderAccountRequests();
                        updateStats();
                    });
                    fbOnValue(fbRef(db, 'expenses'), (snap) => { window.db_expenses = snap.val() ? Object.values(snap.val()) : []; renderExpenses(); updateStats(); });
                    fbOnValue(fbRef(db, 'attendance'), (snap) => { window.db_attendance = snap.val() ? Object.values(snap.val()) : []; });
                    fbOnValue(fbRef(db, 'homework'), (snap) => { window.db_homework = snap.val() ? Object.values(snap.val()) : []; renderHomework(); });
                    fbOnValue(fbRef(db, 'grades'), (snap) => { window.db_grades = snap.val() ? Object.values(snap.val()) : []; renderGrades(); });
                    fbOnValue(fbRef(db, 'staff'), (snap) => { window.db_staff = snap.val() ? Object.values(snap.val()) : []; renderStaff(); });
                    fbOnValue(fbRef(db, 'schedule'), (snap) => { window.db_schedule = snap.val() ? Object.values(snap.val()) : []; renderSchedule(); });
                }

                async function userIsAdmin(user) {
                    if (!user) return false;
                    const snap = await db.ref(`admins/${user.uid}`).once('value');
                    return snap.exists() && snap.val() === true;
                }
                async function openAdminApp(user) {
                    document.getElementById('login-screen').style.display = 'none';
                    document.getElementById('app').style.display = 'block';
                    startAdminDataSync();
                    if (!window.mainChart) initChart();
                }
                window.adminLoginFromFirebase = async function(email, password) {
                    const cleanEmail = (email || '').trim();
                    if (!cleanEmail || !password) {
                        alert('من فضلك أدخل البريد الإلكتروني وكلمة المرور.');
                        return;
                    }
                    try {
                        const cred = await auth.signInWithEmailAndPassword(cleanEmail, password);
                        if (!(await userIsAdmin(cred.user))) {
                            await auth.signOut();
                            alert('هذا الحساب ليس له صلاحية إدارة. أضف UID داخل admins في Realtime Database.');
                        }
                    } catch (err) {
                        console.error(err);
                        alert('تعذر تسجيل الدخول. الكود التقني: ' + (err.code || err.message || err));
                    }
                };
                window.adminLogout = async function() {
                    try { await auth.signOut(); } finally { location.reload(); }
                };
                auth.onAuthStateChanged(async (user) => {
                    if (!user) {
                        const login = document.getElementById('login-screen');
                        const app = document.getElementById('app');
                        if (login) login.style.display = 'flex';
                        if (app) app.style.display = 'none';
                        return;
                    }
                    try {
                        if (await userIsAdmin(user)) {
                            openAdminApp(user);
                        } else {
                            // مهم: لا تعمل signOut هنا. Firebase Auth مشترك بين صفحات الطالب والإدارة على نفس الدومين.
                            const login = document.getElementById('login-screen');
                            const app = document.getElementById('app');
                            if (login) login.style.display = 'flex';
                            if (app) app.style.display = 'none';
                            console.warn('Current Firebase user is not an admin for this tenant:', user.uid);
                        }
                    } catch (err) {
                        console.error(err);
                        markError('تعذر قراءة صلاحية الإدارة من Realtime Database: ' + (err.code || err.message || err));
                    }
                });
                window.firebaseReady = true;
                console.log('Firebase compat ready');
            } catch (err) {
                markError('فشل تهيئة Firebase: ' + (err.code || err.message || err));
            }
        })();


// ===== admin_secure_live_classroom_v15_customization_studio.html :: inline-script-02 =====
let mainChart;
        window.mainChart = null;

        function escapeHTML(value) {
            return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
        }
        function jsString(value) {
            return String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '');
        }
        function safeUrl(value) {
            const raw = String(value ?? '').trim();
            if (!raw) return '';
            try {
                const parsed = new URL(raw, location.href);
                if (['http:', 'https:'].includes(parsed.protocol)) return escapeHTML(raw);
            } catch (e) {}
            return '';
        }
        function normalizePhone(value) {
            return String(value ?? '').replace(/[^0-9+]/g, '');
        }

        function showToast(message, type = 'success') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = `custom-toast ${type}`;
            
            let icon = 'fa-check-circle';
            if(type === 'error') icon = 'fa-exclamation-circle';
            if(type === 'warning') icon = 'fa-exclamation-triangle';
            
            toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
            container.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 400);
            }, 3000);
        }

        // دوال نظام الشكاوى والدعم الفني الجديدة
        window.renderSupportAdmin = function() {
            const list = document.getElementById('support-list-admin');
            if(!list) return;
            
            list.innerHTML = (window.db_support || []).reverse().map(c => `
                <tr>
                    <td style="font-weight:bold;">${c.studentName}<br><span style="font-size:0.8rem; color:var(--text-dim);">${c.phone || ''}</span></td>
                    <td>مستوى ${c.level}</td>
                    <td style="max-width: 250px; text-align: right; padding-right: 15px;">${c.text}</td>
                    <td style="font-size:0.85rem;">${c.date}</td>
                    <td>
                        ${c.reply ? 
                          `<span style="color:var(--success); font-weight:bold;"><i class="fas fa-check-circle"></i> تم الرد</span>
                           <div style="font-size:0.8rem; margin-top:5px; color:var(--text-dim); text-align:right;">${c.reply}</div>` : 
                          `<input type="text" id="reply-input-${c.fbKey}" placeholder="اكتب ردك هنا..." style="padding:8px; border-radius:8px; border:1px solid var(--border); width:100%;">`
                        }
                    </td>
                    <td>
                        ${!c.reply ? `<button class="btn btn-success" onclick="replyComplaint('${c.fbKey}')" style="padding:8px; margin-bottom:5px; width:100%; justify-content:center;"><i class="fas fa-reply"></i> إرسال</button>` : ''}
                        <button class="btn btn-danger" onclick="deleteComplaint('${c.fbKey}')" style="padding:8px; width:100%; justify-content:center;"><i class="fas fa-trash"></i> حذف</button>
                    </td>
                </tr>
            `).join('');
        }

        window.replyComplaint = function(key) {
            const replyText = document.getElementById(`reply-input-${key}`).value.trim();
            if(!replyText) return showToast("الرجاء كتابة الرد أولاً!", "error");
            
            window.fbUpdate(window.fbRef(window.db, `support/${key}`), { reply: replyText });
            showToast("تم إرسال الرد للطالب بنجاح", "success");
        }

        window.deleteComplaint = function(key) {
            if(confirm('هل أنت متأكد من مسح هذه الشكوى نهائياً؟')) {
                window.fbRemove(window.fbRef(window.db, `support/${key}`));
                showToast("تم حذف الشكوى", "warning");
            }
        }

        // باقي دوال الموقع ...
        function addNewTask() {
            const input = document.getElementById('new-task-input');
            const text = input.value.trim();
            if (!text) return;
            
            const list = document.getElementById('todo-list');
            const taskDiv = document.createElement('div');
            taskDiv.className = 'task-item';
            taskDiv.innerHTML = `
                <span>${text}</span>
                <div style="display:flex; gap:5px;">
                    <button class="btn btn-success" style="padding: 5px 10px;" onclick="this.parentElement.parentElement.classList.toggle('done')"><i class="fas fa-check"></i></button>
                    <button class="btn btn-danger" style="padding: 5px 10px;" onclick="this.parentElement.parentElement.remove()"><i class="fas fa-trash"></i></button>
                </div>
            `;
            list.appendChild(taskDiv);
            input.value = "";
            showToast('تمت إضافة المهمة', 'success');
        }

        async function login() {
            if (!window.adminLoginFromFirebase) return alert('Firebase لم يتحمل بعد أو فشل تحميله. التفاصيل: ' + (window.firebaseLoadError || 'انتظر 5 ثواني ثم اضغط Ctrl+F5. تأكد أن gstatic.com غير محجوب.'));
            await window.adminLoginFromFirebase(document.getElementById('u').value, document.getElementById('p').value);
        }

        function showSec(id) {
            document.querySelectorAll('section').forEach(s => s.style.display = 'none');
            document.getElementById('sec-'+id).style.display = 'block';
            document.getElementById('page-title').innerHTML = document.querySelector(`button[onclick="showSec('${id}')"]`).innerHTML;
        }

        function syncDropdowns() {
            const options = (window.db_students || []).map(s => `<option value="${s.name}">${s.name}</option>`).join('');
            const keyOptions = (window.db_students || []).map(s => `<option value="${s.fbKey}">${s.name}</option>`).join('');
            if(document.getElementById('hw-std-select')) document.getElementById('hw-std-select').innerHTML = options;
            if(document.getElementById('exam-std-select')) document.getElementById('exam-std-select').innerHTML = options;
            if(document.getElementById('eval-student-select')) document.getElementById('eval-student-select').innerHTML = '<option value="">اختر...</option>' + keyOptions;
            if(document.getElementById('inv-select-std')) document.getElementById('inv-select-std').innerHTML = (window.db_students || []).map((s,i) => `<option value="${i}">${s.name}</option>`).join('');
        }

        function addQuestionUI() {
            const container = document.getElementById('questions-container');
            const qIndex = container.children.length + 1;
            const div = document.createElement('div');
            div.className = "exam-question-box";
            div.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 10px; color: var(--primary);">السؤال ${qIndex}</div>
                <input type="text" placeholder="اكتب نص السؤال هنا..." id="q-text-${qIndex}">
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
                    <input type="text" placeholder="الخيار الأول" id="q-opt1-${qIndex}">
                    <input type="text" placeholder="الخيار الثاني" id="q-opt2-${qIndex}">
                    <input type="text" placeholder="الخيار الثالث" id="q-opt3-${qIndex}">
                    <input type="text" placeholder="الخيار الرابع" id="q-opt4-${qIndex}">
                </div>
                <select id="q-ans-${qIndex}" style="margin-top:10px; border-color: var(--success); color: var(--success); font-weight: bold;">
                    <option value="1">الإجابة الصحيحة هي: الخيار الأول</option>
                    <option value="2">الإجابة الصحيحة هي: الخيار الثاني</option>
                    <option value="3">الإجابة الصحيحة هي: الخيار الثالث</option>
                    <option value="4">الإجابة الصحيحة هي: الخيار الرابع</option>
                </select>
                <button class="btn btn-danger" style="margin-top:10px;" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i> حذف السؤال</button>
            `;
            container.appendChild(div);
        }

        function publishOnlineExam() {
            const title = document.getElementById('new-exam-title').value;
            const level = document.getElementById('new-exam-level').value;
            const container = document.getElementById('questions-container');
            const questions = [];

            Array.from(container.children).forEach((child, index) => {
                const textInput = child.querySelector('input[id^="q-text-"]');
                if(!textInput) return;
                
                const qId = textInput.id.split('-')[2];
                const text = document.getElementById(`q-text-${qId}`).value;
                const opt1 = document.getElementById(`q-opt1-${qId}`).value;
                const opt2 = document.getElementById(`q-opt2-${qId}`).value;
                const opt3 = document.getElementById(`q-opt3-${qId}`).value;
                const opt4 = document.getElementById(`q-opt4-${qId}`).value;
                const answer = document.getElementById(`q-ans-${qId}`).value;

                if(text && opt1 && opt2) { 
                    questions.push({
                        text: text,
                        options: [opt1, opt2, opt3, opt4].filter(o => o.trim() !== ""), 
                        answer: parseInt(answer) - 1
                    });
                }
            });

            if(!title) return showToast("يرجى كتابة عنوان للامتحان", "error");
            if(questions.length === 0) return showToast("يرجى إضافة سؤال واحد على الأقل", "error");

            fbPush(fbRef(db, 'online_exams'), { 
                title, 
                level, 
                questions, 
                date: new Date().toLocaleDateString('ar-EG') 
            });
            
            showToast("تم نشر الامتحان للطلاب بنجاح!", "success");
            document.getElementById('new-exam-title').value = "";
            container.innerHTML = "";
        }

        function renderOnlineExams() {
            const list = document.getElementById('online-exams-list');
            if(!list) return;
            list.innerHTML = (window.db_online_exams || []).map(e => `
                <tr>
                    <td style="font-weight: bold; color: var(--primary);">${e.title}</td>
                    <td>مستوى ${e.level}</td>
                    <td>${e.questions ? e.questions.length : 0} أسئلة</td>
                    <td>${e.date}</td>
                    <td><button class="btn btn-danger" onclick="if(confirm('هل أنت متأكد من حذف الامتحان؟')) { fbRemove(fbRef(db, 'online_exams/${e.fbKey}')); showToast('تم الحذف', 'warning'); }"><i class="fas fa-trash"></i> حذف</button></td>
                </tr>
            `).reverse().join('');
        }

        function adminSendPost() {
            const txt = document.getElementById('admin-post-txt').value, lvl = document.getElementById('admin-post-lvl').value;
            if(!txt) return;
            fbPush(fbRef(db, 'community'), { sender: "إدارة الأكاديمية 🛡️", text: txt, level: lvl, time: new Date().toLocaleTimeString('ar-EG') });
            document.getElementById('admin-post-txt').value = "";
            showToast("تم إرسال التنبيه", "success");
        }
        function renderAdminCommunity() {
            document.getElementById('admin-comm-list').innerHTML = (window.db_community || []).reverse().map(p => `<tr><td>${p.sender}</td><td>${p.level}</td><td>${p.text}</td><td>${p.time}</td><td><button class="btn btn-danger" onclick="fbRemove(fbRef(db, 'community/${p.fbKey}')); showToast('تم مسح المنشور', 'warning');"><i class="fas fa-trash"></i></button></td></tr>`).join('');
        }

        function addStudent() {
            const name = document.getElementById('std-name').value, code = document.getElementById('std-code').value, level = document.getElementById('std-level').value, phone = document.getElementById('std-phone').value;
            if(!name || !code) return showToast("يرجى إكمال بيانات الطالب", "error");
            fbPush(fbRef(db, 'students'), {name, code, level, phone});
            document.getElementById('std-name').value = ""; document.getElementById('std-code').value = "";
            showToast("تم إضافة الطالب بنجاح", "success");
        }
        function renderStudents() {
            const term = document.getElementById('search-std').value.toLowerCase();
            document.getElementById('students-list').innerHTML = (window.db_students || []).filter(s => s.name.toLowerCase().includes(term))
                .map(s => `<tr><td>${s.name}</td><td>${s.code}</td><td>${s.level}</td><td>${s.phone}</td><td><button class="btn btn-danger" onclick="fbRemove(fbRef(db, 'students/${s.fbKey}')); showToast('تم حذف الطالب', 'warning');"><i class="fas fa-trash"></i></button></td></tr>`).join('');
        }

        function uploadLesson() {
            const title = document.getElementById('lesson-title').value, video = document.getElementById('lesson-video').value, level = document.getElementById('lesson-level-select').value;
            if(!title) return showToast("يرجى إدخال عنوان الدرس", "error");
            fbPush(fbRef(db, 'content'), { title, video, level, date: new Date().toLocaleDateString('ar-EG'), code: document.getElementById('lesson-code').value, pdf: document.getElementById('lesson-pdf').value });
            showToast("تم نشر المحتوى بنجاح", "success");
        }
        function renderContent() {
            document.getElementById('content-list').innerHTML = (window.db_content || []).map(c => `<tr><td>${c.title}</td><td>${c.level}</td><td>${c.date}</td><td><button class="btn btn-danger" onclick="fbRemove(fbRef(db, 'content/${c.fbKey}')); showToast('تم حذف الدرس', 'warning');"><i class="fas fa-trash"></i></button></td></tr>`).join('');
        }

        function submitEvaluation() {
            const key = document.getElementById('eval-student-select').value, w = document.getElementById('eval-work').value, p = document.getElementById('eval-perf').value, b = document.getElementById('eval-beh').value;
            if(!key || !w) return showToast("يرجى إكمال التقييم", "error");
            fbPush(fbRef(db, `students/${key}/evaluations`), { date: new Date().toLocaleDateString('ar-EG'), work: w, perf: p, beh: b });
            showToast("تم حفظ التقييم بنجاح", "success");
        }

        function loadDailyAttendanceList() {
            const level = document.getElementById('att-level-select').value;
            document.getElementById('daily-att-list').innerHTML = (window.db_students || []).filter(s => s.level == level).map(s => `<tr><td>${s.name}</td><td><select class="daily-status-select" data-code="${s.code}"><option value="ح">حضور</option><option value="غ">غياب</option></select></td><td><button class="btn btn-success" onclick="window.open('https://wa.me/${s.phone}')"><i class="fab fa-whatsapp"></i></button></td></tr>`).join('');
        }
        function saveDailyAttendance() {
            const date = document.getElementById('att-date-input').value;
            if(!date) return showToast("يرجى تحديد التاريخ", "error");
            document.querySelectorAll('.daily-status-select').forEach(sel => { fbPush(fbRef(db, 'attendance'), { date, code: sel.dataset.code, status: sel.value }); });
            showToast('تم حفظ كشف الحضور', 'success');
        }

        function createInvoice() {
            const sIdx = document.getElementById('inv-select-std').value, amt = parseFloat(document.getElementById('inv-amt').value), paid = parseFloat(document.getElementById('inv-paid').value) || 0;
            if(!amt) return showToast("يرجى إدخال المبلغ", "error");
            fbPush(fbRef(db, 'invoices'), { date: new Date().toLocaleDateString('ar-EG'), name: window.db_students[sIdx].name, phone: window.db_students[sIdx].phone, amt, paid, remaining: amt - paid });
            showToast("تم إصدار الفاتورة", "success");
        }
        function renderInvoices() {
            document.getElementById('inv-list').innerHTML = (window.db_invoices || []).map((iv, i) => `<tr><td>${iv.name}</td><td>${iv.amt}</td><td>${iv.paid}</td><td>${iv.remaining}</td><td><button class="btn btn-success" onclick="fbUpdate(fbRef(db, 'invoices/${iv.fbKey}'), {paid: ${iv.paid + 10}, remaining: ${iv.remaining - 10}}); showToast('تم تحديث الفاتورة', 'success');">+10ج</button></td></tr>`).join('');
        }

        function updateStats() {
            if (!document.getElementById('st-count')) return;
            document.getElementById('st-count').innerText = (window.db_students || []).length;
            document.getElementById('content-count').innerText = (window.db_content || []).length;
            const invoices = window.db_invoices || [];
            document.getElementById('st-money').innerText = invoices.reduce((a,b)=> a + (Number(b.paid) || 0), 0) + " ج.م";
            document.getElementById('st-debts').innerText = invoices.reduce((a,b)=> a + (Number(b.remaining) || 0), 0) + " ج.م";
            const requestEl = document.getElementById('request-count');
            if (requestEl) requestEl.innerText = (window.db_registration_requests || []).filter(r => (r.status || 'pending') === 'pending').length;
        }

        function addExpense() { 
            const title = document.getElementById('exp-title').value;
            const amt = parseFloat(document.getElementById('exp-amt').value);
            if(!title || !amt) return showToast("يرجى إكمال بيانات المصروف", "error");
            fbPush(fbRef(db, 'expenses'), { title: title, amt: amt, date: new Date().toLocaleDateString() }); 
            showToast("تم حفظ المصروف", "success");
        }
        function renderExpenses() { document.getElementById('exp-list').innerHTML = (window.db_expenses || []).map(ex => `<tr><td>${ex.title}</td><td>${ex.date}</td><td>${ex.amt}</td></tr>`).join(''); }
        
        function addGrade() { 
            if(!document.getElementById('exam-name').value) return showToast("أدخل بيانات الدرجة", "error");
            fbPush(fbRef(db, 'grades'), { std: document.getElementById('exam-std-select').value, name: document.getElementById('exam-name').value, grade: document.getElementById('exam-grade').value }); 
            showToast("تم حفظ الدرجة", "success");
        }
        function renderGrades() { document.getElementById('grades-list').innerHTML = (window.db_grades || []).map(g => `<tr><td>${g.std}</td><td style="color:var(--primary); font-weight:bold;">${g.name}</td><td>${g.grade}</td></tr>`).reverse().join(''); }
        
        function addStaff() { 
            fbPush(fbRef(db, 'staff'), { name: document.getElementById('staff-name').value, role: document.getElementById('staff-role').value, salary: document.getElementById('staff-salary').value }); 
            showToast("تم إضافة الموظف", "success");
        }
        function renderStaff() { document.getElementById('staff-list').innerHTML = (window.db_staff || []).map(s => `<tr><td>${s.name}</td><td>${s.role}</td><td>${s.salary}</td></tr>`).join(''); }
        
        function addSchedule() { 
            fbPush(fbRef(db, 'schedule'), { group: document.getElementById('sch-group').value, day: document.getElementById('sch-day').value, time: document.getElementById('sch-time').value }); 
            showToast("تم إضافة الموعد", "success");
        }
        function renderSchedule() { document.getElementById('sch-list').innerHTML = (window.db_schedule || []).map(s => `<tr><td>${s.group}</td><td>${s.day}</td><td>${s.time}</td></tr>`).join(''); }
        
        function addHomework() { 
            fbPush(fbRef(db, 'homework'), { date: new Date().toLocaleDateString('ar-EG'), std: document.getElementById('hw-std-select').value, title: document.getElementById('hw-title').value, status: document.getElementById('hw-status').value }); 
            showToast("تم حفظ الواجب", "success");
        }
        function renderHomework() { document.getElementById('hw-list').innerHTML = (window.db_homework || []).map(h => `<tr><td>${h.date}</td><td>${h.std}</td><td>${h.title}</td><td>${h.status}</td></tr>`).reverse().join(''); }

        function renderExcelReport() {
            const month = document.getElementById('monthSelect').value, level = document.getElementById('rep-level-select').value, days = 30;
            const students = (window.db_students || []).filter(s => s.level == level);
            let h = `<tr><th class="sticky-col">الطالب</th>`;
            for(let i=1; i<=days; i++) h += `<th>${i}</th>`;
            document.getElementById('excel-header').innerHTML = h + `</tr>`;
            let b = "";
            students.forEach(s => {
                b += `<tr><td class="sticky-col">${s.name}</td>`;
                for(let d=1; d<=days; d++) {
                    const ds = `2026-${month.padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
                    const r = (window.db_attendance || []).find(a => a.date === ds && a.code === s.code);
                    b += `<td class="${r ? (r.status === 'ح' ? 'status-h' : 'status-g') : ""}">${r ? r.status : "-"}</td>`;
                }
                b += `</tr>`;
            });
            document.getElementById('excel-body').innerHTML = b;
        }

        // نسخ عرض آمنة تقلل XSS عند عرض مدخلات الطلاب أو الإدارة
        addNewTask = function() {
            const input = document.getElementById('new-task-input');
            const text = input.value.trim();
            if (!text) return;
            const list = document.getElementById('todo-list');
            const taskDiv = document.createElement('div');
            taskDiv.className = 'task-item';
            taskDiv.innerHTML = `
                <span>${escapeHTML(text)}</span>
                <div style="display:flex; gap:5px;">
                    <button class="btn btn-success" style="padding: 5px 10px;" onclick="this.parentElement.parentElement.classList.toggle('done')"><i class="fas fa-check"></i></button>
                    <button class="btn btn-danger" style="padding: 5px 10px;" onclick="this.parentElement.parentElement.remove()"><i class="fas fa-trash"></i></button>
                </div>`;
            list.appendChild(taskDiv);
            input.value = '';
            showToast('تمت إضافة المهمة', 'success');
        };

        syncDropdowns = function() {
            const students = window.db_students || [];
            const options = students.map(s => `<option value="${escapeHTML(s.name)}">${escapeHTML(s.name)}</option>`).join('');
            const keyOptions = students.map(s => `<option value="${escapeHTML(s.fbKey)}">${escapeHTML(s.name)}</option>`).join('');
            if(document.getElementById('hw-std-select')) document.getElementById('hw-std-select').innerHTML = options;
            if(document.getElementById('exam-std-select')) document.getElementById('exam-std-select').innerHTML = options;
            if(document.getElementById('eval-student-select')) document.getElementById('eval-student-select').innerHTML = '<option value="">اختر...</option>' + keyOptions;
            if(document.getElementById('inv-select-std')) document.getElementById('inv-select-std').innerHTML = students.map((s,i) => `<option value="${i}">${escapeHTML(s.name)}</option>`).join('');
        };

        window.renderSupportAdmin = function() {
            const list = document.getElementById('support-list-admin');
            if(!list) return;
            list.innerHTML = (window.db_support || []).slice().reverse().map(c => {
                const key = escapeHTML(c.fbKey);
                const jsKey = jsString(c.fbKey);
                return `<tr>
                    <td style="font-weight:bold;">${escapeHTML(c.studentName)}<br><span style="font-size:0.8rem; color:var(--text-dim);">${escapeHTML(c.phone || '')}</span></td>
                    <td>مستوى ${escapeHTML(c.level)}</td>
                    <td style="max-width: 250px; text-align: right; padding-right: 15px;">${escapeHTML(c.text)}</td>
                    <td style="font-size:0.85rem;">${escapeHTML(c.date)}</td>
                    <td>${c.reply ? `<span style="color:var(--success); font-weight:bold;"><i class="fas fa-check-circle"></i> تم الرد</span><div style="font-size:0.8rem; margin-top:5px; color:var(--text-dim); text-align:right;">${escapeHTML(c.reply)}</div>` : `<input type="text" id="reply-input-${key}" placeholder="اكتب ردك هنا..." style="padding:8px; border-radius:8px; border:1px solid var(--border); width:100%;">`}</td>
                    <td>${!c.reply ? `<button class="btn btn-success" onclick="replyComplaint('${jsKey}')" style="padding:8px; margin-bottom:5px; width:100%; justify-content:center;"><i class="fas fa-reply"></i> إرسال</button>` : ''}<button class="btn btn-danger" onclick="deleteComplaint('${jsKey}')" style="padding:8px; width:100%; justify-content:center;"><i class="fas fa-trash"></i> حذف</button></td>
                </tr>`;
            }).join('');
        };

        renderOnlineExams = function() {
            const list = document.getElementById('online-exams-list');
            if(!list) return;
            list.innerHTML = (window.db_online_exams || []).map(e => `<tr>
                <td style="font-weight: bold; color: var(--primary);">${escapeHTML(e.title)}</td>
                <td>مستوى ${escapeHTML(e.level)}</td>
                <td>${e.questions ? e.questions.length : 0} أسئلة</td>
                <td>${escapeHTML(e.date)}</td>
                <td><button class="btn btn-danger" onclick="if(confirm('هل أنت متأكد من حذف الامتحان؟')) { fbRemove(fbRef(db, 'online_exams/${jsString(e.fbKey)}')); showToast('تم الحذف', 'warning'); }"><i class="fas fa-trash"></i> حذف</button></td>
            </tr>`).reverse().join('');
        };

        renderAdminCommunity = function() {
            const el = document.getElementById('admin-comm-list');
            if(!el) return;
            el.innerHTML = (window.db_community || []).slice().reverse().map(p => `<tr><td>${escapeHTML(p.sender)}</td><td>${escapeHTML(p.level)}</td><td>${escapeHTML(p.text)}</td><td>${escapeHTML(p.time)}</td><td><button class="btn btn-danger" onclick="fbRemove(fbRef(db, 'community/${jsString(p.fbKey)}')); showToast('تم مسح المنشور', 'warning');"><i class="fas fa-trash"></i></button></td></tr>`).join('');
        };

        renderStudents = function() {
            const term = (document.getElementById('search-std')?.value || '').toLowerCase();
            document.getElementById('students-list').innerHTML = (window.db_students || [])
                .filter(s => [s.name, s.code, s.phone].some(v => String(v || '').toLowerCase().includes(term)))
                .map(s => {
                    const phone = normalizePhone(s.phone);
                    return `<tr>
                        <td>${escapeHTML(s.name)}<br><span style="font-size:.78rem;color:var(--text-dim);direction:ltr;display:inline-block;">${escapeHTML(s.authEmail || makeStudentEmail(s.code))}</span></td>
                        <td>${escapeHTML(s.code)}</td><td>${escapeHTML(s.level)}</td><td>${escapeHTML(s.phone)}</td>
                        <td>
                            ${phone ? `<button class="btn btn-success" onclick="window.open('https://wa.me/${escapeHTML(phone)}')" style="padding:8px;margin:3px;"><i class="fab fa-whatsapp"></i></button>` : ''}
                            <button class="btn btn-danger" onclick="if(confirm('حذف الطالب من قاعدة البيانات؟ لن يحذف حساب Authentication تلقائياً.')) { fbRemove(fbRef(db, 'students/${jsString(s.fbKey)}')); fbRemove(fbRef(db, 'leaderboard/${jsString(s.fbKey)}')); showToast('تم حذف الطالب', 'warning'); }" style="padding:8px;margin:3px;"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>`;
                }).join('');
        };

        renderContent = function() {
            document.getElementById('content-list').innerHTML = (window.db_content || []).map(c => `<tr><td>${escapeHTML(c.title)}</td><td>${escapeHTML(c.level)}</td><td>${escapeHTML(c.date)}</td><td><button class="btn btn-danger" onclick="fbRemove(fbRef(db, 'content/${jsString(c.fbKey)}')); showToast('تم حذف الدرس', 'warning');"><i class="fas fa-trash"></i></button></td></tr>`).join('');
        };

        loadDailyAttendanceList = function() {
            const level = document.getElementById('att-level-select').value;
            document.getElementById('daily-att-list').innerHTML = (window.db_students || []).filter(s => s.level == level).map(s => {
                const phone = normalizePhone(s.phone);
                return `<tr><td>${escapeHTML(s.name)}</td><td><select class="daily-status-select" data-code="${escapeHTML(s.code)}"><option value="ح">حضور</option><option value="غ">غياب</option></select></td><td><button class="btn btn-success" onclick="window.open('https://wa.me/${escapeHTML(phone)}')"><i class="fab fa-whatsapp"></i></button></td></tr>`;
            }).join('');
        };

        renderInvoices = function() {
            document.getElementById('inv-list').innerHTML = (window.db_invoices || []).map(iv => `<tr><td>${escapeHTML(iv.name)}</td><td>${Number(iv.amt) || 0}</td><td>${Number(iv.paid) || 0}</td><td>${Number(iv.remaining) || 0}</td><td><button class="btn btn-success" onclick="fbUpdate(fbRef(db, 'invoices/${jsString(iv.fbKey)}'), {paid: ${(Number(iv.paid) || 0) + 10}, remaining: ${(Number(iv.remaining) || 0) - 10}}); showToast('تم تحديث الفاتورة', 'success');">+10ج</button></td></tr>`).join('');
        };

        renderExpenses = function() { document.getElementById('exp-list').innerHTML = (window.db_expenses || []).map(ex => `<tr><td>${escapeHTML(ex.title)}</td><td>${escapeHTML(ex.date)}</td><td>${Number(ex.amt) || 0}</td></tr>`).join(''); };
        renderGrades = function() { document.getElementById('grades-list').innerHTML = (window.db_grades || []).map(g => `<tr><td>${escapeHTML(g.std)}</td><td style="color:var(--primary); font-weight:bold;">${escapeHTML(g.name)}</td><td>${escapeHTML(g.grade)}</td></tr>`).reverse().join(''); };
        renderStaff = function() { document.getElementById('staff-list').innerHTML = (window.db_staff || []).map(s => `<tr><td>${escapeHTML(s.name)}</td><td>${escapeHTML(s.role)}</td><td>${escapeHTML(s.salary)}</td></tr>`).join(''); };
        renderSchedule = function() { document.getElementById('sch-list').innerHTML = (window.db_schedule || []).map(s => `<tr><td>${escapeHTML(s.group)}</td><td>${escapeHTML(s.day)}</td><td>${escapeHTML(s.time)}</td></tr>`).join(''); };
        renderHomework = function() { document.getElementById('hw-list').innerHTML = (window.db_homework || []).map(h => `<tr><td>${escapeHTML(h.date)}</td><td>${escapeHTML(h.std)}</td><td>${escapeHTML(h.title)}</td><td>${escapeHTML(h.status)}</td></tr>`).reverse().join(''); };


        async function studentCodeExists(code, exceptKey = '') {
            const snap = await fbGet(fbRef(db, 'students'));
            const students = snap.exists() ? snap.val() : {};
            return Object.entries(students).some(([key, s]) => key !== exceptKey && String(s.code || '').trim().toLowerCase() === String(code || '').trim().toLowerCase());
        }

        window.renderAccountRequests = function() {
            const el = document.getElementById('account-requests-list');
            if (!el) return;
            const rows = (window.db_registration_requests || []).slice().reverse();
            el.innerHTML = rows.length ? rows.map(r => {
                const key = jsString(r.fbKey);
                const status = r.status || 'pending';
                const statusText = status === 'approved' ? 'تمت الموافقة' : (status === 'rejected' ? 'مرفوض' : 'قيد الانتظار');
                const statusColor = status === 'approved' ? 'var(--success)' : (status === 'rejected' ? 'var(--danger)' : 'var(--warning)');
                return `<tr>
                    <td style="font-weight:800;">${escapeHTML(r.name)}</td>
                    <td>${escapeHTML(r.code)}</td>
                    <td>مستوى ${escapeHTML(r.level)}</td>
                    <td>${escapeHTML(r.phone)}</td>
                    <td style="font-weight:800; color:${statusColor};">${statusText}</td>
                    <td style="font-size:.85rem;">${escapeHTML(r.date || r.createdAt || '')}</td>
                    <td style="min-width:220px;">
                        ${status === 'pending' ? `<button class="btn btn-success" onclick="approveAccountRequest('${key}')" style="padding:8px; margin:3px;"><i class="fas fa-check"></i> موافقة</button><button class="btn btn-warning" onclick="rejectAccountRequest('${key}')" style="padding:8px; margin:3px;"><i class="fas fa-ban"></i> رفض</button>` : ''}
                        <button class="btn btn-danger" onclick="deleteAccountRequest('${key}')" style="padding:8px; margin:3px;"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;
            }).join('') : '<tr><td colspan="7" style="color:var(--text-dim);">لا توجد طلبات إنشاء حساب حالياً.</td></tr>';
        };

        window.approveAccountRequest = async function(key) {
            const req = (window.db_registration_requests || []).find(r => r.fbKey === key);
            if (!req) return showToast('الطلب غير موجود', 'error');
            if (!req.name || !req.code || !req.phone) return showToast('بيانات الطلب ناقصة', 'error');
            if (String(req.phone).trim().length < 6) return showToast('رقم الهاتف أقل من 6 أرقام، لا يصلح ككلمة مرور', 'error');
            try {
                if (await studentCodeExists(req.code)) {
                    await fbUpdate(fbRef(db, `registration_requests/${key}`), { status: 'rejected', rejectReason: 'كود الطالب مستخدم بالفعل', reviewedAt: new Date().toISOString() });
                    return showToast('تم رفض الطلب لأن كود الطالب مستخدم بالفعل', 'warning');
                }
                const authAccount = await window.createStudentAuthAccount(req.code, req.phone);
                await fbSet(fbRef(db, `students/${authAccount.uid}`), {
                    name: req.name,
                    code: req.code,
                    level: req.level || '1',
                    phone: req.phone,
                    authEmail: authAccount.email,
                    xp: 0,
                    createdAt: new Date().toISOString(),
                    createdFromRequest: key
                });
                await fbSet(fbRef(db, `leaderboard/${authAccount.uid}`), {
                    name: String(req.name || '').split(' ')[0],
                    level: req.level || '1',
                    xp: 0
                });
                await fbUpdate(fbRef(db, `registration_requests/${key}`), {
                    status: 'approved',
                    approvedAt: new Date().toISOString(),
                    approvedUid: authAccount.uid,
                    authEmail: authAccount.email
                });
                showToast('تم إنشاء حساب الطالب والموافقة على الطلب', 'success');
            } catch (err) {
                console.error(err);
                showToast('تعذر الموافقة على الطلب. راجع الكود أو كلمة المرور أو إعدادات Firebase.', 'error');
            }
        };

        window.rejectAccountRequest = async function(key) {
            if (!confirm('هل تريد رفض هذا الطلب؟')) return;
            await fbUpdate(fbRef(db, `registration_requests/${key}`), { status: 'rejected', reviewedAt: new Date().toISOString() });
            showToast('تم رفض الطلب', 'warning');
        };

        window.deleteAccountRequest = async function(key) {
            if (!confirm('حذف الطلب نهائياً؟')) return;
            await fbRemove(fbRef(db, `registration_requests/${key}`));
            showToast('تم حذف الطلب', 'warning');
        };

        addStudent = async function() {
            const name = document.getElementById('std-name').value.trim();
            const code = document.getElementById('std-code').value.trim();
            const level = document.getElementById('std-level').value;
            const phone = document.getElementById('std-phone').value.trim();
            if(!name || !code || !phone) return showToast('يرجى إكمال بيانات الطالب والكود ورقم الهاتف', 'error');
            if(phone.length < 6) return showToast('رقم الهاتف سيُستخدم ككلمة مرور، ويجب ألا يقل عن 6 أرقام', 'error');
            try {
                if (await studentCodeExists(code)) return showToast('كود الطالب مستخدم بالفعل', 'error');
                const authAccount = await window.createStudentAuthAccount(code, phone);
                await fbSet(fbRef(db, `students/${authAccount.uid}`), {
                    name, code, level, phone,
                    authEmail: authAccount.email,
                    xp: 0,
                    createdAt: new Date().toISOString(),
                    createdByAdmin: true
                });
                await fbSet(fbRef(db, `leaderboard/${authAccount.uid}`), {
                    name: name.split(' ')[0],
                    level,
                    xp: 0
                });
                document.getElementById('std-name').value = '';
                document.getElementById('std-code').value = '';
                document.getElementById('std-phone').value = '';
                showToast(`تم إنشاء الحساب: ${authAccount.email}`, 'success');
            } catch (err) {
                console.error(err);
                showToast('تعذر إنشاء حساب الطالب. تأكد أن Email/Password مفعل وأن الكود/الهاتف صحيحان.', 'error');
            }
        };

        renderExcelReport = function() {
            const month = document.getElementById('monthSelect').value;
            const level = document.getElementById('rep-level-select').value;
            const yearInput = document.getElementById('yearSelect');
            const year = Number(yearInput?.value) || new Date().getFullYear();
            if (yearInput && !yearInput.value) yearInput.value = year;
            const days = new Date(year, Number(month), 0).getDate();
            const students = (window.db_students || []).filter(s => s.level == level);
            let h = `<tr><th class="sticky-col">الطالب</th>`;
            for(let i=1; i<=days; i++) h += `<th>${i}</th>`;
            document.getElementById('excel-header').innerHTML = h + `</tr>`;
            let b = '';
            students.forEach(s => {
                b += `<tr><td class="sticky-col">${escapeHTML(s.name)}</td>`;
                for(let d=1; d<=days; d++) {
                    const ds = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const r = (window.db_attendance || []).find(a => a.date === ds && a.code === s.code);
                    b += `<td class="${r ? (r.status === 'ح' ? 'status-h' : 'status-g') : ''}">${r ? escapeHTML(r.status) : '-'}</td>`;
                }
                b += `</tr>`;
            });
            document.getElementById('excel-body').innerHTML = b;
        };

        async function saveBackup() {
            const paths = ['students', 'content', 'invoices', 'expenses', 'attendance', 'homework', 'grades', 'staff', 'schedule', 'community', 'online_exams', 'support', 'registration_requests', 'assignments', 'submissions', 'live_classes', 'live_recordings', 'notifications', 'question_bank', 'student_reports', 'admin_profiles', 'audit_logs', 'active_sessions', 'student_activity', 'lesson_progress', 'live_attendance'];
            const backup = { exportedAt: new Date().toISOString(), version: 'secure-admin-1.0', data: {} };
            try {
                for (const path of paths) {
                    const snap = await fbGet(fbRef(db, path));
                    backup.data[path] = snap.exists() ? snap.val() : null;
                }
                const blob = new Blob([JSON.stringify(backup, null, 2)], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `titan-backup-${new Date().toISOString().slice(0,10)}.json`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                showToast('تم تصدير النسخة الاحتياطية', 'success');
            } catch (err) {
                console.error(err);
                showToast('تعذر تصدير النسخة الاحتياطية', 'error');
            }
        }


        // ===== Titan Pro: Storage uploads, richer lessons, assignments =====
        function setUploadProgress(prefix, value, label) {
            const wrap = document.getElementById(`${prefix}-upload-progress-wrap`);
            const bar = document.getElementById(`${prefix}-upload-progress`);
            if (!wrap || !bar) return;
            wrap.style.display = 'block';
            const pct = Math.max(0, Math.min(100, Math.round(value || 0)));
            bar.style.width = pct + '%';
            bar.textContent = label || (pct + '%');
            if (pct >= 100) setTimeout(() => { wrap.style.display = 'none'; bar.style.width = '0%'; bar.textContent = '0%'; }, 1500);
        }

        async function uploadFileToStorage(file, folder, progressPrefix) {
            if (!file) return null;
            if (!window.storage) throw new Error('Firebase Storage غير محمل. تأكد من تفعيل Storage ومن اتصال الإنترنت.');
            const maxVideo = 500 * 1024 * 1024;
            const maxOther = 80 * 1024 * 1024;
            if (file.type.startsWith('video/') && file.size > maxVideo) throw new Error('حجم الفيديو أكبر من 500MB. اضغط الفيديو أو ارفع نسخة أصغر.');
            if (!file.type.startsWith('video/') && file.size > maxOther) throw new Error('حجم الملف أكبر من 80MB.');
            const owner = (window.auth && window.auth.currentUser && window.auth.currentUser.uid) ? window.auth.currentUser.uid : 'admin';
            const safeName = String(file.name || 'file').replace(/[^a-zA-Z0-9._-]+/g, '_');
            let path;
            if (String(folder).startsWith('lesson_assets/')) {
                path = `lesson_assets/${owner}/${String(folder).replace('lesson_assets/', '')}/${Date.now()}_${Math.random().toString(36).slice(2)}_${safeName}`;
            } else {
                path = `${folder}/${owner}/${Date.now()}_${Math.random().toString(36).slice(2)}_${safeName}`;
            }
            const ref = window.storage.ref(path);
            const task = ref.put(file, { contentType: file.type || undefined, customMetadata: { originalName: file.name || safeName } });
            return await new Promise((resolve, reject) => {
                task.on('state_changed', snap => {
                    const pct = snap.totalBytes ? (snap.bytesTransferred / snap.totalBytes) * 100 : 0;
                    if (progressPrefix) setUploadProgress(progressPrefix, pct, `${Math.round(pct)}%`);
                }, reject, async () => {
                    const url = await task.snapshot.ref.getDownloadURL();
                    resolve({ url, path, name: file.name, size: file.size, type: file.type || '' });
                });
            });
        }

        function getFileInput(id) { const el = document.getElementById(id); return el && el.files && el.files[0] ? el.files[0] : null; }
        function fileBadge(label, url, icon = 'fa-link') { return url ? `<a class="mini-badge" href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer"><i class="fas ${icon}"></i> ${escapeHTML(label)}</a>` : ''; }
        function isYoutubeUrl(url) { return /youtube\.com|youtu\.be/.test(String(url || '')); }

        uploadLesson = async function() {
            const btn = document.getElementById('publish-lesson-btn');
            const title = document.getElementById('lesson-title').value.trim();
            const level = document.getElementById('lesson-level-select').value;
            if (!title) return showToast('يرجى إدخال عنوان الدرس', 'error');
            try {
                btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الرفع...';
                setUploadProgress('lesson', 3, 'تجهيز الملفات');
                const videoFile = getFileInput('lesson-video-file');
                const pdfFile = getFileInput('lesson-pdf-file');
                const thumbnailFile = getFileInput('lesson-thumbnail-file');
                const codeFile = getFileInput('lesson-code-file');
                const videoUpload = await uploadFileToStorage(videoFile, 'lesson_assets/videos', 'lesson');
                const pdfUpload = await uploadFileToStorage(pdfFile, 'lesson_assets/pdfs', 'lesson');
                const thumbnailUpload = await uploadFileToStorage(thumbnailFile, 'lesson_assets/covers', 'lesson');
                const codeUpload = await uploadFileToStorage(codeFile, 'lesson_assets/code', 'lesson');
                const payload = {
                    title,
                    desc: document.getElementById('lesson-desc').value.trim(),
                    level,
                    category: document.getElementById('lesson-category').value.trim() || 'عام',
                    difficulty: document.getElementById('lesson-difficulty').value,
                    duration: Number(document.getElementById('lesson-duration').value) || 0,
                    featured: document.getElementById('lesson-featured').value === 'true',
                    video: document.getElementById('lesson-video').value.trim(),
                    videoUrl: videoUpload ? videoUpload.url : '',
                    videoPath: videoUpload ? videoUpload.path : '',
                    videoName: videoUpload ? videoUpload.name : '',
                    videoSource: videoUpload ? 'upload' : (isYoutubeUrl(document.getElementById('lesson-video').value) ? 'youtube' : 'none'),
                    code: document.getElementById('lesson-code').value.trim(),
                    codeFileUrl: codeUpload ? codeUpload.url : '',
                    codeFilePath: codeUpload ? codeUpload.path : '',
                    pdf: document.getElementById('lesson-pdf').value.trim(),
                    pdfUrl: pdfUpload ? pdfUpload.url : '',
                    pdfPath: pdfUpload ? pdfUpload.path : '',
                    thumbnailUrl: thumbnailUpload ? thumbnailUpload.url : '',
                    thumbnailPath: thumbnailUpload ? thumbnailUpload.path : '',
                    date: new Date().toLocaleDateString('ar-EG'),
                    createdAt: new Date().toISOString()
                };
                await fbPush(fbRef(db, 'content'), payload);
                setUploadProgress('lesson', 100, 'تم');
                ['lesson-title','lesson-desc','lesson-category','lesson-duration','lesson-video','lesson-code','lesson-pdf'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
                ['lesson-video-file','lesson-pdf-file','lesson-thumbnail-file','lesson-code-file'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
                showToast('تم رفع ونشر الدرس بنجاح', 'success');
            } catch (err) {
                console.error(err);
                showToast(err.message || 'فشل رفع الدرس', 'error');
            } finally {
                btn.disabled = false; btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> رفع ونشر الدرس';
            }
        };

        renderContent = function() {
            const list = document.getElementById('content-list');
            if (!list) return;
            const term = (document.getElementById('content-search')?.value || '').toLowerCase();
            list.innerHTML = (window.db_content || []).filter(c => [c.title, c.category, c.desc].some(v => String(v || '').toLowerCase().includes(term))).slice().reverse().map(c => {
                const type = c.videoUrl ? 'فيديو مرفوع' : (c.video ? 'YouTube' : 'محتوى نصي');
                const files = [
                    fileBadge('فيديو', c.videoUrl, 'fa-video'),
                    fileBadge('YouTube', c.video, 'fa-youtube'),
                    fileBadge('PDF', c.pdfUrl || c.pdf, 'fa-file-pdf'),
                    fileBadge('كود', c.codeFileUrl || c.code, 'fa-file-code')
                ].join('');
                return `<tr>
                    <td style="text-align:right;"><strong>${escapeHTML(c.title)}</strong><br><span class="muted-help">${escapeHTML(c.category || 'عام')} ${c.duration ? ' • ' + escapeHTML(c.duration) + ' دقيقة' : ''} ${c.featured ? ' • ⭐ مميز' : ''}</span></td>
                    <td>مستوى ${escapeHTML(c.level)}</td>
                    <td>${escapeHTML(type)}</td>
                    <td>${files || '<span class="muted-help">لا توجد ملفات</span>'}</td>
                    <td>${escapeHTML(c.date || '')}</td>
                    <td><button class="btn btn-danger" onclick="if(confirm('حذف الدرس من قاعدة البيانات؟ الملفات المرفوعة ستظل في Storage حتى تحذفها من Firebase Console.')) { fbRemove(fbRef(db, 'content/${jsString(c.fbKey)}')); showToast('تم حذف الدرس', 'warning'); }"><i class="fas fa-trash"></i></button></td>
                </tr>`;
            }).join('');
        };

        createAssignment = async function() {
            const btn = document.getElementById('assignment-save-btn');
            const title = document.getElementById('assignment-title').value.trim();
            if (!title) return showToast('اكتب عنوان المهمة أولاً', 'error');
            try {
                btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري النشر...';
                const file = getFileInput('assignment-file');
                const upload = await uploadFileToStorage(file, 'assignment_assets', 'assignment');
                await fbPush(fbRef(db, 'assignments'), {
                    title,
                    level: document.getElementById('assignment-level').value,
                    dueDate: document.getElementById('assignment-due').value,
                    points: Number(document.getElementById('assignment-points').value) || 40,
                    desc: document.getElementById('assignment-desc').value.trim(),
                    link: document.getElementById('assignment-link').value.trim(),
                    fileUrl: upload ? upload.url : '',
                    filePath: upload ? upload.path : '',
                    fileName: upload ? upload.name : '',
                    createdAt: new Date().toISOString(),
                    date: new Date().toLocaleDateString('ar-EG')
                });
                setUploadProgress('assignment', 100, 'تم');
                ['assignment-title','assignment-due','assignment-points','assignment-desc','assignment-link','assignment-file'].forEach(id => { const el = document.getElementById(id); if(el) el.value = id === 'assignment-points' ? '40' : ''; });
                showToast('تم نشر المهمة للطلاب', 'success');
            } catch (err) {
                console.error(err);
                showToast(err.message || 'فشل نشر المهمة', 'error');
            } finally {
                btn.disabled = false; btn.innerHTML = '<i class="fas fa-plus-circle"></i> نشر المهمة للطلاب';
            }
        };

        renderAssignmentsAdmin = function() {
            const el = document.getElementById('assignments-list-admin');
            if (!el) return;
            el.innerHTML = (window.db_assignments || []).slice().reverse().map(a => `<tr>
                <td style="text-align:right;"><strong>${escapeHTML(a.title)}</strong><br><span class="muted-help">${escapeHTML(a.desc || '').slice(0, 100)}</span></td>
                <td>مستوى ${escapeHTML(a.level)}</td>
                <td>${escapeHTML(a.dueDate || '-')}</td>
                <td>${Number(a.points) || 0} XP</td>
                <td>${fileBadge('فتح', a.fileUrl || a.link, 'fa-paperclip') || '-'}</td>
                <td><button class="btn btn-danger" onclick="if(confirm('حذف المهمة؟')) { fbRemove(fbRef(db, 'assignments/${jsString(a.fbKey)}')); showToast('تم حذف المهمة', 'warning'); }"><i class="fas fa-trash"></i></button></td>
            </tr>`).join('');
        };

        renderSubmissionsAdmin = function() {
            const el = document.getElementById('submissions-list-admin');
            if (!el) return;
            const assignmentMap = Object.fromEntries((window.db_assignments || []).map(a => [a.fbKey, a.title]));
            el.innerHTML = (window.db_submissions || []).slice().reverse().map(s => `<tr>
                <td>${escapeHTML(s.studentName || s.studentCode || '-')}</td>
                <td>${escapeHTML(assignmentMap[s.assignmentKey] || s.assignmentTitle || '-')}</td>
                <td style="text-align:right; max-width:260px;">${escapeHTML(s.note || '')}</td>
                <td>${fileBadge(s.fileName || 'تحميل', s.fileUrl, 'fa-download') || '-'}</td>
                <td>${escapeHTML(s.date || '')}</td>
                <td><span class="mini-badge"><i class="fas fa-check"></i> مستلم</span></td>
            </tr>`).join('') || '<tr><td colspan="6">لا توجد تسليمات بعد.</td></tr>';
        };

        const titanProOldUpdateStats = updateStats;
        updateStats = function() {
            titanProOldUpdateStats();
            const uploaded = (window.db_content || []).filter(c => !!c.videoUrl).length;
            const assignments = (window.db_assignments || []).length;
            if (document.getElementById('st-uploaded-videos')) document.getElementById('st-uploaded-videos').innerText = uploaded;
            if (document.getElementById('st-assignments')) document.getElementById('st-assignments').innerText = assignments;
        };


        function toggleTheme() { document.body.setAttribute('data-theme', document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); }
        function initChart() { const ctx = document.getElementById('mainChart').getContext('2d'); if (mainChart) mainChart.destroy(); mainChart = new Chart(ctx, { type: 'line', data: { labels: ['يناير', 'فبراير', 'مارس', 'أبريل'], datasets: [{ label: 'الإيرادات', data: [500, 1200, 800, 1500], borderColor: '#4f46e5', tension: 0.4 }] } }); window.mainChart = mainChart; }
        function factoryReset() { if(confirm("حذف كل شيء؟")) { ['students', 'content', 'invoices', 'expenses', 'attendance', 'homework', 'grades', 'staff', 'schedule', 'community', 'online_exams', 'support', 'registration_requests', 'assignments', 'submissions', 'live_classes', 'live_recordings', 'notifications', 'question_bank', 'student_reports', 'admin_profiles', 'audit_logs', 'active_sessions', 'student_activity', 'lesson_progress', 'live_attendance'].forEach(p => fbRemove(fbRef(db, p))); location.reload(); } }
        setInterval(() => { document.getElementById('live-clock').innerText = new Date().toLocaleString('ar-EG'); }, 1000);
    

        // ===== Titan Live Classroom: upload stability hotfix =====
        function titanHumanBytes(bytes) {
            const n = Number(bytes) || 0;
            if (n < 1024) return n + ' B';
            if (n < 1024*1024) return (n/1024).toFixed(1) + ' KB';
            if (n < 1024*1024*1024) return (n/1024/1024).toFixed(1) + ' MB';
            return (n/1024/1024/1024).toFixed(1) + ' GB';
        }
        uploadFileToStorage = async function(file, folder, progressPrefix) {
            if (!file) return null;
            if (!window.storage) throw new Error('Firebase Storage غير محمل. فعّل Storage من Firebase Console وتأكد من تحميل firebase-storage-compat.');
            if (!window.auth || !window.auth.currentUser) throw new Error('لازم تكون مسجل دخول كإدارة قبل الرفع.');
            const maxVideo = 500 * 1024 * 1024;
            const maxOther = 80 * 1024 * 1024;
            if (file.type.startsWith('video/') && file.size > maxVideo) throw new Error('حجم الفيديو أكبر من 500MB.');
            if (!file.type.startsWith('video/') && file.size > maxOther) throw new Error('حجم الملف أكبر من 80MB.');
            const owner = window.auth.currentUser.uid;
            const safeName = String(file.name || 'file').replace(/[^a-zA-Z0-9._-]+/g, '_');
            const cleanFolder = String(folder || 'uploads').replace(/^\/+|\/+$/g, '');
            let path;
            if (cleanFolder.startsWith('lesson_assets/')) {
                path = `lesson_assets/${owner}/${cleanFolder.replace('lesson_assets/', '')}/${Date.now()}_${Math.random().toString(36).slice(2)}_${safeName}`;
            } else if (cleanFolder === 'assignment_assets') {
                path = `assignment_assets/${owner}/${Date.now()}_${Math.random().toString(36).slice(2)}_${safeName}`;
            } else {
                path = `${cleanFolder}/${owner}/${Date.now()}_${Math.random().toString(36).slice(2)}_${safeName}`;
            }
            const ref = window.storage.ref(path);
            setUploadProgress(progressPrefix, 1, `بدء رفع ${safeName}`);
            const task = ref.put(file, { contentType: file.type || undefined, customMetadata: { originalName: file.name || safeName, uploadedBy: owner } });
            return await new Promise((resolve, reject) => {
                let lastMove = Date.now();
                const watchdog = setInterval(() => {
                    if (Date.now() - lastMove > 45000) {
                        clearInterval(watchdog);
                        try { task.cancel(); } catch(e) {}
                        reject(new Error('الرفع متوقف منذ 45 ثانية. راجع Storage Rules والإنترنت وحجم الملف ثم جرّب مرة أخرى.'));
                    }
                }, 5000);
                task.on('state_changed', snap => {
                    lastMove = Date.now();
                    const pct = snap.totalBytes ? (snap.bytesTransferred / snap.totalBytes) * 100 : 0;
                    if (progressPrefix) setUploadProgress(progressPrefix, pct, `${Math.round(pct)}% - ${titanHumanBytes(snap.bytesTransferred)} / ${titanHumanBytes(snap.totalBytes)}`);
                }, err => {
                    clearInterval(watchdog);
                    const code = err && err.code ? err.code : '';
                    let msg = err && err.message ? err.message : 'فشل الرفع.';
                    if (code.includes('unauthorized')) msg = 'مرفوض من Firebase Storage Rules. انسخ قواعد Storage الجديدة ثم جرّب.';
                    if (code.includes('canceled')) msg = 'تم إلغاء الرفع أو توقف الاتصال.';
                    reject(new Error(msg));
                }, async () => {
                    clearInterval(watchdog);
                    const url = await task.snapshot.ref.getDownloadURL();
                    if (progressPrefix) setUploadProgress(progressPrefix, 100, 'تم الرفع');
                    resolve({ url, path, name: file.name, size: file.size, type: file.type || '' });
                });
            });
        };


        // ===== Titan Live Classroom: Admin / Teacher - FIX V3 =====
        const VCAdmin = (() => {
            const state = {
                sessionId:null, localStream:null, screenStream:null, peers:{}, remoteStreams:{}, participants:{},
                chatUnsub:null, partUnsub:null, sigUnsub:null, recUnsub:null,
                mediaRecorder:null, recordedChunks:[], recordingCanvas:null, recordingTimer:null, recordTimerInterval:null, recordStartedAt:0, recordPausedAt:0, recordPausedTotal:0, lastRecordingMeta:null,
                micOn:true, camOn:true, isScreenSharing:false, lastOffers:{}, lastOffers:{}
            };
            const rtcConfig = { iceServers: [{urls:'stun:stun.l.google.com:19302'}, {urls:'stun:stun1.l.google.com:19302'}] };
            const $ = id => document.getElementById(id);
            const me = () => (window.auth && window.auth.currentUser) ? window.auth.currentUser.uid : 'teacher';
            const name = () => 'المعلم';
            const ref = path => (window.db || firebase.database()).ref(path);
            const now = () => new Date().toISOString();
            function uidSafe(v){ return String(v || '').replace(/[^a-zA-Z0-9_-]/g,'_'); }
            function roomPath(p=''){ return `live_classes/${state.sessionId}${p?'/'+p:''}`; }

            function recordOptions(){
                const q = $('vc-record-quality')?.value === '1080' ? '1080' : '720';
                const mode = $('vc-record-mode')?.value || 'auto';
                const dims = q === '1080'
                    ? {w:1920,h:1080,fps:30,vbps:5000000, abps:160000}
                    : {w:1280,h:720,fps:24,vbps:2500000, abps:128000};
                return {quality:q, mode, autoPublish: !!$('vc-record-autopublish')?.checked, ...dims};
            }
            function screenConstraints(){
                const o = recordOptions();
                return {video:{width:{ideal:o.w}, height:{ideal:o.h}, frameRate:{ideal:o.fps,max:o.fps}, cursor:'always'}, audio:true};
            }
            function formatTime(ms){
                ms = Math.max(0, Number(ms)||0);
                const s = Math.floor(ms/1000), h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sec=s%60;
                return h ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
            }
            function elapsedMs(){
                if(!state.recordStartedAt) return 0;
                const until = state.mediaRecorder && state.mediaRecorder.state === 'paused' && state.recordPausedAt ? state.recordPausedAt : Date.now();
                return until - state.recordStartedAt - (state.recordPausedTotal || 0);
            }
            function setRecordStatus(text, kind){
                const el=$('vc-record-status'); if(el) el.textContent = text || '';
                const timer=$('vc-record-timer'); if(timer){
                    timer.classList.toggle('recording', kind === 'recording');
                    timer.classList.toggle('paused', kind === 'paused');
                    timer.innerHTML = `<i class="fas fa-clock"></i> ${formatTime(elapsedMs())}`;
                }
            }
            function startRecordTimer(){
                clearInterval(state.recordTimerInterval);
                state.recordTimerInterval = setInterval(()=>setRecordStatus(state.mediaRecorder?.state === 'paused' ? 'التسجيل متوقف مؤقتاً' : 'التسجيل يعمل الآن', state.mediaRecorder?.state === 'paused' ? 'paused' : 'recording'), 500);
            }
            function stopRecordTimer(){
                clearInterval(state.recordTimerInterval); state.recordTimerInterval=null;
                const timer=$('vc-record-timer'); if(timer){timer.classList.remove('recording','paused'); timer.innerHTML='<i class="fas fa-clock"></i> 00:00';}
                const pause=$('vc-admin-record-pause-btn'); if(pause){pause.disabled=true; pause.innerHTML='<i class="fas fa-pause"></i> Pause';}
                setRecordStatus('جاهز للتسجيل');
            }


            function ensureVideo(id, label, muted=false){
                const grid = $('vc-admin-grid'); if(!grid) return null;
                let tile = document.getElementById('vc-tile-admin-' + uidSafe(id));
                if(!tile){
                    tile = document.createElement('div'); tile.className='vc-tile'; tile.id='vc-tile-admin-' + uidSafe(id);
                    tile.innerHTML = `<video playsinline autoplay ${muted?'muted':''}></video><div class="vc-status"><span class="vc-pill"><i class="fas fa-microphone"></i></span><span class="vc-pill"><i class="fas fa-video"></i></span></div><div class="vc-name"></div>`;
                    grid.appendChild(tile);
                }
                tile.querySelector('.vc-name').textContent = label || id;
                return tile.querySelector('video');
            }

            function setLocalPreview(label){
                const v = ensureVideo(me(), label || (state.isScreenSharing ? 'مشاركة شاشة المعلم' : 'أنت - المعلم'), true);
                if(v && state.localStream) v.srcObject = state.localStream;
            }

            async function ensureLocalStream(){
                if(state.localStream) {
                    state.localStream.getAudioTracks().forEach(t=>t.enabled=state.micOn);
                    state.localStream.getVideoTracks().forEach(t=>t.enabled=state.camOn || state.isScreenSharing);
                    setLocalPreview();
                    return state.localStream;
                }
                try {
                    state.localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:true});
                } catch(e) {
                    console.error(e);
                    state.localStream = new MediaStream();
                    showToast('لم يتم فتح الكاميرا/المايك. افتح الصلاحيات من المتصفح ثم حاول مرة أخرى.', 'warning');
                }
                state.localStream.getAudioTracks().forEach(t=>t.enabled=state.micOn);
                state.localStream.getVideoTracks().forEach(t=>t.enabled=state.camOn);
                setLocalPreview('أنت - المعلم');
                return state.localStream;
            }

            async function syncTracks(pc){
                if(!state.localStream) return;
                const liveTracks = state.localStream.getTracks().filter(t => t.readyState !== 'ended');
                for(const track of liveTracks){
                    const sender = pc.getSenders().find(s => s.track && s.track.kind === track.kind);
                    if(sender && sender.track !== track){
                        try { await sender.replaceTrack(track); } catch(e) { console.warn(e); }
                    } else if(!sender) {
                        try { pc.addTrack(track, state.localStream); } catch(e) { console.warn(e); }
                    }
                }
                pc.getSenders().forEach(sender => {
                    if(sender.track && !liveTracks.some(t => t.kind === sender.track.kind)) {
                        try { pc.removeTrack(sender); } catch(e) {}
                    }
                });
            }

            async function makeOffer(peerUid, opts={}){
                const nowMs = Date.now();
                state.lastOffers = state.lastOffers || {};
                if(!opts.force && !opts.iceRestart && state.lastOffers[peerUid] && nowMs - state.lastOffers[peerUid] < 2200) return;
                state.lastOffers[peerUid] = nowMs;
                const pc = await getPeer(peerUid);
                await syncTracks(pc);
                if(pc.signalingState !== 'stable' && !opts.iceRestart) return;
                const offer = await pc.createOffer(opts);
                await pc.setLocalDescription(offer);
                if(!pc.localDescription || !pc.localDescription.sdp) {
                    console.warn('لم يتم إنشاء offer صالح للطالب', peerUid);
                    return;
                }
                await sendSignal(peerUid, {type:'offer', sdp:{type:pc.localDescription.type, sdp:pc.localDescription.sdp}, shareVersion: Date.now()});
            }


            async function getPeer(peerUid){
                if(state.peers[peerUid]) return state.peers[peerUid];
                const pc = new RTCPeerConnection(rtcConfig);
                state.peers[peerUid]=pc;
                pc.onicecandidate = e => { if(e.candidate) sendSignal(peerUid, {type:'candidate', candidate:e.candidate.toJSON ? e.candidate.toJSON() : e.candidate}); };
                pc.ontrack = e => {
                    const stream = e.streams[0]; if(!stream) return;
                    state.remoteStreams[peerUid]=stream;
                    const p = state.participants[peerUid] || {};
                    const v = ensureVideo(peerUid, p.name || 'طالب');
                    if(v) v.srcObject = stream;
                };
                pc.onconnectionstatechange = () => {
                    if(['failed','closed','disconnected'].includes(pc.connectionState)) removePeer(peerUid, false);
                };
                if(state.localStream) syncTracks(pc).catch(console.warn);
                return pc;
            }

            function removePeer(peerUid, removeTile=true){
                if(state.peers[peerUid]) { try{state.peers[peerUid].close();}catch(e){} delete state.peers[peerUid]; }
                delete state.remoteStreams[peerUid];
                if(removeTile) document.getElementById('vc-tile-admin-'+uidSafe(peerUid))?.remove();
            }

            async function sendSignal(to, payload){
                if(!state.sessionId) return;
                const clean = JSON.parse(JSON.stringify({...payload, from:me(), to, at:Date.now()}));
                await ref(`${roomPath('signals')}/${uidSafe(to)}`).push(clean);
            }

            async function handleSignal(sigKey, sig){
                if(!sig || sig.to !== me() || !sig.from) return;
                const pc = await getPeer(sig.from);
                try {
                    if(sig.type === 'offer'){
                        if(pc.signalingState !== 'stable') {
                            try { await pc.setLocalDescription({type:'rollback'}); } catch(e) {}
                        }
                        await pc.setRemoteDescription(new RTCSessionDescription(sig.sdp));
                        await syncTracks(pc);
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        await sendSignal(sig.from, {type:'answer', sdp:pc.localDescription});
                    } else if(sig.type === 'answer'){
                        if(pc.signalingState === 'have-local-offer') await pc.setRemoteDescription(new RTCSessionDescription(sig.sdp));
                    } else if(sig.type === 'candidate'){
                        try { await pc.addIceCandidate(new RTCIceCandidate(sig.candidate)); } catch(e) { console.warn(e); }
                    }
                    ref(`${roomPath('signals')}/${uidSafe(me())}/${sigKey}`).remove();
                } catch(err) {
                    console.error(err);
                    showToast('حدث خطأ في اتصال الحصة. جرّب إعادة دخول الطالب أو تحديث الصفحة.', 'error');
                }
            }

            function listenRoom(){
                state.partUnsub && state.partUnsub.off && state.partUnsub.off();
                const partRef = ref(roomPath('participants'));
                partRef.on('value', snap => {
                    state.participants = snap.val() || {};
                    renderParticipants();
                    Object.entries(state.participants).forEach(([uid,p]) => {
                        if(uid !== me() && p.online !== false && p.role !== 'teacher') {
                            const hadPeer = !!state.peers[uid];
                            getPeer(uid).then(pc => {
                                if(!hadPeer || pc.connectionState === 'new' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                                    makeOffer(uid).catch(console.warn);
                                }
                            });
                        }
                    });
                    Object.keys(state.peers).forEach(uid=>{
                        if(!state.participants[uid] || state.participants[uid].online===false) removePeer(uid);
                    });
                });
                state.partUnsub = partRef;

                const chatRef = ref(roomPath('chat')).limitToLast(80);
                chatRef.on('value', snap => renderChat(snap.val() || {}));
                state.chatUnsub = chatRef;

                const sigRef = ref(`${roomPath('signals')}/${uidSafe(me())}`);
                sigRef.on('child_added', snap => handleSignal(snap.key, snap.val()).catch(console.error));
                state.sigUnsub = sigRef;

                const recRef = ref('live_recordings').orderByChild('sessionId').equalTo(state.sessionId).limitToLast(20);
                recRef.on('value', snap => renderRecordings(snap.val() || {}));
                state.recUnsub = recRef;
            }

            function renderParticipants(){
                const el = $('vc-admin-participants'); if(!el) return;
                const rows = Object.entries(state.participants).filter(([uid]) => uid !== me()).map(([uid,p]) => `<div class="vc-participant"><div><strong>${escapeHTML(p.name || 'طالب')}</strong><br><span class="muted-help">${escapeHTML(p.code || uid)} • ${p.online===false?'غير متصل':'متصل'}</span></div><div class="vc-mini-actions"><button title="السماح/منع المايك" class="btn ${p.micAllowed?'btn-success':'btn-danger'}" onclick="VCAdmin.setPermission('${jsString(uid)}','micAllowed',${!p.micAllowed})"><i class="fas fa-microphone"></i></button><button title="السماح/منع الكاميرا" class="btn ${p.camAllowed?'btn-success':'btn-danger'}" onclick="VCAdmin.setPermission('${jsString(uid)}','camAllowed',${!p.camAllowed})"><i class="fas fa-video"></i></button><button title="قفل مايك وكاميرا الطالب" class="btn btn-warning" onclick="VCAdmin.forceOff('${jsString(uid)}')"><i class="fas fa-ban"></i></button><button title="طرد الطالب" class="btn btn-danger" onclick="VCAdmin.kick('${jsString(uid)}')"><i class="fas fa-user-slash"></i></button></div></div>`).join('');
                el.innerHTML = rows || '<span class="muted-help">لا يوجد طلاب داخل الحصة الآن.</span>';
            }

            function renderChat(items){
                const el=$('vc-admin-chat'); if(!el) return;
                el.innerHTML = Object.values(items).sort((a,b)=>(a.time||0)-(b.time||0)).map(m=>`<div class="vc-chat-msg"><strong>${escapeHTML(m.name||'مشارك')}</strong><div>${escapeHTML(m.text||'')}</div><small>${escapeHTML(m.when||'')}</small></div>`).join('');
                el.scrollTop = el.scrollHeight;
            }

            function renderRecordings(items){
                const el=$('vc-admin-recordings'); if(!el) return;
                const arr=Object.values(items).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
                el.innerHTML = arr.length ? arr.map(r=>`<div class="vc-chat-msg"><strong>${escapeHTML(r.title||'تسجيل حصة')}</strong><br>${r.url ? `<a href="${safeUrl(r.url)}" target="_blank" rel="noopener noreferrer" class="mini-badge"><i class="fas fa-download"></i> فتح التسجيل</a>` : `<span class="mini-badge"><i class="fas fa-download"></i> تم تنزيله محلياً</span>`}<br><small>${escapeHTML(r.when||'')}</small></div>`).join('') : '<span class="muted-help">لا توجد تسجيلات محفوظة بعد.</span>';
            }

            function onlineStudentIds(){
                return Object.entries(state.participants || {})
                    .filter(([uid,p]) => uid !== me() && p && p.online !== false && p.role !== 'teacher')
                    .map(([uid]) => uid);
            }

            function setShareUi(isSharing){
                const btn = $('vc-admin-share-btn');
                const banner = $('vc-admin-share-banner');
                if(btn) {
                    btn.classList.toggle('is-sharing', !!isSharing);
                    btn.innerHTML = isSharing
                        ? '<i class="fas fa-stop-circle"></i> إيقاف مشاركة الشاشة'
                        : '<i class="fas fa-desktop"></i> مشاركة الشاشة';
                }
                if(banner) {
                    banner.classList.toggle('active', !!isSharing);
                    banner.innerHTML = isSharing
                        ? '<i class="fas fa-desktop"></i> مشاركة الشاشة تعمل الآن. الطلاب سيشاهدون شاشة المعلم في بطاقة كبيرة.'
                        : '';
                }
            }

            async function hardReconnectStudents(reason){
                const ids = onlineStudentIds();
                for(const uid of ids){
                    try { await sendSignal(uid, {type:'restart', reason, shareVersion:Date.now()}); } catch(e) { console.warn(e); }
                    removePeer(uid, false);
                }
                await new Promise(resolve => setTimeout(resolve, 450));
                await Promise.all(ids.map(uid => makeOffer(uid, {iceRestart:true, force:true}).catch(console.warn)));
            }

            async function reconnectStudentsForShare(reason){
                // V18 fix: this function was called by screen share on/off but was missing in some builds.
                // Use a hard ICE restart so students receive the new screen/video track instead of a frozen frame.
                return hardReconnectStudents(reason || 'screen_changed');
            }

            async function renegotiateAll(opts={}){
                await Promise.all(Object.keys(state.peers).map(uid=>makeOffer(uid, {...opts, force:true}).catch(console.warn)));
            }

            async function replaceLocalVideoTrack(newTrack, label){
                await ensureLocalStream();
                state.localStream.getVideoTracks().forEach(t => {
                    if(t !== newTrack) {
                        try { t.stop(); } catch(e) {}
                        try { state.localStream.removeTrack(t); } catch(e) {}
                    }
                });
                if(newTrack && !state.localStream.getTracks().includes(newTrack)) state.localStream.addTrack(newTrack);
                setLocalPreview(label);
                await Promise.all(Object.values(state.peers).map(async pc => {
                    const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                    if(sender) {
                        try { await sender.replaceTrack(newTrack); } catch(e) { console.warn(e); }
                    } else if(newTrack) {
                        try { pc.addTrack(newTrack, state.localStream); } catch(e) { console.warn(e); }
                    }
                }));
            }

            async function stopScreenShare(){
                if(!state.isScreenSharing) return;
                state.isScreenSharing = false;
                try {
                    if(state.screenStream) state.screenStream.getTracks().forEach(t => { try{t.stop();}catch(e){} });
                    const fresh = await navigator.mediaDevices.getUserMedia({video:true, audio:false});
                    const camTrack = fresh.getVideoTracks()[0];
                    camTrack.enabled = state.camOn;
                    await replaceLocalVideoTrack(camTrack, 'أنت - المعلم');
                    await ref(roomPath()).update({screenSharing:false, shareVersion:Date.now(), screenOwner:null});
                    setShareUi(false);
                    await reconnectStudentsForShare('screen_off');
                    showToast('تم إيقاف مشاركة الشاشة', 'warning');
                } catch(e) {
                    console.error(e);
                    await ref(roomPath()).update({screenSharing:false, shareVersion:Date.now(), screenOwner:null}).catch(()=>{});
                    setShareUi(false);
                    await reconnectStudentsForShare('screen_off').catch(()=>{});
                    showToast('تم إيقاف مشاركة الشاشة. افتح الكاميرا مرة أخرى إذا لزم.', 'warning');
                }
            }

            async function shareScreen(){
                if(!state.sessionId) return showToast('ابدأ الحصة أولاً', 'error');
                if(state.isScreenSharing) return stopScreenShare();
                if(!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) return showToast('المتصفح لا يدعم مشاركة الشاشة. استخدم Chrome أو Edge.', 'error');
                try {
                    const screen = await navigator.mediaDevices.getDisplayMedia(screenConstraints());
                    const screenTrack = screen.getVideoTracks()[0];
                    if(!screenTrack) return showToast('لم يتم اختيار شاشة للمشاركة.', 'error');
                    state.screenStream = screen;
                    state.isScreenSharing = true;
                    await replaceLocalVideoTrack(screenTrack, 'مشاركة شاشة المعلم');
                    await ref(roomPath()).update({screenSharing:true, shareVersion:Date.now(), screenOwner:me()});
                    setShareUi(true);
                    await reconnectStudentsForShare('screen_on');
                    showToast('مشاركة الشاشة بدأت. انتظر ثواني حتى تظهر عند الطلاب.', 'success');
                    screenTrack.onended = () => stopScreenShare().catch(console.error);
                } catch(e) {
                    console.error(e);
                    showToast('تم إلغاء مشاركة الشاشة أو الصلاحية مرفوضة.', 'warning');
                    setShareUi(false);
                }
            }

            function buildMixedRecordingStream(){
                const opt = recordOptions();
                function addMixedAudioTracks(out){
                    try{
                        const AudioCtx = window.AudioContext || window.webkitAudioContext;
                        const ac = new AudioCtx();
                        if(ac.state === 'suspended') ac.resume().catch(()=>{});
                        const dest = ac.createMediaStreamDestination();
                        const sources = [state.localStream, state.screenStream, ...Object.values(state.remoteStreams || {})].filter(Boolean);
                        sources.forEach(s => {
                            (s.getAudioTracks ? s.getAudioTracks() : []).forEach(track => {
                                if(track.readyState === 'ended') return;
                                try { ac.createMediaStreamSource(new MediaStream([track])).connect(dest); }
                                catch(e) { console.warn('Audio mix skipped track', e); }
                            });
                        });
                        dest.stream.getAudioTracks().forEach(t => out.addTrack(t));
                    } catch(e){ console.warn('Audio mix failed', e); }
                }

                const shouldRecordScreenDirect = (opt.mode === 'screen') || (opt.mode === 'auto' && state.isScreenSharing);
                if(shouldRecordScreenDirect){
                    const liveScreenTrack = state.screenStream && state.screenStream.getVideoTracks().find(t => t.readyState !== 'ended');
                    if(liveScreenTrack){
                        const out = new MediaStream([liveScreenTrack]);
                        addMixedAudioTracks(out);
                        state.lastRecordingMeta = {...opt, actualMode:'screen'};
                        return out;
                    }
                    if(opt.mode === 'screen') showToast('لا توجد مشاركة شاشة حالياً، سيتم تسجيل الحصة كاملة بدلاً من الشاشة فقط.', 'warning');
                }

                const canvas = document.createElement('canvas');
                canvas.width = opt.w;
                canvas.height = opt.h;
                const ctx = canvas.getContext('2d', {alpha:false});
                state.recordingCanvas = canvas;
                state.lastRecordingMeta = {...opt, actualMode:'class'};
                let lastDraw = 0;
                const draw = (ts) => {
                    if(!lastDraw || ts - lastDraw > (1000 / Math.max(12, opt.fps))) {
                        lastDraw = ts || Date.now();
                        const vids = Array.from(($('vc-admin-grid')||document).querySelectorAll('video'))
                            .filter(v => v.srcObject && v.readyState >= 2 && v.videoWidth > 0 && v.videoHeight > 0);
                        ctx.fillStyle = '#020617';
                        ctx.fillRect(0,0,canvas.width,canvas.height);
                        if(!vids.length){
                            ctx.fillStyle = '#ffffff';
                            ctx.font = 'bold 42px Cairo, Arial, sans-serif';
                            ctx.textAlign = 'center';
                            ctx.fillText('Titan Live Class', canvas.width/2, canvas.height/2);
                        } else {
                            const screenTile = document.querySelector('.vc-screen-tile video');
                            const sorted = screenTile && vids.includes(screenTile) ? [screenTile, ...vids.filter(v=>v!==screenTile)] : vids;
                            const cols = Math.ceil(Math.sqrt(Math.max(1,sorted.length)));
                            const rows = Math.ceil(Math.max(1,sorted.length)/cols);
                            const w = canvas.width/cols;
                            const h = canvas.height/rows;
                            sorted.forEach((v,i)=>{
                                const x=(i%cols)*w, y=Math.floor(i/cols)*h;
                                try { ctx.drawImage(v,x,y,w,h); } catch(e) {}
                            });
                        }
                    }
                    state.recordingTimer = requestAnimationFrame(draw);
                };
                draw(0);
                const out = canvas.captureStream(opt.fps);
                addMixedAudioTracks(out);
                return out;
            }

            function downloadRecording(blob){
                const stamp = new Date().toISOString().replace(/[:.]/g,'-');
                const filename = `Titan-Class-${state.sessionId || 'recording'}-${stamp}.webm`;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
                showToast('تم تنزيل التسجيل في Downloads', 'success');
                return filename;
            }

            async function uploadRecording(blob){
                if(!window.storage) throw new Error('Firebase Storage غير متاح، لكن التسجيل اتنزل عندك محلياً.');
                const path=`class_recordings/${me()}/${state.sessionId}/${Date.now()}_recording.webm`;
                const r=window.storage.ref(path);
                await r.put(blob, {contentType:'video/webm', customMetadata:{sessionId:state.sessionId, teacher:me()}});
                const url=await r.getDownloadURL();
                const opt = state.lastRecordingMeta || recordOptions();
                const payload={sessionId:state.sessionId,title:$('vc-admin-title')?.value||'تسجيل حصة',level:$('vc-admin-level')?.value||'1',url,path,quality:opt.quality||'',mode:opt.actualMode||opt.mode||'',durationSeconds:Math.round(elapsedMs()/1000),createdAt:now(),when:new Date().toLocaleString('ar-EG')};
                const recSnap = await ref('live_recordings').push(payload);
                await ref(roomPath()).update({recordingUrl:url, lastRecordingAt:now()});
                if(opt.autoPublish){
                    const lesson={title:'Replay - '+payload.title,level:payload.level,category:'تسجيلات الحصص',difficulty:'مراجعة',duration:Math.max(1,Math.round(payload.durationSeconds/60)),videoUrl:url,videoFileUrl:url,uploadedVideo:url,desc:'تسجيل تلقائي من الحصة المباشرة '+(payload.when||''),featured:false,unlockMode:'free',createdAt:Date.now(),source:'live_recording',recordingKey:recSnap.key,sessionId:state.sessionId};
                    const lessonSnap = await ref('content').push(lesson);
                    await recSnap.update({publishedAsLesson:true, lessonKey:lessonSnap.key});
                    showToast('تم حفظ التسجيل ونشره كدرس Replay للطلاب', 'success');
                } else {
                    showToast('تم حفظ نسخة من التسجيل على Firebase Storage', 'success');
                }
            }

            async function startClass(){
                if(!window.auth || !window.auth.currentUser) return showToast('سجل دخول الإدارة أولاً', 'error');
                const code=($('vc-admin-code')?.value||'').trim() || ('CLS-' + Math.random().toString(36).slice(2,8).toUpperCase());
                state.sessionId=code;
                await ensureLocalStream();
                await ref(roomPath()).set({title:($('vc-admin-title')?.value||'حصة مباشرة').trim(), level:$('vc-admin-level')?.value||'1', status:'live', sessionId:code, teacherUid:me(), screenSharing:false, shareVersion:Date.now(), createdAt:now(), startedAt:new Date().toLocaleString('ar-EG')});
                await ref(`${roomPath('participants')}/${me()}`).set({name:name(), role:'teacher', online:true, micAllowed:true, camAllowed:true, micOn:true, camOn:true, joinedAt:now()});
                $('vc-admin-session-code').textContent=code;
                listenRoom();
                showToast('تم بدء الحصة. انسخ الكود وارسله للطلاب.', 'success');
            }

            async function endClass(){
                if(!state.sessionId) return;
                if(state.mediaRecorder && ['recording','paused'].includes(state.mediaRecorder.state)) await toggleRecording();
                if(state.isScreenSharing) await stopScreenShare().catch(()=>{});
                await ref(roomPath()).update({status:'ended', endedAt:now()});
                Object.keys(state.peers).forEach(uid=>removePeer(uid));
                if(state.localStream) state.localStream.getTracks().forEach(t=>t.stop());
                state.localStream=null; state.sessionId=null; if(window.setShareUi){try{setShareUi(false)}catch(e){}} $('vc-admin-session-code').textContent='لا توجد حصة'; $('vc-admin-grid').innerHTML='';
                showToast('تم إنهاء الحصة', 'warning');
            }

            async function toggleMic(){
                await ensureLocalStream();
                state.micOn=!state.micOn;
                state.localStream.getAudioTracks().forEach(t=>t.enabled=state.micOn);
                if(state.sessionId) await ref(`${roomPath('participants')}/${me()}`).update({micOn:state.micOn});
            }

            async function toggleCamera(){
                await ensureLocalStream();
                if(state.isScreenSharing) return showToast('الكاميرا متوقفة أثناء مشاركة الشاشة. أوقف المشاركة أولاً.', 'warning');
                state.camOn=!state.camOn;
                state.localStream.getVideoTracks().forEach(t=>t.enabled=state.camOn);
                if(state.sessionId) await ref(`${roomPath('participants')}/${me()}`).update({camOn:state.camOn});
            }

            async function toggleRecording(){
                const btn=$('vc-admin-record-btn');
                if(state.mediaRecorder && ['recording','paused'].includes(state.mediaRecorder.state)){
                    return new Promise(resolve=>{
                        state.mediaRecorder.onstop=async()=>{
                            if(state.recordingTimer) cancelAnimationFrame(state.recordingTimer);
                            const blob=new Blob(state.recordedChunks,{type:'video/webm'});
                            state.recordedChunks=[];
                            if(btn) btn.innerHTML='<i class="fas fa-record-vinyl"></i> بدء التسجيل';
                            const pauseBtn=$('vc-admin-record-pause-btn'); if(pauseBtn){pauseBtn.disabled=true; pauseBtn.innerHTML='<i class="fas fa-pause"></i> Pause';}
                            const durationMs = elapsedMs();
                            const filename = downloadRecording(blob);
                            try {
                                await uploadRecording(blob);
                            } catch(e) {
                                console.warn(e);
                                await ref('live_recordings').push({sessionId:state.sessionId,title:$('vc-admin-title')?.value||'تسجيل حصة',localOnly:true,filename,createdAt:now(),when:new Date().toLocaleString('ar-EG')}).catch(()=>{});
                                showToast('التسجيل اتنزل في Downloads. الحفظ على Storage لم يتم: ' + (e.message || e), 'warning');
                            }
                            stopRecordTimer();
                            resolve();
                        };
                        if(state.mediaRecorder.state === 'paused') { try{ state.mediaRecorder.resume(); }catch(e){} }
                        state.mediaRecorder.stop();
                    });
                }
                if(!state.sessionId) return showToast('ابدأ الحصة أولاً', 'error');
                const opt = recordOptions();
                const stream=buildMixedRecordingStream();
                state.recordedChunks=[];
                state.recordStartedAt=Date.now(); state.recordPausedAt=0; state.recordPausedTotal=0;
                const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus') ? 'video/webm;codecs=vp8,opus' : (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm');
                state.mediaRecorder=new MediaRecorder(stream, {mimeType:mime, videoBitsPerSecond: opt.vbps, audioBitsPerSecond: opt.abps});
                state.mediaRecorder.ondataavailable=e=>{ if(e.data && e.data.size) state.recordedChunks.push(e.data); };
                state.mediaRecorder.start(1000);
                if(btn) btn.innerHTML='<i class="fas fa-stop"></i> إيقاف وتنزيل التسجيل';
                const pauseBtn=$('vc-admin-record-pause-btn'); if(pauseBtn){pauseBtn.disabled=false; pauseBtn.innerHTML='<i class="fas fa-pause"></i> Pause';}
                startRecordTimer(); setRecordStatus('التسجيل يعمل الآن', 'recording');
                showToast(state.lastRecordingMeta?.actualMode === 'screen' ? 'بدأ تسجيل الشاشة بجودة '+opt.quality+'p بدون تجميد.' : 'بدأ تسجيل الحصة كاملة بجودة '+opt.quality+'p.', 'success');
            }


            async function toggleRecordingPause(){
                const r = state.mediaRecorder;
                const btn = $('vc-admin-record-pause-btn');
                if(!r || !['recording','paused'].includes(r.state)) return showToast('لا يوجد تسجيل يعمل الآن', 'warning');
                if(r.state === 'recording'){
                    r.pause(); state.recordPausedAt = Date.now();
                    if(btn) btn.innerHTML='<i class="fas fa-play"></i> Resume';
                    setRecordStatus('التسجيل متوقف مؤقتاً', 'paused');
                    showToast('تم إيقاف التسجيل مؤقتاً', 'warning');
                } else {
                    state.recordPausedTotal += Date.now() - (state.recordPausedAt || Date.now());
                    state.recordPausedAt = 0; r.resume();
                    if(btn) btn.innerHTML='<i class="fas fa-pause"></i> Pause';
                    setRecordStatus('التسجيل يعمل الآن', 'recording');
                    showToast('تم استكمال التسجيل', 'success');
                }
            }

            async function setPermission(uid, field, value){ await ref(`${roomPath('participants')}/${uid}`).update({[field]:value}); }
            async function forceOff(uid){ await ref(`${roomPath('participants')}/${uid}`).update({micAllowed:false, camAllowed:false, micOn:false, camOn:false, forceOffAt:Date.now()}); }
            async function kick(uid){ await ref(`${roomPath('participants')}/${uid}`).update({kicked:true, online:false}); removePeer(uid); }
            async function sendChat(){ const input=$('vc-admin-chat-input'); const text=(input?.value||'').trim(); if(!text||!state.sessionId)return; input.value=''; await ref(roomPath('chat')).push({from:me(),name:name(),text,time:Date.now(),when:new Date().toLocaleTimeString('ar-EG')}); }
            function copyCode(){ const code=state.sessionId || $('vc-admin-session-code')?.textContent || ''; navigator.clipboard?.writeText(code); showToast('تم نسخ كود الحصة', 'success'); }
            return {startClass,endClass,toggleMic,toggleCamera,shareScreen,stopScreenShare,toggleRecording,toggleRecordingPause,setPermission,forceOff,kick,sendChat,copyCode};
        })();


// ===== admin_secure_live_classroom_v15_customization_studio.html :: titan-admin-share-note-v6 =====
window.addEventListener('DOMContentLoaded', function(){
  try {
    if(location.protocol === 'file:') {
      var box = document.createElement('div');
      box.style.cssText='position:fixed;left:14px;bottom:14px;z-index:999999;background:#fff7ed;color:#9a3412;border:1px solid #fdba74;border-radius:16px;padding:12px 14px;font-family:Cairo,Arial,sans-serif;font-weight:800;direction:rtl;box-shadow:0 12px 30px rgba(0,0,0,.14)';
      box.innerHTML='تنبيه: مشاركة الشاشة والكاميرا أفضل على Live Server / localhost أو HTTPS، وليس file://';
      document.body.appendChild(box);
      setTimeout(function(){box.remove()}, 7000);
    }
  } catch(e){}
});


// ===== admin_secure_live_classroom_v15_customization_studio.html :: titan-file-origin-note-v7 =====
window.addEventListener('DOMContentLoaded', function(){
  try {
    if(location.protocol === 'file:') {
      var box=document.createElement('div');
      box.className='vc-debug-note';
      box.style.cssText+='position:fixed;left:14px;bottom:14px;z-index:999999;max-width:520px;';
      box.innerHTML='تنبيه مهم: أنت فاتح الصفحة من file://. مشاركة الشاشة والكاميرا والـ WebRTC أحياناً لا يعملوا بثبات من file. افتح الملفات من VS Code Live Server أو localhost.';
      document.body.appendChild(box);
      setTimeout(function(){box.remove()}, 9000);
    }
  } catch(e){}
});


// ===== admin_secure_live_classroom_v15_customization_studio.html :: titan-admin-v8-features =====
(function(){
  const $ = (id) => document.getElementById(id);
  const esc = (v) => window.escapeHTML ? window.escapeHTML(v) : String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nowIso = () => new Date().toISOString();
  const nowAr = () => new Date().toLocaleString('ar-EG');
  const toast = (m,t='success') => window.showToast ? showToast(m,t) : alert(m);
  function getDb(){ return window.db || (window.firebase && firebase.database && firebase.database()); }
  function getUser(){ return window.auth && window.auth.currentUser; }
  function studentOptions(){ return (window.db_students || []).map(s => `<option value="${esc(s.fbKey)}">${esc(s.name)} - كود ${esc(s.code)}</option>`).join(''); }
  function currentAdminLabel(){ const u=getUser(); return (u && (u.email || u.uid)) || 'admin'; }
  async function audit(action, extra={}){ try{ const db=getDb(); const u=getUser(); if(db && u) await db.ref('audit_logs').push({action, extra, by:u.uid, byEmail:u.email||'', at:nowIso(), when:nowAr()}); }catch(e){ console.warn(e); } }
  async function pushNotification(payload){
    const db=getDb(); if(!db) throw new Error('Firebase غير جاهز');
    const u=getUser();
    const clean = Object.assign({title:'تنبيه جديد', body:'', level:'all', studentKey:'', type:'general', createdAt:nowIso(), when:nowAr(), createdBy:u?u.uid:'admin', createdByLabel:currentAdminLabel()}, payload || {});
    await db.ref('notifications').push(clean);
    await audit('إرسال إشعار: ' + clean.title, {level:clean.level, studentKey:clean.studentKey || ''});
    return clean;
  }
  function targetText(n){ if(n.studentKey){ const s=(window.db_students||[]).find(x=>x.fbKey===n.studentKey); return s ? 'طالب: ' + s.name : 'طالب محدد'; } if(n.level && n.level !== 'all') return 'مستوى ' + n.level; return 'كل الطلاب'; }
  function refreshSelects(){
    ['notify-student','parent-student-select','report-student-select'].forEach(id => { const el=$(id); if(el) el.innerHTML = studentOptions(); });
    const month=$('report-month-input'); if(month && !month.value) month.value = new Date().toISOString().slice(0,7);
    refreshNotificationTargets();
  }
  function refreshNotificationTargets(){
    const type=$('notify-target-type')?.value || 'all';
    if($('notify-level')) $('notify-level').style.display = type === 'level' ? 'block' : 'none';
    if($('notify-student')) $('notify-student').style.display = type === 'student' ? 'block' : 'none';
  }
  async function sendNotificationManual(){
    const title=($('notify-title')?.value||'').trim();
    const body=($('notify-body')?.value||'').trim();
    const type=$('notify-target-type')?.value || 'all';
    if(!title || !body) return toast('اكتب عنوان ونص الإشعار أولاً','error');
    const payload={title, body, level:'all', studentKey:'', type:'manual'};
    if(type==='level') payload.level=$('notify-level')?.value || '1';
    if(type==='student') { payload.studentKey=$('notify-student')?.value || ''; payload.level='student'; }
    await pushNotification(payload);
    if($('notify-title')) $('notify-title').value=''; if($('notify-body')) $('notify-body').value='';
    toast('تم إرسال الإشعار','success');
  }
  function renderNotifications(){
    const el=$('notifications-admin-list'); if(!el) return;
    const items=(window.db_notifications||[]).slice().reverse();
    el.innerHTML = items.length ? items.map(n=>`<tr><td><b>${esc(n.title)}</b></td><td>${esc(targetText(n))}</td><td style="text-align:right;max-width:360px;">${esc(n.body)}</td><td>${esc(n.when || n.createdAt || '')}</td><td><button class="btn btn-danger" onclick="TitanAdminV8.deleteNotification('${esc(n.fbKey)}')"><i class="fas fa-trash"></i></button></td></tr>`).join('') : '<tr><td colspan="5">لا توجد إشعارات بعد.</td></tr>';
  }
  async function deleteNotification(key){ if(!key || !confirm('حذف الإشعار؟')) return; await getDb().ref('notifications/'+key).remove(); toast('تم حذف الإشعار','warning'); }
  function renderQuestionBank(){
    const el=$('question-bank-list'); if(!el) return;
    const rows=(window.db_question_bank||[]).slice().reverse();
    el.innerHTML = rows.length ? rows.map(q=>`<tr><td style="text-align:right;max-width:420px;">${esc(q.text)}</td><td>${esc(q.level)}</td><td>${esc(q.category||'عام')}</td><td>${esc(q.difficulty||'')}</td><td><button class="btn btn-danger" onclick="TitanAdminV8.deleteQuestion('${esc(q.fbKey)}')"><i class="fas fa-trash"></i></button></td></tr>`).join('') : '<tr><td colspan="5">لا توجد أسئلة في البنك بعد.</td></tr>';
  }
  async function addQuestionToBank(){
    const text=($('qb-text')?.value||'').trim();
    const options=['qb-o1','qb-o2','qb-o3','qb-o4'].map(id=>($(id)?.value||'').trim()).filter(Boolean);
    if(!text || options.length < 2) return toast('اكتب السؤال واختيارين على الأقل','error');
    const answer=Number($('qb-answer')?.value || 0);
    if(answer >= options.length) return toast('الإجابة الصحيحة لا تطابق الاختيارات المكتوبة','error');
    await getDb().ref('question_bank').push({text, options, answer, level:$('qb-level')?.value||'1', category:($('qb-category')?.value||'عام').trim()||'عام', difficulty:$('qb-difficulty')?.value||'سهل', createdAt:nowIso(), createdBy:getUser()?.uid||''});
    ['qb-text','qb-o1','qb-o2','qb-o3','qb-o4'].forEach(id=>{ if($(id)) $(id).value=''; });
    await audit('إضافة سؤال إلى بنك الأسئلة', {level:$('qb-level')?.value||'1'});
    toast('تم حفظ السؤال','success');
  }
  async function deleteQuestion(key){ if(!key || !confirm('حذف السؤال؟')) return; await getDb().ref('question_bank/'+key).remove(); toast('تم حذف السؤال','warning'); }
  function shuffle(arr){ return arr.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]); }
  async function createRandomExam(){
    const title=($('qb-exam-title')?.value||'').trim();
    const level=$('qb-exam-level')?.value||'1';
    const category=($('qb-exam-category')?.value||'').trim();
    const count=Math.max(1, Number($('qb-exam-count')?.value || 10));
    if(!title) return toast('اكتب عنوان الامتحان','error');
    let pool=(window.db_question_bank||[]).filter(q => q.level == level && (!category || String(q.category||'').toLowerCase() === category.toLowerCase()));
    if(!pool.length) return toast('لا توجد أسئلة مطابقة في البنك','error');
    const questions=shuffle(pool).slice(0,count).map(q=>({text:q.text, options:q.options || [], answer:Number(q.answer)||0, category:q.category||'', difficulty:q.difficulty||''}));
    await getDb().ref('online_exams').push({title, level, questions, randomFromBank:true, date:new Date().toLocaleDateString('ar-EG'), createdAt:nowIso()});
    await pushNotification({title:'📝 امتحان جديد', body:title, level, type:'exam'}).catch(console.warn);
    await audit('نشر امتحان عشوائي من بنك الأسئلة', {title, level, count:questions.length});
    toast('تم نشر الامتحان العشوائي','success');
  }
  function getSelectedStudent(id='report-student-select'){ const key=$(id)?.value; return (window.db_students||[]).find(s=>s.fbKey===key); }
  function buildReport(student, monthKey){
    const name=student.name || '';
    const code=student.code || '';
    const level=student.level || '';
    const evals=student.evaluations ? Object.values(student.evaluations) : [];
    const lastEval=evals[evals.length-1] || {};
    const attendance=(window.db_attendance||[]).filter(a => a.code == code && (!monthKey || String(a.date||'').startsWith(monthKey)));
    const present=attendance.filter(a=>a.status==='ح').length;
    const absent=attendance.filter(a=>a.status==='غ').length;
    const homework=(window.db_homework||[]).filter(h => h.std === name);
    const hwDone=homework.filter(h=>String(h.status||'').includes('تم') && !String(h.status||'').includes('لم')).length;
    const grades=(window.db_grades||[]).filter(g => g.studentKey === student.fbKey || g.std === name);
    const invoices=(window.db_invoices||[]).filter(i => i.name === name || String(i.phone||'') === String(student.phone||''));
    const paid=invoices.reduce((a,b)=>a+(Number(b.paid)||0),0);
    const remaining=invoices.reduce((a,b)=>a+(Number(b.remaining)||0),0);
    const submissions=(window.db_submissions||[]).filter(s => s.studentKey === student.fbKey || s.studentCode === code).length;
    const assignments=(window.db_assignments||[]).filter(a => a.level == level).length;
    const xp=Number(student.xp)||0;
    const summary={name, code, level, month:monthKey, xp, present, absent, homeworkCount:homework.length, homeworkDone:hwDone, gradesCount:grades.length, paid, remaining, submissions, assignments, lastEvaluation:lastEval};
    const gradeRows=grades.slice(-10).reverse().map(g=>`<tr><td>${esc(g.name||'اختبار')}</td><td>${esc(g.grade||'')}</td></tr>`).join('') || '<tr><td colspan="2">لا توجد درجات مسجلة.</td></tr>';
    const html=`<div dir="rtl" style="font-family:Cairo,Arial,sans-serif;line-height:1.8;color:#0f172a;padding:24px;">
      <h1 style="color:#2563eb;margin:0 0 10px;">تقرير الطالب الشهري</h1>
      <h2 style="margin:0 0 18px;">${esc(name)} - مستوى ${esc(level)}</h2>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:18px 0;">
        <div style="border:1px solid #e2e8f0;border-radius:16px;padding:14px;"><b>XP</b><br><span style="font-size:26px;color:#2563eb;">${xp}</span></div>
        <div style="border:1px solid #e2e8f0;border-radius:16px;padding:14px;"><b>الحضور</b><br>${present} حضور / ${absent} غياب</div>
        <div style="border:1px solid #e2e8f0;border-radius:16px;padding:14px;"><b>الواجبات</b><br>${hwDone} مكتمل من ${homework.length}</div>
        <div style="border:1px solid #e2e8f0;border-radius:16px;padding:14px;"><b>التسليمات</b><br>${submissions} من ${assignments}</div>
      </div>
      <h3>آخر تقييم</h3><p>واجب: ${esc(lastEval.work||'-')}/10 - أداء: ${esc(lastEval.perf||'-')}/10 - سلوك: ${esc(lastEval.beh||'-')}/10</p>
      <h3>الدرجات الأخيرة</h3><table style="width:100%;border-collapse:collapse;" border="1" cellpadding="8"><thead><tr><th>الاختبار</th><th>الدرجة</th></tr></thead><tbody>${gradeRows}</tbody></table>
      <h3>المالي</h3><p>المدفوع: ${paid} ج.م - المتبقي: ${remaining} ج.م</p>
      <p style="color:#64748b;font-size:13px;">تم إنشاء التقرير: ${nowAr()}</p>
    </div>`;
    return {summary, html, createdAt:nowIso(), when:nowAr()};
  }
  async function generateStudentReport(){
    const student=getSelectedStudent(); if(!student) return toast('اختر الطالب أولاً','error');
    const month=$('report-month-input')?.value || new Date().toISOString().slice(0,7);
    const report=buildReport(student, month);
    await getDb().ref(`student_reports/${student.fbKey}/${month}`).set(report);
    await audit('إنشاء تقرير طالب', {student:student.name, month});
    toast('تم إنشاء التقرير ونشره لولي الأمر والطالب','success');
    renderReportsList();
  }
  function previewStudentReport(){ const student=getSelectedStudent(); if(!student) return toast('اختر الطالب أولاً','error'); const month=$('report-month-input')?.value || new Date().toISOString().slice(0,7); const report=buildReport(student, month); openPrintWindow(report.html); }
  function openPrintWindow(html){
    const w=window.open('', '_blank');
    if(!w) return toast('المتصفح منع النافذة المنبثقة','error');
    const doc = '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>تقرير</title><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&display=swap" rel="stylesheet"></head><body onload="setTimeout(function(){window.print()},500)">' + html + '<' + '/body><' + '/html>';
    w.document.open();
    w.document.write(doc);
    w.document.close();
  }
  async function generateParentReport(){ const old=$('report-student-select'); const p=$('parent-student-select'); if(old && p) old.value=p.value; await generateStudentReport(); copyParentInstructions(); }
  function copyParentInstructions(){
    const student=getSelectedStudent('parent-student-select'); if(!student) return toast('اختر الطالب','error');
    const msg=`دخول ولي الأمر لمنصة Titan:\nافتح صفحة الطالب، اضغط زر \"دخول ولي الأمر\"، ثم اكتب كود الطالب: ${student.code}\nورقم الهاتف المسجل: ${student.phone}\nستظهر لوحة متابعة وتقارير الطالب فقط.`;
    const box=$('parent-instructions-box'); if(box) box.textContent=msg;
    navigator.clipboard?.writeText(msg).then(()=>toast('تم نسخ التعليمات','success')).catch(()=>toast('التعليمات جاهزة للنسخ','success'));
  }
  async function issueCertificate(){
    const student=getSelectedStudent(); if(!student) return toast('اختر الطالب أولاً','error');
    const title=($('cert-title')?.value||'شهادة إنجاز').trim();
    const key='CERT-' + Date.now();
    const html=`<div dir="rtl" style="font-family:Cairo,Arial,sans-serif;text-align:center;padding:60px;border:10px solid #2563eb;border-radius:30px;margin:30px;color:#0f172a;"><h1 style="font-size:46px;color:#2563eb;">شهادة تقدير</h1><p style="font-size:24px;">تُمنح إلى الطالب/ة</p><h2 style="font-size:38px;">${esc(student.name)}</h2><p style="font-size:26px;">عن: ${esc(title)}</p><p>تاريخ الإصدار: ${nowAr()}</p></div>`;
    await getDb().ref(`student_reports/${student.fbKey}/certificates/${key}`).set({title, html, createdAt:nowIso(), when:nowAr()});
    await audit('إصدار شهادة', {student:student.name, title});
    toast('تم إصدار الشهادة وستظهر للطالب/ولي الأمر','success');
  }
  function renderReportsList(){
    const el=$('student-reports-list'); if(!el) return;
    const reports=window.db_student_reports || {};
    let cards=[];
    Object.entries(reports).forEach(([studentKey, data])=>{
      const st=(window.db_students||[]).find(s=>s.fbKey===studentKey) || {name:studentKey};
      Object.entries(data||{}).forEach(([k,r])=>{ if(k !== 'certificates' && r && r.summary) cards.push({student:st.name, key:k, report:r}); });
    });
    cards=cards.sort((a,b)=>String(b.report.createdAt||'').localeCompare(String(a.report.createdAt||''))).slice(0,12);
    el.innerHTML=cards.length?cards.map(c=>`<div class="task-item" style="display:block;"><b>${esc(c.student)}</b><br><span class="muted-help">${esc(c.key)} - ${esc(c.report.when||'')}</span><br><span class="mini-badge">${esc((c.report.summary||{}).xp||0)} XP</span><span class="mini-badge">غياب ${esc((c.report.summary||{}).absent||0)}</span></div>`).join(''):'<p class="muted-help">لا توجد تقارير منشورة بعد.</p>';
  }
  async function saveAdminProfile(){
    const uid=($('role-uid')?.value||'').trim(); if(!uid) return toast('اكتب UID','error');
    const profile={name:($('role-name')?.value||'موظف').trim(), role:$('role-type')?.value||'viewer', updatedAt:nowIso(), updatedBy:getUser()?.uid||''};
    await getDb().ref('admin_profiles/'+uid).set(profile);
    await audit('تعديل صلاحية موظف', {uid, role:profile.role});
    toast('تم حفظ الصلاحية','success');
  }
  function renderAdminProfiles(){ const el=$('admin-profiles-list'); if(!el) return; const rows=Object.entries(window.db_admin_profiles||{}); el.innerHTML=rows.length?rows.map(([uid,p])=>`<tr><td>${esc(p.name)}</td><td style="direction:ltr;">${esc(uid)}</td><td>${esc(p.role)}</td><td><button class="btn btn-danger" onclick="TitanAdminV8.deleteAdminProfile('${esc(uid)}')"><i class="fas fa-trash"></i></button></td></tr>`).join(''):'<tr><td colspan="4">لا يوجد فريق مسجل.</td></tr>'; }
  async function deleteAdminProfile(uid){ if(!uid || !confirm('حذف صلاحية الواجهة؟')) return; await getDb().ref('admin_profiles/'+uid).remove(); toast('تم الحذف','warning'); }
  function renderAuditLogs(){ const el=$('audit-log-list'); if(!el) return; const rows=(window.db_audit_logs||[]).slice().reverse().slice(0,30); el.innerHTML=rows.length?rows.map(a=>`<tr><td>${esc(a.byEmail||a.by||'')}</td><td>${esc(a.action)}</td><td>${esc(a.when||a.at||'')}</td></tr>`).join(''):'<tr><td colspan="3">لا يوجد نشاط بعد.</td></tr>'; }
  function applyRoleUi(){
    const u=getUser(); const profile = u && (window.db_admin_profiles||{})[u.uid]; if(!profile || profile.role==='owner') return;
    const allowed={teacher:['dash','students','content','assignments','online-exams','live-class','homework','exams','schedule','question-bank','student-reports'], accountant:['dash','billing','expenses','student-reports'], support:['dash','support','notifications'], viewer:['dash','student-reports']};
    const list=allowed[profile.role] || allowed.viewer;
    document.querySelectorAll('.sidebar .btn-outline').forEach(btn=>{ const m=(btn.getAttribute('onclick')||'').match(/showSec\('([^']+)'\)/); if(m && !list.includes(m[1]) && m[1] !== 'settings') btn.style.display='none'; });
    toast('تم تفعيل صلاحيات واجهة: ' + profile.role, 'success');
  }
  function wireAutoNotifications(){
    function wrap(name, before, after){
      const original=window[name]; if(typeof original !== 'function' || original.__titanV8Wrapped) return;
      window[name]=async function(...args){ const ctx=before ? before(args) : {}; const res=await original.apply(this,args); try{ await after(ctx,args,res); }catch(e){ console.warn(e); } return res; };
      window[name].__titanV8Wrapped=true;
    }
    wrap('publishOnlineExam', ()=>({title:$('new-exam-title')?.value||'', level:$('new-exam-level')?.value||'1'}), async (c)=>{ if(c.title) await pushNotification({title:'📝 امتحان جديد', body:c.title, level:c.level, type:'exam'}); });
    wrap('adminSendPost', ()=>({body:$('admin-post-txt')?.value||'', level:$('admin-post-lvl')?.value||'1'}), async (c)=>{ if(c.body) await pushNotification({title:'📢 إعلان جديد', body:c.body, level:c.level, type:'announcement'}); });
    wrap('uploadLesson', ()=>({title:$('lesson-title')?.value||'', level:$('lesson-level-select')?.value||'1'}), async (c)=>{ if(c.title) await pushNotification({title:'📚 درس جديد', body:c.title, level:c.level, type:'lesson'}); });
    wrap('createAssignment', ()=>({title:$('assignment-title')?.value||'', level:$('assignment-level')?.value||'1'}), async (c)=>{ if(c.title) await pushNotification({title:'🗂️ مهمة جديدة', body:c.title, level:c.level, type:'assignment'}); });
    wrap('replyComplaint', (args)=>({key:args[0], ticket:(window.db_support||[]).find(x=>x.fbKey===args[0])}), async (c)=>{ if(c.ticket) await pushNotification({title:'✅ رد جديد من الدعم', body:'تم الرد على طلب الدعم الخاص بك', level:'student', studentKey:c.ticket.studentKey, type:'support'}); });
    if(window.VCAdmin && typeof VCAdmin.startClass === 'function' && !VCAdmin.startClass.__titanV8Wrapped){
      const old=VCAdmin.startClass.bind(VCAdmin); VCAdmin.startClass=async function(){ const title=$('vc-admin-title')?.value||'حصة مباشرة'; const level=$('vc-admin-level')?.value||'1'; const res=await old(); try{ await pushNotification({title:'🔴 بدأت حصة مباشرة', body:title + ' - الكود: ' + ($('vc-admin-session-code')?.textContent||''), level, type:'live'}); }catch(e){console.warn(e)} return res; }; VCAdmin.startClass.__titanV8Wrapped=true;
    }
  }
  function start(){
    const db=getDb(); if(!db || start.started) return; start.started=true;
    db.ref('notifications').limitToLast(80).on('value', s=>{ window.db_notifications=Object.entries(s.val()||{}).map(([fbKey,v])=>Object.assign({},v,{fbKey})); renderNotifications(); });
    db.ref('question_bank').on('value', s=>{ window.db_question_bank=Object.entries(s.val()||{}).map(([fbKey,v])=>Object.assign({},v,{fbKey})); renderQuestionBank(); });
    db.ref('student_reports').on('value', s=>{ window.db_student_reports=s.val()||{}; renderReportsList(); });
    db.ref('admin_profiles').on('value', s=>{ window.db_admin_profiles=s.val()||{}; renderAdminProfiles(); applyRoleUi(); });
    db.ref('audit_logs').limitToLast(50).on('value', s=>{ window.db_audit_logs=Object.values(s.val()||{}); renderAuditLogs(); });
    refreshSelects(); setInterval(refreshSelects, 2500); setInterval(wireAutoNotifications, 1500); wireAutoNotifications();
  }
  window.TitanAdminV8={refreshNotificationTargets, sendNotificationManual, deleteNotification, addQuestionToBank, deleteQuestion, createRandomExam, generateStudentReport, previewStudentReport, generateParentReport, copyParentInstructions, issueCertificate, saveAdminProfile, deleteAdminProfile, pushNotification};
  window.addEventListener('DOMContentLoaded', function(){ setInterval(start, 800); setTimeout(start, 1000); });
})();


// ===== admin_secure_live_classroom_v15_customization_studio.html :: titan-admin-v9-protection =====
(function(){
  const $=(id)=>document.getElementById(id);
  const esc=(v)=>String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nowIso=()=>new Date().toISOString();
  const toast=(m,t='success')=>window.showToast?showToast(m,t):alert(m);
  const state={sessions:{}, progress:{}, attendance:{}, activity:{}, started:false, uploadWrapped:false};
  function db(){ return window.db || (window.firebase && firebase.database && firebase.database()); }
  function studentByKey(uid){ return (window.db_students||[]).find(s=>s.fbKey===uid) || {}; }
  function fmtDate(v){ if(!v) return '-'; try{ return new Date(v).toLocaleString('ar-EG'); }catch(e){ return v; } }
  function agoRecent(v, min){ const t=Date.parse(v||''); return t && (Date.now()-t <= min*60*1000); }
  function secondsLabel(s){ s=Number(s)||0; const m=Math.floor(s/60), r=s%60; return m?`${m}د ${r}ث`:`${r}ث`; }
  function setText(id,v){ const el=$(id); if(el) el.textContent=String(v); }
  function renderKpis(){
    const sessions=Object.values(state.sessions||{}).filter(s=>agoRecent(s.lastSeen,6));
    let completed=0; Object.values(state.progress||{}).forEach(byStudent=>Object.values(byStudent||{}).forEach(p=>{ if(Number(p.percent||0)>=85) completed++; }));
    let att=0; Object.values(state.attendance||{}).forEach(room=>att+=Object.keys(room||{}).length);
    const recent=Object.values(state.activity||{}).filter(a=>agoRecent(a.lastSeen,15)).length;
    setText('v9-active-count', sessions.length); setText('v9-completed-lessons', completed); setText('v9-attendance-count', att); setText('v9-recent-activity', recent);
  }
  function renderSessions(){ const el=$('v9-active-sessions-list'); if(!el) return; const rows=Object.entries(state.sessions||{}).map(([uid,s])=>Object.assign({uid},s)).sort((a,b)=>String(b.lastSeen||'').localeCompare(String(a.lastSeen||''))); el.innerHTML=rows.length?rows.map(s=>`<tr><td>${esc(s.studentName||studentByKey(s.uid).name||s.uid)}</td><td>${esc(s.code||studentByKey(s.uid).code||'')}</td><td>${esc(s.level||studentByKey(s.uid).level||'')}</td><td>${fmtDate(s.lastSeen)} ${agoRecent(s.lastSeen,6)?'<span class="mini-badge">متصل</span>':'<span class="mini-badge">قديم</span>'}</td><td><span class="v9-device">${esc(s.userAgent||s.deviceId||'')}</span></td><td><button class="btn btn-danger" onclick="TitanAdminV9.clearSession('${esc(s.uid)}')"><i class="fas fa-plug-circle-xmark"></i> فصل</button></td></tr>`).join(''):'<tr><td colspan="6">لا توجد جلسات نشطة.</td></tr>'; }
  function renderProgress(){ const el=$('v9-progress-list'); if(!el) return; const rows=[]; Object.entries(state.progress||{}).forEach(([uid,lessons])=>{ Object.entries(lessons||{}).forEach(([lessonKey,p])=>rows.push(Object.assign({uid,lessonKey},p))); }); rows.sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||''))); el.innerHTML=rows.length?rows.slice(0,80).map(p=>{ const st=studentByKey(p.uid); const pct=Math.max(0,Math.min(100,Number(p.percent||0))); return `<tr><td>${esc(p.studentName||st.name||p.uid)}</td><td>${esc(p.lessonTitle||p.lessonKey)}</td><td>${esc(p.level||st.level||'')}</td><td><div class="v9-progress"><span style="width:${pct}%"></span></div><b>${pct}%</b></td><td>${fmtDate(p.updatedAt)}</td><td><button class="btn btn-success" onclick="TitanAdminV9.whatsApp('${esc(p.uid)}','progress')"><i class="fab fa-whatsapp"></i></button></td></tr>`; }).join(''):'<tr><td colspan="6">لا يوجد تقدم مسجل بعد.</td></tr>'; }
  function renderAttendance(){ const el=$('v9-live-attendance-list'); if(!el) return; const rows=[]; Object.entries(state.attendance||{}).forEach(([sessionId,room])=>{ Object.entries(room||{}).forEach(([uid,a])=>rows.push(Object.assign({sessionId,uid},a))); }); rows.sort((a,b)=>String(b.joinedAt||'').localeCompare(String(a.joinedAt||''))); el.innerHTML=rows.length?rows.slice(0,80).map(a=>`<tr><td>${esc(a.sessionId)}</td><td>${esc(a.studentName||studentByKey(a.uid).name||a.uid)}</td><td>${esc(a.level||'')}</td><td>${fmtDate(a.joinedAt)}</td><td>${fmtDate(a.leftAt||a.lastSeen)}</td><td>${secondsLabel(a.seconds || ((Date.now()-(Number(a.joinMs)||Date.now()))/1000))}</td></tr>`).join(''):'<tr><td colspan="6">لم يتم تسجيل حضور تلقائي بعد.</td></tr>'; }
  function renderActivity(){ const el=$('v9-activity-list'); if(!el) return; const rows=Object.entries(state.activity||{}).map(([uid,a])=>Object.assign({uid},a)).sort((a,b)=>String(b.lastSeen||'').localeCompare(String(a.lastSeen||''))); el.innerHTML=rows.length?rows.slice(0,80).map(a=>`<tr><td>${esc(a.studentName||studentByKey(a.uid).name||a.uid)}</td><td>${esc(a.code||studentByKey(a.uid).code||'')}</td><td>${esc(a.level||studentByKey(a.uid).level||'')}</td><td>${esc(a.page||a.event||'')}</td><td>${fmtDate(a.lastSeen)}</td><td><span class="v9-device">${esc(a.userAgent||a.deviceId||'')}</span></td></tr>`).join(''):'<tr><td colspan="6">لا يوجد نشاط مسجل بعد.</td></tr>'; }
  function renderAll(){ renderKpis(); renderSessions(); renderProgress(); renderAttendance(); renderActivity(); }
  async function clearSession(uid){ if(!uid||!confirm('فصل جلسة الطالب؟ سيتم إخراجه من الجهاز الحالي.')) return; await db().ref('active_sessions/'+uid).remove(); toast('تم فصل الجلسة','warning'); }
  function whatsApp(uid,type){ const st=studentByKey(uid); if(!st.phone) return toast('لا يوجد رقم هاتف للطالب','error'); const msg=type==='progress'?`مرحباً ${st.name||''}، برجاء استكمال مشاهدة الدروس داخل منصة Titan. الإدارة تتابع تقدمك أولاً بأول.`:`مرحباً ${st.name||''}`; const phone=String(st.phone).replace(/[^0-9+]/g,''); window.open('https://wa.me/'+phone.replace(/^0/,'20')+'?text='+encodeURIComponent(msg),'_blank'); }
  function addLessonHintFields(){ const seq=$('lesson-sequence-v9'); if(!seq) return; const count=(window.db_content||[]).length; if(!seq.value) seq.placeholder='ترتيب الدرس للتسلسل - المقترح: '+(count+1); }
  function wrapUploadLesson(){ if(state.uploadWrapped || typeof window.uploadLesson!=='function') return; const old=window.uploadLesson; window.uploadLesson=async function(){ const meta={title:$('lesson-title')?.value.trim()||'', level:$('lesson-level-select')?.value||'1', sequence:Number($('lesson-sequence-v9')?.value||0), unlockMode:$('lesson-unlock-mode-v9')?.value||'sequence'}; const res=await old.apply(this,arguments); try{ if(meta.title){ const snap=await db().ref('content').once('value'); let bestKey='', bestAt=''; snap.forEach(ch=>{ const v=ch.val()||{}; if(String(v.title||'')===meta.title && String(v.level||'')===String(meta.level) && String(v.createdAt||'')>=bestAt){ bestAt=String(v.createdAt||''); bestKey=ch.key; } }); if(bestKey){ await db().ref('content/'+bestKey).update({sequence:meta.sequence || null, unlockMode:meta.unlockMode, v9UpdatedAt:nowIso()}); toast('تم حفظ ترتيب الدرس ونظام فتحه','success'); } } }catch(e){ console.warn(e); } return res; }; window.uploadLesson.__titanV9Wrapped=true; state.uploadWrapped=true; }
  function start(){ const d=db(); if(!d||state.started) return; state.started=true; d.ref('active_sessions').on('value',s=>{state.sessions=s.val()||{};renderAll();}); d.ref('lesson_progress').on('value',s=>{state.progress=s.val()||{};renderAll();}); d.ref('live_attendance').on('value',s=>{state.attendance=s.val()||{};renderAll();}); d.ref('student_activity').on('value',s=>{state.activity=s.val()||{};renderAll();}); setInterval(()=>{addLessonHintFields();wrapUploadLesson();renderAll();},1600); addLessonHintFields(); wrapUploadLesson(); }
  window.TitanAdminV9={clearSession, whatsApp, renderAll};
  window.addEventListener('DOMContentLoaded', function(){ setInterval(start,800); setTimeout(start,1200); });
})();


// ===== admin_secure_live_classroom_v15_customization_studio.html :: titan-admin-v10-mega-notifications =====
(function(){
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nowIso=()=>new Date().toISOString();
  const nowAr=()=>new Date().toLocaleString('ar-EG');
  const db=()=>window.db || (window.firebase&&firebase.database&&firebase.database());
  const auth=()=>window.auth || (window.firebase&&firebase.auth&&firebase.auth());
  const toast=(m,t='success')=>window.showToast?showToast(m,t):alert(m);
  const chunkSize=350;
  const features=[
    ['notification','إشعارات مضمونة','صندوق خاص لكل طالب + إشعار عام + عداد غير مقروء + صوت وتنبيه داخل الصفحة.'],
    ['campaign','حملات تعليمية','حملة لمستوى أو طالب: تذكير واجب، متابعة غياب، دعوة حصة، أو خطة مراجعة.'],
    ['payment','اشتراكات وكوبونات','باقات شهرية، كوبونات، خصومات، وجدولة تذكير قبل موعد الدفع.'],
    ['risk','إنذار طالب معرض للخطر','يرصد الغياب، عدم مشاهدة الدروس، عدم تسليم الواجبات، والدرجات الضعيفة.'],
    ['automation','أتمتة كاملة','قواعد تلقائية ترسل إشعاراً أو تفتح إجراء متابعة بناءً على سلوك الطالب.'],
    ['library','مكتبة ملفات ضخمة','ملفات عامة لكل مستوى مع بحث وفلترة وتحميل آمن.'],
    ['quiz','كويز بعد كل درس','اختبار قصير مرتبط بالدرس ولا يفتح التالي إلا بعد حد نجاح محدد.'],
    ['parent','رسائل ولي الأمر','ملخص أسبوعي وشهري، رابط واتساب جاهز، وتنبيه خاص بولي الأمر.'],
    ['certificate','شهادات وشارات','شهادات PDF وشارات إنجاز بناءً على XP والحضور والتقييم.'],
    ['scale','تشغيل 10,000+','كل الجداول الجديدة تستخدم آخر 10,000 سجل مع بحث محلي وتصدير CSV.']
  ];
  function students(){return Array.isArray(window.db_students)?window.db_students:[];}
  function optionStudents(){return students().map(s=>`<option value="${esc(s.fbKey)}">${esc(s.name||s.code||s.fbKey)} - ${esc(s.code||'')}</option>`).join('');}
  function targets(payload){
    const all=students();
    if(payload.studentKey) return all.filter(s=>String(s.fbKey)===String(payload.studentKey));
    if(payload.level && payload.level!=='all' && payload.level!=='student') return all.filter(s=>String(s.level)===String(payload.level));
    return all;
  }
  async function multiUpdateInChunks(updates){
    const d=db(); const keys=Object.keys(updates); let done=0;
    for(let i=0;i<keys.length;i+=chunkSize){
      const part={}; keys.slice(i,i+chunkSize).forEach(k=>part[k]=updates[k]);
      await d.ref().update(part); done += Object.keys(part).length;
    }
    return done;
  }
  async function sendFanout(payload){
    const d=db(); if(!d) throw new Error('Firebase غير جاهز');
    const u=auth()&&auth().currentUser;
    const clean=Object.assign({title:'تنبيه جديد',body:'',level:'all',studentKey:'',type:'notification',createdAt:nowIso(),when:nowAr(),createdBy:u?u.uid:'admin',v10:true},payload||{});
    const globalRef=d.ref('notifications').push();
    clean.key=globalRef.key;
    const selected=targets(clean);
    const updates={};
    updates['notifications/'+globalRef.key]=clean;
    selected.forEach(s=>{ if(s && s.fbKey) updates['student_notifications/'+s.fbKey+'/'+globalRef.key]=Object.assign({},clean,{targetStudentKey:s.fbKey,read:false}); });
    updates['mega_records/'+Date.now()+'_notif']={type:'notification',title:clean.title,body:clean.body,status:'sent',targetCount:selected.length,createdAt:clean.createdAt,when:clean.when};
    const written=await multiUpdateInChunks(updates);
    toast('تم إرسال الإشعار إلى '+selected.length+' طالب','success');
    return {selected,written,key:globalRef.key,clean};
  }
  async function sendMegaNotification(){
    const target=$('v10-notify-target')?.value||'all';
    const title=($('v10-notify-title')?.value||'').trim() || ($('notify-title')?.value||'').trim();
    const body=($('v10-notify-body')?.value||'').trim() || ($('notify-body')?.value||'').trim();
    if(!title||!body) return toast('اكتب عنوان ونص الإشعار أولاً','error');
    const p={title,body,level:'all',studentKey:'',type:'manual'};
    if(target==='level') p.level=$('v10-notify-level')?.value||'1';
    if(target==='student'){ p.level='student'; p.studentKey=$('v10-notify-student')?.value||''; }
    await sendFanout(p);
    ['v10-notify-title','v10-notify-body','notify-title','notify-body'].forEach(id=>{if($(id)) $(id).value='';});
    renderMegaRecords();
  }
  async function sendTestNotification(){
    const st=$('v10-notify-student')?.value || (students()[0]&&students()[0].fbKey) || '';
    if(!st) return toast('لا يوجد طالب للاختبار','error');
    await sendFanout({title:'✅ اختبار إشعارات V10',body:'لو ظهرت الرسالة هنا وفي صفحة الطالب فالإشعارات تعمل بشكل صحيح.',level:'student',studentKey:st,type:'test'});
  }
  async function runNotificationHealthCheck(){
    const box=$('v10-notification-health');
    try{
      const d=db(); const u=auth()&&auth().currentUser;
      if(!d) throw new Error('Firebase Database غير جاهز');
      if(!u) throw new Error('سجل دخول الإدارة أولاً');
      const probe='health_'+Date.now();
      await d.ref('mega_records/'+probe).set({type:'health',title:'فحص إشعارات',createdAt:nowIso(),by:u.uid,status:'ok'});
      await d.ref('mega_records/'+probe).remove();
      const count=students().length;
      if(box){box.className='v10-status-ok';box.innerHTML='✅ Firebase والكتابة يعملان. عدد الطلاب المحملين: '+count+'. استخدم زر اختبار لطالب مختار للتأكد من ظهور التنبيه في صفحة الطالب.';}
      if($('v10-firebase-state')) $('v10-firebase-state').textContent='OK';
    }catch(e){
      if(box){box.className='v10-status-error';box.textContent='❌ '+(e.message||e);}
      if($('v10-firebase-state')) $('v10-firebase-state').textContent='ERROR';
    }
  }
  function renderFeatureGrid(){
    const el=$('v10-feature-grid'); if(!el) return;
    el.innerHTML=features.map(f=>`<div class="v10-card"><h4><i class="fas fa-circle-check"></i> ${esc(f[1])}</h4><p>${esc(f[2])}</p><span class="mini-badge">جاهز للتوسع 10,000+</span></div>`).join('');
  }
  let megaRecords=[];
  function renderMegaRecords(){
    const el=$('v10-mega-records'); if(!el) return;
    const q=($('v10-search')?.value||'').toLowerCase(); const type=$('v10-record-type')?.value||'all';
    const rows=megaRecords.filter(r=>(type==='all'||String(r.type)===type) && (!q || JSON.stringify(r).toLowerCase().includes(q))).slice(-10000).reverse();
    el.innerHTML=rows.slice(0,250).map(r=>`<tr><td>${esc(r.type||'-')}</td><td><b>${esc(r.title||'-')}</b></td><td style="text-align:right;max-width:420px;">${esc(r.body||r.desc||'')}</td><td>${esc(r.when||r.createdAt||'')}</td><td><span class="mini-badge">${esc(r.status||'active')}</span></td></tr>`).join('') || '<tr><td colspan="5">لا توجد سجلات بعد.</td></tr>';
    if($('v10-record-count')) $('v10-record-count').textContent=String(rows.length);
  }
  async function addMegaRecord(){
    const type=$('v10-record-type')?.value==='all'?'campaign':$('v10-record-type')?.value||'campaign';
    await db().ref('mega_records').push({type,title:'سجل V10 تجريبي',body:'تمت إضافته لاختبار البحث والتصدير واستيعاب 10,000+ سجل.',status:'active',createdAt:nowIso(),when:nowAr()});
    toast('تمت إضافة سجل V10','success');
  }
  function exportMegaCsv(){
    const headers=['type','title','body','status','createdAt'];
    const csv=[headers.join(',')].concat(megaRecords.map(r=>headers.map(h=>'"'+String(r[h]??'').replace(/"/g,'""')+'"').join(','))).join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='titan_v10_mega_records.csv'; a.click(); URL.revokeObjectURL(a.href);
  }
  async function saveAutomationRule(){
    const title=($('v10-auto-title')?.value||'').trim(); if(!title) return toast('اكتب اسم قاعدة الأتمتة','error');
    await db().ref('automation_rules').push({title,type:$('v10-auto-type')?.value||'absence',threshold:Number($('v10-auto-threshold')?.value||0),active:true,createdAt:nowIso(),when:nowAr()});
    if($('v10-auto-title')) $('v10-auto-title').value=''; toast('تم حفظ قاعدة الأتمتة','success');
  }
  function renderAutomation(data){
    const el=$('v10-automation-list'); if(!el) return;
    const rows=Object.entries(data||{}).map(([key,v])=>Object.assign({key},v)).reverse();
    el.innerHTML=rows.map(r=>`<div class="task-item"><span><b>${esc(r.title)}</b> — ${esc(r.type)} / حد ${esc(r.threshold)}</span><button class="btn btn-danger" onclick="TitanV10Admin.deleteAutomation('${esc(r.key)}')"><i class="fas fa-trash"></i></button></div>`).join('') || '<p class="muted-help">لا توجد قواعد بعد.</p>';
  }
  async function deleteAutomation(key){ await db().ref('automation_rules/'+key).remove(); toast('تم حذف القاعدة','warning'); }
  function refreshStudents(){
    ['v10-notify-student','notify-student'].forEach(id=>{const el=$(id); if(el && !el.dataset.v10filled){el.innerHTML=optionStudents(); el.dataset.v10filled='1';}});
    if($('v10-target-count')) $('v10-target-count').textContent=String(students().length);
  }
  function subscribe(){
    const d=db(); if(!d || subscribe.done) return; subscribe.done=true;
    d.ref('notifications').limitToLast(10000).on('value',s=>{ const v=s.val()||{}; if($('v10-notif-count')) $('v10-notif-count').textContent=String(Object.keys(v).length); });
    d.ref('mega_records').limitToLast(10000).on('value',s=>{ megaRecords=Object.entries(s.val()||{}).map(([key,v])=>Object.assign({key},v)); renderMegaRecords(); });
    d.ref('automation_rules').limitToLast(500).on('value',s=>renderAutomation(s.val()||{}));
  }
  function installOverrides(){
    if(window.TitanAdminV8 && !window.TitanAdminV8.__v10_override){
      window.TitanAdminV8.sendNotificationManual = async function(){
        const title=($('notify-title')?.value||'').trim(); const body=($('notify-body')?.value||'').trim(); const type=$('notify-target-type')?.value||'all';
        if(!title||!body) return toast('اكتب عنوان ونص الإشعار أولاً','error');
        const p={title,body,level:'all',studentKey:'',type:'manual'};
        if(type==='level') p.level=$('notify-level')?.value||'1';
        if(type==='student'){p.level='student';p.studentKey=$('notify-student')?.value||'';}
        await sendFanout(p); ['notify-title','notify-body'].forEach(id=>{if($(id)) $(id).value='';});
      };
      const oldPush=window.TitanAdminV8.pushNotification;
      window.TitanAdminV8.pushNotification=async function(payload){ try{return await sendFanout(payload||{});}catch(e){ if(oldPush) return oldPush(payload); throw e; } };
      window.TitanAdminV8.__v10_override=true;
    }
  }
  window.TitanV10Admin={sendMegaNotification,sendTestNotification,runNotificationHealthCheck,renderMegaRecords,addMegaRecord,exportMegaCsv,saveAutomationRule,deleteAutomation,sendFanout};
  window.addEventListener('DOMContentLoaded',()=>{renderFeatureGrid(); setInterval(refreshStudents,1000); setInterval(installOverrides,1200); setTimeout(runNotificationHealthCheck,1800); setInterval(subscribe,1500);});
})();


// ===== admin_secure_live_classroom_v15_customization_studio.html :: titan-v13-admin-js =====
(function(){
  const draft=[];
  const $=id=>document.getElementById(id);
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const db=()=>window.firebase&&firebase.database?firebase.database():null;
  function status(msg,type){const el=$('v13-admin-status');if(el)el.innerHTML='<div class="v13-status v13-'+(type||'warn')+'">'+esc(msg)+'</div>'}
  function renderDraft(){const el=$('v13-quiz-draft');if(!el)return;el.innerHTML=draft.length?draft.map((q,i)=>'<div class="v13-list-item"><span><b>'+(i+1)+'.</b> '+esc(q.text)+'</span><button class="btn btn-danger" onclick="TitanV13Admin.removeQuestion('+i+')"><i class="fas fa-trash"></i></button></div>').join(''):'<div class="v13-status v13-warn">لم يتم إضافة أسئلة بعد.</div>'}
  function addQuizQuestion(){const text=($('v13-q-text')?.value||'').trim();const options=[0,1,2,3].map(i=>($('v13-o-'+i)?.value||'').trim()).filter(Boolean);const correct=Number($('v13-correct')?.value||0);if(!text||options.length<2)return status('اكتب السؤال واختيارين على الأقل.','error');draft.push({text,options,correct:Math.min(correct,options.length-1)});['v13-q-text','v13-o-0','v13-o-1','v13-o-2','v13-o-3'].forEach(id=>{if($(id))$(id).value=''});renderDraft()}
  function removeQuestion(i){draft.splice(i,1);renderDraft()}
  async function loadLessons(){const d=db();if(!d||!$('v13-quiz-lesson'))return;const snap=await d.ref('content').once('value');const lessons=snap.val()||{};$('v13-quiz-lesson').innerHTML='<option value="">اختر الدرس...</option>'+Object.entries(lessons).map(([k,l])=>'<option value="'+esc(k)+'" data-level="'+esc(l.level||'')+'">'+esc(l.title||k)+' - مستوى '+esc(l.level||'-')+'</option>').join('')}
  function loadQuizzes(){const d=db(),el=$('v13-quiz-list');if(!d||!el)return;d.ref('lesson_quizzes').limitToLast(50).on('value',snap=>{const q=snap.val()||{},rows=Object.entries(q).reverse();el.innerHTML=rows.length?rows.map(([k,v])=>'<div class="v13-list-item"><span><b>'+esc(v.title||'كويز')+'</b><br><small>مستوى '+esc(v.level||'-')+' | '+((v.questions||[]).length||v.questionCount||0)+' سؤال</small></span><button class="btn btn-danger" onclick="TitanV13Admin.deleteQuiz(\''+esc(k)+'\')"><i class="fas fa-trash"></i></button></div>').join(''):'<div class="v13-status v13-warn">لا توجد كويزات بعد.</div>'})}
  async function publishQuiz(){const d=db();if(!d)return status('Firebase غير جاهز.','error');const sel=$('v13-quiz-lesson'),lessonKey=sel?.value||'';if(!lessonKey)return status('اختار الدرس أولاً.','error');if(!draft.length)return status('أضف سؤال واحد على الأقل.','error');const level=sel.selectedOptions[0]?.dataset.level||'';await d.ref('lesson_quizzes').push({lessonKey,level,title:($('v13-quiz-title')?.value||'كويز الدرس').trim(),points:Number($('v13-quiz-points')?.value||20),questions:draft.slice(),questionCount:draft.length,createdAt:Date.now(),status:'active'});draft.length=0;renderDraft();if($('v13-quiz-title'))$('v13-quiz-title').value='';status('تم نشر الكويز بنجاح.','ok')}
  async function deleteQuiz(key){if(confirm('حذف الكويز؟'))await db().ref('lesson_quizzes/'+key).remove()}
  function refresh(){loadLessons();loadQuizzes();renderDraft()}
  window.TitanV13Admin={addQuizQuestion,removeQuestion,publishQuiz,deleteQuiz,refresh};
  document.addEventListener('DOMContentLoaded',()=>setTimeout(refresh,1200));
})();


// ===== admin_secure_live_classroom_v15_customization_studio.html :: titan-v14-saas-admin-js =====
(function(){
  const $=id=>document.getElementById(id);
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const db=()=>window.firebase&&firebase.database?firebase.database():null;
  const tenant=()=>window.TitanSaaS&&TitanSaaS.tenantId||'titan';
  function note(id,msg,type='ok'){const el=$(id);if(el)el.innerHTML='<div class="v14-note v14-'+type+'">'+esc(msg)+'</div>'}
  let students={};
  function todayPlus(days){const d=new Date();d.setDate(d.getDate()+days);return d.toISOString().slice(0,10)}
  function applySettings(s){
    s=s||{};
    if(s.primaryColor) document.documentElement.style.setProperty('--primary', s.primaryColor);
    if(s.primaryColor && s.secondaryColor) document.documentElement.style.setProperty('--primary-gradient','linear-gradient(135deg,'+s.primaryColor+','+s.secondaryColor+')');
  }
  async function load(){
    const d=db(); if(!d) return;
    if($('v14-current-tenant')) $('v14-current-tenant').textContent=tenant();
    const [settingsSnap, studentsSnap]=await Promise.all([d.ref('settings').once('value'),d.ref('students').once('value')]);
    const s=settingsSnap.val()||{}; students=studentsSnap.val()||{};
    if($('v14-academy-name')) $('v14-academy-name').value=s.name||'';
    if($('v14-academy-logo')) $('v14-academy-logo').value=s.logo||'';
    if($('v14-academy-whatsapp')) $('v14-academy-whatsapp').value=s.whatsapp||'';
    if($('v14-primary-color')) $('v14-primary-color').value=s.primaryColor||'#2563eb';
    if($('v14-secondary-color')) $('v14-secondary-color').value=s.secondaryColor||'#7c3aed';
    if($('v14-single-device')) $('v14-single-device').checked=!!(s.security&&s.security.singleDevice);
    applySettings(s);
    const opts='<option value="">اختر الطالب...</option>'+Object.entries(students).map(([k,v])=>'<option value="'+esc(k)+'">'+esc(v.name||k)+' - '+esc(v.code||'')+'</option>').join('');
    ['v14-sub-student','v14-security-student'].forEach(id=>{if($(id))$(id).innerHTML=opts});
  }
  async function saveSettings(){
    const s={name:($('v14-academy-name')?.value||'').trim(),logo:($('v14-academy-logo')?.value||'').trim(),whatsapp:($('v14-academy-whatsapp')?.value||'').trim(),primaryColor:$('v14-primary-color')?.value||'#2563eb',secondaryColor:$('v14-secondary-color')?.value||'#7c3aed',updatedAt:Date.now()};
    await db().ref('settings').update(s); applySettings(s); note('v14-settings-status','تم حفظ إعدادات الأكاديمية','ok');
  }
  async function saveStudentSubscription(){
    const uid=$('v14-sub-student')?.value; if(!uid) return note('v14-sub-status-box','اختار الطالب أولاً','error');
    await db().ref('students/'+uid+'/subscription').update({status:$('v14-sub-status')?.value||'active',endDate:$('v14-sub-end')?.value||todayPlus(30),updatedAt:Date.now()});
    note('v14-sub-status-box','تم حفظ اشتراك الطالب','ok');
  }
  async function createAttendanceQR(){
    const code='att_'+Date.now(), level=$('v14-qr-level')?.value||'1', title=($('v14-qr-title')?.value||'حضور حصة').trim();
    const url=location.origin+location.pathname.replace(/[^\/]+$/,'')+'student_secure_live_classroom_v14_saas.html?tenant='+encodeURIComponent(tenant())+'&attendance='+encodeURIComponent(code);
    await db().ref('qr_attendance_sessions/'+code).set({code,level,title,url,createdAt:Date.now(),status:'open'});
    const img='https://api.qrserver.com/v1/create-qr-code/?size=230x230&data='+encodeURIComponent(url);
    $('v14-qr-box').innerHTML='<div class="v14-note v14-ok"><b>اعرض هذا الكود للطلاب:</b><br><img src="'+img+'" style="width:230px;height:230px;background:white;padding:8px;border-radius:14px;margin:10px 0"><br><input value="'+esc(url)+'" readonly onclick="this.select()"></div>';
  }
  async function addAdmin(){
    const uid=($('v14-admin-uid')?.value||'').trim(); if(!uid) return note('v14-security-status','اكتب UID الأدمن','error');
    await Promise.all([db().ref('admins/'+uid).set(true), firebase.database().ref('user_tenants/'+uid+'/'+tenant()).set('admin')]);
    note('v14-security-status','تم إضافة الأدمن للأكاديمية الحالية','ok');
  }
  async function toggleStudentDisabled(disabled){
    const uid=$('v14-security-student')?.value; if(!uid) return note('v14-security-status','اختار الطالب أولاً','error');
    await db().ref('students/'+uid).update({disabled:!!disabled,disabledAt:disabled?Date.now():null});
    note('v14-security-status',disabled?'تم تعطيل الطالب':'تم تفعيل الطالب','ok');
  }
  async function saveSecurity(){
    await db().ref('settings/security').update({singleDevice:!!$('v14-single-device')?.checked,updatedAt:Date.now()});
    note('v14-security-status','تم حفظ إعدادات الأمان','ok');
  }
  async function buildWeeklyLeaderboard(){
    const d=db(); const snap=await d.ref('leaderboard').once('value'); const rows=Object.entries(snap.val()||{}).map(([uid,v])=>({uid,...v})).sort((a,b)=>(b.xp||0)-(a.xp||0)).slice(0,20);
    await d.ref('leaderboard_weekly').set({updatedAt:Date.now(),rows});
    $('v14-leaderboard-admin').innerHTML='<div class="v14-note v14-ok">'+rows.map((r,i)=>(i+1)+'. '+esc(r.name||r.uid)+' - '+esc(r.xp||0)+' XP').join('<br>')+'</div>';
  }
  window.TitanV14Admin={load,saveSettings,saveStudentSubscription,createAttendanceQR,addAdmin,toggleStudentDisabled,saveSecurity,buildWeeklyLeaderboard};
  document.addEventListener('DOMContentLoaded',()=>setTimeout(load,1300));
})();


// ===== admin_secure_live_classroom_v15_customization_studio.html :: titan-v14-auth-fix-admin-v2-js =====
(function(){
  function $(id){return document.getElementById(id)}
  function tenant(){return (window.TitanSaaS && TitanSaaS.tenantId) || new URLSearchParams(location.search).get('tenant') || 'titan'}
  function msg(m,type){
    if(window.showToast){ showToast(m,type||'info'); return; }
    alert(m);
  }
  function getAny(ids, fallback){
    for(const id of ids){
      const el=$(id);
      if(el && String(el.value||'').trim()) return String(el.value).trim();
    }
    return fallback || '';
  }
  function getStudentFormData(){
    const name = getAny(['std-name','student-name','new-student-name','create-student-name','s-name']);
    const codeRaw = getAny(['std-code','student-code','new-student-code','create-student-code','s-code']);
    const level = getAny(['std-level','student-level','new-student-level','student-level-select','s-level'], '1');
    const phone = getAny(['std-phone','student-phone','new-student-phone','create-student-phone','s-phone']);
    return {name, code: codeRaw.replace(/\s+/g,'').toLowerCase(), level, phone};
  }
  function clearStudentForm(){
    ['std-name','student-name','new-student-name','create-student-name','s-name','std-code','student-code','new-student-code','create-student-code','s-code','std-phone','student-phone','new-student-phone','create-student-phone','s-phone'].forEach(id=>{ if($(id)) $(id).value=''; });
  }
  function getSecondaryAuth(){
    const name='studentCreatorApp_v14_v2';
    let app;
    try { app=firebase.app(name); }
    catch(e){ app=firebase.initializeApp(firebase.app().options, name); }
    return app.auth();
  }
  function explain(e){
    const code=e && e.code || '';
    if(code==='auth/email-already-in-use') return 'الكود مستخدم قبل كده. استخدم كود مختلف أو احذف حساب الطالب القديم من Authentication.';
    if(code==='auth/weak-password') return 'رقم الهاتف/كلمة المرور قصيرة. لازم 6 أرقام على الأقل.';
    if(code==='auth/invalid-email') return 'كود الطالب غير صالح. استخدم حروف وأرقام بدون مسافات.';
    if(code==='auth/operation-not-allowed') return 'Email/Password غير مفعّل. فعّله من Firebase Authentication > Sign-in method.';
    if(code==='PERMISSION_DENIED' || String(e.message||'').includes('Permission denied')) return 'قواعد Realtime Database تمنع الحفظ. انشر ملف rules v14 auth fix v2.';
    return (e && (e.message || e.code)) || String(e);
  }

  async function createStudentAccountV2(){
    try{
      const {name, code, level, phone} = getStudentFormData();
      console.log('Titan V14 create student data', {name, code, level, phone});
      if(!name || !code || !phone) return msg('اكتب اسم الطالب والكود ورقم الهاتف. الخانات المقروءة: std-name / std-code / std-phone', 'error');
      if(String(phone).length < 6) return msg('رقم الهاتف/كلمة المرور لازم يكون 6 أرقام على الأقل.', 'error');

      const email = code + '@students.titan-academy.app';
      const secondaryAuth = getSecondaryAuth();
      const cred = await secondaryAuth.createUserWithEmailAndPassword(email, phone);
      const studentUid = cred.user.uid;
      await secondaryAuth.signOut();

      await firebase.database().ref('students/'+studentUid).set({
        name, code, phone, level: String(level),
        email,
        createdAt: Date.now(),
        createdByAdmin: true,
        subscription: {status:'active', endDate:'', updatedAt:Date.now()},
        disabled:false,
        tenant: tenant()
      });

      await firebase.database().ref('leaderboard/'+studentUid).set({
        name: name.split(' ')[0] || name,
        level: String(level),
        xp: 0,
        badges: {}
      }).catch(()=>{});

      await firebase.database().ref('user_tenants/'+studentUid+'/'+tenant()).set('student').catch(()=>{});

      clearStudentForm();
      msg('تم إنشاء حساب الطالب بنجاح ✅ الكود: '+code+' | كلمة المرور: '+phone, 'success');
      if(window.renderStudents) setTimeout(renderStudents, 500);
    }catch(e){
      console.error(e);
      msg('تعذر إنشاء حساب الطالب: '+explain(e), 'error');
    }
  }

  window.TitanV14AuthFix = window.TitanV14AuthFix || {};
  window.TitanV14AuthFix.createStudentAccount = createStudentAccountV2;
  window.createStudentAccount = createStudentAccountV2;
  window.createStudent = createStudentAccountV2;
  window.addStudent = createStudentAccountV2;

  document.addEventListener('DOMContentLoaded', function(){
    setTimeout(function(){
      document.querySelectorAll('button').forEach(btn=>{
        const txt=(btn.textContent||'').trim();
        if(txt.includes('إنشاء الحساب وحفظ الطالب') || txt.includes('إنشاء حساب الطالب')){
          btn.onclick=function(ev){ ev.preventDefault(); createStudentAccountV2(); };
        }
      });
    }, 500);
  });
})();


// ===== admin_secure_live_classroom_v15_customization_studio.html :: titan-v15-customization-admin-js =====
(function(){
  const DEFAULTS = {
    branding:{
      name:'أكاديمية تيتان',
      teacher:'',
      logo:'',
      favicon:'',
      whatsapp:'',
      facebook:'',
      youtube:'',
      telegram:'',
      description:'منصة تعليم البرمجة الذكية'
    },
    theme:{
      primary:'#2563eb',
      secondary:'#7c3aed',
      background:'#f4f7fb',
      card:'#ffffff',
      text:'#0f172a',
      muted:'#64748b',
      success:'#10b981',
      warning:'#f59e0b',
      danger:'#ef4444',
      border:'#e2e8f0'
    },
    features:{
      lessons:true,
      quizzes:true,
      live:true,
      community:true,
      portfolio:true,
      parent:true,
      signup:true,
      certificates:true
    },
    labels:{
      lessons:'الدروس',
      quizzes:'الكويزات',
      live:'الحصص',
      community:'المجتمع',
      portfolio:'ملف الإنجاز',
      parent:'ولي الأمر'
    },
    login:{
      title:'دخول المنصة',
      subtitle:'أهلاً بك في منصة التعلم الذكية',
      background:'',
      mode:'code_phone',
      showParent:true,
      showSignup:true
    },
    certificates:{
      title:'شهادة إتمام مستوى',
      body:'تشهد {academyName} بأن الطالب/ة {studentName} قد أتم/ت مستوى {levelName} بنجاح بتاريخ {date}.',
      signature:'',
      seal:'',
      border:'#2563eb'
    },
    plans:[
      {id:'basic',name:'Basic',price:'',durationDays:30,lessons:true,live:false,quizzes:true,certificates:false,files:true},
      {id:'vip',name:'VIP',price:'',durationDays:30,lessons:true,live:true,quizzes:true,certificates:true,files:true}
    ],
    security:{
      singleDevice:false,
      blockExpired:true,
      trackLogin:true,
      deviceLimit:1,
      expiredMessage:'اشتراكك منتهي. تواصل مع الإدارة للتجديد.'
    }
  };

  const $ = id => document.getElementById(id);
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clone = obj => JSON.parse(JSON.stringify(obj));
  const deepMerge = (a,b) => {
    const out = Array.isArray(a) ? a.slice() : {...a};
    Object.keys(b || {}).forEach(k=>{
      if(b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a && typeof a[k] === 'object' && !Array.isArray(a[k])){
        out[k] = deepMerge(a[k], b[k]);
      } else {
        out[k] = b[k];
      }
    });
    return out;
  };
  const db = () => window.firebase && firebase.database ? firebase.database() : null;
  const tenant = () => (window.TitanSaaS && TitanSaaS.tenantId) || new URLSearchParams(location.search).get('tenant') || localStorage.getItem('titanTenantId') || 'titan';

  let plans = clone(DEFAULTS.plans);

  function setStatus(id,msg,type='ok'){
    const el=$(id); if(!el) return;
    el.innerHTML = '<div class="v15-status '+(type==='ok'?'ok':type==='err'?'err':'')+'">'+esc(msg)+'</div>';
  }
  function val(id, fallback=''){ const el=$(id); return el ? String(el.value ?? '').trim() : fallback; }
  function checked(id, fallback=false){ const el=$(id); return el ? !!el.checked : fallback; }
  function setVal(id,v){ const el=$(id); if(el) el.value = v ?? ''; }
  function setChecked(id,v){ const el=$(id); if(el) el.checked = !!v; }

  function collect(){
    return {
      branding:{
        name:val('v15-brand-name',DEFAULTS.branding.name),
        teacher:val('v15-brand-teacher'),
        logo:val('v15-brand-logo'),
        favicon:val('v15-brand-favicon'),
        whatsapp:val('v15-brand-whatsapp'),
        facebook:val('v15-brand-facebook'),
        youtube:val('v15-brand-youtube'),
        telegram:val('v15-brand-telegram'),
        description:val('v15-brand-description')
      },
      theme:{
        primary:val('v15-theme-primary',DEFAULTS.theme.primary),
        secondary:val('v15-theme-secondary',DEFAULTS.theme.secondary),
        background:val('v15-theme-background',DEFAULTS.theme.background),
        card:val('v15-theme-card',DEFAULTS.theme.card),
        text:val('v15-theme-text',DEFAULTS.theme.text),
        muted:val('v15-theme-muted',DEFAULTS.theme.muted),
        success:val('v15-theme-success',DEFAULTS.theme.success),
        warning:val('v15-theme-warning',DEFAULTS.theme.warning),
        danger:val('v15-theme-danger',DEFAULTS.theme.danger),
        border:val('v15-theme-border',DEFAULTS.theme.border)
      },
      features:{
        lessons:checked('v15-feature-lessons',true),
        quizzes:checked('v15-feature-quizzes',true),
        live:checked('v15-feature-live',true),
        community:checked('v15-feature-community',true),
        portfolio:checked('v15-feature-portfolio',true),
        parent:checked('v15-feature-parent',true),
        signup:checked('v15-feature-signup',true),
        certificates:checked('v15-feature-certificates',true)
      },
      labels:{
        lessons:val('v15-label-lessons','الدروس'),
        quizzes:val('v15-label-quizzes','الكويزات'),
        live:val('v15-label-live','الحصص'),
        community:val('v15-label-community','المجتمع'),
        portfolio:val('v15-label-portfolio','ملف الإنجاز'),
        parent:val('v15-label-parent','ولي الأمر')
      },
      login:{
        title:val('v15-login-title','دخول المنصة'),
        subtitle:val('v15-login-subtitle','أهلاً بك في منصة التعلم الذكية'),
        background:val('v15-login-bg'),
        mode:val('v15-login-mode','code_phone'),
        showParent:checked('v15-login-show-parent',true),
        showSignup:checked('v15-login-show-signup',true)
      },
      certificates:{
        title:val('v15-cert-title','شهادة إتمام مستوى'),
        body:val('v15-cert-body',DEFAULTS.certificates.body),
        signature:val('v15-cert-signature'),
        seal:val('v15-cert-seal'),
        border:val('v15-cert-border','#2563eb')
      },
      plans: collectPlans(),
      security:{
        singleDevice:checked('v15-sec-single-device',false),
        blockExpired:checked('v15-sec-block-expired',true),
        trackLogin:checked('v15-sec-track-login',true),
        deviceLimit:Number(val('v15-sec-device-limit',1)) || 1,
        expiredMessage:val('v15-sec-expired-msg',DEFAULTS.security.expiredMessage)
      },
      updatedAt: Date.now(),
      version:'v15_customization_studio'
    };
  }

  function fill(data){
    data = deepMerge(DEFAULTS, data || {});
    const b=data.branding,t=data.theme,f=data.features,l=data.labels,lo=data.login,c=data.certificates,s=data.security;
    setVal('v15-brand-name',b.name); setVal('v15-brand-teacher',b.teacher); setVal('v15-brand-logo',b.logo); setVal('v15-brand-favicon',b.favicon);
    setVal('v15-brand-whatsapp',b.whatsapp); setVal('v15-brand-facebook',b.facebook); setVal('v15-brand-youtube',b.youtube); setVal('v15-brand-telegram',b.telegram); setVal('v15-brand-description',b.description);

    Object.entries(t).forEach(([k,v])=>setVal('v15-theme-'+k,v));
    Object.entries(f).forEach(([k,v])=>setChecked('v15-feature-'+k,v));
    Object.entries(l).forEach(([k,v])=>setVal('v15-label-'+k,v));

    setVal('v15-login-title',lo.title); setVal('v15-login-subtitle',lo.subtitle); setVal('v15-login-bg',lo.background); setVal('v15-login-mode',lo.mode);
    setChecked('v15-login-show-parent',lo.showParent); setChecked('v15-login-show-signup',lo.showSignup);

    setVal('v15-cert-title',c.title); setVal('v15-cert-body',c.body); setVal('v15-cert-signature',c.signature); setVal('v15-cert-seal',c.seal); setVal('v15-cert-border',c.border);

    setChecked('v15-sec-single-device',s.singleDevice); setChecked('v15-sec-block-expired',s.blockExpired); setChecked('v15-sec-track-login',s.trackLogin);
    setVal('v15-sec-device-limit',s.deviceLimit); setVal('v15-sec-expired-msg',s.expiredMessage);

    plans = Array.isArray(data.plans) ? data.plans : clone(DEFAULTS.plans);
    renderPlans();
    applyTheme(data);
    updatePreview();
  }

  function applyTheme(data){
    const t=(data && data.theme) || collect().theme;
    const root=document.documentElement;
    root.style.setProperty('--primary',t.primary);
    root.style.setProperty('--primary-hover',t.secondary);
    root.style.setProperty('--primary-gradient','linear-gradient(135deg,'+t.primary+','+t.secondary+')');
    root.style.setProperty('--bg-body',t.background);
    root.style.setProperty('--bg-card',t.card);
    root.style.setProperty('--card-bg',t.card);
    root.style.setProperty('--text-main',t.text);
    root.style.setProperty('--text-dim',t.muted);
    root.style.setProperty('--success',t.success);
    root.style.setProperty('--danger',t.danger);
    root.style.setProperty('--warning',t.warning);
    root.style.setProperty('--border',t.border);
  }

  function collectPlans(){
    const rows=[...document.querySelectorAll('.v15-plan-row')];
    return rows.map(row=>({
      id:(row.querySelector('.v15-plan-id')?.value||'').trim().toLowerCase().replace(/[^a-z0-9_-]/g,'') || ('plan_'+Date.now()),
      name:row.querySelector('.v15-plan-name')?.value||'خطة',
      price:row.querySelector('.v15-plan-price')?.value||'',
      durationDays:Number(row.querySelector('.v15-plan-duration')?.value||30),
      lessons:row.querySelector('.v15-plan-lessons')?.checked ?? true,
      live:row.querySelector('.v15-plan-live')?.checked ?? false,
      quizzes:row.querySelector('.v15-plan-quizzes')?.checked ?? true,
      certificates:row.querySelector('.v15-plan-certificates')?.checked ?? false,
      files:row.querySelector('.v15-plan-files')?.checked ?? true
    }));
  }

  function renderPlans(){
    const box=$('v15-plans-box'); if(!box) return;
    box.innerHTML = plans.map((p,i)=>`
      <div class="v15-plan-row" data-index="${i}">
        <div class="v15-row">
          <div class="v15-field"><label>ID</label><input class="v15-plan-id" value="${esc(p.id)}"></div>
          <div class="v15-field"><label>اسم الخطة</label><input class="v15-plan-name" value="${esc(p.name)}"></div>
          <div class="v15-field"><label>السعر</label><input class="v15-plan-price" value="${esc(p.price)}"></div>
          <div class="v15-field"><label>المدة بالأيام</label><input class="v15-plan-duration" type="number" value="${esc(p.durationDays||30)}"></div>
        </div>
        <div class="v15-row">
          <label class="v15-check">دروس <input class="v15-plan-lessons" type="checkbox" ${p.lessons?'checked':''}></label>
          <label class="v15-check">لايف <input class="v15-plan-live" type="checkbox" ${p.live?'checked':''}></label>
          <label class="v15-check">كويز <input class="v15-plan-quizzes" type="checkbox" ${p.quizzes?'checked':''}></label>
          <label class="v15-check">شهادات <input class="v15-plan-certificates" type="checkbox" ${p.certificates?'checked':''}></label>
          <label class="v15-check">ملفات <input class="v15-plan-files" type="checkbox" ${p.files?'checked':''}></label>
        </div>
        <button class="btn btn-danger" onclick="TitanV15Admin.removePlan(${i})"><i class="fas fa-trash"></i> حذف الخطة</button>
      </div>
    `).join('');
  }

  async function load(){
    try{
      if($('v15-tenant-name')) $('v15-tenant-name').textContent=tenant();
      const snap = await db().ref('settings/customization').once('value');
      const existing = snap.val();
      const settingsSnap = await db().ref('settings').once('value').catch(()=>null);
      const old = settingsSnap && settingsSnap.val ? settingsSnap.val() : {};
      const merged = deepMerge(DEFAULTS, existing || {
        branding:{
          name: old.name || DEFAULTS.branding.name,
          logo: old.logo || '',
          whatsapp: old.whatsapp || ''
        },
        theme:{
          primary: old.primaryColor || DEFAULTS.theme.primary,
          secondary: old.secondaryColor || DEFAULTS.theme.secondary
        },
        security: old.security || {}
      });
      fill(merged);
      setStatus('v15-global-status','تم تحميل إعدادات التخصيص.','ok');
    }catch(e){
      console.error(e);
      setStatus('v15-global-status','فشل تحميل الإعدادات: '+(e.message||e),'err');
      fill(DEFAULTS);
    }
  }

  async function save(){
    try{
      const data=collect();
      await db().ref('settings/customization').set(data);
      await db().ref('settings').update({
        name:data.branding.name,
        logo:data.branding.logo,
        whatsapp:data.branding.whatsapp,
        primaryColor:data.theme.primary,
        secondaryColor:data.theme.secondary,
        security:data.security,
        customizationVersion:'v15',
        updatedAt:Date.now()
      });
      applyTheme(data);
      updatePreview();
      setStatus('v15-save-status','تم حفظ التخصيص وتطبيقه على الأكاديمية.','ok');
      setStatus('v15-global-status','تم الحفظ بنجاح.','ok');
      if(window.showToast) showToast('تم حفظ التخصيص','success');
    }catch(e){
      console.error(e);
      setStatus('v15-save-status','فشل الحفظ: '+(e.message||e),'err');
    }
  }

  function showTab(name){
    document.querySelectorAll('.v15-pane').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.v15-tab').forEach(t=>t.classList.remove('active'));
    const pane=$('v15-pane-'+name); if(pane) pane.classList.add('active');
    const tabs=[...document.querySelectorAll('.v15-tab')];
    const btn=tabs.find(b=>String(b.getAttribute('onclick')||'').includes("'"+name+"'"));
    if(btn) btn.classList.add('active');
    if(name==='preview') updatePreview();
  }

  function addPlan(){
    plans = collectPlans();
    plans.push({id:'new_plan_'+(plans.length+1),name:'خطة جديدة',price:'',durationDays:30,lessons:true,live:false,quizzes:true,certificates:false,files:true});
    renderPlans();
  }
  function removePlan(index){
    plans = collectPlans();
    plans.splice(index,1);
    renderPlans();
  }

  function updatePreview(){
    const data=collect();
    applyTheme(data);
    const el=$('v15-live-preview'); if(!el) return;
    const t=data.theme,b=data.branding,l=data.labels,lo=data.login;
    el.innerHTML = `
      <div class="v15-preview-head" style="background:linear-gradient(135deg,${esc(t.primary)},${esc(t.secondary)})">
        <h2>${esc(b.name || 'اسم الأكاديمية')}</h2>
        <p>${esc(b.description || 'وصف المنصة')}</p>
      </div>
      <div class="v15-preview-body" style="background:${esc(t.background)};color:${esc(t.text)}">
        <div class="v15-preview-card" style="background:${esc(t.card)};color:${esc(t.text)};border:1px solid ${esc(t.border)}">
          <h3>${esc(lo.title)}</h3>
          <p style="color:${esc(t.muted)}">${esc(lo.subtitle)}</p>
          <button class="btn" style="background:linear-gradient(135deg,${esc(t.primary)},${esc(t.secondary)});color:white;border:0">زر أساسي</button>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
          ${data.features.lessons?`<span class="mini-badge">${esc(l.lessons)}</span>`:''}
          ${data.features.live?`<span class="mini-badge">${esc(l.live)}</span>`:''}
          ${data.features.community?`<span class="mini-badge">${esc(l.community)}</span>`:''}
          ${data.features.portfolio?`<span class="mini-badge">${esc(l.portfolio)}</span>`:''}
        </div>
      </div>
    `;
  }

  function resetDefaults(){
    if(!confirm('رجوع للإعدادات الافتراضية؟')) return;
    fill(DEFAULTS);
    setStatus('v15-global-status','تم الرجوع للإعدادات الافتراضية، اضغط حفظ لتطبيقها.','ok');
  }

  window.TitanV15Admin = {load,save,showTab,addPlan,removePlan,updatePreview,resetDefaults,defaults:DEFAULTS};

  document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(load,1200);
    setTimeout(()=>{
      document.querySelectorAll('#sec-v15-customization input,#sec-v15-customization select,#sec-v15-customization textarea').forEach(el=>{
        el.addEventListener('input', updatePreview);
        el.addEventListener('change', updatePreview);
      });
    },1600);
  });
})();


// ===== admin_secure_live_classroom_v15_customization_studio.html :: titan-v15-live-server-diagnostic-js =====
(function(){
  window.addEventListener('DOMContentLoaded', function(){
    try{
      if(location.protocol === 'file:'){
        console.warn('Titan V15: افتح الملف من Live Server / localhost وليس file://');
      }
    }catch(e){}
  });
})();


// ===== admin_secure_live_classroom_v15_customization_studio.html :: titan-v16-admin-js =====
(function(){
  const ROOTS=['learning_paths','coding_challenges','challenge_attempts','portfolio_projects','student_rewards','assistant_faq','message_templates','payment_plans','coupons','invoices','support'];
  const state={paths:{},challenges:{},attempts:{},projects:{},rewards:{},faq:{},templates:{},plans:{},coupons:{},invoices:{},support:{}};
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function db(){return window.db || (window.firebase&&firebase.database&&firebase.database());}
  function ref(p){return db().ref(p);}
  function uid(){return window.auth&&auth.currentUser&&auth.currentUser.uid;}
  function now(){return Date.now();}
  function arDate(ts){try{return new Date(ts||Date.now()).toLocaleString('ar-EG')}catch(e){return ''}}
  function toast(msg,type){ if(window.showToast) showToast(msg,type||'success'); else alert(msg); }
  function toArray(obj){return Object.entries(obj||{}).map(([key,val])=>Object.assign({key},val||{}));}
  function currentStudents(){return window.db_students || []}
  function studentOptions(){return currentStudents().map(s=>`<option value="${esc(s.fbKey)}">${esc(s.name||s.code||s.fbKey)}</option>`).join('')}
  function html(){return `
  <section id="sec-v16-features" style="display:none;">
    <div class="v16-hero"><h3><i class="fas fa-rocket"></i> V16 Pro Features Pack</h3><p>إدارة الاشتراكات، المسارات، تحديات البرمجة، المساعد الذكي، التحليلات، الواتساب، المشاريع، والتذاكر المتقدمة.</p><div id="v16-admin-health" class="v16-status">جاري تشغيل إضافات V16...</div></div>
    <div class="v16-tabs">
      <button class="v16-tab active" onclick="TitanV16Admin.tab('analytics',this)"><i class="fas fa-chart-pie"></i> التحليلات</button>
      <button class="v16-tab" onclick="TitanV16Admin.tab('payments',this)"><i class="fas fa-credit-card"></i> الاشتراكات</button>
      <button class="v16-tab" onclick="TitanV16Admin.tab('paths',this)"><i class="fas fa-route"></i> المسارات</button>
      <button class="v16-tab" onclick="TitanV16Admin.tab('challenges',this)"><i class="fas fa-code"></i> التحديات</button>
      <button class="v16-tab" onclick="TitanV16Admin.tab('assistant',this)"><i class="fas fa-robot"></i> المساعد</button>
      <button class="v16-tab" onclick="TitanV16Admin.tab('messaging',this)"><i class="fab fa-whatsapp"></i> الرسائل</button>
      <button class="v16-tab" onclick="TitanV16Admin.tab('projects',this)"><i class="fas fa-briefcase"></i> المشاريع</button>
      <button class="v16-tab" onclick="TitanV16Admin.tab('tickets',this)"><i class="fas fa-headset"></i> التذاكر</button>
    </div>
    <div id="v16-pane-analytics" class="v16-pane active"><div class="v16-grid" id="v16-kpis"></div><div class="v16-card"><h4><i class="fas fa-triangle-exclamation"></i> طلاب يحتاجون متابعة</h4><div id="v16-risk-list"></div></div></div>
    <div id="v16-pane-payments" class="v16-pane"><div class="v16-grid"><div class="v16-card"><h4><i class="fas fa-layer-group"></i> خطة اشتراك</h4><input id="v16-plan-name" placeholder="اسم الخطة مثل VIP"><input id="v16-plan-price" type="number" placeholder="السعر"><input id="v16-plan-days" type="number" placeholder="المدة بالأيام" value="30"><textarea id="v16-plan-features" rows="3" placeholder="مميزات الخطة - كل سطر ميزة"></textarea><button class="btn btn-success" onclick="TitanV16Admin.savePlan()"><i class="fas fa-save"></i> حفظ الخطة</button></div><div class="v16-card"><h4><i class="fas fa-percent"></i> كوبون خصم</h4><input id="v16-coupon-code" placeholder="كود الخصم"><input id="v16-coupon-percent" type="number" placeholder="النسبة %"><input id="v16-coupon-exp" type="date"><button class="btn btn-success" onclick="TitanV16Admin.saveCoupon()"><i class="fas fa-save"></i> حفظ الكوبون</button></div><div class="v16-card"><h4><i class="fas fa-file-invoice"></i> فاتورة لطالب</h4><select id="v16-invoice-student"></select><input id="v16-invoice-amount" type="number" placeholder="المبلغ"><input id="v16-invoice-due" type="date"><input id="v16-invoice-note" placeholder="ملاحظة"><button class="btn btn-primary" onclick="TitanV16Admin.createInvoice()"><i class="fas fa-plus"></i> إنشاء فاتورة</button></div></div><div class="v16-grid"><div class="v16-card"><h4>الخطط</h4><div id="v16-plans-list"></div></div><div class="v16-card"><h4>الكوبونات</h4><div id="v16-coupons-list"></div></div><div class="v16-card"><h4>الفواتير</h4><div id="v16-invoices-list"></div></div></div></div>
    <div id="v16-pane-paths" class="v16-pane"><div class="v16-card"><h4><i class="fas fa-route"></i> إنشاء مسار تعليمي</h4><div class="v16-row"><input id="v16-path-title" placeholder="عنوان المسار"><select id="v16-path-level"><option value="1">مستوى 1</option><option value="2">مستوى 2</option><option value="3">مستوى 3</option></select><input id="v16-path-order" type="number" value="1" placeholder="الترتيب"></div><textarea id="v16-path-desc" rows="3" placeholder="وصف المسار"></textarea><textarea id="v16-path-lessons" rows="3" placeholder="مفاتيح الدروس بالترتيب، افصل بينها بفاصلة. يمكن نسخ fbKey من مكتبة الدروس."></textarea><button class="btn btn-success" onclick="TitanV16Admin.savePath()"><i class="fas fa-save"></i> نشر المسار</button></div><div id="v16-paths-list"></div></div>
    <div id="v16-pane-challenges" class="v16-pane"><div class="v16-card"><h4><i class="fas fa-code"></i> تحدي برمجة بتصحيح تلقائي</h4><div class="v16-row"><input id="v16-ch-title" placeholder="عنوان التحدي"><select id="v16-ch-level"><option value="1">مستوى 1</option><option value="2">مستوى 2</option><option value="3">مستوى 3</option></select><input id="v16-ch-xp" type="number" value="40" placeholder="XP"></div><textarea id="v16-ch-prompt" rows="3" placeholder="وصف المطلوب من الطالب"></textarea><textarea id="v16-ch-starter" rows="4" class="v16-code" placeholder="كود البداية HTML/CSS/JS"></textarea><textarea id="v16-ch-tests" rows="4" class="v16-code" placeholder="اختبارات التصحيح، مثال:\ncontains:<h1>\ncontains:color\nselector:h1\njs:document.querySelectorAll('h1').length===1"></textarea><button class="btn btn-success" onclick="TitanV16Admin.saveChallenge()"><i class="fas fa-save"></i> حفظ التحدي</button></div><div id="v16-challenges-list"></div></div>
    <div id="v16-pane-assistant" class="v16-pane"><div class="v16-card"><h4><i class="fas fa-robot"></i> قاعدة معرفة المساعد</h4><input id="v16-faq-q" placeholder="السؤال المتوقع"><textarea id="v16-faq-a" rows="4" placeholder="الإجابة التي تظهر للطالب"></textarea><input id="v16-faq-tags" placeholder="كلمات مفتاحية: html,css,loop"><input id="v16-faq-lesson" placeholder="مفتاح درس اختياري"><button class="btn btn-success" onclick="TitanV16Admin.saveFaq()"><i class="fas fa-save"></i> إضافة للمساعد</button></div><div id="v16-faq-list"></div></div>
    <div id="v16-pane-messaging" class="v16-pane"><div class="v16-grid"><div class="v16-card"><h4><i class="fab fa-whatsapp"></i> قالب رسالة</h4><input id="v16-tpl-title" placeholder="اسم القالب"><textarea id="v16-tpl-body" rows="5" placeholder="النص. استخدم {name} {code} {level} {debt} {link}"></textarea><button class="btn btn-success" onclick="TitanV16Admin.saveTemplate()"><i class="fas fa-save"></i> حفظ القالب</button></div><div class="v16-card"><h4><i class="fas fa-paper-plane"></i> توليد رسالة لطالب</h4><select id="v16-msg-student"></select><select id="v16-msg-template"></select><input id="v16-msg-link" placeholder="رابط اختياري"><button class="btn btn-primary" onclick="TitanV16Admin.generateMessage()"><i class="fab fa-whatsapp"></i> توليد</button><textarea id="v16-message-output" rows="6"></textarea><div class="v16-mini-actions"><button class="btn btn-info" onclick="TitanV16Admin.copyMessage()"><i class="fas fa-copy"></i> نسخ</button><a id="v16-wa-link" class="btn btn-success" target="_blank"><i class="fab fa-whatsapp"></i> فتح واتساب</a></div></div></div><div id="v16-templates-list"></div></div>
    <div id="v16-pane-projects" class="v16-pane"><div class="v16-card"><h4><i class="fas fa-briefcase"></i> مشاريع الطلاب</h4><div id="v16-projects-list"></div></div></div>
    <div id="v16-pane-tickets" class="v16-pane"><div class="v16-card"><h4><i class="fas fa-headset"></i> التذاكر المتقدمة</h4><div id="v16-tickets-list"></div></div></div>
  </section>`}
  function install(){
    const nav=document.querySelector('aside.sidebar nav');
    if(nav&&!document.querySelector('[data-v16-admin-nav]')){ const btn=document.createElement('button'); btn.className='btn btn-outline'; btn.setAttribute('data-v16-admin-nav','1'); btn.setAttribute('onclick',"showSec('v16-features')"); btn.innerHTML='<i class="fas fa-rocket"></i> V16 Pro Pack'; nav.insertBefore(btn, nav.lastElementChild); }
    const main=document.querySelector('main.main-content');
    if(main&&!document.getElementById('sec-v16-features')) main.insertAdjacentHTML('beforeend', html());
    setTimeout(refreshSelectors,400);
  }
  function start(){ if(!db()||!window.firebase){setTimeout(start,700);return;} install(); document.getElementById('v16-admin-health')?.classList.add('v16-ok'); ROOTS.forEach(name=>{ref(name).on('value',s=>{state[name==='learning_paths'?'paths':name==='coding_challenges'?'challenges':name==='challenge_attempts'?'attempts':name==='portfolio_projects'?'projects':name==='student_rewards'?'rewards':name==='assistant_faq'?'faq':name]=s.val()||{}; renderAll();});}); renderAll(); }
  function refreshSelectors(){ const opts=studentOptions(); ['v16-invoice-student','v16-msg-student'].forEach(id=>{const el=document.getElementById(id); if(el) el.innerHTML=opts;}); const tpl=document.getElementById('v16-msg-template'); if(tpl) tpl.innerHTML=toArray(state.templates).map(t=>`<option value="${esc(t.key)}">${esc(t.title)}</option>`).join(''); }
  function tab(id,btn){document.querySelectorAll('#sec-v16-features .v16-pane').forEach(p=>p.classList.remove('active'));document.getElementById('v16-pane-'+id)?.classList.add('active');document.querySelectorAll('#sec-v16-features .v16-tab').forEach(b=>b.classList.remove('active'));btn&&btn.classList.add('active');renderAll();}
  async function savePlan(){const data={name:v('v16-plan-name'),price:num('v16-plan-price'),durationDays:num('v16-plan-days')||30,features:lines('v16-plan-features'),active:true,createdAt:now(),createdBy:uid()}; if(!data.name)return toast('اكتب اسم الخطة','error'); await ref('payment_plans').push(data); toast('تم حفظ الخطة'); clear(['v16-plan-name','v16-plan-price','v16-plan-features']);}
  async function saveCoupon(){const code=v('v16-coupon-code').toUpperCase(); if(!code)return toast('اكتب كود الخصم','error'); await ref('coupons/'+code).set({code,percent:num('v16-coupon-percent'),expiresAt:v('v16-coupon-exp'),active:true,createdAt:now()}); toast('تم حفظ الكوبون');}
  async function createInvoice(){const sid=v('v16-invoice-student'), st=currentStudents().find(s=>s.fbKey===sid)||{}; if(!sid)return toast('اختر الطالب','error'); const data={studentKey:sid,studentName:st.name||'',code:st.code||'',phone:st.phone||'',amount:num('v16-invoice-amount'),remaining:num('v16-invoice-amount'),status:'unpaid',dueDate:v('v16-invoice-due'),note:v('v16-invoice-note'),createdAt:now()}; await ref('invoices').push(data); toast('تم إنشاء الفاتورة');}
  async function savePath(){const data={title:v('v16-path-title'),level:v('v16-path-level'),order:num('v16-path-order')||1,description:v('v16-path-desc'),lessons:split('v16-path-lessons'),active:true,createdAt:now()}; if(!data.title)return toast('اكتب عنوان المسار','error'); await ref('learning_paths').push(data); toast('تم نشر المسار');}
  async function saveChallenge(){const data={title:v('v16-ch-title'),level:v('v16-ch-level'),xp:num('v16-ch-xp')||40,prompt:v('v16-ch-prompt'),starter:v('v16-ch-starter'),tests:lines('v16-ch-tests'),active:true,createdAt:now()}; if(!data.title||!data.prompt)return toast('أكمل بيانات التحدي','error'); await ref('coding_challenges').push(data); toast('تم حفظ التحدي');}
  async function saveFaq(){const data={question:v('v16-faq-q'),answer:v('v16-faq-a'),tags:split('v16-faq-tags'),lessonKey:v('v16-faq-lesson'),active:true,createdAt:now()}; if(!data.question||!data.answer)return toast('اكتب السؤال والإجابة','error'); await ref('assistant_faq').push(data); toast('تمت إضافة المعرفة');}
  async function saveTemplate(){const data={title:v('v16-tpl-title'),body:v('v16-tpl-body'),createdAt:now(),createdBy:uid()}; if(!data.title||!data.body)return toast('أكمل القالب','error'); await ref('message_templates').push(data); toast('تم حفظ القالب');}
  function generateMessage(){const sid=v('v16-msg-student'), tid=v('v16-msg-template'); const st=currentStudents().find(s=>s.fbKey===sid)||{}; const tpl=state.templates[tid]||{}; const inv=toArray(state.invoices).filter(i=>i.studentKey===sid&&i.status!=='paid').reduce((a,i)=>a+Number(i.remaining||i.amount||0),0); let text=String(tpl.body||'').replaceAll('{name}',st.name||'').replaceAll('{code}',st.code||'').replaceAll('{level}',st.level||'').replaceAll('{debt}',String(inv)).replaceAll('{link}',v('v16-msg-link')); by('v16-message-output').value=text; const phone=String(st.phone||'').replace(/[^0-9]/g,''); const link='https://wa.me/'+phone+'?text='+encodeURIComponent(text); by('v16-wa-link').href=phone?link:'#';}
  function copyMessage(){const el=by('v16-message-output'); el.select(); document.execCommand('copy'); toast('تم نسخ الرسالة');}
  function updateTicket(key,patch){ref('support/'+key).update(patch);}
  function removeKey(path,key){if(confirm('حذف العنصر؟')) ref(path+'/'+key).remove();}
  function renderAll(){refreshSelectors(); renderKpis(); renderPayments(); renderPaths(); renderChallenges(); renderFaq(); renderTemplates(); renderProjects(); renderTickets();}
  function renderKpis(){const students=currentStudents(); const invoices=toArray(state.invoices); const attempts=flat(state.attempts); const projects=flat(state.projects); const unpaid=invoices.filter(i=>i.status!=='paid').reduce((a,i)=>a+Number(i.remaining||i.amount||0),0); const active=Object.keys(state.rewards||{}).length; set('v16-kpis',`<div class="v16-kpi"><small>الطلاب</small><strong>${students.length}</strong></div><div class="v16-kpi"><small>مسارات</small><strong>${toArray(state.paths).length}</strong></div><div class="v16-kpi"><small>تحديات</small><strong>${toArray(state.challenges).length}</strong></div><div class="v16-kpi"><small>محاولات</small><strong>${attempts.length}</strong></div><div class="v16-kpi"><small>مشاريع</small><strong>${projects.length}</strong></div><div class="v16-kpi"><small>مديونية</small><strong>${unpaid}</strong></div>`); const risks=students.map(s=>{const r=state.rewards[s.fbKey]||{}; const inv=invoices.filter(i=>i.studentKey===s.fbKey&&i.status!=='paid').reduce((a,i)=>a+Number(i.remaining||i.amount||0),0); const days=r.lastLogin?Math.round((Date.now()-Number(r.lastLogin))/86400000):999; return {s,inv,days}}).filter(x=>x.inv>0||x.days>=7); set('v16-risk-list',risks.length?risks.map(x=>`<div class="v16-list-item"><b>${esc(x.s.name)}</b> <span class="v16-pill">غياب ${x.days===999?'غير معروف':x.days+' يوم'}</span> <span class="v16-pill">مديونية ${x.inv}</span></div>`).join(''):'<div class="v16-status v16-ok">لا توجد مخاطر واضحة حالياً.</div>');}
  function renderPayments(){set('v16-plans-list',toArray(state.payment_plans||state.plans).map(p=>`<div class="v16-list-item"><b>${esc(p.name)}</b> <span class="v16-pill">${esc(p.price)} ج</span><span class="v16-pill">${esc(p.durationDays)} يوم</span><div class="v16-mini-actions"><button class="btn btn-danger" onclick="TitanV16Admin.removeKey('payment_plans','${p.key}')">حذف</button></div></div>`).join('')||'<p>لا توجد خطط.</p>'); set('v16-coupons-list',toArray(state.coupons).map(c=>`<div class="v16-list-item"><b>${esc(c.code||c.key)}</b> <span class="v16-pill">${esc(c.percent)}%</span><span class="v16-pill">${esc(c.expiresAt||'بدون انتهاء')}</span><div class="v16-mini-actions"><button class="btn btn-danger" onclick="TitanV16Admin.removeKey('coupons','${c.key}')">حذف</button></div></div>`).join('')||'<p>لا توجد كوبونات.</p>'); set('v16-invoices-list',toArray(state.invoices).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).slice(0,40).map(i=>`<div class="v16-list-item"><b>${esc(i.studentName)}</b> <span class="v16-pill">${esc(i.amount)} ج</span><span class="v16-pill">${esc(i.status||'unpaid')}</span><div>${esc(i.note||'')}</div><div class="v16-mini-actions"><button class="btn btn-success" onclick="TitanV16Admin.updateInvoice('${i.key}','paid')">مدفوع</button><button class="btn btn-warning" onclick="TitanV16Admin.updateInvoice('${i.key}','unpaid')">غير مدفوع</button></div></div>`).join('')||'<p>لا توجد فواتير.</p>');}
  async function updateInvoice(key,status){await ref('invoices/'+key).update({status,paidAt:status==='paid'?now():null,remaining:status==='paid'?0:null});toast('تم تحديث الفاتورة');}
  function renderPaths(){set('v16-paths-list',toArray(state.paths).sort((a,b)=>(a.order||0)-(b.order||0)).map(p=>`<div class="v16-card"><h4><i class="fas fa-route"></i>${esc(p.title)}</h4><p>${esc(p.description)}</p><span class="v16-pill">مستوى ${esc(p.level)}</span><span class="v16-pill">${(p.lessons||[]).length} دروس</span><div class="v16-mini-actions"><button class="btn btn-danger" onclick="TitanV16Admin.removeKey('learning_paths','${p.key}')">حذف</button></div></div>`).join('')||'<div class="v16-status">لا توجد مسارات.</div>');}
  function renderChallenges(){set('v16-challenges-list',toArray(state.challenges).map(c=>`<div class="v16-card"><h4><i class="fas fa-code"></i>${esc(c.title)}</h4><p>${esc(c.prompt)}</p><span class="v16-pill">مستوى ${esc(c.level)}</span><span class="v16-pill">${esc(c.xp)} XP</span><span class="v16-pill">${(c.tests||[]).length} اختبار</span><div class="v16-mini-actions"><button class="btn btn-danger" onclick="TitanV16Admin.removeKey('coding_challenges','${c.key}')">حذف</button></div></div>`).join('')||'<div class="v16-status">لا توجد تحديات.</div>');}
  function renderFaq(){set('v16-faq-list',toArray(state.faq).map(f=>`<div class="v16-list-item"><b>${esc(f.question)}</b><p>${esc(f.answer)}</p><span class="v16-pill">${esc((f.tags||[]).join(', '))}</span><div class="v16-mini-actions"><button class="btn btn-danger" onclick="TitanV16Admin.removeKey('assistant_faq','${f.key}')">حذف</button></div></div>`).join('')||'<div class="v16-status">لا توجد أسئلة للمساعد.</div>');}
  function renderTemplates(){set('v16-templates-list',toArray(state.templates).map(t=>`<div class="v16-list-item"><b>${esc(t.title)}</b><pre class="v16-code">${esc(t.body)}</pre><button class="btn btn-danger" onclick="TitanV16Admin.removeKey('message_templates','${t.key}')">حذف</button></div>`).join('')||'');}
  function renderProjects(){const arr=flat(state.projects); set('v16-projects-list',arr.length?arr.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).map(p=>`<div class="v16-list-item"><b>${esc(p.title)}</b> - ${esc(p.studentName||p.uid)}<p>${esc(p.description||'')}</p>${p.url?`<a class="v16-pill" target="_blank" href="${esc(p.url)}">فتح المشروع</a>`:''}<span class="v16-pill">${esc(p.status||'submitted')}</span><div class="v16-mini-actions"><button class="btn btn-success" onclick="TitanV16Admin.gradeProject('${p.uid}','${p.key}','approved')">قبول</button><button class="btn btn-warning" onclick="TitanV16Admin.gradeProject('${p.uid}','${p.key}','needs_work')">يحتاج تعديل</button></div></div>`).join(''):'<div class="v16-status">لا توجد مشاريع بعد.</div>');}
  async function gradeProject(uid,key,status){await ref('portfolio_projects/'+uid+'/'+key).update({status,reviewedAt:now()});toast('تم تحديث المشروع');}
  function renderTickets(){const arr=toArray(state.support).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)); set('v16-tickets-list',arr.length?arr.map(t=>`<div class="v16-list-item"><b>${esc(t.studentName||'طالب')}</b> <span class="v16-pill">${esc(t.status||'open')}</span><span class="v16-pill">${esc(t.priority||'normal')}</span><p>${esc(t.text||'')}</p><div class="v16-row"><select id="v16-ticket-status-${t.key}"><option value="open">مفتوحة</option><option value="reviewing">قيد المراجعة</option><option value="resolved">تم الحل</option></select><select id="v16-ticket-priority-${t.key}"><option value="low">منخفضة</option><option value="normal">عادية</option><option value="high">عالية</option></select><input id="v16-ticket-reply-${t.key}" placeholder="رد الإدارة"></div><div class="v16-mini-actions"><button class="btn btn-success" onclick="TitanV16Admin.saveTicket('${t.key}')">حفظ الرد والحالة</button></div></div>`).join(''):'<div class="v16-status">لا توجد تذاكر.</div>');}
  function saveTicket(key){updateTicket(key,{status:v('v16-ticket-status-'+key),priority:v('v16-ticket-priority-'+key),reply:v('v16-ticket-reply-'+key),repliedAt:now()});toast('تم تحديث التذكرة');}
  function flat(obj){let out=[]; Object.entries(obj||{}).forEach(([uid,items])=>{Object.entries(items||{}).forEach(([key,val])=>out.push(Object.assign({uid,key},val||{}))) }); return out;}
  function by(id){return document.getElementById(id)} function set(id,h){const el=by(id); if(el) el.innerHTML=h} function v(id){return by(id)?.value?.trim()||''} function num(id){return Number(v(id)||0)} function lines(id){return v(id).split('\n').map(x=>x.trim()).filter(Boolean)} function split(id){return v(id).split(/[،,\n]/).map(x=>x.trim()).filter(Boolean)} function clear(ids){ids.forEach(id=>{const el=by(id); if(el) el.value=''})}
  window.TitanV16Admin={tab,savePlan,saveCoupon,createInvoice,savePath,saveChallenge,saveFaq,saveTemplate,generateMessage,copyMessage,removeKey,updateInvoice,gradeProject,saveTicket};
  document.addEventListener('DOMContentLoaded',start);
  if(document.readyState!=='loading') start();
})();
