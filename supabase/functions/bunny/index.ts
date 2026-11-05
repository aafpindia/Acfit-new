// Follow this setup guide to deploy to Supabase:
// https://supabase.com/docs/guides/functions
// Command: supabase functions deploy bunny

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

const BUNNY_API_BASE = 'https://video.bunnycdn.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    const apiKey = Deno.env.get('BUNNY_API_KEY');
    const libraryId = Deno.env.get('BUNNY_LIBRARY_ID') || '784894';

    // 1. Create Video: POST /bunny/create-video
    if (path === 'create-video' || path === 'bunny') {
      const { title } = await req.json().catch(() => ({ title: 'Untitled Lesson Video' }));
      
      if (!apiKey) {
        const mockGuid = `bny-guid-${Date.now().toString(36)}-${Math.floor(Math.random() * 10000)}`;
        return new Response(JSON.stringify({ success: true, videoId: mockGuid, libraryId, isSimulated: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const res = await fetch(`${BUNNY_API_BASE}/library/${libraryId}/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'AccessKey': apiKey,
        },
        body: JSON.stringify({ title: title || 'Untitled Lesson Video' }),
      });

      const data = await res.json();
      return new Response(JSON.stringify({ success: res.ok, videoId: data.guid, libraryId }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. TUS Signature: POST /bunny/tus-signature
    if (path === 'tus-signature') {
      const { videoId } = await req.json();
      if (!videoId) {
        return new Response(JSON.stringify({ error: 'videoId is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!apiKey || videoId.startsWith('bny-guid-')) {
        return new Response(JSON.stringify({ success: true, isSimulated: true, videoId, libraryId }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const expirationTimestamp = Math.floor(Date.now() / 1000) + 86400;
      const message = `${libraryId}${apiKey}${expirationTimestamp}${videoId}`;
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const signature = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      return new Response(
        JSON.stringify({
          success: true,
          signature,
          expirationTimestamp: expirationTimestamp.toString(),
          libraryId,
          videoId,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Video Status: GET /bunny/video-status?videoId=...
    if (path === 'video-status') {
      const videoId = url.searchParams.get('videoId');
      if (!videoId) {
        return new Response(JSON.stringify({ error: 'videoId is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!apiKey || videoId.startsWith('bny-guid-')) {
        return new Response(JSON.stringify({ status: 'finished', isSimulated: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const res = await fetch(`${BUNNY_API_BASE}/library/${libraryId}/videos/${videoId}`, {
        headers: { AccessKey: apiKey },
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
