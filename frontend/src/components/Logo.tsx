import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
  variant?: "default" | "vector" | "folder";
}

/**
 * Agent SafePay Vault Logo Component
 * Uses the exact alt name: "Agent SafePay Vault Logo"
 * Supports PNG asset from /logo.png, /logo/logo.png or high-res vector.
 */
export default function Logo({
  className = "h-7 w-auto object-contain",
  size,
  variant = "default",
}: LogoProps) {
  const style = size ? { width: size, height: size } : undefined;

  if (variant === "folder") {
    return (
      <img
        alt="Agent SafePay Vault Logo"
        className={className}
        src="/logo/logo.png"
        style={style}
      />
    );
  }

  if (variant === "vector") {
    return (
      <svg
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={style}
        role="img"
        aria-label="Agent SafePay Vault Logo"
      >
        <title>Agent SafePay Vault Logo</title>
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
          <radialGradient id="specular" cx="40" cy="30" r="50" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect x="6" y="6" width="116" height="116" rx="28" fill="#e8ecf2" />
        <rect x="7" y="7" width="114" height="114" rx="27" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.8" />
        <rect x="8" y="8" width="112" height="112" rx="26" stroke="#c8d3e0" strokeWidth="1.5" />

        <path
          d="M64 22L98 34V60C98 83 83.5 101.5 64 108C44.5 101.5 30 83 30 60V34L64 22Z"
          fill="url(#shieldGrad)"
          stroke="#38bdf8"
          strokeWidth="2"
        />
        <path
          d="M64 22L98 34V60C98 83 83.5 101.5 64 108C44.5 101.5 30 83 30 60V34L64 22Z"
          fill="url(#specular)"
        />

        <path d="M64 36V50" stroke="#7dd3fc" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M48 56L64 50L80 56" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="48" cy="56" r="3" fill="#38bdf8" />
        <circle cx="80" cy="56" r="3" fill="#38bdf8" />

        <circle cx="64" cy="68" r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
        <circle cx="64" cy="68" r="8" fill="url(#coreGlow)" />
        <path d="M64 74V84" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />

        <path
          d="M52 90C55.5 93 59.5 95 64 96C68.5 95 72.5 93 76 90"
          stroke="#10b981"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <img
      alt="Agent SafePay Vault Logo"
      className={className}
      src="/logo.png"
      style={style}
    />
  );
}
