/* Módulo da home: números reais, rede de clínicas e abas de perfil. */

// Números calculados dos dados reais; blocos com contagem zero ficam ocultos.
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
        partners.innerHTML = `<div class="partners__fallback"><img src="assets/logo-clinica.png" alt=""><span>UNINASSAU · Medicina Veterinária CG</span></div>`;
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
