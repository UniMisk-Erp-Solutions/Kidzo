import { useEffect } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";

type ScreenGuardPlugin = {
  enable(): Promise<void>;
  disable(): Promise<void>;
};

// Implemented natively in android/.../ScreenGuardPlugin.java (Android FLAG_SECURE).
const ScreenGuard = registerPlugin<ScreenGuardPlugin>("ScreenGuard");

const isNativeAndroid = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";

/**
 * While `active`, the Android app blocks screenshots and screen recording (and blanks the
 * recent-apps thumbnail). Does nothing on the web — there the ScreenshotShield deterrents apply.
 */
export const useScreenGuard = (active: boolean) => {
  useEffect(() => {
    if (!active || !isNativeAndroid()) return;
    ScreenGuard.enable().catch(() => {});
    return () => {
      ScreenGuard.disable().catch(() => {});
    };
  }, [active]);
};
