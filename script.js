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
function showMessage(type, text) {
    messageDiv.className = `message-${type}`;
    messageDiv.textContent = text;
    messageDiv.classList.remove('hidden');
}

async function fetchGuests() {
    showMessage('loading', 'Carregando lista de convidados...');
    try {
        const response = await fetch(SCRIPT_URL);
        if (!response.ok) throw new Error('Falha ao carregar os dados.');
        guestList = await response.json();
        messageDiv.classList.add('hidden');
    } catch (error) {
        showMessage('error', 'Erro ao conectar com a lista. Tente recarregar a página.');
        console.error("Erro detalhado em fetchGuests:", error);
    }
}

function displayResults(query) {
    searchResults.innerHTML = '';
    if (!query) return;
    const filteredGuests = guestList.filter(guest => guest.nome.toLowerCase().includes(query.toLowerCase()));
    filteredGuests.forEach(guest => {
        const div = document.createElement('div');
        div.className = 'result-item';
        div.textContent = guest.nome;
        div.addEventListener('click', () => selectGuest(guest));
        searchResults.appendChild(div);
    });
}

function selectGuest(guest) {
    selectedGuest = guest;
    searchSection.classList.add('hidden');
    rsvpSection.classList.remove('hidden');
    searchResults.innerHTML = '';
    searchInput.value = '';
    guestNameSpan.
