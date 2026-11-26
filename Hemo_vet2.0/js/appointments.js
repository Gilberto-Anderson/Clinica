/* Módulo de consultas: disponibilidade, conflito de horário, agenda e status. */

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
        noticeEl.className = 'notice notice--bad';
        noticeEl.innerHTML = `${icon('triangle-alert')}<div><strong>Data e Horário Ocupados!</strong> Já existe uma consulta cadastrada neste exato horário. Escolha outro momento.</div>`;
    } else if (dayOfWeek === 0 || dayOfWeek === 6) {
        noticeEl.className = 'notice notice--bad';
        noticeEl.innerHTML = `${icon('calendar-x')}<div><strong>Dia Indisponível:</strong> O atendimento na Clínica Escola funciona exclusivamente de Segunda a Sexta. Por favor, selecione outro dia.</div>`;
    } else if (hours < 8 || hours >= 17) {
        noticeEl.className = 'notice notice--warn';
        noticeEl.innerHTML = `${icon('clock')}<div><strong>Horário Fora de Expediente:</strong> Atendimentos ocorrem entre 08:00 e 17:00. O horário escolhido poderá requerer confirmação especial.</div>`;
    } else {
        noticeEl.className = 'notice notice--ok';
        noticeEl.innerHTML = `${icon('circle-check')}<div><strong>Horário Livre e Disponível:</strong> Data e horário disponíveis para agendamento!</div>`;
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
        tbody.innerHTML = `<tr><td colspan="6" class="cell-empty">Nenhuma consulta agendada para o seu perfil.</td></tr>`;
        return;
    }

    listToRender.forEach(appt => {
        const isAdmin = currentUser && currentUser.role === 'admin';
        const isOwnerTutor = currentUser && currentUser.role === 'tutor' && appt.owner.toLowerCase() === currentUser.name.toLowerCase();
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="cell-strong" data-label="Animal">${appt.animal}</td>
            <td data-label="Tutor">${appt.owner}</td>
            <td data-label="Serviço / Motivo">${appt.service}</td>
            <td data-label="Data e Hora">${appt.date.replace('T', ' ')}</td>
            <td data-label="Status">
                <span class="badge ${appt.status === 'Confirmado' ? 'badge--ok' : 'badge--warn'}">${appt.status}</span>
            </td>
            <td data-label="Ações">
                <div class="table-actions">
                ${isAdmin ? `
                    <button onclick="toggleApptStatus(${appt.id})">Alternar Status</button>
                    <button onclick="openAppointmentModal(${appt.id})">Reagendar</button>
                    <button onclick="deleteAppt(${appt.id})" class="is-danger">Cancelar</button>
                ` : isOwnerTutor ? `
                    <button onclick="openAppointmentModal(${appt.id})">Reagendar</button>
                    <button onclick="deleteAppt(${appt.id})" class="is-danger">Cancelar</button>
                ` : `<span class="muted">Agendado</span>`}
                </div>
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
