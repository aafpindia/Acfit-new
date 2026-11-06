/**
 * Serverless / Middleware Endpoint: Document & Presentation File Upload
 *
 * Saves uploaded PDF and PPT/PPTX documents to public/uploads/
 * and returns clean static URLs (/uploads/<filename>).
 * Prevents main-thread Base64 lag, Supabase 413 payload rejections,
 * and localStorage quota crashes.
 */

import fs from 'fs';
import path from 'path';
import { sendResponse, handleCors } from './_utils.js';

export async function handleUpload(req, res) {
  if (handleCors(req, res, 'POST, OPTIONS')) return;

  if (req.method !== 'POST') {
    return sendResponse(res, 405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const contentType = req.headers['content-type'] || '';
    const rawFileName = req.headers['x-file-name'] || '';
    const originalFileName = rawFileName ? decodeURIComponent(rawFileName) : 'document';
    const mimeType = req.headers['x-file-type'] || 'application/octet-stream';

    // 1. Direct binary / octet-stream upload (fastest, lowest memory overhead)
    if (contentType.includes('application/octet-stream') || rawFileName) {
      const sanitizedName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueFileName = `${Date.now()}-${sanitizedName}`;
      const targetFilePath = path.join(uploadsDir, uniqueFileName);

      const writeStream = fs.createWriteStream(targetFilePath);

      await new Promise((resolve, reject) => {
        req.pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
        req.on('error', reject);
      });

      const stats = fs.statSync(targetFilePath);

      return sendResponse(res, 200, {
        success: true,
        url: `/uploads/${uniqueFileName}`,
        fileName: originalFileName,
        size: stats.size,
        mimeType
      });
    }

    // 2. Multipart form data or raw buffer fallback
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const fullBuffer = Buffer.concat(chunks);

    if (contentType.includes('multipart/form-data')) {
      const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
      const boundary = boundaryMatch ? (boundaryMatch[1] || boundaryMatch[2]) : null;

      let extractedBuffer = fullBuffer;
      let finalFileName = originalFileName || 'uploaded-file';

      if (boundary) {
        const boundaryBuffer = Buffer.from(`--${boundary}`);
        const parts = [];
        let cur = 0;
        while (cur < fullBuffer.length) {
          const idx = fullBuffer.indexOf(boundaryBuffer, cur);
          if (idx === -1) break;
          parts.push(idx);
          cur = idx + boundaryBuffer.length;
        }

        for (let i = 0; i < parts.length - 1; i++) {
          const partBuffer = fullBuffer.slice(parts[i] + boundaryBuffer.length, parts[i + 1]);
          const headerEnd = partBuffer.indexOf(Buffer.from('\r\n\r\n'));
          if (headerEnd !== -1) {
            const headerStr = partBuffer.slice(0, headerEnd).toString('utf8');
            const nameMatch = headerStr.match(/filename="([^"]+)"/i);
            if (nameMatch) {
              finalFileName = nameMatch[1];
              // Body is between headerEnd + 4 and partBuffer.length - 2 (\r\n before next boundary)
              extractedBuffer = partBuffer.slice(headerEnd + 4, partBuffer.length - 2);
              break;
            }
          }
        }
      }

      const sanitizedName = finalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueFileName = `${Date.now()}-${sanitizedName}`;
      const targetFilePath = path.join(uploadsDir, uniqueFileName);
      fs.writeFileSync(targetFilePath, extractedBuffer);
      const stats = fs.statSync(targetFilePath);

      return sendResponse(res, 200, {
        success: true,
        url: `/uploads/${uniqueFileName}`,
        fileName: finalFileName,
        size: stats.size,
        mimeType
      });
    }

    // 3. JSON body fallback ({ fileName, fileData (base64) })
    if (contentType.includes('application/json')) {
      const jsonStr = fullBuffer.toString('utf8');
      const data = JSON.parse(jsonStr || '{}');
      const base64Data = data.fileData?.replace(/^data:[^;]+;base64,/, '') || '';
      const finalFileName = data.fileName || 'uploaded-document';
      const fileBuffer = Buffer.from(base64Data, 'base64');

      const sanitizedName = finalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueFileName = `${Date.now()}-${sanitizedName}`;
      const targetFilePath = path.join(uploadsDir, uniqueFileName);
      fs.writeFileSync(targetFilePath, fileBuffer);
      const stats = fs.statSync(targetFilePath);

      return sendResponse(res, 200, {
        success: true,
        url: `/uploads/${uniqueFileName}`,
        fileName: finalFileName,
        size: stats.size,
        mimeType: data.mimeType || 'application/octet-stream'
      });
    }

    return sendResponse(res, 400, {
      success: false,
      error: 'Unsupported content type for file upload.'
    });
  } catch (err) {
    console.error('[Upload Error]', err);
    return sendResponse(res, 500, {
      success: false,
      error: err.message || 'File upload failed.'
    });
  }
}

