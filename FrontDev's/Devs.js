
import { API_BASE_URL } from "../config/apiConfig.js";
import {saveToLocalStorage} from "../config/storage.js";


const chk = document.getElementById('dark_mode')
const logoutButton = document.getElementById('logout-button');
const loadBoardsButton = document.getElementById("load-boards-button");
const boardsList = document.getElementById("boards-list");
const saveColumnButton = document.getElementById("save-column-button");
const addColumnModal = document.getElementById("add-column-modal");
let isBoardsVisible = false; // Estado para controlar a visibilidade da lista



//----------------------------------------------------------------------------------------------------------------------------


//FUNCAO DE CARREGAMENTOS DE COLUNAS, TAREFAS E BOARDS


// Evento para carregar e alternar visibilidade dos boards
loadBoardsButton.addEventListener("click", async () => {
    if (isBoardsVisible) {
        // Se a lista estiver visível, ocultá-la
        boardsList.style.display = "none";
        isBoardsVisible = false;
        return;
    }

    // Caso contrário, carregar boards e mostrar a lista
    try {
        const response = await fetch(`${API_BASE_URL}/Boards`);
        if (!response.ok) {
            throw new Error("Erro ao carregar boards.");
        }

        const boards = await response.json();
        appendBoardsToList(boards); // Adiciona novos boards
        boardsList.style.display = "block"; // Exibe a lista
        isBoardsVisible = true;
    } catch (error) {
        console.error("Erro ao carregar boards:", error);
        boardsList.innerHTML += `<li>Erro ao carregar boards. Tente novamente mais tarde.</li>`;
        boardsList.style.display = "block";
        isBoardsVisible = true;
    }
});

// Função para adicionar os boards à lista com os atributos corretos
function appendBoardsToList(boards) {
    if (boards.length === 0) {
        boardsList.innerHTML += `<li>Nenhum board encontrado.</li>`;
        return;
    }

    boards.forEach(board => {
        const listItem = document.createElement("li");
        listItem.textContent = board.Name; // Substitua "Name" pelo campo correto da API
        listItem.setAttribute("data-board-id", board.Id); // Atribui o ID ao elemento
        listItem.style.cursor = "pointer"; // Indica que é clicável
        boardsList.appendChild(listItem);
    });
}

// Evento para carregar colunas e tarefas ao clicar em um board
document.getElementById("boards-list").addEventListener("click", async (event) => {
    const clickedBoard = event.target;
    if (clickedBoard.tagName === "LI") {
        const boardId = clickedBoard.getAttribute("data-board-id");
        if (boardId) {
            const boardName = clickedBoard.textContent;
            document.getElementById("board-title").textContent = `${boardName}`;
            document.getElementById("board-title").setAttribute("data-board-id", boardId); // Atribui o data-board-id ao título
            await carregarColunasEExibir(boardId);
        }
    }
});

// Função para carregar colunas e exibir tarefas
async function carregarColunasEExibir(boardId) {
    try {
        const response = await fetch(`${API_BASE_URL}/ColumnByBoardId?BoardId=${boardId}`);
        if (!response.ok) throw new Error("Erro ao carregar colunas");

        const colunas = await response.json();
        if (colunas.length > 0) {
            exibirColunasECarregarTarefas(colunas);
        } else {
            alert("Este board não tem colunas.");
        }
    } catch (error) {
        console.error("Erro ao carregar colunas:", error);
    }
}

