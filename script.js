let currentUser = JSON.parse(localStorage.getItem('vet_current_user')) || null;

// Listas inicializadas vazias conforme solicitado
let animalsData = JSON.parse(localStorage.getItem('vet_animals')) || [];
let appointmentsData = JSON.parse(localStorage.getItem('vet_appointments')) || [];
let clinicsData = JSON.parse(localStorage.getItem('vet_clinics')) || [];

let clinicContacts = JSON.parse(localStorage.getItem('vet_clinic_contacts')) || [];
let pendingSignupData = null;
let lastFocusedElement = null;

function saveData() {
    localStorage.setItem('vet_current_user', JSON.stringify(currentUser));
    localStorage.setItem('vet_animals', JSON.stringify(animalsData));
    localStorage.setItem('vet_appointments', JSON.stringify(appointmentsData));
    localStorage.setItem('vet_clinics', JSON.stringify(clinicsData));
    localStorage.setItem('vet_clinic_contacts', JSON.stringify(clinicContacts));
    updateHomeMetrics();
}

function switchTab(tabId) {
    const restrictedTabs = ['animals', 'tutor-area', 'appointments'];
    if (restrictedTabs.includes(tabId) && !currentUser) {
        openModal('login-select-modal');
        showToast('Acesso restrito. Faça login para navegar nas áreas protegidas.');
        return;
    }

    if (tabId === 'animals' && currentUser && currentUser.role === 'tutor') {
        showToast('Aba desabilitada para o perfil de Tutor. Utilize seu painel exclusivo "Minha Conta".');
        switchTab('tutor-area');
        return;
    }

    if (tabId === 'appointments' && currentUser && currentUser.role === 'clinic') {
        showToast('Acesso negado: Clínicas parceiras não possuem permissão de acesso à aba de Consultas.');
        switchTab('animals');
        return;
    }

    if (tabId === 'tutor-area' && (!currentUser || currentUser.role !== 'tutor')) {
        openModal('login-select-modal');
        showToast('Área exclusiva para tutores logados.');
        return;
    }

    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(el => el.classList.remove('is-current'));

    const selectedTab = document.getElementById(`tab-${tabId}`);
    if (selectedTab) selectedTab.classList.remove('hidden');

    [`nav-${tabId}`, `mobile-nav-${tabId === 'tutor-area' ? 'tutor' : tabId}`]
        .map(id => document.getElementById(id))
        .filter(Boolean)
        .forEach(el => el.classList.add('is-current'));

    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (tabId === 'clinics') renderClinics();
    if (tabId === 'tutor-area') renderTutorArea();
    if (tabId === 'animals') renderAnimals();
    if (tabId === 'appointments') renderAppointments();
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const isOpen = menu.classList.toggle('hidden') === false;
    document.querySelector('.menu-toggle').setAttribute('aria-expanded', String(isOpen));
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    lastFocusedElement = document.activeElement;
    modal.classList.remove('hidden');
    const focusTarget = modal.querySelector('button, input, select, textarea');
    if (focusTarget) focusTarget.focus();
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
        lastFocusedElement = null;
    }
}

function openLoginModalForRole(role) {
    document.getElementById('login-target-role').value = role;
    const titleEl = document.getElementById('login-modal-title');
    if (role === 'tutor') titleEl.innerText = 'Entrar como Tutor';
    if (role === 'admin') titleEl.innerText = 'Entrar como Coordenação / Médico Veterinário';
    if (role === 'clinic') titleEl.innerText = 'Entrar como Clínica Parceira';
    openModal('login-modal');
}

function handleLogin(e) {
    e.preventDefault();
    const role = document.getElementById('login-target-role').value;
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value;

    // Os acessos de demonstração fixos foram removidos. 
    // Aqui você pode integrar com o seu sistema de autenticação real / banco de dados.
    if (role === 'admin') {
        // Exemplo genérico de validação (substitua pela sua lógica real)
        currentUser = { name: 'Coordenador / Médico Veterinário', email: email, role: 'admin' };
        saveData();
        updateAuthUI();
        closeModal('login-modal');
        showToast('Login realizado com sucesso!');
        switchTab('animals');
        return;
    }

    if (role === 'clinic') {
        const foundClinic = clinicsData.find(c => c.email.toLowerCase() === email.toLowerCase()) || {
            id: Date.now(),
            name: 'Clínica Parceira',
            email: email,
            status: 'Parceiro Credenciado'
        };
        currentUser = { name: foundClinic.name, email: email, role: 'clinic', clinicId: foundClinic.id };
        saveData();
        updateAuthUI();
        closeModal('login-modal');
        showToast(`Bem-vindo(a), ${foundClinic.name}!`);
        switchTab('animals');
        return;
    }

    if (role === 'tutor') {
        currentUser = { name: email.split('@')[0], email: email, role: 'tutor' };
        saveData();
        updateAuthUI();
        closeModal('login-modal');
        showToast('Login realizado como Tutor!');
        switchTab('tutor-area');
        return;
    }
}

