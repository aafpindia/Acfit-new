/**
 * Serverless / Middleware Endpoint: Document & Presentation File Upload & Auto-Conversion
 *
 * Saves uploaded PDF and PPT/PPTX documents to public/uploads/.
 * Automatically converts PPTX presentations into high-fidelity PDFs using pure-JS
 * engine so that both PDF documents and PPT slides render seamlessly in the
 * HTML5 Canvas Viewbox without requiring third-party viewers or downloads.
 */

import fs from 'fs';
import path from 'path';
import { convert as convertPptxToPdf } from 'pptx-to-pdf';
import { sendResponse, handleCors } from './_utils.js';

/**
 * Finalize file upload: if the file is PPTX, auto-converts to PDF alongside it.
 */
async function finalizeUploadedFileResponse(res, targetFilePath, uniqueFileName, originalFileName, mimeType, uploadsDir) {
  const isPptx = /\.pptx$/i.test(uniqueFileName) || /\.pptx$/i.test(originalFileName);

  if (isPptx) {
    try {
      const pdfFileName = uniqueFileName.replace(/\.pptx$/i, '.pdf');
      const pdfFilePath = path.join(uploadsDir, pdfFileName);
      const pptxBuffer = fs.readFileSync(targetFilePath);

      // Convert PPTX buffer to PDF buffer
      const pdfBuffer = await convertPptxToPdf(pptxBuffer);

      if (pdfBuffer && pdfBuffer.length > 0) {
        fs.writeFileSync(pdfFilePath, Buffer.from(pdfBuffer));
        const pdfStats = fs.statSync(pdfFilePath);
        console.log(`[Upload] Successfully converted "${originalFileName}" to PDF viewbox format: ${pdfFileName}`);

        return sendResponse(res, 200, {
          success: true,
          url: `/uploads/${pdfFileName}`, // Clean PDF URL for Canvas Viewbox
          pdfUrl: `/uploads/${pdfFileName}`,
          originalUrl: `/uploads/${uniqueFileName}`,
          isConverted: true,
          fileName: originalFileName.replace(/\.pptx$/i, '.pdf'),
          originalFileName,
          size: pdfStats.size,
          mimeType: 'application/pdf',
        });
      }
    } catch (convErr) {
      console.warn('[Upload PPTX to PDF Conversion Notice]', convErr?.message || convErr);
      // If conversion fails, continue and return the original uploaded file
    }
  }

  const stats = fs.statSync(targetFilePath);
  return sendResponse(res, 200, {
    success: true,
    url: `/uploads/${uniqueFileName}`,
    originalUrl: `/uploads/${uniqueFileName}`,
    fileName: originalFileName,
    size: stats.size,
    mimeType,
  });
}

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

      return await finalizeUploadedFileResponse(
        res,
        targetFilePath,
        uniqueFileName,
        originalFileName,
        mimeType,
        uploadsDir
      );
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

      return await finalizeUploadedFileResponse(
        res,
        targetFilePath,
        uniqueFileName,
        finalFileName,
        mimeType,
        uploadsDir
      );
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

      return await finalizeUploadedFileResponse(
        res,
        targetFilePath,
        uniqueFileName,
        finalFileName,
        data.mimeType || 'application/octet-stream',
        uploadsDir
      );
    }

    return sendResponse(res, 400, {
      success: false,
      error: 'Unsupported content type for file upload.',
    });
  } catch (err) {
    console.error('[Upload Error]', err);
    return sendResponse(res, 500, {
      success: false,
      error: err.message || 'File upload failed.',
    });
  }
}
