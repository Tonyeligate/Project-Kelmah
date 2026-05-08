import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';

import MessagingPage from '@/modules/messaging/pages/MessagingPage';

const mockUseSelector = jest.fn();
const mockUseMessages = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: (selector) => mockUseSelector(selector),
}));

jest.mock('../../modules/messaging/contexts/MessageContext', () => ({
  useMessages: () => mockUseMessages(),
}));

jest.mock('../../modules/common/components/common/SEO', () => () => null);

jest.mock('../../hooks/useKeyboardVisible', () => ({
  __esModule: true,
  default: () => ({ isKeyboardVisible: false }),
}));

jest.mock('../../hooks/useOnlineStatus', () => ({
  __esModule: true,
  default: () => ({ isOnline: true, wasOffline: false }),
}));

jest.mock('../../hooks/useNetworkSpeed', () => ({
  __esModule: true,
  default: () => ({
    isSlow: false,
    effectiveType: '4g',
    downlink: 11,
    rtt: 45,
    saveData: false,
  }),
}));

const baseConversation = {
  id: 'conversation-1',
  participants: [{ id: 'worker-1', name: 'Ama Worker' }],
  lastMessage: {
    id: 'preview-1',
    text: 'Preview only',
    createdAt: '2026-04-16T09:00:00.000Z',
  },
  updatedAt: '2026-04-16T09:00:00.000Z',
};

const buildMessagesContext = (overrides = {}) => ({
  conversations: [baseConversation],
  selectedConversation: baseConversation,
  selectConversation: jest.fn(),
  clearConversation: jest.fn(),
  openTemporaryConversation: jest.fn(),
  messages: [],
  sendMessage: jest.fn().mockResolvedValue(undefined),
  unreadCount: 0,
  loadingConversations: false,
  loadingMessages: false,
  isConnected: true,
  realtimeIssue: '',
  refreshConversations: jest.fn().mockResolvedValue([]),
  reconnectRealtime: jest.fn().mockResolvedValue(true),
  startTyping: jest.fn(),
  stopTyping: jest.fn(),
  getTypingUsers: jest.fn(() => []),
  isUserOnline: jest.fn(() => false),
  ...overrides,
});

const renderMessagingPage = () =>
  render(
    <HelmetProvider>
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter
          initialEntries={['/messages']}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <MessagingPage />
        </MemoryRouter>
      </ThemeProvider>
    </HelmetProvider>,
  );

describe('messaging mobile layout smoke checks', () => {
  beforeAll(() => {
    if (!window.HTMLElement.prototype.scrollIntoView) {
      window.HTMLElement.prototype.scrollIntoView = jest.fn();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseSelector.mockImplementation((selector) =>
      selector({
        auth: {
          user: {
            id: 'hirer-1',
            role: 'hirer',
            name: 'Hirer One',
          },
        },
      }),
    );

    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query.includes('max-width'),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    window.localStorage.clear();
    window.localStorage.setItem(
      'kelmah.messaging.drafts.v1',
      JSON.stringify({
        'conversation:conversation-1': {
          text: 'Draft note ready to send',
          updatedAt: '2026-04-16T10:00:00.000Z',
        },
      }),
    );
  });

  test('keeps draft status in composer on mobile and keeps quick-reply shell stable while typing', async () => {
    mockUseMessages.mockReturnValue(
      buildMessagesContext({
        messages: [
          {
            id: 'message-1',
            senderId: 'worker-1',
            text: 'Hello from worker',
            createdAt: '2026-04-16T09:02:00.000Z',
          },
        ],
      }),
    );

    renderMessagingPage();

    expect(
      await screen.findByTestId('messages-mobile-draft-status'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('messages-header-draft-status'),
    ).not.toBeInTheDocument();

    expect(screen.getByTestId('messages-quick-replies-shell')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /discard/i }));

    await waitFor(() => {
      expect(screen.getByTestId('messages-quick-replies')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Type message'), {
      target: { value: 'Typing a reply now' },
    });

    await waitFor(() => {
      expect(screen.queryByTestId('messages-quick-replies')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('messages-quick-replies-shell')).toBeInTheDocument();
  });

  test('dedupes duplicate fallback message signatures at render time', async () => {
    mockUseMessages.mockReturnValue(
      buildMessagesContext({
        messages: [
          {
            senderId: 'worker-1',
            text: 'Fallback duplicate body',
            createdAt: '2026-04-16T09:03:30.000Z',
          },
          {
            senderId: 'worker-1',
            text: 'Fallback duplicate body',
            createdAt: '2026-04-16T09:03:30.000Z',
          },
        ],
      }),
    );

    renderMessagingPage();

    await waitFor(() => {
      expect(screen.getAllByText('Fallback duplicate body')).toHaveLength(1);
    });
  });
});