function requestVerificationCode(e, roleType) {
    e.preventDefault();
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    if (roleType === 'tutor') {
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;

        if (password !== confirmPassword) {
            alert('As senhas não coincidem!');
            return;
        }

        pendingSignupData = { role: 'tutor', name, email, password };
        document.getElementById('simulated-code-display').innerText = verificationCode;
        pendingSignupData.code = verificationCode;

        document.getElementById('signup-form-step1').classList.add('hidden');
        document.getElementById('signup-form-step2').classList.remove('hidden');
        showToast('Código de verificação enviado para o e-mail do tutor.');
    } else if (roleType === 'admin') {
        const name = document.getElementById('admin-signup-name').value;
        const email = document.getElementById('admin-signup-email').value;
        const password = document.getElementById('admin-signup-password').value;

        pendingSignupData = { role: 'admin', name, email, password };
        document.getElementById('admin-simulated-code-display').innerText = verificationCode;
        pendingSignupData.code = verificationCode;

        document.getElementById('admin-signup-form-step1').classList.add('hidden');
        document.getElementById('admin-signup-form-step2').classList.remove('hidden');
        showToast('Código de verificação institucional enviado.');
    } else if (roleType === 'clinic') {
        const name = document.getElementById('cs-name').value;
        const cnpj = document.getElementById('cs-cnpj').value;
        const crmv = document.getElementById('cs-crmv').value;
        const email = document.getElementById('cs-email').value;
        const phone = document.getElementById('cs-phone').value;
        const address = document.getElementById('cs-address').value;
        const password = document.getElementById('cs-password').value;

        pendingSignupData = { role: 'clinic', name, cnpj, crmv, email, phone, address, password };
        document.getElementById('clinic-simulated-code-display').innerText = verificationCode;
        pendingSignupData.code = verificationCode;

        document.getElementById('clinic-signup-form-step1').classList.add('hidden');
        document.getElementById('clinic-signup-form-step2').classList.remove('hidden');
        showToast('Código de verificação da clínica enviado por e-mail.');
    }
}

function confirmSignupVerification(roleType) {
    let inputCode = '';
    if (roleType === 'tutor') inputCode = document.getElementById('signup-verification-input').value.trim();
    if (roleType === 'admin') inputCode = document.getElementById('admin-verification-input').value.trim();
    if (roleType === 'clinic') inputCode = document.getElementById('clinic-verification-input').value.trim();

    if (inputCode !== pendingSignupData.code) {
        alert('Código de verificação incorreto! Verifique o código exibido.');
        return;
    }

    if (roleType === 'tutor') {
        currentUser = { name: pendingSignupData.name, email: pendingSignupData.email, role: 'tutor' };
        saveData();
        updateAuthUI();
        closeModal('signup-modal');
        document.getElementById('signup-form-step1').reset();
        document.getElementById('signup-form-step1').classList.remove('hidden');
        document.getElementById('signup-form-step2').classList.add('hidden');
        showToast('Conta de tutor verificada e criada com sucesso!');
        switchTab('tutor-area');
    } else if (roleType === 'admin') {
        currentUser = { name: pendingSignupData.name, email: pendingSignupData.email, role: 'admin' };
        saveData();
        updateAuthUI();
        closeModal('admin-signup-modal');
        document.getElementById('admin-signup-form-step1').reset();
        document.getElementById('admin-signup-form-step1').classList.remove('hidden');
        document.getElementById('admin-signup-form-step2').classList.add('hidden');
        showToast('Cadastro institucional verificado com sucesso!');
        switchTab('animals');
    } else if (roleType === 'clinic') {
        const newClinic = {
            id: clinicsData.length > 0 ? Math.max(...clinicsData.map(c => c.id)) + 1 : 1,
            name: pendingSignupData.name,
            cnpj: pendingSignupData.cnpj,
            crmv: pendingSignupData.crmv,
            email: pendingSignupData.email,
            phone: pendingSignupData.phone,
            address: pendingSignupData.address,
            status: 'Parceiro Credenciado'
        };
        clinicsData.push(newClinic);
        currentUser = { name: newClinic.name, email: newClinic.email, role: 'clinic', clinicId: newClinic.id };
        saveData();
        updateAuthUI();
        closeModal('clinic-signup-modal');
        document.getElementById('clinic-signup-form-step1').reset();
        document.getElementById('clinic-signup-form-step1').classList.remove('hidden');
        document.getElementById('clinic-signup-form-step2').classList.add('hidden');
        showToast('Clínica verificada e logada com sucesso!');
        switchTab('animals');
    }
    pendingSignupData = null;
}

function logout() {
    currentUser = null;
    localStorage.removeItem('vet_current_user');
    saveData();
    updateAuthUI();
    showToast('Sessão encerrada.');
    switchTab('home');
    renderAnimals();
    renderClinics();
}

