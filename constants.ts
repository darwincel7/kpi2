import { User, Role, KPIEntry, BonusRule, Target } from './types';

// Configuration for Scores - MONTHLY FOCUS
export const TARGETS: Target = {
  monthlySalesAmount: 450000, // RD$ Goal per month (approx 15k/day * 30)
  monthlyDevices: 60, // New: 2 devices per day approx
  dailyConversion: 30, // 30% conversion goal
  dailyFollowUps: 15, // 15 followups per day
  maxErrors: 0
};

// Mock Users
export const USERS: User[] = [
  { id: 'u1', name: 'Laura Gerente', role: Role.ADMIN, avatar: 'https://picsum.photos/id/64/200/200', password: 'admin' },
  { id: 'u2', name: 'Ana Vendedora', role: Role.STAFF, avatar: 'https://picsum.photos/id/65/200/200', password: '123' },
  { id: 'u3', name: 'Carla Asesora', role: Role.STAFF, avatar: 'https://picsum.photos/id/66/200/200', password: '123' },
  { id: 'u4', name: 'Beatriz Ventas', role: Role.STAFF, avatar: 'https://picsum.photos/id/67/200/200', password: '123' },
];

// Mock Bonus Rules
export const BONUS_RULES: BonusRule[] = [
  { id: 'b1', name: 'Bono Master en Ventas', metric: 'amount', threshold: 400000, amount: 5000, period: 'monthly', isActive: true },
  { id: 'b2', name: 'Bono Alta Conversión', metric: 'conversion', threshold: 35, amount: 3000, period: 'monthly', isActive: true },
  { id: 'b3', name: 'Bono Calidad Total', metric: 'score', threshold: 90, amount: 2000, period: 'monthly', isActive: true },
  { id: 'b4', name: 'Bono Equipos', metric: 'devices', threshold: 55, amount: 2500, period: 'monthly', isActive: true },
];

// Generate some history for charts (Last 7 days for each staff)
const generateMockHistory = (): KPIEntry[] => {
  const entries: KPIEntry[] = [];
  const today = new Date();
  
  USERS.filter(u => u.role === Role.STAFF).forEach(user => {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      // Randomize data slightly for realism
      const clients = Math.floor(Math.random() * 20) + 10;
      const sales = Math.floor(clients * (Math.random() * 0.4 + 0.1)); // 10-50% conversion
      const devices = Math.floor(sales * 0.7); // Assume 70% of sales include a device
      
      entries.push({
        id: `${user.id}-${dateStr}`,
        userId: user.id,
        date: dateStr,
        clientsAttended: clients,
        quotesSent: Math.floor(clients * 0.8),
        followUps: Math.floor(Math.random() * 15) + 5,
        salesClosed: sales,
        amountSold: sales * (Math.floor(Math.random() * 1000) + 500),
        devicesSold: devices,
        exchanges: Math.random() > 0.8 ? 1 : 0,
        errors: Math.random() > 0.9 ? 1 : 0,
        punctualityScore: Math.random() > 0.1 ? 5 : 4,
        qualityScore: Math.floor(Math.random() * 2) + 4, // 4 or 5
      });
    }
  });
  return entries;
};

export const MOCK_HISTORY = generateMockHistory();