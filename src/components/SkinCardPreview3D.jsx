import React, { useEffect, useRef, useState } from 'react';

const DEFAULT_WIDTH = 240;
const DEFAULT_HEIGHT = 180;
const FRONT_ROTATION_Y = 0;
const BACK_ROTATION_Y = Math.PI;

export default function SkinCardPreview3D({ skinDataUrl = '', capeDataUrl = '', model = 'wide', className = '' }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const viewerRef = useRef(null);
  const targetRotationRef = useRef(FRONT_ROTATION_Y);
  const animationFrameRef = useRef(null);
  const [initError, setInitError] = useState('');
  const [viewerReady, setViewerReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    let resizeObserver = null;

    const stopAnimation = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    const startRotationLoop = () => {
      const tick = () => {
        const viewer = viewerRef.current;
        if (!viewer || !viewer.playerObject) {
          animationFrameRef.current = requestAnimationFrame(tick);
          return;
        }

        const current = Number(viewer.playerObject.rotation.y || 0);
        const target = Number(targetRotationRef.current || 0);
        const diff = target - current;

        if (Math.abs(diff) > 0.001) {
          viewer.playerObject.rotation.y = current + diff * 0.17;
        } else {
          viewer.playerObject.rotation.y = target;
        }

        animationFrameRef.current = requestAnimationFrame(tick);
      };

      stopAnimation();
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    const initViewer = async () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      try {
        const skinview3d = await import('skinview3d');
        if (disposed) return;

        const width = Math.max(160, Math.round(container.clientWidth || DEFAULT_WIDTH));
        const height = Math.max(120, Math.round(container.clientHeight || DEFAULT_HEIGHT));
        const viewer = new skinview3d.SkinViewer({
          canvas,
          width,
          height
        });

        viewer.zoom = 0.9;
        viewer.fov = 65;
        viewer.controls.enablePan = false;
        viewer.controls.enableZoom = false;
        viewer.controls.enableRotate = false;
        viewer.animation = null;
        viewer.playerObject.rotation.y = FRONT_ROTATION_Y;
        targetRotationRef.current = FRONT_ROTATION_Y;

        viewerRef.current = viewer;
        setInitError('');
        setViewerReady(true);
        startRotationLoop();

        resizeObserver = new ResizeObserver(() => {
          const nextWidth = Math.max(160, Math.round(container.clientWidth || DEFAULT_WIDTH));
          const nextHeight = Math.max(120, Math.round(container.clientHeight || DEFAULT_HEIGHT));
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
      stopAnimation();
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
    <div
      ref={containerRef}
      onMouseEnter={() => {
        targetRotationRef.current = BACK_ROTATION_Y;
      }}
      onMouseLeave={() => {
        targetRotationRef.current = FRONT_ROTATION_Y;
      }}
      className={`relative overflow-hidden rounded-2xl bg-[#131722] ${className}`.trim()}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
      {initError ? (
        <div className="absolute inset-0 flex items-center justify-center px-3 text-center text-[11px] font-bold text-red-300">
          {initError}
        </div>
      ) : null}
    </div>
  );
}
