const { getStore } = require('@netlify/blobs');

const STORE = 'cotisation';
const KEY = 'data';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { pin, nameMe, nameBrother, currency } = JSON.parse(event.body || '{}');

    if (!pin || !/^\d{4}$/.test(pin)) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'PIN invalide (4 chiffres requis)' }) };
    }
    if (!nameMe || !nameBrother) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Les deux prénoms sont requis' }) };
    }

    const store = getStore(STORE);
    const existing = await store.get(KEY, { type: 'json' });

    if (existing && existing.pin) {
      return { statusCode: 409, headers: CORS, body: JSON.stringify({ error: 'Un espace existe déjà. Utilisez le PIN pour y accéder.' }) };
    }

    const data = {
      pin,
      members: { me: nameMe.trim(), brother: nameBrother.trim() },
      currency: currency || 'FCFA',
      deposits: [],
      createdAt: new Date().toISOString()
    };

    await store.setJSON(KEY, data);

    const { pin: _, ...safe } = data;
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ...safe, hasPin: true }) };

  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