// Exibe colunas e inicia carregamento de tarefas
function exibirColunasECarregarTarefas(colunas) {
    const columnsContainer = document.getElementById("columns-container");
    columnsContainer.innerHTML = ""; // Limpa colunas anteriores

    colunas.forEach((coluna) => {
        const divColuna = document.createElement("div");
        divColuna.classList.add("column");
        divColuna.setAttribute("data-column-id", coluna.Id);

        const tituloColuna = document.createElement("h3");
        tituloColuna.textContent = coluna.Name;

        const tarefasContainer = document.createElement("div");
        tarefasContainer.classList.add("task-item");

        // Criando o contêiner dos botões
        const buttonContainer = document.createElement("div");
        buttonContainer.classList.add("button-container");

        // Criando o botão "Adicionar Tarefas"
        const addTaskButton = document.createElement("button");
        addTaskButton.textContent = "Adicionar Tarefas";
        addTaskButton.classList.add("add-task-button");
        addTaskButton.addEventListener("click", () => {
            openAddTaskModal(divColuna);
        });

        // Botão para excluir a tarefa
        const deleteTaskButton = document.createElement("button");
        deleteTaskButton.textContent = "X";
        deleteTaskButton.classList.add("delete-task-button");
        deleteTaskButton.addEventListener("click", () =>
            excluirTarefa(taskId, newTaskElement)
        );

        // Criando o botão de excluir
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Excluir Coluna";
        deleteButton.classList.add("delete-column-button");
        deleteButton.addEventListener("click", async (event) => {
            await excluirColuna(newColumnId, divColuna);
        });

        // Adiciona os botões no contêiner
        buttonContainer.appendChild(addTaskButton);
        buttonContainer.appendChild(deleteButton);

        // Adiciona evento de exclusão
        deleteButton.addEventListener("click", async (event) => {
            event.stopPropagation(); // Impede que o clique se propague para o elemento pai
            await excluirColuna(coluna.Id);
        });

        // Adiciona título, botão de excluir e tarefas ao DOM
        divColuna.appendChild(tituloColuna);  
        divColuna.appendChild(tarefasContainer);
        divColuna.appendChild(buttonContainer); // Adiciona o contêiner com os botões

        columnsContainer.appendChild(divColuna);

        // Carregar tarefas para esta coluna
        carregarTarefas(coluna.Id, tarefasContainer);
    });
}

// Função para carregar tarefas dentro de uma coluna
async function carregarTarefas(columnId, tarefasContainer) {
    try {
        const response = await fetch(`${API_BASE_URL}/TasksByColumnId?ColumnId=${columnId}`);
        if (!response.ok) throw new Error("Erro ao carregar tarefas");

        const tarefas = await response.json();
        tarefas.forEach((tarefa) => {
            const tarefaElement = document.createElement("div");
            tarefaElement.classList.add("task-item");

            // Adiciona o ID da tarefa no atributo data-task-id
            tarefaElement.setAttribute("data-task-id", tarefa.Id);

            // Título da tarefa
            const taskTitle = document.createElement("span");
            taskTitle.textContent = tarefa.Title || "Tarefa sem título";
            tarefaElement.appendChild(taskTitle);

            // Botão de excluir tarefa
            const deleteTaskButton = document.createElement("button");
            deleteTaskButton.textContent = "X";
            deleteTaskButton.classList.add("delete-task-button");
            deleteTaskButton.addEventListener("click", () => excluirTarefa(tarefa.Id, tarefaElement));

            // Adiciona o botão de excluir à tarefa
            tarefaElement.appendChild(deleteTaskButton);

            // Adiciona a tarefa ao container
            tarefasContainer.appendChild(tarefaElement);
        });
    } catch (error) {
        console.error("Erro ao carregar tarefas:", error);
    }
}


// Função para carregar boards
async function carregarBoards() {
    try {
        const response = await fetch(`${API_BASE_URL}/Boards`);
        if (!response.ok) throw new Error("Erro ao carregar boards");

        const boards = await response.json();
        const boardsList = document.getElementById("boards-list");
        boardsList.innerHTML = ""; // Limpa a lista de boards

        boards.forEach((board) => {
            const boardItem = document.createElement("li");
            boardItem.setAttribute("data-board-id", board.Id);
            boardItem.textContent = board.Name;
            boardsList.appendChild(boardItem);
        });
    } catch (error) {
        console.error("Erro ao carregar boards:", error);
    }
}

// Inicializa carregamento dos boards
document.getElementById("load-boards-button").addEventListener("click", carregarBoards);


//----------------------------------------------------------------------------------------------------------------------------

//DARKMODE E LIGHTMODE

// Recupera o estado do modo do local storage ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme'); 
    if (savedTheme === 'dark') {
        document.body.classList.add('dark'); 
        document.body.classList.remove('light'); 
        chk.checked = true; 
    } else {
        document.body.classList.add('light'); 
        document.body.classList.remove('dark'); 
        chk.checked = false; 
    }
});

