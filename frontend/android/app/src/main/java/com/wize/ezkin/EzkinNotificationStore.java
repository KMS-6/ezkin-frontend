package com.wize.ezkin;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

final class EzkinNotificationStore {
    private static final String PREFERENCES_NAME = "ezkin_notification_pending";
    private static final String USER_ID = "userId";
    private static final String DATE = "date";
    private static final String CREATED_AT = "createdAt";
    private static final String WATER_CHOICE = "waterChoice";
    private static final String DIET_CHOICE = "dietChoice";
    private static final String PENDING_ROUTE = "pendingRoute";

    private EzkinNotificationStore() {}

    private static SharedPreferences preferences(Context context) {
        return context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
    }

    private static String now() {
        return new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX", Locale.US).format(new Date());
    }

    static void beginQuickInput(Context context, String userId, String date) {
        preferences(context)
            .edit()
            .remove(WATER_CHOICE)
            .remove(DIET_CHOICE)
            .putString(USER_ID, userId)
            .putString(DATE, date)
            .putString(CREATED_AT, now())
            .apply();
    }

    static void saveWaterChoice(Context context, String userId, String date, String choice) {
        preferences(context)
            .edit()
            .putString(USER_ID, userId)
            .putString(DATE, date)
            .putString(CREATED_AT, now())
            .putString(WATER_CHOICE, choice)
            .apply();
    }

    static void saveDietChoice(Context context, String userId, String date, String choice) {
        SharedPreferences values = preferences(context);
        String createdAt = values.getString(CREATED_AT, now());
        values
            .edit()
            .putString(USER_ID, userId)
            .putString(DATE, date)
            .putString(CREATED_AT, createdAt)
            .putString(DIET_CHOICE, choice)
            .apply();
    }

    static JSObject consumePendingQuickInputs(Context context) {
        SharedPreferences values = preferences(context);
        String userId = values.getString(USER_ID, null);
        boolean hasInput = values.contains(WATER_CHOICE) || values.contains(DIET_CHOICE);
        JSObject result = new JSObject();

        if (userId == null || !hasInput) return result;

        result.put(USER_ID, userId);
        result.put(DATE, values.getString(DATE, ""));
        result.put(CREATED_AT, values.getString(CREATED_AT, ""));
        if (values.contains(WATER_CHOICE)) {
            result.put(WATER_CHOICE, values.getString(WATER_CHOICE, null));
        }
        if (values.contains(DIET_CHOICE)) {
            result.put(DIET_CHOICE, values.getString(DIET_CHOICE, null));
        }

        values
            .edit()
            .remove(USER_ID)
            .remove(DATE)
            .remove(CREATED_AT)
            .remove(WATER_CHOICE)
            .remove(DIET_CHOICE)
            .apply();
        return result;
    }

    static void savePendingRoute(Context context, String route) {
        if (route == null || !route.startsWith("/")) return;
        preferences(context).edit().putString(PENDING_ROUTE, route).apply();
    }

    static JSObject consumePendingRoute(Context context) {
        SharedPreferences values = preferences(context);
        String route = values.getString(PENDING_ROUTE, null);
        JSObject result = new JSObject();
        if (route != null) result.put("route", route);
        values.edit().remove(PENDING_ROUTE).apply();
        return result;
    }
}
