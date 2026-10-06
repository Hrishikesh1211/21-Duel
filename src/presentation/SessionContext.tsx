import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';
import { competitiveReducer, type CompetitiveSession, type SessionAction } from '../competitive/session';
import { localProfileSeed } from '../data/localProfile';
import { localPlayer } from '../data/localPlayer';
import type { MatchReview } from '../review/history';
const emptyReviews:readonly MatchReview[]=Object.freeze([]);
const SessionContext=createContext<{session:CompetitiveSession;dispatch:(action:SessionAction)=>void}|null>(null);
const ReviewContext=createContext<readonly MatchReview[]>(emptyReviews);
export function SessionProvider({children}:{children:ReactNode}){
 const [session,dispatch]=useReducer(competitiveReducer,{...localProfileSeed,player:localPlayer,activeMatchId:null,nextMatchId:1,result:null});
 const value=useMemo(()=>({session,dispatch}),[session]);
 return <SessionContext.Provider value={value}><ReviewContext.Provider value={session.matchReviews??emptyReviews}>{children}</ReviewContext.Provider></SessionContext.Provider>;
}
export function useSession(){const value=useContext(SessionContext);if(!value)throw new Error('SessionProvider is required.');return value;}
// The review route receives only immutable public records, with no dispatch API.
export function useMatchReviews(){return useContext(ReviewContext);}
