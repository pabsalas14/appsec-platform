'use client';

import React, { useEffect, useState } from 'react';

/**
 * Renders an image fetched from an authenticated API endpoint.
 * Browser cookies carry auth automatically; the component only needs to
 * fetch the resource and render the resulting blob URL.
 */
export default function AuthImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    async function load() {
      try {
        // Cookies are sent automatically — no need for localStorage token
        const res = await fetch(src, {
          credentials: 'include',
        });
        if (!res.ok) {
          setError(true);
          return;
        }
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch {
        if (!cancelled) setError(true);
      }
    }

    load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (error) return null;
  if (!blobUrl) {
    return (
      <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 48 }}>
        <span className="text-muted-foreground text-xs">Loading image…</span>
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element -- authenticated blob URL, next/image cannot proxy it
  return <img src={blobUrl} alt={alt} className={className} />;
}