// Escuta as mudanças do checkbox para alternar o tema
chk.addEventListener('change', () => {
    if (document.body.classList.contains('light')) {
        document.body.classList.add('dark');
        document.body.classList.remove('light');
        localStorage.setItem('theme', 'dark'); 
    } else if (document.body.classList.contains('dark')) {
        document.body.classList.add('light');
        document.body.classList.remove('dark');
        localStorage.setItem('theme', 'light'); 
    }
});

//----------------------------------------------------------------------------------------------------------------------------

//FUNCAO PARA DAR O LOGOUT DO SITE

// funcao para realizar o logout
function realizarLogout() {
    localStorage.removeItem('token');
    window.location.href = "index.html";
}

logoutButton.addEventListener('click', realizarLogout);

//----------------------------------------------------------------------------------------------------------------------------

//FUNCAO PARA O NOME AO LADO DO LOGOUT

async function showUserGreeting() {
    const userData = JSON.parse(localStorage.getItem("user")); 
    if (!userData || !userData.email) {
        document.getElementById("user-greeting").textContent = "Olá, visitante!";
        return;
    }

    const email = userData.email;
    const firstName = email.split("@")[0]; 
    const greeting = `Olá, ${capitalize(firstName)}`;
    document.getElementById("user-greeting").textContent = greeting;
}

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

document.addEventListener("DOMContentLoaded", showUserGreeting);

//------------------------------------------------------------------------------------------------------------------------------


//FUNCAO PARA EXCLUIR COLUNAS E TAREFAS


// Função para excluir tarefa
async function excluirTarefa(taskId, taskElement) {
    const confirmDelete = confirm("Tem certeza que deseja excluir esta tarefa?");
    if (!confirmDelete) return;

    try {
        const response = await fetch(`${API_BASE_URL}/Task?TaskId=${taskId}`, {
            method: "DELETE",
        });

        if (!response.ok) throw new Error("Erro ao excluir a tarefa");

        // Remove a tarefa do DOM
        taskElement.remove();
    } catch (error) {
        console.error("Erro ao excluir a tarefa:", error);
        alert("Não foi possível excluir a tarefa. Tente novamente.");
    }
}

// Função para excluir uma coluna
async function excluirColuna(columnId) {
    const confirmDelete = confirm("Tem certeza que deseja excluir esta coluna?");
    if (confirmDelete) {
        try {
            const response = await fetch(`${API_BASE_URL}/Column?ColumnId=${columnId}`, {
                method: "DELETE"
            });

            if (!response.ok) throw new Error("Erro ao excluir a coluna");

            // Remove a coluna do DOM
            const colunaElement = document.querySelector(`.column[data-column-id='${columnId}']`);
            if (colunaElement) {
                colunaElement.remove();
            }
        } catch (error) 
    {}}

}


//------------------------------------------------------------------------------------------------------------------------------


//FUNCAO PARA CRIAR COLUNAS E TAREFAS

// Abre o modal
saveColumnButton.addEventListener("click", () => {
  addColumnModal.classList.remove("hidden");
});

