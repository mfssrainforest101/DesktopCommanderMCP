import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { Sandbox } from '@vercel/sandbox';
import { z } from 'zod';
import { authorize } from '../../../lib/auth.js';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request) {
 const auth = await authorize(request);
 if(auth.status!==200) return Response.json({error:auth.status===503?'Authentication is not configured or unavailable':'Unauthorized'}, {status:auth.status,headers:{'Cache-Control':'no-store'}});
 if (Number(request.headers.get('content-length')||0)>32768) return new Response('Request too large',{status:413});
 const raw = await request.text();
 if(Buffer.byteLength(raw)>32768) return new Response('Request too large',{status:413});
 let body; try{body=JSON.parse(raw)}catch{return new Response('Invalid JSON',{status:400})}
 const server = new McpServer({name:'wayfinder-desktop-commander',version:'1.0.0'});
 server.registerTool('execution_options',{description:'Inspect available execution modes.',inputSchema:{}},async()=>({content:[{type:'text',text:JSON.stringify({local:'Use Desktop Commander stdio on your computer',cloud:process.env.MCP_ENABLE_CLOUD_EXECUTION==='true',deviceRelay:'Use upstream remote service; self-hosted relay not implemented'})}]}));
 server.registerTool('cloud_execute',{description:'Execute a shell command in a fresh isolated cloud sandbox. No persistent state or network access.',inputSchema:{command:z.string().min(1).max(4096)}},async({command})=>{
 if(process.env.MCP_ENABLE_CLOUD_EXECUTION!=='true')return {isError:true,content:[{type:'text',text:'Cloud execution is disabled by the operator.'}]};
 let sandbox;
 try {sandbox=await Sandbox.create({runtime:'node24',timeout:30000,networkPolicy:'deny-all'});
 const result=await sandbox.runCommand('sh',['-lc',command]);
 return {isError:result.exitCode!==0,content:[{type:'text',text:JSON.stringify({exitCode:result.exitCode,stdout:(await result.stdout()).slice(0,16000),stderr:(await result.stderr()).slice(0,16000)})}]};
 }catch{return {isError:true,content:[{type:'text',text:'Sandbox execution failed or timed out.'}]};}finally{if(sandbox)await sandbox.stop().catch(()=>{});}
 });
 const transport=new WebStandardStreamableHTTPServerTransport({sessionIdGenerator:undefined,enableJsonResponse:true});
 await server.connect(transport);
 try{return await transport.handleRequest(request,{parsedBody:body});}finally{await server.close();}
}
export function GET(){return new Response('Use authenticated Streamable HTTP POST',{status:405,headers:{Allow:'POST'}})}
export const DELETE=GET;
