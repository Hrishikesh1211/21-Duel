import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { defaultCosmetics, getEquippedCosmetic, type CosmeticIdentity, type CosmeticSlot } from '../data/cosmetics';
const LoadoutContext = createContext<Partial<CosmeticIdentity>>(defaultCosmetics);
export function CosmeticProvider({ loadout, children }: { loadout: Partial<CosmeticIdentity>; children: ReactNode }) { return <LoadoutContext.Provider value={loadout}>{children}</LoadoutContext.Provider>; }
export function useEquippedCosmetic(slot: CosmeticSlot) { return getEquippedCosmetic(useContext(LoadoutContext), slot); }
