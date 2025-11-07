
const campoDigitar = document.querySelector('.search-input');
const minhaLista = document.getElementById('tasksList');
const mensagemVazia = document.querySelector('.empty-state');

let tarefaParaRemover = null;

const toast = document.getElementById('confirmToast');
const btnConfirmar = document.getElementById('btnConfirmar');
const btnCancelar = document.getElementById('btnCancelar');
const overlay = document.getElementById('overlay');

toast.style.display = 'none'

function addTask(){
    const textoDigitado = campoDigitar.value.trim();
    if(textoDigitado === ''){
        alert('You need to write something'); // TODO: PRECISO CRIAR UM ALERT MAIS BONITO!!
        return;
    }

    const novoItem = document.createElement('li');

    novoItem.innerHTML = `
        <button id="taskText">${textoDigitado}</button>
        <button onclick = 'removerTarefa(this)'> <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3" id = "svgTask"><path d="m376-300 104-104 104 104 56-56-104-104 104-104-56-56-104 104-104-104-56 56 104 104-104 104 56 56Zm-96 180q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520Zm-400 0v520-520Z"/></svg> </button>
    `

    novoItem.className = 'tarefa-item'; //adicionar estilo no CSS

    minhaLista.appendChild(novoItem);
    minhaLista.style.display = 'flex'

    mensagemVazia.style.display = 'none'

    campoDigitar.value = ''

    campoDigitar.focus();
}

function removerTarefa(botao){
    tarefaParaRemover = botao.parentElement;

    overlay.style.display = 'block';
    toast.style.display = 'flex';
}

btnConfirmar.addEventListener('click', function(){
    if(!tarefaParaRemover) return;

    tarefaParaRemover.remove();
    tarefaParaRemover = null;

    overlay.style.display = 'none';
    toast.style.display = 'none';
    
    if(minhaLista.children.length === 0){
        mensagemVazia.style.display = 'flex';
        minhaLista.style.display = 'none';
        
    }
    
});
document.addEventListener('keydown', function(evento){
    if(evento.key === 'Enter' && toast.style.display ==='flex'){
        btnConfirmar.click();
    }
    if(evento.key === 'Escape'){
        btnCancelar.click();
    }
})

btnCancelar.addEventListener('click', function(){
    tarefaParaRemover = null;

    overlay.style.display = 'none';
    toast.style.display = 'none';
    
})

overlay.addEventListener('click', function() {
    btnCancelar.click();
});


campoDigitar.addEventListener('keypress', function(evento){
    if(evento.key === 'Enter') {
        addTask();
    }
})




document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ JavaScript funcionando!');
});
