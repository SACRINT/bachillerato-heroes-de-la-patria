// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
}

// Contact Types
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  type: ContactType;
  status: MessageStatus;
  response?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactMessageRequest {
  name: string;
  email: string;
  subject?: string;
  message: string;
  type?: ContactType;
}

// Complaint/Suggestion Types
export interface ComplaintSuggestion {
  id: string;
  name: string;
  email: string;
  type: ComplaintType;
  description: string;
  status: MessageStatus;
  response?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateComplaintRequest {
  name: string;
  email: string;
  type: ComplaintType;
  description: string;
}

// News and Events Types
export interface News {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  image?: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// Document Types
export interface Document {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  category: DocumentCategory;
  isPublic: boolean;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UploadDocumentRequest {
  title: string;
  description?: string;
  category: DocumentCategory;
  isPublic?: boolean;
}

// Enums
export enum UserRole {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  USER = 'USER',
}

export enum ContactType {
  GENERAL = 'GENERAL',
  ACADEMIC = 'ACADEMIC', 
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  TECHNICAL = 'TECHNICAL',
  ADMISSION = 'ADMISSION',
}

export enum ComplaintType {
  COMPLAINT = 'COMPLAINT',
  SUGGESTION = 'SUGGESTION',
  COMPLIMENT = 'COMPLIMENT',
}

export enum MessageStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum DocumentCategory {
  ACADEMIC = 'ACADEMIC',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  FORMS = 'FORMS',
  MANUALS = 'MANUALS',
  REGULATIONS = 'REGULATIONS',
  OTHER = 'OTHER',
}

// UI Component Types
export interface NavigationItem {
  label: string;
  href: string;
  icon?: string;
  children?: NavigationItem[];
  external?: boolean;
}

export interface SiteConfig {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  links: {
    github: string;
    facebook: string;
    instagram: string;
    email: string;
  };
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'file';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface FormConfig {
  title: string;
  description?: string;
  fields: FormField[];
  submitText: string;
  successMessage: string;
}

// SEO Types
export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  canonical?: string;
  noindex?: boolean;
}

// Theme Types
export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
  };
  fonts: {
    sans: string;
    mono: string;
  };
}

// Analytics Types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: string;
}