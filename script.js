// IMPORTANTE: Cole aqui a URL do seu script publicado
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxVAMrhRnKzsSVloVecE_nurxVHUOOLJOiMb0vXfBdjU_S7Q6J06IXSieuGk8_42pd_/exec";

// --- ELEMENTOS DO DOM ---
const searchSection = document.getElementById('searchSection');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

const rsvpSection = document.getElementById('rsvpSection');
const guestNameSpan = document.getElementById('guestName');
const companionsContainer = document.getElementById('companionsContainer');
const companionsList = document.getElementById('companionsList');
const attendanceRadios = document.querySelectorAll('input[name="attendance"]');

const messageDiv = document.getElementById('message');

// --- ESTADO DA APLICAÇÃO ---
let guestList = [];
let selectedGuest = null;

// --- FUNÇÕES ---

// Mostra mensagens para o usuário
function showMessage(type, text) {
    messageDiv.className = `message-${type}`;
    messageDiv.textContent = text;
    messageDiv.classList.remove('hidden');
}

// Busca os dados da planilha ao carregar a página
async function fetchGuests() {
    showMessage('loading', 'Carregando lista de convidados...');
    try {
        const response = await fetch(SCRIPT_URL);
        if (!response.ok) throw new Error('Falha ao carregar os dados.');
        guestList = await response.json();
        messageDiv.classList.add('hidden'); // Esconde a mensagem de loading
    } catch (error) {
        showMessage('error', 'Erro ao conectar com a lista. Tente recarregar a página.');
        console.error(error);
    }
}

// Filtra e exibe os resultados da busca
function displayResults(query) {
    searchResults.innerHTML = '';
    if (!query) return;

    const filteredGuests = guestList.filter(guest => 
        guest.nome.toLowerCase().includes(query.toLowerCase())
    );

    filteredGuests.forEach(guest => {
        const div = document.createElement('div');
        div.className = 'result-item';
        div.textContent = guest.nome;
        div.addEventListener('click', () => selectGuest(guest));
        searchResults.appendChild(div);
    });
}

// Prepara a seção de confirmação para o convidado selecionado
function selectGuest(guest) {
    selectedGuest = guest;
    
    // Esconde a busca e mostra o formulário de RSVP
    searchSection.classList.add('hidden');
    rsvpSection.classList.remove('hidden');
    searchResults.innerHTML = '';
    searchInput.value = '';
    
    // Preenche os dados
    guestNameSpan.textContent = guest.nome;
    
    // Limpa e popula os acompanhantes
    companionsList.innerHTML = '';
    companionsContainer.classList.add('hidden');

    if (guest.acompanhantes && guest.acompanhantes.length > 0) {
        const companions = guest.acompanhantes.split(';');
        companions.forEach(name => {
            const companionName = name.trim();
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = companionName;
            checkbox.name = 'companion';
            
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${companionName}`));
            companionsList.appendChild(label);
        });
    }
}

// Controla a visibilidade da lista de acompanhantes
function handleAttendanceChange() {
    const isAttending = document.querySelector('input[name="attendance"]:checked').value === 'Confirmado';
    const hasCompanions = selectedGuest && selectedGuest.acompanhantes.length > 0;

    if (isAttending && hasCompanions) {
        companionsContainer.classList.remove('hidden');
    } else {
        companionsContainer.classList.add('hidden');
    }
}

// Envia os dados do formulário para a planilha
async function handleRsvpSubmit(event) {
    event.preventDefault();
    showMessage('loading', 'Enviando sua confirmação...');

    const formData = new FormData(rsvpSection);
    const status = formData.get('attendance');
    
    // Coleta apenas os acompanhantes marcados
    const confirmedCompanions = [];
    if (status === 'Confirmado') {
        const checkedCompanions = companionsList.querySelectorAll('input[type="checkbox"]:checked');
        checkedCompanions.forEach(checkbox => {
            confirmedCompanions.push(checkbox.value);
        });
    }
    
    const dataToPost = {
        id: selectedGuest.id,
        status: status,
        confirmedCompanions: confirmedCompanions
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(dataToPost),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // Apps Script requer text/plain
            },
        });
        const result = await response.json();
        
        if (result.success) {
            rsvpSection.classList.add('hidden');
            showMessage('success', 'Obrigado! Sua presença foi registrada com sucesso.');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        showMessage('error', 'Houve um erro ao salvar. Por favor, tente novamente.');
        console.error(error);
    }
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', fetchGuests);
searchInput.addEventListener('input', () => displayResults(searchInput.value));
rsvpSection.addEventListener('submit', handleRsvpSubmit);
attendanceRadios.forEach(radio => radio.addEventListener('change', handleAttendanceChange));