export enum Role {
  ADMIN = 'admin',
  STAFF = 'staff'
}

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar?: string;
  password?: string; // Added for auth simulation
}

export interface KPIEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  clientsAttended: number;
  quotesSent: number;
  followUps: number;
  salesClosed: number;
  amountSold: number;
  devicesSold: number; // New: Equipos Vendidos
  exchanges: number; // Cambiazos
  errors: number;
  punctualityScore: number; // 1-5
  qualityScore: number; // 1-5
  notes?: string;
}

export interface DailyScore {
  totalScore: number;
  salesScore: number;
  devicesScore: number; // New score component
  conversionScore: number;
  followUpScore: number;
  qualityScore: number;
  disciplineScore: number;
  conversionRate: number;
  ticketAverage: number;
}

export interface Target {
  monthlySalesAmount: number; // Changed to Monthly
  monthlyDevices: number; // New: Monthly Devices Target
  dailyConversion: number; // Percentage 0-100 (stays as rate)
  dailyFollowUps: number;
  maxErrors: number;
}

export interface BonusRule {
  id: string;
  name: string;
  metric: 'conversion' | 'amount' | 'followUps' | 'score' | 'devices';
  threshold: number;
  amount: number;
  period: 'monthly';
  isActive: boolean; // New: To toggle rule status
}

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  details: string;
  date: string;
}