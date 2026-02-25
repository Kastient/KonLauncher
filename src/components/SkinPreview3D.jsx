import React, { useEffect, useRef, useState } from 'react';

const DEFAULT_WIDTH = 320;
const DEFAULT_HEIGHT = 420;

export default function SkinPreview3D({ skinDataUrl = '', capeDataUrl = '', model = 'wide', className = '' }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const viewerRef = useRef(null);
  const [initError, setInitError] = useState('');
  const [viewerReady, setViewerReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    let resizeObserver = null;

    const initViewer = async () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      try {
        const skinview3d = await import('skinview3d');
        if (disposed) return;

        const width = Math.max(180, Math.round(container.clientWidth || DEFAULT_WIDTH));
        const height = Math.max(240, Math.round(container.clientHeight || DEFAULT_HEIGHT));
        const viewer = new skinview3d.SkinViewer({
          canvas,
          width,
          height
        });

        viewer.zoom = 0.9;
        viewer.fov = 65;
        viewer.controls.enablePan = false;
        viewer.controls.enableZoom = false;
        viewer.controls.rotateSensitivity = 0.6;
        viewer.animation = new skinview3d.IdleAnimation();

        viewerRef.current = viewer;
        setInitError('');
        setViewerReady(true);

        resizeObserver = new ResizeObserver(() => {
          const nextWidth = Math.max(180, Math.round(container.clientWidth || DEFAULT_WIDTH));
          const nextHeight = Math.max(240, Math.round(container.clientHeight || DEFAULT_HEIGHT));
          viewer.width = nextWidth;
          viewer.height = nextHeight;
        });
        resizeObserver.observe(container);
      } catch (error) {
        if (!disposed) {
          setInitError(error?.message || 'Viewer initialization failed.');
        }
      }
    };

    initViewer();

    return () => {
      disposed = true;
      if (resizeObserver) resizeObserver.disconnect();
      if (viewerRef.current) {
        try {
          viewerRef.current.dispose();
        } catch {
          // noop
        }
        viewerRef.current = null;
      }
      setViewerReady(false);
    };
  }, []);

  useEffect(() => {
    if (!viewerReady) return;
    const viewer = viewerRef.current;
    if (!viewer) return;

    const result = viewer.loadSkin(skinDataUrl || null, { model: model === 'slim' ? 'slim' : 'default' });
    if (result && typeof result.catch === 'function') {
      result.catch(() => {});
    }
  }, [viewerReady, skinDataUrl, model]);

  useEffect(() => {
    if (!viewerReady) return;
    const viewer = viewerRef.current;
    if (!viewer) return;

    const result = viewer.loadCape(capeDataUrl || null);
    if (result && typeof result.catch === 'function') {
      result.catch(() => {});
    }
  }, [viewerReady, capeDataUrl]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden rounded-2xl bg-[#090c14] ${className}`.trim()}>
      <canvas ref={canvasRef} className="h-full w-full" />
      {initError ? (
        <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs font-bold text-red-300">
          {initError}
        </div>
      ) : null}
    </div>
  );
}
