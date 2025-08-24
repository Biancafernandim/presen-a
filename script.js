const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxB8Dn5dl3ENaUwPEYFzaSsf8kYn_HS0jM_12XYTjmR1bDkIZNGEN7kuFYtB-nnecg0/exec";

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
    guestNameSpan.textContent = guest.nome;
    populateCompanions(guest);
}

function populateCompanions(guest) {
    companionsList.innerHTML = '';
    companionsContainer.classList.add('hidden');
    if (!guest.acompanhantes || guest.acompanhantes.length === 0) return;
    const companions = guest.acompanhantes.split(';');
    companions.forEach(name => {
        const companionName = name.trim();
        if (companionName === "") return;
        const wrapper = document.createElement('div');
        wrapper.className = 'companion-item';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'companion';
        wrapper.appendChild(checkbox);
        if (companionName.indexOf(' ') === -1) {
            checkbox.dataset.firstname = companionName;
            const nameSpan = document.createElement('span');
            nameSpan.className = 'firstname';
            nameSpan.textContent = companionName;
            const lastnameInput = document.createElement('input');
            lastnameInput.type = 'text';
            lastnameInput.className = 'lastname-input';
            lastnameInput.placeholder = 'Sobrenome';
            wrapper.appendChild(nameSpan);
            wrapper.appendChild(lastnameInput);
        } else {
            checkbox.value = companionName;
            const label = document.createElement('label');
            label.textContent = ` ${companionName}`;
            label.prepend(checkbox);
            wrapper.appendChild(label);
        }
        companionsList.appendChild(wrapper);
    });
}

function handleAttendanceChange() {
    const isAttending = document.querySelector('input[name="attendance"]:checked')?.value === 'Confirmado';
    const hasCompanions = selectedGuest && selectedGuest.acompanhantes.length > 0;
    if (isAttending && hasCompanions) {
        companionsContainer.classList.remove('hidden');
    } else {
        companionsContainer.classList.add('hidden');
    }
}

async function handleRsvpSubmit(event) {
    event.preventDefault();

    const submitButton = event.target.querySelector('button[type="submit"]');
    const btnText = submitButton.querySelector('.btn-text');
    const btnLoader = submitButton.querySelector('.btn-loader');

    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');
    submitButton.disabled = true;

    messageDiv.classList.add('hidden');

    const formData = new FormData(rsvpSection);
    const status = formData.get('attendance');
    const confirmedCompanions = [];
    const finalCompanionList = [];

    companionsList.querySelectorAll('.companion-item').forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        let fullName = '';
        if (checkbox.dataset.firstname) {
            const lastName = item.querySelector('.lastname-input').value.trim();
            fullName = lastName ? `${checkbox.dataset.firstname} ${lastName}` : checkbox.dataset.firstname;
        } else {
            fullName = checkbox.value;
        }
        finalCompanionList.push(fullName);
        if (checkbox.checked) {
            confirmedCompanions.push(fullName);
        }
    });

    const dataToPost = {
        id: selectedGuest.id,
        status: status,
        confirmedCompanions: confirmedCompanions,
        updatedCompanionList: finalCompanionList.join('; ')
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(dataToPost),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            }
        });
        const result = await response.json();
        if (result.success) {
            rsvpSection.classList.add('hidden');
            searchSection.classList.add('hidden');

            if (status === 'Confirmado') {
                showMessage('success', 'Obrigado! Sua presença foi registrada com sucesso.');

                const calendarButton = document.getElementById('addToCalendarBtn');
                const whatsappButton = document.getElementById('whatsappBtn');
                // ▼▼▼ CÓDIGO CORRIGIDO/ADICIONADO ▼▼▼
                const giftsButton = document.getElementById('goToGiftsBtn');

                if (calendarButton && whatsappButton && giftsButton) {
                    
                    const eventTitle = encodeURIComponent("Casamento Yan e Bianca");
                    const eventDate = "20251227T220000Z/20251228T040000Z";
                    const eventDetails = encodeURIComponent("Traje: Esporte Fino. Mal podemos esperar para celebrar com você!");
                    const eventLocation = encodeURIComponent("Rua Araci, 78, Tatuapé, São Paulo - SP");
                    const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${eventDate}&details=${eventDetails}&location=${eventLocation}`;
                    calendarButton.href = calendarUrl;

                    const couplePhoneNumber = "5513974220783";
                    let messageBody = `Olá! Presença confirmada para o casamento!\n\nConvidado(a): ${selectedGuest.nome}`;
                    if (confirmedCompanions.length > 0) {
                        messageBody += `\nAcompanhantes: ${confirmedCompanions.join(', ')}`;
                    }
                    messageBody += `\n\nMal podemos esperar!`;
                    const whatsappMessage = encodeURIComponent(messageBody);
                    whatsappButton.href = `https://wa.me/${couplePhoneNumber}?text=${whatsappMessage}`;
                    
                    // ▼▼▼ CÓDIGO CORRIGIDO/ADICIONADO ▼▼▼
                    giftsButton.addEventListener('click', (e) => {
                        e.preventDefault();
                        switchTab('gifts');
                    });

                    document.getElementById('post-rsvp-actions').classList.remove('hidden');
                }
            } else {
                showMessage('success', 'Que pena! Sentiremos sua falta. Agradecemos por nos avisar.');
            }

        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        showMessage('error', 'Houve um erro ao salvar. Por favor, tente novamente.');
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
        submitButton.disabled = false;
        console.error("Erro detalhado em handleRsvpSubmit:", error);
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    const activeButton = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    const activeContent = document.getElementById(tabId);
    if (activeButton) activeButton.classList.add('active');
    if (activeContent) activeContent.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.tab-nav').addEventListener('click', (e) => {
        const clickedButton = e.target.closest('.tab-btn');
        if (!clickedButton) return;
        switchTab(clickedButton.dataset.tab);
    });

    const hash = window.location.hash;
    if (hash) {
        const tabId = hash.substring(1);
        switchTab(tabId);
    }

    fetchGuests();
});

searchInput.addEventListener('input', () => displayResults(searchInput.value));
rsvpSection.addEventListener('submit', handleRsvpSubmit);
attendanceRadios.forEach(radio => radio.addEventListener('change', handleAttendanceChange));

// --- FUNCIONALIDADE DO BOTÃO DE COPIAR PIX ---

// Encontra o botão e o texto da chave Pix na página
const copyPixButton = document.getElementById('copyPixBtn');
const pixKeySpan = document.getElementById('pixKey');

// Adiciona um "escutador" de evento de clique ao botão
if (copyPixButton && pixKeySpan) {
    copyPixButton.addEventListener('click', () => {
        // Pega o texto da chave Pix
        const keyToCopy = pixKeySpan.textContent;

        // Usa a API do navegador para copiar o texto para a área de transferência
        navigator.clipboard.writeText(keyToCopy).then(() => {
            // Se a cópia for bem-sucedida...
            const originalText = copyPixButton.textContent;
            copyPixButton.textContent = '✅ Copiado!';
            
            // Volta ao texto original depois de 2 segundos
            setTimeout(() => {
                copyPixButton.textContent = originalText;
            }, 2000);

        }).catch(err => {
            // Se der erro (raro em navegadores modernos)
            console.error('Erro ao copiar a chave Pix: ', err);
            alert('Não foi possível copiar a chave. Por favor, copie manualmente.');
        });
    });
}
