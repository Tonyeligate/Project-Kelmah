import axios from 'axios';
import { API_BASE_URL } from '../config/constants';
import { getAuthToken } from './authService';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  video: ['video/mp4', 'video/webm', 'video/ogg'],
};

// Helper to get file type category
const getFileCategory = (mimeType) => {
  for (const [category, types] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (types.includes(mimeType)) return category;
  }
  return 'other';
};

// Helper to generate thumbnail preview for files
const generateThumbnail = async (file) => {
  return new Promise((resolve) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    } else {
      // Default thumbnails for different file types
      const category = getFileCategory(file.type);
      resolve(`/assets/thumbnails/${category}.png`);
    }
  });
};

// Helper to validate file before upload
const validateFile = (file) => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds the maximum allowed size (10MB)`,
    };
  }

  // Check file type
  const category = getFileCategory(file.type);
  if (category === 'other') {
    return { valid: false, error: 'File type not supported' };
  }

  return { valid: true };
};

const fileUploadService = {
  // Upload a single file
  uploadFile: async (file, folder = 'messages') => {
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  // Upload multiple files
  uploadFiles: async (files, folder = 'messages') => {
    const uploads = [];

    for (const file of files) {
      try {
        const result = await fileUploadService.uploadFile(file, folder);
        uploads.push(result);
      } catch (error) {
        uploads.push({ error: error.message, filename: file.name });
      }
    }

    return uploads;
  },

  // Get file preview
  getFilePreview: async (file) => {
    const thumbnail = await generateThumbnail(file);
    const category = getFileCategory(file.type);

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      category,
      thumbnail,
    };
  },

  // Prepare files for display
  prepareFilesForDisplay: async (files) => {
    const previews = [];

    for (const file of files) {
      const preview = await fileUploadService.getFilePreview(file);
      previews.push(preview);
    }

    return previews;
  },
};

export default fileUploadService;
