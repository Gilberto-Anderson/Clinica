/* Módulo de requisição de doadores pelas clínicas. */

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
