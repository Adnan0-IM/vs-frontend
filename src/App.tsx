import AppRouter from "./router/AppRouter"
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { Toaster } from "@/components/ui/sonner"

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      <Toaster />
    </QueryClientProvider>
  )
}

export default App

