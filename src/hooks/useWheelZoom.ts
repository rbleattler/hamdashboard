import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook for wheel-zoom functionality on an image element.
 * Port of wheelzoom.js to a React hook.
 */
export function useWheelZoom(
  imgRef: React.RefObject<HTMLImageElement | null>,
  options: { zoom?: number; maxZoom?: number | false } = {}
) {
  const settings = useRef({
    zoom: options.zoom ?? 0.1,
    maxZoom: options.maxZoom ?? false as number | false,
  });

  const state = useRef({
    width: 0,
    height: 0,
    bgWidth: 0,
    bgHeight: 0,
    bgPosX: 0,
    bgPosY: 0,
    previousEvent: null as MouseEvent | null,
    transparentSpaceFiller: '',
    initialized: false,
  });

  const updateBgStyle = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const s = state.current;

    if (s.bgPosX > 0) s.bgPosX = 0;
    else if (s.bgPosX < s.width - s.bgWidth) s.bgPosX = s.width - s.bgWidth;

    if (s.bgPosY > 0) s.bgPosY = 0;
    else if (s.bgPosY < s.height - s.bgHeight)
      s.bgPosY = s.height - s.bgHeight;

    img.style.backgroundSize = s.bgWidth + 'px ' + s.bgHeight + 'px';
    img.style.backgroundPosition = s.bgPosX + 'px ' + s.bgPosY + 'px';
  }, [imgRef]);

  const reset = useCallback(() => {
    const s = state.current;
    s.bgWidth = s.width;
    s.bgHeight = s.height;
    s.bgPosX = s.bgPosY = 0;
    updateBgStyle();
  }, [updateBgStyle]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const s = state.current;

    function setSrcToBackground(imgEl: HTMLImageElement) {
      imgEl.style.backgroundRepeat = 'no-repeat';
      imgEl.style.backgroundImage = 'url("' + imgEl.src + '")';
      s.transparentSpaceFiller =
        'data:image/svg+xml;base64,' +
        window.btoa(
          '<svg xmlns="http://www.w3.org/2000/svg" width="' +
            imgEl.naturalWidth +
            '" height="' +
            imgEl.naturalHeight +
            '"></svg>'
        );
      imgEl.src = s.transparentSpaceFiller;
    }

    function load() {
      if (!img || img.src === s.transparentSpaceFiller) return;

      const computedStyle = window.getComputedStyle(img);
      s.width = parseInt(computedStyle.width, 10);
      s.height = parseInt(computedStyle.height, 10);
      s.bgWidth = s.width;
      s.bgHeight = s.height;
      s.bgPosX = 0;
      s.bgPosY = 0;

      setSrcToBackground(img);

      img.style.backgroundSize = s.bgWidth + 'px ' + s.bgHeight + 'px';
      img.style.backgroundPosition = s.bgPosX + 'px ' + s.bgPosY + 'px';
      s.initialized = true;
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const deltaY = e.deltaY || 0;

      const rect = img!.getBoundingClientRect();
      const offsetX = e.pageX - rect.left - window.pageXOffset;
      const offsetY = e.pageY - rect.top - window.pageYOffset;

      const bgCursorX = offsetX - s.bgPosX;
      const bgCursorY = offsetY - s.bgPosY;

      const bgRatioX = bgCursorX / s.bgWidth;
      const bgRatioY = bgCursorY / s.bgHeight;

      if (deltaY < 0) {
        s.bgWidth += s.bgWidth * settings.current.zoom;
        s.bgHeight += s.bgHeight * settings.current.zoom;
      } else {
        s.bgWidth -= s.bgWidth * settings.current.zoom;
        s.bgHeight -= s.bgHeight * settings.current.zoom;
      }

      if (settings.current.maxZoom) {
        s.bgWidth = Math.min(
          s.width * (settings.current.maxZoom as number),
          s.bgWidth
        );
        s.bgHeight = Math.min(
          s.height * (settings.current.maxZoom as number),
          s.bgHeight
        );
      }

      s.bgPosX = offsetX - s.bgWidth * bgRatioX;
      s.bgPosY = offsetY - s.bgHeight * bgRatioY;

      if (s.bgWidth <= s.width || s.bgHeight <= s.height) {
        reset();
      } else {
        updateBgStyle();
      }
    }

    function drag(e: MouseEvent) {
      e.preventDefault();
      if (s.previousEvent) {
        s.bgPosX += e.pageX - s.previousEvent.pageX;
        s.bgPosY += e.pageY - s.previousEvent.pageY;
      }
      s.previousEvent = e;
      updateBgStyle();
    }

    function removeDrag() {
      document.removeEventListener('mouseup', removeDrag);
      document.removeEventListener('mousemove', drag);
    }

    function draggable(e: MouseEvent) {
      e.preventDefault();
      s.previousEvent = e;
      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', removeDrag);
    }

    if (img.complete) {
      load();
    }

    img.addEventListener('load', load);
    img.addEventListener('wheel', onWheel, { passive: false });
    img.addEventListener('mousedown', draggable);

    return () => {
      img.removeEventListener('load', load);
      img.removeEventListener('wheel', onWheel);
      img.removeEventListener('mousedown', draggable);
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', removeDrag);
    };
  }, [imgRef, reset, updateBgStyle]);

  return { reset };
}
