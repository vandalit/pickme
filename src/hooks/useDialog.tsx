'use client';

import { useCallback, useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import styles from './useDialog.module.css';

type DialogResult = boolean | string | null | undefined;

interface DialogState {
  kind: 'alert' | 'confirm' | 'prompt';
  title: string;
  message: string;
  defaultValue?: string;
  placeholder?: string;
  resolve: (value: DialogResult) => void;
}

export function useDialog() {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [inputValue, setInputValue] = useState('');
  const dialogRef = useRef<DialogState | null>(null);

  const openDialog = useCallback(
    (options: Omit<DialogState, 'resolve'>) =>
      new Promise<DialogResult>((resolve) => {
        const nextDialog: DialogState = { ...options, resolve };
        dialogRef.current = nextDialog;
        setInputValue(options.defaultValue || '');
        setDialog(nextDialog);
      }),
    []
  );

  const settleDialog = useCallback((value: DialogResult) => {
    const currentDialog = dialogRef.current;
    if (!currentDialog) return;

    dialogRef.current = null;
    setDialog(null);
    currentDialog.resolve(value);
  }, []);

  const showAlert = useCallback(
    async (message: string, title = 'Aviso') => {
      await openDialog({ kind: 'alert', title, message });
    },
    [openDialog]
  );

  const showConfirm = useCallback(
    async (message: string, title = 'Confirmar acción') =>
      (await openDialog({ kind: 'confirm', title, message })) === true,
    [openDialog]
  );

  const showPrompt = useCallback(
    async (
      message: string,
      title = 'Ingresa los datos',
      defaultValue = '',
      placeholder = ''
    ) => {
      const result = await openDialog({
        kind: 'prompt',
        title,
        message,
        defaultValue,
        placeholder,
      });
      return typeof result === 'string' ? result : null;
    },
    [openDialog]
  );

  const cancelDialog = useCallback(() => {
    settleDialog(dialogRef.current?.kind === 'confirm' ? false : null);
  }, [settleDialog]);

  const dialogElement = (
    <Modal
      isOpen={dialog !== null}
      onClose={cancelDialog}
      title={dialog?.title}
      description={dialog?.message}
      maxWidth="sm"
      className={styles.dialog}
    >
      {dialog?.kind === 'prompt' && (
        <input
          autoFocus
          className={styles.input}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') settleDialog(inputValue);
          }}
          placeholder={dialog.placeholder}
        />
      )}
      <div className={styles.actions}>
        {dialog?.kind !== 'alert' && (
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={cancelDialog}
          >
            Cancelar
          </button>
        )}
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() =>
            settleDialog(
              dialog?.kind === 'alert'
                ? undefined
                : dialog?.kind === 'confirm'
                  ? true
                  : inputValue
            )
          }
        >
          {dialog?.kind === 'alert' ? 'Entendido' : 'Continuar'}
        </button>
      </div>
    </Modal>
  );

  return { showAlert, showConfirm, showPrompt, dialogElement };
}
