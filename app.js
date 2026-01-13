// ============================
// app.js (PÁGINA DE HÁBITOS)
// Depende do storage.js expor:
// - loadTasks()
// - saveTasks(tarefas)
// - shouldShowToday(tarefa)
// ============================

// ============================
// SELETORES / ELEMENTOS DOM
// ============================
const campoDigitar   = document.querySelector('.search-input');
const minhaLista     = document.getElementById('tasksList');
const mensagemVazia  = document.querySelector('.empty-state');

const emptyNotificacao = document.getElementById('emptyNotificacao');
const btnOk            = document.getElementById('btnOk');
const deletePop        = document.getElementById('deletePop');
const modalHabit       = document.getElementById('modalHabit');

const toast        = document.getElementById('confirmToast');
const btnConfirmar = document.getElementById('btnConfirmar');
const btnCancelar  = document.getElementById('btnCancelar');
const overlay      = document.getElementById('overlay');

const btnReorder   = document.getElementById('reorder');
const labelReorder = document.querySelector('.reorder-label');
const icon         = btnReorder?.querySelector?.('.reorder-icon');

const DOT = { alta: "🔴", media: "🟡", baixa: "🟢" };

// ============================
// ESTADO GLOBAL
// ============================
let reordenando       = false;
let tarefas           = [];   // Array com TODAS as tarefas
let tarefaEditando    = null; // Tarefa sendo editada no modal
let tarefaParaRemover = null; // Tarefa pendente no toast de confirmação

if (toast) toast.style.display = 'none';
if (emptyNotificacao) emptyNotificacao.style.display = 'none';

// ============================
// UTIL: garante que storage.js está carregado
// ============================
function assertStorageReady() {
  const ok = typeof loadTasks === 'function'
          && typeof saveTasks === 'function'
          && typeof shouldShowToday === 'function';

  if (!ok) {
    console.error('❌ storage.js não foi carregado (ou não expôs loadTasks/saveTasks/shouldShowToday).');
  }
  return ok;
}

// ============================
// UI: cria o <li> da tarefa
// ============================
function criarElementoTarefa(tarefa) {
  const li = document.createElement('li');
  li.dataset.id = tarefa.id;
  li.className  = 'tarefa-item';

  li.innerHTML = `
    <button class="textTyped hover" onclick="abrirModalHabit(${tarefa.id})">
      ${tarefa.nome}
      ${DOT[tarefa.prioridade] ?? ""}
    </button>
    <button onclick='removerTarefa(this)'>
      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3" id="svgTask">
        <path d="m376-300 104-104 104 104 56-56-104-104 104-104-56-56-104 104-104-104-56 56 104 104-104 104 56 56Zm-96 180q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520Zm-400 0v520-520Z"/>
      </svg>
    </button>
  `;

  const botaoTexto = li.querySelector('.textTyped');
  if (tarefa.concluida) {
    botaoTexto.style.textDecoration = 'line-through';
    botaoTexto.style.opacity        = '0.6';
  }

  return li;
}

// ============================
// UI: renderiza hábitos do dia
// ============================
function renderizarHabitosDoDia() {
  if (!minhaLista || !mensagemVazia) return;

  minhaLista.innerHTML = '';

  const habitosDoDia = tarefas
    .filter(shouldShowToday) // veio do storage.js
    .slice()
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

  if (habitosDoDia.length === 0) {
    minhaLista.style.display     = 'none';
    mensagemVazia.style.display  = 'flex';
    return;
  }

  habitosDoDia.forEach(tarefa => {
    minhaLista.appendChild(criarElementoTarefa(tarefa));
  });

  // mantém como você estava usando
  minhaLista.style.display    = 'flex';
  mensagemVazia.style.display = 'none';
}

// ============================
// CRUD DE TAREFAS
// ============================
function proximaOrdem() {
  if (!tarefas.length) return 0;
  const max = Math.max(...tarefas.map(t => Number(t.ordem ?? 0)));
  return max + 1;
}

function addTask() {
  const textoDigitado = campoDigitar.value.trim();

  if (textoDigitado === '') {
    if (emptyNotificacao) emptyNotificacao.style.display = 'flex';
    if (overlay) overlay.style.display = 'block';
    return;
  }

  const novaTarefa = {
    id: Date.now(),
    nome: textoDigitado,
    categoria: 'pessoal',
    dias: [],
    prioridade: 'media',
    concluida: false,
    notas: '',
    ordem: proximaOrdem()
  };

  tarefas.push(novaTarefa);
  saveTasks(tarefas);       // veio do storage.js
  upsertDisciplinePoint(tarefas);
  renderizarHabitosDoDia();

  campoDigitar.value = '';
  campoDigitar.focus();
}

