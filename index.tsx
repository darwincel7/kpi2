import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log('Iniciando script principal...');

const container = document.getElementById('root');
const loadingMsg = document.getElementById('loading-message');

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

// Error Boundary Component
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
    this.props = props;
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: React.ErrorInfo) {
    console.error("React Error Boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (loadingMsg) loadingMsg.style.display = 'none';
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
          <div className="bg-white p-8 rounded-xl shadow-xl max-w-lg w-full border border-red-200">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Algo salió mal</h2>
            <p className="text-slate-600 mb-4">La aplicación ha encontrado un error inesperado.</p>
            <div className="bg-slate-100 p-4 rounded-lg overflow-auto max-h-48 text-xs font-mono text-slate-700 mb-6">
              {this.state.error?.toString()}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    // Remove loading message once React mounts successfully
    // We use a slight timeout to ensure styles are applied
    setTimeout(() => {
        if (loadingMsg) loadingMsg.style.display = 'none';
    }, 100);
  } catch (e: any) {
    console.error("Error al renderizar React Root:", e);
    if (loadingMsg) loadingMsg.style.display = 'none';
    container.innerHTML = `<div style="padding:20px;color:red">Error crítico al iniciar React: ${e.message}</div>`;
  }
} else {
  console.error('Error crítico: No se encontró el elemento con id "root"');
}