/* eslint-env jest */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import JobSearchForm from './JobSearchForm';

const renderForm = (props = {}) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <JobSearchForm {...props} />
    </ThemeProvider>,
  );

describe('JobSearchForm prop resync regressions', () => {
  test('resyncs displayed skill chips when parent skill props actually change', () => {
    const { rerender } = renderForm({
      initialFilters: { skills: ['Plumbing'] },
    });

    expect(screen.getByText('Plumbing')).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={createTheme()}>
        <JobSearchForm initialFilters={{ skills: ['Welding', 'Carpentry'] }} />
      </ThemeProvider>,
    );

    expect(screen.queryByText('Plumbing')).not.toBeInTheDocument();
    expect(screen.getByText('Welding')).toBeInTheDocument();
    expect(screen.getByText('Carpentry')).toBeInTheDocument();
  });

  test('keeps one chip when rerendered with fresh equal skill arrays', () => {
    const { rerender } = renderForm({
      initialFilters: { skills: ['Plumbing'] },
    });

    rerender(
      <ThemeProvider theme={createTheme()}>
        <JobSearchForm initialFilters={{ skills: ['Plumbing'] }} />
      </ThemeProvider>,
    );
    rerender(
      <ThemeProvider theme={createTheme()}>
        <JobSearchForm initialFilters={{ skills: ['Plumbing'] }} />
      </ThemeProvider>,
    );

    expect(screen.getAllByText('Plumbing')).toHaveLength(1);
  });
});