function updateAuthUI() {
    const authArea = document.getElementById('auth-nav-area');
    const tutorNotice = document.getElementById('tutor-notice-banner');
    const tutorRestrictedBanner = document.getElementById('tutor-restricted-banner');
    const clinicFiltersPanel = document.getElementById('clinic-filters-panel');
    const clinicPortalBox = document.getElementById('clinic-portal-box');
    const navTutorBtn = document.getElementById('nav-tutor-area');
    const mobileTutorBtn = document.getElementById('mobile-nav-tutor');

    const navAnimals = document.getElementById('nav-animals');
    const mobileNavAnimals = document.getElementById('mobile-nav-animals');
    const navAppointments = document.getElementById('nav-appointments');
    const mobileNavAppointments = document.getElementById('mobile-nav-appointments');
    const appointmentCreateButton = document.getElementById('appointments-create-btn');

    if (currentUser) {
        let badge = 'Tutor';
        if (currentUser.role === 'admin') badge = 'Coordenação / Veterinário';
        if (currentUser.role === 'clinic') badge = 'Clínica parceira';

        authArea.innerHTML = `
            <div class="auth-user">
                <div class="auth-user-copy">
                    <strong>${currentUser.name}</strong>
                    <span>${badge}</span>
                </div>
                <button type="button" class="button button--text" onclick="logout()">Sair</button>
            </div>
        `;

        if (currentUser.role === 'tutor') {
            if (appointmentCreateButton) appointmentCreateButton.classList.remove('hidden');
            if (navTutorBtn) navTutorBtn.classList.remove('hidden');
            if (mobileTutorBtn) mobileTutorBtn.classList.remove('hidden');
            
            if (navAnimals) navAnimals.classList.add('hidden');
            if (mobileNavAnimals) mobileNavAnimals.classList.add('hidden');
            
            if (navAppointments) navAppointments.classList.remove('hidden');
            if (mobileNavAppointments) mobileNavAppointments.classList.remove('hidden');

            if (tutorRestrictedBanner) tutorRestrictedBanner.classList.remove('hidden');
            if (tutorNotice) tutorNotice.classList.add('hidden');
            if (clinicFiltersPanel) clinicFiltersPanel.classList.add('hidden');

        } else if (currentUser.role === 'clinic') {
            if (appointmentCreateButton) appointmentCreateButton.classList.add('hidden');
            if (navTutorBtn) navTutorBtn.classList.add('hidden');
            if (mobileTutorBtn) mobileTutorBtn.classList.add('hidden');

            if (navAnimals) navAnimals.classList.remove('hidden');
            if (mobileNavAnimals) mobileNavAnimals.classList.remove('hidden');

            if (navAppointments) navAppointments.classList.add('hidden');
            if (mobileNavAppointments) mobileNavAppointments.classList.add('hidden');

            if (tutorRestrictedBanner) tutorRestrictedBanner.classList.add('hidden');
            if (tutorNotice) tutorNotice.classList.add('hidden');
            if (clinicFiltersPanel) clinicFiltersPanel.classList.remove('hidden');

        } else { // Admin (Coordenação)
            if (appointmentCreateButton) appointmentCreateButton.classList.add('hidden');
            if (navTutorBtn) navTutorBtn.classList.add('hidden');
            if (mobileTutorBtn) mobileTutorBtn.classList.add('hidden');

            if (navAnimals) navAnimals.classList.remove('hidden');
            if (mobileNavAnimals) mobileNavAnimals.classList.remove('hidden');
            if (navAppointments) navAppointments.classList.remove('hidden');
            if (mobileNavAppointments) mobileNavAppointments.classList.remove('hidden');

            if (tutorRestrictedBanner) tutorRestrictedBanner.classList.add('hidden');
            if (tutorNotice) tutorNotice.classList.add('hidden');
            if (clinicFiltersPanel) clinicFiltersPanel.classList.add('hidden');
        }

        if (clinicPortalBox) {
            if (currentUser.role === 'clinic') {
                clinicPortalBox.classList.remove('hidden');
                document.getElementById('logged-clinic-name').innerText = currentUser.name;
                renderClinicContactsList();
            } else {
                clinicPortalBox.classList.add('hidden');
            }
        }
    } else {
        if (appointmentCreateButton) appointmentCreateButton.classList.add('hidden');
        authArea.innerHTML = `
            <button type="button" class="button button--text" onclick="openModal('login-select-modal')">Entrar</button>
            <button type="button" class="button button--pill button--brand" onclick="openModal('signup-select-modal')">Cadastre-se</button>
        `;
        
        if (navTutorBtn) navTutorBtn.classList.add('hidden');
        if (mobileTutorBtn) mobileTutorBtn.classList.add('hidden');
        
        if (navAnimals) navAnimals.classList.add('hidden');
        if (mobileNavAnimals) mobileNavAnimals.classList.add('hidden');
        
        if (navAppointments) navAppointments.classList.add('hidden');
        if (mobileNavAppointments) mobileNavAppointments.classList.add('hidden');

        if (tutorNotice) tutorNotice.classList.remove('hidden');
        if (tutorRestrictedBanner) tutorRestrictedBanner.classList.add('hidden');
        if (clinicFiltersPanel) clinicFiltersPanel.classList.add('hidden');
        if (clinicPortalBox) clinicPortalBox.classList.add('hidden');
    }
    renderAppointments();
    renderClinics();
    updateHomeMetrics();
}

function updateHomeMetrics() {
    const metrics = [
        ['metric-animals', 'home-animal-count', animalsData.length],
        ['metric-clinics', 'home-clinic-count', clinicsData.length],
        ['metric-appointments', 'home-appointment-count', appointmentsData.length]
    ];

    metrics.forEach(([metricId, countId, count]) => {
        const metric = document.getElementById(metricId);
        const countElement = document.getElementById(countId);
        if (!metric || !countElement) return;
        countElement.innerText = count;
        metric.classList.toggle('hidden', count === 0);
    });
    const metricsBand = document.querySelector('.metrics-band');
    if (metricsBand) metricsBand.classList.toggle('metrics-band--only-hours', metrics.every(([, , count]) => count === 0));

    const animalsTotal = document.getElementById('animals-total');
    const clinicsTotal = document.getElementById('clinics-total');
    const appointmentsTotal = document.getElementById('appointments-total');
    if (animalsTotal) animalsTotal.innerText = animalsData.length;
    if (clinicsTotal) clinicsTotal.innerText = clinicsData.length;
    if (appointmentsTotal) appointmentsTotal.innerText = appointmentsData.length;

    const clinicNames = document.getElementById('home-clinic-names');
    if (!clinicNames) return;
    clinicNames.innerHTML = clinicsData.length
        ? clinicsData.map(clinic => `<span class="trusted-name">${clinic.name}</span>`).join('')
        : `<span class="trusted-name trusted-name--institution"><img src="logo-clinica.png" alt="">UNINASSAU · Medicina Veterinária CG</span>`;
}

