'use client';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
export function Dialog({ open, onClose, title, description, children, className = '' }: {
  open: boolean; onClose: () => void; title: string; description: string; children: React.ReactNode; className?: string;
}) {
  return <DialogPrimitive.Root open={open} onOpenChange={value => { if (!value) onClose(); }}>
    <DialogPrimitive.Portal><DialogPrimitive.Overlay className="dialog-overlay" />
      <DialogPrimitive.Content className={`dialog-content ${className}`}>
        <DialogPrimitive.Close className="icon-button dialog-close" aria-label="Close dialog"><X size={20} /></DialogPrimitive.Close>
        <DialogPrimitive.Title className="dialog-title">{title}</DialogPrimitive.Title>
        <DialogPrimitive.Description className="dialog-description">{description}</DialogPrimitive.Description>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}
