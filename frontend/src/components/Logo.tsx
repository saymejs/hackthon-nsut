"use client";

import React from "react";

export type LogoVariant =
  | "shield"
  | "default"
  | "agent-key"
  | "key"
  | "evm-guard"
  | "evm"
  | "http402"
  | "stream"
  | "telemetry"
  | "node"
  | "minimal"
  | "badge";

export type LogoFormat = "inline-svg" | "svg-file" | "png-file";

export interface LogoProps {
  className?: string;
  size?: number;
  variant?: LogoVariant;
  format?: LogoFormat;
  alt?: string;
}

const ALT_TEXT = "Agent SafePay Vault Logo";

// 1. Vault Shield (Primary Defensive Shield)
export function VaultShieldLogo({
  className = "w-7 h-7",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role="img"
      aria-label={ALT_TEXT}
    >
      <title>{ALT_TEXT} - Vault Shield</title>
      <defs>
        <linearGradient id="vsl_shieldGrad" x1="16" y1="16" x2="112" y2="112" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563eb" />
          <stop offset="0.5" stopColor="#1d4ed8" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="vsl_coreGlow" x1="64" y1="36" x2="64" y2="92" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
        <radialGradient id="vsl_specular" cx="40" cy="30" r="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="6" y="6" width="116" height="116" rx="28" fill="#e8ecf2" />
      <rect x="7" y="7" width="114" height="114" rx="27" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.8" />
      <rect x="8" y="8" width="112" height="112" rx="26" stroke="#c8d3e0" strokeWidth="1.5" />
      <path
        d="M64 22L98 34V60C98 83 83.5 101.5 64 108C44.5 101.5 30 83 30 60V34L64 22Z"
        fill="url(#vsl_shieldGrad)"
        stroke="#38bdf8"
        strokeWidth="2"
      />
      <path
        d="M64 22L98 34V60C98 83 83.5 101.5 64 108C44.5 101.5 30 83 30 60V34L64 22Z"
        fill="url(#vsl_specular)"
      />
      <path d="M64 36V50" stroke="#7dd3fc" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M48 56L64 50L80 56" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="48" cy="56" r="3" fill="#38bdf8" />
      <circle cx="80" cy="56" r="3" fill="#38bdf8" />
      <circle cx="64" cy="68" r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
      <circle cx="64" cy="68" r="8" fill="url(#vsl_coreGlow)" />
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

// 2. AI Agent Key (Restricted Autonomous Signer)
export function AiAgentKeyLogo({
  className = "w-7 h-7",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role="img"
      aria-label={ALT_TEXT}
    >
      <title>{ALT_TEXT} - AI Agent Key</title>
      <defs>
        <linearGradient id="aak_keyGrad" x1="20" y1="20" x2="108" y2="108" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b82f6" />
          <stop offset="0.6" stopColor="#1d4ed8" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="aak_amberLock" x1="40" y1="20" x2="88" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f59e0b" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <radialGradient id="aak_keyGlow" cx="64" cy="44" r="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" stopOpacity="0.9" />
          <stop offset="0.7" stopColor="#0284c7" stopOpacity="0.4" />
          <stop offset="1" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="6" y="6" width="116" height="116" rx="28" fill="#e8ecf2" />
      <rect x="7" y="7" width="114" height="114" rx="27" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.8" />
      <rect x="8" y="8" width="112" height="112" rx="26" stroke="#c8d3e0" strokeWidth="1.5" />
      <circle cx="64" cy="44" r="28" fill="url(#aak_keyGrad)" stroke="#38bdf8" strokeWidth="2" />
      <circle cx="64" cy="44" r="22" fill="#0b1329" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="64" cy="44" r="9" fill="url(#aak_keyGlow)" />
      <circle cx="64" cy="44" r="5" fill="#ffffff" />
      <path d="M64 26V35" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" />
      <path d="M48 38L56 42" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" />
      <path d="M80 38L72 42" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" />
      <circle cx="48" cy="38" r="2.5" fill="#38bdf8" />
      <circle cx="80" cy="38" r="2.5" fill="#38bdf8" />
      <circle cx="64" cy="26" r="2.5" fill="#38bdf8" />
      <path d="M38 34C34 40 34 48 38 54" stroke="url(#aak_amberLock)" strokeWidth="3" strokeLinecap="round" />
      <path d="M90 34C94 40 94 48 90 54" stroke="url(#aak_amberLock)" strokeWidth="3" strokeLinecap="round" />
      <path d="M60 70H68V104L64 108L60 104V70Z" fill="url(#aak_keyGrad)" stroke="#38bdf8" strokeWidth="1.5" />
      <path d="M64 70V104" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" />
      <path d="M68 80H78V86H68" fill="#1d4ed8" stroke="#38bdf8" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M68 92H75V98H68" fill="#1d4ed8" stroke="#38bdf8" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M60 86H53V92H60" fill="#1d4ed8" stroke="#38bdf8" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="64" cy="108" r="3" fill="#10b981" />
    </svg>
  );
}

// 3. EVM Contract Guard (Bytecode Invariant Diamond)
export function EvmContractGuardLogo({
  className = "w-7 h-7",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role="img"
      aria-label={ALT_TEXT}
    >
      <title>{ALT_TEXT} - EVM Contract Guard</title>
      <defs>
        <linearGradient id="ecg_ethTop" x1="64" y1="20" x2="96" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="0.5" stopColor="#2563eb" />
          <stop offset="1" stopColor="#1e1b4b" />
        </linearGradient>
        <linearGradient id="ecg_ethBottom" x1="64" y1="74" x2="90" y2="108" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1d4ed8" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="ecg_facetHighlight" x1="40" y1="30" x2="64" y2="65" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e0f2fe" stopOpacity="0.8" />
          <stop offset="1" stopColor="#38bdf8" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="116" height="116" rx="28" fill="#e8ecf2" />
      <rect x="7" y="7" width="114" height="114" rx="27" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.8" />
      <rect x="8" y="8" width="112" height="112" rx="26" stroke="#c8d3e0" strokeWidth="1.5" />
      <path d="M22 34V24H34" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
      <path d="M106 34V24H94" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
      <path d="M22 94V104H34" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
      <path d="M106 94V104H94" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
      <path d="M64 22L38 65L64 78V22Z" fill="url(#ecg_facetHighlight)" stroke="#38bdf8" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M64 22L90 65L64 78V22Z" fill="url(#ecg_ethTop)" stroke="#38bdf8" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M64 22V78" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <path d="M64 82L38 69L64 106V82Z" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M64 82L90 69L64 106V82Z" fill="url(#ecg_ethBottom)" stroke="#38bdf8" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="64" cy="64" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
      <path d="M28 64H34" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
      <path d="M94 64H100" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// 4. HTTP 402 Micropayment Stream
export function Http402StreamLogo({
  className = "w-7 h-7",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role="img"
      aria-label={ALT_TEXT}
    >
      <title>{ALT_TEXT} - HTTP 402 Stream</title>
      <defs>
        <linearGradient id="h4s_boltGrad" x1="70" y1="24" x2="48" y2="104" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="0.4" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#10b981" />
        </linearGradient>
        <radialGradient id="h4s_burst" cx="64" cy="64" r="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" stopOpacity="0.3" />
          <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="6" y="6" width="116" height="116" rx="28" fill="#e8ecf2" />
      <rect x="7" y="7" width="114" height="114" rx="27" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.8" />
      <rect x="8" y="8" width="112" height="112" rx="26" stroke="#c8d3e0" strokeWidth="1.5" />
      <circle cx="64" cy="64" r="36" fill="url(#h4s_burst)" />
      <path d="M26 64C26 43 43 26 64 26C78 26 90 33 97 44" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
      <path d="M102 64C102 85 85 102 64 102C50 102 38 95 31 84" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
      <circle cx="97" cy="44" r="4" fill="#00f0ff" />
      <circle cx="31" cy="84" r="4" fill="#10b981" />
      <circle cx="26" cy="64" r="3" fill="#38bdf8" />
      <circle cx="102" cy="64" r="3" fill="#10b981" />
      <path
        d="M72 20L42 62H66L56 108L90 56H66L72 20Z"
        fill="url(#h4s_boltGrad)"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M68 30L48 62H66L58 96L82 56H64L68 30Z" fill="#ffffff" opacity="0.6" />
      <rect x="44" y="104" width="40" height="14" rx="7" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
      <text x="64" y="114" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle" letterSpacing="1">
        402-LIVE
      </text>
    </svg>
  );
}

// 5. Telemetry Node (Sentinel Attestation Radar)
export function TelemetryNodeLogo({
  className = "w-7 h-7",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role="img"
      aria-label={ALT_TEXT}
    >
      <title>{ALT_TEXT} - Telemetry Node</title>
      <defs>
        <linearGradient id="tnl_radarSweep" x1="64" y1="64" x2="104" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10b981" stopOpacity="0.6" />
          <stop offset="0.5" stopColor="#0284c7" stopOpacity="0.2" />
          <stop offset="1" stopColor="#0284c7" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="tnl_beaconGlow" cx="64" cy="64" r="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10b981" />
          <stop offset="0.7" stopColor="#059669" />
          <stop offset="1" stopColor="#064e3b" />
        </radialGradient>
      </defs>
      <rect x="6" y="6" width="116" height="116" rx="28" fill="#e8ecf2" />
      <rect x="7" y="7" width="114" height="114" rx="27" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.8" />
      <rect x="8" y="8" width="112" height="112" rx="26" stroke="#c8d3e0" strokeWidth="1.5" />
      <circle cx="64" cy="64" r="44" fill="#0b1329" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="64" cy="64" r="32" stroke="#1e293b" strokeWidth="1" strokeDasharray="2 2" />
      <circle cx="64" cy="64" r="20" stroke="#1e293b" strokeWidth="1" />
      <path d="M20 64H108" stroke="#1e293b" strokeWidth="1" />
      <path d="M64 20V108" stroke="#1e293b" strokeWidth="1" />
      <path d="M64 64L104 34A44 44 0 0 0 64 20Z" fill="url(#tnl_radarSweep)" />
      <path d="M64 64L104 34" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="92" cy="48" r="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
      <circle cx="40" cy="80" r="3" fill="#10b981" />
      <circle cx="78" cy="88" r="3.5" fill="#f59e0b" />
      <circle cx="48" cy="42" r="2.5" fill="#38bdf8" />
      <path d="M64 64L92 48" stroke="#38bdf8" strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2" />
      <path d="M64 64L40 80" stroke="#10b981" strokeWidth="1" strokeLinecap="round" />
      <circle cx="64" cy="64" r="10" fill="url(#tnl_beaconGlow)" stroke="#ffffff" strokeWidth="1.5" />
      <circle cx="64" cy="64" r="4" fill="#ffffff" />
      <circle cx="64" cy="64" r="15" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="6 3" />
    </svg>
  );
}

// 6. Minimalist Monogram Mark
export function BrandMinimalLogo({
  className = "w-7 h-7",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role="img"
      aria-label={ALT_TEXT}
    >
      <title>{ALT_TEXT} - Minimal Badge</title>
      <defs>
        <linearGradient id="bml_minGrad" x1="16" y1="16" x2="112" y2="112" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563eb" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="116" height="116" rx="28" fill="#e8ecf2" />
      <rect x="7" y="7" width="114" height="114" rx="27" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.8" />
      <rect x="8" y="8" width="112" height="112" rx="26" stroke="#c8d3e0" strokeWidth="1.5" />
      <path d="M64 24L94 36V62C94 82 81 98 64 104C47 98 34 82 34 62V36L64 24Z" fill="url(#bml_minGrad)" />
      <path d="M64 36L78 62H70L64 50L58 62H50L64 36Z" fill="#ffffff" />
      <path
        d="M50 72C50 68.7 52.7 66 56 66H72C75.3 66 78 68.7 78 72C78 75.3 75.3 78 72 78H56C52.7 78 50 80.7 50 84C50 87.3 52.7 90 56 90H72C75.3 90 78 87.3 78 84"
        stroke="#ffffff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="64" cy="98" r="3.5" fill="#10b981" />
    </svg>
  );
}

/**
 * Master Unified Logo Component
 * - Supports 6 rich, distinct design varieties
 * - Supports Inline SVG (Zero network latency), SVG URLs (/logo/*.svg), and PNG URLs (/logo/*.png)
 * - Always preserves the exact alt text: "Agent SafePay Vault Logo"
 */
export default function Logo({
  className = "h-7 w-auto object-contain",
  size,
  variant = "shield",
  format = "inline-svg",
  alt = ALT_TEXT,
}: LogoProps) {
  const style = size ? { width: size, height: size } : undefined;

  // Resolve normalized variant name
  const normalizedVariant: "shield" | "agent-key" | "evm-guard" | "http402" | "telemetry" | "minimal" =
    variant === "agent-key" || variant === "key"
      ? "agent-key"
      : variant === "evm-guard" || variant === "evm"
      ? "evm-guard"
      : variant === "http402" || variant === "stream"
      ? "http402"
      : variant === "telemetry" || variant === "node"
      ? "telemetry"
      : variant === "minimal" || variant === "badge"
      ? "minimal"
      : "shield";

  // URL-based SVG asset
  if (format === "svg-file") {
    const filenameMap: Record<typeof normalizedVariant, string> = {
      shield: "agent-safepay-shield.svg",
      "agent-key": "ai-agent-key.svg",
      "evm-guard": "evm-contract-guard.svg",
      http402: "http402-payment-stream.svg",
      telemetry: "telemetry-node.svg",
      minimal: "brand-minimal.svg",
    };

    return (
      <img
        alt={alt}
        className={className}
        src={`/logo/${filenameMap[normalizedVariant]}`}
        style={style}
      />
    );
  }

  // URL-based PNG asset
  if (format === "png-file") {
    const filenameMap: Record<typeof normalizedVariant, string> = {
      shield: "agent-safepay-shield.png",
      "agent-key": "ai-agent-key.png",
      "evm-guard": "evm-contract-guard.png",
      http402: "http402-payment-stream.png",
      telemetry: "telemetry-node.png",
      minimal: "brand-minimal.png",
    };

    return (
      <img
        alt={alt}
        className={className}
        src={`/logo/${filenameMap[normalizedVariant]}`}
        style={style}
      />
    );
  }

  // Pure Zero-Dependency Inline SVG (default)
  switch (normalizedVariant) {
    case "agent-key":
      return <AiAgentKeyLogo className={className} style={style} />;
    case "evm-guard":
      return <EvmContractGuardLogo className={className} style={style} />;
    case "http402":
      return <Http402StreamLogo className={className} style={style} />;
    case "telemetry":
      return <TelemetryNodeLogo className={className} style={style} />;
    case "minimal":
      return <BrandMinimalLogo className={className} style={style} />;
    case "shield":
    default:
      return <VaultShieldLogo className={className} style={style} />;
  }
}
