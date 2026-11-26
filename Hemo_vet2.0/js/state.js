/* Estado global e persistência (localStorage). Carregar primeiro. */
let currentUser = JSON.parse(localStorage.getItem('vet_current_user')) || null;

// Listas inicializadas vazias conforme solicitado
let animalsData = JSON.parse(localStorage.getItem('vet_animals')) || [];
let appointmentsData = JSON.parse(localStorage.getItem('vet_appointments')) || [];
let clinicsData = JSON.parse(localStorage.getItem('vet_clinics')) || [];

let clinicContacts = JSON.parse(localStorage.getItem('vet_clinic_contacts')) || [];

// Foto padrão local (substitui a imagem remota que o projeto usava antes).
const DEFAULT_PET_PHOTO = 'assets/pet-placeholder.svg';

function petPhoto(animal) {
    const p = animal && animal.photo;
    // Registros antigos guardavam uma URL remota como foto padrão; mostramos o placeholder local.
    if (!p || p.includes('images.unsplash.com/photo-1543466835')) return DEFAULT_PET_PHOTO;
    return p;
}

function saveData() {
    localStorage.setItem('vet_current_user', JSON.stringify(currentUser));
    localStorage.setItem('vet_animals', JSON.stringify(animalsData));
    localStorage.setItem('vet_appointments', JSON.stringify(appointmentsData));
    localStorage.setItem('vet_clinics', JSON.stringify(clinicsData));
    localStorage.setItem('vet_clinic_contacts', JSON.stringify(clinicContacts));
}