import { useCallback } from 'react';

// Requires socket from MessageContext
export const useRealtimeMessaging = (socket, isConnected, conversationId) => {
  const startTyping = useCallback(() => {
    if (socket && isConnected && conversationId) {
      socket.emit('typing_start', { conversationId });
    }
  }, [socket, isConnected, conversationId]);

  const stopTyping = useCallback(() => {
    if (socket && isConnected && conversationId) {
      socket.emit('typing_stop', { conversationId });
    }
  }, [socket, isConnected, conversationId]);

  const shareFile = useCallback((fileData) => {
    if (socket && isConnected && conversationId && fileData) {
      socket.emit('file_shared', { conversationId, fileData });
    }
  }, [socket, isConnected, conversationId]);

  const reportUploadProgress = useCallback((fileId, progress, fileName) => {
    if (socket && isConnected && conversationId) {
      socket.emit('file_upload_progress', { conversationId, fileId, progress, fileName });
    }
  }, [socket, isConnected, conversationId]);

  return { startTyping, stopTyping, shareFile, reportUploadProgress };
};

export default useRealtimeMessaging;




