import { KPIEntry, DailyScore, Target, BonusRule, User, Role, AuditLog } from '../types';
import { TARGETS, MOCK_HISTORY, USERS as FALLBACK_USERS } from '../constants';
import { supabase } from './supabaseClient';

// --- AUDIT LOGS OPERATIONS ---

export const createAuditLog = async (action: string, user: string, details: string): Promise<void> => {
    try {
        const { error } = await supabase.from('audit_logs').insert([{
            action,
            user_name: user,
            details,
            created_at: new Date().toISOString()
        }]);
        if (error) console.warn("Error logging audit:", error.message);
    } catch (e) {
        console.warn("Audit log failed (table might be missing)");
    }
};

export const fetchAuditLogs = async (): Promise<AuditLog[]> => {
    try {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
            
        if (error || !data) return [];
        
        return data.map((l: any) => ({
            id: l.id,
            action: l.action,
            user: l.user_name,
            details: l.details,
            date: new Date(l.created_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })
        }));
    } catch (e) {
        return [];
    }
};

// --- TARGETS OPERATIONS ---

export const fetchTargets = async (): Promise<Target> => {
  try {
    const { data, error } = await supabase
      .from('app_targets')
      .select('*')
      .single(); // Expecting a single row for global configuration
    
    // Safely fallback if table missing or empty
    if (error || !data) {
      console.warn("Using fallback targets (DB check failed or empty)");
      return TARGETS;
    }

    return {
      monthlySalesAmount: data.monthly_sales_amount ?? TARGETS.monthlySalesAmount,
      monthlyDevices: data.monthly_devices ?? TARGETS.monthlyDevices,
      dailyConversion: data.daily_conversion ?? TARGETS.dailyConversion,
      dailyFollowUps: data.daily_follow_ups ?? TARGETS.dailyFollowUps,
      maxErrors: data.max_errors ?? TARGETS.maxErrors
    };
  } catch (err) {
    return TARGETS;
  }
};

export const saveTargets = async (targets: Target): Promise<void> => {
  const dbTargets = {
    id: 1, // Enforce single row singleton
    monthly_sales_amount: targets.monthlySalesAmount,
    monthly_devices: targets.monthlyDevices,
    daily_conversion: targets.dailyConversion,
    daily_follow_ups: targets.dailyFollowUps,
    max_errors: targets.maxErrors
  };

  const { error } = await supabase.from('app_targets').upsert(dbTargets);
  if (error) throw error;
};

// --- USER OPERATIONS ---

export const fetchUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('app_users') 
      .select('*')
      .order('name');
    
    if (error || !data || data.length === 0) {
      console.warn("Using fallback users (DB check failed)");
      return FALLBACK_USERS;
    }
    
    return data.map((u: any) => ({
      id: u.id,
      name: u.name,
      role: u.role as Role,
      avatar: u.avatar,
      password: u.password
    }));
  } catch (err) {
    return FALLBACK_USERS;
  }
};

export const createUser = async (user: Omit<User, 'id'>): Promise<void> => {
    const dbUser = {
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        password: user.password
    };
    const { error } = await supabase.from('app_users').insert([dbUser]);
    if (error) throw error;
};

export const updateUser = async (user: User): Promise<void> => {
    const dbUser = {
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        password: user.password
    };
    const { error } = await supabase.from('app_users').update(dbUser).eq('id', user.id);
    if (error) throw error;
};

export const deleteUser = async (id: string): Promise<void> => {
    const { error } = await supabase.from('app_users').delete().eq('id', id);
    if (error) throw error;
};

// --- DATABASE OPERATIONS ---

// Fetch all entries from Supabase
export const fetchEntries = async (): Promise<KPIEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('kpi_entries')
      .select('*');
    
    if (error) throw error;
    
    // Safety check: ensure data is an array before mapping
    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      date: row.date,
      clientsAttended: row.clients_attended,
      quotesSent: row.quotes_sent,
      followUps: row.follow_ups,
      salesClosed: row.sales_closed,
      amountSold: parseFloat(row.amount_sold),
      devicesSold: row.devices_sold,
      exchanges: row.exchanges,
      errors: row.errors,
      punctualityScore: row.punctuality_score,
      qualityScore: row.quality_score,
      notes: row.notes
    }));
  } catch (err) {
    console.error("Error fetching entries:", err);
    return []; 
  }
};

export const fetchEntriesByUser = async (userId: string): Promise<KPIEntry[]> => {
  const all = await fetchEntries();
  return all.filter(e => e.userId === userId);
};

export const createEntry = async (entry: KPIEntry): Promise<void> => {
  try {
    const dbEntry = {
      user_id: entry.userId,
      date: entry.date,
      clients_attended: entry.clientsAttended,
      quotes_sent: entry.quotesSent,
      follow_ups: entry.followUps,
      sales_closed: entry.salesClosed,
      amount_sold: entry.amountSold,
      devices_sold: entry.devicesSold,
      exchanges: entry.exchanges,
      errors: entry.errors,
      punctuality_score: entry.punctualityScore,
      quality_score: entry.qualityScore,
      notes: entry.notes
    };

    const { error } = await supabase.from('kpi_entries').insert([dbEntry]);
    if (error) throw error;
  } catch (err) {
    console.error("Error creating entry:", err);
    throw err;
  }
};

