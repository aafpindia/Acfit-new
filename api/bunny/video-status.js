/**
 * Serverless / Middleware Endpoint: Get Bunny Video Processing Status
 *
 * Checks transcoding & replication status from Bunny Stream API using server-side key.
 */

import { parseRequestBody, sendResponse, handleCors } from '../_utils.js';

const BUNNY_API_BASE = 'https://video.bunnycdn.com';

const statusMap = {
  0: 'created',
  1: 'uploaded',
  2: 'processing',
  3: 'transcoding',
  4: 'finished',
  5: 'error',
  6: 'upload_failed',
};

export async function handleBunnyVideoStatus(req, res) {
  if (handleCors(req, res, 'GET, POST, OPTIONS')) return;

  if (req.method !== 'GET' && req.method !== 'POST') {
    return sendResponse(res, 405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    let videoId = null;
    if (req.method === 'GET') {
      const urlObj = new URL(req.url, 'http://localhost');
      videoId = urlObj.searchParams.get('videoId');
    } else {
      const body = await parseRequestBody(req);
      videoId = body.videoId;
    }

    if (!videoId) {
      return sendResponse(res, 400, { success: false, error: 'Missing required videoId' });
    }

    const apiKey = process.env.BUNNY_API_KEY || process.env.VITE_BUNNY_API_KEY;
    const libraryId = process.env.BUNNY_LIBRARY_ID || process.env.VITE_BUNNY_LIBRARY_ID || '784894';

    // Mock / Simulated videos
    if (!apiKey || videoId.startsWith('bny-guid-')) {
      return sendResponse(res, 200, {
        status: 'finished',
        statusCode: 4,
        encodeProgress: 100,
        isSimulated: true,
      });
    }

    const response = await fetch(`${BUNNY_API_BASE}/library/${libraryId}/videos/${videoId}`, {
      headers: {
        AccessKey: apiKey,
      },
    });

    if (!response.ok) {
      return sendResponse(res, response.status, {
        status: 'error',
        httpStatus: response.status,
      });
    }

    const data = await response.json();

    return sendResponse(res, 200, {
      status: statusMap[data.status] || 'unknown',
      statusCode: data.status,
      encodeProgress: data.encodeProgress || 0,
      width: data.width,
      height: data.height,
      duration: data.length,
      availableResolutions: data.availableResolutions,
    });
  } catch (err) {
    console.error('[Bunny Video Status Exception]', err);
    return sendResponse(res, 500, {
      status: 'error',
      error: err.message || 'Internal server error while fetching video status',
    });
  }
}

export default handleBunnyVideoStatus;
