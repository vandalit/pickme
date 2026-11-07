'use client';

import React, { useState } from 'react';
import { resetMySchoolAction } from '@/app/admin/sessionActions';
import styles from './ProfileModal.module.css';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  currentRole: string;
  schoolName: string;
}

export function ProfileModal({
  isOpen,
  onClose,
  userName,
  userEmail,
  currentRole,
  schoolName,
}: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'help'>('profile');
  const [roleMessage, setRoleMessage] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.tabGroup}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              👤 Mi Perfil
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'help' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('help')}
            >
              ❓ Ayuda & FAQ
            </button>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar modal">
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'profile' ? (
            <div className={styles.profileSection}>
              <div className={styles.avatarRow}>
                <div className={styles.avatarCircle}>{userName.charAt(0).toUpperCase()}</div>
                <div>
                  <h3 className={styles.profileName}>{userName}</h3>
                  <span className={styles.profileEmail}>{userEmail}</span>
                </div>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Establecimiento Educacional:</span>
                  <strong className={styles.infoValue}>{schoolName}</strong>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Rol actual:</span>
                  <span className={styles.roleBadge}>
                    {currentRole === 'SCHOOL_ADMIN' ? 'Director(a) / Administrador' : 'Personal de Portería (Staff)'}
                  </span>
                </div>
              </div>

              <div className={styles.roleNotice}>
                <h4>¿Te equivocaste de rol o necesitas cambiar a Portería?</h4>
                <p>
                  Si registraste este establecimiento como Director pero en realidad operas en portería,
                  puedes solicitar reasignación o invitar a un nuevo Director desde <strong>Equipo & Portón</strong>.
                </p>
                <button
                  type="button"
                  className={styles.switchRoleBtn}
                  onClick={() =>
                    setRoleMessage(
                      'Para cambiar de rol institucional o transferir la dirección del colegio a otra cuenta, ingresa a "Equipo & Portón" e invita al nuevo director, o contáctanos a soporte.'
                    )
                  }
                >
                  Cambiar o reasignar rol
                </button>
                {roleMessage && <div className={styles.roleMessage}>{roleMessage}</div>}
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={async () => {
                    if (window.confirm('¿Deseas eliminar este colegio y volver al Onboarding inicial? Tu cuenta quedará desvinculada para configurar tu colegio real.')) {
                      setIsResetting(true);
                      const res = await resetMySchoolAction();
                      if (res.success) {
                        window.location.href = '/onboarding';
                      } else {
                        alert(res.error || 'No se pudo reiniciar.');
                        setIsResetting(false);
                      }
                    }
                  }}
                  style={{
                    padding: '0.6rem 0.85rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'center',
                    fontWeight: 600,
                  }}
                >
                  {isResetting ? 'Limpiando colegio...' : '🗑️ Eliminar colegio y volver al Onboarding inicial'}
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.helpSection}>
              <h3 className={styles.faqTitle}>Preguntas Frecuentes y Casos de Uso</h3>

              <div className={styles.faqItem}>
                <h4 className={styles.question}>¿Qué hago si me equivoqué de rol al iniciar?</h4>
                <p className={styles.answer}>
                  Si seleccionaste <em>Director</em> por error pero perteneces al equipo de portería, no crees un colegio.
                  Vuelve a la selección de rol desde el link inferior en el onboarding o pide al Director de tu colegio que te envíe un <strong>enlace de invitación de Staff</strong>.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h4 className={styles.question}>¿Cómo invito al personal de portón?</h4>
                <p className={styles.answer}>
                  Ve a la pestaña <strong>Equipo & Portón</strong>. Puedes registrarlos con su correo institucional o activar el botón <em>Modo Invitación con enlace</em>. Este generará un enlace con token válido por 48 horas para enviárselo directamente por WhatsApp o correo.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h4 className={styles.question}>¿Cómo proyectar el tablero en la Smart TV del patio?</h4>
                <p className={styles.answer}>
                  Abre el navegador de la Smart TV y dirígete a <code>pickme.app/board</code>. Ingresa el código de 8 caracteres de tu jornada activa (ej: <code>CSM-7429</code>). También puedes presionar el botón <strong>Board TV</strong> en la barra superior para abrirlo y copiar el enlace directo.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h4 className={styles.question}>¿Cómo funciona el anonimato de los alumnos?</h4>
                <p className={styles.answer}>
                  En la Smart TV pública de patio nunca se proyectan nombres reales, solo el identificador visual anónimo de Capa 0 (ej: <em>Zorro Naranja</em>). Solo el staff autorizado en portería puede ver las iniciales y validar los 6 dígitos del apoderado.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

