import { KPIEntry, DailyScore, Target, BonusRule } from '../types';
import { TARGETS, MOCK_HISTORY, BONUS_RULES as INITIAL_BONUS_RULES } from '../constants';

// Local storage key
const STORAGE_KEY = 'darwin_kpi_entries';

// Initialize data
let inMemoryEntries: KPIEntry[] = [...MOCK_HISTORY];
let currentBonusRules: BonusRule[] = [...INITIAL_BONUS_RULES];

export const getEntries = (): KPIEntry[] => {
  return inMemoryEntries;
};

export const getEntriesByUser = (userId: string): KPIEntry[] => {
  return inMemoryEntries.filter(e => e.userId === userId);
};

export const addEntry = (entry: KPIEntry): void => {
  inMemoryEntries = [...inMemoryEntries, entry];
  // In a real app, we would persist to Supabase here
};

// --- BONUS RULES SERVICE ---
export const getBonusRules = (): BonusRule[] => {
  return currentBonusRules;
};

export const getActiveBonusRules = (): BonusRule[] => {
  return currentBonusRules.filter(r => r.isActive);
};

export const saveBonusRules = (rules: BonusRule[]): void => {
  currentBonusRules = rules;
};
// ---------------------------

export const calculateConversion = (sales: number, clients: number): number => {
  if (clients === 0) return 0;
  return parseFloat(((sales / clients) * 100).toFixed(1));
};

export const calculateScore = (entry: KPIEntry, targets: Target): DailyScore => {
  // Score Formula based on requirements
  // Max 100 points
  
  // Calculate Daily Targets based on Monthly Goals (Standard 30 days)
  const dailyTargetAmount = targets.monthlySalesAmount / 30;
  const dailyTargetDevices = targets.monthlyDevices / 30;

  // 1. Amount Sold (30 pts)
  const amountRatio = Math.min(entry.amountSold / dailyTargetAmount, 1.2); 
  const salesScore = amountRatio * 30;

  // 2. Devices Sold (10 pts) - NEW
  // Protect against division by zero if target is 0
  const devicesRatio = dailyTargetDevices > 0 ? Math.min(entry.devicesSold / dailyTargetDevices, 1.5) : 0;
  const devicesScore = devicesRatio * 10;

  // 3. Conversion (20 pts)
  const currentConv = calculateConversion(entry.salesClosed, entry.clientsAttended);
  const convRatio = Math.min(currentConv / targets.dailyConversion, 1.2);
  const conversionScore = convRatio * 20;

  // 4. Follow Ups (10 pts) - Reduced from 15 to make room for devices
  const followRatio = Math.min(entry.followUps / targets.dailyFollowUps, 1.2);
  const followUpScore = followRatio * 10;

  // 5. Quality (10 pts)
  const qualityScore = (entry.qualityScore / 5) * 10; 

  // 6. Exchanges & Errors (10 pts)
  // Start with 10, subtract for errors and exchanges
  const penalty = (entry.exchanges * 2) + (entry.errors * 3);
  const exchangeErrorScore = Math.max(10 - penalty, 0);

  // 7. Discipline/Punctuality (10 pts)
  const disciplineScore = (entry.punctualityScore / 5) * 10;

  // Total Sum
  // 30 + 10 + 20 + 10 + 10 + 10 + 10 = 100
  const totalRaw = salesScore + devicesScore + conversionScore + followUpScore + qualityScore + exchangeErrorScore + disciplineScore;

  return {
    totalScore: Math.round(Math.min(totalRaw, 100)), // Cap at 100
    salesScore,
    devicesScore,
    conversionScore,
    followUpScore,
    qualityScore,
    disciplineScore: Math.round(disciplineScore + exchangeErrorScore), // Combine logic for UI simplicity or keep separate
    conversionRate: currentConv,
    ticketAverage: entry.salesClosed > 0 ? Math.round(entry.amountSold / entry.salesClosed) : 0
  };
};

export const getAggregatedStats = (entries: KPIEntry[]) => {
  const totalAmount = entries.reduce((sum, e) => sum + e.amountSold, 0);
  const totalSales = entries.reduce((sum, e) => sum + e.salesClosed, 0);
  const totalDevices = entries.reduce((sum, e) => sum + e.devicesSold, 0);
  const totalClients = entries.reduce((sum, e) => sum + e.clientsAttended, 0);
  const totalFollowUps = entries.reduce((sum, e) => sum + e.followUps, 0);
  const avgConversion = calculateConversion(totalSales, totalClients);
  
  return {
    totalAmount,
    totalSales,
    totalDevices,
    totalClients,
    totalFollowUps,
    avgConversion
  };
};