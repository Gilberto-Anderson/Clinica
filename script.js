let currentUser = JSON.parse(localStorage.getItem('vet_current_user')) || null;

let animalsData = JSON.parse(localStorage.getItem('vet_animals')) || [
    { id: 1, name: 'Thor', species: 'Canino', breed: 'Golden Retriever', blood: 'DEA 1.1 Positivo', age: '4 anos · 30 kg', owner: 'Mariana Costa', photo: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80', notes: 'Doador apto - Vacinas em dia.', anamnesisPdf: '' },
    { id: 2, name: 'Luna', species: 'Felino', breed: 'Siamês', blood: 'Tipo A', age: '2 anos · 4.2 kg', owner: 'Lucas Almeida', photo: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80', notes: 'Castrada. Histórico clínico regular.', anamnesisPdf: '' },
    { id: 3, name: 'Bob', species: 'Canino', breed: 'Bulldog Francês', blood: 'DEA 4 Negativo', age: '3 anos · 12 kg', owner: 'Juliana Ribeiro', photo: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80', notes: 'Acompanhamento preventivo e elegibilidade ativa.', anamnesisPdf: '' }
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
        const foundClinic = clinicsData.find(c => c.email.toLowerCase() === email.toLowerCase());
        if (foundClinic) {
            currentUser = { name: foundClinic.name, email: email, role: 'clinic', clinicId: foundClinic.id };
            saveData();
            updateAuthUI();
            closeModal('login-modal');
            showToast(`Bem-vindo(a), ${foundClinic.name}! (Clínica Parceira)`);
            switchTab('clinics');
            return;
        } else {
            alert('Clínica não encontrada com este e-mail cadastrado.');
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
        showToast('Cadastro institucional de Coordenação verificado com sucesso!');
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
        switchTab('clinics');
    }
    pendingSignupData = null;
}

function logout() {
    currentUser = null;
    localStorage.removeItem('vet_current_user');
    saveData();
    updateAuthUI();
    showToast('Sessão encerrada e armazenamentos limpos.');
    switchTab('home');
    renderAnimals();
    renderClinics();
}

function updateAuthUI() {
    const authArea = document.getElementById('auth-nav-area');
    const tutorNotice = document.getElementById('tutor-notice-banner');
    const clinicPortalBox = document.getElementById('clinic-portal-box');
    const navTutorBtn = document.getElementById('nav-tutor-area');
    const mobileTutorBtn = document.getElementById('mobile-nav-tutor');

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
        } else {
            if (navTutorBtn) navTutorBtn.classList.add('hidden');
            if (mobileTutorBtn) mobileTutorBtn.classList.add('hidden');
        }

        if (tutorNotice) {
            if (currentUser.role === 'tutor' || currentUser.role === 'admin') {
                tutorNotice.classList.add('hidden');
            } else {
                tutorNotice.classList.remove('hidden');
            }
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
        if (tutorNotice) tutorNotice.classList.remove('hidden');
        if (clinicPortalBox) clinicPortalBox.classList.add('hidden');
    }
    renderAppointments();
}

function renderAnimals() {
    const query = document.getElementById('animal-search').value.toLowerCase();
    const grid = document.getElementById('animals-grid');
    grid.innerHTML = '';

    const filtered = animalsData.filter(a => 
        a.name.toLowerCase().includes(query) || 
        a.species.toLowerCase().includes(query) || 
        a.breed.toLowerCase().includes(query) ||
        a.owner.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-12 text-center text-neutral-400 text-sm">Nenhum animal ou doador encontrado.</div>`;
        return;
    }

    filtered.forEach(animal => {
        const canManage = currentUser && (currentUser.role === 'admin' || (currentUser.role === 'tutor' && animal.owner.toLowerCase() === currentUser.name.toLowerCase()));
        
        // Clínicas parceiras, médico/adm e o próprio tutor podem ter acesso ao PDF da anamnese
        const canAccessPdf = currentUser && (currentUser.role === 'admin' || currentUser.role === 'clinic' || (currentUser.role === 'tutor' && animal.owner.toLowerCase() === currentUser.name.toLowerCase()));

        const card = document.createElement('div');
        card.className = 'bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between';
        
        const photoUrl = animal.photo || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80';

        card.innerHTML = `
            <div>
                <div class="h-48 overflow-hidden bg-neutral-100 relative">
                    <img src="${photoUrl}" alt="${animal.name}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/600x400/e5e7eb/737373?text=Pet'">
                    <span class="absolute top-3 right-3 text-xs font-semibold bg-white/90 backdrop-blur px-3 py-1 rounded-full text-neutral-700 shadow-sm">${animal.species}</span>
                </div>
                <div class="p-6">
                    <div class="flex items-center justify-between mb-1">
                        <h3 class="text-xl font-bold">${animal.name}</h3>
                        <span class="text-xs font-bold px-2.5 py-1 bg-red-50 text-red-600 rounded-full border border-red-200"><i class="fa-solid fa-droplet mr-1"></i> ${animal.blood || 'Não inform.'}</span>
                    </div>
                    <p class="text-xs text-neutral-500 mb-4">${animal.breed} · ${animal.age}</p>
                    <div class="space-y-1.5 text-xs text-neutral-600 mb-2">
                        <p><i class="fa-solid fa-user-tie w-5 text-neutral-400"></i> Tutor: <span class="font-medium text-dark">${animal.owner}</span></p>
                        ${currentUser && currentUser.role === 'admin' ? `<p><i class="fa-solid fa-notes-medical w-5 text-neutral-400"></i> ${animal.notes || 'Sem observações clínicas.'}</p>` : `<p class="text-[11px] text-neutral-400 italic"><i class="fa-solid fa-lock w-5"></i> Dados clínicos/laudos reservados à coordenação/médico veterinário.</p>`}
                        
                        <!-- Acesso ao PDF da Anamnese para médico/adm, clínicas e tutor -->
                        <div class="pt-2 mt-2 border-t border-border">
                            ${canAccessPdf && animal.anamnesisPdf ? `
                                <a href="${animal.anamnesisPdf}" target="_blank" class="inline-flex items-center text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition">
                                    <i class="fa-solid fa-file-pdf mr-1.5 text-sm"></i> Visualizar Anamnese (PDF)
                                </a>
                            ` : `<span class="text-[11px] text-neutral-400 italic"><i class="fa-solid fa-file-circle-xmark mr-1"></i> Nenhum PDF de anamnese anexado.</span>`}
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
                    <p class="text-xs text-neutral-500 mb-4">${animal.breed} · ${animal.age}</p>
                    <div class="space-y-1.5 text-xs text-neutral-600 mb-2">
                        <p class="text-[11px] text-neutral-400 italic mb-2"><i class="fa-solid fa-lock w-5"></i> Laudos e dados clínicos reservados à coordenação/médico veterinário.</p>
                        
                        <!-- Tutor visualiza PDF da anamnese se houver -->
                        <div class="pt-2 border-t border-border">
                            ${animal.anamnesisPdf ? `
                                <a href="${animal.anamnesisPdf}" target="_blank" class="inline-flex items-center text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition">
                                    <i class="fa-solid fa-file-pdf mr-1.5 text-sm"></i> Visualizar Anamnese Veterinária (PDF)
                                </a>
                            ` : `<span class="text-[11px] text-neutral-400 italic"><i class="fa-solid fa-file-circle-xmark mr-1"></i> Nenhum PDF de anamnese anexado pela coordenação.</span>`}
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
    document.getElementById('animal-owner').value = currentUser.role === 'tutor' ? currentUser.name : '';
    
    const pdfContainer = document.getElementById('animal-pdf-container');
    const pdfInput = document.getElementById('animal-pdf-file');
    const pdfStatus = document.getElementById('current-pdf-status');
    pdfInput.value = '';

    if (currentUser.role === 'admin') {
        document.getElementById('animal-owner').removeAttribute('readonly');
        document.getElementById('animal-owner').classList.remove('bg-slate-100', 'cursor-not-allowed');
        document.getElementById('animal-notes-container').style.display = 'block';
        // Médico e Admin podem anexar PDF da anamnese
        pdfContainer.classList.remove('hidden');
    } else {
        document.getElementById('animal-owner').setAttribute('readonly', true);
        document.getElementById('animal-owner').classList.add('bg-slate-100', 'cursor-not-allowed');
        document.getElementById('animal-notes-container').style.display = 'none';
        // Tutor não anexa PDF da anamnese (reservado à coordenação/médico veterinário)
        pdfContainer.classList.add('hidden');
    }

    document.getElementById('animal-photo-file').value = '';
    document.getElementById('animal-notes').value = '';
    document.getElementById('animal-modal-title').innerText = 'Cadastrar Novo Animal';
    pdfStatus.innerText = 'Nenhum PDF anexado atualmente.';

    if (animalId) {
        const animal = animalsData.find(a => a.id === animalId);
        if (animal) {
            document.getElementById('animal-id').value = animal.id;
            document.getElementById('animal-name').value = animal.name;
            document.getElementById('animal-species').value = animal.species;
            document.getElementById('animal-breed').value = animal.breed;
            document.getElementById('animal-blood').value = animal.blood || '';
            document.getElementById('animal-age').value = animal.age;
            document.getElementById('animal-owner').value = animal.owner;
            document.getElementById('animal-notes').value = animal.notes || '';
            if (animal.anamnesisPdf) {
                pdfStatus.innerHTML = `<span class="text-emerald-600 font-semibold"><i class="fa-solid fa-check mr-1"></i> PDF de anamnese já anexado. (Envie outro para substituir)</span>`;
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

    const processAnimalData = (imgUrl, pdfUrl) => {
        const ownerVal = currentUser.role === 'tutor' ? currentUser.name : document.getElementById('animal-owner').value;
        const notesVal = currentUser.role === 'admin' ? document.getElementById('animal-notes').value : existingNotes;
        const finalPdf = currentUser.role === 'admin' && pdfUrl ? pdfUrl : existingPdf;

        const data = {
            name: document.getElementById('animal-name').value,
            species: document.getElementById('animal-species').value,
            breed: document.getElementById('animal-breed').value,
            blood: document.getElementById('animal-blood').value,
            age: document.getElementById('animal-age').value,
            owner: ownerVal,
            photo: imgUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80',
            notes: notesVal,
            anamnesisPdf: finalPdf
        };

        if (id) {
            const index = animalsData.findIndex(a => a.id == id);
            if (index !== -1) {
                animalsData[index] = { id: Number(id), ...data };
                showToast('Pet atualizado com sucesso!');
            }
        } else {
            const newId = animalsData.length > 0 ? Math.max(...animalsData.map(a => a.id)) + 1 : 1;
            animalsData.push({ id: newId, ...data });
            showToast('Novo pet cadastrado com sucesso!');
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

function renderAppointments() {
    const tbody = document.getElementById('appointments-tbody');
    tbody.innerHTML = '';

    if (appointmentsData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-neutral-400">Nenhuma consulta agendada.</td></tr>`;
        return;
    }

    appointmentsData.forEach(appt => {
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

    if (apptId) {
        const appt = appointmentsData.find(a => a.id === apptId);
        if (appt) {
            document.getElementById('appt-id').value = appt.id;
            select.value = appt.animal;
            document.getElementById('appt-service').value = appt.service;
            document.getElementById('appt-date').value = appt.date;
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
    grid.innerHTML = '';

    clinicsData.forEach(clinic => {
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
                <div class="space-y-2 text-xs text-neutral-600">
                    <p><i class="fa-solid fa-id-card w-5 text-neutral-400"></i> ${clinic.crmv || 'CRMV-PB'} · CNPJ: ${clinic.cnpj || 'Cadastrado'}</p>
                    <p><i class="fa-solid fa-location-dot w-5 text-neutral-400"></i> ${clinic.address || 'Campina Grande - PB'}</p>
                    <p><i class="fa-solid fa-phone w-5 text-neutral-400"></i> ${clinic.phone || '(83) 3300-0000'}</p>
                    <p><i class="fa-solid fa-envelope w-5 text-neutral-400"></i> ${clinic.email}</p>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
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
            opt.innerText = `${a.name} (Espécie: ${a.species} - Sangue: ${a.blood || 'N/I'} - Tutor: ${a.owner})`;
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
    closeModal('clinic-contact-modal');
    renderClinicContactsList();
    showToast('Requisição de doador associada ao animal enviada com sucesso!');
}

function renderClinicContactsList() {
    const listContainer = document.getElementById('clinic-requests-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const myContacts = clinicContacts.filter(c => currentUser && c.clinicName.toLowerCase() === currentUser.name.toLowerCase());

    if (myContacts.length === 0) {
        listContainer.innerHTML = `<p class="text-xs text-neutral-400">Nenhuma requisição de doador ou transferência enviada até o momento.</p>`;
        return;
    }

    myContacts.forEach(item => {
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
