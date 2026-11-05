/**
 * Serverless / Middleware Endpoint: Generate Bunny TUS Upload Signature
 *
 * Computes pre-signed SHA-256 AuthorizationSignature for TUS direct client upload.
 * Formula: SHA256(LibraryId + ApiKey + ExpirationTimestamp + VideoId)
 *
 * Allows client browser to upload video chunks directly to Bunny Stream
 * without exposing the master BUNNY_API_KEY.
 */

import crypto from 'node:crypto';
import { parseRequestBody, sendResponse, handleCors } from '../_utils.js';

export async function handleBunnyTusSignature(req, res) {
  if (handleCors(req, res, 'POST, OPTIONS')) return;

  if (req.method !== 'POST') {
    return sendResponse(res, 405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    const body = await parseRequestBody(req);
    const videoId = body.videoId;

    if (!videoId) {
      return sendResponse(res, 400, {
        success: false,
        error: 'Missing required videoId for TUS signature generation',
      });
    }

    const apiKey = process.env.BUNNY_API_KEY || process.env.VITE_BUNNY_API_KEY;
    const libraryId = String(body.libraryId || process.env.BUNNY_LIBRARY_ID || process.env.VITE_BUNNY_LIBRARY_ID || '784894');

    // If API key is missing or videoId is simulated, return simulation response
    if (!apiKey || videoId.startsWith('bny-guid-')) {
      return sendResponse(res, 200, {
        success: true,
        isSimulated: true,
        videoId,
        libraryId,
      });
    }

    // Expiration: 24 hours (86400 seconds) from now
    const expirationTimestamp = Math.floor(Date.now() / 1000) + 86400;

    // Formula: SHA256(LibraryId + ApiKey + ExpirationTimestamp + VideoId)
    const signaturePayload = `${libraryId}${apiKey}${expirationTimestamp}${videoId}`;
    const signature = crypto.createHash('sha256').update(signaturePayload).digest('hex');

    return sendResponse(res, 200, {
      success: true,
      signature,
      expirationTimestamp: expirationTimestamp.toString(),
      libraryId,
      videoId,
      isSimulated: false,
    });
  } catch (err) {
    console.error('[Bunny TUS Signature Exception]', err);
    return sendResponse(res, 500, {
      success: false,
      error: err.message || 'Internal server error while generating TUS signature',
    });
  }
}

export default handleBunnyTusSignature;
