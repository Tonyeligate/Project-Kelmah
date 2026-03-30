import { BOTTOM_NAV_HEIGHT } from '../constants/layout';

export const SAFE_AREA_TOP = 'env(safe-area-inset-top, 0px)';
export const SAFE_AREA_BOTTOM = 'env(safe-area-inset-bottom, 0px)';

const addInset = (basePx, insetVar) => {
  const base = Number(basePx);
  if (!Number.isFinite(base) || base <= 0) {
    return insetVar;
  }
  return `calc(${base}px + ${insetVar})`;
};

export const withSafeAreaTop = (basePx = 0) => addInset(basePx, SAFE_AREA_TOP);

export const withSafeAreaBottom = (basePx = 0) =>
  addInset(basePx, SAFE_AREA_BOTTOM);

export const withBottomNavSafeArea = (extraPx = 0) =>
  addInset(BOTTOM_NAV_HEIGHT + Number(extraPx || 0), SAFE_AREA_BOTTOM);

export const withBottomNavAndSafeArea = (basePx = 0) =>
  addInset(basePx + BOTTOM_NAV_HEIGHT, SAFE_AREA_BOTTOM);

export default {
  SAFE_AREA_TOP,
  SAFE_AREA_BOTTOM,
  withSafeAreaTop,
  withSafeAreaBottom,
  withBottomNavSafeArea,
  withBottomNavAndSafeArea,
};
