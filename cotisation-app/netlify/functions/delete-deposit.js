const { getStore } = require('@netlify/blobs');

const STORE = 'cotisation';
const KEY = 'data';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

exports.handler = async (event) => {
  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { pin, id } = JSON.parse(event.body || '{}');

    if (!pin) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'PIN requis' }) };
    if (!id) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'ID du dépôt requis' }) };

    const store = getStore(STORE);
    const data = await store.get(KEY, { type: 'json' });

    if (!data) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Espace non configuré' }) };
    if (data.pin !== pin) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'PIN incorrect' }) };

    const before = (data.deposits || []).length;
    data.deposits = (data.deposits || []).filter(d => d.id !== id);

    if (data.deposits.length === before) {
      return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Dépôt introuvable' }) };
    }

    await store.setJSON(KEY, data);

    const { pin: _, ...safe } = data;
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ...safe, hasPin: true }) };

  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
