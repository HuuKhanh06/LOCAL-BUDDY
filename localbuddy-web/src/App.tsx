import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import { ToastProvider } from './components/ui/Toast';
import { BookingProvider } from './context/BookingContext';

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <BookingProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </BookingProvider>
    </BrowserRouter>
  );
}

export default App;
