import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import LanguageSwitcher from './LanguageSwitcher';
import i18n from '../i18n';

describe('LanguageSwitcher', () => {
  beforeEach(async () => {
    await act(async () => {
      await i18n.changeLanguage('fr');
    });
  });

  it('renders FR and EN buttons', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText('FR')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('has radiogroup role', () => {
    render(<LanguageSwitcher />);
    const group = document.querySelector('[role="radiogroup"]');
    expect(group).toBeInTheDocument();
  });

  it('marks FR as active by default', () => {
    render(<LanguageSwitcher />);
    const frBtn = screen.getByText('FR');
    expect(frBtn.getAttribute('aria-pressed')).toBe('true');
    expect(frBtn.classList.contains('language-switcher__btn--active')).toBe(true);
  });

  it('switches to EN on click', async () => {
    render(<LanguageSwitcher />);
    const enBtn = screen.getByText('EN');
    await act(async () => {
      fireEvent.click(enBtn);
    });
    expect(i18n.language).toBe('en');
    expect(enBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('switches back to FR', async () => {
    render(<LanguageSwitcher />);
    await act(async () => {
      fireEvent.click(screen.getByText('EN'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('FR'));
    });
    expect(i18n.language).toBe('fr');
  });
});
