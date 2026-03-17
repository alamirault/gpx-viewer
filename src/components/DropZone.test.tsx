import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DropZone from './DropZone';
import '../i18n';

describe('DropZone', () => {
  const mockOnFileLoad = vi.fn();

  beforeEach(() => {
    mockOnFileLoad.mockClear();
  });

  it('renders the drop zone with title and subtitle', () => {
    render(<DropZone onFileLoad={mockOnFileLoad} />);
    expect(screen.getByText(/fichier GPX/i)).toBeInTheDocument();
    expect(screen.getByText(/cliquez pour parcourir/i)).toBeInTheDocument();
  });

  it('has a hidden file input accepting .gpx', () => {
    render(<DropZone onFileLoad={mockOnFileLoad} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.accept).toBe('.gpx');
    expect(input.style.display).toBe('none');
  });

  it('shows error for non-gpx file via input change', () => {
    render(<DropZone onFileLoad={mockOnFileLoad} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByText(/fichier .gpx valide/i)).toBeInTheDocument();
    expect(mockOnFileLoad).not.toHaveBeenCalled();
  });

  it('reads a valid .gpx file and calls onFileLoad', async () => {
    render(<DropZone onFileLoad={mockOnFileLoad} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['<gpx></gpx>'], 'track.gpx', { type: 'application/gpx+xml' });
    fireEvent.change(input, { target: { files: [file] } });

    // FileReader is async, wait for the callback
    await vi.waitFor(() => {
      expect(mockOnFileLoad).toHaveBeenCalledWith('<gpx></gpx>');
    });
  });

  it('adds active class on drag over', () => {
    render(<DropZone onFileLoad={mockOnFileLoad} />);
    const zone = document.querySelector('.dropzone') as HTMLElement;
    fireEvent.dragOver(zone);
    expect(zone.classList.contains('dropzone--active')).toBe(true);
  });

  it('removes active class on drag leave', () => {
    render(<DropZone onFileLoad={mockOnFileLoad} />);
    const zone = document.querySelector('.dropzone') as HTMLElement;
    fireEvent.dragOver(zone);
    fireEvent.dragLeave(zone);
    expect(zone.classList.contains('dropzone--active')).toBe(false);
  });

  it('handles drop event with a .gpx file', async () => {
    render(<DropZone onFileLoad={mockOnFileLoad} />);
    const zone = document.querySelector('.dropzone') as HTMLElement;
    const file = new File(['<gpx>data</gpx>'], 'route.gpx', { type: 'application/gpx+xml' });
    fireEvent.drop(zone, {
      dataTransfer: { files: [file] },
    });

    await vi.waitFor(() => {
      expect(mockOnFileLoad).toHaveBeenCalledWith('<gpx>data</gpx>');
    });
  });

  it('is keyboard accessible (role=button, tabIndex)', () => {
    render(<DropZone onFileLoad={mockOnFileLoad} />);
    const zone = document.querySelector('.dropzone') as HTMLElement;
    expect(zone.getAttribute('role')).toBe('button');
    expect(zone.getAttribute('tabindex')).toBe('0');
  });
});
