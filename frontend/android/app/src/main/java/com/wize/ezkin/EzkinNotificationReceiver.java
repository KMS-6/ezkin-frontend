package com.wize.ezkin;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class EzkinNotificationReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        String userId = intent.getStringExtra(EzkinNotificationHelper.EXTRA_USER_ID);
        String date = intent.getStringExtra(EzkinNotificationHelper.EXTRA_DATE);
        if (action == null || userId == null || date == null) return;

        if (EzkinNotificationHelper.ACTION_SHOW_WATER.equals(action)) {
            EzkinNotificationHelper.showWaterQuestion(context, userId, date);
            return;
        }

        String waterChoice = waterChoice(action);
        if (waterChoice != null) {
            EzkinNotificationStore.saveWaterChoice(context, userId, date, waterChoice);
            EzkinNotificationHelper.showDietQuestion(context, userId, date);
            return;
        }

        String dietChoice = dietChoice(action);
        if (dietChoice != null) {
            EzkinNotificationStore.saveDietChoice(context, userId, date, dietChoice);
            EzkinNotificationHelper.showComplete(context);
        }
    }

    private String waterChoice(String action) {
        if (EzkinNotificationHelper.ACTION_WATER_UNDER_3.equals(action)) return "under_3";
        if (EzkinNotificationHelper.ACTION_WATER_3_TO_5.equals(action)) return "3_to_5";
        if (EzkinNotificationHelper.ACTION_WATER_OVER_5.equals(action)) return "over_5";
        return null;
    }

    private String dietChoice(String action) {
        if (EzkinNotificationHelper.ACTION_DIET_NORMAL.equals(action)) return "normal";
        if (EzkinNotificationHelper.ACTION_DIET_SPICY.equals(action)) return "spicy";
        if (EzkinNotificationHelper.ACTION_DIET_LATE_NIGHT_MEAL.equals(action)) return "late_night_meal";
        return null;
    }
}
