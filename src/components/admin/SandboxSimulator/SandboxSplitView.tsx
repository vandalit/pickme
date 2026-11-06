'use client';

import React, { useState, useRef, useEffect } from 'react';
import { StudentCard } from '@/components/board/StudentCard';
import { BoardHeader } from '@/components/board/BoardHeader';
import { QRDisplay } from '@/components/ui/QRDisplay';
import { StepHandoverDisplay } from '@/components/picker/StepHandoverDisplay';
import { Keypad } from '@/components/ui/Keypad';
import { Badge } from '@/components/ui/Badge';
import { WhatsAppMockup } from './WhatsAppMockup';
import { TvFrame, MobileFrame, TabletFrame, PcFrame } from './frames';
import styles from './SandboxSplitView.module.css';

export interface SandboxSplitViewProps {
  stage: 1 | 2 | 3 | 4;
  onAdvanceStage: (next: 1 | 2 | 3 | 4) => void;
}

type DomainId = 'tv' | 'mobile' | 'tablet' | 'pc';

export function SandboxSplitView({
  stage,
  onAdvanceStage,
}: SandboxSplitViewProps) {
  const [tabStaff, setTabStaff] = useState<'staff' | 'whatsapp'>('staff');
  const [activeDomain, setActiveDomain] = useState<DomainId>('tv');

  const tvRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const tabletRef = useRef<HTMLDivElement>(null);
  const pcRef = useRef<HTMLDivElement>(null);

  const domainRefs: Record<DomainId, React.RefObject<HTMLDivElement | null>> = {
    tv: tvRef,
    mobile: mobileRef,
    tablet: tabletRef,
    pc: pcRef,
  };

  const domainOrder: DomainId[] = ['tv', 'mobile', 'tablet', 'pc'];

  const scrollToDomain = (domain: DomainId) => {
    setActiveDomain(domain);
    const targetRef = domainRefs[domain];
    if (targetRef && targetRef.current) {
      targetRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  };

  // Scroll to corresponding device automatically when stage updates
  useEffect(() => {
    if (stage === 1) {
      scrollToDomain('tv');
    } else if (stage === 2) {
      scrollToDomain('mobile');
    } else if (stage === 3) {
      scrollToDomain('tablet');
    } else if (stage === 4) {
      scrollToDomain('pc');
    }
  }, [stage]);

  const currentIndex = domainOrder.indexOf(activeDomain);

  const handlePrev = () => {
    if (currentIndex > 0) {
      scrollToDomain(domainOrder[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < domainOrder.length - 1) {
      scrollToDomain(domainOrder[currentIndex + 1]);
    }
  };

  // Simulated status for Zorro Naranja (Mateo González)
  const zorroStatus =
    stage === 1
      ? 'WAITING'
      : stage === 2 || stage === 3
      ? 'IN_PROCESS'
      : 'ARRIVED';

  return (
    <div className={styles.runwaySection}>
      {/* ── Runway Horizontal Track ── */}
      <div className={styles.runwayTrack} role="region" aria-label="Simulador de 4 Dominios de Hardware">
        {/* Dominio 1: Smart TV Patio */}
        <div ref={tvRef} className={`${styles.domainSlide} ${styles.tvSlide}`} id="domain-tv">
          <TvFrame id="frame-tv">
            {/*
              El TV renderiza el board completo escalado al aspect ratio 16:9.
              Usamos un wrapper que toma el 100% del ancho disponible y escala
              el contenido proporcionalmente — simula fielmente el board real.
            */}
            <div className={styles.tvBoardViewport}>
              <BoardHeader
                schoolName="Colegio San Martín"
                sessionTitle="Simulador Sandbox"
                counts={{
                  waiting: stage === 1 ? 3 : 2,
                  inProcess: stage === 2 || stage === 3 ? 1 : 0,
                  completed: stage === 4 ? 1 : 0,
                  total: 3,
                }}
              />

              <div className={styles.tvInner}>
                <div className={styles.tvGrid}>
                  <StudentCard
                    id="s-zorro"
                    animalId="zorro"
                    colorId="naranja"
                    classroomName="1°A"
                    status={zorroStatus}
                  />
                  <StudentCard
                    id="s-delfin"
                    animalId="delfin"
                    colorId="celeste"
                    classroomName="1°A"
                    status="WAITING"
                  />
                  <StudentCard
                    id="s-osito"
                    animalId="osito"
                    colorId="cafe"
                    classroomName="1°A"
                    status="WAITING"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', padding: '0.75rem' }}>
                  <QRDisplay value="https://pickme.app/retirar?session=SAN-1024" size={110} />
                </div>
              </div>
            </div>
          </TvFrame>
        </div>

        {/* Dominio 2: Celular Picker */}
        <div ref={mobileRef} className={`${styles.domainSlide} ${styles.mobileSlide}`} id="domain-mobile">
          <MobileFrame id="frame-mobile">
            {stage === 1 ? (
              <div className={styles.mobileInitialState}>
                <div className={styles.mobileCarIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11.1 2 11.5 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <path d="M9 17h6" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                </div>
                <h4 className={styles.mobileInitialTitle}>En camino al colegio</h4>
                <p className={styles.mobileInitialDesc}>
                  El apoderado o tío autorizado se traslada al colegio. Al llegar al portón, escaneará el código QR exterior sin necesidad de descargar ninguna app.
                </p>
                <button
                  type="button"
                  className={styles.mobileScanBtn}
                  onClick={() => onAdvanceStage(2)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect width="5" height="5" x="3" y="3" rx="1" />
                    <rect width="5" height="5" x="16" y="3" rx="1" />
                    <rect width="5" height="5" x="3" y="16" rx="1" />
                    <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                    <path d="M21 21v.01" />
                    <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                    <path d="M3 12h.01" />
                    <path d="M12 3h.01" />
                    <path d="M12 16v.01" />
                    <path d="M16 12h1" />
                    <path d="M21 12v.01" />
                    <path d="M12 21v-1" />
                  </svg>
                  Escanear QR y Anunciar
                </button>
              </div>
            ) : (
              <StepHandoverDisplay
                handoverCode="849201"
                studentPublicLabel="Zorro Naranja"
                studentInitials="M.G."
                animalId="zorro"
                colorId="naranja"
                classroomName="1° Básico A"
                schoolName="Colegio San Martín"
                status={zorroStatus}
                onReset={() => onAdvanceStage(1)}
              />
            )}
          </MobileFrame>
        </div>

        {/* Dominio 3: Tablet Portón Staff */}
        <div ref={tabletRef} className={`${styles.domainSlide} ${styles.tabletSlide}`} id="domain-tablet">
          <TabletFrame id="frame-tablet">
            <div className={styles.tabletWrapper}>
              <div className={styles.tabletTabs}>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${tabStaff === 'staff' ? styles.tabBtnActiveStaff : ''}`}
                  onClick={() => setTabStaff('staff')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M12 21h.01" />
                  </svg>
                  Consola Tablet Portón
                </button>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${tabStaff === 'whatsapp' ? styles.tabBtnActiveWhatsapp : ''}`}
                  onClick={() => setTabStaff('whatsapp')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                  Aviso WhatsApp
                </button>
              </div>

              {tabStaff === 'staff' ? (
                <div className={styles.staffCard}>
                  <div className={styles.staffStudentHeader}>
                    <div>
                      <div className={styles.studentMetaName}>Mateo González</div>
                      <div className={styles.studentMetaSub}>1°A · Retira: Ignacio Herrera (Tío)</div>
                    </div>
                    <Badge status={zorroStatus as any} size="sm" />
                  </div>

                  {stage < 3 ? (
                    <div className={styles.staffInstruction}>
                      {stage === 1
                        ? 'Esperando que el retirador autorizado anuncie su llegada en el portón exterior...'
                        : 'Retirador anunciado. Solicita el código de 6 dígitos que observa en su pantalla móvil.'}
                    </div>
                  ) : stage === 3 ? (
                    <div className={styles.keypadArea}>
                      <span className={styles.keypadPrompt}>
                        Digita el código <strong>849201</strong> para certificar el traspaso:
                      </span>
                      <Keypad onComplete={() => onAdvanceStage(4)} />
                    </div>
                  ) : (
                    <div className={styles.successNotice}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                      <div>Traspaso Físico Completado con Éxito</div>
                      <span style={{ fontSize: '0.75rem', color: '#A7F3D0', fontWeight: 500 }}>
                        Custodia transferida · Notificación enviada a la familia
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <WhatsAppMockup
                  studentName="Mateo González"
                  studentPublicLabel="Zorro Naranja"
                  pickerName="Ignacio Herrera (Tío)"
                  isConfirmed={stage === 4}
                  onConfirmArrival={() => onAdvanceStage(4)}
                />
              )}
            </div>
          </TabletFrame>
        </div>

        {/* Dominio 4: Consola PC Dirección */}
        <div ref={pcRef} className={`${styles.domainSlide} ${styles.pcSlide}`} id="domain-pc">
          <PcFrame id="frame-pc">
            <div className={styles.pcContainer}>
              <div className={styles.pcHeaderBar}>
                <div className={styles.pcSessionTitle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>Consola de Salida · Sesión SAN-1024</span>
                </div>
                <div className={styles.liveBadgePulse}>
                  <span className={styles.pulseDot} />
                  <span>Stream SSE Sincronizado</span>
                </div>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.auditTable} aria-label="Nómina en vivo de salida escolar">
                  <thead>
                    <tr>
                      <th>Alumno / Código</th>
                      <th>Curso</th>
                      <th>Retirador</th>
                      <th>Estado en Vivo</th>
                      <th>Custodia Forense</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={styles.highlightRow}>
                      <td>
                        <div className={styles.studentCell}>
                          <span className={styles.studentRealName}>Mateo González</span>
                          <span className={styles.studentTokenTag}>Zorro Naranja</span>
                        </div>
                      </td>
                      <td>1° Básico A</td>
                      <td>Ignacio Herrera (Tío)</td>
                      <td>
                        {stage === 1 && (
                          <span className={styles.statusPillWaiting}>Esperando en Patio</span>
                        )}
                        {stage === 2 && (
                          <span className={styles.statusPillProcess}>Picker en Portón</span>
                        )}
                        {stage === 3 && (
                          <span className={styles.statusPillHandover}>Verificando Código</span>
                        )}
                        {stage === 4 && (
                          <span className={styles.statusPillCompleted}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Entregado & Sellado
                          </span>
                        )}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#94A3B8' }}>
                        {stage === 4 ? (
                          <span style={{ color: '#34D399' }}>Carlos Puertas · #SAN-849201</span>
                        ) : stage >= 2 ? (
                          <span style={{ color: '#CBD5E1' }}>Código 849201 emitido</span>
                        ) : (
                          'Pendiente arribo'
                        )}
                      </td>
                    </tr>

                    <tr>
                      <td>
                        <div className={styles.studentCell}>
                          <span className={styles.studentRealName}>Sofía Contreras</span>
                          <span className={styles.studentTokenTag}>Delfín Celeste</span>
                        </div>
                      </td>
                      <td>1° Básico A</td>
                      <td>Valentina Morales (Mamá)</td>
                      <td>
                        <span className={styles.statusPillWaiting}>Esperando en Patio</span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748B' }}>
                        Pendiente arribo
                      </td>
                    </tr>

                    <tr>
                      <td>
                        <div className={styles.studentCell}>
                          <span className={styles.studentRealName}>Lucas Silva</span>
                          <span className={styles.studentTokenTag}>Osito Café</span>
                        </div>
                      </td>
                      <td>1° Básico A</td>
                      <td>Mario Soto (Furgón #4)</td>
                      <td>
                        <span className={styles.statusPillWaiting}>Esperando en Patio</span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748B' }}>
                        Pendiente arribo
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </PcFrame>
        </div>
      </div>

      {/* ── Accessible Bottom Navigation Dock ── */}
      <nav className={styles.bottomDock} aria-label="Navegación de Dominios de Hardware">
        <div className={styles.dockButtonsList}>
          <button
            type="button"
            className={`${styles.dockBtn} ${activeDomain === 'tv' ? styles.dockBtnActive : ''}`}
            onClick={() => scrollToDomain('tv')}
            aria-selected={activeDomain === 'tv'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect width="20" height="15" x="2" y="3" rx="2" />
              <polyline points="17 21 12 18 7 21" />
            </svg>
            1. Smart TV Patio
          </button>

          <button
            type="button"
            className={`${styles.dockBtn} ${activeDomain === 'mobile' ? styles.dockBtnActive : ''}`}
            onClick={() => scrollToDomain('mobile')}
            aria-selected={activeDomain === 'mobile'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
              <path d="M12 18h.01" />
            </svg>
            2. Celular Picker
          </button>

          <button
            type="button"
            className={`${styles.dockBtn} ${activeDomain === 'tablet' ? styles.dockBtnActive : ''}`}
            onClick={() => scrollToDomain('tablet')}
            aria-selected={activeDomain === 'tablet'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M12 21h.01" />
            </svg>
            3. Tablet Portón Staff
          </button>

          <button
            type="button"
            className={`${styles.dockBtn} ${activeDomain === 'pc' ? styles.dockBtnActive : ''}`}
            onClick={() => scrollToDomain('pc')}
            aria-selected={activeDomain === 'pc'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect width="20" height="14" x="2" y="3" rx="2" />
              <line x1="8" x2="16" y1="21" y2="21" />
              <line x1="12" x2="12" y1="17" y2="21" />
            </svg>
            4. Monitor PC Dirección
          </button>
        </div>

        <div className={styles.dockNavArrows}>
          <button
            type="button"
            className={styles.arrowBtn}
            onClick={handlePrev}
            disabled={currentIndex === 0}
            aria-label="Dominio anterior"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Anterior
          </button>
          <button
            type="button"
            className={styles.arrowBtn}
            onClick={handleNext}
            disabled={currentIndex === domainOrder.length - 1}
            aria-label="Siguiente dominio"
          >
            Siguiente
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </nav>
    </div>
  );
}
