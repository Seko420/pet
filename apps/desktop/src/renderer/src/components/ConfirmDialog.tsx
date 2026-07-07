import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';

/**
 * In-app confirmation dialog replacing window.confirm: matches the studio
 * design, supports keyboard (Enter = confirm, Escape = cancel) and a
 * `danger` variant for destructive actions.
 *
 * Usage: const confirm = useConfirm();
 *        if (!(await confirm({ title, message, danger: true }))) return;
 */

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button for destructive actions. */
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(() => Promise.resolve(false));

export function useConfirm(): ConfirmFn {
  return useContext(ConfirmContext);
}

interface PendingConfirm {
  options: ConfirmOptions;
  resolve: (result: boolean) => void;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setPending((previous) => {
        // A second dialog while one is open cancels the first - simplest
        // safe behavior for a single-user app.
        previous?.resolve(false);
        return { options, resolve };
      });
    });
  }, []);

  const close = useCallback(
    (result: boolean): void => {
      setPending((current) => {
        current?.resolve(result);
        return null;
      });
    },
    [],
  );

  useEffect(() => {
    if (!pending) return;
    confirmButtonRef.current?.focus();
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(false);
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        close(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending, close]);

  const options = pending?.options;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close(false);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="w-full max-w-md rounded-2xl border border-ink-500 bg-ink-850 p-5 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  options.danger ? 'bg-bad/15 text-bad' : 'bg-forge-500/15 text-forge-300'
                }`}
              >
                {options.danger ? <AlertTriangle className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="confirm-title" className="text-sm font-semibold text-mist-50">
                  {options.title}
                </h2>
                {options.message ? (
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-mist-300">{options.message}</p>
                ) : null}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => close(false)}>
                {options.cancelLabel ?? 'Abbrechen'}
              </button>
              <button
                ref={confirmButtonRef}
                className={options.danger ? 'btn-danger' : 'btn-primary'}
                onClick={() => close(true)}
              >
                {options.confirmLabel ?? 'Bestätigen'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}
