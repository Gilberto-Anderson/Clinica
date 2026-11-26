/* Navegação entre abas e guardas de acesso por perfil. */

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