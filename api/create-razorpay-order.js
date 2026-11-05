/**
 * Serverless / Middleware Endpoint: Create Razorpay Order
 *
 * Generates an official order_id via Razorpay Orders API when credentials
 * are present, or returns a simulated order in development/mock mode.
 */

export async function parseRequestBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

export function sendResponse(res, statusCode, data) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export async function handleCreateOrder(req, res) {
  // Handle CORS / preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    return sendResponse(res, 405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    const body = await parseRequestBody(req);
    const { amount, currency = 'INR', courseId, receipt } = body;

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    const amountInPaise = Math.round(Number(amount || 0) * 100);

    // If Razorpay keys are not configured, return simulated order for mock mode
    if (!keyId || !keySecret) {
      const mockOrderId = `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      return sendResponse(res, 200, {
        success: true,
        orderId: mockOrderId,
        amount: amountInPaise,
        currency,
        mock: true,
      });
    }

    // Call official Razorpay Orders API
    const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
    const orderPayload = {
      amount: amountInPaise,
      currency: currency || 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: {
        courseId: courseId ? String(courseId) : '',
      },
    };

    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(orderPayload),
    });

    const rzpData = await rzpResponse.json();

    if (!rzpResponse.ok) {
      console.error('[Razorpay Order Creation Error]', rzpData);
      return sendResponse(res, rzpResponse.status || 500, {
        success: false,
        error: rzpData.error?.description || 'Failed to create Razorpay order',
      });
    }

    return sendResponse(res, 200, {
      success: true,
      orderId: rzpData.id,
      amount: rzpData.amount,
      currency: rzpData.currency,
      receipt: rzpData.receipt,
    });
  } catch (err) {
    console.error('[Razorpay Order Exception]', err);
    return sendResponse(res, 500, {
      success: false,
      error: err.message || 'Internal server error while creating order',
    });
  }
}

export default handleCreateOrder;

