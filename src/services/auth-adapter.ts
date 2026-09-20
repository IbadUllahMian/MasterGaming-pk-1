/** Frontend-safe client for the Payload platform-users authentication collection. */
export type AuthRole='Player'|'Admin';
export type GamingIdentity={freeFireUid?:string;inGameName?:string;region?:string;preferredMode?:'br'|'cs'|'lone-wolf';officialGameRank?:string};
export type AuthUser={id:string;name:string;username:string;email:string;mobileNumber?:string;role:AuthRole;createdAt:string;gamingIdentity?:GamingIdentity};
export type AuthSession={user:AuthUser;issuedAt:string;expiresAt:string;source:'backend'}|null;
export type SignupRequest={username:string;name:string;email:string;mobileNumber:string;password:string;freeFireUid:string;inGameName:string};
export type LoginRequest={identity:string;password:string;rememberSession?:boolean};
export type PasswordResetRequest={email:string};
export type AuthResult={ok:boolean;state:'authenticated'|'created'|'error';message:string;session?:AuthSession};
export type AuthNavigationState={authenticated:boolean;links:{label:string;href:string}[];showLogout:boolean};
type PayloadUser={id:number|string;email:string;full_name:string;username:string;mobile_number?:string;role:AuthRole;free_fire_uid?:string;in_game_name?:string;createdAt:string};
const endpoint='/cms-api/platform-users';
const messageFor=async(response:Response)=>{const body=await response.json().catch(()=>null) as {message?:string;errors?:{message?:string}[]}|null;return body?.errors?.[0]?.message||body?.message||'We could not complete that request.';};
const toSession=(user:PayloadUser):AuthSession=>({user:{id:String(user.id),name:user.full_name,username:user.username,email:user.email,mobileNumber:user.mobile_number,role:user.role,createdAt:user.createdAt,gamingIdentity:{freeFireUid:user.free_fire_uid,inGameName:user.in_game_name}},issuedAt:new Date().toISOString(),expiresAt:'' ,source:'backend'});
export const authAdapter={
 getSession:async():Promise<AuthSession>=>{try{const response=await fetch(`${endpoint}/me`,{credentials:'include',cache:'no-store'});if(!response.ok)return null;const body=await response.json() as {user?:PayloadUser};return body.user?toSession(body.user):null;}catch{return null;}},
 signup:async(request:SignupRequest):Promise<AuthResult>=>{try{const response=await fetch(endpoint,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({full_name:request.name,username:request.username,email:request.email,password:request.password,mobile_number:request.mobileNumber,free_fire_uid:request.freeFireUid,in_game_name:request.inGameName})});if(!response.ok)return {ok:false,state:'error',message:await messageFor(response)};return {ok:true,state:'created',message:'Your player account has been created. Sign in to continue.'};}catch{return {ok:false,state:'error',message:'The account service is unavailable. Please try again.'};}},
 login:async(request:LoginRequest):Promise<AuthResult>=>{try{const response=await fetch(`${endpoint}/login`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:request.identity,password:request.password})});if(!response.ok)return {ok:false,state:'error',message:await messageFor(response)};const body=await response.json() as {user:PayloadUser};return {ok:true,state:'authenticated',message:'You are signed in.',session:toSession(body.user)};}catch{return {ok:false,state:'error',message:'The sign-in service is unavailable. Please try again.'};}},
 requestPasswordReset:async(request:PasswordResetRequest):Promise<AuthResult>=>{try{const response=await fetch(`${endpoint}/forgot-password`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:request.email})});return response.ok?{ok:true,state:'created',message:'If an account matches that email, reset instructions have been requested.'}:{ok:false,state:'error',message:await messageFor(response)};}catch{return {ok:false,state:'error',message:'The account service is unavailable. Please try again.'};}},
 logout:async():Promise<void>=>{try{await fetch(`${endpoint}/logout`,{method:'POST',credentials:'include'});}catch{/* The local session state is still cleared by the caller. */}},
 canAccessAdmin:(session:AuthSession)=>session?.user.role==='Admin',
};
export function getAuthNavigation(session:AuthSession):AuthNavigationState{return session?{authenticated:true,links:[{label:'Dashboard',href:'/account'},{label:'Profile',href:'/profile'}],showLogout:true}:{authenticated:false,links:[{label:'Login',href:'/login'},{label:'Create account',href:'/register'}],showLogout:false}}
