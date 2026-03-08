import { api } from '../../../services/apiClient';

const SERVICE_TARGETS = {
  user: {
    upload: '/profile/media/upload',
  },
  messaging: {
    upload: (folder = 'messages') =>
      `/messages/${folder.replace(/^attachments\//, '')}/attachments`,
  },
};

const MAX_FILE_SIZE =
  Number(import.meta.env.VITE_MEDIA_MAX_SIZE_MB || import.meta.env.VITE_S3_MAX_SIZE_MB || 25) * 1024 * 1024;
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
      error: `File size exceeds the maximum allowed size (${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB)`,
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
  // Upload a single file via backend media endpoints
  uploadFile: async (file, folder = 'messages', service = 'messaging') => {
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    try {
      const targets = SERVICE_TARGETS[service] || SERVICE_TARGETS.messaging;
      const uploadPath =
        typeof targets.upload === 'function'
          ? targets.upload(folder)
          : targets.upload;
      const form = new FormData();
      form.append('files', file);
      if (service === 'user' && folder) {
        form.append('folder', folder);
      }

      const response = await api.post(uploadPath, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploaded =
        response.data?.data?.files?.[0] ||
        response.data?.files?.[0] ||
        response.data?.data ||
        response.data;

      return {
        ...uploaded,
        url: uploaded?.url || uploaded?.secureUrl || uploaded?.fileUrl || null,
        fileUrl: uploaded?.fileUrl || uploaded?.secureUrl || uploaded?.url || null,
        name: uploaded?.name || file.name,
        size: uploaded?.bytes || uploaded?.size || file.size,
        type: uploaded?.fileType || uploaded?.resourceType || file.type,
      };
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error uploading file:', error);
      throw error;
    }
  },

  // Upload multiple files
  uploadFiles: async (files, folder = 'messages', service = 'messaging') => {
    const uploads = [];

    for (const file of files) {
      try {
        const result = await fileUploadService.uploadFile(
          file,
          folder,
          service,
        );
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
