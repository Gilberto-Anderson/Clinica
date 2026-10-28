let currentUser = JSON.parse(localStorage.getItem('vet_current_user')) || null;

let animalsData = JSON.parse(localStorage.getItem('vet_animals')) || [
    { 
        id: 1, 
        name: 'Thor', 
        species: 'Canino', 
        breed: 'Golden Retriever', 
        blood: 'DEA 1.1 Positivo', 
        age: '4 anos · 30 kg', 
        owner: 'Mariana Costa', 
        photo: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80', 
        notes: 'Doador apto - Vacinas em dia.', 
        anamnesisPdf: 'data:application/pdf;base64,JVBERi0xLjQKJ...', 
        lastCollectionDate: '2026-02-15', 
        donatedAmount: '450 ml' 
    },
    { 
        id: 2, 
        name: 'Luna', 
        species: 'Felino', 
        breed: 'Siamês', 
        blood: 'Tipo A', 
        age: '2 anos · 4.2 kg', 
        owner: 'Lucas Almeida', 
        photo: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80', 
        notes: 'Castrada. Histórico clínico regular.', 
        anamnesisPdf: 'data:application/pdf;base64,JVBERi0xLjQKJ...', 
        lastCollectionDate: '2026-01-10', 
        donatedAmount: '50 ml' 
    },
    { 
        id: 3, 
        name: 'Bob', 
        species: 'Canino', 
        breed: 'Bulldog Francês', 
        blood: 'DEA 4 Negativo', 
        age: '3 anos · 12 kg', 
        owner: 'Juliana Ribeiro', 
        photo: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80', 
        notes: 'Acompanhamento preventivo e elegibilidade ativa.', 
        anamnesisPdf: 'data:application/pdf;base64,JVBERi0xLjQKJ...', 
        lastCollectionDate: '2025-11-20', 
        donatedAmount: '350 ml' 
    }
];

let appointmentsData = JSON.parse(localStorage.getItem('vet_appointments')) || [
    { id: 1, animal: 'Thor', owner: 'Mariana Costa', service: 'Consulta de Rotina / Doação', date: '2026-03-25T09:30', status: 'Confirmado' }
];

let clinicsData = JSON.parse(localStorage.getItem('vet_clinics')) || [
    { id: 1, name: 'Hospital Veterinário Uninassau', crmv: 'CRMV-PB 001', email: 'hospital@uninassau.edu.br', phone: '(83) 3322-1000', address: 'Av. Mal. Floriano Peixoto, 1234 - Centro', status: 'Ativo' },
    { id: 2, name: 'Clínica Veterinária PetLife CG', crmv: 'CRMV-PB 458', email: 'contato@petlifecg.com', phone: '(83) 3333-4455', address: 'R. Aprígio Veloso, 882 - Bodocongó', status: 'Parceiro Credenciado' }
];

let clinicContacts = JSON.parse(localStorage.getItem('vet_clinic_contacts')) || [];
let pendingSignupData = null;

function saveData() {
    localStorage.setItem('vet_current_user', JSON.stringify(currentUser));
    localStorage.setItem('vet_animals', JSON.stringify(animalsData));
    localStorage.setItem('vet_appointments', JSON.stringify(appointmentsData));
    localStorage.setItem('vet_clinics', JSON.stringify(clinicsData));
    localStorage.setItem('vet_clinic_contacts', JSON.stringify(clinicContacts));
}

