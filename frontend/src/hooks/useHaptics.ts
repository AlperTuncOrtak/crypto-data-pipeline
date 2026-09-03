import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { useCallback } from 'react';

export function useHaptics() {
  const isNative = Capacitor.isNativePlatform();

  const impactLight = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {}
  }, [isNative]);

  const impactMedium = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {}
  }, [isNative]);

  const impactHeavy = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (e) {}
  }, [isNative]);

  const success = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.notification({ type: 'SUCCESS' as any });
    } catch (e) {}
  }, [isNative]);

  const error = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.notification({ type: 'ERROR' as any });
    } catch (e) {}
  }, [isNative]);

  const selection = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.selectionStart();
      await Haptics.selectionChanged();
      await Haptics.selectionEnd();
    } catch (e) {}
  }, [isNative]);

  return { impactLight, impactMedium, impactHeavy, success, error, selection };
}
