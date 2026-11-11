'use client';

import dynamic from 'next/dynamic';
import GlobeFallback from './GlobeFallback';

const EarthGlobe = dynamic(() => import('./EarthGlobe'), {
  ssr: false,
  loading: () => <GlobeFallback zoom={0} />,
});

export default EarthGlobe;
