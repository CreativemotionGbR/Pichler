---
name: Compliance Core
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#434655'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#525657'
  on-tertiary: '#ffffff'
  tertiary-container: '#6b6e70'
  on-tertiary-container: '#eff1f3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  h1:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  h1-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: '0'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
  label-bold:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: '0'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

This design system is engineered for high-stakes regulatory environments, specifically GDPR/DSGVO compliance. The brand personality is rooted in **Precision, Authority, and Clarity**. It aims to reduce the cognitive load of legal complexity through a highly structured, "Corporate Modern" aesthetic that feels both systematic and dependable.

The target audience consists of Data Protection Officers (DPOs), legal counsel, and IT administrators who require a tool that prioritizes information density and logical hierarchy over decorative flair. The emotional response should be one of "controlled confidence"—the user should feel that the data is secure and the processes are fully compliant.

## Colors

The palette is strictly functional, utilizing a "Cool Slate" foundation to maintain a professional, calm atmosphere. 

- **Primary Blue (#2563EB):** Reserved exclusively for primary actions, active states, and focus indicators.
- **Surface Tiers:** White (#FFFFFF) is used for the main content canvas. #F8FAFC is used for page backgrounds to provide contrast against white cards. #F1F5F9 is used for sidebars and header regions.
- **Impact Palette:** A semantic traffic-light system is used to communicate risk levels (Low, Medium, High). These should be used for status badges, progress bars, and critical alerts.
- **Typography Colors:** Use Navy (#1E293B) for all headings to ensure maximum contrast. Use Slate-Gray (#475569) for body text to reduce eye strain during long reading sessions.

## Typography

This design system utilizes **Inter** for its exceptional legibility in data-heavy interfaces. The typographic scale is designed for hierarchical clarity, ensuring that legal documents and impact assessments are easily scannable.

- **German Language Support:** Ensure all containers allow for "German length" (approx. 30% longer than English strings) to prevent text clipping.
- **Hierarchy:** H1 and H2 are always set in the darkest Navy (#1E293B). 
- **Labels:** Small labels and captions use a semi-bold weight to remain legible at reduced scales. 
- **Line Height:** Generous line heights (1.5x) are maintained for body text to facilitate the reading of long legal clauses.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model. The main content area is capped at 1280px to maintain line-length readability, while the background surfaces extend to fill the screen.

- **Grid:** Use a 12-column grid for dashboard layouts and document views. 
- **Rhythm:** Spacing is strictly based on an 8px baseline. 
    - **16px (md):** Standard padding for buttons, small cards, and list items.
    - **24px (lg):** Standard gutter between columns and internal card padding.
    - **32px (xl):** Vertical spacing between major sections and page headers.
- **Responsive:** On mobile devices, margins reduce to 16px and the grid collapses to a single column. Tablet layouts use a 16px gutter.

## Elevation & Depth

This design system uses a **Tonal Layering** approach combined with subtle ambient shadows. Depth is used to signify interactivity and content grouping rather than realistic physical height.

- **Level 0 (Floor):** #F8FAFC. The base layer for the entire application.
- **Level 1 (Cards/Content):** White (#FFFFFF) surfaces with a subtle border (#E2E8F0) and a soft shadow `0 1px 3px rgba(0,0,0,0.1)`. This is the primary surface for data entry and reading.
- **Level 2 (Overlays/Modals):** White surfaces with a more pronounced shadow `0 10px 15px -3px rgba(0,0,0,0.1)` to pull the focus away from the background.
- **Interaction:** On hover, interactive cards should slightly deepen their shadow to `0 4px 6px -1px rgba(0,0,0,0.1)` to provide tactile feedback.

## Shapes

The shape language is "Soft Professional." A consistent **8px (0.5rem)** radius is used for standard components (buttons, inputs, smaller containers). 

- **Cards:** Use a larger **12px** radius to create a distinct container identity for primary content blocks.
- **Status Pills:** Use a fully rounded (pill) shape to differentiate them from interactive buttons.
- **Consistency:** Never mix sharp corners with rounded corners in the same view. All interactive elements must share the same corner logic.

## Components

### Buttons
- **Primary:** Solid #2563EB with White text. Used for "Speichern" or "Änderung übernehmen."
- **Secondary:** Transparent with #2563EB border and text. Used for "Abbrechen" or "Entwurf speichern."
- **Ghost:** No border, Navy text. Used for utility actions in lists.

### Impact Badges (Status)
- Small, pill-shaped indicators with a light background tint and dark text of the same hue (e.g., High Impact = Red 50 background with Red 600 text). Labels: *Niedrig, Mittel, Hoch*.

### Input Fields
- White background, 1px border (#CBD5E1), 8px radius.
- **Focus State:** 2px solid #2563EB border with a subtle blue outer glow.
- **Labels:** Always positioned above the input in `label-bold` style.

### Cards
- White background, 12px radius, #E2E8F0 border.
- **Header:** Optional light gray header (#F8FAFC) for grouping related document metadata.

### Lists & Tables
- **Table Header:** #F1F5F9 background, `label-bold` text in Navy.
- **Rows:** 1px bottom border (#F1F5F9). Alternate row striping is not used; use hover highlights instead.

### Additional Components
- **Compliance Tracker:** A vertical stepper showing the progress of a DSGVO audit.
- **Risk Matrix:** A color-coded grid component visualizing the frequency and severity of data processing risks.
