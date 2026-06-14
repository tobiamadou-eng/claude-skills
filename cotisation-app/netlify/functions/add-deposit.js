const { getStore } = require('@netlify/blobs');

const STORE = 'cotisation';
const KEY = 'data';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { pin, who, amount, date, note } = JSON.parse(event.body || '{}');

    if (!pin) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'PIN requis' }) };
    if (!who || !['me', 'brother'].includes(who)) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Valeur "who" invalide' }) };
    if (!amount || typeof amount !== 'number' || amount <= 0) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Montant invalide' }) };
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Date invalide' }) };

    const store = getStore(STORE);
    const data = await store.get(KEY, { type: 'json' });

    if (!data) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Espace non configuré' }) };
    if (data.pin !== pin) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'PIN incorrect' }) };

    const deposit = {
      id: 'dep_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      who,
      amount: Math.round(amount * 100) / 100,
      date,
      note: (note || '').trim(),
      createdAt: new Date().toISOString()
    };

    data.deposits = [...(data.deposits || []), deposit];
    await store.setJSON(KEY, data);

    const { pin: _, ...safe } = data;
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ...safe, hasPin: true }) };

  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
