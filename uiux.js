// ===== TITAN V17 UI/UX POLISH PACK =====
(function(){
  'use strict';
  const THEME_KEY = 'titan_ui_theme';
  const root = document.documentElement;
  const body = () => document.body;
  function currentTheme(){
    const saved = localStorage.getItem(THEME_KEY);
    if(saved === 'dark' || saved === 'light') return saved;
    const existing = (body() && body().getAttribute('data-theme')) || root.getAttribute('data-theme');
    if(existing === 'dark' || existing === 'light') return existing;
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }
  function setTheme(theme){
    const value = theme === 'dark' ? 'dark' : 'light';
    root.setAttribute('data-theme', value);
    if(body()) body().setAttribute('data-theme', value);
    localStorage.setItem(THEME_KEY, value);
    document.querySelectorAll('[onclick="toggleTheme()"] i, #theme-btn i, .uiux-theme-fab i').forEach(icon => {
      icon.className = value === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    });
    window.dispatchEvent(new CustomEvent('titan:themechange', {detail:{theme:value}}));
  }
  window.toggleTheme = function(){ setTheme(currentTheme() === 'dark' ? 'light' : 'dark'); };
  function addThemeFab(){
    if(document.querySelector('.uiux-theme-fab')) return;
    if(document.querySelector('[onclick="toggleTheme()"]')) return;
    const btn = document.createElement('button');
    btn.className = 'uiux-theme-fab';
    btn.type = 'button';
    btn.setAttribute('aria-label','تبديل الوضع الليلي');
    btn.innerHTML = '<i class="fas fa-moon"></i>';
    btn.addEventListener('click', window.toggleTheme);
    document.body.appendChild(btn);
  }
  function enhanceTables(){
    document.querySelectorAll('table').forEach(table => {
      if(table.parentElement && table.parentElement.classList.contains('uiux-table-wrap')) return;
      const wrap = document.createElement('div');
      wrap.className = 'uiux-table-wrap';
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }
  function revealCards(){
    const targets = document.querySelectorAll('.card,.panel,.stat-card,.lesson-card,.feature,.v16-card,.v15-card,.v14-card,.v13-card,.v10-card');
    if(!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('uiux-visible'); io.unobserve(e.target); } });
    }, {threshold:.08});
    targets.forEach(el => { el.classList.add('uiux-reveal'); io.observe(el); });
  }
  function setupButtonPress(){
    document.addEventListener('pointerdown', e => {
      const btn = e.target.closest('.btn,.icon-btn,.student-menu-btn,.nav-link,.btn-outline');
      if(!btn) return;
      btn.style.transform = 'scale(.985)';
      setTimeout(()=>{ btn.style.transform = ''; }, 120);
    }, {passive:true});
  }
  function num(v){ return Number(v || 0) || 0; }
  function getAdminData(){
    const students = Array.isArray(window.db_students) ? window.db_students : [];
    const content = Array.isArray(window.db_content) ? window.db_content : [];
    const invoices = Array.isArray(window.db_invoices) ? window.db_invoices : [];
    const grades = Array.isArray(window.db_grades) ? window.db_grades : [];
    const assignments = Array.isArray(window.db_assignments) ? window.db_assignments : [];
    return {students, content, invoices, grades, assignments};
  }
  function chartTextColor(){
    return currentTheme() === 'dark' ? '#e5e7eb' : '#334155';
  }
  let charts = {};
  function canvasIsVisible(el){
    if(!el) return false;
    const app = document.getElementById('app');
    if(app && getComputedStyle(app).display === 'none') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height >= 0;
  }
  function destroyChart(id){
    const el = document.getElementById(id);
    if(charts[id]){ try{ charts[id].destroy(); }catch(e){} charts[id] = null; }
    if(el && window.Chart && typeof Chart.getChart === 'function'){
      const existing = Chart.getChart(el);
      if(existing){ try{ existing.destroy(); }catch(e){} }
    }
    if(id === 'mainChart') window.mainChart = null;
  }
  function makeChart(id, config){
    const el = document.getElementById(id);
    if(!el || !window.Chart || !canvasIsVisible(el)) return null;
    destroyChart(id);
    try {
      charts[id] = new Chart(el.getContext('2d'), config);
      if(id === 'mainChart') window.mainChart = charts[id];
      return charts[id];
    } catch(err) {
      console.warn('Titan UIUX chart render failed:', id, err);
      return null;
    }
  }
  function chartOptions(extra){
    const base = {
      responsive:true,
      maintainAspectRatio:false,
      resizeDelay:120,
      plugins:{legend:{labels:{color:chartTextColor(), font:{family:'Cairo'}}}},
      scales:{
        x:{ticks:{color:chartTextColor(), font:{family:'Cairo'}}, grid:{color:'rgba(148,163,184,.16)'}},
        y:{ticks:{color:chartTextColor(), font:{family:'Cairo'}}, grid:{color:'rgba(148,163,184,.16)'}, beginAtZero:true}
      }
    };
    return Object.assign(base, extra || {});
  }
  function moneyValue(obj){
    return num(obj.paid) || num(obj.paidAmount) || num(obj.received) || 0;
  }
  function remainingValue(obj){
    if(obj.remaining !== undefined) return num(obj.remaining);
    if(obj.debt !== undefined) return num(obj.debt);
    const total = num(obj.amt || obj.amount || obj.total || obj.price);
    const paid = moneyValue(obj);
    return Math.max(0, total - paid);
  }
  function renderAdminCharts(){
    const mainCanvas = document.getElementById('mainChart');
    if(!window.Chart || !mainCanvas || !canvasIsVisible(mainCanvas)) return;
    const d = getAdminData();
    const paid = d.invoices.reduce((a,i)=>a+moneyValue(i),0);
    const remaining = d.invoices.reduce((a,i)=>a+remainingValue(i),0);
    const total = d.invoices.reduce((a,i)=>a+num(i.amt || i.amount || i.total || i.price),0) || (paid + remaining);
    const levelCounts = {};
    d.students.forEach(s => { const k = 'مستوى ' + (s.level || '-'); levelCounts[k] = (levelCounts[k] || 0) + 1; });
    const contentLevels = {};
    d.content.forEach(c => { const k = 'مستوى ' + (c.level || '-'); contentLevels[k] = (contentLevels[k] || 0) + 1; });
    makeChart('mainChart', {
      type:'line',
      data:{
        labels:['إجمالي الفواتير','المحصل','المتبقي'],
        datasets:[{
          label:'التحليل المالي',
          data:[total, paid, remaining],
          tension:.38,
          fill:true,
          borderWidth:3,
          pointRadius:5,
          pointHoverRadius:7
        }]
      },
      options:chartOptions({plugins:{legend:{display:false}}})
    });
    makeChart('uiuxLevelChart', {
      type:'doughnut',
      data:{labels:Object.keys(levelCounts).length?Object.keys(levelCounts):['لا يوجد'], datasets:[{label:'الطلاب', data:Object.values(levelCounts).length?Object.values(levelCounts):[1]}]},
      options:chartOptions({cutout:'62%', scales:{}, plugins:{legend:{position:'bottom',labels:{color:chartTextColor(),font:{family:'Cairo'}}}}})
    });
    makeChart('uiuxFinanceChart', {
      type:'bar',
      data:{labels:['محصل','متبقي'], datasets:[{label:'جنيه', data:[paid, remaining], borderRadius:12}]},
      options:chartOptions({plugins:{legend:{display:false}}})
    });
    makeChart('uiuxContentChart', {
      type:'bar',
      data:{labels:Object.keys(contentLevels).length?Object.keys(contentLevels):['لا يوجد'], datasets:[{label:'الدروس', data:Object.values(contentLevels).length?Object.values(contentLevels):[0], borderRadius:12}]},
      options:chartOptions({plugins:{legend:{display:false}}})
    });
    const badge = document.getElementById('uiuxChartBadge');
    if(badge) badge.textContent = 'آخر تحديث: ' + new Date().toLocaleTimeString('ar-EG');
  }
  function enhanceParentProgress(){
    const app = document.getElementById('app');
    if(!app || document.getElementById('uiux-parent-progress')) return;
    const grid = app.querySelector('.grid');
    if(!grid) return;
    const card = document.createElement('div');
    card.className = 'card uiux-progress-card';
    card.id = 'uiux-parent-progress';
    card.innerHTML = '<div class="uiux-ring-progress" id="uiux-parent-ring" style="--pct:0"><span>0%</span></div><div><h3>مؤشر التقدم العام</h3><p style="color:var(--text-dim);line-height:1.8">يتحدث تلقائياً حسب متوسط تقدم الطالب في الدروس.</p></div>';
    grid.parentNode.insertBefore(card, grid.nextSibling);
  }
  function updateParentProgress(){
    const avg = document.getElementById('avg-progress');
    const ring = document.getElementById('uiux-parent-ring');
    if(!avg || !ring) return;
    const pct = Math.max(0, Math.min(100, parseInt(String(avg.textContent).replace(/[^0-9]/g,''),10) || 0));
    ring.style.setProperty('--pct', pct);
    const span = ring.querySelector('span');
    if(span) span.textContent = pct + '%';
  }
  function initStudentProgressCard(){
    const stats = document.getElementById('stats-sec');
    if(!stats || document.getElementById('uiux-student-progress')) return;
    const title = stats.querySelector('h3');
    const box = document.createElement('div');
    box.id = 'uiux-student-progress';
    box.className = 'panel uiux-progress-card';
    box.style.marginBottom = '18px';
    box.innerHTML = '<div class="uiux-ring-progress" id="uiux-student-ring" style="--pct:0"><span>0%</span></div><div><h3 style="color:var(--primary);margin-bottom:8px"><i class="fas fa-chart-pie"></i> مؤشر الأداء</h3><p style="color:var(--text-dim);line-height:1.8">متوسط الواجبات والأداء والسلوك، مع شكل بصري أسرع للموبايل.</p></div>';
    if(title) title.insertAdjacentElement('afterend', box);
  }
  function updateStudentProgress(){
    const ids = ['score-work','score-perf','score-beh'];
    const vals = ids.map(id => parseInt(String((document.getElementById(id)||{}).textContent||'').replace(/[^0-9]/g,''),10)).filter(n=>!isNaN(n));
    const pct = vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : 0;
    const ring = document.getElementById('uiux-student-ring');
    if(!ring) return;
    ring.style.setProperty('--pct', Math.max(0,Math.min(100,pct)));
    const span = ring.querySelector('span');
    if(span) span.textContent = pct + '%';
  }
  function boot(){
    setTheme(currentTheme());
    addThemeFab();
    enhanceTables();
    revealCards();
    setupButtonPress();
    initStudentProgressCard();
    enhanceParentProgress();
    updateStudentProgress();
    updateParentProgress();
    const originalUpdateStats = window.updateStats;
    if(typeof window.initChart === 'function'){
      window.initChart = renderAdminCharts;
    }
    if(typeof originalUpdateStats === 'function' && !window.__titanUiuxStatsWrapped){
      window.updateStats = function(){
        const result = originalUpdateStats.apply(this, arguments);
        setTimeout(renderAdminCharts, 80);
        return result;
      };
      window.__titanUiuxStatsWrapped = true;
    }
    setTimeout(renderAdminCharts, 80);
    let ticks = 0;
    const t = setInterval(()=>{
      ticks += 1;
      enhanceTables();
      renderAdminCharts();
      updateStudentProgress();
      enhanceParentProgress();
      updateParentProgress();
      if(ticks > 20) clearInterval(t);
    }, 1500);
  }
  window.addEventListener('titan:themechange', ()=>setTimeout(renderAdminCharts, 80));
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
