const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(res, statusCode, body) {
  res.status(statusCode).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function normalize(value) {
  return String(value || '').trim();
}

function isSpam({ name, email, message, website, company }) {
  return Boolean(website || company || name.length > 120 || email.length > 200 || message.length > 4000);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const { name, email, message, website = '', company = '' } = req.body || {};
    const cleanName = normalize(name);
    const cleanEmail = normalize(email);
    const cleanMessage = normalize(message);

    const errors = {};
    if (!cleanName) errors.name = 'Namn är obligatoriskt.';
    if (!cleanEmail) errors.email = 'E-postadress är obligatorisk.';
    else if (!EMAIL_REGEX.test(cleanEmail)) errors.email = 'Ange en giltig e-postadress.';
    if (!cleanMessage) errors.message = 'Kommentar är obligatorisk.';
    if (cleanMessage.length > 4000) errors.message = 'Meddelandet är för långt.';

    if (isSpam({ name: cleanName, email: cleanEmail, message: cleanMessage, website, company })) {
      return json(res, 400, { error: 'Ogiltig förfrågan.' });
    }

    if (Object.keys(errors).length) {
      return json(res, 400, { error: 'Validering misslyckades.', fields: errors });
    }

    const to = process.env.CONTACT_TO_EMAIL || 'yousef_aria@yahoo.se';
    const from = process.env.RESEND_FROM_EMAIL;
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey || !from) {
      return json(res, 500, {
        error: 'Mailtjänsten är inte konfigurerad. Ställ in RESEND_API_KEY och RESEND_FROM_EMAIL.',
      });
    }

    const now = new Date();
    const timestamp = now.toLocaleString('sv-SE', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Stockholm' });

    const subject = `SparVision kontakt från ${cleanName}`;
    const text = [
      `Namn: ${cleanName}`,
      `E-post: ${cleanEmail}`,
      `Datum och tid: ${timestamp}`,
      '',
      'Meddelande:',
      cleanMessage,
    ].join('\n');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: cleanEmail,
        subject,
        text,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return json(res, 502, {
        error: data?.message || 'Det gick inte att skicka meddelandet.',
      });
    }

    return json(res, 200, {
      ok: true,
      message: 'Tack! Ditt meddelande har skickats.',
    });
  } catch (error) {
    return json(res, 500, { error: 'Ett oväntat fel uppstod.' });
  }
};
