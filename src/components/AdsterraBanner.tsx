import React, { useEffect, useRef } from 'react';

export const AdsterraBanner: React.FC = () => {
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bannerRef.current && !bannerRef.current.firstChild) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = '//www.highperformanceformat.com/09f1d8809bf48bc17265db3f96916867/invoke.js';
      
      const configScript = document.createElement('script');
      configScript.type = 'text/javascript';
      configScript.innerHTML = `
        atOptions = {
          'key' : '09f1d8809bf48bc17265db3f96916867',
          'format' : 'iframe',
          'height' : 50,
          'width' : 320,
          'params' : {}
        };
      `;
      
      bannerRef.current.appendChild(configScript);
      bannerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="w-full flex justify-center py-2 bg-gray-50 dark:bg-[#121212] border-b border-gray-100 dark:border-gray-800">
      <div ref={bannerRef} className="min-h-[50px] min-w-[320px]" />
    </div>
  );
};
