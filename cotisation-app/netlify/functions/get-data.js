const { getStore } = require('@netlify/blobs');

const STORE = 'cotisation';
const KEY = 'data';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET,OPTIONS' } };
  }

  try {
    const store = getStore(STORE);
    const data = await store.get(KEY, { type: 'json' });

    if (!data) {
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ hasPin: false }) };
    }

    const pin = event.queryStringParameters && event.queryStringParameters.pin;

    // No PIN provided — just report that setup is done
    if (!pin) {
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ hasPin: true }) };
    }

    // Validate PIN
    if (data.pin !== pin) {
      return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'PIN incorrect' }) };
    }

    // Return everything except the stored PIN
    const { pin: _, ...safe } = data;
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ...safe, hasPin: true }) };

  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
