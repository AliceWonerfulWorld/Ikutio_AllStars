// src/utils/device.ts
export const getDeviceType = (): 'smartphone' | 'tablet' | 'desktop' | 'unknown' => {
  const ua = navigator.userAgent;

  if (/iPhone|Android.*Mobile/.test(ua)) {
    return 'smartphone';
  } else if (/iPad|Android(?!.*Mobile)/.test(ua)) {
    return 'tablet';
  } else if (/Macintosh|Windows/.test(ua)) {
    return 'desktop';
  } else {
    return 'unknown';
  }
};