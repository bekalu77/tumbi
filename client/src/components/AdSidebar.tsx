import React, { useState, useEffect } from 'react';

interface Ad {
  id: string;
  title: string;
  link: string;
  banner: string;
  status: 'on' | 'off';
}

const AdSidebar: React.FC = () => {
  const [allAds, setAllAds] = useState<Ad[]>([]);
  const [displayedAds, setDisplayedAds] = useState<Ad[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await fetch('/api/ads/markdown');
        if (!response.ok) {
          throw new Error('Failed to fetch ads data');
        }
        const allFetchedAds = await response.json() as Ad[];
        const activeAds = allFetchedAds.filter(ad => ad.status === 'on');
        setAllAds(activeAds);
      } catch (err) {
        console.error("Error fetching ad data:", err);
        setError(err as Error);
      }
    };

    fetchAds();
  }, []);

  useEffect(() => {
    if (allAds.length > 0) {
      const shuffleAds = () => {
        const shuffled = [...allAds].sort(() => 0.5 - Math.random());
        setDisplayedAds(shuffled.slice(0, 5));
      };

      shuffleAds(); // Initial display
      const intervalId = setInterval(shuffleAds, 15000); // Shuffle every 15 seconds

      return () => clearInterval(intervalId);
    }
  }, [allAds]);

  if (error) {
    return <div className="p-4 text-red-500">Error loading ads: {error.message}</div>;
  }

  if (displayedAds.length === 0) {
    return <div className="p-4 text-muted-foreground">No ads to display.</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <h3 className="text-lg font-semibold text-center">Advertisements</h3>
      {displayedAds.map((ad) => (
        <div key={ad.id} className="text-center">
          <a href={ad.link ?? '#'} target="_blank" rel="noopener noreferrer" className="block w-full h-40 bg-gray-200 flex items-center justify-center overflow-hidden rounded-lg shadow-md mb-2">
            <img 
              src={ad.banner ?? ''} 
              alt={ad.title ?? 'Ad banner'} 
              className="w-full h-full object-cover" 
            />
          </a>
          <a href={ad.link ?? '#'} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">
            {ad.title}
          </a>
        </div>
      ))}
    </div>
  );
};

export default AdSidebar;
