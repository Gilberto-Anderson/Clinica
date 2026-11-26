/* Módulo do tutor: painel "Minha Conta" e seus pets. */

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
