'use client';

import { useEffect, useState } from 'react';
import type { Student, StudentStatus } from '@/lib/session';
import { getAnimal, getColor, getPublicLabel } from '@/lib/avatars';
import styles from './StudentModal.module.css';

type ModalTab = 'custody' | 'whatsapp' | 'gps';

interface StudentModalProps {
  student: Student | null;
  onClose: () => void;
  onStatusChange: (studentId: string, newStatus: StudentStatus) => void;
}

export function StudentModal({ student, onClose, onStatusChange }: StudentModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('custody');
  const [confirmedArrival, setConfirmedArrival] = useState(false);
  const [reportedIssue, setReportedIssue] = useState(false);
  const [tripProgress, setTripProgress] = useState(65);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!student) return null;

  const animal = getAnimal(student.animalId);
  const color = getColor(student.colorId);
  const publicLabel = getPublicLabel(student.animalId, student.colorId);

  // Custody metadata
  const custodyMock = {
    guardian: 'Elena Martínez (Madre)',
    guardianPhone: '+54 9 11 5821-4920',
    picker: student.status === 'waiting' 
      ? 'Aún no anunciado' 
      : 'Martín Benítez (Transporte Escolar #12)',
    pickerDni: student.status === 'waiting' ? '—' : 'DNI terminado en 482',
    handoverCode: student.status === 'waiting' ? 'Pendiente' : 'K7-938',
    authStatus: 'Autorización legal verificada vía WhatsApp',
    address: 'Av. Libertador 4210, Piso 4B',
  };

  const handleConfirmArrival = () => {
    setConfirmedArrival(true);
    setReportedIssue(false);
    setTripProgress(100);
    onStatusChange(student.id, 'picked_up');
  };

  const handleReportIssue = () => {
    setReportedIssue(true);
    setConfirmedArrival(false);
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className={styles.modal} 
        onClick={(e) => e.stopPropagation()}
        style={{ '--accent-color': color.hex } as React.CSSProperties}
      >
        <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar modal">
          ✕
        </button>

        {/* Header con Avatar Anónimo (Capa 0) */}
        <div className={styles.header}>
          <div 
            className={styles.avatarRing}
            style={{ 
              backgroundColor: `${color.hex}22`,
              borderColor: color.hex,
              boxShadow: `0 0 30px ${color.hex}44`
            }}
          >
            <span className={styles.emoji}>{animal.emoji}</span>
          </div>

          <div className={styles.titleInfo}>
            <div className={styles.tagGroup}>
              <span className={styles.gradeBadge}>{student.grade}</span>
              <span className={styles.privacyBadge}>Capa 0 · Privacidad Protegida</span>
            </div>
            <h2 className={styles.publicName}>{publicLabel}</h2>
            <p className={styles.subtext}>
              {student.status === 'waiting' && '⏳ En espera en patio escolar'}
              {student.status === 'in_process' && '🔄 En proceso de retiro / En viaje'}
              {student.status === 'picked_up' && '✓ Retiro y custodia completados'}
            </p>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className={styles.tabsBar}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'custody' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('custody')}
          >
            📋 Custodia & Estado
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'whatsapp' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('whatsapp')}
          >
            💬 Chat WhatsApp (Bot)
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'gps' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('gps')}
          >
            📍 GPS Enlace Mágico
          </button>
        </div>

        {/* TAB 1: CUSTODIA & ESTADOS */}
        {activeTab === 'custody' && (
          <div className={styles.tabContent}>
            {/* Simulador de Estados para la demo */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionLabel}>Simulador de Estado en el Tablero</span>
                <span className={styles.hintTag}>Afecta al Smart TV en vivo</span>
              </div>
              <div className={styles.statusButtons}>
                <button
                  className={`${styles.statusBtn} ${styles.btnWaiting} ${student.status === 'waiting' ? styles.active : ''}`}
                  onClick={() => onStatusChange(student.id, 'waiting')}
                >
                  <span className={styles.btnDot} />
                  ⏳ Esperando
                </button>

                <button
                  className={`${styles.statusBtn} ${styles.btnProcess} ${student.status === 'in_process' ? styles.active : ''}`}
                  onClick={() => onStatusChange(student.id, 'in_process')}
                >
                  <span className={styles.btnDot} />
                  🔄 En proceso / Tránsito
                </button>

                <button
                  className={`${styles.statusBtn} ${styles.btnPicked} ${student.status === 'picked_up' ? styles.active : ''}`}
                  onClick={() => onStatusChange(student.id, 'picked_up')}
                >
                  <span className={styles.btnDot} />
                  ✓ Retirado / En Hogar
                </button>
              </div>
            </div>

            {/* Capa de Custodia y Seguridad (Staff / Interna) */}
            <div className={styles.section}>
              <span className={styles.sectionLabel}>Registro Legal de Custodia (Staff)</span>
              <div className={styles.custodyCard}>
                <div className={styles.custodyRow}>
                  <span className={styles.rowTitle}>Apoderado titular:</span>
                  <span className={styles.rowValue}>{custodyMock.guardian}</span>
                </div>
                <div className={styles.custodyRow}>
                  <span className={styles.rowTitle}>Teléfono WhatsApp:</span>
                  <span className={styles.rowValue}>{custodyMock.guardianPhone}</span>
                </div>
                <div className={styles.custodyRow}>
                  <span className={styles.rowTitle}>Picker autorizado:</span>
                  <span className={styles.rowValue}>{custodyMock.picker}</span>
                </div>
                <div className={styles.custodyRow}>
                  <span className={styles.rowTitle}>Handover Code (Puerta):</span>
                  <span className={`${styles.rowValue} ${styles.codeHighlight}`}>
                    {custodyMock.handoverCode}
                  </span>
                </div>
                <div className={styles.custodyRow}>
                  <span className={styles.rowTitle}>Domicilio de entrega:</span>
                  <span className={styles.rowValue}>{custodyMock.address}</span>
                </div>
                <div className={styles.custodyRow}>
                  <span className={styles.rowTitle}>Aprobación legal:</span>
                  <span className={styles.rowValueOk}>{custodyMock.authStatus}</span>
                </div>
              </div>
            </div>

            <button
              className={styles.actionBannerBtn}
              onClick={() => setActiveTab('whatsapp')}
            >
              <span>💬</span> Ver interacción simulada del Bot de WhatsApp con el Apoderado ➔
            </button>
          </div>
        )}

        {/* TAB 2: SIMULADOR DE CHAT WHATSAPP */}
        {activeTab === 'whatsapp' && (
          <div className={styles.tabContent}>
            {/* WhatsApp Phone Mockup Header */}
            <div className={styles.waHeader}>
              <div className={styles.waAvatar}>🤖</div>
              <div className={styles.waInfo}>
                <span className={styles.waName}>PickMe Bot · Escuela San Martín</span>
                <span className={styles.waStatus}>Cuenta comercial oficial · en línea</span>
              </div>
              <span className={styles.waLockIcon}>🔒 Cifrado</span>
            </div>

            {/* Chat Messages */}
            <div className={styles.waChatArea}>
              <div className={styles.waDateDivider}>Hoy, 14:30 hs</div>

              {/* Bot Msg 1 */}
              <div className={styles.waBubbleBot}>
                <p>
                  📢 <strong>Aviso de Retiro Escolar:</strong><br />
                  Hola Elena, te informamos que <strong>Martín Benítez (Transporte #12)</strong> ha solicitado retirar a tu hijo en el portón escolar.
                </p>
                <div className={styles.waCodeBox}>
                  Código de entrega: <strong>{custodyMock.handoverCode}</strong>
                </div>
                <span className={styles.waTime}>14:31</span>
              </div>

              {/* Bot Msg 2 */}
              <div className={styles.waBubbleBot}>
                <p>
                  🚗 <strong>Traspaso confirmado en puerta:</strong><br />
                  La docente Mariana G. ha validado el código. El alumno ya está en el transporte escolar en camino a tu domicilio ({custodyMock.address}).
                </p>
                <div className={styles.waLinkBox}>
                  📍 <strong>Enlace Mágico de Ruta (Sin apps):</strong><br />
                  <span className={styles.waLink}>pickme.app/viaje?t=k8x-29a</span>
                </div>
                <span className={styles.waTime}>14:33</span>
              </div>

              {/* Interactive prompt message */}
              <div className={styles.waBubbleBot}>
                <p>
                  Por favor, confirma cuando tu hijo esté seguro dentro de tu hogar para dar por cerrada la responsabilidad legal del colegio:
                </p>

                {!confirmedArrival && !reportedIssue && (
                  <div className={styles.waActions}>
                    <button
                      className={styles.waBtnConfirm}
                      onClick={handleConfirmArrival}
                    >
                      ✅ Sí, llegó bien a casa
                    </button>
                    <button
                      className={styles.waBtnReport}
                      onClick={handleReportIssue}
                    >
                      ⚠️ Reportar retraso o problema
                    </button>
                  </div>
                )}
                <span className={styles.waTime}>14:34</span>
              </div>

              {/* Parent response if confirmed */}
              {confirmedArrival && (
                <>
                  <div className={styles.waBubbleUser}>
                    <p>¡Sí, ya llegó bien a casa! Muchas gracias al equipo del colegio.</p>
                    <span className={styles.waTimeUser}>14:48 ✓✓</span>
                  </div>
                  <div className={styles.waBubbleBot}>
                    <p>
                      🎉 <strong>¡Recepción confirmada!</strong><br />
                      Cadena de custodia finalizada con éxito. Se ha registrado en la bitácora escolar de hoy. ¡Hasta mañana!
                    </p>
                    <span className={styles.waTime}>14:48</span>
                  </div>
                </>
              )}

              {/* Parent response if issue reported */}
              {reportedIssue && (
                <>
                  <div className={styles.waBubbleUser}>
                    <p>⚠️ El transporte tiene más de 20 minutos de demora y no ha llegado.</p>
                    <span className={styles.waTimeUser}>14:49 ✓✓</span>
                  </div>
                  <div className={`${styles.waBubbleBot} ${styles.waAlertBubble}`}>
                    <p>
                      🚨 <strong>Alerta generada para Dirección:</strong><br />
                      Se ha notificado de urgencia a la coordinadora Sofía y se contactó telefónicamente al chofer Martín Benítez.
                    </p>
                    <span className={styles.waTime}>14:49</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: GPS ENLACE MÁGICO */}
        {activeTab === 'gps' && (
          <div className={styles.tabContent}>
            <div className={styles.gpsContainer}>
              <div className={styles.gpsHeader}>
                <div className={styles.gpsStatusBadge}>
                  <span className={styles.livePulseDot} />
                  <span>Streaming GPS Web Activo (HTML5 Geolocation)</span>
                </div>
                <span className={styles.gpsTechNote}>Cero apps instaladas en el celular</span>
              </div>

              {/* Route Progress Graphic */}
              <div className={styles.routeBox}>
                <div className={styles.routePoints}>
                  <div className={styles.routePoint}>
                    <span className={styles.pointIcon}>🏫</span>
                    <span className={styles.pointName}>Escuela Primaria</span>
                    <span className={styles.pointTime}>14:33 hs</span>
                  </div>
                  <div className={styles.routeLine}>
                    <div 
                      className={styles.routeProgress} 
                      style={{ width: `${tripProgress}%` }}
                    />
                    <div 
                      className={styles.routeVehicle}
                      style={{ left: `calc(${tripProgress}% - 14px)` }}
                    >
                      🚐
                    </div>
                  </div>
                  <div className={styles.routePoint}>
                    <span className={styles.pointIcon}>🏡</span>
                    <span className={styles.pointName}>Hogar Alumno</span>
                    <span className={styles.pointTime}>~14:50 hs</span>
                  </div>
                </div>

                <div className={styles.telemetryGrid}>
                  <div className={styles.telemetryItem}>
                    <span className={styles.telemetryLabel}>Distancia restante:</span>
                    <span className={styles.telemetryVal}>
                      {tripProgress === 100 ? '0 km (En destino)' : '1.4 km (4 cuadras)'}
                    </span>
                  </div>
                  <div className={styles.telemetryItem}>
                    <span className={styles.telemetryLabel}>Velocidad estimada:</span>
                    <span className={styles.telemetryVal}>
                      {tripProgress === 100 ? '0 km/h (Detenido)' : '34 km/h'}
                    </span>
                  </div>
                  <div className={styles.telemetryItem}>
                    <span className={styles.telemetryLabel}>Coordenadas en vivo:</span>
                    <span className={styles.telemetryVal}>-34.5821, -58.4210</span>
                  </div>
                  <div className={styles.telemetryItem}>
                    <span className={styles.telemetryLabel}>Estado del chofer:</span>
                    <span className={styles.telemetryValOk}>En ruta segura</span>
                  </div>
                </div>
              </div>

              {/* Simulation CTA */}
              <div className={styles.gpsActions}>
                {tripProgress < 100 ? (
                  <button
                    className={styles.btnSimulateArrive}
                    onClick={() => {
                      setTripProgress(100);
                      setActiveTab('whatsapp');
                    }}
                  >
                    <span>⚡</span> Simular llegada a geocerca del domicilio (Disparar WhatsApp)
                  </button>
                ) : (
                  <div className={styles.arrivedBanner}>
                    <span>✅</span> Vehículo arribó a destino. Custodia transferida al hogar.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.securityNote}>
            🔒 Blindaje legal: Esta información solo es accesible por el Staff autorizado. Los datos de contacto y GPS nunca se exponen en el Smart TV.
          </p>
        </div>
      </div>
    </div>
  );
}