// Função para abrir o modal de adicionar tarefa
function openAddTaskModal(columnElement) {
    const addTaskModal = document.getElementById("add-task-modal");
    addTaskModal.classList.remove("hiddentask");

    const addTaskButton = document.getElementById("add-task-button");

    // Remove event listeners antigos
    addTaskButton.onclick = null;

    // Evento de clique no botão para adicionar a tarefa
    addTaskButton.onclick = async () => {
        const taskTitle = document.getElementById("new-task-title").value.trim();
        const columnId = columnElement.getAttribute("data-column-id");

        if (!taskTitle) {
            alert("O título da tarefa não pode estar vazio.");
            return;
        }

        try {
            // Criar a tarefa no backend
            const response = await fetch(`${API_BASE_URL}/Task`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ColumnId: columnId,
                    Title: taskTitle,
                    Description: "",
                    IsActive: true,
                    CreatedBy: 0,
                    UpdatedBy: 0,
                }),
            });

            if (!response.ok) throw new Error("Erro ao criar a tarefa no servidor.");

            const taskId = await response.text();

            // Atualizar o DOM com a nova tarefa
            const tasksContainer = columnElement.querySelector(".task, .task-item");
            const newTaskElement = document.createElement("div");
            newTaskElement.classList.add("task-item");
            newTaskElement.setAttribute("data-task-id", taskId);
    

            // Título da tarefa
            const taskTitleElement = document.createElement("span");
            taskTitleElement.textContent = taskTitle;

            // Botão para excluir a tarefa
            const deleteTaskButton = document.createElement("button");
            deleteTaskButton.textContent = "X";
            deleteTaskButton.classList.add("delete-task-button");
            deleteTaskButton.addEventListener("click", () =>
                excluirTarefa(taskId, newTaskElement)
            );

            // Adiciona título e botão na tarefa
            newTaskElement.appendChild(taskTitleElement);
            newTaskElement.appendChild(deleteTaskButton);

            // Adiciona a nova tarefa ao container
            tasksContainer.appendChild(newTaskElement);

            // Limpa o campo de título e fecha o modal
            document.getElementById("new-task-title").value = "";
            addTaskModal.classList.add("hiddentask");
        } catch (error) {
            console.error("Erro ao adicionar a tarefa:", error);
            alert("Não foi possível adicionar a tarefa. Tente novamente.");
        }
    };
}

// Função para criar colunas
saveColumnButton.addEventListener("click", async () => {
    const columnTitle = document.getElementById("new-column-title").value.trim();
    const boardTitleElement = document.getElementById("board-title");
    const boardId = boardTitleElement.getAttribute("data-board-id");

    if (!columnTitle) {
        alert("O título da coluna não pode estar vazio.");
        return;
    }

    if (!boardId) {
        alert("Nenhum board selecionado.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/Column`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                BoardId: boardId,
                Name: columnTitle,
                Position: 0,
                IsActive: true,
                CreatedBy: 0,
                UpdatedBy: 0
            })
        });

        if (!response.ok) throw new Error("Erro ao criar a coluna");

        const newColumnId = await response.text();

        const columnsContainer = document.getElementById("columns-container");

        const divColuna = document.createElement("div");
        divColuna.classList.add("column");
        divColuna.setAttribute("data-column-id", newColumnId);

        const tituloColuna = document.createElement("h3");
        tituloColuna.textContent = columnTitle;

        const tarefasContainer = document.createElement("div");
        tarefasContainer.classList.add("task");

        // Criando o contêiner dos botões
        const buttonContainer = document.createElement("div");
        buttonContainer.classList.add("button-container");

        // Criando o botão "Adicionar Tarefas"
        const addTaskButton = document.createElement("button");
        addTaskButton.textContent = "Adicionar Tarefas";
        addTaskButton.classList.add("add-task-button");
        
        // Vinculando o evento de clique para a nova coluna
        addTaskButton.addEventListener("click", () => {
            openAddTaskModal(divColuna);  // Abre o modal de adicionar tarefa para a nova coluna
        });

        // Criando o botão de excluir
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Excluir Coluna";
        deleteButton.classList.add("delete-column-button");
        deleteButton.addEventListener("click", async (event) => {
            await excluirColuna(newColumnId, divColuna);
        });

        // Adiciona os botões no contêiner
        buttonContainer.appendChild(addTaskButton);
        buttonContainer.appendChild(deleteButton);

        // Adiciona título, botão de excluir e tarefas ao DOM
        divColuna.appendChild(tituloColuna);
        divColuna.appendChild(tarefasContainer);
        divColuna.appendChild(buttonContainer); // Adiciona o contêiner com os botões

        columnsContainer.appendChild(divColuna);

        // Carregar tarefas para esta coluna
        carregarTarefas(newColumnId, tarefasContainer);  // Carrega as tarefas para a nova coluna

        document.getElementById("new-column-title").value = "";
        addColumnModal.classList.add("hidden");
    } catch (error) {
        console.error("Erro ao criar a coluna:", error);
        alert("Não foi possível criar a coluna. Tente novamente.");
    }
});

//--------------------------------------------------------------------------------------------------------------------------------

