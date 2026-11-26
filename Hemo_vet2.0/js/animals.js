/* Módulo de animais: listagem/filtros, cadastro, edição, exclusão (admin, clínica, tutor). */

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
