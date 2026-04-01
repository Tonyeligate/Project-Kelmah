const DEFAULT_TTL_MS = 15_000;
const DEFAULT_MAX_ENTRIES = 500;

export const buildRealtimeMessageKey = (message = {}) => {
  const id = message.clientId || message.id || message._id || message.messageId;
  if (!id) return null;

  const conversationId =
    message.conversationId ||
    message.conversation_id ||
    message.conversation?.id ||
    message.conversation?._id ||
    'global';
  return `${String(conversationId)}:${String(id)}`;
};

export const createRealtimeMessageDeduper = (
  ttlMs = DEFAULT_TTL_MS,
  maxEntries = DEFAULT_MAX_ENTRIES,
) => {
  const seen = new Map();

  const prune = (now = Date.now()) => {
    for (const [key, timestamp] of seen.entries()) {
      if (now - timestamp > ttlMs) {
        seen.delete(key);
      }
    }

    if (seen.size > maxEntries) {
      const overflow = seen.size - maxEntries;
      const oldestKeys = Array.from(seen.entries())
        .sort((a, b) => a[1] - b[1])
        .slice(0, overflow)
        .map(([key]) => key);

      oldestKeys.forEach((key) => seen.delete(key));
    }
  };

  const mark = (message, now = Date.now()) => {
    const key = buildRealtimeMessageKey(message);
    if (!key) return false;

    prune(now);

    if (seen.has(key)) {
      return true;
    }

    seen.set(key, now);
    return false;
  };

  const clear = () => {
    seen.clear();
  };

  return {
    mark,
    clear,
    size: () => seen.size,
  };
};
