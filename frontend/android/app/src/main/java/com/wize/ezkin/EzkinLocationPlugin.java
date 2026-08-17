package com.wize.ezkin;

import android.Manifest;
import android.content.Context;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.Handler;
import android.os.Looper;
import androidx.annotation.NonNull;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.concurrent.atomic.AtomicBoolean;

@CapacitorPlugin(
    name = "EzkinLocation",
    permissions = {
        @Permission(alias = "coarseLocation", strings = { Manifest.permission.ACCESS_COARSE_LOCATION }),
        @Permission(alias = "fineLocation", strings = { Manifest.permission.ACCESS_FINE_LOCATION })
    }
)
public class EzkinLocationPlugin extends Plugin {
    private static final long LOCATION_TIMEOUT_MS = 10_000L;

    @PluginMethod
    public void checkPermission(PluginCall call) {
        call.resolve(permissionResult(currentPermissionStatus()));
    }

    @PluginMethod
    public void requestCurrentPosition(PluginCall call) {
        if (hasLocationPermission()) {
            resolveCurrentPosition(call);
            return;
        }

        requestPermissionForAliases(
            new String[] { "coarseLocation", "fineLocation" },
            call,
            "locationPermissionCallback"
        );
    }

    @PermissionCallback
    private void locationPermissionCallback(PluginCall call) {
        if (!hasLocationPermission()) {
            call.resolve(permissionResult("denied"));
            return;
        }

        resolveCurrentPosition(call);
    }

    private boolean hasLocationPermission() {
        return getPermissionState("coarseLocation") == PermissionState.GRANTED ||
            getPermissionState("fineLocation") == PermissionState.GRANTED;
    }

    private String currentPermissionStatus() {
        if (hasLocationPermission()) return "granted";

        PermissionState coarse = getPermissionState("coarseLocation");
        PermissionState fine = getPermissionState("fineLocation");
        if (coarse == PermissionState.DENIED || fine == PermissionState.DENIED) return "denied";
        return "prompt";
    }

    private void resolveCurrentPosition(PluginCall call) {
        LocationManager locationManager = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
        if (locationManager == null) {
            call.resolve(permissionResult("unavailable"));
            return;
        }

        String provider = enabledProvider(locationManager);
        if (provider == null) {
            call.resolve(permissionResult("unavailable"));
            return;
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                requestCurrentPositionModern(locationManager, provider, call);
            } else {
                requestCurrentPositionLegacy(locationManager, provider, call);
            }
        } catch (SecurityException exception) {
            call.resolve(permissionResult("denied"));
        } catch (RuntimeException exception) {
            call.resolve(permissionResult("unavailable"));
        }
    }

    private void requestCurrentPositionModern(LocationManager manager, String provider, PluginCall call) {
        Handler handler = new Handler(Looper.getMainLooper());
        CancellationSignal cancellationSignal = new CancellationSignal();
        AtomicBoolean resolved = new AtomicBoolean(false);

        Runnable timeout = () -> {
            if (resolved.compareAndSet(false, true)) {
                cancellationSignal.cancel();
                call.resolve(permissionResult("unavailable"));
            }
        };

        handler.postDelayed(timeout, LOCATION_TIMEOUT_MS);
        manager.getCurrentLocation(provider, cancellationSignal, getContext().getMainExecutor(), location -> {
            if (!resolved.compareAndSet(false, true)) return;
            handler.removeCallbacks(timeout);
            call.resolve(location == null ? permissionResult("unavailable") : positionResult(location));
        });
    }

    @SuppressWarnings("deprecation")
    private void requestCurrentPositionLegacy(LocationManager manager, String provider, PluginCall call) {
        Handler handler = new Handler(Looper.getMainLooper());
        AtomicBoolean resolved = new AtomicBoolean(false);

        LocationListener listener = new LocationListener() {
            @Override
            public void onLocationChanged(@NonNull Location location) {
                if (!resolved.compareAndSet(false, true)) return;
                handler.removeCallbacksAndMessages(this);
                manager.removeUpdates(this);
                call.resolve(positionResult(location));
            }

            @Override
            public void onProviderDisabled(@NonNull String disabledProvider) {
                if (!resolved.compareAndSet(false, true)) return;
                handler.removeCallbacksAndMessages(this);
                manager.removeUpdates(this);
                call.resolve(permissionResult("unavailable"));
            }

            @Override
            public void onStatusChanged(String changedProvider, int status, Bundle extras) {}
        };

        Runnable timeout = () -> {
            if (!resolved.compareAndSet(false, true)) return;
            manager.removeUpdates(listener);
            call.resolve(permissionResult("unavailable"));
        };

        handler.postDelayed(timeout, LOCATION_TIMEOUT_MS);
        manager.requestSingleUpdate(provider, listener, Looper.getMainLooper());
    }

    private String enabledProvider(LocationManager manager) {
        if (manager.isProviderEnabled(LocationManager.GPS_PROVIDER)) return LocationManager.GPS_PROVIDER;
        if (manager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) return LocationManager.NETWORK_PROVIDER;
        return null;
    }

    private JSObject permissionResult(String status) {
        JSObject result = new JSObject();
        result.put("status", status);
        return result;
    }

    private JSObject positionResult(Location location) {
        JSObject result = permissionResult("granted");
        result.put("latitude", location.getLatitude());
        result.put("longitude", location.getLongitude());
        return result;
    }
}
