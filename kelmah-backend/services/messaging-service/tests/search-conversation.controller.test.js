jest.mock('../models', () => ({
  Message: {
    find: jest.fn(),
  },
  Conversation: {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
  User: {
    find: jest.fn(),
  },
  Notification: {},
}));

jest.mock('../utils/errorHandler', () => ({
  handleError: jest.fn((res, error) =>
    res.status(500).json({ success: false, message: String(error?.message || error) })),
}));

jest.mock('../utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

jest.mock('../utils/audit-logger', () => ({
  log: jest.fn().mockResolvedValue(),
}));

const { createMockResponse } = require('../../../shared/test-utils');
const { Message, Conversation, User } = require('../models');
const messageController = require('../controllers/message.controller');
const ConversationController = require('../controllers/conversation.controller');

const USER_ID = '507f1f77bcf86cd799439011';
const PEER_ID = '507f191e810c19729de860ea';

const buildMessageCursor = ({ result = [], error = null } = {}) => ({
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  lean: error
    ? jest.fn().mockRejectedValue(error)
    : jest.fn().mockResolvedValue(result),
});

describe('messaging controllers search hardening', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('searchMessages prefers text query and formats conversation metadata', async () => {
    const req = {
      user: { id: USER_ID },
      query: { q: 'plumber', page: '1', limit: '20' },
    };
    const res = createMockResponse();

    Message.find.mockImplementation(() =>
      buildMessageCursor({
        result: [
          {
            _id: 'msg-1',
            conversation: { _id: 'conv-1', metadata: { title: 'Trade Chat' } },
            sender: { _id: USER_ID, firstName: 'Ama', lastName: 'Mensah' },
            recipient: { _id: PEER_ID, firstName: 'Kojo', lastName: 'Owusu' },
            content: 'Need plumbing help',
            createdAt: new Date('2026-03-11T10:00:00.000Z'),
          },
        ],
      }),
    );

    await messageController.searchMessages(req, res);

    expect(Message.find).toHaveBeenCalledTimes(1);
    const query = Message.find.mock.calls[0][0];
    const andFilters = query.$and || [];
    expect(andFilters.some((filter) => filter.$text?.$search === 'plumber')).toBe(true);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        data: {
          messages: [
            expect.objectContaining({
              id: 'msg-1',
              conversation: { id: 'conv-1', title: 'Trade Chat' },
              content: 'Need plumbing help',
            }),
          ],
        },
      }),
    );
  });

  test('searchMessages falls back to escaped regex when text index is missing', async () => {
    const req = {
      user: { id: USER_ID },
      query: { q: 'pipe(1)', page: '1', limit: '10' },
    };
    const res = createMockResponse();
    const textIndexError = new Error('text index required for $text query');

    Message.find.mockImplementation((query) => {
      const andFilters = query.$and || [];
      const hasText = andFilters.some((filter) => Boolean(filter.$text));
      if (hasText) {
        return buildMessageCursor({ error: textIndexError });
      }
      return buildMessageCursor({ result: [] });
    });

    await messageController.searchMessages(req, res);

    expect(Message.find).toHaveBeenCalledTimes(2);
    const firstQuery = Message.find.mock.calls[0][0];
    const secondQuery = Message.find.mock.calls[1][0];
    expect((firstQuery.$and || []).some((filter) => Boolean(filter.$text))).toBe(true);

    const regexFilter = (secondQuery.$and || []).find((filter) => Boolean(filter.content));
    expect(regexFilter.content.$regex).toBe('pipe\\(1\\)');
    expect(regexFilter.content.$options).toBe('i');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ success: true }));
  });

  test('searchConversations falls back to escaped regex when message text index is missing', async () => {
    const req = {
      user: { id: USER_ID },
      query: { query: 'urgent(pipe)', page: '1', limit: '20' },
    };
    const res = createMockResponse();

    Conversation.find
      .mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ _id: 'conv-1' }]),
      }))
      .mockImplementationOnce(() => ({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          {
            _id: 'conv-1',
            participants: [USER_ID, PEER_ID],
            metadata: { title: 'Urgent plumbing request' },
            updatedAt: new Date('2026-03-11T11:30:00.000Z'),
          },
        ]),
      }));

    Message.find
      .mockImplementationOnce((query) => {
        expect(query.$text).toEqual({ $search: 'urgent(pipe)' });
        return {
          distinct: jest.fn().mockRejectedValue(new Error('text index required')),
        };
      })
      .mockImplementationOnce((query) => {
        expect(query.content).toEqual({ $regex: 'urgent\\(pipe\\)', $options: 'i' });
        return {
          distinct: jest.fn().mockResolvedValue(['conv-1']),
        };
      });

    await ConversationController.searchConversations(req, res);

    expect(Message.find).toHaveBeenCalledTimes(2);
    expect(Conversation.find).toHaveBeenCalledTimes(2);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          conversations: [
            expect.objectContaining({ id: 'conv-1', title: 'Urgent plumbing request' }),
          ],
          pagination: expect.objectContaining({ total: 1 }),
        }),
      }),
    );
  });

  test('createConversation returns existing conversation on directConversationKey duplicate race', async () => {
    const req = {
      user: { id: USER_ID },
      body: {
        participantIds: [PEER_ID],
        type: 'direct',
      },
    };
    const res = createMockResponse();

    User.find.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ _id: USER_ID }, { _id: PEER_ID }]),
    }));

    Conversation.findOne
      .mockImplementationOnce(() => ({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      }))
      .mockImplementationOnce(() => ({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          _id: 'conv-race-1',
          participants: [
            { _id: USER_ID, firstName: 'Ama', lastName: 'Mensah', profilePicture: null },
            { _id: PEER_ID, firstName: 'Kojo', lastName: 'Owusu', profilePicture: null },
          ],
          metadata: { title: null },
          createdAt: new Date('2026-03-11T09:00:00.000Z'),
          updatedAt: new Date('2026-03-11T09:01:00.000Z'),
          lastMessage: null,
        }),
      }));

    Conversation.create.mockRejectedValue({
      code: 11000,
      keyPattern: { directConversationKey: 1 },
    });

    await ConversationController.createConversation(req, res);

    expect(Conversation.create).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        message: 'Conversation already exists',
        data: {
          conversation: expect.objectContaining({
            id: 'conv-race-1',
            type: 'direct',
            participants: expect.any(Array),
          }),
        },
      }),
    );
  });
});
