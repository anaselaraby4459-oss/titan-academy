// ===== index.html :: inline-script-01 =====
function go(type){
  const t=(document.getElementById('tenant').value||'titan').trim().toLowerCase();
  const files={admin:'admin_secure_live_classroom_v15_customization_studio.html',student:'student_secure_live_classroom_v15_customization_studio.html',parent:'parent_portal_v15_customization_studio.html'};
  location.href=files[type]+'?tenant='+encodeURIComponent(t);
}


// ===== index.html :: inline-script-02 =====
if('serviceWorker' in navigator){navigator.serviceWorker.register('./service-worker.js').catch(()=>{});}