function clearClinicFilters() {
    document.getElementById('clinic-filter-blood').value = '';
    document.getElementById('clinic-filter-age').value = '';
    document.getElementById('clinic-filter-weight').value = '';
    renderAnimals();
}

function renderAnimals() {
    const grid = document.getElementById('animals-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const animalsTotal = document.getElementById('animals-total');
    if (animalsTotal) {
        animalsTotal.innerText = animalsData.length;
        const stat = animalsTotal.closest('.page-stat');
        if (stat) stat.classList.toggle('hidden', animalsData.length === 0);
    }

    if (currentUser && currentUser.role === 'tutor') {
        grid.innerHTML = `<div class="empty-state">
            <strong>Área de animais restrita.</strong>
            <p>Acesse Minha Conta para consultar os pets vinculados ao seu perfil.</p>
        </div>`;
        return;
    }

    const query = document.getElementById('animal-search') ? document.getElementById('animal-search').value.toLowerCase() : '';
    const filterBlood = document.getElementById('clinic-filter-blood') ? document.getElementById('clinic-filter-blood').value.toLowerCase() : '';
    const filterAge = document.getElementById('clinic-filter-age') ? document.getElementById('clinic-filter-age').value.toLowerCase() : '';
    const filterWeight = document.getElementById('clinic-filter-weight') ? document.getElementById('clinic-filter-weight').value.toLowerCase() : '';

    const filtered = animalsData.filter(a => {
        const matchesQuery = a.name.toLowerCase().includes(query) || 
                             a.species.toLowerCase().includes(query) || 
                             a.breed.toLowerCase().includes(query) ||
                             a.owner.toLowerCase().includes(query);
        
        if (currentUser && currentUser.role === 'clinic') {
            const matchesBlood = filterBlood === '' || (a.blood && a.blood.toLowerCase().includes(filterBlood));
            const matchesAge = filterAge === '' || (a.age && a.age.toLowerCase().includes(filterAge));
            const matchesWeight = filterWeight === '' || (a.age && a.age.toLowerCase().includes(filterWeight));
            return matchesQuery && matchesBlood && matchesAge && matchesWeight;
        }

        return matchesQuery;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="empty-state"><strong>Nenhum animal encontrado.</strong><p>Altere a busca ou os filtros e tente novamente.</p></div>`;
        return;
    }

    filtered.forEach(animal => {
        const isClinic = currentUser && currentUser.role === 'clinic';
        const isAdmin = currentUser && currentUser.role === 'admin';
        const canManage = isAdmin;

        const card = document.createElement('article');
        card.className = 'animal-card';
        const photoUrl = animal.photo || 'assets/hero-pets.svg';

        if (isClinic) {
            card.innerHTML = `
                <div class="animal-card__media">
                    <img src="${photoUrl}" alt="${animal.name}">
                    <span class="species-badge">Clínica parceira</span>
                </div>
                <div class="animal-card__content">
                    <div class="animal-card__title-row">
                        <h2>${animal.name}</h2>
                        <span class="blood-badge">${animal.blood || 'Não informado'}</span>
                    </div>
                    <p>${animal.species} · ${animal.breed} · ${animal.age}</p>
                    <div class="animal-card__details">
                        <p><strong>Última coleta:</strong> ${animal.lastCollectionDate || 'Não informada'}</p>
                        <p><strong>Volume doado:</strong> ${animal.donatedAmount || 'Não informado'}</p>
                        <p><strong>Histórico:</strong> ${animal.notes || 'Anamnese arquivada no sistema.'}</p>
                        ${animal.anamnesisPdf
        ? `<a class="pdf-link" href="${animal.anamnesisPdf}" target="_blank" rel="noopener">Visualizar anamnese completa (PDF)</a>`
        : `<span class="field-status field-status--warning">Anamnese em auditoria.</span>`}
                    </div>
                </div>
                <div class="animal-card__actions">
                    <button type="button" class="button button--pill button--primary button--full" onclick="openClinicContactModalWithAnimal('${animal.name}')">Requisitar doador para este animal</button>
                </div>
                `;
            grid.appendChild(card);
            return;
        }

        card.innerHTML = `
            <div class="animal-card__media">
                <img src="${photoUrl}" alt="${animal.name}">
                <span class="species-badge">${animal.species}</span>
            </div>
            <div class="animal-card__content">
                <div class="animal-card__title-row">
                    <h2>${animal.name}</h2>
                    <span class="blood-badge">${animal.blood || 'Não informado'}</span>
                </div>
                <p>${animal.breed} · ${animal.age}</p>
                <div class="animal-card__details">
                    <p><strong>Tutor:</strong> ${animal.owner}</p>
                    <p><strong>Última coleta:</strong> ${animal.lastCollectionDate || 'N/A'}</p>
                    <p><strong>Volume doado:</strong> ${animal.donatedAmount || 'N/A'}</p>
                    <p><strong>Histórico:</strong> ${animal.notes || 'Sem observações.'}</p>
                    ${animal.anamnesisPdf
        ? `<a class="pdf-link" href="${animal.anamnesisPdf}" target="_blank" rel="noopener">Visualizar anamnese (PDF)</a>`
        : `<span class="field-status field-status--warning">PDF pendente.</span>`}
                </div>
            </div>
            ${canManage ? `
                <div class="animal-card__actions">
                    <button type="button" onclick="editAnimal(${animal.id})">Editar</button>
                    <button type="button" class="danger-action" onclick="deleteAnimal(${animal.id})">Excluir</button>
                </div>
            ` : ''}
        `;
        grid.appendChild(card);
    });
}

function renderTutorArea() {
    if (!currentUser || currentUser.role !== 'tutor') {
        switchTab('home');
        openModal('login-select-modal');
        showToast('Faça login como Tutor para acessar sua conta.');
        return;
    }

    document.getElementById('tutor-profile-name').innerText = currentUser.name;
    document.getElementById('tutor-profile-email').innerText = currentUser.email;

    const grid = document.getElementById('tutor-pets-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const myPets = animalsData.filter(a => a.owner.toLowerCase() === currentUser.name.toLowerCase());
    const petsCount = document.getElementById('tutor-pets-count');
    petsCount.innerText = `${myPets.length} ${myPets.length === 1 ? 'pet cadastrado' : 'pets cadastrados'}`;
    petsCount.classList.toggle('hidden', myPets.length === 0);

    if (myPets.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <strong>Seus pets começam aqui.</strong>
                <p>Você ainda não possui pets cadastrados.</p>
                <button type="button" class="button button--pill button--primary" onclick="openAnimalModal()">Cadastrar meu primeiro pet</button>
            </div>`;
        return;
    }

    myPets.forEach(animal => {
        const card = document.createElement('article');
        card.className = 'animal-card';
        const photoUrl = animal.photo || 'assets/hero-pets.svg';

        card.innerHTML = `
            <div class="animal-card__media">
                <img src="${photoUrl}" alt="${animal.name}">
                <span class="species-badge">${animal.species}</span>
            </div>
            <div class="animal-card__content">
                <div class="animal-card__title-row">
                    <h2>${animal.name}</h2>
                    <span class="blood-badge">${animal.blood || 'Não informado'}</span>
                </div>
                <p>${animal.breed} · ${animal.age}</p>
                <div class="animal-card__details">
                    <p><strong>Última coleta:</strong> ${animal.lastCollectionDate || 'Sem registros'}</p>
                    <p><strong>Volume doado:</strong> ${animal.donatedAmount || 'Sem registros'}</p>
                    ${animal.anamnesisPdf
        ? `<a class="pdf-link" href="${animal.anamnesisPdf}" target="_blank" rel="noopener">Anamnese anexada (PDF)</a>`
        : `<span class="field-status field-status--warning">Anamnese pendente de anexo.</span>`}
                </div>
            </div>
            <div class="animal-card__actions">
                <button type="button" onclick="editAnimal(${animal.id})">Editar</button>
                <button type="button" class="danger-action" onclick="deleteAnimal(${animal.id})">Excluir</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function openAnimalModal(animalId = null) {
    if (!currentUser || (currentUser.role !== 'tutor' && currentUser.role !== 'admin')) {
        openModal('login-select-modal');
        showToast('Por favor, faça login para gerenciar pets.');
        return;
    }

    document.getElementById('animal-id').value = '';
    document.getElementById('animal-name').value = '';
    document.getElementById('animal-species').value = 'Canino';
    document.getElementById('animal-breed').value = '';
    document.getElementById('animal-blood').value = '';
    document.getElementById('animal-age').value = '';
    document.getElementById('animal-last-collection').value = '';
    document.getElementById('animal-donated-amount').value = '';
    document.getElementById('animal-owner').value = currentUser.role === 'tutor' ? currentUser.name : '';
    
    const pdfInput = document.getElementById('animal-pdf-file');
    const pdfStatus = document.getElementById('current-pdf-status');
    pdfInput.value = '';

    if (currentUser.role === 'admin') {
        document.getElementById('animal-owner').removeAttribute('readonly');
    } else {
        document.getElementById('animal-owner').setAttribute('readonly', true);
    }

    document.getElementById('animal-photo-file').value = '';
    document.getElementById('animal-notes').value = '';
    document.getElementById('animal-modal-title').innerText = 'Cadastrar Novo Animal';
    pdfStatus.innerText = 'É obrigatório anexar o PDF da anamnese no sistema para salvar o pet.';

    if (animalId) {
        const animal = animalsData.find(a => a.id === animalId);
        if (animal) {
            document.getElementById('animal-id').value = animal.id;
            document.getElementById('animal-name').value = animal.name;
            document.getElementById('animal-species').value = animal.species;
            document.getElementById('animal-breed').value = animal.breed;
            document.getElementById('animal-blood').value = animal.blood || '';
            document.getElementById('animal-age').value = animal.age;
            document.getElementById('animal-last-collection').value = animal.lastCollectionDate || '';
            document.getElementById('animal-donated-amount').value = animal.donatedAmount || '';
            document.getElementById('animal-owner').value = animal.owner;
            document.getElementById('animal-notes').value = animal.notes || '';
            if (animal.anamnesisPdf) {
                pdfStatus.innerHTML = `<span class="field-status field-status--success">PDF da anamnese já anexado. Envie outro apenas para substituir.</span>`;
            }
            document.getElementById('animal-modal-title').innerText = 'Editar Informações do Pet';
        }
    }
    openModal('animal-modal');
}

function editAnimal(id) {
    openAnimalModal(id);
}

function deleteAnimal(id) {
    if (confirm('Deseja realmente remover este pet?')) {
        animalsData = animalsData.filter(a => a.id !== id);
        saveData();
        renderAnimals();
        if (currentUser && currentUser.role === 'tutor') renderTutorArea();
        showToast('Pet removido com sucesso.');
    }
}

function saveAnimal(e) {
    e.preventDefault();
    if (!currentUser) return;

    const id = document.getElementById('animal-id').value;
    const fileInput = document.getElementById('animal-photo-file');
    const pdfFileInput = document.getElementById('animal-pdf-file');
    
    let photoUrl = '';
    let existingNotes = '';
    let existingPdf = '';
    const existing = animalsData.find(a => a.id == id);
    if (existing) {
        photoUrl = existing.photo;
        existingNotes = existing.notes;
        existingPdf = existing.anamnesisPdf || '';
    }

    if (!existingPdf && (!pdfFileInput.files || !pdfFileInput.files[0])) {
        alert('Aviso do Sistema: É obrigatório anexar o PDF da Anamnese Veterinária para efetuar o cadastro!');
        return;
    }

    const processAnimalData = (imgUrl, pdfUrl) => {
        const ownerVal = currentUser.role === 'tutor' ? currentUser.name : document.getElementById('animal-owner').value;
        const notesVal = document.getElementById('animal-notes').value || existingNotes;
        const finalPdf = pdfUrl || existingPdf;

        const data = {
            name: document.getElementById('animal-name').value,
            species: document.getElementById('animal-species').value,
            breed: document.getElementById('animal-breed').value,
            blood: document.getElementById('animal-blood').value,
            age: document.getElementById('animal-age').value,
            lastCollectionDate: document.getElementById('animal-last-collection').value,
            donatedAmount: document.getElementById('animal-donated-amount').value,
            owner: ownerVal,
            photo: imgUrl || 'assets/hero-pets.svg',
            notes: notesVal,
            anamnesisPdf: finalPdf
        };

        if (id) {
            const index = animalsData.findIndex(a => a.id == id);
            if (index !== -1) {
                animalsData[index] = { id: Number(id), ...data };
                showToast('Pet e Anamnese atualizados com sucesso!');
            }
        } else {
            const newId = animalsData.length > 0 ? Math.max(...animalsData.map(a => a.id)) + 1 : 1;
            animalsData.push({ id: newId, ...data });
            showToast('Novo pet cadastrado com Anamnese anexada!');
        }

        saveData();
        closeModal('animal-modal');
        renderAnimals();
        if (currentUser && currentUser.role === 'tutor') renderTutorArea();
    };

    const handlePdfAndPhoto = (imgResult) => {
        if (pdfFileInput && pdfFileInput.files && pdfFileInput.files[0]) {
            const pdfReader = new FileReader();
            pdfReader.onload = function(ev) {
                processAnimalData(imgResult, ev.target.result);
            };
            pdfReader.readAsDataURL(pdfFileInput.files[0]);
        } else {
            processAnimalData(imgResult, existingPdf);
        }
    };

    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) { handlePdfAndPhoto(e.target.result); };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        handlePdfAndPhoto(photoUrl);
    }
}

function checkAppointmentConflict(dateVal, currentId = null) {
    if (!dateVal) return false;
    return appointmentsData.some(appt => {
        if (currentId && appt.id == currentId) return false;
        return appt.date === dateVal;
    });
}

function checkAvailabilityNotice() {
    const inputVal = document.getElementById('appt-date').value;
    const currentApptId = document.getElementById('appt-id').value;
    const noticeEl = document.getElementById('availability-notice');
    if (!inputVal) {
        noticeEl.classList.add('hidden');
        return;
    }

    const selectedDate = new Date(inputVal);
    const dayOfWeek = selectedDate.getDay();
    const hours = selectedDate.getHours();

    noticeEl.classList.remove('hidden');

    const isOccupied = checkAppointmentConflict(inputVal, currentApptId);

    if (isOccupied) {
        noticeEl.className = 'availability-notice availability-notice--occupied';
        noticeEl.innerHTML = `<strong>Data e horário ocupados.</strong> Já existe uma consulta cadastrada neste exato horário. Escolha outro momento.`;
    } else if (dayOfWeek === 0 || dayOfWeek === 6) {
        noticeEl.className = 'availability-notice availability-notice--unavailable';
        noticeEl.innerHTML = `<strong>Dia indisponível.</strong> A Clínica Escola atende de segunda a sexta. Selecione outro dia.`;
    } else if (hours < 8 || hours >= 17) {
        noticeEl.className = 'availability-notice availability-notice--after-hours';
        noticeEl.innerHTML = `<strong>Fora do horário de atendimento.</strong> O atendimento ocorre entre 08h e 17h. O horário escolhido poderá requerer confirmação especial.`;
    } else {
        noticeEl.className = 'availability-notice availability-notice--available';
        noticeEl.innerHTML = `<strong>Horário disponível.</strong> Data e horário disponíveis para agendamento.`;
    }
}

function renderAppointments() {
    const tbody = document.getElementById('appointments-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    let listToRender = appointmentsData;
    if (currentUser && currentUser.role === 'tutor') {
        listToRender = appointmentsData.filter(a => a.owner.toLowerCase() === currentUser.name.toLowerCase());
    }
    const appointmentsTotal = document.getElementById('appointments-total');
    if (appointmentsTotal) {
        appointmentsTotal.innerText = listToRender.length;
        const stat = appointmentsTotal.closest('.page-stat');
        if (stat) stat.classList.toggle('hidden', listToRender.length === 0);
    }

    if (listToRender.length === 0) {
        tbody.innerHTML = `<tr class="table-empty"><td colspan="6">Nenhuma consulta agendada para o seu perfil.</td></tr>`;
        return;
    }

    listToRender.forEach(appt => {
        const isAdmin = currentUser && currentUser.role === 'admin';
        const isOwnerTutor = currentUser && currentUser.role === 'tutor' && appt.owner.toLowerCase() === currentUser.name.toLowerCase();
        
        const tr = document.createElement('tr');
        tr.className = 'appointment-row';
        tr.innerHTML = `
            <td data-label="Animal">${appt.animal}</td>
            <td data-label="Tutor">${appt.owner}</td>
            <td data-label="Serviço">${appt.service}</td>
            <td data-label="Data e horário">${appt.date.replace('T', ' ')}</td>
            <td data-label="Status">
                <span class="status-badge ${appt.status === 'Confirmado' ? 'status-badge--confirmed' : 'status-badge--pending'}">${appt.status}</span>
            </td>
            <td data-label="Ações">
                <div class="appointment-actions">
                ${isAdmin ? `
                    <button type="button" onclick="toggleApptStatus(${appt.id})">Alternar status</button>
                    <button type="button" class="danger-action" onclick="deleteAppt(${appt.id})">Excluir</button>
                ` : isOwnerTutor ? `
                    <button type="button" onclick="openAppointmentModal(${appt.id})">Reagendar</button>
                    <button type="button" class="danger-action" onclick="deleteAppt(${appt.id})">Cancelar</button>
                ` : `<span>Agendado</span>`}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openAppointmentModal(apptId = null) {
    if (!currentUser || currentUser.role !== 'tutor') {
        openModal('login-select-modal');
        showToast('Você precisa estar logado como Tutor para agendar ou reagendar consultas.');
        return;
    }

    const select = document.getElementById('appt-animal-select');
    select.innerHTML = '';

    const myPets = animalsData.filter(a => a.owner.toLowerCase() === currentUser.name.toLowerCase());

    if (myPets.length === 0) {
        alert('Você ainda não tem nenhum pet cadastrado. Cadastre um pet primeiro!');
        switchTab('tutor-area');
        return;
    }

    myPets.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.name;
        opt.innerText = `${a.name} (Espécie: ${a.species} - Sangue: ${a.blood || 'N/I'})`;
        select.appendChild(opt);
    });

    document.getElementById('appt-owner').value = currentUser.name;
    document.getElementById('appt-id').value = '';
    document.getElementById('appt-service').value = '';
    document.getElementById('appt-date').value = '';
    document.getElementById('availability-notice').classList.add('hidden');

    if (apptId) {
        const appt = appointmentsData.find(a => a.id === apptId);
        if (appt) {
            document.getElementById('appt-id').value = appt.id;
            select.value = appt.animal;
            document.getElementById('appt-service').value = appt.service;
            document.getElementById('appt-date').value = appt.date;
            checkAvailabilityNotice();
        }
    }

    openModal('appointment-modal');
}

function saveAppointment(e) {
    e.preventDefault();
    if (!currentUser || currentUser.role !== 'tutor') {
        showToast('Acesso negado.');
        return;
    }

    const id = document.getElementById('appt-id').value;
    const animalName = document.getElementById('appt-animal-select').value;
    const serviceVal = document.getElementById('appt-service').value;
    const dateVal = document.getElementById('appt-date').value;

    const selectedDate = new Date(dateVal);
    if (selectedDate.getDay() === 0 || selectedDate.getDay() === 6) {
        alert('Atenção: Não há atendimentos aos finais de semana. Por favor escolha um dia útil!');
        return;
    }

    if (checkAppointmentConflict(dateVal, id)) {
        alert('Erro ao Agendar: Esta data e horário já estão ocupados por outra consulta! Escolha um horário vago.');
        return;
    }

    if (id) {
        const appt = appointmentsData.find(a => a.id == id);
        if (appt) {
            appt.animal = animalName;
            appt.service = serviceVal;
            appt.date = dateVal;
            appt.status = 'Pendente';
            showToast('Consulta reagendada com sucesso!');
        }
    } else {
        const newAppt = {
            id: appointmentsData.length > 0 ? Math.max(...appointmentsData.map(a => a.id)) + 1 : 1,
            animal: animalName,
            owner: currentUser.name,
            service: serviceVal,
            date: dateVal,
            status: 'Pendente'
        };
        appointmentsData.push(newAppt);
        showToast('Consulta agendada com sucesso!');
    }

    saveData();
    closeModal('appointment-modal');
    renderAppointments();
}

function toggleApptStatus(id) {
    const appt = appointmentsData.find(a => a.id === id);
    if (appt) {
        appt.status = appt.status === 'Confirmado' ? 'Pendente' : 'Confirmado';
        saveData();
        renderAppointments();
    }
}

function deleteAppt(id) {
    appointmentsData = appointmentsData.filter(a => a.id !== id);
    saveData();
    renderAppointments();
    showToast('Consulta cancelada com sucesso.');
}

function renderClinics() {
    const grid = document.getElementById('clinics-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const clinicsTotal = document.getElementById('clinics-total');
    if (clinicsTotal) {
        clinicsTotal.innerText = clinicsData.length;
        const stat = clinicsTotal.closest('.page-stat');
        if (stat) stat.classList.toggle('hidden', clinicsData.length === 0);
    }
    updateHomeMetrics();

    if (clinicsData.length === 0) {
        grid.innerHTML = `<div class="empty-state"><strong>Nenhuma clínica parceira cadastrada.</strong><p>A rede será exibida aqui quando houver cadastros.</p></div>`;
        return;
    }

    clinicsData.forEach(clinic => {
        const isAdmin = currentUser && currentUser.role === 'admin';

        const card = document.createElement('article');
        card.className = 'clinic-card';
        card.innerHTML = `
            <div class="clinic-card__content">
                <div class="clinic-card__top">
                    <p class="eyebrow">Campina Grande · PB</p>
                    <span class="clinic-status">${clinic.status}</span>
                </div>
                <h2>${clinic.name}</h2>
                <p>Parceira cadastrada na rede de requisições de doadores.</p>
                <div class="clinic-card__details">
                    <p><strong>CRMV:</strong> ${clinic.crmv || 'Não informado'} · <strong>CNPJ:</strong> ${clinic.cnpj || 'Não informado'}</p>
                    <p><strong>Endereço:</strong> ${clinic.address || 'Não informado'}</p>
                    <p><strong>Telefone:</strong> ${clinic.phone || 'Não informado'}</p>
                    <p><strong>E-mail:</strong> ${clinic.email}</p>
                </div>
            </div>
            ${isAdmin ? `
                <div class="clinic-card__actions">
                    <button type="button" class="danger-action" onclick="deleteClinic(${clinic.id})">Excluir clínica parceira</button>
                </div>
            ` : ''}
        `;
        grid.appendChild(card);
    });
}

function deleteClinic(id) {
    if (confirm('Deseja realmente remover esta clínica parceira da rede?')) {
        clinicsData = clinicsData.filter(c => c.id !== id);
        saveData();
        renderClinics();
        showToast('Clínica parceira removida com sucesso.');
    }
}

function openClinicContactModalWithAnimal(animalName) {
    openClinicContactModal();
    const select = document.getElementById('cc-animal-select');
    if (select) select.value = animalName;
}

function openClinicContactModal() {
    if (!currentUser || currentUser.role !== 'clinic') {
        showToast('Acesso restrito a clínicas parceiras logadas.');
        return;
    }

    const select = document.getElementById('cc-animal-select');
    select.innerHTML = '';

    if (animalsData.length === 0) {
        select.innerHTML = `<option value="">Nenhum animal cadastrado no sistema</option>`;
    } else {
        animalsData.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.name;
            opt.innerText = `${a.name} (Espécie: ${a.species} - Sangue: ${a.blood || 'N/I'})`;
            select.appendChild(opt);
        });
    }

    document.getElementById('cc-subject').value = '';
    document.getElementById('cc-message').value = '';
    openModal('clinic-contact-modal');
}

function submitClinicContact(e) {
    e.preventDefault();
    const animalAssociated = document.getElementById('cc-animal-select').value;
    const subject = document.getElementById('cc-subject').value;
    const message = document.getElementById('cc-message').value;

    const newContact = {
        id: clinicContacts.length > 0 ? Math.max(...clinicContacts.map(c => c.id)) + 1 : 1,
        clinicName: currentUser.name,
        animal: animalAssociated,
        subject: subject,
        message: `Animal Associado: ${animalAssociated} | ${message}`,
        date: new Date().toISOString().slice(0, 16).replace('T', ' '),
        status: 'Requisição de Doador Enviada à Coordenação'
    };

    clinicContacts.push(newContact);
    saveData();
    renderClinicContactsList();
    closeModal('clinic-contact-modal');
    showToast('Requisição de doador associada ao animal enviada com sucesso!');
}

function renderClinicContactsList() {
    const listContainer = document.getElementById('clinic-requests-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const myContacts = clinicContacts.filter(c => currentUser && c.clinicName.toLowerCase() === currentUser.name.toLowerCase());

    if (myContacts.length === 0) {
        listContainer.innerHTML = `<p class="request-empty">Nenhuma requisição de doador enviada até o momento.</p>`;
        return;
    }

    const recentContacts = myContacts.slice(-5).reverse();

    recentContacts.forEach(item => {
        const div = document.createElement('div');
        div.className = 'request-card';
        div.innerHTML = `
            <div class="request-heading">
                <span>${item.subject}</span>
                <span class="request-status">${item.status}</span>
            </div>
            <p>${item.message}</p>
            <span class="request-date">Enviado em: ${item.date}</span>
        `;
        listContainer.appendChild(div);
    });
}

function showToast(message) {
    const existingToast = document.getElementById('toast-notification');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = 'toast-notification';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('is-leaving');
            setTimeout(() => toast.remove(), 300);
        }
    }, 3500);
}

