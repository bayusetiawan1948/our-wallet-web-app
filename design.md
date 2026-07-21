# Design Specification & Architecture — Our Wallets

Document describing the UI/UX design system, architecture, color tokens, component structure, and tech stack for the **Our Wallets** project.

---

## 1. Overview & Vision

**Our Wallets** is a modern, high-precision financial management application designed for tracking personal and shared finances, cash flows, wallet accounts, investments, and debts & receivables.

### Core UI/UX Philosophy
- **Monospaced Technical Precision**: Uses monospaced typography (`JetBrains Mono` & `Geist Mono`) to give financial numbers and table data clear, aligned, and professional visual clarity.
- **Adaptive Dark & Light Themes**: Powered by `next-themes` and high-contrast OKLCH color palettes tailored for day and night usage.
- **Radix-Mira Aesthetics**: Built upon shadcn/ui with the `radix-mira` design style and `mist` color preset.
- **Fluid & Accessible Layout**: Responsive sidebar shell with smart breadcrumb navigation, interactive feedback, and accessible controls.

---

## 2. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/) | Core runtime, component architecture, and fast HMR bundling |
| **Language** | [TypeScript 6](https://www.typescriptlang.org/) | Type-safe financial data models and application logic |
| **Styling Engine** | [Tailwind CSS v4](https://tailwindcss.com/) | Atomic CSS, CSS variable themes, and OKLCH color space |
| **Animations** | `tw-animate-css` | Smooth state transitions and UI micro-interactions |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) (`radix-mira` / `@base-ui/react`) | Accessible primitive UI components |
| **Icon Library** | [Phosphor Icons](https://phosphoricons.com/) (`@phosphor-icons/react`) | Consistent iconography throughout menus and metrics |
| **Routing** | [React Router v7](https://reactrouter.com/) | Single-page application routing & dynamic navigation matching |
| **State & Data** | [TanStack Query v5](https://tanstack.com/query) + [Axios](https://axios-http.com/) | Server-state caching, synchronization, and HTTP requests |
| **Data Visualization**| [Recharts v3](https://recharts.org/) | Financial charts, cash flow analytics, and performance graphs |
| **Notifications** | [Sonner](https://sonner.emilkowal.si/) | Toast notification system |

---

## 3. Design System & Style Tokens

### 3.1 Typography System & Semantic Tokens

The typography engine is built on a **Tailwind CSS v4 CSS-First Architecture** defined in [src/styles/typography.css](file:///d:/code/Typescript/shadcn-preset/our-wallets/src/styles/typography.css) and imported into [src/index.css](file:///d:/code/Typescript/shadcn-preset/our-wallets/src/index.css).

#### Core Fonts Foundation
```css
@theme inline {
    --font-mono: 'JetBrains Mono Variable', monospace;
    --font-heading: 'Geist Mono Variable', monospace;
}
```
- **Headings, Titles & Display Metrics**: `Geist Mono` (`--font-heading`) — Technical monospaced display font for page titles, card headers, and grand totals.
- **Body, Labels, Controls & Data**: `JetBrains Mono` (`--font-mono`) — Readable monospaced font ensuring column alignment for tabular numbers, transaction descriptions, and input controls.

#### Atomic Token Scale (`@theme inline`)

| Token | Size | Rem | Line Height | Tracking | Allowed Weights |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `xs` | 12px | 0.75rem | 1.4 (16.8px) | `+0.015em` | Regular (400), Medium (500) |
| `sm` | 14px | 0.875rem | 1.45 (20.3px) | `0em` | Regular (400), Medium (500), Semibold (600) |
| `base` | 16px | 1rem | 1.5 (24px) | `-0.005em` | Regular (400), Medium (500), Semibold (600) |
| `lg` | 18px | 1.125rem | 1.55 (27.9px) | `-0.01em` | Regular (400), Semibold (600) |
| `xl` | 20px | 1.25rem | 1.35 (27px) | `-0.015em` | Semibold (600) |
| `2xl` | 24px | 1.5rem | 1.3 (31.2px) | `-0.02em` | Semibold (600), Bold (700) |
| `3xl` | 30px | 1.875rem | 1.25 (37.5px) | `-0.025em` | Semibold (600), Bold (700) |
| `4xl` | 36px | 2.25rem | 1.2 (43.2px) | `-0.03em` | Bold (700) |

#### Semantic Typography Utilities (`@utility`)

Components must consume semantic utilities directly instead of hardcoding atomic classes (`text-xl font-semibold`).

| Category | Utility Class | Font Family | Size | Weight | Line Height | Tracking | Primary Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | `.display-lg` | Geist Mono | `clamp(36px, 48px)` | Bold (700) | 1.15 | `-0.035em` | Hero account totals, primary financial showcases |
| | `.display-md` | Geist Mono | `clamp(30px, 40px)` | Bold (700) | 1.2 | `-0.03em` | Main account balance summary figures |
| | `.display-sm` | Geist Mono | `clamp(24px, 32px)` | Semibold (600) | 1.25 | `-0.025em` | Wallet card balance totals, key metric values |
| **Heading** | `.heading-xl` | Geist Mono | `clamp(24px, 30px)` | Semibold (600) | 1.25 | `-0.025em` | Page H1 titles (e.g. "Cashflow Overview") |
| | `.heading-lg` | Geist Mono | `clamp(20px, 24px)` | Semibold (600) | 1.3 | `-0.02em` | Section H2 headers, dialog headers, drawers |
| | `.heading-md` | Geist Mono | 20px | Semibold (600) | 1.35 | `-0.015em` | Sub-section H3 headers, card section titles |
| | `.heading-sm` | Geist Mono | 18px | Semibold (600) | 1.4 | `-0.01em` | Group headers, modal subheaders |
| **Title** | `.title-lg` | Geist Mono | 18px | Semibold (600) | 1.4 | `-0.01em` | Table section block titles, widget headers |
| | `.title-md` | Geist Mono | 16px | Semibold (600) | 1.4 | `-0.005em` | Form section titles, list group titles |
| | `.title-sm` | Geist Mono | 14px | Semibold (600) | 1.45 | `0em` | Dropdown headers, compact card titles |
| **Body** | `.body-lg` | JetBrains Mono | 18px | Regular (400) | 1.55 | `0em` | Lead paragraphs, featured descriptions |
| | `.body-md` | JetBrains Mono | 16px | Regular (400) | 1.5 | `0em` | Standard body copy, modal descriptions |
| | `.body-sm` | JetBrains Mono | 14px | Regular (400) | 1.45 | `0em` | Compact body copy, table cell content |
| **Label** | `.label-lg` | JetBrains Mono | 14px | Medium (500) | 1.4 | `+0.01em` | Form field labels, primary button text |
| | `.label-md` | JetBrains Mono | 12px | Medium (500) | 1.4 | `+0.015em` | Table column headers, secondary badges |
| | `.label-sm` | JetBrains Mono | 12px | Medium (500) | 1.35 | `+0.02em` | Uppercase category tags, status badges |
| **Caption** | `.caption-md` | JetBrains Mono | 14px | Regular (400) | 1.4 | `0em` | Input field helper text, popover footnotes |
| | `.caption-sm` | JetBrains Mono | 12px | Regular (400) | 1.4 | `+0.01em` | Timestamps, transaction meta, disclaimers |
| **Code** | `.code-md` | JetBrains Mono | 14px | Regular (400) | 1.45 | `-0.01em` | Technical parameters, formula inputs |
| | `.code-sm` | JetBrains Mono | 12px | Regular (400) | 1.4 | `0em` | Inline code chips, transaction IDs, hashes |

#### Financial Numeric Typography (`font-variant-numeric`)

Since **Our Wallets** handles precision numbers, numeric formatting is built-in:

- `.num-tabular`: `font-variant-numeric: tabular-nums;` (Equal-width numbers for vertical alignment in financial tables).
- `.num-lining`: `font-variant-numeric: lining-nums;` (Equal-height numbers sitting flush on the baseline).
- `.num-financial`: `font-variant-numeric: tabular-nums lining-nums;` (**Recommended for Finance**: Combines tabular spacing with lining numbers).
- `.num-proportional`: `font-variant-numeric: proportional-nums;` (Variable-width numbers for natural reading body text).

#### Accessibility & Design System Rules
1. **WCAG Compliance**: No font sizes below 12px (`xs`). Line heights strictly range from 1.15 (display) to 1.55 (body) to maintain readable vertical rhythm.
2. **Theme Agnostic**: Utility classes control font geometry only, enabling seamless contrast switching between Light and Dark OKLCH themes.
3. **No Hardcoded Atomic Classes**: UI components must consume semantic utility classes (e.g. `class="display-md num-financial"`) to maintain system scalability.

### 3.2 Color Tokens (OKLCH Color Space)
Colors use OKLCH values for visually uniform lightness and chroma across themes.

#### Light Mode Palette
- **Background**: `oklch(1 0 0)` (Pure White)
- **Foreground**: `oklch(0.148 0.004 228.8)` (Deep Charcoal)
- **Primary**: `oklch(0.508 0.118 165.612)` (Emerald / Mint Teal)
- **Primary Foreground**: `oklch(0.979 0.021 166.113)`
- **Muted**: `oklch(0.963 0.002 197.1)`
- **Muted Foreground**: `oklch(0.56 0.021 213.5)`
- **Card / Popover**: `oklch(1 0 0)`
- **Destructive**: `oklch(0.577 0.245 27.325)` (Coral Red)
- **Border / Input**: `oklch(0.925 0.005 214.3)`
- **Sidebar**: `oklch(0.987 0.002 197.1)`

#### Dark Mode Palette (`.dark`)
- **Background**: `oklch(0.148 0.004 228.8)` (Slate Dark)
- **Foreground**: `oklch(0.987 0.002 197.1)` (Off-white)
- **Primary**: `oklch(0.432 0.095 166.913)` (Teal Green)
- **Card / Popover**: `oklch(0.218 0.008 223.9)` (Elevated Dark Surface)
- **Muted**: `oklch(0.275 0.011 216.9)`
- **Border / Input**: `oklch(1 0 0 / 10%)`
- **Sidebar**: `oklch(0.218 0.008 223.9)`

#### Chart Colors (`--chart-1` to `--chart-5`)
Sequential emerald/teal shades mapped to charts:
1. `oklch(0.845 0.143 164.978)` — Bright Teal
2. `oklch(0.696 0.17 162.48)` — Vibrant Mint
3. `oklch(0.596 0.145 163.225)` — Medium Emerald
4. `oklch(0.508 0.118 165.612)` — Deep Emerald
5. `oklch(0.432 0.095 166.913)` — Dark Forest Teal

### 3.3 Border Radius System
Base radius `--radius: 0.45rem`.
- `radius-sm`: `0.27rem` (calc(0.45 * 0.6))
- `radius-md`: `0.36rem` (calc(0.45 * 0.8))
- `radius-lg`: `0.45rem` (Base)
- `radius-xl`: `0.63rem` (calc(0.45 * 1.4))
- `radius-2xl`: `0.81rem` (calc(0.45 * 1.8))
- `radius-3xl`: `0.99rem` (calc(0.45 * 2.2))
- `radius-4xl`: `1.17rem` (calc(0.45 * 2.6))

---

## 4. Application Architecture & Layout Structure

```
MainLayout (SidebarProvider)
 ├── AppSidebar (Sidebar Component)
 │    ├── SidebarHeader (Brand Logo & Workspace Selector)
 │    ├── NavMain (Dynamic Menu from consts/menu.ts)
 │    └── NavUser (User profile & action dropdown)
 └── SidebarInset (Main View Container)
      ├── AppHeader (Header Container)
      │    ├── SidebarTrigger (Collapse / Expand toggle)
      │    ├── Separator
      │    └── Breadcrumb (Auto-generated with dropdown ellipsis for overflow)
      └── Outlet (Page content rendering area)
```

### Key Layout Components
1. **[MainLayout](file:///d:/code/Typescript/shadcn-preset/our-wallets/src/components/layouts/main-layout.tsx)**: Shell wrapper integrating `SidebarProvider`, `AppSidebar`, `AppHeader`, and React Router's `<Outlet />`.
2. **[AppSidebar](file:///d:/code/Typescript/shadcn-preset/our-wallets/src/components/layouts/app-sidebar.tsx)**: Collapsible navigation drawer containing main navigation items and user account options.
3. **[NavMain](file:///d:/code/Typescript/shadcn-preset/our-wallets/src/components/layouts/nav-main.tsx)**: Dynamic navigation list with active state highlighting powered by React Router `useLocation`.
4. **[AppHeader](file:///d:/code/Typescript/shadcn-preset/our-wallets/src/components/layouts/app-header.tsx)**: Top bar with breadcrumb tracking, dynamic path parsing ([useBreadcrumbs](file:///d:/code/Typescript/shadcn-preset/our-wallets/src/hooks/use-breadcrumbs.ts)), and collapsible ellipsis dropdown for overflow routes.

---

## 5. Navigation & Route Hierarchy

Defined in [src/consts/routes.ts](file:///d:/code/Typescript/shadcn-preset/our-wallets/src/consts/routes.ts) and [src/consts/menu.ts](file:///d:/code/Typescript/shadcn-preset/our-wallets/src/consts/menu.ts):

| Menu Title | Icon | Route Path | Component Page | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard** | `GaugeIcon` | `/` (`/dashboard`) | `DashboardPage` | Overview metrics, balance summary, quick statistics |
| **Cashflow** | `ArrowsDownUpIcon` | `/cashflow` | `CashflowPage` | Income & expense breakdown, transaction history |
| **Wallet** | `WalletIcon` | `/wallet` | `WalletPage` | Bank accounts, e-wallets, cash balances management |
| **Investment** | `ChartLineUpIcon` | `/investment` | `InvestmentPage` | Stocks, crypto, mutual funds, asset performance |
| **Debts & Receivables** | `HandshakeIcon` | `/debts-receivables` | `DebtsReceivablePage` | Debt tracking, loan payables, and receivable records |

---

## 6. UI Component Inventory

Located in [src/components/ui](file:///d:/code/Typescript/shadcn-preset/our-wallets/src/components/ui):

### Core shadcn/ui Primitives
- **Inputs & Controls**: `button`, `input`, `textarea`, `select`, `native-select`, `checkbox`, `radio-group`, `switch`, `slider`, `combobox`, `input-otp`, `input-group`, `button-group`
- **Data Display & Feedback**: `card`, `table`, `badge`, `avatar`, `alert`, `alert-dialog`, `toast` (`sonner`), `progress`, `spinner`, `skeleton`, `empty`, `kbd`, `marker`
- **Navigation & Overlays**: `sidebar`, `breadcrumb`, `dropdown-menu`, `context-menu`, `menubar`, `navigation-menu`, `dialog`, `drawer`, `sheet`, `popover`, `hover-card`, `tooltip`, `pagination`
- **Layout & Structure**: `accordion`, `collapsible`, `resizable`, `scroll-area`, `separator`, `tabs`, `aspect-ratio`, `carousel`, `direction`
- **Charts & Messaging**: `chart`, `bubble`, `message`, `message-scroller`, `attachment`, `item`, `field`

---

## 7. Helper Utilities & Formatters

Located in [src/libs](file:///d:/code/Typescript/shadcn-preset/our-wallets/src/libs):

1. **Number Formatting ([libs/number.ts](file:///d:/code/Typescript/shadcn-preset/our-wallets/src/libs/number.ts))**:
   - `formatShortNumber`: Abbreviates financial numbers into Indonesian short format (e.g. `15.000.000` $\rightarrow$ `15Jt`, `1.500.000` $\rightarrow$ `1,5Jt`, `500.000` $\rightarrow$ `500Rb`).
   - Currency and percentage formatting utilities.
2. **Date Utility ([libs/date.ts](file:///d:/code/Typescript/shadcn-preset/our-wallets/src/libs/date.ts))**: Date parsing and localized formatting using `date-fns`.
3. **String Utility ([libs/string.ts](file:///d:/code/Typescript/shadcn-preset/our-wallets/src/libs/string.ts))**: Text manipulation, initials extraction, and slug generation.
4. **Style Utility ([libs/utils.ts](file:///d:/code/Typescript/shadcn-preset/our-wallets/src/libs/utils.ts))**: Standard `cn(...)` utility combining `clsx` and `tailwind-merge`.
5. **Error Utility ([libs/error.ts](file:///d:/code/Typescript/shadcn-preset/our-wallets/src/libs/error.ts))**: Centralized error parser for API responses.

---

## 8. Development & Build Commands

```bash
# Run local development server (Vite)
npm run dev

# Typecheck and build production bundle
npm run build

# Run ESLint linter
npm run lint

# Format code with Prettier and Tailwind plugin
npm run format

# Preview production build locally
npm run preview
```
