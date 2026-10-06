import { router, useLocalSearchParams } from 'expo-router';
import { useMatchReviews } from '../../presentation/SessionContext';
import { findMatchReview } from '../../review/history';
import MatchReviewScreen from '../../screens/MatchReviewScreen';
export default function ReviewRoute(){
 const {id}=useLocalSearchParams<{id:string}>();
 const review=findMatchReview(useMatchReviews(),typeof id==='string'?id:'');
 return <MatchReviewScreen review={review} onBack={()=>{if(router.canGoBack())router.back();else router.replace('/');}} />;
}
