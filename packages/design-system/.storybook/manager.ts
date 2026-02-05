import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming/create';

const theme = create({
  base: 'light',
  brandTitle: 'Focus Tools Design System',
  brandUrl: 'https://github.com/your-org/focus-tools',

  // Colors
  colorPrimary: '#7c3aed', // violet-600
  colorSecondary: '#6d28d9', // violet-700

  // UI
  appBg: '#fafafa',
  appContentBg: '#ffffff',
  appBorderColor: '#e4e4e7',
  appBorderRadius: 8,

  // Text
  textColor: '#18181b',
  textInverseColor: '#ffffff',

  // Toolbar
  barTextColor: '#71717a',
  barSelectedColor: '#7c3aed',
  barBg: '#ffffff',

  // Form
  inputBg: '#ffffff',
  inputBorder: '#e4e4e7',
  inputTextColor: '#18181b',
  inputBorderRadius: 4,
});

addons.setConfig({
  theme,
  sidebar: {
    showRoots: true,
  },
});