function selectProfileTab(profile) {
    document.querySelectorAll('[data-profile-tab]').forEach(tab => {
        const selected = tab.dataset.profileTab === profile;
        tab.classList.toggle('is-selected', selected);
        tab.setAttribute('aria-selected', String(selected));
        tab.setAttribute('tabindex', selected ? '0' : '-1');
    });

    document.querySelectorAll('[data-profile-panel]').forEach(panel => {
        panel.classList.toggle('hidden', panel.dataset.profilePanel !== profile);
    });
}

function handleProfileTabKeydown(event) {
    const tabs = [...document.querySelectorAll('[data-profile-tab]')];
    const currentIndex = tabs.indexOf(event.currentTarget);
    let nextIndex = currentIndex;

    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabs.length - 1;
    else return;

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    selectProfileTab(nextTab.dataset.profileTab);
    nextTab.focus();
}

function handleModalKeyboard(event) {
    const modal = document.querySelector('.modal-backdrop:not(.hidden)');
    if (!modal) return;

    if (event.key === 'Escape') {
        closeModal(modal.id);
        return;
    }

    if (event.key !== 'Tab') return;
    const focusable = [...modal.querySelectorAll('button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), a[href]')]
        .filter(element => element.offsetParent !== null);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

window.onload = function() {
    document.addEventListener('keydown', handleModalKeyboard);
    document.querySelectorAll('[data-profile-tab]').forEach(tab => {
        tab.addEventListener('click', () => selectProfileTab(tab.dataset.profileTab));
        tab.addEventListener('keydown', handleProfileTabKeydown);
        tab.setAttribute('tabindex', tab.getAttribute('aria-selected') === 'true' ? '0' : '-1');
    });
    selectProfileTab('tutor');
    updateAuthUI();
    renderAnimals();
    renderAppointments();
    renderClinics();
    updateHomeMetrics();
}
