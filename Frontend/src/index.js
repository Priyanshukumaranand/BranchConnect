import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './styles/global.css';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

const container = document.getElementById('root');
const root = createRoot(container);

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            retry: 2,
            staleTime: 1000 * 60 * 5
        }
    }
});

root.render(
    <StrictMode>
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <QueryClientProvider client={queryClient}>
                        <App />
                    </QueryClientProvider>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    </StrictMode>
);