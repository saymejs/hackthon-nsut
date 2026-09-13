# Agent SafePay — Brand Logos & Assets

This file contains all project logos and assets for **Agent SafePay (W3A-1)**, with their exact alt text, local paths, and component usage.

---

## 1. Logo Showcase

| Asset Preview | File Name | Local Path | Exact Alt Text | Dimensions |
| :---: | :--- | :--- | :--- | :---: |
| <img alt="Agent SafePay Vault Logo" src="./frontend/public/logo.png" width="80" height="80" /> | **Primary Logo (PNG)** | `frontend/public/logo.png` | `Agent SafePay Vault Logo` | 128 × 128 |
| <img alt="Agent SafePay Vault Logo" src="./frontend/public/logo/agent-safepay-logo.png" width="80" height="80" /> | **Vault Shield (PNG)** | `frontend/public/logo/agent-safepay-logo.png` | `Agent SafePay Vault Logo` | 128 × 128 |
| <img alt="Agent SafePay Vault Logo" src="./frontend/public/logo/vault-logo.png" width="80" height="80" /> | **Vault Logo (PNG)** | `frontend/public/logo/vault-logo.png` | `Agent SafePay Vault Logo` | 128 × 128 |
| <img alt="Agent SafePay Vault Logo" src="./frontend/public/logo.svg" width="80" height="80" /> | **Scalable Vector (SVG)** | `frontend/public/logo.svg` | `Agent SafePay Vault Logo` | Vector |
| <img alt="Agent SafePay Vault Logo" src="./assets/logos/logo.png" width="80" height="80" /> | **Mirror Asset (PNG)** | `assets/logos/logo.png` | `Agent SafePay Vault Logo` | 128 × 128 |

---

## 2. HTML Embedding

All image elements preserve the exact same `alt` name used throughout the project:

```html
<!-- Primary Logo from Public Folder -->
<img 
  alt="Agent SafePay Vault Logo" 
  class="h-7 w-auto object-contain" 
  src="/logo.png" 
/>

<!-- From the dedicated /logo folder -->
<img 
  alt="Agent SafePay Vault Logo" 
  class="h-7 w-auto object-contain" 
  src="/logo/logo.png" 
/>

<!-- Vector SVG format -->
<img 
  alt="Agent SafePay Vault Logo" 
  class="h-7 w-auto object-contain" 
  src="/logo.svg" 
/>
```

---

## 3. React / Next.js Component Usage

Import the pre-wired logo component directly from `@/components/Logo`:

```tsx
import Logo from "@/components/Logo";

export default function Header() {
  return (
    <div className="flex items-center gap-3">
      {/* Renders <img alt="Agent SafePay Vault Logo" src="/logo.png" /> */}
      <Logo className="h-7 w-auto object-contain" />
      
      {/* Or use the vector version */}
      <Logo variant="vector" className="h-7 w-auto" />
    </div>
  );
}
```

Or import individual SVG icons from `@/components/Logos`:

```tsx
import { 
  AgentSafePayLogo, 
  EthereumLogo, 
  VaultGuardLogo, 
  Http402BadgeLogo, 
  AgentNodeLogo 
} from "@/components/Logos";
```

---

## 4. Color Tokens & Brand Specification

* **Canvas Tone:** `#e8ecf2` / `#eef1f5` (Tactile Neumorphic)
* **Primary Cobalt:** `#2563eb` (Action Blue)
* **Electric Cyan:** `#38bdf8` / `#00F0FF` (Glow Accent)
* **Emerald Green:** `#10b981` (On-Chain Settlement & Invariant Hold)
* **Revert Crimson:** `#ef4444` / `#ba1a1a` (`BUDGET_EXCEEDED` Circuit Breaker)
