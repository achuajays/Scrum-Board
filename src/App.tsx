import React from 'react';
import { ScrumBoard } from './components/ScrumBoard';
import { ToastProvider } from './contexts/ToastContext';

function App() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50">
        <ScrumBoard />
      </div>
    </ToastProvider>
  );
}

export default App;