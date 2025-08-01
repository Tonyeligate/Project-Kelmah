import { useState, useCallback } from 'react';
import messagesApi from '../../../api/services/messagesApi';

const useAttachments = (conversationId) => {
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelection = useCallback((event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter((file) => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        console.warn(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      // Check file type
      const validTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!validTypes.includes(file.type)) {
        console.warn(`File ${file.name} has an unsupported type.`);
        return false;
      }
      return true;
    });

    setAttachments((prev) => [...prev, ...validFiles]);
  }, []);

  const uploadFile = useCallback(
    async (file) => {
      try {
        setUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('file', file);

        if (!conversationId) {
          throw new Error('Conversation ID is required for file upload');
        }

        const response = await messagesApi.uploadAttachment(
          conversationId,
          formData,
          {
            onUploadProgress: (progressEvent) => {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total,
              );
              setUploadProgress(progress);
            },
          },
        );

        setUploadProgress(100);

        // Return the uploaded file data from the response
        return {
          id: response.id,
          url: response.url,
          filename: file.name,
          contentType: file.type,
          size: file.size,
        };
      } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
      } finally {
        setUploading(false);
      }
    },
    [conversationId],
  );

  const removeAttachment = useCallback((index) => {
    setAttachments((prev) => {
      const newAttachments = [...prev];
      const removedFile = newAttachments[index];

      // Clean up object URL if it exists
      if (removedFile.url) {
        URL.revokeObjectURL(removedFile.url);
      }

      newAttachments.splice(index, 1);
      return newAttachments;
    });
  }, []);

  const clearAttachments = useCallback(() => {
    // Clean up all object URLs
    attachments.forEach((file) => {
      if (file.url) {
        URL.revokeObjectURL(file.url);
      }
    });
    setAttachments([]);
  }, [attachments]);

  return {
    attachments,
    uploading,
    uploadProgress,
    handleFileSelection,
    uploadFile,
    removeAttachment,
    clearAttachments,
  };
};

export default useAttachments;
