'use client';

import React, { useState, useTransition } from 'react';
import {
  createStaffMemberAction,
  deleteStaffMemberAction,
  createStaffInvitationAction,
  acceptInvitationAction,
  rejectInvitationAction,
} from './actions';
import styles from './StaffManager.module.css';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface PendingInvitation {
  id: string;
  email: string;
  token: string;
  createdAt: string;
  expiresAt: string;
}

interface StaffManagerProps {
  initialMembers: StaffMember[];
  initialInvitations?: PendingInvitation[];
}

export function StaffManager({
  initialMembers,
  initialInvitations = [],
}: StaffManagerProps) {
  const [members, setMembers] = useState<StaffMember[]>(initialMembers);
  const [invitations, setInvitations] = useState<PendingInvitation[]>(initialInvitations);
  const [showForm, setShowForm] = useState(false);
  const [inviteOnly, setInviteOnly] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    setError(null);
    if (!email.trim() || (!inviteOnly && !name.trim())) {
      setError('Por favor completa los campos requeridos.');
      return;
    }

    startTransition(async () => {
      if (inviteOnly) {
        // Enlace de invitación
        const res = await createStaffInvitationAction(email);
        if (!res.success) {
          setError(res.error || 'Error al generar invitación.');
          return;
        }
        if (res.token) {
          setInvitations((prev) => [
            {
              id: `tmp-inv-${Date.now()}`,
              email: email.trim().toLowerCase(),
              token: res.token!,
              createdAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
            },
            ...prev,
          ]);
        }
      } else {
        // Creación directa
        const result = await createStaffMemberAction(name, email);
        if (!result.success) {
          setError(result.error ?? 'Error desconocido.');
          return;
        }
        setMembers((prev) => [
          ...prev,
          {
            id: `tmp-${Date.now()}`,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            createdAt: new Date().toISOString(),
          },
        ]);
      }

      setName('');
      setEmail('');
      setShowForm(false);
      setInviteOnly(false);
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

  const handleAcceptInvite = (invitationId: string) => {
    startTransition(async () => {
      const result = await acceptInvitationAction(invitationId);
      if (!result.success) {
        setError(result.error || 'Error al aceptar invitación.');
        return;
      }
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    });
  };

  const handleRejectInvite = (invitationId: string) => {
    if (!window.confirm('¿Rechazar esta solicitud de acceso?')) return;
    startTransition(async () => {
      const result = await rejectInvitationAction(invitationId);
      if (!result.success) {
        setError(result.error || 'Error al rechazar solicitud.');
        return;
      }
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    });
  };

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/staff/join?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Equipo de Portón</h2>
          <p className={styles.sectionDesc}>
            Los miembros registrados pueden acceder al panel operativo de portería.
            Puedes registrarlos de forma directa o enviarles un enlace de invitación temporal.
          </p>
        </div>
        <button
          type="button"
          className={styles.addBtn}
          onClick={() => {
            setShowForm((v) => !v);
            setError(null);
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>{showForm ? 'Cancelar' : 'Agregar o Invitar'}</span>
        </button>
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <h3 className={styles.formTitle}>
              {inviteOnly ? 'Generar enlace de invitación' : 'Registrar nuevo miembro de portón'}
            </h3>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input
                type="checkbox"
                checked={inviteOnly}
                onChange={(e) => setInviteOnly(e.target.checked)}
              />
              Modo Invitación con enlace
            </label>
          </div>

          <div className={styles.formRow}>
            {!inviteOnly && (
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
            )}
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
              {isPending
                ? 'Procesando...'
                : inviteOnly
                ? 'Generar enlace de invitación'
                : 'Registrar en equipo'}
            </button>
          </div>
        </div>
      )}

      {/* Bloque de Invitaciones y Solicitudes Pendientes */}
      {invitations.length > 0 && (
        <div className={styles.invitesBlock}>
          <h3 className={styles.invitesTitle}>
            <span>Solicitudes e Invitaciones Pendientes</span>
            <span className={styles.invitesBadge}>{invitations.length}</span>
          </h3>
          <div className={styles.invitesList}>
            {invitations.map((inv) => (
              <div key={inv.id} className={styles.inviteCard}>
                <div>
                  <div className={styles.inviteEmail}>{inv.email}</div>
                  <div className={styles.inviteMeta}>
                    Creada: {new Date(inv.createdAt).toLocaleDateString('es-CL')} · Expira:{' '}
                    {new Date(inv.expiresAt).toLocaleDateString('es-CL')}
                  </div>
                </div>
                <div className={styles.inviteActions}>
                  <button
                    type="button"
                    className={styles.copyLinkBtn}
                    onClick={() => handleCopyLink(inv.token)}
                    title="Copiar link de invitación"
                  >
                    {copiedToken === inv.token ? '¡Copiado!' : 'Copiar Link'}
                  </button>
                  <button
                    type="button"
                    className={styles.acceptBtn}
                    onClick={() => handleAcceptInvite(inv.id)}
                    disabled={isPending}
                  >
                    Aprobar
                  </button>
                  <button
                    type="button"
                    className={styles.rejectBtn}
                    onClick={() => handleRejectInvite(inv.id)}
                    disabled={isPending}
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Miembros Activos */}
      {members.length === 0 ? (
        <div className={styles.emptyState}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          <p>Aún no hay personal de portón activo registrado.</p>
          <p>Agrega o invita a un miembro para que pueda acceder a su panel operativo.</p>
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