function abrirModalHabit(id) {
  tarefaEditando = tarefas.find(t => t.id === id);
  if (!tarefaEditando) return;

  document.getElementById('habitName').value     = tarefaEditando.nome;
  document.getElementById('habitCategory').value = tarefaEditando.categoria;
  document.getElementById('habitNotes').value    = tarefaEditando.notas || '';
  document.getElementById('habitDone').checked   = tarefaEditando.concluida;

  document.getElementById('statusText').textContent =
    tarefaEditando.concluida ? 'Concluído' : 'Não concluído';

  // dias da semana
  document.querySelectorAll('.dias-semana input').forEach(checkbox => {
    checkbox.checked = tarefaEditando.dias?.includes(checkbox.value) || false;
  });

  // prioridade
  document.querySelectorAll('.priority-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.priority === tarefaEditando.prioridade) {
      btn.classList.add('active');
    }
  });

  if (modalHabit) modalHabit.style.display = 'block';
}

function fecharModalHabit() {
  if (modalHabit) modalHabit.style.display = 'none';
  tarefaEditando = null;
}

function salvarHabito() {
  if (!tarefaEditando) return;

  tarefaEditando.nome      = document.getElementById('habitName').value;
  tarefaEditando.categoria = document.getElementById('habitCategory').value;
  tarefaEditando.notas     = document.getElementById('habitNotes').value;
  tarefaEditando.concluida = document.getElementById('habitDone').checked;

  const diasMarcados = [];
  document.querySelectorAll('.dias-semana input:checked').forEach(checkbox => {
    diasMarcados.push(checkbox.value);
  });
  tarefaEditando.dias = diasMarcados;

  saveTasks(tarefas);
  upsertDisciplinePoint(tarefas);
  renderizarHabitosDoDia();
  fecharModalHabit();
}

// usado só no confirm() antigo, mas deixei
function deletarHabito() {
  if (!tarefaEditando) return;

  if (confirm('Tem certeza que deseja deletar este hábito?')) {
    tarefas = tarefas.filter(t => t.id !== tarefaEditando.id);
    saveTasks(tarefas);
    renderizarHabitosDoDia();
    fecharModalHabit();
  }
}

// ============================
// REORDENAÇÃO: salva ordem do DOM no array
// ============================
function salvarOrdemPeloDOM() {
  // ids na ordem atual (do DOM)
  const idsOrdenados = [...minhaLista.querySelectorAll('.tarefa-item')]
    .map(li => Number(li.dataset.id));

  // tarefas visíveis hoje (antes da mudança), ordenadas por ordem antiga
  const visiveisAntigas = tarefas
    .filter(shouldShowToday)
    .slice()
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

  // slots de ordem já ocupados por essas visíveis
  const slots = visiveisAntigas.map(t => t.ordem).sort((a, b) => a - b);

  // aplica novos slots seguindo a nova ordem do DOM
  idsOrdenados.forEach((id, i) => {
    const t = tarefas.find(x => x.id === id);
    if (t) t.ordem = slots[i] ?? i;
  });

  saveTasks(tarefas);
}

// ============================
// DRAG & DROP
// ============================
function handleDragOver(e) {
  e.preventDefault();
  const sortableList = minhaLista;
  const draggingItem = sortableList.querySelector('.dragging');
  if (!draggingItem) return;

  const siblings = [...sortableList.querySelectorAll('.tarefa-item:not(.dragging)')];

  const nextSibling = siblings.find(sibling => {
    return e.clientY <= sibling.offsetTop + sibling.offsetHeight / 4;
  });

  sortableList.insertBefore(draggingItem, nextSibling || null);
}

