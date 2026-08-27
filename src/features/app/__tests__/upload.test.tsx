import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import UploadDocuments from '../sections/UploadDocuments';
import { uploadAndSignDocument } from '../api/documents';
import { toast } from 'sonner';

// Mock the API functions
vi.mock('../api/documents', () => ({
  uploadAndSignDocument: vi.fn(),
}));

// Mock UploadThing
const startUpload = vi.hoisted(() =>
  vi.fn().mockResolvedValue([{ url: 'https://example.com/uploaded-pdf.pdf' }])
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
    info: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn();

describe('UploadDocuments Section', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the upload interface correctly', () => {
    render(<UploadDocuments />);
    expect(screen.getByText(/Drag & drop your PDF file here/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign & Issue Document/i })).toBeInTheDocument();
  });

  it('validates required fields on submission', async () => {
    render(<UploadDocuments />);
    
    // We'll use fireEvent to ensure the form submission is triggered if userEvent is being finicky
    const submitButton = screen.getByRole('button', { name: /Sign & Issue Document/i });

    // Submit without title
    fireEvent.click(submitButton);
    expect(toast.error).toHaveBeenCalledWith('Please enter a document title.');

    // Add title but no file
    const titleInput = screen.getByLabelText(/Document Title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    fireEvent.click(submitButton);
    expect(toast.error).toHaveBeenCalledWith('Please select or drop a PDF file.');
  });

  it('rejects non-PDF files', async () => {
    render(<UploadDocuments />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    
    fireEvent.change(input, { target: { files: [file] } });
    expect(toast.error).toHaveBeenCalledWith('Invalid file format. Only PDF files are supported.');
  });

  it('handles the full upload and sign flow successfully', async () => {
    const mockDoc = {
      id: 'doc-123',
      title: 'Graduation Certificate',
      originalFilename: 'cert.pdf',
      fileUrl: 'https://example.com/cert.pdf',
      fileSize: 1024 * 1024,
      type: 'Diploma',
      documentHash: 'hash123',
      digitalSignature: 'sig123',
      verificationToken: 'token123',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    (uploadAndSignDocument as any).mockResolvedValueOnce(mockDoc);

    render(<UploadDocuments />);

    // Fill title
    const titleInput = screen.getByLabelText(/Document Title/i);
    fireEvent.change(titleInput, { target: { value: 'Graduation Certificate' } });

    // Select file
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['dummy content'], 'cert.pdf', { type: 'application/pdf' });
    
    // Simply fire the change event directly, which React Testing Library handles for file inputs
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText('cert.pdf')).toBeInTheDocument();

    // Submit
    const submitButton = screen.getByRole('button', { name: /Sign & Issue Document/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(uploadAndSignDocument).toHaveBeenCalled();
    }, { timeout: 10000 });

    // The component shows success in the UI after processing
    await waitFor(() => {
      expect(screen.getByText(/Credential Successfully Issued!/i)).toBeInTheDocument();
    }, { timeout: 10000 });
  }, 15000);

  it('allows removing a selected file before submission', async () => {
    const user = userEvent.setup();
    render(<UploadDocuments />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByText('test.pdf')).toBeInTheDocument();

    const removeBtn = screen.getByRole('button', { name: /Remove selected file/i });
    await user.click(removeBtn);

    expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
  });

  it('shows an error toast when document processing fails', async () => {
    (uploadAndSignDocument as any).mockRejectedValueOnce(
      new Error('Signing service unavailable')
    );

    render(<UploadDocuments />);

    const titleInput = screen.getByLabelText(/Document Title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'cert.pdf', { type: 'application/pdf' })] } });

    fireEvent.click(screen.getByRole('button', { name: /Sign & Issue Document/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Signing service unavailable', {
        id: 'toast-id',
      });
    });
  });

  it('uses the backend error message when processing fails', async () => {
    (uploadAndSignDocument as any).mockRejectedValueOnce({
      response: { data: { error: 'File too large' } },
    });

    render(<UploadDocuments />);
    fireEvent.change(screen.getByLabelText(/Document Title/i), {
      target: { value: 'Test Title' },
    });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'cert.pdf', { type: 'application/pdf' })] } });

    fireEvent.click(screen.getByRole('button', { name: /Sign & Issue Document/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('File too large', { id: 'toast-id' });
    });
  });

  it('shows a loading overlay and disables the submit button while processing', async () => {
    // Deferred so we can assert the loading state and then settle the promise
    // (via a handled rejection) so no async work is left suspended at teardown.
    let rejectStart!: (e: Error) => void;
    const pending = new Promise<unknown>((_, rej) => { rejectStart = rej; });
    startUpload.mockReturnValueOnce(pending);

    const { unmount } = render(<UploadDocuments />);
    fireEvent.change(screen.getByLabelText(/Document Title/i), {
      target: { value: 'Test Title' },
    });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'cert.pdf', { type: 'application/pdf' })] } });

    fireEvent.click(screen.getByRole('button', { name: /Sign & Issue Document/i }));

    expect(await screen.findByText('Uploading Document')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign & Issue Document/i })).toBeDisabled();

    // Settle the in-flight promise so the component finishes cleanly.
    rejectStart(new Error('cancelled'));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
    unmount();
  });

  it('does not allow submitting multiple times while an upload is in progress', async () => {
    let rejectStart!: (e: Error) => void;
    const pending = new Promise<unknown>((_, rej) => { rejectStart = rej; });
    startUpload.mockReturnValueOnce(pending);

    const { unmount } = render(<UploadDocuments />);
    fireEvent.change(screen.getByLabelText(/Document Title/i), {
      target: { value: 'Test Title' },
    });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'cert.pdf', { type: 'application/pdf' })] } });

    fireEvent.click(screen.getByRole('button', { name: /Sign & Issue Document/i }));

    await screen.findByText('Uploading Document');
    // Submitting again while the first is still in progress should be a no-op.
    fireEvent.click(screen.getByRole('button', { name: /Sign & Issue Document/i }));

    await new Promise((r) => setTimeout(r, 100));
    expect(startUpload).toHaveBeenCalledTimes(1);

    // Settle the in-flight promise so the component finishes cleanly.
    rejectStart(new Error('cancelled'));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
    unmount();
  });
});
