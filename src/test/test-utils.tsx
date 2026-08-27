import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { ThemeProvider } from '@/components/theme-provider';

// Create a query client for testing
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

// Custom render function with providers. A fresh QueryClient is created per
// render so query state does not leak between tests.
interface RenderOptions {
  route?: string;
}

function renderWithProviders(ui: ReactNode, { route = '/' }: RenderOptions = {}) {
  const queryClient = createQueryClient();
  return {
    user: userEvent.setup(),
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          <ThemeProvider>
            {ui}
          </ThemeProvider>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  };
}

export * from '@testing-library/react';
export { renderWithProviders as render };
