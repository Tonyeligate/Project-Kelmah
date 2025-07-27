import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MessageInput from '../modules/messaging/components/common/MessageInput';

describe('MessageInput', () => {
  it('calls onSendMessage with trimmed message when Enter is pressed', () => {
    const onSendMessage = jest.fn();
    render(
      <MessageInput
        onSendMessage={onSendMessage}
        disabled={false}
        loading={false}
      />,
    );
    const input = screen.getByPlaceholderText(/Type a message.../i);
    fireEvent.change(input, { target: { value: ' Hello world ' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    expect(onSendMessage).toHaveBeenCalledWith('Hello world', []);
  });

  it('does not call onSendMessage when message is empty and Enter is pressed', () => {
    const onSendMessage = jest.fn();
    render(
      <MessageInput
        onSendMessage={onSendMessage}
        disabled={false}
        loading={false}
      />,
    );
    const input = screen.getByPlaceholderText(/Type a message.../i);
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    expect(onSendMessage).not.toHaveBeenCalled();
  });
});
