import { messagingServiceClient } from '../../modules/common/services/axios';

const messagesApi = {
  async uploadAttachment(conversationId, formData, config = {}) {
    const { data } = await messagingServiceClient.post(`/api/messages/${conversationId}/attachments`, formData, config);
    return data?.data || data;
  },
};

export default messagesApi;




