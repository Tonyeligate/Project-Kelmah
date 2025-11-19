import React from 'react';
import { render, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { act } from 'react';
import { KelmahThemeProvider, useThemeMode } from '../ThemeProvider';

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  cleanup();
});

afterAll(() => {
  window.matchMedia = originalMatchMedia;
});

describe('KelmahThemeProvider persistence', () => {
  const TestHarness = () => {
    const { mode, toggleTheme } = useThemeMode();
    return (
      <div>
        <span data-testid="mode-readout">{mode}</span>
        <button type="button" onClick={toggleTheme}>
          toggle
        </button>
      </div>
    );
  };

  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    if (document?.documentElement) {
      document.documentElement.removeAttribute('data-theme');
    }
    window.matchMedia = undefined;
  });

  it('stores metadata and rehydrates preference on remount', () => {
    const { getByTestId, getByRole, unmount } = render(
      <KelmahThemeProvider>
        <TestHarness />
      </KelmahThemeProvider>,
    );

    expect(getByTestId('mode-readout').textContent).toBe('dark');

    fireEvent.click(getByRole('button', { name: /toggle/i }));
    expect(getByTestId('mode-readout').textContent).toBe('light');

    const stored = window.localStorage.getItem('kelmah-theme-mode');
    expect(stored).toBeTruthy();
    const parsed = stored ? JSON.parse(stored) : null;
    expect(parsed).toBeTruthy();
    expect(parsed.mode).toBe('light');
    expect(typeof parsed.updatedAt).toBe('number');

    unmount();

    const { getByTestId: getByTestIdAfterRemount } = render(
      <KelmahThemeProvider>
        <TestHarness />
      </KelmahThemeProvider>,
    );

    expect(getByTestIdAfterRemount('mode-readout').textContent).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('syncs when fresher storage metadata notifies the tab', async () => {
    const { getByTestId } = render(
      <KelmahThemeProvider>
        <TestHarness />
      </KelmahThemeProvider>,
    );

    expect(getByTestId('mode-readout').textContent).toBe('dark');

    const payload = JSON.stringify({
      mode: 'light',
      updatedAt: Date.now() + 1000,
      version: 2,
    });

    await act(async () => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'kelmah-theme-mode',
          newValue: payload,
        }),
      );
    });

    await waitFor(() =>
      expect(getByTestId('mode-readout').textContent).toBe('light'),
    );
  });
});
