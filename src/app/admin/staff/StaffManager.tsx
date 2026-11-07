'use client';

import React, { useState, useTransition } from 'react';
import { createStaffMemberAction, deleteStaffMemberAction } from './actions';
import styles from './StaffManager.module.css';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface StaffManagerProps {
  initialMembers: StaffMember[];
}

export function StaffManager({ initialMembers }: StaffManagerProps) {
  const [members, setMembers] = useState<StaffMember[]>(initialMembers);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    setError(null);
    if (!name.trim() || !email.trim()) {
      setError('Nombre y correo son obligatorios.');
      return;
    }
    startTransition(async () => {
      const result = await createStaffMemberAction(name, email);
      if (!result.success) {
        setError(result.error ?? 'Error desconocido.');
        return;
      }
      // Optimistic update: añadir localmente hasta que revalidatePath recargue
      setMembers((prev) => [
        ...prev,
        {
          id: `tmp-${Date.now()}`,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          createdAt: new Date().toISOString(),
        },
      ]);
      setName('');
      setEmail('');
      setShowForm(false);
    });
  };

  const handleDelete = (userId: string, memberName: string) => {
    if (!window.confirm(`¿Eliminar a ${memberName} del equipo de portón?`)) return;
    startTransition(async () => {
      const result = await deleteStaffMemberAction(userId);
      if (!result.success) {
        setError(result.error ?? 'Error al eliminar.');
        return;
      }
      setMembers((prev) => prev.filter((m) => m.id !== userId));
    });
  };

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Equipo de Portón</h2>
          <p className={styles.sectionDesc}>
            Los miembros registrados pueden iniciar sesión con su correo y acceder al panel operativo de portería.
            No tienen acceso al área de administración.
          </p>
        </div>
        <button
          type="button"
          className={styles.addBtn}
          onClick={() => { setShowForm((v) => !v); setError(null); }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>{showForm ? 'Cancelar' : 'Agregar miembro'}</span>
        </button>
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <h3 className={styles.formTitle}>Registrar nuevo miembro de portón</h3>
          <div className={styles.formRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="staff-name">Nombre completo</label>
              <input
                id="staff-name"
                type="text"
                className={styles.input}
                placeholder="Ej: Carlos Mendoza"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="staff-email">Correo institucional</label>
              <input
                id="staff-email"
                type="email"
                className={styles.input}
                placeholder="Ej: carlos@colegio.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>
          {error && <p className={styles.errorMsg} role="alert">{error}</p>}
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.submitBtn}
              onClick={handleAdd}
              disabled={isPending}
            >
              {isPending ? 'Guardando...' : 'Registrar en equipo'}
            </button>
          </div>
        </div>
      )}

      {members.length === 0 ? (
        <div className={styles.emptyState}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          <p>Aún no hay personal de portón registrado.</p>
          <p>Agrega un miembro para que pueda acceder a su panel operativo.</p>
        </div>
      ) : (
        <table className={styles.table} role="grid">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Registrado</th>
              <th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className={styles.row}>
                <td className={styles.cellName}>
                  <span className={styles.avatar}>{m.name.charAt(0).toUpperCase()}</span>
                  {m.name}
                </td>
                <td className={styles.cellEmail}>{m.email}</td>
                <td className={styles.cellDate}>
                  {new Date(m.createdAt).toLocaleDateString('es-CL', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className={styles.cellActions}>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(m.id, m.name)}
                    disabled={isPending}
                    aria-label={`Eliminar a ${m.name}`}
                    title="Eliminar del equipo"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

