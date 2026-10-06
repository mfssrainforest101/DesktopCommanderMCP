import { authConfig } from '../../../lib/auth.js';
export const dynamic = 'force-dynamic';
export function GET() { const c=authConfig(); return Response.json({status:'ok',mcp:'/api/mcp',authenticationConfigured:!!(c.url&&c.key&&c.users.length),cloudExecutionEnabled:process.env.MCP_ENABLE_CLOUD_EXECUTION==='true',localDesktop:'stdio client',selfHostedDeviceRelay:'not implemented'}); }
