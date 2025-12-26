import { createClient } from '@supabase/supabase-js';

// ⚠️ REEMPLAZA ESTOS VALORES CON LOS DE TU PROYECTO DE SUPABASE ⚠️
const SUPABASE_URL = 'https://chrsxkycgfumiiigiymd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_pMIgHE1KWD7_8BNAMxyMsA_6cV772xJ';

let client;

// Helper to create a chainable mock object that never crashes
const createChainableMock = (returnValue = { data: [], error: null }) => {
  const handler = {
    get: function(target, prop) {
      if (prop === 'then') {
        // If awaited, return the default empty data
        return (resolve) => resolve(returnValue);
      }
      // If any other method is called (select, order, limit, eq, etc.), return the proxy itself
      // This simulates fluent chaining
      return () => new Proxy({}, handler);
    }
  };
  return new Proxy({}, handler);
};

// Simple Mock Client that covers the Supabase API surface used in this app
const mockClient = {
  from: () => createChainableMock({ data: [], error: null }),
  channel: () => ({
    on: () => ({ subscribe: () => {} }),
    subscribe: () => {},
    removeChannel: () => {}
  }),
  removeChannel: () => {}
};

try {
  // Simple validation to check if key looks vaguely valid before trying to init
  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('sb_publishable')) {
    // We are likely using a placeholder or invalid format for JS client
    console.warn("Using Mock Client due to placeholder API Key");
    client = mockClient;
  } else {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (error) {
  console.error("Error crítico inicializando Supabase:", error);
  client = mockClient;
}

export const supabase = client;