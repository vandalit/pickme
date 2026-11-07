'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProfileModal } from './ProfileModal';
import styles from './AdminNav.module.css';

interface AdminNavProps {
  userName: string;
  userEmail?: string;
  schoolName: string;
  activeSessionCode: string | null;
  onSignOut: () => Promise<void>;
}

export function AdminNav({
  userName,
  userEmail = '',
  schoolName,
  activeSessionCode,
  onSignOut,
}: AdminNavProps) {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const initial = userName.charAt(0).toUpperCase();

  const navItems = [
    {
      label: 'Salida en Vivo & Launchpad',
      href: '/admin',
      exact: true,
      icon: (
        <svg className={styles.tabIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      ),
    },
    {
      label: 'Nómina & Cursos',
      href: '/admin/cursos',
      exact: false,
      icon: (
        <svg className={styles.tabIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: 'Auditoría Forense',
      href: '/admin/auditoria',
      exact: false,
      icon: (
        <svg className={styles.tabIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      label: 'Equipo & Portón',
      href: '/admin/staff',
      exact: false,
      icon: (
        <svg className={styles.tabIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
      ),
    },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        <Link href="/admin" className={styles.homeLink} title="Ir a Salida en Vivo (Dashboard)">
          <div className={styles.avatar}>{initial}</div>
          <div className={styles.meta}>
            <span className={styles.name}>{userName}</span>
            <span className={styles.institution}>Director(a) · {schoolName}</span>
          </div>
        </Link>

        <div className={styles.topRight}>
          <div className={styles.sessionPill}>
            <span className={styles.sessionDot} />
            <span>
              {activeSessionCode
                ? `Jornada Activa: ${activeSessionCode}`
                : 'Sin jornada abierta'}
            </span>
          </div>

          <button
            type="button"
            className={styles.profileBtn}
            onClick={() => setIsProfileOpen(true)}
            title="Ver mi perfil y rol institucional"
          >
            <span>👤 Perfil</span>
          </button>

          <button
            type="button"
            className={styles.helpBtn}
            onClick={() => setIsProfileOpen(true)}
            title="Ayuda y preguntas frecuentes"
          >
            <span>❓ Ayuda</span>
          </button>

          <form action={onSignOut}>
            <button type="submit" className={styles.logoutBtn}>
              Cerrar Sesión
            </button>
          </form>
        </div>
      </div>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userName={userName}
        userEmail={userEmail}
        currentRole="SCHOOL_ADMIN"
        schoolName={schoolName}
      />

      <nav className={styles.navTabs}>
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.tabLink} ${isActive ? styles.tabLinkActive : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

