/* ============================================================
   dontgetdeported.nl — student onboarding questionnaire
   All answers are held in memory ("local save") for this session.
   No login / register — just a first name for personalization.
   ============================================================ */

const state = {
  history: ['welcome'],

  dob: '',
  origin: null,             // 'eu' | 'noneu'
  programme: null,          // 'bachelor' | 'master' | 'exchange' | 'minor' | 'phd' | 'other'
  admission: null,          // 'yes' | 'no'
  accommodation: null,      // 'yes' | 'no'
  accommodationType: null,  // 'student' | 'private' | 'family' | 'other'
  employment: null,         // 'yes' | 'no' | 'unsure'
  completed: {
    bsn: false, digid: false, phone: false, bank: false,
    healthInsurance: false, gp: false, travelCard: false,
    housingAllowance: false, residencePermit: false
  },

  firstName: '',
  dashboardView: 'roadmap', // 'roadmap' | 'detail'
  activeDetail: null
};

const screenEl = document.getElementById('screen');

function esc(s) {
  return (s || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/* ---------- navigation (supports conditional branching) ---------- */

function currentStep() { return state.history[state.history.length - 1]; }

function pushStep(name) { state.history.push(name); render(); }

function goBack() {
  if (state.history.length > 1) state.history.pop();
  render();
}

// The question steps, in order — 'accType' only appears if accommodation === 'yes'
function questionSteps() {
  const steps = ['dob', 'origin', 'programme', 'admission', 'accommodation'];
  if (state.accommodation === 'yes') steps.push('accType');
  steps.push('employment', 'checklist');
  return steps;
}

function goForward() {
  const cur = currentStep();
  if (cur === 'welcome') { pushStep(questionSteps()[0]); return; }
  if (cur === 'name') { pushStep('done'); return; }
  if (cur === 'done') { pushStep('dashboard'); return; }

  const qs = questionSteps();
  const idx = qs.indexOf(cur);
  if (idx > -1 && idx < qs.length - 1) { pushStep(qs[idx + 1]); return; }
  if (idx === qs.length - 1) { pushStep('name'); return; }
}

/* ---------- shared markup helpers ---------- */

function progressBar() {
  const qs = questionSteps();
  const idx = qs.indexOf(currentStep());
  if (idx === -1) return '';
  const pct = Math.round(((idx + 1) / qs.length) * 100);
  return `
    <div class="px-6 sm:px-8 pt-5 sm:pt-6 flex-none">
      <div class="h-[5px] bg-[#eee7d9] rounded-full overflow-hidden">
        <div class="h-full bg-orange rounded-full transition-all duration-300" style="width:${pct}%"></div>
      </div>
      <div class="text-[11px] text-muted mt-2 tracking-wide uppercase font-semibold">Step ${idx + 1} of ${qs.length}</div>
    </div>
  `;
}

function choiceCard({ selected, dataAttr, value, icon, title, meta, type }) {
  const control = type === 'check'
    ? `<div class="ml-auto w-5 h-5 rounded-md border-2 ${selected ? 'bg-orange border-orange' : 'border-line'} flex items-center justify-center text-white text-[13px] font-black flex-none">${selected ? '✓' : ''}</div>`
    : `<div class="ml-auto w-5 h-5 rounded-full border-2 ${selected ? 'border-orange' : 'border-line'} flex items-center justify-center flex-none">${selected ? '<div class="w-2.5 h-2.5 rounded-full bg-orange"></div>' : ''}</div>`;

  return `
    <div class="flex items-center gap-3 w-full p-3.5 sm:p-4 rounded-2xl border-[1.5px] ${selected ? 'border-orange bg-orange-50 shadow-[0_0_0_3px_rgba(234,91,47,0.12)]' : 'border-line bg-white hover:border-orange/40'} mb-2.5 sm:mb-3 cursor-pointer font-bold text-navy text-[14px] sm:text-[14.5px] transition"
         ${dataAttr}="${value}">
      <div class="w-9 h-9 rounded-[10px] flex items-center justify-center text-[17px] flex-none ${selected ? 'bg-orange text-white' : 'bg-[#f1eee5]'}">${icon}</div>
      <div class="min-w-0">
        <div>${title}</div>
        ${meta ? `<div class="text-[12px] text-muted font-medium mt-0.5">${meta}</div>` : ''}
      </div>
      ${control}
    </div>
  `;
}

function navRow({ showBack = true, nextLabel = 'Continue', nextDisabled = false }) {
  return `
    <div class="flex gap-2.5 mt-auto pt-4 sm:pt-5 flex-none">
      ${showBack ? `<button id="btn-back" class="flex-none w-[46px] py-3.5 rounded-xl border-[1.5px] border-line text-navy font-bold hover:border-orange hover:text-orange transition">←</button>` : ''}
      <button id="btn-next" class="flex-1 py-3.5 px-4 rounded-xl bg-orange text-white font-bold text-[15px] shadow-cta active:scale-[0.98] hover:brightness-105 transition disabled:bg-orange-200 disabled:shadow-none disabled:cursor-not-allowed" ${nextDisabled ? 'disabled' : ''}>${nextLabel}</button>
    </div>
  `;
}

function questionShell(title, bodyHtml, navOpts) {
  return `
    ${progressBar()}
    <div class="flex-1 flex flex-col px-6 sm:px-8 pb-6 pt-5 min-h-0 overflow-y-auto">
      <h2 class="text-[19px] sm:text-[21px] font-extrabold text-navy mb-5 leading-snug flex-none">${title}</h2>
      <div class="flex-1">${bodyHtml}</div>
      ${navRow(navOpts)}
    </div>
  `;
}

/* ---------- screen renderers ---------- */

const renderers = {

  welcome: () => `
    <div class="flex-1 flex flex-col items-center text-center justify-center px-6 sm:px-10">
      <div class="w-16 h-16 rounded-full border-2 border-orange flex items-center justify-center text-orange font-extrabold text-2xl mb-5">⚑</div>
      <div class="text-[22px] sm:text-[24px] font-extrabold text-navy mb-1.5">dontgetdeported<span class="text-orange">.nl</span></div>
      <p class="text-[13.5px] sm:text-[14.5px] text-muted leading-relaxed mb-8 max-w-[280px]">
        Answer a few quick questions and we'll generate a personalized onboarding checklist for your move to the Netherlands.
      </p>
      <button id="btn-start" class="w-full max-w-[280px] py-3.5 px-4 rounded-xl bg-orange text-white font-bold text-[15px] shadow-cta active:scale-[0.98] hover:brightness-105 transition">Get started</button>
    </div>
  `,

  /* ---- 1. Personal information ---- */

  dob: () => questionShell(
    'When is your birthday?',
    `<div>
      <label class="block text-[12px] font-bold text-navy-soft mb-1.5 uppercase tracking-wide">Date of birth</label>
      <input type="date" id="input-dob" value="${esc(state.dob)}"
             class="w-full py-3 px-3.5 rounded-[11px] border-[1.5px] border-line text-[14.5px] text-navy outline-none focus:border-orange focus:ring-4 focus:ring-orange/10 transition">
    </div>`,
    { showBack: false }
  ),

  origin: () => questionShell(
    'Are you an EU/EEA citizen or a non-EU student?',
    choiceCard({ selected: state.origin === 'eu', dataAttr: 'data-choice', value: 'eu', icon: '🇪🇺', title: 'EU / EEA', type: 'radio' }) +
    choiceCard({ selected: state.origin === 'noneu', dataAttr: 'data-choice', value: 'noneu', icon: '🌍', title: 'Non-EU', type: 'radio' }),
    { nextDisabled: !state.origin }
  ),

  /* ---- 2. Study information ---- */

  programme: () => questionShell(
    'What type of programme are you enrolled in?',
    [
      { v: 'bachelor', ic: '🎓', t: "Bachelor's" },
      { v: 'master', ic: '📘', t: "Master's" },
      { v: 'exchange', ic: '🔄', t: 'Exchange' },
      { v: 'minor', ic: '➕', t: 'Minor' },
      { v: 'phd', ic: '🔬', t: 'PhD' },
      { v: 'other', ic: '✦', t: 'Other' }
    ].map(o => choiceCard({ selected: state.programme === o.v, dataAttr: 'data-choice', value: o.v, icon: o.ic, title: o.t, type: 'radio' })).join(''),
    { nextDisabled: !state.programme }
  ),

  admission: () => questionShell(
    'Have you received confirmation of your admission from your university?',
    choiceCard({ selected: state.admission === 'yes', dataAttr: 'data-choice', value: 'yes', icon: '✓', title: 'Yes', type: 'radio' }) +
    choiceCard({ selected: state.admission === 'no', dataAttr: 'data-choice', value: 'no', icon: '✕', title: 'No', type: 'radio' }),
    { nextDisabled: !state.admission }
  ),

  /* ---- 3. Accommodation ---- */

  accommodation: () => questionShell(
    'Do you already have accommodation?',
    choiceCard({ selected: state.accommodation === 'yes', dataAttr: 'data-choice', value: 'yes', icon: '✓', title: 'Yes', type: 'radio' }) +
    choiceCard({ selected: state.accommodation === 'no', dataAttr: 'data-choice', value: 'no', icon: '✕', title: 'No', type: 'radio' }),
    { nextDisabled: !state.accommodation }
  ),

  accType: () => questionShell(
    'What type of accommodation are you living in?',
    [
      { v: 'student', ic: '🏢', t: 'Student housing' },
      { v: 'private', ic: '🏠', t: 'Private rental' },
      { v: 'family', ic: '👨‍👩‍👧', t: 'Living with family / friends' },
      { v: 'other', ic: '✦', t: 'Other' }
    ].map(o => choiceCard({ selected: state.accommodationType === o.v, dataAttr: 'data-choice', value: o.v, icon: o.ic, title: o.t, type: 'radio' })).join(''),
    { nextDisabled: !state.accommodationType }
  ),

  /* ---- 4. Employment ---- */

  employment: () => questionShell(
    'Will you be working (part-time) alongside your studies?',
    choiceCard({ selected: state.employment === 'yes', dataAttr: 'data-choice', value: 'yes', icon: '✓', title: 'Yes', type: 'radio' }) +
    choiceCard({ selected: state.employment === 'no', dataAttr: 'data-choice', value: 'no', icon: '✕', title: 'No', type: 'radio' }) +
    choiceCard({ selected: state.employment === 'unsure', dataAttr: 'data-choice', value: 'unsure', icon: '?', title: 'Not sure yet', type: 'radio' }),
    { nextDisabled: !state.employment }
  ),

  /* ---- 5. Administrative checklist ---- */

  checklist: () => {
    const items = [
      { k: 'bsn', ic: '🏛', t: 'BSN' },
      { k: 'digid', ic: '🆔', t: 'DigiD' },
      { k: 'phone', ic: '📱', t: 'Dutch phone number' },
      { k: 'bank', ic: '🏦', t: 'Bank account' },
      { k: 'healthInsurance', ic: '🏥', t: 'Health insurance' },
      { k: 'gp', ic: '🩺', t: 'General Practitioner (GP)' },
      { k: 'travelCard', ic: '🚆', t: 'Student travel card/product' },
      { k: 'housingAllowance', ic: '🏠', t: 'Housing allowance (Huurtoeslag)' }
    ];
    if (state.origin === 'noneu') items.push({ k: 'residencePermit', ic: '🛂', t: 'Residence permit' });

    return questionShell(
      'Which of the following do you already have?',
      `<p class="text-[12.5px] text-muted -mt-3 mb-4">Select all that apply.</p>` +
      items.map(o => choiceCard({ selected: state.completed[o.k], dataAttr: 'data-toggle', value: o.k, icon: o.ic, title: o.t, type: 'check' })).join(''),
      { nextLabel: 'Continue' }
    );
  },

  /* ---- personalization + wrap up ---- */

  name: () => `
    <div class="flex-1 flex flex-col px-6 sm:px-8 pb-6 pt-8 sm:pt-10 min-h-0 overflow-y-auto">
      <div class="w-12 h-12 rounded-full border-2 border-orange flex items-center justify-center text-orange font-extrabold text-xl mb-4 flex-none">⚑</div>
      <h2 class="text-[19px] sm:text-[21px] font-extrabold text-navy mb-1.5 leading-snug flex-none">What should we call you?</h2>
      <p class="text-[13px] text-muted leading-relaxed mb-5 flex-none">Just for your roadmap — no account needed.</p>
      <div class="flex-1">
        <label class="block text-[12px] font-bold text-navy-soft mb-1.5 uppercase tracking-wide">First name</label>
        <input id="input-name" value="${esc(state.firstName)}" placeholder="e.g. Andrei"
               class="w-full py-3 px-3.5 rounded-[11px] border-[1.5px] border-line text-[14.5px] text-navy outline-none focus:border-orange focus:ring-4 focus:ring-orange/10 transition">
      </div>
      ${navRow({ nextLabel: 'See my plan' })}
    </div>
  `,

  done: () => `
    <div class="flex-1 flex flex-col items-center text-center justify-center px-6 sm:px-10">
      <div class="w-[76px] h-[76px] rounded-full bg-orange-50 text-orange flex items-center justify-center text-[34px] mb-5">✓</div>
      <div class="text-[19px] sm:text-[21px] font-extrabold text-navy mb-1.5">We're done — your plan is ready!</div>
      <p class="text-[13.5px] text-muted leading-relaxed mb-8 max-w-[280px]">
        Based on your answers, we've generated a step-by-step onboarding checklist for you.
      </p>
      <button id="btn-see-plan" class="w-full max-w-[280px] py-3.5 px-4 rounded-xl bg-orange text-white font-bold text-[15px] shadow-cta active:scale-[0.98] hover:brightness-105 transition">See my plan</button>
    </div>
  `,

  /* ---- dashboard ---- */

  dashboard: () => {
    const first = state.firstName || 'there';
    const initials = (state.firstName ? state.firstName[0] : 'A').toUpperCase();
    const roadmap = getRoadmap();
    const activeKey = state.activeDetail || roadmap[0].key;
    const isDetailView = state.dashboardView === 'detail';

    const sidebarClass = `${isDetailView ? 'hidden' : 'flex'} md:flex flex-col md:w-72 lg:w-80 md:flex-none bg-navy text-white`;

    return `
      <div class="flex-1 flex flex-col md:flex-row min-h-0">
        <div class="${sidebarClass} md:overflow-y-auto">
          <div class="px-5 sm:px-6 md:px-7 pt-6 pb-5 md:pb-6 flex-none">
            <div class="text-[12px] text-[#aab4cc] font-semibold uppercase tracking-wide">Welcome back</div>
            <h2 class="text-[21px] md:text-[23px] font-extrabold mt-1">${esc(first)}</h2>
          </div>
          <div class="px-5 sm:px-6 md:px-7 pb-4 flex-1">
            <div class="text-[11px] font-extrabold uppercase tracking-wider text-[#93a0c2] mb-3.5">Your roadmap</div>
            ${roadmap.map((item, i) => `
              <div class="flex gap-3 py-2.5 px-2 rounded-xl cursor-pointer hover:bg-white/5 transition ${item.key === activeKey ? 'bg-white/10' : ''}" data-detail="${item.key}">
                <div class="flex flex-col items-center">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-extrabold flex-none
                    ${item.status === 'done' ? 'bg-leaf text-white' : item.status === 'next' ? 'bg-orange text-white' : 'bg-white/10 border-2 border-white/20 text-white/50'}">
                    ${item.status === 'done' ? '✓' : item.icon}
                  </div>
                  ${i < roadmap.length - 1 ? '<div class="w-0.5 flex-1 bg-white/15 my-0.5 min-h-[10px]"></div>' : ''}
                </div>
                <div class="min-w-0">
                  <div class="text-[13.5px] font-bold text-white truncate">${item.title}</div>
                  <div class="text-[11.5px] font-semibold mt-0.5 ${item.status === 'done' ? 'text-leaf' : item.status === 'next' ? 'text-orange' : 'text-white/40'}">${item.statusLabel}</div>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="flex items-center gap-2.5 px-5 sm:px-6 md:px-7 py-4 border-t border-white/10 text-[13px] font-bold text-white flex-none">
            <div class="w-[30px] h-[30px] rounded-full bg-orange text-white flex items-center justify-center text-[12px] font-extrabold flex-none">${esc(initials)}</div>
            <div class="truncate">${esc(first)}</div>
            <div id="btn-reset" class="ml-auto text-[#93a0c2] font-semibold text-[11.5px] underline cursor-pointer flex-none">Start over</div>
          </div>
        </div>
        ${renderDetail(activeKey, isDetailView)}
      </div>
    `;
  }
};

/* ---------- roadmap + detail content ---------- */

function getRoadmap() {
  const items = [
    { key: 'bsn', icon: '🏛', title: 'Get your BSN' },
    { key: 'digid', icon: '🆔', title: 'Create a DigiD' },
    { key: 'phone', icon: '📱', title: 'Get a Dutch phone number' },
    { key: 'bank', icon: '🏦', title: 'Open a Dutch bank account' },
    { key: 'healthInsurance', icon: '🏥', title: 'Arrange health insurance' },
    { key: 'gp', icon: '🩺', title: 'Register with a GP' },
    { key: 'travelCard', icon: '🚆', title: 'Get a student travel product' },
    { key: 'housingAllowance', icon: '🏠', title: 'Apply for Huurtoeslag' }
  ];
  if (state.origin === 'noneu') items.push({ key: 'residencePermit', icon: '🛂', title: 'Arrange your residence permit' });

  let nextAssigned = false;
  return items.map(item => {
    const done = !!state.completed[item.key];
    let status = 'todo', statusLabel = 'Not started';
    if (done) { status = 'done'; statusLabel = 'Done'; }
    else if (!nextAssigned) { status = 'next'; statusLabel = 'Up next'; nextAssigned = true; }
    return { ...item, status, statusLabel };
  });
}

function detailContent(key) {
  const d = {
    bsn: {
      eyebrow: 'ADMINISTRATIVE STEP', title: 'Get your BSN',
      desc: "The BSN (citizen service number) is issued automatically once you register in the Dutch personal records database (BRP). You'll need it for healthcare, education and benefits.",
      reqs: [
        { ic: '🛂', t: 'Passport or ID', on: true },
        { ic: '🏠', t: 'Dutch address', on: state.accommodation === 'yes' },
        { ic: '📅', t: 'Municipality appointment', on: false }
      ],
      links: [
        { label: 'Register with your municipality (Government.nl)', url: 'https://www.government.nl/topics/personal-data/question-and-answer/when-should-i-register-with-the-personal-records-database-as-a-resident' },
        { label: 'Staying under 4 months or living abroad? Register via RNI (NetherlandsWorldwide.nl)', url: 'https://www.netherlandsworldwide.nl/bsn/how-to-get' }
      ]
    },
    digid: {
      eyebrow: 'ADMINISTRATIVE STEP', title: 'Create a DigiD',
      desc: "DigiD is your digital login for Dutch government services — tax office, housing, healthcare and more. You need a BSN before you can apply.",
      reqs: [
        { ic: '🏛', t: 'Your BSN', on: state.completed.bsn },
        { ic: '📱', t: 'Phone number', on: state.completed.phone },
        { ic: '✉️', t: 'Valid email', on: true }
      ],
      links: [
        { label: 'Apply for DigiD (DigiD.nl)', url: 'https://www.digid.nl/en/apply-and-activate/apply-digid' }
      ]
    },
    phone: {
      eyebrow: 'ADMINISTRATIVE STEP', title: 'Get a Dutch phone number',
      desc: "A Dutch SIM lets you register for services that only accept local numbers, like DigiD and your bank. Prepaid SIMs are available at supermarkets and phone shops.",
      reqs: [
        { ic: '🛂', t: 'Passport or ID', on: true },
        { ic: '💳', t: 'Payment method', on: false },
        { ic: '🏠', t: 'Dutch address (postpaid only)', on: state.accommodation === 'yes' }
      ],
      links: [
        { label: 'Compare Dutch providers (Independer.nl)', url: 'https://www.independer.nl/mobiel/index.aspx' }
      ]
    },
    bank: {
      eyebrow: 'ADMINISTRATIVE STEP', title: 'Open a Dutch bank account',
      desc: "Most Dutch banks need your BSN and a Dutch address before they'll open an account for you. Bring ID to your appointment or upload it online.",
      reqs: [
        { ic: '🏛', t: 'Your BSN', on: state.completed.bsn },
        { ic: '🏠', t: 'Dutch address', on: state.accommodation === 'yes' },
        { ic: '🛂', t: 'Passport or ID', on: false }
      ],
      links: [
        { label: 'ABN AMRO — open an account online', url: 'https://www.abnamro.nl/en/personal/payments/open-an-account/index.html' },
        { label: 'ING — open an account', url: 'https://www.ing.nl/en/personal/bank-account' }
      ]
    },
    healthInsurance: {
      eyebrow: 'ADMINISTRATIVE STEP', title: 'Arrange health insurance',
      desc: "Dutch law requires anyone working or studying with a part-time job to take out basic Dutch health insurance, usually within 4 months of becoming eligible.",
      reqs: [
        { ic: '🏛', t: 'Your BSN', on: state.completed.bsn },
        { ic: '💼', t: 'Employment status confirmed', on: !!state.employment },
        { ic: '📄', t: 'Proof of income (if working)', on: false }
      ],
      links: [
        { label: 'When do I need Dutch health insurance? (Government.nl)', url: 'https://www.government.nl/topics/health-insurance/question-and-answer/when-do-i-need-to-take-out-health-insurance-if-i-come-to-live-in-the-netherlands' },
        { label: 'Compare Dutch insurers (Zorgwijzer.nl)', url: 'https://www.zorgwijzer.nl/en' }
      ]
    },
    gp: {
      eyebrow: 'ADMINISTRATIVE STEP', title: 'Register with a GP',
      desc: "Registering with a local huisarts (GP) as soon as you arrive means you're covered if you need care later — some practices have waitlists.",
      reqs: [
        { ic: '🏦', t: 'Dutch bank account', on: state.completed.bank },
        { ic: '🏥', t: 'Health insurance', on: state.completed.healthInsurance },
        { ic: '🏠', t: 'Dutch address', on: state.accommodation === 'yes' }
      ],
      links: [
        { label: 'Find a GP near you (ZorgkaartNederland.nl)', url: 'https://www.zorgkaartnederland.nl' }
      ]
    },
    travelCard: {
      eyebrow: 'ADMINISTRATIVE STEP', title: 'Get a student travel product',
      desc: "If you're eligible, DUO's student travel product gives free or discounted public transport on weekdays or weekends — apply through Studielink once enrolled.",
      reqs: [
        { ic: '🎓', t: 'Confirmed enrollment', on: state.admission === 'yes' },
        { ic: '🏛', t: 'Your BSN', on: state.completed.bsn },
        { ic: '💳', t: 'OV-chipkaart', on: false }
      ],
      links: [
        { label: 'Apply for the student travel product (DUO.nl)', url: 'https://duo.nl/particulier/student-travel-product/' }
      ]
    },
    housingAllowance: {
      eyebrow: 'ADMINISTRATIVE STEP', title: 'Apply for Huurtoeslag',
      desc: "Huurtoeslag is a rent subsidy for lower incomes renting independently. Whether you qualify depends on your rent, income and type of accommodation.",
      reqs: [
        { ic: '🏠', t: 'Independent rental contract', on: state.accommodationType === 'private' || state.accommodationType === 'student' },
        { ic: '🆔', t: 'DigiD', on: state.completed.digid },
        { ic: '💶', t: 'Income under threshold', on: false }
      ],
      links: [
        { label: 'Apply via Mijn Toeslagen (Belastingdienst.nl)', url: 'https://www.belastingdienst.nl/wps/wcm/connect/nl/huurtoeslag/content/hoe-moet-ik-huurtoeslag-aanvragen' }
      ]
    },
    residencePermit: {
      eyebrow: 'ADMINISTRATIVE STEP', title: 'Arrange your residence permit',
      desc: "Non-EU students typically need a residence permit tied to their study programme — usually arranged together with your university via the IND.",
      reqs: [
        { ic: '🎓', t: 'Admission confirmation', on: state.admission === 'yes' },
        { ic: '🛂', t: 'Valid passport', on: true },
        { ic: '💶', t: 'Proof of sufficient funds', on: false }
      ],
      links: [
        { label: 'Study residence permit requirements (IND.nl)', url: 'https://ind.nl/en/residence-permits/study' }
      ]
    }
  };
  return d[key] || d.bsn;
}

function renderDetail(activeKey, isDetailView) {
  const d = detailContent(activeKey);
  const contentClass = `${isDetailView ? 'flex' : 'hidden'} md:flex flex-col flex-1 bg-cream md:overflow-y-auto`;

  return `
    <div class="${contentClass}">
      <div class="md:hidden px-5 pt-6 pb-4 bg-navy text-white flex-none">
        <div class="text-[12px] text-[#aab4cc] font-semibold uppercase tracking-wide">Your roadmap</div>
        <h2 class="text-[21px] font-extrabold mt-1">${d.title}</h2>
      </div>
      <div class="px-5 sm:px-8 md:px-10 pt-5 md:pt-10 pb-6 flex-1">
        <div id="btn-back-roadmap" class="md:hidden inline-flex items-center gap-1.5 text-[12.5px] font-bold text-muted hover:text-orange cursor-pointer mb-4">← Back to roadmap</div>
        <div class="text-orange font-extrabold text-[11px] uppercase tracking-wide">${d.eyebrow}</div>
        <h3 class="text-[19px] md:text-[26px] font-extrabold text-navy mt-1.5 mb-2 md:mb-3">${d.title}</h3>
        <p class="text-[13px] md:text-[14.5px] text-muted leading-relaxed mb-5 md:mb-7 max-w-lg">${d.desc}</p>
        <div class="flex flex-col sm:flex-row gap-2.5 mb-5 md:mb-7 max-w-xl">
          ${d.reqs.map(r => `
            <div class="flex-1 bg-white border-[1.5px] border-line rounded-xl p-3 md:p-4 text-left">
              <div class="text-[18px] mb-2">${r.ic}</div>
              <div class="text-[12px] md:text-[13px] font-extrabold text-navy leading-snug">${r.t}</div>
              <div class="text-[10.5px] md:text-[11px] font-bold mt-1 ${r.on ? 'text-leaf' : 'text-orange-dark'}">${r.on ? 'On file' : 'Needed'}</div>
            </div>
          `).join('')}
        </div>
        <div class="flex flex-col gap-2.5 max-w-lg">
          ${d.links.map(l => `
            <a href="${l.url}" target="_blank" rel="noopener noreferrer"
               class="flex items-center justify-between gap-3 py-3.5 px-4 sm:px-5 rounded-xl bg-orange text-white font-bold text-[14px] sm:text-[15px] shadow-cta active:scale-[0.98] hover:brightness-105 transition">
              <span>${l.label}</span>
              <span class="flex-none text-[16px]">↗</span>
            </a>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

/* ---------- render + events ---------- */

function render() {
  const name = currentStep();
  updateShellWidth(name);
  screenEl.innerHTML = renderers[name]();
  bindEvents(name);
  screenEl.scrollTop = 0;
}

function updateShellWidth(name) {
  const shell = document.getElementById('app-shell');
  if (!shell) return;
  shell.className = name === 'dashboard'
    ? 'w-full h-full max-w-3xl lg:max-w-6xl transition-[max-width] duration-300'
    : 'w-full h-full max-w-xl transition-[max-width] duration-300';
}

function bindEvents(name) {
  const back = document.getElementById('btn-back');
  if (back) back.onclick = () => goBack();

  const next = document.getElementById('btn-next');

  if (name === 'welcome') {
    document.getElementById('btn-start').onclick = () => goForward();
  }

  if (name === 'dob') {
    const input = document.getElementById('input-dob');
    input.oninput = () => { state.dob = input.value; };
    if (next) next.onclick = () => goForward();
  }

  if (['origin', 'programme', 'admission', 'accommodation', 'accType', 'employment'].includes(name)) {
    screenEl.querySelectorAll('[data-choice]').forEach(el => {
      el.onclick = () => {
        const val = el.dataset.choice;
        if (name === 'origin') state.origin = val;
        if (name === 'programme') state.programme = val;
        if (name === 'admission') state.admission = val;
        if (name === 'accommodation') { state.accommodation = val; if (val === 'no') state.accommodationType = null; }
        if (name === 'accType') state.accommodationType = val;
        if (name === 'employment') state.employment = val;
        render();
      };
    });
    if (next) next.onclick = () => goForward();
  }

  if (name === 'checklist') {
    screenEl.querySelectorAll('[data-toggle]').forEach(el => {
      el.onclick = () => {
        const k = el.dataset.toggle;
        state.completed[k] = !state.completed[k];
        render();
      };
    });
    if (next) next.onclick = () => goForward();
  }

  if (name === 'name') {
    const input = document.getElementById('input-name');
    input.oninput = () => { state.firstName = input.value; };
    if (next) next.onclick = () => {
      if (!state.firstName.trim()) state.firstName = 'Friend';
      goForward();
    };
  }

  if (name === 'done') {
    document.getElementById('btn-see-plan').onclick = () => goForward();
  }

  if (name === 'dashboard') {
    const backLink = document.getElementById('btn-back-roadmap');
    if (backLink) backLink.onclick = () => { state.dashboardView = 'roadmap'; render(); };

    screenEl.querySelectorAll('[data-detail]').forEach(el => {
      el.onclick = () => {
        state.activeDetail = el.dataset.detail;
        state.dashboardView = 'detail';
        render();
      };
    });

    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) resetBtn.onclick = () => {
      Object.assign(state, {
        history: ['welcome'],
        dob: '', origin: null, programme: null, admission: null,
        accommodation: null, accommodationType: null, employment: null,
        completed: {
          bsn: false, digid: false, phone: false, bank: false,
          healthInsurance: false, gp: false, travelCard: false,
          housingAllowance: false, residencePermit: false
        },
        firstName: '', dashboardView: 'roadmap', activeDetail: null
      });
      render();
    };
  }
}

render();
