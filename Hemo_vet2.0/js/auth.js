/* Autenticação: login, cadastro direto, logout e UI por perfil. */

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

    if (role === 'admin') {
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

        // Se quem cadastrou foi a própria Coordenação (admin), mantém a sessão do admin; caso contrário, loga como a clínica recém-criada.
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

        // Regra 4: Botão "Cadastrar Clínica" visível apenas para Coordenação (admin)
        if (btnRegisterClinic) {
            if (currentUser.role === 'admin') {
                btnRegisterClinic.classList.remove('hidden');
            } else {
                btnRegisterClinic.classList.add('hidden');
            }
        }

        // Regra 2 e 3: Aba "Clínicas Parceiras" visível apenas para Coordenação (admin) e Clínica Parceira (clinic)
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
        // Regra 6: Manter o botão "Cadastrar" na barra superior quando deslogado
        authArea.innerHTML = `
            <button onclick="openModal('login-select-modal')" class="btn btn--ghost btn--sm">Entrar</button>
            <button onclick="openModal('signup-select-modal')" class="btn btn--dark btn--sm auth-signup">Cadastrar</button>
        `;
        
        if (btnRegisterClinic) btnRegisterClinic.classList.add('hidden');

        if (navTutorBtn) navTutorBtn.classList.add('hidden');
        if (mobileTutorBtn) mobileTutorBtn.classList.add('hidden');
        
        if (navAnimals) navAnimals.classList.add('hidden');
        if (mobileNavAnimals) mobileNavAnimals.classList.add('hidden');
        
        if (navAppointments) navAppointments.classList.add('hidden');
        if (mobileNavAppointments) mobileNavAppointments.classList.add('hidden');

        // Regra 2: Ocultar a aba "Clínicas Parceiras" na página inicial / usuário deslogado
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