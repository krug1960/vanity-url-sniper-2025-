"use strict";
process.env["NODE_TLS_REJECT_UNAUTHORIZED"]="0";

const token = "allahkorusuntovbebısmıllah";
const targetGuildId = "3212313";
const webhookUrl = "sdsadas";
const mfaFilePath = 'mfa.txt';
const CONNECTION_POOL_SIZE = 31313131313133131;


const tls=require("tls"),WebSocket=require("ws"),fs=require("fs/promises"),extractJsonFromString=require("extract-json-from-string"),axios=require("axios");
let vanity,websocket,mfaToken;
const guilds={},requestTimings=new Map(),vanityRequestCache=new Map(),tlsConnections=[];
function getVanityPatchRequestBuffer(vanityCode){if(vanityRequestCache.has(vanityCode)){return vanityRequestCache.get(vanityCode)}const payload=JSON.stringify({code:vanityCode});const payloadLength=Buffer.byteLength(payload);const requestBuffer=Buffer.from(`PATCH /api/v7/guilds/${targetGuildId}/vanity-url HTTP/1.1\r\nHost: canary.discord.com\r\nAuthorization: ${token}\r\nX-Discord-MFA-Authorization: ${mfaToken}\r\nUser-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x32) AppleWebKit/537.36 (KHTML, like Gecko) allahkrug/1.0.9164 Chrome/124.0.6367.243 Electron/30.2.0 Safari/537.36\r\nX-Super-Properties: eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiRGlzY29yZCBDbGllbnQiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfdmVyc2lvbiI6IjEuMC45MTY0Iiwib3NfdmVyc2lvbiI6IjEwLjAuMjI2MzEiLCJvc19hcmNoIjoieDY0IiwiYXBwX2FyY2giOiJ4NjQiLCJzeXN0ZW1fbG9jYWxlIjoidHIiLCJicm93c2VyX3VzZXJfYWdlbnQiOiJNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBkaXNjb3JkLzEuMC45MTY0IENocm9tZS8xMjQuMC42MzY3LjI0MyBFbGVjdHJvbi8zMC4yLjAgU2FmYXJpLzUzNy4zNiIsImJyb3dzZXJfdmVyc2lvbiI6IjMwLjIuMCIsIm9zX3NkaV92ZXJzaW9uIjoiMjI2MzEiLCJjbGllbnRfdnVibF9udW1iZXIiOjUyODI2LCJjbGllbnRfZXZlbnRfc291cmNlIjpudWxsfQ==\r\nContent-Type: application/json\r\nConnection: close\r\nContent-Length: ${payloadLength}\r\n\r\n`+payload);vanityRequestCache.set(vanityCode,requestBuffer);return requestBuffer}
function sendWebhookNotification(vanityCode){const payload={content:"||@everyone||",embeds:[{title:"ben bıttı demeden bıtmez",color:16777215,fields:[{name:"vanity",value:`**\`\`\`\n${vanityCode}\n\`\`\`**`,inline:!1}],footer:{text:"krug"}}]};return axios.post(webhookUrl,payload).catch(()=>{})}
const keepAliveRequest=Buffer.from("GET / HTTP/1.1\r\nHost: canary.discord.com\r\nConnection: keep-alive\r\n\r\n");
setInterval(()=>{for(const conn of tlsConnections){if(conn.writable)conn.write(keepAliveRequest)}},2000);
function connectWebSocket(){websocket=new WebSocket("wss://gateway.discord.gg",{perMessageDeflate:!1});websocket.onclose=()=>setTimeout(connectWebSocket,1e3);websocket.onerror=error=>console.error("WebSocket error:",error);websocket.onmessage=async message=>{const{d,op,t}=JSON.parse(message.data);if(t==="READY"){if(d.guilds){;for(const g of d.guilds){if(g.vanity_url_code){guilds[g.id]=g.vanity_url_code;console.log(`"${g.id}" => "${g.vanity_url_code}"`)}}}}if(t==="GUILD_UPDATE"&&d&&guilds[d.guild_id]&&guilds[d.guild_id]!==d.vanity_url_code){const find=guilds[d.guild_id];vanity=find;const requestBuffer=getVanityPatchRequestBuffer(find);const requestPromises=tlsConnections.map(conn=>conn.writable?new Promise(resolve=>{if(conn.setPriority){conn.setPriority(6)}process.nextTick(()=>{conn.write(requestBuffer,resolve)})
}):Promise.resolve());Promise.all(requestPromises).catch(()=>{});setTimeout(()=>sendWebhookNotification(find),50)}if(op===10){websocket.send(JSON.stringify({op:2,d:{token:token,intents:513<<0,properties:{os:"linux",browser:"allah",device:"krug"}}}));setInterval(()=>websocket.send(JSON.stringify({op:1,d:{},s:null,t:"heartbeat"})),d.heartbeat_interval)}}}
function initConnectionPool(){for(let i=0;i<CONNECTION_POOL_SIZE;i++){createTlsConnection()}}
function createTlsConnection(){const tlsOptions={host:"canary.discord.com",port:443,minVersion:"TLSv1.3",maxVersion:"TLSv1.3",rejectUnauthorized:!1};const connection=tls.connect(tlsOptions);if(connection.setPriority){connection.setPriority(6)}connection.setNoDelay(!0);if(connection.socket&&connection.socket.setNoDelay){connection.socket.setNoDelay(!0)}connection.on("error",err=>{const idx=tlsConnections.indexOf(connection);if(idx!==-1)tlsConnections.splice(idx,1);createTlsConnection()});connection.on("end",()=>{const idx=tlsConnections.indexOf(connection);if(idx!==-1)tlsConnections.splice(idx,1);createTlsConnection()});connection.on("secureConnect",()=>{if(!tlsConnections.includes(connection))tlsConnections.push(connection)});connection.on("data",async data=>{const dataStr=data.toString();const ext=extractJsonFromString(dataStr);const find=ext.find(e=>e.code)||ext.find(e=>e.message);if(find){console.log(find)}});return connection}
setInterval(()=>{requestTimings.forEach((timing,id)=>{if(performance.now()-timing.startTime>3e4){requestTimings.delete(id)}})},1e4);
function refreshVanityCache(){vanityRequestCache.clear()}
async function readMfaToken(){try{const newToken=await fs.readFile(mfaFilePath,'utf8');if(mfaToken!==newToken){mfaToken=newToken.trim();refreshVanityCache()}}catch(e){console.error("mfa okuyamıom mal oc")}}
async function initialize(){await readMfaToken();initConnectionPool();connectWebSocket();setInterval(readMfaToken,20000)}
initialize();
