(function(){
  var current = location.pathname.split('/').pop() || '';
  var map = {
    'admin_secure_live_classroom_v15_customization_studio.html':'admin.html',
    'admin_secure_live_classroom_v15_customization_studio_fix1.html':'admin.html',
    'student_secure_live_classroom_v15_customization_studio.html':'student.html',
    'student_secure_live_classroom_v15_customization_studio_fix1.html':'student.html',
    'parent_portal_v15_customization_studio.html':'parent.html',
    'parent_portal_v15_customization_studio_fix1.html':'parent.html'
  };
  var target = map[current] || 'index.html';
  var qs = location.search || '?tenant=titan';
  if (qs.indexOf('tenant=') === -1) qs += (qs ? '&' : '?') + 'tenant=titan';
  location.replace(target + qs + location.hash);
})();
