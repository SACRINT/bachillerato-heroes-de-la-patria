/**
 * @heroes-patria/ui - Biblioteca de componentes UI
 * 
 * Este paquete contiene todos los componentes reutilizables del ecosistema Bachillerato Héroes de la Patria
 */

// Layouts
export { default as Layout } from './layouts/Layout.astro';

// Main Components
export { default as Header } from './components/Header.astro';
export { default as Footer } from './components/Footer.astro';

// Common Components
export { default as Button } from './components/common/Button.astro';
export { default as Card } from './components/common/Card.astro';
export { default as Badge } from './components/common/Badge.astro';

// Form Components
export { default as Input } from './components/forms/Input.astro';
export { default as Select } from './components/forms/Select.astro';
export { default as Textarea } from './components/forms/Textarea.astro';

// Re-export types from @heroes-patria/types for convenience
export type { NavigationItem } from '@heroes-patria/types';

// Component Props Types
export interface LayoutProps {
  title: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  canonical?: string;
  showHeader?: boolean;
  showFooter?: boolean;
}

export interface HeaderProps {
  currentPath?: string;
  navigationItems?: Array<{
    label: string;
    href: string;
    icon: string;
    children?: Array<{
      label: string;
      href: string;
      icon: string;
    }>;
  }>;
}

export interface FooterProps {
  institutionName?: string;
  customLinks?: Array<{
    name: string;
    href: string;
    icon: string;
  }>;
}

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  href?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
}

export interface CardProps {
  variant?: 'default' | 'elevated' | 'glass' | 'outlined';
  padding?: 'sm' | 'md' | 'lg' | 'none';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shadow?: boolean;
  hover?: boolean;
}

export interface InputProps {
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'number';
  name: string;
  id?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'filled';
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  name: string;
  id?: string;
  label?: string;
  options: SelectOption[];
  value?: string | number;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'filled';
}

export interface TextareaProps {
  name: string;
  id?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  maxLength?: number;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'filled';
}

export interface BadgeProps {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  outline?: boolean;
  removable?: boolean;
}