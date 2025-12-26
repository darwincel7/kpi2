import { createClient } from '@supabase/supabase-js';
import { USERS, TARGETS, BONUS_RULES, MOCK_HISTORY } from '../constants';

// ⚠️ CONFIGURACIÓN: Si tienes credenciales reales, ponlas aquí. 
// Si no, el sistema usará automáticamente la Base de Datos Local (LocalStorage).
const SUPABASE_URL = 'https://placeholder-url.supabase.co';
const SUPABASE_ANON_KEY = 'placeholder-key';

// --- LOCAL STORAGE DATABASE ENGINE ---
// Este sistema simula una base de datos real usando el navegador del usuario.
// Permite guardar, editar y borrar datos persistentes sin conexión a internet.

class LocalStorageDB {
    private prefix = 'darwin_db_';

    constructor() {
        this.initSeeds();
    }

    // Inicializa datos de prueba si la base de datos está vacía
    private initSeeds() {
        if (typeof window === 'undefined') return;

        // Seed Users
        if (!localStorage.getItem(this.prefix + 'app_users')) {
            // USERS from constants are already compatible
            this.saveData('app_users', USERS);
        }
        
        // Seed Targets (Map camelCase to snake_case for DB compatibility)
        if (!localStorage.getItem(this.prefix + 'app_targets')) {
           const dbTargets = {
                id: 1,
                monthly_sales_amount: TARGETS.monthlySalesAmount,
                monthly_devices: TARGETS.monthlyDevices,
                daily_conversion: TARGETS.dailyConversion,
                daily_follow_ups: TARGETS.dailyFollowUps,
                max_errors: TARGETS.maxErrors
           };
           this.saveData('app_targets', [dbTargets]);
        }
        
        // Seed Bonus Rules (Map camelCase to snake_case)
        if (!localStorage.getItem(this.prefix + 'bonus_rules')) {
            const dbRules = BONUS_RULES.map(r => ({
                id: r.id,
                name: r.name,
                metric: r.metric,
                threshold: r.threshold,
                amount: r.amount,
                period: r.period,
                is_active: r.isActive,
                created_at: new Date().toISOString()
            }));
            this.saveData('bonus_rules', dbRules);
        }
        
        // Seed KPI Entries (Map camelCase to snake_case)
        if (!localStorage.getItem(this.prefix + 'kpi_entries')) {
            const dbEntries = MOCK_HISTORY.map(e => ({
                id: e.id,
                user_id: e.userId,
                date: e.date,
                clients_attended: e.clientsAttended,
                quotes_sent: e.quotesSent,
                follow_ups: e.followUps,
                sales_closed: e.salesClosed,
                amount_sold: e.amountSold,
                devices_sold: e.devicesSold,
                exchanges: e.exchanges,
                errors: e.errors,
                punctuality_score: e.punctualityScore,
                quality_score: e.qualityScore,
                notes: e.notes || ''
            }));
            this.saveData('kpi_entries', dbEntries);
        }
    }

    getData(table: string): any[] {
        if (typeof window === 'undefined') return [];
        const stored = localStorage.getItem(this.prefix + table);
        return stored ? JSON.parse(stored) : [];
    }

    saveData(table: string, data: any[]) {
        if (typeof window === 'undefined') return;
        localStorage.setItem(this.prefix + table, JSON.stringify(data));
    }
}

// Query Builder que imita la sintaxis de Supabase
class MockQueryBuilder {
    private table: string;
    private db: LocalStorageDB;
    private filters: { column: string, value: any, type: 'eq' | 'neq' }[];
    private orderConfig: { column: string, ascending: boolean } | null;
    private limitCount: number | null;
    private action: 'select' | 'insert' | 'update' | 'delete' | 'upsert' | null;
    private payload: any;
    private isSingle: boolean;

    constructor(table: string, db: LocalStorageDB) {
        this.table = table;
        this.db = db;
        this.filters = [];
        this.orderConfig = null;
        this.limitCount = null;
        this.action = null;
        this.payload = null;
        this.isSingle = false;
    }

    select(columns = '*') {
        this.action = 'select';
        return this;
    }

    insert(data: any) {
        this.action = 'insert';
        this.payload = data;
        return this;
    }

    update(data: any) {
        this.action = 'update';
        this.payload = data;
        return this;
    }
    
    upsert(data: any) {
        this.action = 'upsert';
        this.payload = data;
        return this;
    }

