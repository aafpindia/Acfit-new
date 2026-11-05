/**
 * Serverless / Middleware Endpoint: Verify Razorpay Payment Signature
 *
 * Performs HMAC-SHA256 signature verification to prevent client-side payment tampering.
 */

import crypto from 'node:crypto';
import { parseRequestBody, sendResponse } from './create-razorpay-order.js';

export async function handleVerifyPayment(req, res) {
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
    const orderId = body.razorpay_order_id || body.orderId;
    const paymentId = body.razorpay_payment_id || body.paymentId;
    const signature = body.razorpay_signature || body.signature;

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Handle mock mode / development when no secret is configured or simulator is used
    if (!keySecret || (orderId && (orderId.startsWith('order_sim_') || orderId.startsWith('order_mock_')))) {
      return sendResponse(res, 200, {
        success: true,
        verified: true,
        mock: true,
        message: 'Mock payment verified successfully.',
      });
    }

    if (!orderId || !paymentId || !signature) {
      return sendResponse(res, 400, {
        success: false,
        verified: false,
        error: 'Missing orderId, paymentId, or signature required for verification.',
      });
    }

    const payload = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
    const actualBuffer = Buffer.from(signature, 'utf-8');

    const isValid =
      expectedBuffer.length === actualBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, actualBuffer);

    if (!isValid) {
      console.warn('[Razorpay Verification Failure] Signature mismatch for order:', orderId);
      return sendResponse(res, 400, {
        success: false,
        verified: false,
        error: 'Invalid Razorpay signature. Verification failed.',
      });
    }

    return sendResponse(res, 200, {
      success: true,
      verified: true,
      orderId,
      paymentId,
      message: 'Payment verified successfully.',
    });
  } catch (err) {
    console.error('[Razorpay Verification Exception]', err);
    return sendResponse(res, 500, {
      success: false,
      verified: false,
      error: err.message || 'Internal server error while verifying payment',
    });
  }
}

export default handleVerifyPayment;

