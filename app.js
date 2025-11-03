
const campoDigitar = document.querySelector('.search-input');
const minhaLista = document.getElementById('tasksList');
const mensagemVazia = document.querySelector('.empty-state');


function addTask(){
    const textoDigitado = campoDigitar.value.trim();
    if(textoDigitado === ''){
        alert('You need to write something');
        return;
    }

    const novoItem = document.createElement('button');

    novoItem.innerHTML = `
        <button id="taskText">${textoDigitado}</button>
        <button onclick = 'removerTarefa(this)'> <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m376-300 104-104 104 104 56-56-104-104 104-104-56-56-104 104-104-104-56 56 104 104-104 104 56 56Zm-96 180q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520Zm-400 0v520-520Z"/></svg> </button>
    `

    novoItem.className = 'tarefa-item'; //adicionar estilo no CSS

    minhaLista.appendChild(novoItem);
    minhaLista.style.display = 'flex'

    mensagemVazia.style.display = 'none'

    campoDigitar.value = ''

    campoDigitar.focus();
}

function removerTarefa(botao){
    botao.parentElement.remove();

    if(minhaLista.children.length === 0){
        mensagemVazia.style.display = 'flex';
        minhaLista.style.display = 'none';
    }
}

campoDigitar.addEventListener('keypress', function(evento){
    if(evento.key === 'Enter') {
        addTask();
    }
})




document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ JavaScript funcionando!');
});
