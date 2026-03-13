import { format, isToday, isYesterday } from 'date-fns';

export const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';

  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';

    if (isToday(date)) {
      return format(date, 'HH:mm');
    }

    if (isYesterday(date)) {
      return 'Yesterday';
    }

    return format(date, 'MMM dd');
  } catch {
    return '';
  }
};

export const getMessagePreview = (message) => {
  if (!message) return 'No messages yet';

  const text = message.text || message.content || '';
  const messageType = message.messageType || '';

  if (messageType === 'image') return '🖼️ Photo';
  if (messageType === 'video') return '🎥 Video';
  if (messageType === 'audio') return '🎵 Audio';
  if (messageType === 'file' || messageType === 'document') return '📎 File';

  const isImageUrl = text.match(/\.(jpeg|jpg|gif|png|webp|bmp)($|\?)/i) || text.includes('/image/upload/') || text.includes('cloudinary.com/');
  const isVideoUrl = text.match(/\.(mp4|webm|avi|mov)($|\?)/i) || text.includes('/video/upload/');

  if (isImageUrl) return '🖼️ Photo';
  if (isVideoUrl) return '🎥 Video';

  if (message.hasAttachment || (Array.isArray(message.attachments) && message.attachments.length > 0)) {
    if (!text.trim() || text.startsWith('http')) return '📎 Attachment';
  }

  if (text.startsWith('http')) return '📎 Attachment';

  return text || 'No messages yet';
};
