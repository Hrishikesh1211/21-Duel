export type CosmeticIdentity = { playerCardId: string; titleId: string; cardBackId: string; actionStyleId: string; twentyOneEffectId: string };
export type CosmeticSlot = Exclude<keyof CosmeticIdentity, 'titleId'>;
export type GeometryLine = { x: number; y: number; length: number; vertical?: boolean; muted?: boolean; accent?: boolean };
export type CosmeticConfig = { lines?: readonly GeometryLine[]; mark?: 'duel' | 'mirror' | 'closure' | 'split'; background?: string; showWord?: boolean; tilt?: number; stroke?: number; open?: number; hold?: number; close?: number; separation?: number };
export type Cosmetic = Readonly<{ id: string; category: string; slot: CosmeticSlot; name: string; description: string; detail: string; preview: { kind: 'identity' | 'back' | 'action' | 'finish' }; visual: CosmeticConfig }>;
export const defaultCosmetics: Readonly<CosmeticIdentity> = { playerCardId: 'duel-standard', titleId: 'untitled', cardBackId: 'steel-lines', actionStyleId: 'signature', twentyOneEffectId: 'twenty-one-standard' };
export const loadoutSlots = [
  { field: 'playerCardId', label: 'PLAYER CARD', category: 'PLAYER CARDS' },
  { field: 'cardBackId', label: 'CARD BACK', category: 'CARD BACKS' },
  { field: 'actionStyleId', label: 'ACTION STYLE', category: 'ACTION STYLES' },
  { field: 'twentyOneEffectId', label: '21 EFFECT', category: '21 EFFECTS' },
] as const;
const item = (id: string, slot: CosmeticSlot, name: string, description: string, kind: Cosmetic['preview']['kind'], visual: CosmeticConfig): Cosmetic => ({ id, slot, category: loadoutSlots.find(s => s.field === slot)!.category, name, description, detail: description, preview: { kind }, visual });
export const cosmeticCatalog: readonly Cosmetic[] = [
  item('duel-standard','playerCardId','Duel Standard','Opposing lines. A quiet presence across the table.','identity',{background:'#171B1E',lines:[{x:0,y:30,length:82},{x:12,y:44,length:62,muted:true},{x:68,y:0,length:100,vertical:true},{x:68,y:64,length:32,accent:true},{x:78,y:78,length:22,muted:true}]}),
  item('night-signal','playerCardId','Night Signal','Offset signals against a deeper field.','identity',{background:'#15191D',lines:[{x:0,y:22,length:52},{x:24,y:42,length:70},{x:8,y:62,length:42,muted:true},{x:76,y:18,length:66,vertical:true}]}),
  item('mirror-frame','playerCardId','Mirror Frame','Two equal frames. One central axis.','identity',{background:'#171B1E',lines:[{x:8,y:20,length:32},{x:60,y:20,length:32},{x:8,y:80,length:32},{x:60,y:80,length:32},{x:8,y:20,length:60,vertical:true},{x:92,y:20,length:60,vertical:true},{x:50,y:8,length:84,vertical:true,muted:true}]}),
  item('steel-lines','cardBackId','Steel Lines','The original steel frame and center mark.','back',{mark:'duel'}),
  item('split-axis','cardBackId','Split Axis','An offset axis divides two restrained signals.','back',{lines:[{x:42,y:12,length:76,vertical:true},{x:14,y:35,length:28},{x:42,y:65,length:44}]}),
  item('mirror-mark','cardBackId','Mirror Mark','Balanced twin marks around a shared center.','back',{mark:'mirror',lines:[{x:50,y:12,length:76,vertical:true,muted:true}]}),
  item('signature','actionStyleId','Signature','The familiar TAP and KNOCK, with a light contact stroke.','action',{showWord:true,tilt:0,stroke:0.7}),
  item('ink-knock','actionStyleId','Ink Knock','Slanted lettering and slightly stronger ink strokes.','action',{showWord:true,tilt:-7,stroke:1.1}),
  item('minimal','actionStyleId','Minimal','Physical pressure and contact, without lettering.','action',{showWord:false,tilt:0,stroke:0}),
  item('twenty-one-standard','twentyOneEffectId','Twenty One','The original split digits and signature mark.','finish',{mark:'duel',open:170,hold:200,close:230,separation:11}),
  item('precision','twentyOneEffectId','Precision','A thin geometric closure with a shorter resolution.','finish',{mark:'closure',open:100,hold:100,close:160,separation:6}),
  item('line-break','twentyOneEffectId','Line Break','A brief split line resolves around twenty one.','finish',{mark:'split',open:140,hold:140,close:180,separation:12}),
];
export function getCosmetic(id: string, slot?: CosmeticSlot): Cosmetic {
  return cosmeticCatalog.find(c => c.id === id && (!slot || c.slot === slot)) ?? cosmeticCatalog.find(c => c.id === defaultCosmetics[slot ?? 'playerCardId'])!;
}
export function getEquippedCosmetic(identity: Partial<CosmeticIdentity>, slot: CosmeticSlot): Cosmetic { return getCosmetic(identity[slot] ?? defaultCosmetics[slot], slot); }
export function equippedCosmetics(identity: Partial<CosmeticIdentity>) { return loadoutSlots.map(slot => ({...slot,item:getEquippedCosmetic(identity,slot.field)})); }
