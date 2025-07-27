import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Chatbox from '../modules/messaging/components/common/Chatbox';

// Mock subcomponents
jest.mock('../modules/messaging/components/common/MessageList', () => () => (
  <div data-testid="message-list" />
));
jest.mock('../modules/messaging/components/common/MessageInput', () => () => (
  <div data-testid="message-input" />
));

describe('Chatbox', () => {
  const conversation = {
    messages: [],
    currentUserId: 'user1',
    isLoading: false,
    typingUsers: [],
    onLoadMore: jest.fn(),
    hasMore: false,
    onMessageRead: jest.fn(),
    sendMessage: jest.fn(),
    sending: false,
  };
  const recipientName = 'Alice';
  const recipientAvatar = 'avatar.png';
  const recipientStatus = 'online';
  const onClose = jest.fn();

  beforeEach(() => {
    onClose.mockClear();
  });

  it('renders recipient name and status', () => {
    render(
      <Chatbox
        conversation={conversation}
        recipientName={recipientName}
        recipientAvatar={recipientAvatar}
        recipientStatus={recipientStatus}
        onClose={onClose}
      />,
    );
    expect(screen.getByText(recipientName)).toBeInTheDocument();
    expect(screen.getByText(recipientStatus)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <Chatbox
        conversation={conversation}
        recipientName={recipientName}
        recipientAvatar={recipientAvatar}
        recipientStatus={recipientStatus}
        onClose={onClose}
      />,
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(onClose).toHaveBeenCalled();
  });

  it('renders MessageList and MessageInput', () => {
    render(
      <Chatbox
        conversation={conversation}
        recipientName={recipientName}
        recipientAvatar={recipientAvatar}
        recipientStatus={recipientStatus}
        onClose={onClose}
      />,
    );
    expect(screen.getByTestId('message-list')).toBeInTheDocument();
    expect(screen.getByTestId('message-input')).toBeInTheDocument();
  });
});
