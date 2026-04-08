"use client";
import dynamic from 'next/dynamic';

// This dynamic import prevents SSR errors
const Map = dynamic(() => import('./ActualMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-900 animate-pulse" />
});

export default function MapWrapper() {
  return <Map />;
}