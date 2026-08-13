import React, { useEffect } from 'react';
import { useUiStore } from '../../store/uiStore';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastItem: React.FC<{ toast: any; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const Icon = toast.type === 'success' ? CheckCircle 
             : toast.type === 'error' ? AlertCircle 
             : toast.type === 'warning' ? AlertTriangle 
             : Info;

  return (
    <div className={`toast toast-${toast.type} slide-in`}>
      <Icon size={20} className="toast-icon" />
      <div className="toast-content">
        {toast.title && <h4 className="toast-title">{toast.title}</h4>}
        <p className="toast-message">{toast.message}</p>
      </div>
      <button className="toast-close btn-icon" onClick={() => onRemove(toast.id)}>
        <X size={16} />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUiStore();

  return (
    <div className="toast-container fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};
