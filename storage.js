// storage.js
// Camada de dados + regras compartilhadas (sem DOM).
// Este arquivo precisa ser carregado ANTES do app.js e do dashboard.js.
//
// Disponibiliza globalmente:
// - loadTasks()
// - saveTasks(tarefas)
// - shouldShowToday(tarefa)
//
// (Bônus para o dashboard depois):
// - todayKey()
// - disciplineToday(tarefas)
// - loadDisciplineSeries()
// - saveDisciplineSeries(serie)
// - upsertDisciplinePoint(tarefas)

const STORAGE_KEYS = {
  tarefas: 'minhasTarefas',
  serieDisciplina: 'serieDisciplina',
  ultimaData: 'ultimaDataApp'
};

// ----------------------------
// Tarefas: load/save
// ----------------------------
function saveTasks(tarefas) {
  localStorage.setItem(STORAGE_KEYS.tarefas, JSON.stringify(tarefas));
}

function loadTasks() {
  const raw = localStorage.getItem(STORAGE_KEYS.tarefas);
  const tarefas = raw ? JSON.parse(raw) : [];

  // Migração/garantia de campos mínimos
  tarefas.forEach((t, i) => {
    if (!('id' in t)) t.id = Date.now() + i;
    if (!('nome' in t)) t.nome = '';
    if (!('categoria' in t)) t.categoria = 'pessoal';
    if (!('dias' in t)) t.dias = [];
    if (!('prioridade' in t)) t.prioridade = 'media';
    if (!('concluida' in t)) t.concluida = false;
    if (!('notas' in t)) t.notas = '';
    if (!('ordem' in t) || t.ordem == null) t.ordem = i;
  });

  // Normaliza ordem para evitar buracos/duplicatas antigas
  tarefas
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
    .forEach((t, i) => t.ordem = i);

  // Persistir ajustes de migração
  saveTasks(tarefas);

  return tarefas;
}

// ----------------------------
// Regras: aparece hoje?
// ----------------------------
function diaAtualCodigo() {
  const hoje = new Date().getDay(); // 0=Dom ... 6=Sab
  const mapa = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  return mapa[hoje];
}

// Aparece hoje?
// - se não tiver dias marcados => aparece todo dia
// - se tiver dias => aparece quando inclui o dia atual
function shouldShowToday(tarefa) {
  if (!tarefa.dias || tarefa.dias.length === 0) return true;
  return tarefa.dias.includes(diaAtualCodigo());
}

// ----------------------------
// Disciplina: série por dia (para dashboard)
// ----------------------------
function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Modelo simples: se virou o dia, zera "concluida" para começar o dia limpo.
// Use isso se você quiser disciplina diária sem histórico por tarefa.
function resetDoneIfNewDay(tarefas) {
  const hoje = todayKey();
  const ultima = localStorage.getItem(STORAGE_KEYS.ultimaData);

  if (ultima !== hoje) {
    tarefas.forEach(t => t.concluida = false);
    localStorage.setItem(STORAGE_KEYS.ultimaData, hoje);
    saveTasks(tarefas);
  }

  return tarefas;
}

// Disciplina hoje: feitos / esperados (0..100)
// Só conta tarefas que "aparecem hoje" (shouldShowToday).
function disciplineToday(tarefas) {
  const doDia = tarefas.filter(shouldShowToday);
  const esperado = doDia.length;
  const feito = doDia.filter(t => t.concluida).length;
  return esperado === 0 ? 0 : Math.round((feito / esperado) * 100);
}

function loadDisciplineSeries() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.serieDisciplina) || '[]');
}

function saveDisciplineSeries(serie) {
  localStorage.setItem(STORAGE_KEYS.serieDisciplina, JSON.stringify(serie));
}

// Insere/atualiza o ponto do dia atual na série e devolve a série ordenada.
function upsertDisciplinePoint(tarefas) {
  const hoje = todayKey();
  const valor = disciplineToday(tarefas);

  const serie = loadDisciplineSeries();
  const idx = serie.findIndex(p => p.date === hoje);

  if (idx >= 0) serie[idx].value = valor;
  else serie.push({ date: hoje, value: valor });

  serie.sort((a, b) => a.date.localeCompare(b.date));

  saveDisciplineSeries(serie);
  return serie;
}

// Exponho também o reset caso você use depois (opcional)
window.resetDoneIfNewDay = resetDoneIfNewDay;
window.disciplineToday = disciplineToday;
window.loadDisciplineSeries = loadDisciplineSeries;
window.saveDisciplineSeries = saveDisciplineSeries;
window.upsertDisciplinePoint = upsertDisciplinePoint;

// Funções que o app.js espera
window.loadTasks = loadTasks;
window.saveTasks = saveTasks;
window.shouldShowToday = shouldShowToday;
window.todayKey = todayKey;
