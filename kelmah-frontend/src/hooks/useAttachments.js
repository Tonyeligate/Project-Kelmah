import { useState, useCallback } from 'react';
import axios from 'axios';

/**
 * Custom hook for managing file attachments in messages
 * Handles file selection, upload, and state management
 */
const useAttachments = (onUploadComplete) => {
  const [attachments, setAttachments] = useState([]);
  const [uploadingAttachments, setUploadingAttachments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});

  /**
   * Handle new file selection
   * @param {FileList|File[]} files - Files from file input or drop event
   */
  const handleFileSelection = useCallback((files) => {
    if (!files || files.length === 0) return;
    
    const fileList = Array.from(files);
    const newAttachments = fileList.map(file => ({
      id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      file,
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
      isUploading: true,
      progress: 0
    }));

    // Add to uploading queue
    setUploadingAttachments(prev => [...prev, ...newAttachments]);
    
    // Start uploading each file
    newAttachments.forEach(attachment => {
      uploadFile(attachment);
    });
  }, []);

  /**
   * Upload a file to the server
   * @param {Object} attachment - Attachment object with file data
   */
  const uploadFile = useCallback(async (attachment) => {
    try {
      const formData = new FormData();
      formData.append('file', attachment.file);
      
      // Initialize progress for this file
      setUploadProgress(prev => ({
        ...prev,
        [attachment.id]: 0
      }));

      // Upload file with progress tracking
      const response = await axios.post('/api/messages/attachments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          
          // Update progress state
          setUploadProgress(prev => ({
            ...prev,
            [attachment.id]: percentCompleted
          }));
          
          // Also update the uploading attachments list
          setUploadingAttachments(prev => 
            prev.map(item => 
              item.id === attachment.id 
                ? { ...item, progress: percentCompleted } 
                : item
            )
          );
        }
      });

      // On successful upload, move from uploading to uploaded
      const uploadedAttachment = {
        ...attachment,
        id: response.data.id, // Replace temp id with server id
        url: response.data.url,
        isUploading: false
      };
      
      // Remove from uploading list
      setUploadingAttachments(prev => 
        prev.filter(item => item.id !== attachment.id)
      );
      
      // Add to attachments list
      setAttachments(prev => [...prev, uploadedAttachment]);
      
      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete(uploadedAttachment);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Handle upload failure
      setUploadingAttachments(prev => 
        prev.map(item => 
          item.id === attachment.id 
            ? { ...item, error: 'Upload failed', isUploading: false } 
            : item
        )
      );
    }
  }, [onUploadComplete]);

  /**
   * Remove an attachment from the list
   * @param {Object} attachment - Attachment to remove
   */
  const removeAttachment = useCallback((attachment) => {
    // If it's still uploading, cancel the upload
    if (attachment.isUploading) {
      setUploadingAttachments(prev => 
        prev.filter(item => item.id !== attachment.id)
      );
    } else {
      setAttachments(prev => 
        prev.filter(item => item.id !== attachment.id)
      );
    }
    
    // Clean up any object URLs to avoid memory leaks
    if (attachment.url && attachment.url.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.url);
    }
  }, []);

  /**
   * Clear all attachments
   */
  const clearAttachments = useCallback(() => {
    // Clean up any object URLs
    attachments.forEach(attachment => {
      if (attachment.url && attachment.url.startsWith('blob:')) {
        URL.revokeObjectURL(attachment.url);
      }
    });
    
    uploadingAttachments.forEach(attachment => {
      if (attachment.url && attachment.url.startsWith('blob:')) {
        URL.revokeObjectURL(attachment.url);
      }
    });
    
    setAttachments([]);
    setUploadingAttachments([]);
    setUploadProgress({});
  }, [attachments, uploadingAttachments]);

  // Return the attachments state and handlers
  return {
    attachments,
    uploadingAttachments,
    uploadProgress,
    handleFileSelection,
    removeAttachment,
    clearAttachments,
    hasAttachments: attachments.length > 0 || uploadingAttachments.length > 0,
    isUploading: uploadingAttachments.length > 0
  };
};

export default useAttachments; 