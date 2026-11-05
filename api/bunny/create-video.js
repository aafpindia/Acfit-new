/**
 * Serverless / Middleware Endpoint: Create Bunny Stream Video
 *
 * Securely creates a video GUID in Bunny Stream using the server-side API Key.
 * Prevents client-side exposure of BUNNY_API_KEY.
 */

import { parseRequestBody, sendResponse, handleCors } from '../_utils.js';

const BUNNY_API_BASE = 'https://video.bunnycdn.com';

export async function handleCreateBunnyVideo(req, res) {
  if (handleCors(req, res, 'POST, OPTIONS')) return;

  if (req.method !== 'POST') {
    return sendResponse(res, 405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    const body = await parseRequestBody(req);
    const title = body.title || 'Untitled Lesson Video';

    const apiKey = process.env.BUNNY_API_KEY || process.env.VITE_BUNNY_API_KEY;
    const libraryId = process.env.BUNNY_LIBRARY_ID || process.env.VITE_BUNNY_LIBRARY_ID || '784894';

    // If API key is not configured, generate simulated video GUID for mock mode
    if (!apiKey) {
      const generatedGuid = `bny-guid-${Date.now().toString(36)}-${Math.floor(Math.random() * 10000)}`;
      return sendResponse(res, 200, {
        success: true,
        videoId: generatedGuid,
        libraryId,
        isSimulated: true,
      });
    }

    const response = await fetch(`${BUNNY_API_BASE}/library/${libraryId}/videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'AccessKey': apiKey,
      },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Bunny Create Video Error]', response.status, errText);
      return sendResponse(res, response.status, {
        success: false,
        error: `Bunny API returned HTTP ${response.status}: ${errText}`,
      });
    }

    const data = await response.json();
    return sendResponse(res, 200, {
      success: true,
      videoId: data.guid,
      libraryId,
      isSimulated: false,
    });
  } catch (err) {
    console.error('[Bunny Create Video Exception]', err);
    return sendResponse(res, 500, {
      success: false,
      error: err.message || 'Internal server error while creating Bunny video',
    });
  }
}

export default handleCreateBunnyVideo;
