import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * Primary Brand Logo: Agent SafePay
 * Stylized tactile neumorphic vault shield with electric blue core & circuit traces.
 */
export function AgentSafePayLogo({ className = "h-7 w-auto", size }: LogoProps) {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <defs>
        <linearGradient id="shieldGrad" x1="16" y1="16" x2="112" y2="112" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563eb" />
          <stop offset="0.5" stopColor="#1d4ed8" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="coreGlow" x1="64" y1="36" x2="64" y2="92" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
        <filter id="glow" x="20" y="20" width="88" height="88" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <radialGradient id="specular" cx="40" cy="30" r="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Rounded Squircle Container with tactile rim */}
      <rect x="6" y="6" width="116" height="116" rx="28" fill="#e8ecf2" />
      <rect x="7" y="7" width="114" height="114" rx="27" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.8" />
      <rect x="8" y="8" width="112" height="112" rx="26" stroke="#c8d3e0" strokeWidth="1.5" />

      {/* Vault Shield Base */}
      <path
        d="M64 22L98 34V60C98 83 83.5 101.5 64 108C44.5 101.5 30 83 30 60V34L64 22Z"
        fill="url(#shieldGrad)"
        stroke="#38bdf8"
        strokeWidth="2"
      />

      {/* Shield Specular Sheen */}
      <path
        d="M64 22L98 34V60C98 83 83.5 101.5 64 108C44.5 101.5 30 83 30 60V34L64 22Z"
        fill="url(#specular)"
      />

      {/* Circuit Nodes & Payment Lines */}
      <path d="M64 36V50" stroke="#7dd3fc" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M48 56L64 50L80 56" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="48" cy="56" r="3" fill="#38bdf8" />
      <circle cx="80" cy="56" r="3" fill="#38bdf8" />

      {/* Central Autonomous Core / Keyhole */}
      <circle cx="64" cy="68" r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" filter="url(#glow)" />
      <circle cx="64" cy="68" r="8" fill="url(#coreGlow)" />
      <path d="M64 74V84" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />

      {/* Verification Check / Invariant Ring */}
      <path
        d="M52 90C55.5 93 59.5 95 64 96C68.5 95 72.5 93 76 90"
        stroke="#10b981"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Ethereum Diamond Emblem
 */
export function EthereumLogo({ className = "h-5 w-auto", size }: LogoProps) {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg
      viewBox="0 0 256 417"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid"
      className={className}
      style={style}
    >
      <path fill="#2563eb" d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z" />
      <path fill="#3b82f6" d="M127.962 0L0 212.32l127.962 75.639V0z" />
      <path fill="#1d4ed8" d="M127.961 312.187l-1.575 1.92v98.199l1.575 4.601 128.038-180.32z" />
      <path fill="#2563eb" d="M127.962 416.907v-104.72L0 236.586z" />
      <path fill="#60a5fa" d="M127.961 287.958l127.96-75.637-127.96-58.162z" />
      <path fill="#93c5fd" d="M0 212.321l127.96 75.638V154.159z" />
    </svg>
  );
}

/**
 * Vault Guard Shield Logo (Security Invariant)
 */
export function VaultGuardLogo({ className = "h-6 w-auto", size }: LogoProps) {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <path
        d="M12 2L4 5V11.09C4 16.14 7.41 20.85 12 22C16.59 20.85 20 16.14 20 11.09V5L12 2Z"
        fill="#2563eb"
        fillOpacity="0.15"
        stroke="#2563eb"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 12L11 14L15 10"
        stroke="#10b981"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * HTTP 402 Machine Payments Badge Logo
 */
export function Http402BadgeLogo({ className = "h-6 w-auto", size }: LogoProps) {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg
      viewBox="0 0 120 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <rect width="120" height="32" rx="16" fill="#1e293b" />
      <circle cx="16" cy="16" r="6" fill="#38bdf8" />
      <text x="30" y="20" fill="#f8fafc" fontFamily="monospace" fontSize="12" fontWeight="bold">
        HTTP 402
      </text>
      <circle cx="106" cy="16" r="3" fill="#10b981" />
    </svg>
  );
}

/**
 * Autonomous AI Agent Node Emblem
 */
export function AgentNodeLogo({ className = "h-6 w-auto", size }: LogoProps) {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <rect x="3" y="3" width="18" height="18" rx="6" stroke="#2563eb" strokeWidth="2" />
      <circle cx="8" cy="9" r="1.5" fill="#38bdf8" />
      <circle cx="16" cy="9" r="1.5" fill="#38bdf8" />
      <path d="M8 15H16" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 3V1M12 23V21M3 12H1M23 12H21" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default AgentSafePayLogo;
