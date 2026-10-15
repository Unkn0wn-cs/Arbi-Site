// Sign-up: quick-pick chips, the three-step form, the Google Sheets hookup and the confirmation panel.
(() => {
  // Apps Script web app that writes to the club's sheet (source: registro-apps-script.gs in the design).
  // GET ?check=1&ci=…&carnet=… answers {result:'ok'|'duplicate'}; POST (JSON as text/plain) saves a row.
  const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzwvq1cgZEvNO7H1vfdfPkCVJxDGGkK5-6HY1XTxJXy7lh0gGKt_5FoVefDXZrw_Zj04g/exec';
  const MSG = {
    duplicate: 'Ya existe una inscripción con esta CI o carnet. Si crees que es un error, escríbenos por WhatsApp.',
    verify: 'No pudimos verificar tus datos. Revisa tu conexión e inténtalo de nuevo.',
    send: 'No pudimos enviar tu inscripción. Revisa tu conexión e inténtalo de nuevo.',
  };

  const form = document.getElementById('join-form');
  const done = document.getElementById('join-done');
  const section = document.getElementById('unete');
  if (!form || !done || !section) return;

  const panels = [...form.querySelectorAll('[data-step]')];
  const bars = [...form.querySelectorAll('[data-bar]')];
  const stepNum = form.querySelector('[data-step-num]');
  const stepLabel = form.querySelector('[data-step-label]');
  const hint = form.querySelector('[data-hint]');
  const alertBox = form.querySelector('[data-alert]');
  const alertText = form.querySelector('[data-alert-text]');
  const backBtn = form.querySelector('[data-back]');
  const nextBtn = form.querySelector('[data-next]');
  const expDetail = form.querySelector('[data-exp-detail]');
  const LABELS = ['Intereses', 'Datos personales', 'Experiencia'];
  const f = form.elements;

  let step = 1;
  let sending = false;

  const checked = name => form.querySelectorAll(`input[name="${name}"]:checked`);
  const filled = name => f[name].value.trim() !== '';
  const val = name => f[name].value.trim();
  const list = name => [...checked(name)].map(box => box.value).join(', ');

  const canAdvance = () => {
    if (step === 1) return checked('intereses').length > 0;
    if (step === 2) {
      return ['nombre', 'ci', 'carnet', 'tel', 'correo'].every(filled) && f.correo.validity.valid && f.carrera.value !== '';
    }
    return true;
  };

  const hintText = ok => {
    if (step === 1) {
      const n = checked('intereses').length;
      return ok ? `${n} seleccionada${n === 1 ? '' : 's'}` : 'Elige al menos una opción';
    }
    return step === 2 && !ok ? 'Completa los campos con *' : '';
  };

  const setAlert = message => {
    alertText.textContent = message;
    alertBox.hidden = !message;
  };

  // Cheap enough to run on every input: button state and label, hint, and the "what have you done" box.
  const update = () => {
    const ok = canAdvance();
    nextBtn.disabled = !ok || sending;
    nextBtn.textContent = sending ? (step === 2 ? 'Verificando…' : 'Enviando…') : step === 3 ? 'Enviar inscripción' : 'Continuar →';
    hint.textContent = hintText(ok);
    expDetail.hidden = f.experiencia_previa.value !== 'si';
  };

  const render = () => {
    panels.forEach((p, i) => { p.hidden = i + 1 !== step; });
    stepNum.textContent = step;
    stepLabel.textContent = LABELS[step - 1];
    bars.forEach((b, i) => b.classList.toggle('is-on', i < step));
    backBtn.hidden = step === 1;
    update();
  };

  const scrollToForm = () => window.scrollTo({ top: section.getBoundingClientRect().top + window.scrollY - 64, behavior: 'smooth' });
  // The panels differ in height; if the top of the card has scrolled away, bring it back.
  const keepInView = () => { if (section.getBoundingClientRect().top < -40) scrollToForm(); };
  const focusHeading = root => { const h = root.querySelector('[tabindex="-1"]'); if (h) h.focus({ preventScroll: true }); };

  const go = n => {
    step = n;
    setAlert('');
    render();
    focusHeading(panels[step - 1]);
    keepInView();
  };

  const showForm = n => {
    done.hidden = true;
    form.hidden = false;
    step = n;
    setAlert('');
    render();
  };

  const showDone = () => {
    done.querySelector('[data-first-name]').textContent = val('nombre').split(/\s+/)[0] || 'nuevo miembro';
    done.querySelector('[data-picked]').replaceChildren(...[...checked('intereses')].map(box => {
      const tag = document.createElement('span');
      tag.className = 'tag tag-neutral';
      tag.textContent = box.value;
      return tag;
    }));
    form.hidden = true;
    done.hidden = false;
    focusHeading(done);
    keepInView();
  };

  // Runs one network step with the "sending" state around it; fn resolves to the script's {result} object.
  const request = async (fn, failMessage, onOk) => {
    sending = true;
    setAlert('');
    update();
    try {
      const reply = await fn();
      sending = false;
      if (reply.result === 'duplicate') { update(); setAlert(MSG.duplicate); }
      else if (reply.result === 'ok') onOk();
      else throw new Error(reply.message || 'error');
    } catch (err) {
      sending = false;
      update();
      setAlert(failMessage);
    }
  };

  // Step 2 → 3: refuse a CI or carnet that is already in the sheet before asking for the rest.
  const verify = () => request(
    async () => (await fetch(`${SHEET_URL}?check=1&ci=${encodeURIComponent(val('ci'))}&carnet=${encodeURIComponent(val('carnet'))}`)).json(),
    MSG.verify,
    () => go(3),
  );

  const send = () => request(
    async () => {
      const payload = {
        nombre: val('nombre'), ci: val('ci'), carnet: val('carnet'), correo: val('correo'), telefono: val('tel'),
        carrera: f.carrera.value, seleccion: f.seleccion.value, programa: f.programa.value,
        intereses: list('intereses'), trimestre: f.trimestre.value, experiencia: f.experiencia_previa.value,
        detalle: f.experiencia_previa.value === 'si' ? val('experiencia_detalle') : '',
        herramientas: list('herramientas'),
      };
      // text/plain keeps this a "simple" request, so the browser skips the CORS preflight Apps Script can't answer
      const res = await fetch(SHEET_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
      return res.json();
    },
    MSG.send,
    showDone,
  );

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (sending || !canAdvance()) return;
    if (step === 1) go(2);
    else if (step === 2) verify();
    else send();
  });
  backBtn.addEventListener('click', () => go(step - 1));
  done.querySelector('[data-restart]').addEventListener('click', () => { showForm(1); focusHeading(panels[0]); keepInView(); });

  // "Toca una y empieza tu inscripción": tick that interest, open step 1 and jump to the form.
  document.querySelectorAll('[data-quick-pick]').forEach(btn => btn.addEventListener('click', () => {
    const box = [...form.querySelectorAll('input[name="intereses"]')].find(i => i.value === btn.dataset.quickPick);
    if (box) box.checked = true;
    showForm(1);
    scrollToForm();
  }));

  render();
})();