if (btnReorder) {
  btnReorder.addEventListener('click', () => {
    reordenando = !reordenando;
    if (labelReorder) labelReorder.textContent = reordenando ? 'Concluir' : 'Reordenar';

    const items = document.querySelectorAll('.tarefa-item');

    if (reordenando) {
      items.forEach(item => {
        item.draggable = true;

        // evita duplicar listeners
        if (!item.dataset.dndBound) {
          item.addEventListener('dragstart', () => item.classList.add('dragging'));
          item.addEventListener('dragend', () => item.classList.remove('dragging'));
          item.dataset.dndBound = '1';
        }
      });

      minhaLista.addEventListener('dragover', handleDragOver);
      minhaLista.addEventListener('dragenter', e => e.preventDefault());

    } else {
      items.forEach(item => {
        item.draggable = false;
        item.classList.remove('dragging');
      });

      minhaLista.removeEventListener('dragover', handleDragOver);

      salvarOrdemPeloDOM();
      renderizarHabitosDoDia();
    }

    // seu comportamento visual original
    if (labelReorder && labelReorder.textContent === 'Concluir') {
      btnReorder.classList.add('btn-ativo');
      document.querySelectorAll('.textTyped').forEach(item => item.classList.remove('hover'));
    } else {
      btnReorder.classList.remove('btn-ativo');
      document.querySelectorAll('.textTyped').forEach(item => item.classList.add('hover'));
    }
  });
}

// ============================
// TOAST / CONFIRMAÇÃO / OVERLAY
// ============================
if (btnOk) {
  btnOk.addEventListener('click', () => {
    if (emptyNotificacao) emptyNotificacao.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
  });
}

function removerTarefa(botao) {
  tarefaParaRemover = botao.parentElement; // <li>
  if (overlay) overlay.style.display = 'block';
  if (toast) toast.style.display = 'flex';
}

if (deletePop) {
  deletePop.addEventListener('click', () => {
    const id = tarefaEditando?.id;
    if (!id) return;

    tarefaParaRemover = document.querySelector(`[data-id="${id}"]`);
    if (modalHabit) modalHabit.style.display = 'none';
    if (overlay) overlay.style.display = 'block';
    if (toast) toast.style.display = 'flex';
  });
}

if (btnConfirmar) {
  btnConfirmar.addEventListener('click', () => {
    if (!tarefaParaRemover) return;

    const id = Number(tarefaParaRemover.dataset.id);

    tarefas = tarefas.filter(t => t.id !== id);
    saveTasks(tarefas);
    upsertDisciplinePoint(tarefas);

    tarefaParaRemover = null;
    if (overlay) overlay.style.display = 'none';
    if (toast) toast.style.display = 'none';

    renderizarHabitosDoDia();
  });
}

if (btnCancelar) {
  btnCancelar.addEventListener('click', () => {
    tarefaParaRemover = null;
    if (overlay) overlay.style.display = 'none';
    if (toast) toast.style.display = 'none';
  });
}

if (overlay) {
  overlay.addEventListener('click', () => {
    if (btnCancelar) btnCancelar.click();
  });
}

// teclado no toast
document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Enter' && toast && toast.style.display === 'flex') {
    if (btnConfirmar) btnConfirmar.click();
  }
  if (evento.key === 'Escape') {
    if (btnCancelar) btnCancelar.click();
  }
});

// ============================
// INPUT PRINCIPAL (ENTER)
// ============================
if (campoDigitar) {
  campoDigitar.addEventListener('keypress', (evento) => {
    if (evento.key === 'Enter') addTask();
  });
}

// ============================
// CUSTOM SELECT (se você usar depois)
// ============================
document.querySelectorAll(".custom-select .options li").forEach(option => {
  option.addEventListener("click", function() {
    const value = this.getAttribute("data-value");
    const text  = this.textContent;

    this.closest(".custom-select").querySelector(".selected").textContent = text;
    this.closest(".custom-select").classList.remove("open");
    document.getElementById("habitCategory").value = value;
  });
});

// ============================
// DOMCONTENTLOADED
// ============================
document.addEventListener('DOMContentLoaded', () => {
  if (!assertStorageReady()) return;

  // Botões de prioridade (no modal)
  document.querySelectorAll('.priority-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      if (tarefaEditando) {
        tarefaEditando.prioridade = this.dataset.priority;
        saveTasks(tarefas);
        renderizarHabitosDoDia(); // atualiza o DOT na lista imediatamente
      }
    });
  });

  // Switch de status
  document.getElementById('habitDone')?.addEventListener('change', function() {
    document.getElementById('statusText').textContent =
      this.checked ? 'Concluído' : 'Não concluído';
  });

  // Carrega tarefas do storage.js
  tarefas = loadTasks();

  // Destrava visual (se algo no CSS/JS deixou escondido)
  if (minhaLista) minhaLista.style.display = '';
  if (mensagemVazia) mensagemVazia.style.display = '';

  renderizarHabitosDoDia();

  console.log('Se você leu tu é gente boa 😊');
  console.log('nao roda esse Doom ai n kkkk');
});