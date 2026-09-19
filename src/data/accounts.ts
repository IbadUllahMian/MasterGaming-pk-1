// Production-honest client data boundary. These collections remain empty until a verified backend supplies records.
export type Player = { id:string; username:string; displayName:string; region:string; rank:number; points:number; wins:number; matches:number; teamId?:string; status:string };
export type Team = { id:string; name:string; tag:string; region:string; captainId:string; memberIds:string[]; rank:number; points:number; wins:number; matches:number; mode:string; status:string; description:string };
export const players: Player[] = [];
export const teams: Team[] = [];
export const currentPlayer: Player | null = null;
export const achievements: {name:string;description:string;earned:string;locked:boolean}[] = [];
export const history: {name:string;date:string;mode:string;placement:string;points:string;result:string;status:string;id:string}[] = [];
