// dashboard.js
// Depende do storage.js expor:
// - loadDisciplineSeries()
// - todayKey()

let chart = null;
let currentRange = '7';

function assertStorageReady() {
  const ok = typeof loadDisciplineSeries === 'function'
          && typeof todayKey === 'function';

  if (!ok) {
    console.error('❌ storage.js não carregou ou não expôs loadDisciplineSeries/todayKey.');
  }
  return ok;
}

function formatLabel(dateStr) {
  // YYYY-MM-DD -> DD/MM
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

function sliceByRange(serie, range) {
  if (range === 'all') return serie;

  const n = Number(range);
  if (!Number.isFinite(n) || n <= 0) return serie;

  return serie.slice(Math.max(0, serie.length - n));
}

function calcAvg(points) {
  if (!points.length) return 0;
  const sum = points.reduce((acc, p) => acc + (Number(p.value) || 0), 0);
  return Math.round(sum / points.length);
}

function getTodayValue(serie) {
  const hoje = todayKey();
  const p = serie.find(x => x.date === hoje);
  return p ? p.value : null;
}

function renderStats(points, fullSerie) {
  const todayEl = document.getElementById('todayValue');
  const avgEl   = document.getElementById('avgValue');
  const cntEl   = document.getElementById('countValue');

  const todayVal = getTodayValue(fullSerie);
  todayEl.textContent = (todayVal == null) ? '—' : `${todayVal}%`;

  avgEl.textContent = points.length ? `${calcAvg(points)}%` : '—';
  cntEl.textContent = points.length ? String(points.length) : '0';
}

function renderChart(points) {
  const ctx = document.getElementById('disciplinaChart');
  if (!ctx) return;

  const labels = points.map(p => formatLabel(p.date));
  const values = points.map(p => Number(p.value) || 0);
  const single = values.length < 2;
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Disciplina (%)',
        data: values,
        tension: 0.35,     // suaviza como “stock”
        pointRadius: single ? 5 : 0,       // ✅ aparece se só tiver 1 ponto
        pointHoverRadius: single ? 7 : 4,  // ✅ hover melhor
        borderWidth: 3,            // linha um pouco mais forte
        fill: false
      }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,   // ESSENCIAL pra usar a altura do container
        devicePixelRatio: window.devicePixelRatio || 1,
        plugins: {
            legend: { display: false },
            tooltip: { mode: 'index', intersect: false }
        },
        interaction: { mode: 'index', intersect: false },
        scales: {
            y: { min: 0, max: 100, ticks: { callback: v => v + '%' } },
            x: { ticks: { maxTicksLimit: 10 } }
        }
    }
  });
}

function refresh() {
  const fullSerie = loadDisciplineSeries()
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  const points = sliceByRange(fullSerie, currentRange);

  renderStats(points, fullSerie);
  renderChart(points);
}

function bindControls() {
  document.querySelectorAll('.btn[data-range]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn[data-range]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentRange = btn.dataset.range;
      refresh();
    });
  });

  document.getElementById('btnRefresh')?.addEventListener('click', refresh);
}

document.addEventListener('DOMContentLoaded', () => {
  if (!assertStorageReady()) return;
  bindControls();
  refresh();
});
