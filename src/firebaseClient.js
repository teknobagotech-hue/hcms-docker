import { initializeApp, getApps } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDHQ6_dNqwWAPWIhZpKjIywBErzTnrVOVI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hcim-c5282.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hcim-c5282",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hcim-c5282.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "178470211553",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:178470211553:web:ac33d7533869f97bc08ca0",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-4JZ197ZMQ5"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const storage = getStorage(app);

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
 * Uploads a file (or compressed image blob) to Firebase Storage with size check and progress monitoring
 * @param {File} file - The file selected by the user
 * @param {string} folderPath - Target folder path in storage
 * @param {function} onProgress - Progress callback function (0-100)
 * @returns {Promise<{url: string, fileName: string, originalSize: number, uploadedSize: number, isCompressed: boolean}>}
 */
export const uploadFileToFirebase = async (file, folderPath = 'imaging-reports', onProgress = null) => {
  if (!file) {
    throw new Error('No file selected');
  }

  // Enforce 10MB file limit
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(`File size (${sizeInMB}MB) exceeds the maximum allowed limit of 10MB.`);
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

  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueName = `${Date.now()}_${cleanFileName}`;
  const fullPath = `${folderPath}/${uniqueName}`;
  const storageRef = ref(storage, fullPath);

  const metadata = {
    contentType: uploadData.type || file.type || 'application/octet-stream'
  };

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, uploadData, metadata);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            url: downloadURL,
            fileName: file.name,
            originalSize: file.size,
            uploadedSize: uploadData.size,
            isCompressed
          });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};
