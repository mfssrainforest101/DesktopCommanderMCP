import { createClient } from '@supabase/supabase-js';
export function authConfig() {
 return { url: process.env.MCP_SUPABASE_URL, key: process.env.MCP_SUPABASE_ANON_KEY, users: (process.env.MCP_ALLOWED_USER_IDS || '').split(',').map(s=>s.trim()).filter(Boolean) };
}
export async function authorize(request) {
 const c = authConfig();
 if (!c.url || !c.key || !c.users.length) return {status:503};
 const match = /^Bearer (\S+)$/i.exec(request.headers.get('authorization') || '');
 if (!match) return {status:401};
 const client = createClient(c.url,c.key,{auth:{persistSession:false,autoRefreshToken:false}});
 try { const {data,error} = await client.auth.getUser(match[1]);
 if (error || !data.user) return {status:401};
 if (!c.users.includes(data.user.id)) return {status:403};
 return {status:200,user:data.user.id}; } catch { return {status:503}; }
}
