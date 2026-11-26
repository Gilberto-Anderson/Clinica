/* Inicialização. Carregar por último. */
window.onload = function() {
    updateAuthUI();
    renderAnimals();
    renderAppointments();
    renderClinics();
    renderHomeStats();
}

// Esc fecha qualquer modal aberto.
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.modal:not(.hidden)').forEach(m => closeModal(m.id));
});
