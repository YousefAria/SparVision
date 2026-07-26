const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('[data-menu-button]');
const nav = document.querySelector('[data-nav]');
const contactForm = document.querySelector('[data-contact-form]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function updateHeader() {
  header?.classList.toggle('scrolled', window.scrollY > 24);
}

function closeMenu() {
  if (!menuButton || !nav) return;
  menuButton.setAttribute('aria-expanded', 'false');
  nav.classList.remove('open');
  document.body.classList.remove('menu-open');
}

menuButton?.addEventListener('click', () => {
  const opening = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(opening));
  nav?.classList.toggle('open', opening);
  document.body.classList.toggle('menu-open', opening);
});

nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
window.addEventListener('resize', () => {
  if (window.innerWidth > 980) closeMenu();
});
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

document.querySelectorAll('[data-year]').forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});

const revealItems = document.querySelectorAll('.reveal');
if (reducedMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item) => observer.observe(item));
}

function showFieldError(fieldName, message) {
  const errorNode = document.querySelector(`[data-error-for="${fieldName}"]`);
  if (!errorNode) return;
  errorNode.textContent = message || '';
  errorNode.hidden = !message;
}

function clearErrors() {
  ['name', 'email', 'message'].forEach((field) => showFieldError(field, ''));
}

function setStatus(message, type = '') {
  const statusNode = document.querySelector('[data-form-status]');
  if (!statusNode) return;
  statusNode.textContent = message;
  statusNode.dataset.state = type;
}

contactForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearErrors();
  setStatus('');

  const formData = new FormData(contactForm);
  const payload = Object.fromEntries(formData.entries());
  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim();
  const message = String(payload.message || '').trim();
  const website = String(payload.website || '').trim();
  const submitButton = contactForm.querySelector('[data-contact-submit]');

  let hasError = false;
  if (!name) { showFieldError('name', 'Namn är obligatoriskt.'); hasError = true; }
  if (!email) { showFieldError('email', 'E-postadress är obligatorisk.'); hasError = true; }
  else if (!/^\S+@\S+\.\S+$/.test(email)) { showFieldError('email', 'Ange en giltig e-postadress.'); hasError = true; }
  if (!message) { showFieldError('message', 'Kommentar är obligatorisk.'); hasError = true; }

  if (website) {
    setStatus('');
    return;
  }

  if (hasError) {
    setStatus('Kontrollera fälten ovan.', 'error');
    return;
  }

  try {
    submitButton && (submitButton.disabled = true);
    setStatus('Skickar...', 'pending');

    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message, website }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const fields = data.fields || {};
      if (fields.name) showFieldError('name', fields.name);
      if (fields.email) showFieldError('email', fields.email);
      if (fields.message) showFieldError('message', fields.message);
      setStatus(data.error || 'Det gick inte att skicka meddelandet.', 'error');
      return;
    }

    contactForm.reset();
    setStatus(data.message || 'Tack! Ditt meddelande har skickats.', 'success');
  } catch (error) {
    setStatus('Något gick fel när meddelandet skulle skickas.', 'error');
  } finally {
    submitButton && (submitButton.disabled = false);
  }
});
