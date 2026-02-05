import React from 'react';
import type { Preview } from '@storybook/react';
import { withThemeByClassName } from '@storybook/addon-themes';

// Import design system styles
import '../styles/index.css';

// Import Tailwind base styles
import './tailwind.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      disable: true, // Disable backgrounds addon, use theme switcher instead
    },
    layout: 'centered',
    docs: {
      toc: true,
    },
  },
  decorators: [
    // Apply theme class to story container
    withThemeByClassName({
      themes: {
        light: '',
        dark: 'dark',
      },
      defaultTheme: 'light',
    }),
    // Wrap stories in a container with proper background
    (Story) => (
      <div className="min-h-[200px] p-4 bg-surface text-text-primary">
        <Story />
      </div>
    ),
  ],
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
