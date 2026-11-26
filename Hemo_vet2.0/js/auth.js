/* Autenticação: login, cadastro com código de verificação, logout e UI por perfil. */

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
            <button onclick="openModal('login-select-modal')" class="btn btn--ghost btn--sm">Entrar</button>
            <button onclick="openModal('signup-select-modal')" class="btn btn--dark btn--sm auth-signup">Cadastrar</button>
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
