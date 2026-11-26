let currentUser = JSON.parse(localStorage.getItem('vet_current_user')) || null;

let animalsData = JSON.parse(localStorage.getItem('vet_animals')) || [];
let appointmentsData = JSON.parse(localStorage.getItem('vet_appointments')) || [];
let clinicsData = JSON.parse(localStorage.getItem('vet_clinics')) || [];
let clinicContacts = JSON.parse(localStorage.getItem('vet_clinic_contacts')) || [];

const DEFAULT_PET_PHOTO = 'pet-placeholder.svg';
const INSTITUTIONAL_DOMAIN = '@sempreuninassau.com.br';

function isInstitutionalEmail(email) {
    return typeof email === 'string' && email.toLowerCase().endsWith(INSTITUTIONAL_DOMAIN);
}

function petPhoto(animal) {
    const p = animal && animal.photo;
    if (!p || p.includes('images.unsplash.com/photo-1543466835')) return DEFAULT_PET_PHOTO;
    return p;
}

function saveData() {
    localStorage.setItem('vet_current_user', JSON.stringify(currentUser));
    localStorage.setItem('vet_animals', JSON.stringify(animalsData));
    localStorage.setItem('vet_appointments', JSON.stringify(appointmentsData));
    localStorage.setItem('vet_clinics', JSON.stringify(clinicsData));
    localStorage.setItem('vet_clinic_contacts', JSON.stringify(clinicContacts));
}


/* ==========================================================================
   2. AUTENTICAÇÃO (auth.js)
   ========================================================================== */
function openLoginModalForRole(role) {
    document.getElementById('login-target-role').value = role;
    const titleEl = document.getElementById('login-modal-title');
    const emailInput = document.getElementById('login-email');
    if (role === 'tutor') {
        titleEl.innerText = 'Entrar como Tutor';
        emailInput.placeholder = 'seu.email@exemplo.com';
    }
    if (role === 'admin') {
        titleEl.innerText = 'Entrar como Coordenação / Médico Veterinário';
        emailInput.placeholder = 'medico@sempreuninassau.com.br';
    }
    if (role === 'clinic') {
        titleEl.innerText = 'Entrar como Clínica Parceira';
        emailInput.placeholder = 'contato@clinica.com';
    }
    openModal('login-modal');
}

