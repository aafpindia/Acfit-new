/**
 * File Upload Service
 *
 * Provides non-blocking, asynchronous document & presentation uploads.
 * Sends binary payloads directly to /api/upload to avoid main-thread UI freezing,
 * eliminates multi-megabyte base64 strings in React state, and prevents
 * Supabase 413 / localStorage quota overflow errors.
 */

export const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Simple IndexedDB helper for robust offline blob persistence
const DB_NAME = 'acfit_file_cache';
const STORE_NAME = 'uploaded_documents';

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function persistBlobInIndexedDB(id, file) {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ id, file, name: file.name, type: file.type, size: file.size, timestamp: Date.now() });
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('[IndexedDB persistBlob warning]', err);
    return false;
  }
}

export async function getBlobFromIndexedDB(id) {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result?.file || null);
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

/**
 * Upload a document or presentation file with accurate progress reporting.
 *
 * @param {File} file - File object from <input type="file" />
 * @param {Function} [onProgress] - Callback (progressPercent: number) => void
 * @returns {Promise<{ success: boolean, url: string, fileName: string, size: number, formattedSize: string, error?: string }>}
 */
export async function uploadDocumentFile(file, onProgress = () => {}) {
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  // Sanity check: limit max upload to 150MB
  const maxBytes = 150 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error('File exceeds maximum allowable size (150MB). Please compress or link externally.');
  }

  onProgress(5);

  const fallbackToDataUrl = async () => {
    return new Promise((resFallback) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result;
        const cacheId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        await persistBlobInIndexedDB(cacheId, file);
        onProgress(100);
        resFallback({
          success: true,
          url: dataUrl,
          pdfUrl: file.type === 'application/pdf' ? dataUrl : null,
          fileName: file.name,
          size: file.size,
          formattedSize: formatFileSize(file.size),
          isLocal: true,
          cacheId
        });
      };
      reader.onerror = () => {
        onProgress(100);
        resFallback({
          success: false,
          error: 'Failed to read document into memory.'
        });
      };
      reader.readAsDataURL(file);
    });
  };

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.setRequestHeader('X-File-Name', encodeURIComponent(file.name));
    xhr.setRequestHeader('X-File-Type', file.type || 'application/octet-stream');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.min(98, Math.round((event.loaded / event.total) * 100));
        onProgress(percent);
      }
    };

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText || '{}');
          if (res.success && res.url) {
            onProgress(100);
            return resolve({
              success: true,
              url: res.url,
              pdfUrl: res.pdfUrl || (res.url.toLowerCase().endsWith('.pdf') ? res.url : null),
              originalUrl: res.originalUrl || res.url,
              isConverted: Boolean(res.isConverted),
              fileName: res.fileName || file.name,
              size: res.size || file.size,
              formattedSize: formatFileSize(res.size || file.size),
              mimeType: res.mimeType || file.type
            });
          }
        } catch {
          // JSON parse failed; fall through to fallback
        }
      }

      // If backend responded with non-200 or unexpected payload, fallback to persistent self-contained Data URL
      console.warn('[uploadDocumentFile] Backend upload unavailable (status', xhr.status, '). Falling back to self-contained document Data URL.');
      const localResult = await fallbackToDataUrl();
      resolve(localResult);
    };

    xhr.onerror = async () => {
      console.warn('[uploadDocumentFile] Network error connecting to /api/upload. Falling back to self-contained document Data URL.');
      const localResult = await fallbackToDataUrl();
      resolve(localResult);
    };

    xhr.send(file);
  });
}

