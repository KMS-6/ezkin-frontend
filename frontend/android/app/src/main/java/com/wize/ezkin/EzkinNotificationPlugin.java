package com.wize.ezkin;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "EzkinNotification")
public class EzkinNotificationPlugin extends Plugin {
    @PluginMethod
    public void ensureNotificationChannel(PluginCall call) {
        EzkinNotificationHelper.ensureChannel(getContext());
        call.resolve();
    }

    @PluginMethod
    public void scheduleEveningQuickInputTest(PluginCall call) {
        String userId = call.getString("userId");
        String date = call.getString("date");
        Integer delayMs = call.getInt("delayMs", 4_000);
        if (userId == null || date == null) {
            call.reject("userId and date are required");
            return;
        }

        EzkinNotificationHelper.scheduleEvening(getContext(), userId, date, delayMs);
        call.resolve();
    }

    @PluginMethod
    public void consumePendingQuickInputs(PluginCall call) {
        call.resolve(EzkinNotificationStore.consumePendingQuickInputs(getContext()));
    }

    @PluginMethod
    public void consumePendingNavigation(PluginCall call) {
        call.resolve(EzkinNotificationStore.consumePendingRoute(getContext()));
    }
}
