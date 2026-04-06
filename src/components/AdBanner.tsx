import React from 'react';

interface AdBannerProps {
  unitId: string;
  format: 'banner' | 'interstitial' | 'rewarded';
}

/**
 * AdBanner Component
 * Simulates AdMob placement for the web environment.
 * In a real mobile app, this would use the AdMob SDK with the provided IDs.
 * 
 * Provided IDs:
 * App ID: ca-app-pub-4406624365938213~9891024421
 * Banner: ca-app-pub-4406624365938213/5348106774 (Niraj_Calc_Top_Banner)
 * Interstitial: ca-app-pub-4406624365938213/5018700649 (Niraj_Interstitial_Equal)
 * Rewarded: ca-app-pub-4406624365938213/5335131501 (Good)
 */
export const AdBanner: React.FC<AdBannerProps> = ({ unitId, format }) => {
  return (
    <div className={`w-full bg-gray-100 dark:bg-gray-800 border border-dashed border-gray-400 dark:border-gray-600 rounded-lg flex items-center justify-center overflow-hidden my-2 ${format === 'banner' ? 'h-16' : 'h-32'}`}>
      <div className="text-center p-2">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-bold mb-1">Sponsored</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Ad Unit: {unitId.split('/').pop()}</p>
        <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1">Real AdMob integration requires native mobile environment</p>
      </div>
    </div>
  );
};
