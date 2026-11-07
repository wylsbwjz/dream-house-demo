import { useCallback, useEffect, useRef, useState } from 'react';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/**
 * 带边界的平移缩放。容器上的 wheel 使用非被动监听，避免页面滚动。
 * 画布卡片、按钮等交互元素标记 data-no-pan，避免拖拽误触。
 */
export function usePanZoom({ boardW, boardH, min = 0.45, max = 2.6, padding = 56, initialView = null }) {
  const containerRef = useRef(null);
  const [cam, setCam] = useState({ x: 0, y: 0, s: 1 });
  const camRef = useRef(cam);
  const panRef = useRef(null);
  const [panning, setPanning] = useState(false);
  const interacted = useRef(false);
  const initialized = useRef(false);

  const commit = useCallback((next) => {
    camRef.current = next;
    setCam(next);
  }, []);

  const fit = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const s = clamp(
      Math.min((rect.width - padding * 2) / boardW, (rect.height - padding * 2) / boardH),
      min,
      max
    );
    commit({
      s,
      x: (rect.width - boardW * s) / 2,
      y: (rect.height - boardH * s) / 2,
    });
    interacted.current = false;
  }, [boardW, boardH, min, max, padding, commit]);

  useEffect(() => {
    if (initialView && !initialized.current) {
      const el = containerRef.current;
      if (!el) return undefined;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return undefined;
      const s = clamp(initialView.s ?? 0.8, min, max);
      commit({
        s,
        x: rect.width / 2 - initialView.x * s,
        y: rect.height / 2 - initialView.y * s,
      });
      initialized.current = true;
      interacted.current = true;
      return undefined;
    }
    const id = requestAnimationFrame(fit);
    return () => cancelAnimationFrame(id);
  }, [fit, initialView, min, max, commit]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const onWheel = (event) => {
      event.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = event.clientX - rect.left;
      const my = event.clientY - rect.top;
      const current = camRef.current;
      const factor = Math.exp(-event.deltaY * 0.0014);
      const ns = clamp(current.s * factor, min, max);
      const k = ns / current.s;
      interacted.current = true;
      commit({
        s: ns,
        x: mx - (mx - current.x) * k,
        y: my - (my - current.y) * k,
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    const ro = new ResizeObserver(() => {
      if (!interacted.current) fit();
    });
    ro.observe(el);
    return () => {
      el.removeEventListener('wheel', onWheel);
      ro.disconnect();
    };
  }, [fit, min, max, commit]);

  const zoomAt = useCallback(
    (factor, cx, cy) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const mx = cx ?? rect.width / 2;
      const my = cy ?? rect.height / 2;
      const current = camRef.current;
      const ns = clamp(current.s * factor, min, max);
      const k = ns / current.s;
      interacted.current = true;
      commit({
        s: ns,
        x: mx - (mx - current.x) * k,
        y: my - (my - current.y) * k,
      });
    },
    [min, max, commit]
  );

  const zoomIn = useCallback(() => zoomAt(1.2), [zoomAt]);
  const zoomOut = useCallback(() => zoomAt(1 / 1.2), [zoomAt]);

  const onPointerDown = useCallback((event) => {
    if (event.button !== 0) return;
    if (event.target.closest('[data-no-pan],button,a,input,textarea,select,.ant-drawer,.ant-modal')) return;
    const el = containerRef.current;
    panRef.current = {
      px: event.clientX,
      py: event.clientY,
      x: camRef.current.x,
      y: camRef.current.y,
    };
    setPanning(true);
    el?.setPointerCapture?.(event.pointerId);
  }, []);

  const onPointerMove = useCallback((event) => {
    if (!panRef.current) return;
    interacted.current = true;
    commit({
      ...camRef.current,
      x: panRef.current.x + (event.clientX - panRef.current.px),
      y: panRef.current.y + (event.clientY - panRef.current.py),
    });
  }, [commit]);

  const onPointerUp = useCallback(() => {
    panRef.current = null;
    setPanning(false);
  }, []);

  const centerOn = useCallback(
    (bx, by, scale) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const s = scale || camRef.current.s;
      commit({ s, x: rect.width / 2 - bx * s, y: rect.height / 2 - by * s });
    },
    [commit]
  );

  return {
    containerRef,
    cam,
    panning,
    fit,
    zoomIn,
    zoomOut,
    centerOn,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  };
}
