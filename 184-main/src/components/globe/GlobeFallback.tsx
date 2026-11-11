import React from 'react';

export default function GlobeFallback({ zoom = 0 }: { zoom?: number }) {
  return (
    <div className="flex h-full w-full items-center justify-center select-none pointer-events-none">
      <img
        alt="CyberCast 3D Globe Fallback"
        src="/images/3d-fallback.webp"
        width={600}
        height={600}
        className="place-self-center object-contain opacity-85 filter brightness-110 transition-transform duration-100"
        style={{ transform: `scale(${1 + zoom * 0.3})` }}
      />
    </div>
  );
}
