// ===== parent_portal_v15_customization_studio.html :: inline-script-01 =====
const firebaseConfig = {
  apiKey: "AIzaSyDgMV79LTyiQerEOZvtuszH6ONaOAset5c",
  authDomain: "programming-cc297.firebaseapp.com",
  databaseURL: "https://programming-cc297-default-rtdb.firebaseio.com",
  projectId: "programming-cc297",
  storageBucket: "programming-cc297.firebasestorage.app",
  messagingSenderId: "131761323515",
  appId: "1:131761323515:web:9a0b1f3fcb7e49ec9b91c4"
};

firebase.initializeApp(firebaseConfig);

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

const auth=firebase.auth(), db=firebase.database();
function esc(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function parentLogin(){const c=code.value.trim(), p=phone.value.trim(); if(!c||!p)return alert('اكتب الكود والهاتف'); await auth.signInWithEmailAndPassword(c+'@students.titan-academy.app',p); loadParentData();}
async function loadParentData(){const uid=auth.currentUser.uid; const [s,prog,less,grades,inv,att]=await Promise.all([db.ref('students/'+uid).once('value'),db.ref('lesson_progress/'+uid).once('value'),db.ref('content').once('value'),db.ref('grades').once('value'),db.ref('invoices').once('value'),db.ref('qr_attendance').once('value')]); const st=s.val()||{}; document.getElementById('login').style.display='none'; document.getElementById('app').style.display='block'; document.getElementById('student-name').textContent=st.name||'طالب'; document.getElementById('student-level').textContent='المستوى: '+(st.level||'-'); const lessons=less.val()||{}, pr=prog.val()||{}; const rows=Object.entries(pr); const avg=rows.length?Math.round(rows.reduce((a,[k,v])=>a+(v.percent||0),0)/rows.length):0; document.getElementById('avg-progress').textContent=avg+'%'; document.getElementById('done-lessons').textContent=rows.filter(([k,v])=>(v.percent||0)>=100).length; document.getElementById('progress-table').innerHTML=rows.map(([k,v])=>'<tr><td>'+esc((lessons[k]&&lessons[k].title)||k)+'</td><td>'+esc(v.percent||0)+'%</td></tr>').join(''); const gr=Object.values(grades.val()||{}).filter(g=>g.studentKey===uid); document.getElementById('grades-table').innerHTML=gr.map(g=>'<tr><td>'+esc(g.examName||g.name||'-')+'</td><td>'+esc(g.grade||g.score||'-')+'</td></tr>').join(''); const invoices=Object.values(inv.val()||{}).filter(x=>x.studentKey===uid); const debt=invoices.reduce((a,x)=>a+Number(x.remaining||x.debt||0),0); document.getElementById('debt').textContent=debt; const attRows=[]; Object.entries(att.val()||{}).forEach(([code,students])=>{if(students[uid])attRows.push({code,at:students[uid].joinedAt})}); document.getElementById('attendance-table').innerHTML=attRows.map(a=>'<tr><td>'+esc(a.code)+'</td><td>'+esc(a.at?new Date(a.at).toLocaleString('ar-EG'):'-')+'</td></tr>').join('');}


// ===== parent_portal_v15_customization_studio.html :: titan-v15-parent-js =====
(function(){
  const db=()=>window.firebase&&firebase.database?firebase.database():null;
  const esc=v=>String(v==null?'':v);
  function apply(data){
    data=data||{};
    const t=data.theme||{}, b=data.branding||{};
    const root=document.documentElement;
    if(t.primary) root.style.setProperty('--primary',t.primary);
    if(t.primary&&t.secondary) root.style.setProperty('--primary-gradient','linear-gradient(135deg,'+t.primary+','+t.secondary+')');
    if(t.background) root.style.setProperty('--bg-body',t.background);
    if(t.card) root.style.setProperty('--card-bg',t.card);
    if(t.text) root.style.setProperty('--text-main',t.text);
    if(t.muted) root.style.setProperty('--text-dim',t.muted);
    if(t.border) root.style.setProperty('--border',t.border);
    if(b.name) document.title=b.name+' - ولي الأمر';
    const h=document.querySelector('h1'); if(h&&b.name) h.innerHTML='<i class="fas fa-people-roof"></i> لوحة ولي الأمر - '+esc(b.name);
  }
  document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(async()=>{
      try{
        const snap=await db().ref('settings/customization').once('value');
        apply(snap.val()||{});
        db().ref('settings/customization').on('value',s=>apply(s.val()||{}));
      }catch(e){console.warn(e);}
    },700);
  });
})();


