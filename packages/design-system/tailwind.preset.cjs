/**
 * Focus Tools Design System - Tailwind Preset
 *
 * Aligned with EHR design tokens structure.
 * Pattern: bg-bg-{category}-{level}, text-fg-{category}-{level}
 *
 * Use this preset in your tailwind.config.js:
 *
 * module.exports = {
 *   presets: [require('@focus-tools/design-system/tailwind.preset')],
 *   // ... your config
 * };
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ========================================
        // Background Colors (bg-bg-*)
        // ========================================
        bg: {
          neutral: {
            base: 'var(--color-bg-neutral-base)',
            min: 'var(--color-bg-neutral-min)',
            subtle: 'var(--color-bg-neutral-subtle)',
            'subtle-hover': 'var(--color-bg-neutral-subtle-hover)',
            low: 'var(--color-bg-neutral-low)',
            'low-hover': 'var(--color-bg-neutral-low-hover)',
            'low-accented': 'var(--color-bg-neutral-low-accented)',
            medium: 'var(--color-bg-neutral-medium)',
            inverse: 'var(--color-bg-neutral-inverse)',
            'inverse-low': 'var(--color-bg-neutral-inverse-low)',
          },
          transparent: {
            min: 'var(--color-bg-transparent-min)',
            subtle: 'var(--color-bg-transparent-subtle)',
            'subtle-accented': 'var(--color-bg-transparent-subtle-accented)',
            low: 'var(--color-bg-transparent-low)',
            'low-accented': 'var(--color-bg-transparent-low-accented)',
            medium: 'var(--color-bg-transparent-medium)',
            high: 'var(--color-bg-transparent-high)',
            'inverse-min': 'var(--color-bg-transparent-inverse-min)',
            'inverse-subtle': 'var(--color-bg-transparent-inverse-subtle)',
            'inverse-low': 'var(--color-bg-transparent-inverse-low)',
            'inverse-low-accented': 'var(--color-bg-transparent-inverse-low-accented)',
            'inverse-medium': 'var(--color-bg-transparent-inverse-medium)',
            'inverse-high': 'var(--color-bg-transparent-inverse-high)',
            // Legacy
            neutral: 'var(--color-bg-transparent-neutral)',
            accent: 'var(--color-bg-transparent-accent)',
          },
          input: {
            subtle: 'var(--color-bg-input-subtle)',
            'subtle-accented': 'var(--color-bg-input-subtle-accented)',
            low: 'var(--color-bg-input-low)',
            'low-accented': 'var(--color-bg-input-low-accented)',
            medium: 'var(--color-bg-input-medium)',
            high: 'var(--color-bg-input-high)',
            'high-accented': 'var(--color-bg-input-high-accented)',
            // Legacy
            DEFAULT: 'var(--color-bg-input-default)',
            focus: 'var(--color-bg-input-focus)',
            disabled: 'var(--color-bg-input-disabled)',
          },
          positive: {
            subtle: 'var(--color-bg-positive-subtle)',
            'subtle-hover': 'var(--color-bg-positive-subtle-hover)',
            low: 'var(--color-bg-positive-low)',
            'low-accented': 'var(--color-bg-positive-low-accented)',
            medium: 'var(--color-bg-positive-medium)',
            strong: 'var(--color-bg-positive-strong)',
            high: 'var(--color-bg-positive-high)',
            'high-hover': 'var(--color-bg-positive-high-hover)',
            'high-accented': 'var(--color-bg-positive-high-accented)',
            // Legacy
            DEFAULT: 'var(--color-bg-positive-default)',
            bold: 'var(--color-bg-positive-bold)',
          },
          attention: {
            subtle: 'var(--color-bg-attention-subtle)',
            'subtle-hover': 'var(--color-bg-attention-subtle-hover)',
            low: 'var(--color-bg-attention-low)',
            'low-accented': 'var(--color-bg-attention-low-accented)',
            medium: 'var(--color-bg-attention-medium)',
            high: 'var(--color-bg-attention-high)',
            'high-accented': 'var(--color-bg-attention-high-accented)',
            // Legacy
            DEFAULT: 'var(--color-bg-attention-default)',
            bold: 'var(--color-bg-attention-bold)',
          },
          alert: {
            subtle: 'var(--color-bg-alert-subtle)',
            'subtle-hover': 'var(--color-bg-alert-subtle-hover)',
            low: 'var(--color-bg-alert-low)',
            'low-accented': 'var(--color-bg-alert-low-accented)',
            medium: 'var(--color-bg-alert-medium)',
            high: 'var(--color-bg-alert-high)',
            'high-accented': 'var(--color-bg-alert-high-accented)',
            // Legacy
            DEFAULT: 'var(--color-bg-alert-default)',
            bold: 'var(--color-bg-alert-bold)',
          },
          information: {
            subtle: 'var(--color-bg-information-subtle)',
            low: 'var(--color-bg-information-low)',
            'low-accented': 'var(--color-bg-information-low-accented)',
            medium: 'var(--color-bg-information-medium)',
            high: 'var(--color-bg-information-high)',
            'high-accented': 'var(--color-bg-information-high-accented)',
          },
          accent: {
            subtle: 'var(--color-bg-accent-subtle)',
            'subtle-hover': 'var(--color-bg-accent-subtle-hover)',
            low: 'var(--color-bg-accent-low)',
            'low-accented': 'var(--color-bg-accent-low-accented)',
            medium: 'var(--color-bg-accent-medium)',
            high: 'var(--color-bg-accent-high)',
            'high-hover': 'var(--color-bg-accent-high-hover)',
            'high-accented': 'var(--color-bg-accent-high-accented)',
            // Legacy
            DEFAULT: 'var(--color-bg-accent-default)',
            bold: 'var(--color-bg-accent-bold)',
          },
          generative: {
            strong: 'var(--color-bg-generative-strong)',
            high: 'var(--color-bg-generative-high)',
            'high-accented': 'var(--color-bg-generative-high-accented)',
          },
          // Priority tier colors
          priority: {
            'critical-subtle': 'var(--color-bg-priority-critical-subtle)',
            'high-subtle': 'var(--color-bg-priority-high-subtle)',
            'medium-subtle': 'var(--color-bg-priority-medium-subtle)',
            'low-subtle': 'var(--color-bg-priority-low-subtle)',
          },
          // Energy level colors
          energy: {
            'high-subtle': 'var(--color-bg-energy-high-subtle)',
            'medium-subtle': 'var(--color-bg-energy-medium-subtle)',
            'low-subtle': 'var(--color-bg-energy-low-subtle)',
          },
          // Overlay colors
          overlay: {
            light: 'var(--color-bg-overlay-light)',
            medium: 'var(--color-bg-overlay-medium)',
            heavy: 'var(--color-bg-overlay-heavy)',
          },
          // Legacy info alias
          info: {
            subtle: 'var(--color-bg-info-subtle)',
            DEFAULT: 'var(--color-bg-info-default)',
            bold: 'var(--color-bg-info-bold)',
          },
          status: {
            'completed-subtle': 'var(--color-bg-status-completed-subtle)',
            'completed-low': 'var(--color-bg-status-completed-low)',
            'completed-bold': 'var(--color-bg-status-completed-bold)',
            'today-subtle': 'var(--color-bg-status-today-subtle)',
            'today-low': 'var(--color-bg-status-today-low)',
            'today-bold': 'var(--color-bg-status-today-bold)',
            'focus-subtle': 'var(--color-bg-status-focus-subtle)',
            'focus-low': 'var(--color-bg-status-focus-low)',
            'focus-bold': 'var(--color-bg-status-focus-bold)',
            'waiting-subtle': 'var(--color-bg-status-waiting-subtle)',
            'waiting-low': 'var(--color-bg-status-waiting-low)',
            'waiting-bold': 'var(--color-bg-status-waiting-bold)',
            'deferred-subtle': 'var(--color-bg-status-deferred-subtle)',
            'deferred-low': 'var(--color-bg-status-deferred-low)',
            'deferred-bold': 'var(--color-bg-status-deferred-bold)',
            'ready-subtle': 'var(--color-bg-status-ready-subtle)',
            'ready-low': 'var(--color-bg-status-ready-low)',
            'ready-bold': 'var(--color-bg-status-ready-bold)',
            'inbox-subtle': 'var(--color-bg-status-inbox-subtle)',
            'inbox-low': 'var(--color-bg-status-inbox-low)',
            'inbox-bold': 'var(--color-bg-status-inbox-bold)',
            'archived-subtle': 'var(--color-bg-status-archived-subtle)',
            'archived-low': 'var(--color-bg-status-archived-low)',
            'archived-bold': 'var(--color-bg-status-archived-bold)',
          },
        },

        // ========================================
        // Foreground Colors (text-fg-*)
        // ========================================
        fg: {
          neutral: {
            primary: 'var(--color-fg-neutral-primary)',
            secondary: 'var(--color-fg-neutral-secondary)',
            softest: 'var(--color-fg-neutral-softest)',
            softer: 'var(--color-fg-neutral-softer)',
            soft: 'var(--color-fg-neutral-soft)',
            'spot-readable': 'var(--color-fg-neutral-spot-readable)',
            disabled: 'var(--color-fg-neutral-disabled)',
            'inverse-primary': 'var(--color-fg-neutral-inverse-primary)',
            'inverse-secondary': 'var(--color-fg-neutral-inverse-secondary)',
            // Legacy
            inverse: 'var(--color-fg-neutral-inverse)',
          },
          transparent: {
            softer: 'var(--color-fg-transparent-softer)',
            soft: 'var(--color-fg-transparent-soft)',
            medium: 'var(--color-fg-transparent-medium)',
            strong: 'var(--color-fg-transparent-strong)',
            'inverse-softer': 'var(--color-fg-transparent-inverse-softer)',
            'inverse-soft': 'var(--color-fg-transparent-inverse-soft)',
            'inverse-medium': 'var(--color-fg-transparent-inverse-medium)',
            'inverse-strong': 'var(--color-fg-transparent-inverse-strong)',
          },
          input: {
            primary: 'var(--color-fg-input-primary)',
            secondary: 'var(--color-fg-input-secondary)',
            'spot-readable': 'var(--color-fg-input-spot-readable)',
            soft: 'var(--color-fg-input-soft)',
          },
          positive: {
            primary: 'var(--color-fg-positive-primary)',
            secondary: 'var(--color-fg-positive-secondary)',
            'spot-readable': 'var(--color-fg-positive-spot-readable)',
            'inverse-primary': 'var(--color-fg-positive-inverse-primary)',
            'inverse-secondary': 'var(--color-fg-positive-inverse-secondary)',
            // Legacy
            DEFAULT: 'var(--color-fg-positive-default)',
            subtle: 'var(--color-fg-positive-subtle)',
          },
          attention: {
            primary: 'var(--color-fg-attention-primary)',
            secondary: 'var(--color-fg-attention-secondary)',
            // Legacy
            DEFAULT: 'var(--color-fg-attention-default)',
            subtle: 'var(--color-fg-attention-subtle)',
          },
          alert: {
            primary: 'var(--color-fg-alert-primary)',
            secondary: 'var(--color-fg-alert-secondary)',
            'inverse-primary': 'var(--color-fg-alert-inverse-primary)',
            'inverse-secondary': 'var(--color-fg-alert-inverse-secondary)',
            // Legacy
            DEFAULT: 'var(--color-fg-alert-default)',
            subtle: 'var(--color-fg-alert-subtle)',
          },
          information: {
            primary: 'var(--color-fg-information-primary)',
            secondary: 'var(--color-fg-information-secondary)',
            'spot-readable': 'var(--color-fg-information-spot-readable)',
            'inverse-primary': 'var(--color-fg-information-inverse-primary)',
            'inverse-secondary': 'var(--color-fg-information-inverse-secondary)',
          },
          accent: {
            primary: 'var(--color-fg-accent-primary)',
            secondary: 'var(--color-fg-accent-secondary)',
            'spot-readable': 'var(--color-fg-accent-spot-readable)',
            // Legacy
            DEFAULT: 'var(--color-fg-accent-default)',
            subtle: 'var(--color-fg-accent-subtle)',
          },
          generative: {
            'spot-readable': 'var(--color-fg-generative-spot-readable)',
            'inverse-primary': 'var(--color-fg-generative-inverse-primary)',
            'inverse-secondary': 'var(--color-fg-generative-inverse-secondary)',
          },
          // Priority tier foreground colors
          priority: {
            critical: 'var(--color-fg-priority-critical)',
            high: 'var(--color-fg-priority-high)',
            medium: 'var(--color-fg-priority-medium)',
            low: 'var(--color-fg-priority-low)',
          },
          // Energy level foreground colors
          energy: {
            high: 'var(--color-fg-energy-high)',
            medium: 'var(--color-fg-energy-medium)',
            low: 'var(--color-fg-energy-low)',
          },
          a11y: {
            primary: 'var(--color-fg-a11y-primary)',
          },
          // Legacy info alias
          info: {
            DEFAULT: 'var(--color-fg-info-default)',
            subtle: 'var(--color-fg-info-subtle)',
          },
          status: {
            completed: 'var(--color-fg-status-completed)',
            today: 'var(--color-fg-status-today)',
            focus: 'var(--color-fg-status-focus)',
            waiting: 'var(--color-fg-status-waiting)',
            deferred: 'var(--color-fg-status-deferred)',
            ready: 'var(--color-fg-status-ready)',
            inbox: 'var(--color-fg-status-inbox)',
            archived: 'var(--color-fg-status-archived)',
          },
        },

        // ========================================
        // Border Colors (border-border-color-*)
        // ========================================
        'border-color': {
          neutral: {
            subtle: 'var(--color-border-neutral-subtle)',
            low: 'var(--color-border-neutral-low)',
            medium: 'var(--color-border-neutral-medium)',
            DEFAULT: 'var(--color-border-neutral-default)',
            strong: 'var(--color-border-neutral-strong)',
            hover: 'var(--color-border-neutral-hover)',
          },
          input: {
            DEFAULT: 'var(--color-border-input-default)',
            high: 'var(--color-border-input-high)',
            focus: 'var(--color-border-input-focus)',
            error: 'var(--color-border-input-error)',
          },
          positive: {
            DEFAULT: 'var(--color-border-positive)',
            high: 'var(--color-border-positive-high)',
          },
          attention: 'var(--color-border-attention)',
          alert: {
            DEFAULT: 'var(--color-border-alert)',
            high: 'var(--color-border-alert-high)',
          },
          accent: {
            DEFAULT: 'var(--color-border-accent)',
            low: 'var(--color-border-accent-low)',
            medium: 'var(--color-border-accent-medium)',
          },
          info: 'var(--color-border-info)',
          a11y: {
            primary: 'var(--color-border-a11y-primary)',
          },
          // Energy level border colors
          energy: {
            high: 'var(--color-border-energy-high)',
            medium: 'var(--color-border-energy-medium)',
            low: 'var(--color-border-energy-low)',
          },
        },

        // ========================================
        // Glass Effects
        // ========================================
        glass: {
          floating: {
            bg: 'var(--glass-floating-bg)',
          },
          'floating-panel': {
            bg: 'var(--glass-floating-panel-bg)',
          },
          secondary: {
            bg: 'var(--glass-secondary-bg)',
            'hover-bg': 'var(--glass-secondary-hover-bg)',
          },
          ghost: {
            bg: 'var(--glass-ghost-bg)',
            'hover-bg': 'var(--glass-ghost-hover-bg)',
          },
          button: {
            bg: 'var(--glass-button-bg)',
            'hover-bg': 'var(--glass-button-hover-bg)',
            'active-bg': 'var(--glass-button-active-bg)',
          },
          // AI Glass effects
          ai: {
            border: 'var(--glass-ai-border)',
            shadow: 'var(--glass-ai-shadow)',
            'input-bg': 'var(--glass-ai-input-bg)',
            'input-border': 'var(--glass-ai-input-border)',
            'input-focus': 'var(--glass-ai-input-focus)',
            'fade-from': 'var(--glass-ai-fade-from)',
          },
        },

        // Ring colors for focus states
        ringColor: {
          focus: 'var(--color-ring-focus)',
          'accent-glow': 'var(--color-ring-accent-glow)',
        },

        // ========================================
        // LEGACY: Keep for backward compatibility
        // @deprecated Use bg/fg/border structure instead
        // ========================================

        // Surface colors
        surface: 'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
        'surface-muted': 'var(--color-surface-muted)',
        'surface-inset': 'var(--color-surface-inset)',

        // Semantic text
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        'text-muted': 'var(--color-text-muted)',

        // Border
        border: 'var(--color-border)',
        'border-light': 'var(--color-border-light)',
        'border-strong': 'var(--color-border-strong)',

        // Primary brand
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          light: 'var(--color-primary-light)',
          muted: 'var(--color-primary-muted)',
        },

        // Feedback colors
        success: {
          DEFAULT: 'var(--color-success)',
          light: 'var(--color-success-light)',
          dark: 'var(--color-success-dark)',
        },
        error: {
          DEFAULT: 'var(--color-error)',
          light: 'var(--color-error-light)',
          dark: 'var(--color-error-dark)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          light: 'var(--color-warning-light)',
          dark: 'var(--color-warning-dark)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          light: 'var(--color-info-light)',
          dark: 'var(--color-info-dark)',
        },

        // Status colors (legacy)
        status: {
          completed: 'var(--color-status-completed)',
          'completed-bg': 'var(--color-status-completed-bg)',
          'completed-text': 'var(--color-status-completed-text)',
          today: 'var(--color-status-today)',
          'today-bg': 'var(--color-status-today-bg)',
          'today-text': 'var(--color-status-today-text)',
          focus: 'var(--color-status-focus)',
          'focus-bg': 'var(--color-status-focus-bg)',
          'focus-text': 'var(--color-status-focus-text)',
          waiting: 'var(--color-status-waiting)',
          'waiting-bg': 'var(--color-status-waiting-bg)',
          'waiting-text': 'var(--color-status-waiting-text)',
          deferred: 'var(--color-status-deferred)',
          'deferred-bg': 'var(--color-status-deferred-bg)',
          'deferred-text': 'var(--color-status-deferred-text)',
          ready: 'var(--color-status-ready)',
          'ready-bg': 'var(--color-status-ready-bg)',
          'ready-text': 'var(--color-status-ready-text)',
          inbox: 'var(--color-status-inbox)',
          'inbox-bg': 'var(--color-status-inbox-bg)',
          'inbox-text': 'var(--color-status-inbox-text)',
          archived: 'var(--color-status-archived)',
          'archived-bg': 'var(--color-status-archived-bg)',
          'archived-text': 'var(--color-status-archived-text)',
        },

        // Health colors
        health: {
          healthy: 'var(--color-health-healthy)',
          'healthy-bg': 'var(--color-health-healthy-bg)',
          'healthy-text': 'var(--color-health-healthy-text)',
          'at-risk': 'var(--color-health-at-risk)',
          'at-risk-bg': 'var(--color-health-at-risk-bg)',
          'at-risk-text': 'var(--color-health-at-risk-text)',
          critical: 'var(--color-health-critical)',
          'critical-bg': 'var(--color-health-critical-bg)',
          'critical-text': 'var(--color-health-critical-text)',
        },

        // Priority colors
        priority: {
          high: 'var(--color-priority-high)',
          'high-bg': 'var(--color-priority-high-bg)',
          'high-text': 'var(--color-priority-high-text)',
          medium: 'var(--color-priority-medium)',
          'medium-bg': 'var(--color-priority-medium-bg)',
          'medium-text': 'var(--color-priority-medium-text)',
          low: 'var(--color-priority-low)',
          'low-bg': 'var(--color-priority-low-bg)',
          'low-text': 'var(--color-priority-low-text)',
        },
      },

      // Custom spacing (aliases to CSS vars)
      spacing: {
        'space-0': 'var(--space-0)',
        'space-1': 'var(--space-1)',
        'space-2': 'var(--space-2)',
        'space-3': 'var(--space-3)',
        'space-4': 'var(--space-4)',
        'space-5': 'var(--space-5)',
        'space-6': 'var(--space-6)',
        'space-8': 'var(--space-8)',
        'space-10': 'var(--space-10)',
        'space-12': 'var(--space-12)',
        'space-16': 'var(--space-16)',
        'space-20': 'var(--space-20)',
      },

      // Font sizes
      fontSize: {
        'ds-xs': 'var(--font-size-xs)',
        'ds-sm': 'var(--font-size-sm)',
        'ds-base': 'var(--font-size-base)',
        'ds-lg': 'var(--font-size-lg)',
        'ds-xl': 'var(--font-size-xl)',
        'ds-2xl': 'var(--font-size-2xl)',
        'ds-3xl': 'var(--font-size-3xl)',
      },

      // Border radius
      borderRadius: {
        'ds-sm': 'var(--radius-sm)',
        'ds-md': 'var(--radius-md)',
        'ds-lg': 'var(--radius-lg)',
        'ds-xl': 'var(--radius-xl)',
        'ds-2xl': 'var(--radius-2xl)',
        'ds-3xl': 'var(--radius-3xl)',
        'ds-full': 'var(--radius-full)',
      },

      // Box shadows
      boxShadow: {
        'ds-sm': 'var(--shadow-sm)',
        'ds-md': 'var(--shadow-md)',
        'ds-lg': 'var(--shadow-lg)',
        'ds-xl': 'var(--shadow-xl)',
        'ds-focus': 'var(--shadow-focus)',
        'ds-focus-error': 'var(--shadow-focus-error)',
        'ds-focus-success': 'var(--shadow-focus-success)',
        'accent-glow': 'var(--shadow-accent-glow)',
      },

      // Transition durations
      transitionDuration: {
        'ds-instant': 'var(--duration-instant)',
        'ds-fast': 'var(--duration-fast)',
        'ds-normal': 'var(--duration-normal)',
        'ds-slow': 'var(--duration-slow)',
        'ds-slower': 'var(--duration-slower)',
      },

      // Transition timing functions
      transitionTimingFunction: {
        'ds-default': 'var(--ease-default)',
        'ds-spring': 'var(--ease-spring)',
      },

      // Layout widths
      width: {
        drawer: 'var(--width-drawer)',
        minibar: 'var(--width-minibar)',
        palette: 'var(--width-palette)',
      },

      // Layout heights
      height: {
        header: 'var(--height-header)',
        'tab-bar': 'var(--height-tab-bar)',
        collapsed: 'var(--height-collapsed)',
      },

      // Backdrop blur
      backdropBlur: {
        'glass-floating': '12px',
        'glass-panel': '16px',
        'glass-secondary': '8px',
        'glass-ghost': '4px',
        'glass-button': '8px',
        'glass-ai': 'var(--glass-ai-blur)',
      },

      // Font family
      fontFamily: {
        sans: 'var(--font-family-sans)',
        mono: 'var(--font-family-mono)',
      },
    },
  },
};
