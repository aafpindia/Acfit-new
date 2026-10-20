import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const siteUrl = import.meta.env.VITE_SITE_URL || 'http://localhost:3000'

// Check if credentials are valid and not placeholders
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY'
)

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Supabase environment variables are missing or set to placeholders. \n' +
    'The application will run in MOCK AUTH MODE using localStorage. \n' +
    'To connect real Supabase Auth, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
  );
}

// Initialize real client if configured, otherwise provide a safe proxy
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : new Proxy({}, {
      get(target, prop) {
        // Allow chaining: supabase.from('x').select('*') etc.
        if (prop === 'auth') {
          return new Proxy({}, {
            get(_, authProp) {
              return (...args) => {
                console.warn(`Supabase Auth not configured. Intercepted: auth.${String(authProp)}`);
                return Promise.resolve({ data: { session: null, user: null, subscription: { unsubscribe: () => {} } }, error: null });
              };
            }
          });
        }
        if (prop === 'from') {
          return (table) => {
            const chainProxy = new Proxy({}, {
              get(_, method) {
                return (...args) => {
                  console.warn(`Supabase not configured. Intercepted: from('${table}').${String(method)}()`);
                  return Promise.resolve({ data: null, error: new Error('Supabase client is unconfigured.'), count: 0 });
                };
              }
            });
            return chainProxy;
          };
        }
        return () => {
          console.warn(`Supabase not configured. Intercepted call to: "${String(prop)}"`);
          return Promise.resolve({ data: null, error: new Error('Supabase client is unconfigured.') });
        };
      }
    });

export default supabase;
