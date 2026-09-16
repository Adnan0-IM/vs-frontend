import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@/test/test-utils';
import { fireEvent } from '@testing-library/react';
import Verification from '../verification';
import { verifyDocumentByToken, verifyDocumentByFile } from '../../app/api/documents';
import { toast } from 'sonner';
vi.mock('../../app/api/documents', () => ({
  verifyDocumentByToken: vi.fn(),
  verifyDocumentByFile: vi.fn(),
}));

// Mock UploadThing
const startUpload = vi.hoisted(() =>
  vi.fn().mockResolvedValue([{ url: 'https://example.com/temp-pdf.pdf' }])
);
vi.mock('@/uploadthing', () => ({
  useUploadThing: () => ({
    startUpload: startUpload,
  }),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    loading: vi.fn().mockReturnValue('toast-id'),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// The file input is hidden (no associated <label>), so use the DOM to grab it.
function getFileInput(): HTMLInputElement {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  if (!input) throw new Error('file input not found');
  return input;
}

// Helper to wait for all state updates to flush
async function flushPromises() {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}

describe('Verification Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the verification page correctly', () => {
    render(<Verification />);
    expect(screen.getByText('Credential Verification')).toBeInTheDocument();
    expect(screen.getByText('Manual File Verification')).toBeInTheDocument();
    expect(screen.getByText('Drag & drop the signed PDF here')).toBeInTheDocument();
  });

  describe('Token Verification', () => {
    it('automatically triggers verification if token is present in URL', async () => {
      const mockResponse = {
        success: true,
        verified: true,
        result: 'VERIFIED',
        documentStatus: 'ACTIVE',
        document: {
          title: 'Test Document',
          originalFilename: 'test.pdf',
          fileUrl: 'http://example.com/test.pdf',
          fileSize: 1024,
          createdAt: new Date().toISOString(),
          type: 'Certificate',
        },
        organization: {
          name: 'Test Org',
        },
      };

      (verifyDocumentByToken as any).mockResolvedValueOnce(mockResponse);

      render(<Verification />, { route: '/verification?token=test-token' });

      await waitFor(() => {
        expect(verifyDocumentByToken).toHaveBeenCalledWith('test-token');
      });
      await flushPromises();

      expect(await screen.findByText('AUTHENTIC CREDENTIAL')).toBeInTheDocument();
      expect(screen.getByText('Test Document')).toBeInTheDocument();
      expect(screen.getByText('Test Org')).toBeInTheDocument();
    });

    it('displays warning when document is revoked', async () => {
      const mockResponse = {
        success: true,
        verified: true,
        result: 'VERIFIED',
        documentStatus: 'REVOKED',
        document: {
          title: 'Revoked Document',
          originalFilename: 'revoked.pdf',
          fileUrl: 'http://example.com/revoked.pdf',
          fileSize: 1024,
          createdAt: new Date().toISOString(),
          type: 'Certificate',
        },
      };

      (verifyDocumentByToken as any).mockResolvedValueOnce(mockResponse);

      render(<Verification />, { route: '/verification?token=revoked-token' });

      await waitFor(() => {
        expect(verifyDocumentByToken).toHaveBeenCalledWith('revoked-token');
      });
      await flushPromises();

      expect(await screen.findByText('REVOKED CREDENTIAL')).toBeInTheDocument();
      expect(
        screen.getByText('This credential was valid but has since been revoked by the issuer.')
      ).toBeInTheDocument();
    });

    it('displays error when document is tampered (hash mismatch)', async () => {
      const mockResponse = {
        success: true,
        verified: false,
        result: 'TAMPERED_HASH',
        message: 'Hash mismatch',
      };

      (verifyDocumentByToken as any).mockResolvedValueOnce(mockResponse);

      render(<Verification />, { route: '/verification?token=tampered-token' });

      await waitFor(() => {
        expect(verifyDocumentByToken).toHaveBeenCalledWith('tampered-token');
      });
      await flushPromises();

      expect(await screen.findByText('TAMPERED / INVALID')).toBeInTheDocument();
      expect(await screen.findByText('Hash mismatch. The document content was modified after signing.')).toBeInTheDocument();
    });

    it('displays invalid QR code message for unknown token', async () => {
      const mockResponse = {
        success: true,
        verified: false,
        result: 'NOT_FOUND',
      };

      (verifyDocumentByToken as any).mockResolvedValueOnce(mockResponse);

      render(<Verification />, { route: '/verification?token=unknown-token' });

      await waitFor(() => {
        expect(verifyDocumentByToken).toHaveBeenCalledWith('unknown-token');
      });
      // Wait for multiple event loop ticks to allow useEffect setTimeout to fire
      await flushPromises();
      await flushPromises();
      await flushPromises();

      expect(await screen.findByText('INVALID QR CODE')).toBeInTheDocument();
    });

    it('shows a loading state while token verification is running', async () => {
      let rejectVerify!: (e: Error) => void;
      const pending = new Promise<unknown>((_, rej) => { rejectVerify = rej; });
      (verifyDocumentByToken as any).mockReturnValueOnce(pending);

      const { unmount } = render(<Verification />, {
        route: '/verification?token=loading-token',
      });

      expect(await screen.findByText('Decrypting Signatures')).toBeInTheDocument();

      rejectVerify(new Error('cancelled'));
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
      unmount();
    });

    it('displays the backend error message when token verification fails', async () => {
      (verifyDocumentByToken as any).mockRejectedValueOnce({
        response: { data: { message: 'Verification service unavailable' } },
      });

      render(<Verification />, { route: '/verification?token=error-token' });

      await waitFor(() => {
        expect(verifyDocumentByToken).toHaveBeenCalledWith('error-token');
      });
      await flushPromises();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Verification service unavailable',
          { id: 'toast-id' }
        );
      });
    });

    it('falls back to a generic message when the verification error has no message', async () => {
      (verifyDocumentByToken as any).mockRejectedValueOnce(new Error('boom'));

      render(<Verification />, { route: '/verification?token=error-token' });

      await waitFor(() => {
        expect(verifyDocumentByToken).toHaveBeenCalledWith('error-token');
      });
      await flushPromises();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Verification check failed.', {
          id: 'toast-id',
        });
      });
    });
  });

  describe('File Verification', () => {
    it('handles file selection and verification', async () => {
      const mockResponse = {
        success: true,
        verified: true,
        result: 'VERIFIED',
        documentStatus: 'ACTIVE',
        document: {
          title: 'Uploaded Document',
          originalFilename: 'uploaded.pdf',
          fileUrl: 'http://example.com/uploaded.pdf',
          fileSize: 2048,
          createdAt: new Date().toISOString(),
          type: 'Transcript',
        },
      };

      (verifyDocumentByFile as any).mockResolvedValueOnce(mockResponse);

      render(<Verification />);

      const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
      const input = getFileInput();
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(verifyDocumentByFile).toHaveBeenCalledWith('https://example.com/temp-pdf.pdf');
      });
      await flushPromises();

      expect(await screen.findByText('Uploaded Document')).toBeInTheDocument();
    });

    it('rejects non-pdf files', async () => {
      render(<Verification />);

      const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
      const input = getFileInput();
      fireEvent.change(input, { target: { files: [file] } });

      expect(toast.error).toHaveBeenCalledWith('Invalid file format. Only PDF files are supported.');
      expect(verifyDocumentByFile).not.toHaveBeenCalled();
    });

    it('shows a loading state while the file is being uploaded and verified', async () => {
      let rejectStart!: (e: Error) => void;
      const pending = new Promise<unknown>((_, rej) => { rejectStart = rej; });
      startUpload.mockReturnValueOnce(pending);

      const { unmount } = render(<Verification />);

      const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(getFileInput(), { target: { files: [file] } });

      expect(await screen.findByText('Uploading File')).toBeInTheDocument();

      rejectStart(new Error('cancelled'));
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
      unmount();
    });

    it('displays a REVOKED result for a revoked file', async () => {
      (verifyDocumentByFile as any).mockResolvedValueOnce({
        success: true,
        verified: true,
        result: 'VERIFIED',
        documentStatus: 'REVOKED',
        document: {
          title: 'Revoked Uploaded Document',
          originalFilename: 'revoked.pdf',
          fileUrl: 'http://example.com/revoked.pdf',
          fileSize: 2048,
          createdAt: new Date().toISOString(),
          type: 'Certificate',
        },
      });

      render(<Verification />);

      const file = new File(['dummy content'], 'revoked.pdf', { type: 'application/pdf' });
      fireEvent.change(getFileInput(), { target: { files: [file] } });

      await waitFor(() => {
        expect(verifyDocumentByFile).toHaveBeenCalled();
      });
      await flushPromises();

      expect(await screen.findByText('REVOKED CREDENTIAL')).toBeInTheDocument();
    });

    it('displays a NO_MATCHING_RECORD result for an unknown file', async () => {
      (verifyDocumentByFile as any).mockResolvedValueOnce({
        success: false,
        verified: false,
        result: 'NO_MATCHING_RECORD',
      });

      render(<Verification />);

      const file = new File(['dummy content'], 'unknown.pdf', { type: 'application/pdf' });
      fireEvent.change(getFileInput(), { target: { files: [file] } });

      await waitFor(() => {
        expect(verifyDocumentByFile).toHaveBeenCalled();
      });
      await flushPromises();

      expect(await screen.findByText('FILE NOT IN SYSTEM')).toBeInTheDocument();
    });

    it('shows an error toast when file verification fails', async () => {
      (verifyDocumentByFile as any).mockRejectedValueOnce(
        new Error('File verification failed.')
      );

      render(<Verification />);

      const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(getFileInput(), { target: { files: [file] } });

      await waitFor(() => {
        expect(verifyDocumentByFile).toHaveBeenCalled();
      });
      await flushPromises();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('File verification failed.', {
          id: 'toast-id',
        });
      });
    });
  });
});