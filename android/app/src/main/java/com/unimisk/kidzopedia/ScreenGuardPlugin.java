package com.unimisk.kidzopedia;

import android.view.WindowManager;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Turns Android's FLAG_SECURE on/off for the app window.
 * While enabled, the OS blocks screenshots and screen recording, and the app shows as a blank
 * thumbnail in the recent-apps switcher. The web layer enables it only on book preview screens.
 */
@CapacitorPlugin(name = "ScreenGuard")
public class ScreenGuardPlugin extends Plugin {

    @PluginMethod
    public void enable(final PluginCall call) {
        setSecure(true);
        call.resolve();
    }

    @PluginMethod
    public void disable(final PluginCall call) {
        setSecure(false);
        call.resolve();
    }

    private void setSecure(final boolean secure) {
        if (getActivity() == null) return;
        getActivity().runOnUiThread(() -> {
            if (secure) {
                getActivity().getWindow().setFlags(
                    WindowManager.LayoutParams.FLAG_SECURE,
                    WindowManager.LayoutParams.FLAG_SECURE
                );
            } else {
                getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
            }
        });
    }
}
