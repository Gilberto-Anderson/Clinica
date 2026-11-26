/* Módulo de clínicas parceiras. */

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

        // Caso a clínica tenha entrado sem registro prévio na lista local, exibe seus próprios dados de sessão
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