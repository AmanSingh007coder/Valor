"use client";
import dynamic from 'next/dynamic';
 
// Dynamically import to avoid SSR issues with Leaflet
const ActualMap = dynamic(() => import('./ActualMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-zinc-900 text-zinc-500 text-sm">
      Loading map...
    </div>
  ),
});
 
interface Props {
  suppliers: any[];
  hq?: { lat: number; lng: number };
}
 
// This wrapper MUST forward both props to ActualMap
export default function MapWrapper({ suppliers, hq }: Props) {
  return <ActualMap suppliers={suppliers} hq={hq} />;
}