// ===== parent_portal_v15_customization_studio.html :: titan-v16-parent-js-extra =====
(function(){
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function db(){return firebase.database()} function uid(){return firebase.auth().currentUser&&firebase.auth().currentUser.uid}
  function install(){const app=document.getElementById('app'); if(app&&!document.getElementById('v16-parent-extra')) app.insertAdjacentHTML('beforeend',`<div id="v16-parent-extra"><div class="v16-parent-card"><h3><i class="fas fa-chart-line"></i> متابعة V16</h3><div class="v16-parent-grid" id="v16-parent-kpis"></div></div><div class="v16-parent-card"><h3><i class="fas fa-code"></i> تحديات البرمجة</h3><div id="v16-parent-challenges"></div></div><div class="v16-parent-card"><h3><i class="fas fa-briefcase"></i> مشاريع الطالب</h3><div id="v16-parent-projects"></div></div><div class="v16-parent-card"><h3><i class="fas fa-file-invoice"></i> الفواتير</h3><div id="v16-parent-invoices"></div></div></div>`);}
  async function load(){install(); const id=uid(); if(!id)return; const [r,a,p,i]=await Promise.all([db().ref('student_rewards/'+id).once('value'),db().ref('challenge_attempts/'+id).once('value'),db().ref('portfolio_projects/'+id).once('value'),db().ref('invoices').once('value')]); const rewards=r.val()||{}, attempts=a.val()||{}, projects=p.val()||{}, invoices=Object.entries(i.val()||{}).map(([key,val])=>Object.assign({key},val||{})).filter(x=>x.studentKey===id); document.getElementById('v16-parent-kpis').innerHTML=`<div class="kpi"><small>XP</small><br><b>${esc(rewards.xp||0)}</b></div><div class="kpi"><small>سلسلة التعلم</small><br><b>${esc(rewards.streak||0)}</b></div><div class="kpi"><small>تحديات محلولة</small><br><b>${Object.values(attempts).filter(x=>x&&x.passed).length}</b></div><div class="kpi"><small>مشاريع</small><br><b>${Object.keys(projects).length}</b></div>`; document.getElementById('v16-parent-challenges').innerHTML=Object.values(attempts).map(x=>`<div class="v16-parent-item"><b>${esc(x.title)}</b> <span class="v16-parent-pill">${x.passed?'ناجح':'محاولة'}</span><span class="v16-parent-pill">${esc(x.score||0)}%</span></div>`).join('')||'لا توجد محاولات.'; document.getElementById('v16-parent-projects').innerHTML=Object.values(projects).map(x=>`<div class="v16-parent-item"><b>${esc(x.title)}</b><p>${esc(x.description||'')}</p><span class="v16-parent-pill">${esc(x.status||'submitted')}</span>${x.url?`<a class="v16-parent-pill" href="${esc(x.url)}" target="_blank">فتح المشروع</a>`:''}</div>`).join('')||'لا توجد مشاريع.'; document.getElementById('v16-parent-invoices').innerHTML=invoices.map(x=>`<div class="v16-parent-item"><b>${esc(x.amount)} ج</b> <span class="v16-parent-pill">${esc(x.status||'unpaid')}</span><p>${esc(x.note||'')}</p></div>`).join('')||'لا توجد فواتير.';}
  const old=window.loadParentData; if(typeof old==='function'){window.loadParentData=async function(){const res=await old.apply(this,arguments); setTimeout(load,600); return res;}}
})();
