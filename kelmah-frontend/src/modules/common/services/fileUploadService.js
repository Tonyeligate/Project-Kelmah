import { userServiceClient, messagingServiceClient } from './axios';

const MAX_FILE_SIZE = (Number(import.meta.env.VITE_S3_MAX_SIZE_MB || 25)) * 1024 * 1024;
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
  // Upload a single file via S3 presign
  uploadFile: async (file, folder = 'messages', service = 'messaging') => {
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    try {
      const client = service === 'user' ? userServiceClient : messagingServiceClient;
      const presignPath = service === 'user' ? '/api/profile/uploads/presign' : '/api/uploads/presign';
      const { data } = await client.post(presignPath, {
        folder,
        filename: file.name,
        contentType: file.type
      });
      const { putUrl, getUrl, maxSizeMb } = data.data || data;
      if (file.size > (maxSizeMb * 1024 * 1024)) {
        throw new Error(`File exceeds max size ${maxSizeMb}MB`);
      }
      // If presign is disabled on backend, fallback to local direct upload route
      if (!putUrl || !getUrl) {
        // Backend will store locally when ENABLE_S3_UPLOADS !== 'true'
        const form = new FormData();
        form.append('files', file);
        const localPath = service === 'user'
          ? '/api/profile/uploads'
          : `/api/messages/${folder.replace('attachments/', '')}/attachments`;
        const resp = await client.post(localPath, form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const uploaded = resp.data?.data?.files?.[0] || resp.data?.files?.[0];
        return uploaded || { url: resp.data?.url, name: file.name, size: file.size, type: file.type };
      }
      await fetch(putUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      return { url: getUrl, name: file.name, size: file.size, type: file.type };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  // Upload multiple files
  uploadFiles: async (files, folder = 'messages', service = 'messaging') => {
    const uploads = [];

    for (const file of files) {
      try {
        const result = await fileUploadService.uploadFile(file, folder, service);
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
