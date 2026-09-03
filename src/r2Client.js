/**
 * Cloudflare R2 Storage Client for HCMS
 * 
 * Handles client-side canvas compression, size enforcement, and
 * streaming multipart upload to Cloudflare Worker with real-time progress.
 */

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Client-side image compression using HTML5 Canvas
 * @param {File} file - Original image file
 * @param {number} maxDimension - Maximum width/height in pixels (default 1920)
 * @param {number} quality - Quality level between 0 and 1 (default 0.75)
 * @returns {Promise<Blob>} Compressed Blob
 */
export const compressImage = (file, maxDimension = 1920, quality = 0.75) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Scale down if dimensions exceed maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file); // Fallback to original if blob creation fails
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

/**
 * Uploads a file (or compressed image blob) to Cloudflare R2 via Worker
 * @param {File} file - The file selected by the user
 * @param {string} folderPath - Target folder path in storage
 * @param {function} onProgress - Progress callback function (0-100)
 * @returns {Promise<{url: string, fileName: string, originalSize: number, uploadedSize: number, isCompressed: boolean}>}
 */
export const uploadFileToR2 = async (file, folderPath = 'imaging-reports', onProgress = null) => {
  if (!file) {
    throw new Error('No file selected');
  }

  // Enforce 10MB file limit
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(`File size (${sizeInMB}MB) exceeds the maximum allowed limit of 10MB.`);
  }

  const uploadEndpoint = import.meta.env.VITE_R2_UPLOAD_URL;
  if (!uploadEndpoint || uploadEndpoint.includes('your-subdomain')) {
    throw new Error(
      'Cloudflare Worker URL is not configured. Please set VITE_R2_UPLOAD_URL in your .env file with your worker URL.'
    );
  }

  let uploadData = file;
  let isCompressed = false;

  // Compress images client-side before uploading
  if (file.type.startsWith('image/')) {
    try {
      const compressedBlob = await compressImage(file, 1920, 0.75);
      // Only use compressed version if it actually reduced the file size
      if (compressedBlob && compressedBlob.size < file.size) {
        uploadData = compressedBlob;
        isCompressed = true;
      }
    } catch (e) {
      console.warn('Image compression failed, proceeding with original file:', e);
    }
  }

  // Build FormData for Worker
  const formData = new FormData();
  formData.append('file', uploadData, file.name);
  formData.append('folder', folderPath);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadEndpoint, true);

    // Track upload progress
    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.url) {
            resolve({
              url: response.url,
              fileName: file.name,
              originalSize: file.size,
              uploadedSize: uploadData.size,
              isCompressed,
            });
          } else {
            reject(new Error(response.error || 'Upload succeeded but no URL was returned'));
          }
        } catch (err) {
          reject(new Error('Invalid response from Cloudflare Worker: ' + xhr.responseText));
        }
      } else {
        let errorMsg = `Upload failed with HTTP status ${xhr.status}`;
        try {
          const errData = JSON.parse(xhr.responseText);
          if (errData.error) errorMsg = errData.error;
        } catch (_) {}
        reject(new Error(errorMsg));
      }
    };

    xhr.onerror = () => {
      reject(
        new Error(
          'Network connection error while uploading to Cloudflare Worker. Please verify CORS and Worker URL.'
        )
      );
    };

    xhr.send(formData);
  });
};

// Backwards compatibility alias
export const uploadFileToFirebase = uploadFileToR2;