export const updateEntry = async (id: string, updates: Partial<KPIEntry>): Promise<void> => {
  try {
    const dbUpdates: any = {};
    if (updates.clientsAttended !== undefined) dbUpdates.clients_attended = updates.clientsAttended;
    if (updates.quotesSent !== undefined) dbUpdates.quotes_sent = updates.quotesSent;
    if (updates.followUps !== undefined) dbUpdates.follow_ups = updates.followUps;
    if (updates.salesClosed !== undefined) dbUpdates.sales_closed = updates.salesClosed;
    if (updates.amountSold !== undefined) dbUpdates.amount_sold = updates.amountSold;
    if (updates.devicesSold !== undefined) dbUpdates.devices_sold = updates.devicesSold;
    if (updates.exchanges !== undefined) dbUpdates.exchanges = updates.exchanges;
    if (updates.errors !== undefined) dbUpdates.errors = updates.errors;
    if (updates.punctualityScore !== undefined) dbUpdates.punctuality_score = updates.punctualityScore;
    if (updates.qualityScore !== undefined) dbUpdates.quality_score = updates.qualityScore;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

    const { error } = await supabase.from('kpi_entries').update(dbUpdates).eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error("Error updating entry:", err);
    throw err;
  }
};

export const deleteEntry = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from('kpi_entries').delete().eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error("Error deleting entry:", err);
    throw err;
  }
};

export const clearKPIEntries = async (): Promise<void> => {
  const { error } = await supabase
    .from('kpi_entries')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (error) throw error;
};

export const seedDatabase = async (): Promise<void> => {
  try {
    const payload = MOCK_HISTORY.map(entry => ({
      user_id: entry.userId,
      date: entry.date,
      clients_attended: entry.clientsAttended,
      quotes_sent: entry.quotesSent,
      follow_ups: entry.followUps,
      sales_closed: entry.salesClosed,
      amount_sold: entry.amountSold,
      devices_sold: entry.devicesSold,
      exchanges: entry.exchanges,
      errors: entry.errors,
      punctuality_score: entry.punctualityScore,
      quality_score: entry.qualityScore,
      notes: entry.notes || ''
    }));

    const { error } = await supabase.from('kpi_entries').insert(payload);
    if (error) throw error;
    console.log("Database seeded successfully");
  } catch (err) {
    console.error("Error seeding database:", err);
    throw err;
  }
};

// --- BONUS RULES SERVICE ---

export const fetchBonusRules = async (): Promise<BonusRule[]> => {
  try {
    const { data, error } = await supabase
      .from('bonus_rules')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data) return [];

    return data.map((r: any) => ({
      id: r.id,
      name: r.name,
      metric: r.metric,
      threshold: parseFloat(r.threshold),
      amount: parseFloat(r.amount),
      period: r.period,
      isActive: r.is_active
    }));
  } catch (err) {
    console.error("Error fetching rules:", err);
    return [];
  }
};

export const fetchActiveBonusRules = async (): Promise<BonusRule[]> => {
  const rules = await fetchBonusRules();
  return rules.filter(r => r.isActive);
};

export const createBonusRule = async (rule: BonusRule): Promise<void> => {
   const dbRule = {
      name: rule.name,
      metric: rule.metric,
      threshold: rule.threshold,
      amount: rule.amount,
      period: rule.period,
      is_active: rule.isActive
   };
   const { error } = await supabase.from('bonus_rules').insert([dbRule]);
   if (error) throw error;
};

export const updateBonusRule = async (rule: BonusRule): Promise<void> => {
    const dbRule = {
      name: rule.name,
      metric: rule.metric,
      threshold: rule.threshold,
      amount: rule.amount,
      period: rule.period,
      is_active: rule.isActive
   };
   const { error } = await supabase.from('bonus_rules').update(dbRule).eq('id', rule.id);
   if (error) throw error;
};

export const deleteBonusRule = async (id: string): Promise<void> => {
    const { error } = await supabase.from('bonus_rules').delete().eq('id', id);
    if (error) throw error;
};

// --- CALCULATIONS (Sync functions remain the same) ---

export const calculateConversion = (sales: number, clients: number): number => {
  if (clients === 0) return 0;
  return parseFloat(((sales / clients) * 100).toFixed(1));
};

export const calculateScore = (entry: KPIEntry, targets: Target): DailyScore => {
  const dailyTargetAmount = targets.monthlySalesAmount / 30;
  const dailyTargetDevices = targets.monthlyDevices / 30;

  // 1. Amount Sold (30 pts)
  const amountRatio = Math.min(entry.amountSold / dailyTargetAmount, 1.2); 
  const salesScore = amountRatio * 30;

  // 2. Devices Sold (10 pts)
  const devicesRatio = dailyTargetDevices > 0 ? Math.min(entry.devicesSold / dailyTargetDevices, 1.5) : 0;
  const devicesScore = devicesRatio * 10;

  // 3. Conversion (20 pts)
  const currentConv = calculateConversion(entry.salesClosed, entry.clientsAttended);
  const convRatio = Math.min(currentConv / targets.dailyConversion, 1.2);
  const conversionScore = convRatio * 20;

  // 4. Follow Ups (10 pts)
  const followRatio = Math.min(entry.followUps / targets.dailyFollowUps, 1.2);
  const followUpScore = followRatio * 10;

  // 5. Quality (10 pts)
  const qualityScore = (entry.qualityScore / 5) * 10; 

  // 6. Exchanges & Errors (10 pts)
  const penalty = (entry.exchanges * 2) + (entry.errors * 3);
  const exchangeErrorScore = Math.max(10 - penalty, 0);

  // 7. Discipline/Punctuality (10 pts)
  const disciplineScore = (entry.punctualityScore / 5) * 10;

  const totalRaw = salesScore + devicesScore + conversionScore + followUpScore + qualityScore + exchangeErrorScore + disciplineScore;

  return {
    totalScore: Math.round(Math.min(totalRaw, 100)),
    salesScore,
    devicesScore,
    conversionScore,
    followUpScore,
    qualityScore,
    disciplineScore: Math.round(disciplineScore + exchangeErrorScore),
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