function switchTab(tabId) {
    const restrictedTabs = ['animals', 'tutor-area', 'appointments'];
    if (restrictedTabs.includes(tabId) && !currentUser) {
        openModal('login-select-modal');
        showToast('Acesso restrito. Faça login para navegar nas áreas protegidas.');
        return;
    }

    // Cada Tutor só poderá ver suas consultas e NÃO tem acesso à aba Animais
    if (tabId === 'animals' && currentUser && currentUser.role === 'tutor') {
        showToast('Aba desabilitada para o perfil de Tutor. Utilize seu painel exclusivo "Minha Conta".');
        switchTab('tutor-area');
        return;
    }

    // Clínicas parceiras NÃO têm acesso à aba Consultas
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
    document.querySelectorAll('.nav-btn').forEach(el => {
        el.classList.remove('bg-neutral-100', 'text-dark', 'bg-blue-50');
        el.classList.add('text-neutral-600');
    });

    const selectedTab = document.getElementById(`tab-${tabId}`);
    if (selectedTab) selectedTab.classList.remove('hidden');

    const selectedNav = document.getElementById(`nav-${tabId}`);
    if (selectedNav) {
        selectedNav.classList.remove('text-neutral-600');
        selectedNav.classList.add('bg-blue-50', 'text-dark');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (tabId === 'clinics') renderClinics();
    if (tabId === 'tutor-area') renderTutorArea();
    if (tabId === 'animals') renderAnimals();
    if (tabId === 'appointments') renderAppointments();
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

    if (role === 'admin') {
        if (email === 'admin@uninassau.edu.br' && pass === 'admin123') {
            currentUser = { name: 'Coordenador / Médico Veterinário Admin', email: email, role: 'admin' };
            saveData();
            updateAuthUI();
            closeModal('login-modal');
            showToast('Login realizado como Coordenação / Administrador!');
            switchTab('animals');
            return;
        } else {
            alert('Credenciais de Administrador inválidas! Use admin@uninassau.edu.br / admin123');
            return;
        }
    }

    if (role === 'clinic') {
        if (email.endsWith('@uninassau.edu.br')) {
            let testClinic = clinicsData.find(c => c.email.toLowerCase() === email.toLowerCase());
            if (!testClinic) {
                testClinic = {
                    id: clinicsData.length > 0 ? Math.max(...clinicsData.map(c => c.id)) + 1 : 1,
                    name: 'Clínica Escola Teste (' + email.split('@')[0] + ')',
                    crmv: 'CRMV-PB TEST',
                    email: email,
                    phone: '(83) 99999-9999',
                    address: 'Campina Grande - PB (Institucional)',
                    status: 'Parceiro Credenciado'
                };
                clinicsData.push(testClinic);
            }
            currentUser = { name: testClinic.name, email: email, role: 'clinic', clinicId: testClinic.id };
            saveData();
            updateAuthUI();
            closeModal('login-modal');
            showToast(`Acesso restrito liberado para a clínica via ${email}!`);
            switchTab('animals');
            return;
        }

        const foundClinic = clinicsData.find(c => c.email.toLowerCase() === email.toLowerCase());
        if (foundClinic) {
            currentUser = { name: foundClinic.name, email: email, role: 'clinic', clinicId: foundClinic.id };
            saveData();
            updateAuthUI();
            closeModal('login-modal');
            showToast(`Bem-vindo(a), ${foundClinic.name}! (Acesso de Clínica Parceira)`);
            switchTab('animals');
            return;
        } else {
            alert('Clínica não encontrada com este e-mail cadastrado. Use um e-mail @uninassau.edu.br para acesso teste.');
            return;
        }
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

        if (!email.endsWith('@uninassau.edu.br')) {
            alert('O cadastro da Coordenação exige e-mail institucional @uninassau.edu.br!');
            return;
        }

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

    if (currentUser) {
        let badge = '🐾 Tutor';
        if (currentUser.role === 'admin') badge = '👑 Coordenação / Admin';
        if (currentUser.role === 'clinic') badge = '🏥 Clínica Parceira';

        authArea.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="text-right hidden sm:block">
                    <span class="text-xs font-bold block">${currentUser.name}</span>
                    <span class="text-[10px] text-neutral-500 block">${badge}</span>
                </div>
                <button onclick="logout()" class="px-3 py-2 text-xs font-medium bg-neutral-100 hover:bg-neutral-200 rounded-xl transition">Sair</button>
            </div>
        `;

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

        } else { // Admin (Coordenação)
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
            <button onclick="openModal('login-select-modal')" class="px-4 py-2 text-sm font-medium text-dark border border-dark rounded-xl hover:bg-dark hover:text-white transition">Entrar</button>
            <button onclick="openModal('signup-select-modal')" class="hidden sm:inline-flex px-4 py-2 text-sm font-medium bg-nassauYellow text-slate-900 font-semibold rounded-xl hover:bg-yellow-400 transition shadow-sm">Cadastrar</button>
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

    if (currentUser && currentUser.role === 'tutor') {
        grid.innerHTML = `<div class="col-span-full py-8 text-center text-amber-700 bg-amber-50 rounded-2xl border border-amber-200 text-sm">
            <i class="fa-solid fa-lock text-2xl mb-2 block text-amber-600"></i>
            A visualização de animais cadastrados por outros tutores é restrita. Acesse a aba <strong>"Minha Conta (Tutor)"</strong> para ver seus pets.
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
        grid.innerHTML = `<div class="col-span-full py-12 text-center text-neutral-400 text-sm">Nenhum animal ou doador encontrado com os filtros atuais.</div>`;
        return;
    }

    filtered.forEach(animal => {
        const isClinic = currentUser && currentUser.role === 'clinic';
        const isAdmin = currentUser && currentUser.role === 'admin';
        const canManage = isAdmin;

        const card = document.createElement('div');
        card.className = 'bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between';
        
        const photoUrl = animal.photo || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80';

        if (isClinic) {
            card.innerHTML = `
                <div>
                    <div class="h-44 overflow-hidden bg-neutral-100 relative">
                        <img src="${photoUrl}" alt="${animal.name}" class="w-full h-full object-cover">
                        <span class="absolute top-3 right-3 text-xs font-semibold bg-dark/80 text-nassauYellow backdrop-blur px-3 py-1 rounded-full shadow-sm">
                            <i class="fa-solid fa-hospital-user mr-1"></i> Acesso Restrito Clínica
                        </span>
                    </div>
                    <div class="p-6 space-y-3">
                        <div class="flex items-center justify-between">
                            <h3 class="text-xl font-bold text-dark">${animal.name}</h3>
                            <span class="text-xs font-bold px-2.5 py-1 bg-red-50 text-red-600 rounded-full border border-red-200">
                                <i class="fa-solid fa-droplet mr-1"></i> ${animal.blood || 'Não inform.'}
                            </span>
                        </div>
                        <p class="text-xs font-medium text-neutral-600"><i class="fa-solid fa-paw mr-1 text-dark"></i> Animal: ${animal.species} (${animal.breed}) · ${animal.age}</p>
                        
                        <div class="pt-3 border-t border-border space-y-2 text-xs">
                            <div class="bg-blue-50/60 p-3 rounded-xl border border-blue-100 space-y-1">
                                <p class="text-dark font-semibold"><i class="fa-solid fa-calendar-check text-blue-600 mr-1"></i> Data da Última Coleta: <span class="font-normal">${animal.lastCollectionDate || 'Não informada'}</span></p>
                                <p class="text-dark font-semibold"><i class="fa-solid fa-vial text-red-600 mr-1"></i> Quantidade de Sangue Doado: <span class="font-normal">${animal.donatedAmount || 'Não informada'}</span></p>
                            </div>

                            <div class="pt-1">
                                <p class="font-semibold text-neutral-700 mb-1"><i class="fa-solid fa-notes-medical mr-1 text-red-500"></i> Informações de Anamnese:</p>
                                <p class="text-neutral-600 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-200 italic mb-2">${animal.notes || 'Anamnese arquivada no sistema.'}</p>
                                ${animal.anamnesisPdf ? `
                                    <a href="${animal.anamnesisPdf}" target="_blank" class="w-full inline-flex items-center justify-center text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 px-3 py-2 rounded-xl border border-red-200 transition shadow-sm">
                                        <i class="fa-solid fa-file-pdf mr-1.5 text-sm"></i> Visualizar Anamnese Completa (PDF)
                                    </a>
                                ` : `<span class="text-[11px] text-red-500 italic block"><i class="fa-solid fa-exclamation-circle mr-1"></i> Anamnese em auditoria.</span>`}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="p-4 bg-slate-50 border-t border-border text-center">
                    <button onclick="openClinicContactModalWithAnimal('${animal.name}')" class="w-full py-2 bg-dark text-white text-xs font-semibold rounded-xl hover:bg-blue-900 transition">
                        <i class="fa-solid fa-paper-plane mr-1 text-nassauYellow"></i> Requisitar Doador para este Animal
                    </button>
                </div>
            `;
            grid.appendChild(card);
            return;
        }

        card.innerHTML = `
            <div>
                <div class="h-48 overflow-hidden bg-neutral-100 relative">
                    <img src="${photoUrl}" alt="${animal.name}" class="w-full h-full object-cover">
                    <span class="absolute top-3 right-3 text-xs font-semibold bg-white/90 backdrop-blur px-3 py-1 rounded-full text-neutral-700 shadow-sm">${animal.species}</span>
                </div>
                <div class="p-6">
                    <div class="flex items-center justify-between mb-1">
                        <h3 class="text-xl font-bold">${animal.name}</h3>
                        <span class="text-xs font-bold px-2.5 py-1 bg-red-50 text-red-600 rounded-full border border-red-200"><i class="fa-solid fa-droplet mr-1"></i> ${animal.blood || 'Não inform.'}</span>
                    </div>
                    <p class="text-xs text-neutral-500 mb-3">${animal.breed} · ${animal.age}</p>
                    <div class="space-y-1.5 text-xs text-neutral-600 mb-2">
                        <p><i class="fa-solid fa-user-tie w-5 text-neutral-400"></i> Tutor: <span class="font-medium text-dark">${animal.owner}</span></p>
                        <p><i class="fa-solid fa-calendar-check w-5 text-neutral-400"></i> Última Coleta: <span class="font-medium text-dark">${animal.lastCollectionDate || 'N/A'}</span></p>
                        <p><i class="fa-solid fa-vial w-5 text-neutral-400"></i> Qtd. Doada: <span class="font-medium text-dark">${animal.donatedAmount || 'N/A'}</span></p>
                        <p><i class="fa-solid fa-notes-medical w-5 text-neutral-400"></i> ${animal.notes || 'Sem observações.'}</p>
                        
                        <div class="pt-2 mt-2 border-t border-border">
                            ${animal.anamnesisPdf ? `
                                <a href="${animal.anamnesisPdf}" target="_blank" class="inline-flex items-center text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition">
                                    <i class="fa-solid fa-file-pdf mr-1.5 text-sm"></i> Visualizar Anamnese (PDF)
                                </a>
                            ` : `<span class="text-[11px] text-red-500 italic"><i class="fa-solid fa-triangle-exclamation mr-1"></i> PDF Pendente.</span>`}
                        </div>
                    </div>
                </div>
            </div>
            ${canManage ? `
                <div class="px-6 pb-6 pt-2 border-t border-border flex justify-end space-x-2">
                    <button onclick="editAnimal(${animal.id})" class="px-3 py-1.5 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 rounded-lg transition">Editar</button>
                    <button onclick="deleteAnimal(${animal.id})" class="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition">Excluir</button>
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
    document.getElementById('tutor-pets-count').innerText = `${myPets.length} ${myPets.length === 1 ? 'pet cadastrado' : 'pets cadastrados'}`;

    if (myPets.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-12 text-center bg-neutral-50 rounded-2xl border border-border">
                <i class="fa-solid fa-paw text-3xl text-neutral-400 mb-2"></i>
                <p class="text-neutral-500 text-sm">Você ainda não possui pets cadastrados.</p>
                <button onclick="openAnimalModal()" class="mt-4 px-4 py-2 bg-dark text-white text-xs font-semibold rounded-xl hover:bg-neutral-800 transition">Cadastrar meu primeiro Pet</button>
            </div>`;
        return;
    }

    myPets.forEach(animal => {
        const card = document.createElement('div');
        card.className = 'bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between';
        const photoUrl = animal.photo || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80';

        card.innerHTML = `
            <div>
                <div class="h-48 overflow-hidden bg-neutral-100 relative">
                    <img src="${photoUrl}" alt="${animal.name}" class="w-full h-full object-cover">
                    <span class="absolute top-3 right-3 text-xs font-semibold bg-white/90 backdrop-blur px-3 py-1 rounded-full text-neutral-700 shadow-sm">${animal.species}</span>
                </div>
                <div class="p-6">
                    <div class="flex items-center justify-between mb-1">
                        <h3 class="text-xl font-bold">${animal.name}</h3>
                        <span class="text-xs font-bold px-2.5 py-1 bg-red-50 text-red-600 rounded-full border border-red-200"><i class="fa-solid fa-droplet mr-1"></i> ${animal.blood || 'Não inform.'}</span>
                    </div>
                    <p class="text-xs text-neutral-500 mb-3">${animal.breed} · ${animal.age}</p>
                    <div class="space-y-1.5 text-xs text-neutral-600 mb-2">
                        <p><i class="fa-solid fa-calendar-check w-5 text-neutral-400"></i> Última Coleta: <span class="font-medium text-dark">${animal.lastCollectionDate || 'Sem registros'}</span></p>
                        <p><i class="fa-solid fa-vial w-5 text-neutral-400"></i> Sangue Doado: <span class="font-medium text-dark">${animal.donatedAmount || 'Sem registros'}</span></p>
                        
                        <div class="pt-2 border-t border-border mt-2">
                            ${animal.anamnesisPdf ? `
                                <a href="${animal.anamnesisPdf}" target="_blank" class="inline-flex items-center text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition">
                                    <i class="fa-solid fa-file-pdf mr-1.5 text-sm"></i> Anamnese Anexada (PDF)
                                </a>
                            ` : `<span class="text-[11px] text-red-500 font-semibold"><i class="fa-solid fa-triangle-exclamation mr-1"></i> Anamnese pendente de anexo.</span>`}
                        </div>
                    </div>
                </div>
            </div>
            <div class="px-6 pb-6 pt-2 border-t border-border flex justify-end space-x-2">
                <button onclick="editAnimal(${animal.id})" class="px-3 py-1.5 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 rounded-lg transition">Editar</button>
                <button onclick="deleteAnimal(${animal.id})" class="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition">Excluir</button>
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
        document.getElementById('animal-owner').classList.remove('bg-slate-100', 'cursor-not-allowed');
    } else {
        document.getElementById('animal-owner').setAttribute('readonly', true);
        document.getElementById('animal-owner').classList.add('bg-slate-100', 'cursor-not-allowed');
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
                pdfStatus.innerHTML = `<span class="text-emerald-700 font-bold"><i class="fa-solid fa-check-circle mr-1"></i> PDF da Anamnese já anexado. (Envie outro apenas para substituir)</span>`;
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
            photo: imgUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80',
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
        noticeEl.className = 'p-3.5 rounded-xl border text-xs bg-red-100 border-red-300 text-red-900 font-bold';
        noticeEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-red-600 mr-1.5 text-sm"></i> <strong>Data e Horário Ocupados!</strong> Já existe uma consulta cadastrada neste exato horário. Escolha outro momento.`;
    } else if (dayOfWeek === 0 || dayOfWeek === 6) {
        noticeEl.className = 'p-3.5 rounded-xl border text-xs bg-red-50 border-red-200 text-red-800 font-semibold';
        noticeEl.innerHTML = `<i class="fa-solid fa-calendar-xmark text-red-600 mr-1.5"></i> <strong>Dia Indisponível:</strong> O atendimento na Clínica Escola funciona exclusivamente de Segunda a Sexta. Por favor, selecione outro dia.`;
    } else if (hours < 8 || hours >= 17) {
        noticeEl.className = 'p-3.5 rounded-xl border text-xs bg-amber-50 border-amber-200 text-amber-800 font-semibold';
        noticeEl.innerHTML = `<i class="fa-solid fa-clock text-amber-600 mr-1.5"></i> <strong>Horário Fora de Expediente:</strong> Atendimentos ocorrem entre 08:00 e 17:00. O horário escolhido poderá requerer confirmação especial.`;
    } else {
        noticeEl.className = 'p-3.5 rounded-xl border text-xs bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold';
        noticeEl.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-600 mr-1.5"></i> <strong>Horário Livre e Disponível:</strong> Data e horário disponíveis para agendamento!`;
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
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-neutral-400">Nenhuma consulta agendada para o seu perfil.</td></tr>`;
        return;
    }

    listToRender.forEach(appt => {
        const isAdmin = currentUser && currentUser.role === 'admin';
        const isOwnerTutor = currentUser && currentUser.role === 'tutor' && appt.owner.toLowerCase() === currentUser.name.toLowerCase();
        
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-neutral-50 transition';
        tr.innerHTML = `
            <td class="p-4 font-semibold text-dark">${appt.animal}</td>
            <td class="p-4 text-neutral-600">${appt.owner}</td>
            <td class="p-4 text-neutral-600">${appt.service}</td>
            <td class="p-4 text-neutral-600">${appt.date.replace('T', ' ')}</td>
            <td class="p-4">
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${appt.status === 'Confirmado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}">
                    ${appt.status}
                </span>
            </td>
            <td class="p-4 text-right">
                ${isAdmin ? `
                    <button onclick="toggleApptStatus(${appt.id})" class="text-xs font-medium text-dark hover:underline mr-3">Alternar Status</button>
                    <button onclick="openAppointmentModal(${appt.id})" class="text-xs font-medium text-blue-600 hover:underline mr-3">Reagendar</button>
                    <button onclick="deleteAppt(${appt.id})" class="text-xs font-medium text-red-600 hover:underline">Cancelar</button>
                ` : isOwnerTutor ? `
                    <button onclick="openAppointmentModal(${appt.id})" class="text-xs font-medium text-blue-600 hover:underline mr-3">Reagendar</button>
                    <button onclick="deleteAppt(${appt.id})" class="text-xs font-medium text-red-600 hover:underline">Cancelar</button>
                ` : `<span class="text-xs text-neutral-400">Agendado</span>`}
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

    clinicsData.forEach(clinic => {
        const isAdmin = currentUser && currentUser.role === 'admin';

        const card = document.createElement('div');
        card.className = 'bg-white border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between';
        card.innerHTML = `
            <div>
                <div class="flex items-center justify-between mb-4">
                    <span class="text-xs font-semibold bg-neutral-100 px-3 py-1 rounded-full text-neutral-600 uppercase">Campina Grande - PB</span>
                    <span class="text-xs text-emerald-600 font-semibold"><i class="fa-solid fa-circle text-[8px] mr-1"></i> ${clinic.status}</span>
                </div>
                <h3 class="text-xl font-bold mb-2">${clinic.name}</h3>
                <p class="text-neutral-500 text-sm mb-4">Parceiro credenciado com requisições e transferências integradas.</p>
                <div class="space-y-2 text-xs text-neutral-600 mb-4">
                    <p><i class="fa-solid fa-id-card w-5 text-neutral-400"></i> ${clinic.crmv || 'CRMV-PB'} · CNPJ: ${clinic.cnpj || 'Cadastrado'}</p>
                    <p><i class="fa-solid fa-location-dot w-5 text-neutral-400"></i> ${clinic.address || 'Campina Grande - PB'}</p>
                    <p><i class="fa-solid fa-phone w-5 text-neutral-400"></i> ${clinic.phone || '(83) 3300-0000'}</p>
                    <p><i class="fa-solid fa-envelope w-5 text-neutral-400"></i> ${clinic.email}</p>
                </div>
            </div>
            ${isAdmin ? `
                <div class="pt-4 border-t border-border flex justify-end">
                    <button onclick="deleteClinic(${clinic.id})" class="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition">
                        <i class="fa-solid fa-trash mr-1"></i> Excluir Clínica Parceira
                    </button>
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
        listContainer.innerHTML = `<p class="text-xs text-neutral-400">Nenhuma requisição de doador enviada até o momento.</p>`;
        return;
    }

    // Filtra para exibir apenas as últimas 5 requisições da mais recente para a mais antiga
    const recentContacts = myContacts.slice(-5).reverse();

    recentContacts.forEach(item => {
        const div = document.createElement('div');
        div.className = 'bg-neutral-800 p-4 rounded-xl border border-neutral-700 text-xs space-y-1';
        div.innerHTML = `
            <div class="flex justify-between font-bold text-white">
                <span>${item.subject}</span>
                <span class="text-emerald-400">${item.status}</span>
            </div>
            <p class="text-neutral-300">${item.message}</p>
            <span class="text-[10px] text-neutral-500 block pt-1">Enviado em: ${item.date}</span>
        `;
        listContainer.appendChild(div);
    });
}

function showToast(message) {
    const existingToast = document.getElementById('toast-notification');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = 'fixed bottom-6 right-6 bg-dark text-white px-6 py-3.5 rounded-2xl shadow-2xl text-sm font-medium z-50 flex items-center space-x-3 fade-in';
    toast.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400 text-lg"></i><span>${message}</span>`;
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
}