function handleLogin(e) {
    e.preventDefault();
    const role = document.getElementById('login-target-role').value;
    const email = document.getElementById('login-email').value.trim();

    if (role === 'admin') {
        if (!isInstitutionalEmail(email)) {
            alert('Para acessar como Coordenação / Médico Veterinário, utilize um e-mail institucional @sempreuninassau.com.br.');
            return;
        }
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

function handleSignup(e, roleType) {
    e.preventDefault();

    if (roleType === 'tutor') {
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;

        if (password !== confirmPassword) {
            alert('As senhas não coincidem!');
            return;
        }

        currentUser = { name: name, email: email, role: 'tutor' };
        saveData();
        updateAuthUI();
        closeModal('signup-modal');
        document.getElementById('signup-form').reset();
        showToast('Conta de tutor criada com sucesso!');
        switchTab('tutor-area');
    } else if (roleType === 'admin') {
        const name = document.getElementById('admin-signup-name').value.trim();
        const email = document.getElementById('admin-signup-email').value.trim();

        if (!isInstitutionalEmail(email)) {
            alert('O cadastro institucional exige um e-mail @sempreuninassau.com.br.');
            return;
        }

        currentUser = { name: name, email: email, role: 'admin' };
        saveData();
        updateAuthUI();
        closeModal('admin-signup-modal');
        document.getElementById('admin-signup-form').reset();
        showToast('Cadastro institucional realizado com sucesso!');
        switchTab('animals');
    } else if (roleType === 'clinic') {
        const name = document.getElementById('cs-name').value.trim();
        const cnpj = document.getElementById('cs-cnpj').value.trim();
        const crmv = document.getElementById('cs-crmv').value.trim();
        const email = document.getElementById('cs-email').value.trim();
        const phone = document.getElementById('cs-phone').value.trim();
        const address = document.getElementById('cs-address').value.trim();

        const newClinic = {
            id: clinicsData.length > 0 ? Math.max(...clinicsData.map(c => c.id)) + 1 : 1,
            name: name,
            cnpj: cnpj,
            crmv: crmv,
            email: email,
            phone: phone,
            address: address,
            status: 'Parceiro Credenciado'
        };
        clinicsData.push(newClinic);

        if (currentUser && currentUser.role === 'admin') {
            saveData();
            updateAuthUI();
            closeModal('clinic-signup-modal');
            document.getElementById('clinic-signup-form').reset();
            showToast('Clínica parceira cadastrada com sucesso!');
            renderClinics();
        } else {
            currentUser = { name: newClinic.name, email: newClinic.email, role: 'clinic', clinicId: newClinic.id };
            saveData();
            updateAuthUI();
            closeModal('clinic-signup-modal');
            document.getElementById('clinic-signup-form').reset();
            showToast('Clínica cadastrada e logada com sucesso!');
            switchTab('animals');
        }
    }
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
    const btnRegisterClinic = document.getElementById('btn-register-clinic');
    const btnOpenAppointment = document.getElementById('btn-open-appointment');
    const navTutorBtn = document.getElementById('nav-tutor-area');
    const mobileTutorBtn = document.getElementById('mobile-nav-tutor');

    const navAnimals = document.getElementById('nav-animals');
    const mobileNavAnimals = document.getElementById('mobile-nav-animals');
    const navAppointments = document.getElementById('nav-appointments');
    const mobileNavAppointments = document.getElementById('mobile-nav-appointments');
    const navClinics = document.getElementById('nav-clinics');
    const mobileNavClinics = document.getElementById('mobile-nav-clinics');
    const footerNavClinics = document.getElementById('footer-nav-clinics');

    if (currentUser) {
        let badge = 'Tutor';
        if (currentUser.role === 'admin') badge = 'Coordenação / Admin';
        if (currentUser.role === 'clinic') badge = 'Clínica Parceira';

        authArea.innerHTML = `
            <div class="user-chip">
                <span class="user-chip__name">${currentUser.name}</span>
                <span class="user-chip__role">${badge}</span>
            </div>
            <button onclick="logout()" class="btn btn--outline btn--sm">Sair</button>
        `;

        if (btnRegisterClinic) {
            if (currentUser.role === 'admin') {
                btnRegisterClinic.classList.remove('hidden');
            } else {
                btnRegisterClinic.classList.add('hidden');
            }
        }

        if (btnOpenAppointment) {
            btnOpenAppointment.classList.toggle('hidden', currentUser.role !== 'tutor');
        }

        const canSeeClinics = currentUser.role === 'admin' || currentUser.role === 'clinic';
        if (navClinics) navClinics.classList.toggle('hidden', !canSeeClinics);
        if (mobileNavClinics) mobileNavClinics.classList.toggle('hidden', !canSeeClinics);
        if (footerNavClinics) footerNavClinics.classList.toggle('hidden', !canSeeClinics);

        if (currentUser.role === 'tutor') {
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
            if (navTutorBtn) navTutorBtn.classList.add('hidden');
            if (mobileTutorBtn) mobileTutorBtn.classList.add('hidden');

            if (navAnimals) navAnimals.classList.remove('hidden');
            if (mobileNavAnimals) mobileNavAnimals.classList.remove('hidden');

            if (navAppointments) navAppointments.classList.add('hidden');
            if (mobileNavAppointments) mobileNavAppointments.classList.add('hidden');

            if (tutorRestrictedBanner) tutorRestrictedBanner.classList.add('hidden');
            if (tutorNotice) tutorNotice.classList.add('hidden');
            if (clinicFiltersPanel) clinicFiltersPanel.classList.remove('hidden');

        } else {
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
        authArea.innerHTML = `
            <button onclick="openModal('login-select-modal')" class="btn btn--ghost btn--sm">Entrar</button>
            <button onclick="openModal('signup-select-modal')" class="btn btn--dark btn--sm auth-signup">Cadastrar</button>
        `;

        if (btnRegisterClinic) btnRegisterClinic.classList.add('hidden');
        if (btnOpenAppointment) btnOpenAppointment.classList.add('hidden');

        if (navTutorBtn) navTutorBtn.classList.add('hidden');
        if (mobileTutorBtn) mobileTutorBtn.classList.add('hidden');

        if (navAnimals) navAnimals.classList.add('hidden');
        if (mobileNavAnimals) mobileNavAnimals.classList.add('hidden');

        if (navAppointments) navAppointments.classList.add('hidden');
        if (mobileNavAppointments) mobileNavAppointments.classList.add('hidden');

        if (navClinics) navClinics.classList.add('hidden');
        if (mobileNavClinics) mobileNavClinics.classList.add('hidden');
        if (footerNavClinics) footerNavClinics.classList.add('hidden');

        if (tutorNotice) tutorNotice.classList.remove('hidden');
        if (tutorRestrictedBanner) tutorRestrictedBanner.classList.add('hidden');
        if (clinicFiltersPanel) clinicFiltersPanel.classList.add('hidden');
        if (clinicPortalBox) clinicPortalBox.classList.add('hidden');
    }
    renderAppointments();
    renderClinics();
}


/* ==========================================================================
   3. NAVEGAÇÃO (navigation.js)
   ========================================================================== */
function switchTab(tabId) {
    const restrictedTabs = ['animals', 'tutor-area', 'appointments', 'clinics'];
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

    if (tabId === 'clinics' && (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'clinic'))) {
        showToast('Acesso restrito: Apenas Coordenação e Clínicas Parceiras podem acessar esta aba.');
        switchTab(currentUser && currentUser.role === 'tutor' ? 'tutor-area' : 'home');
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
    document.querySelectorAll('.nav-btn, .mobile-link').forEach(el => el.classList.remove('is-active'));

    const selectedTab = document.getElementById(`tab-${tabId}`);
    if (selectedTab) selectedTab.classList.remove('hidden');

    const selectedNav = document.getElementById(`nav-${tabId}`);
    if (selectedNav) selectedNav.classList.add('is-active');
    const selectedMobile = document.querySelector(`.mobile-link[data-tab="${tabId}"]`);
    if (selectedMobile) selectedMobile.classList.add('is-active');

    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (tabId === 'clinics') renderClinics();
    if (tabId === 'tutor-area') renderTutorArea();
    if (tabId === 'animals') renderAnimals();
    if (tabId === 'appointments') renderAppointments();
    if (tabId === 'home') renderHomeStats();
}


/* ==========================================================================
   4. HOME (home.js)
   ========================================================================== */
function renderHomeStats() {
    const set = (key, total) => {
        const box = document.getElementById(`stat-${key}`);
        const num = document.querySelector(`[data-stat="${key}"]`);
        if (!box || !num) return;
        num.innerText = total;
        box.classList.toggle('hidden', total === 0);
    };
    set('animals', animalsData.length);
    set('clinics', clinicsData.length);
    set('appointments', appointmentsData.length);

    const partners = document.getElementById('home-partners');
    if (!partners) return;
    if (clinicsData.length === 0) {
        partners.innerHTML = `<div class="partners__fallback"><img src="logo-clinica.png" alt=""><span>UNINASSAU · Medicina Veterinária CG</span></div>`;
        return;
    }
    partners.innerHTML = clinicsData.map(c => `<span class="chip">${c.name}</span>`).join('');
}

function selectProfileTab(role) {
    ['tutor', 'clinic', 'admin'].forEach(r => {
        const tab = document.getElementById(`ptab-${r}`);
        const panel = document.getElementById(`ppanel-${r}`);
        if (tab) tab.setAttribute('aria-selected', r === role ? 'true' : 'false');
        if (panel) panel.classList.toggle('hidden', r !== role);
    });
}


/* ==========================================================================
   5. CLÍNICAS (clinics.js)
   ========================================================================== */
function renderClinics() {
    const grid = document.getElementById('clinics-grid');
    if (!grid) return;
    grid.innerHTML = '';

    let listToRender = clinicsData;

    if (currentUser && currentUser.role === 'clinic') {
        listToRender = clinicsData.filter(c =>
            (currentUser.clinicId && c.id === currentUser.clinicId) ||
            (c.email && currentUser.email && c.email.toLowerCase() === currentUser.email.toLowerCase()) ||
            (c.name && currentUser.name && c.name.toLowerCase() === currentUser.name.toLowerCase())
        );

        if (listToRender.length === 0) {
            listToRender = [{
                id: currentUser.clinicId || 0,
                name: currentUser.name,
                email: currentUser.email,
                status: 'Parceiro Credenciado'
            }];
        }
    }

    if (listToRender.length === 0) {
        grid.innerHTML = `<div class="empty-state"><span class="empty-state__icon">${icon('building-2')}</span><p>Nenhuma clínica parceira cadastrada no momento.</p></div>`;
        return;
    }

    listToRender.forEach(clinic => {
        const isAdmin = currentUser && currentUser.role === 'admin';

        const card = document.createElement('article');
        card.className = 'clinic-card';
        card.innerHTML = `
            <div>
                <div class="clinic-card__top">
                    <span class="chip">Campina Grande - PB</span>
                    <span class="badge badge--ok">${clinic.status}</span>
                </div>
                <h3>${clinic.name}</h3>
                <p class="clinic-card__desc">Parceiro credenciado com requisições e transferências integradas.</p>
                <ul class="facts">
                    <li>${icon('id-card')}<span>${clinic.crmv || 'CRMV-PB'} · CNPJ: ${clinic.cnpj || 'Cadastrado'}</span></li>
                    <li>${icon('map-pin')}<span>${clinic.address || 'Campina Grande - PB'}</span></li>
                    <li>${icon('phone')}<span>${clinic.phone || '(83) 3300-0000'}</span></li>
                    <li>${icon('mail')}<span>${clinic.email}</span></li>
                </ul>
            </div>
            ${isAdmin ? `
                <div class="clinic-card__foot">
                    <button onclick="deleteClinic(${clinic.id})" class="btn btn--danger-soft btn--sm">${icon('trash-2')} Excluir Clínica Parceira</button>
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


/* ==========================================================================
   6. CONTACTOS DE CLÍNICAS (clinic-contacts.js)
   ========================================================================== */
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
        div.className = 'request-item';
        div.innerHTML = `
            <div class="request-item__top">
                <strong>${item.subject}</strong>
                <span class="request-item__status">${item.status}</span>
            </div>
            <p>${item.message}</p>
            <small>Enviado em: ${item.date}</small>
        `;
        listContainer.appendChild(div);
    });
}


/* ==========================================================================
   7. ANIMAIS (animals.js)
   ========================================================================== */
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

    if (currentUser && currentUser.role === 'tutor') {
        grid.innerHTML = `<div class="empty-state empty-state--warn">
            <span class="empty-state__icon">${icon('lock')}</span>
            <p>A visualização de animais cadastrados por outros tutores é restrita. Acesse a aba <strong>"Minha Conta (Tutor)"</strong> para ver seus pets.</p>
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
        grid.innerHTML = `<div class="empty-state"><span class="empty-state__icon">${icon('search')}</span><p>Nenhum animal ou doador encontrado com os filtros atuais.</p></div>`;
        return;
    }

    filtered.forEach(animal => {
        const isClinic = currentUser && currentUser.role === 'clinic';
        const isAdmin = currentUser && currentUser.role === 'admin';
        const canManage = isAdmin;

        const card = document.createElement('article');
        card.className = 'pet-card';
        const photoUrl = petPhoto(animal);

        if (isClinic) {
            card.innerHTML = `
                <div class="pet-card__media">
                    <img src="${photoUrl}" alt="${animal.name}" loading="lazy">
                    <span class="pet-card__species">${animal.species}</span>
                    <span class="pet-card__tag">${icon('hospital')} Acesso Restrito Clínica</span>
                </div>
                <div class="pet-card__body">
                    <div class="pet-card__top">
                        <div>
                            <h3 class="pet-card__name">${animal.name}</h3>
                            <p class="pet-card__sub">Animal: ${animal.species} (${animal.breed}) · ${animal.age}</p>
                        </div>
                        <span class="blood-seal">${icon('droplet')} ${animal.blood || 'Não inform.'}</span>
                    </div>
                    <div class="fact-box">
                        <ul class="facts">
                            <li>${icon('calendar-check')}<span>Data da Última Coleta: <b>${animal.lastCollectionDate || 'Não informada'}</b></span></li>
                            <li>${icon('test-tube')}<span>Quantidade de Sangue Doado: <b>${animal.donatedAmount || 'Não informada'}</b></span></li>
                        </ul>
                    </div>
                    <div>
                        <p class="label">Informações de Anamnese</p>
                        <p class="fact-note">${animal.notes || 'Anamnese arquivada no sistema.'}</p>
                    </div>
                    ${animal.anamnesisPdf ? `
                        <a href="${animal.anamnesisPdf}" target="_blank" rel="noopener" class="pdf-link">${icon('file-text')} Visualizar Anamnese Completa (PDF)</a>
                    ` : `<span class="pdf-missing">${icon('triangle-alert')} Anamnese em auditoria.</span>`}
                </div>
                <div class="pet-card__footer pet-card__footer--cta">
                    <button onclick="openClinicContactModalWithAnimal('${animal.name}')" class="btn btn--dark btn--sm">${icon('send')} Requisitar Doador para este Animal</button>
                </div>
            `;
            grid.appendChild(card);
            return;
        }

        card.innerHTML = `
            <div class="pet-card__media">
                <img src="${photoUrl}" alt="${animal.name}" loading="lazy">
                <span class="pet-card__species">${animal.species}</span>
            </div>
            <div class="pet-card__body">
                <div class="pet-card__top">
                    <div>
                        <h3 class="pet-card__name">${animal.name}</h3>
                        <p class="pet-card__sub">${animal.breed} · ${animal.age}</p>
                    </div>
                    <span class="blood-seal">${icon('droplet')} ${animal.blood || 'Não inform.'}</span>
                </div>
                <ul class="facts">
                    <li>${icon('user-round')}<span>Tutor: <b>${animal.owner}</b></span></li>
                    <li>${icon('calendar-check')}<span>Última Coleta: <b>${animal.lastCollectionDate || 'N/A'}</b></span></li>
                    <li>${icon('test-tube')}<span>Qtd. Doada: <b>${animal.donatedAmount || 'N/A'}</b></span></li>
                    <li>${icon('clipboard-list')}<span>${animal.notes || 'Sem observações.'}</span></li>
                </ul>
                ${animal.anamnesisPdf ? `
                    <a href="${animal.anamnesisPdf}" target="_blank" rel="noopener" class="pdf-link">${icon('file-text')} Visualizar Anamnese (PDF)</a>
                ` : `<span class="pdf-missing">${icon('triangle-alert')} PDF Pendente.</span>`}
            </div>
            ${canManage ? `
                <div class="pet-card__footer">
                    <button onclick="editAnimal(${animal.id})" class="btn btn--soft btn--sm">${icon('pencil')} Editar</button>
                    <button onclick="deleteAnimal(${animal.id})" class="btn btn--danger-soft btn--sm">${icon('trash-2')} Excluir</button>
                </div>
            ` : ''}
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
                pdfStatus.innerHTML = `<span class="ok">${icon('circle-check')} PDF da Anamnese já anexado. (Envie outro apenas para substituir)</span>`;
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
            photo: imgUrl || DEFAULT_PET_PHOTO,
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


/* ==========================================================================
   8. CONSULTAS (appointments.js)
   ========================================================================== */
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
        noticeEl.className = 'notice notice--bad';
        noticeEl.innerHTML = `${icon('triangle-alert')}<div><strong>Data e Horário Ocupados!</strong> Já existe uma consulta cadastrada neste exato horário. Escolha outro momento.</div>`;
    } else if (dayOfWeek === 0 || dayOfWeek === 6) {
        noticeEl.className = 'notice notice--bad';
        noticeEl.innerHTML = `${icon('calendar-x')}<div><strong>Dia Indisponível:</strong> O atendimento na Clínica Escola funciona exclusivamente de Segunda a Sexta. Por favor, selecione outro dia.</div>`;
    } else if (hours < 8 || hours >= 17) {
        noticeEl.className = 'notice notice--warn';
        noticeEl.innerHTML = `${icon('clock')}<div><strong>Horário Fora de Expediente:</strong> Atendimentos ocorrem entre 08:00 e 17:00. O horário escolhido poderá requerer confirmação especial.</div>`;
    } else {
        noticeEl.className = 'notice notice--ok';
        noticeEl.innerHTML = `${icon('circle-check')}<div><strong>Horário Livre e Disponível:</strong> Data e horário disponíveis para agendamento!</div>`;
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

    if (listToRender.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="cell-empty">Nenhuma consulta agendada para o seu perfil.</td></tr>`;
        return;
    }

    listToRender.forEach(appt => {
        const isAdmin = currentUser && currentUser.role === 'admin';
        const isOwnerTutor = currentUser && currentUser.role === 'tutor' && appt.owner.toLowerCase() === currentUser.name.toLowerCase();

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="cell-strong" data-label="Animal">${appt.animal}</td>
            <td data-label="Tutor">${appt.owner}</td>
            <td data-label="Serviço / Motivo">${appt.service}</td>
            <td data-label="Data e Hora">${appt.date.replace('T', ' ')}</td>
            <td data-label="Status">
                <span class="badge ${appt.status === 'Confirmado' ? 'badge--ok' : 'badge--warn'}">${appt.status}</span>
            </td>
            <td data-label="Ações">
                <div class="table-actions">
                ${isAdmin ? `
                    <button onclick="toggleApptStatus(${appt.id})">Alternar Status</button>
                    <button onclick="deleteAppt(${appt.id})" class="is-danger">Cancelar</button>
                ` : isOwnerTutor ? `
                    <button onclick="openAppointmentModal(${appt.id})">Reagendar</button>
                    <button onclick="deleteAppt(${appt.id})" class="is-danger">Cancelar</button>
                ` : `<span class="muted">Agendado</span>`}
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


/* ==========================================================================
   9. ÁREA DO TUTOR (tutor-area.js)
   ========================================================================== */
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
    document.getElementById('tutor-pets-count').innerText = `${myPets.length} ${myPets.length === 1 ? 'pet cadastrado' : 'pets cadastrados'}`;

    if (myPets.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <span class="empty-state__icon">${icon('paw-print')}</span>
                <p>Você ainda não possui pets cadastrados.</p>
                <button onclick="openAnimalModal()" class="btn btn--dark btn--sm">Cadastrar meu primeiro Pet</button>
            </div>`;
        return;
    }

    myPets.forEach(animal => {
        const card = document.createElement('article');
        card.className = 'pet-card';
        const photoUrl = petPhoto(animal);

        card.innerHTML = `
            <div class="pet-card__media">
                <img src="${photoUrl}" alt="${animal.name}" loading="lazy">
                <span class="pet-card__species">${animal.species}</span>
            </div>
            <div class="pet-card__body">
                <div class="pet-card__top">
                    <div>
                        <h3 class="pet-card__name">${animal.name}</h3>
                        <p class="pet-card__sub">${animal.breed} · ${animal.age}</p>
                    </div>
                    <span class="blood-seal">${icon('droplet')} ${animal.blood || 'Não inform.'}</span>
                </div>
                <ul class="facts">
                    <li>${icon('calendar-check')}<span>Última Coleta: <b>${animal.lastCollectionDate || 'Sem registros'}</b></span></li>
                    <li>${icon('test-tube')}<span>Sangue Doado: <b>${animal.donatedAmount || 'Sem registros'}</b></span></li>
                </ul>
                ${animal.anamnesisPdf ? `
                    <a href="${animal.anamnesisPdf}" target="_blank" rel="noopener" class="pdf-link">${icon('file-text')} Anamnese Anexada (PDF)</a>
                ` : `<span class="pdf-missing">${icon('triangle-alert')} Anamnese pendente de anexo.</span>`}
            </div>
            <div class="pet-card__footer">
                <button onclick="editAnimal(${animal.id})" class="btn btn--soft btn--sm">${icon('pencil')} Editar</button>
                <button onclick="deleteAnimal(${animal.id})" class="btn btn--danger-soft btn--sm">${icon('trash-2')} Excluir</button>
            </div>
        `;
        grid.appendChild(card);
    });
}


/* ==========================================================================
   10. UI UTILS & INICIALIZAÇÃO (ui-common.js & main.js)
   ========================================================================== */
function icon(name) {
    return `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
}

function toggleMobileMenu() {
    document.getElementById('mobile-menu').classList.toggle('hidden');
}

function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function showToast(message) {
    const existingToast = document.getElementById('toast-notification');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = 'toast fade-in';
    toast.setAttribute('role', 'status');
    toast.innerHTML = `${icon('circle-check')}<span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }
    }, 3500);
}

window.onload = function() {
    updateAuthUI();
    renderAnimals();
    renderAppointments();
    renderClinics();
    renderHomeStats();
};

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.modal:not(.hidden)').forEach(m => closeModal(m.id));
});