    delete() {
        this.action = 'delete';
        return this;
    }

    eq(column: string, value: any) {
        this.filters.push({ column, value, type: 'eq' });
        return this;
    }
    
    neq(column: string, value: any) {
        this.filters.push({ column, value, type: 'neq' });
        return this;
    }

    order(column: string, config: { ascending: boolean } = { ascending: true }) {
        this.orderConfig = { column, ...config };
        return this;
    }

    limit(count: number) {
        this.limitCount = count;
        return this;
    }

    single() {
        this.isSingle = true;
        return this;
    }

    // Ejecuta la consulta y devuelve una promesa compatible con Supabase
    then(onfulfilled?: ((value: any) => any) | null, onrejected?: ((reason: any) => any) | null) {
        const result = this.execute();
        return Promise.resolve(result).then(onfulfilled, onrejected);
    }

    private execute() {
        let data = this.db.getData(this.table);
        
        try {
            // INSERT
            if (this.action === 'insert') {
                const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
                const newRows = rows.map((r: any) => ({ 
                    ...r, 
                    id: r.id || Math.random().toString(36).substr(2, 9) 
                }));
                data = [...data, ...newRows];
                this.db.saveData(this.table, data);
                return { data: newRows, error: null };
            }
            
            // UPSERT
            if (this.action === 'upsert') {
                const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
                rows.forEach((row: any) => {
                    // Try to find by ID first
                    let idx = -1;
                    if (row.id) {
                         idx = data.findIndex((d: any) => d.id == row.id);
                    }
                    
                    if (idx >= 0) {
                        data[idx] = { ...data[idx], ...row };
                    } else {
                        data.push({ ...row, id: row.id || Math.random().toString(36).substr(2, 9) });
                    }
                });
                this.db.saveData(this.table, data);
                return { data: rows, error: null };
            }

            // FILTERING (Para Update, Delete, Select)
            let filtered = data.filter((row: any) => {
                return this.filters.every(f => {
                    // Loose equality to handle number vs string ID issues
                    if (f.type === 'eq') return row[f.column] == f.value;
                    if (f.type === 'neq') return row[f.column] != f.value;
                    return true;
                });
            });

            // UPDATE
            if (this.action === 'update') {
                const idsToUpdate = new Set(filtered.map((r: any) => r.id));
                data = data.map((r: any) => {
                    if (idsToUpdate.has(r.id)) {
                        return { ...r, ...this.payload };
                    }
                    return r;
                });
                this.db.saveData(this.table, data);
                return { data: null, error: null };
            }

            // DELETE
            if (this.action === 'delete') {
                const idsToDelete = new Set(filtered.map((r: any) => r.id));
                data = data.filter((r: any) => !idsToDelete.has(r.id));
                this.db.saveData(this.table, data);
                return { data: null, error: null };
            }

            // SELECT
            if (this.action === 'select') {
                let resultRows = [...filtered];
                
                // Order
                if (this.orderConfig) {
                    const { column, ascending } = this.orderConfig;
                    resultRows.sort((a: any, b: any) => {
                        if (a[column] < b[column]) return ascending ? -1 : 1;
                        if (a[column] > b[column]) return ascending ? 1 : -1;
                        return 0;
                    });
                }
                
                // Limit
                if (this.limitCount) {
                    resultRows = resultRows.slice(0, this.limitCount);
                }

                if (this.isSingle) {
                    return { data: resultRows.length > 0 ? resultRows[0] : null, error: null };
                }
                
                return { data: resultRows, error: null };
            }
        } catch (e: any) {
            console.error("Mock DB Error:", e);
            return { data: null, error: { message: e.message } };
        }
        
        return { data: [], error: null };
    }
}

// Inicializamos la DB Local
const localDB = new LocalStorageDB();

const mockClient = {
  from: (table: string) => new MockQueryBuilder(table, localDB),
  channel: () => ({
    on: () => ({ subscribe: () => {} }),
    subscribe: () => {},
    removeChannel: () => {}
  }),
  removeChannel: () => {}
};

let client: any;

try {
  // Simple validation logic
  const isPlaceholder = !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('placeholder') || SUPABASE_URL.includes('placeholder');
  
  if (isPlaceholder) {
    console.log("⚠️ Usando Base de Datos Local (Modo Offline)");
    client = mockClient;
  } else {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (error) {
  console.error("Error inicializando Supabase, cambiando a local:", error);
  client = mockClient;
}

export const supabase = client;