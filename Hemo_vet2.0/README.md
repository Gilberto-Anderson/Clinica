# Clínica Escola UNINASSAU — front-end redesenhado

Abra `index.html` (ou sirva a pasta com qualquer servidor estático). Sem build, sem CDN: fontes e ícones estão na pasta.

## Estrutura
- `index.html` — marcação semântica; sprite de ícones (Lucide) embutido.
- `css/` — `tokens.css` (cores, tipografia, formas) → `base.css` → `components.css` → `pages.css`. Sem Tailwind; um único utilitário `.hidden`.
- `js/` — um arquivo por funcionalidade, carregados em ordem (scripts clássicos, funções globais como antes):
  `state` · `ui-common` · `navigation` · `auth` · `animals` · `tutor-area` · `appointments` · `clinics` · `clinic-contacts` · `home` · `main`
- `fonts/` — Bricolage Grotesque, Figtree, DM Mono (locais). `assets/` — logo e placeholder de pet.

## O que mudou no JS
- 21 das 32 funções originais estão idênticas byte a byte.
- 11 mudaram só em markup/classes (`switchTab`, `updateAuthUI`, `renderAnimals`, `renderTutorArea`, `openAnimalModal`, `saveAnimal`, `checkAvailabilityNotice`, `renderAppointments`, `renderClinics`, `renderClinicContactsList`, `showToast`).
- Novas: `icon`, `petPhoto`, `renderHomeStats`, `selectProfileTab` e um atalho Esc para fechar modais.
- Foto padrão do pet agora é local (`assets/pet-placeholder.svg`), em vez de URL remota do Unsplash. Registros antigos com a URL antiga também mostram o placeholder.
- Chaves e formato do localStorage inalterados.

## Observações encontradas no código original (mantidas, não corrigidas)
1. Admin vê o botão "Reagendar", mas `openAppointmentModal` exige perfil tutor: abre o login e avisa.
2. Login não valida senha nem e-mail @uninassau.edu.br (é só texto no cadastro).
3. Tutor é identificado pelo nome: dois tutores com o mesmo nome compartilham pets e consultas.
4. Dados digitados entram direto em `innerHTML` (risco de XSS) em vários renders.
5. O filtro "Peso" busca no mesmo campo de idade/peso do animal.
