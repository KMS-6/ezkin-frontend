package com.wize.ezkin;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.os.Build;
import android.os.SystemClock;
import android.provider.Settings;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

final class EzkinNotificationHelper {
    static final String CHANNEL_ID = "ezkin-daily-care";
    static final int EVENING_NOTIFICATION_ID = 2201;
    private static final String CHANNEL_PREFERENCES = "ezkin_notification_channel";
    private static final String HIGH_IMPORTANCE_MIGRATED = "highImportanceMigrated";

    static final String ACTION_SHOW_WATER = "com.wize.ezkin.notification.SHOW_WATER";
    static final String ACTION_WATER_UNDER_3 = "com.wize.ezkin.notification.WATER_UNDER_3";
    static final String ACTION_WATER_3_TO_5 = "com.wize.ezkin.notification.WATER_3_TO_5";
    static final String ACTION_WATER_OVER_5 = "com.wize.ezkin.notification.WATER_OVER_5";
    static final String ACTION_DIET_NORMAL = "com.wize.ezkin.notification.DIET_NORMAL";
    static final String ACTION_DIET_SPICY = "com.wize.ezkin.notification.DIET_SPICY";
    static final String ACTION_DIET_LATE_NIGHT_MEAL = "com.wize.ezkin.notification.DIET_LATE_NIGHT_MEAL";

    static final String EXTRA_USER_ID = "ezkinUserId";
    static final String EXTRA_DATE = "ezkinDate";
    static final String EXTRA_ROUTE = "ezkinRoute";

    private EzkinNotificationHelper() {}

    static void ensureChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager manager = context.getSystemService(NotificationManager.class);
        NotificationChannel existingChannel = manager.getNotificationChannel(CHANNEL_ID);
        boolean hasMigrated = context
            .getSharedPreferences(CHANNEL_PREFERENCES, Context.MODE_PRIVATE)
            .getBoolean(HIGH_IMPORTANCE_MIGRATED, false);

        if (
            existingChannel != null &&
            existingChannel.getImportance() == NotificationManager.IMPORTANCE_DEFAULT &&
            !hasMigrated
        ) {
            manager.deleteNotificationChannel(CHANNEL_ID);
            existingChannel = null;
        }

        if (existingChannel != null) return;

        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "EZkin Daily Care",
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("오늘의 피부 케어와 짧은 생활 기록 알림");
        channel.enableVibration(false);
        AudioAttributes audioAttributes = new AudioAttributes.Builder()
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
            .build();
        channel.setSound(Settings.System.DEFAULT_NOTIFICATION_URI, audioAttributes);
        manager.createNotificationChannel(channel);
        context
            .getSharedPreferences(CHANNEL_PREFERENCES, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(HIGH_IMPORTANCE_MIGRATED, true)
            .apply();
    }

    static void scheduleEvening(Context context, String userId, String date, int delayMs) {
        ensureChannel(context);
        EzkinNotificationStore.beginQuickInput(context, userId, date);

        Intent intent = receiverIntent(context, ACTION_SHOW_WATER, userId, date);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context,
            EVENING_NOTIFICATION_ID,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        long triggerAt = SystemClock.elapsedRealtime() + Math.max(1_000, delayMs);
        alarmManager.setAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, pendingIntent);
    }

    static void showWaterQuestion(Context context, String userId, String date) {
        NotificationCompat.Builder builder = baseBuilder(
            context,
            "오늘 물 얼마나 마셨어요?",
            null,
            "/quick-input/water"
        );
        builder
            .addAction(action(context, "3잔 미만", ACTION_WATER_UNDER_3, userId, date, 2211))
            .addAction(action(context, "3~5잔", ACTION_WATER_3_TO_5, userId, date, 2212))
            .addAction(action(context, "5잔 이상", ACTION_WATER_OVER_5, userId, date, 2213));
        notify(context, builder);
    }

    static void showDietQuestion(Context context, String userId, String date) {
        NotificationCompat.Builder builder = baseBuilder(
            context,
            "오늘 식단은 어땠어요?",
            null,
            "/quick-input/meal?meal=dinner"
        );
        builder
            .addAction(action(context, "평소대로", ACTION_DIET_NORMAL, userId, date, 2221))
            .addAction(action(context, "매운 음식", ACTION_DIET_SPICY, userId, date, 2222))
            .addAction(action(context, "야식", ACTION_DIET_LATE_NIGHT_MEAL, userId, date, 2223));
        notify(context, builder);
    }

    static void showComplete(Context context) {
        NotificationCompat.Builder builder = baseBuilder(context, "오늘 기록 완료 ✓", null, "/lifelog")
            .setAutoCancel(true)
            .setTimeoutAfter(5_000);
        notify(context, builder);
    }

    private static NotificationCompat.Builder baseBuilder(Context context, String title, String body, String route) {
        Intent openIntent = new Intent(context, MainActivity.class);
        openIntent.setAction("com.wize.ezkin.notification.OPEN");
        openIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        openIntent.putExtra(EXTRA_ROUTE, route);
        PendingIntent contentIntent = PendingIntent.getActivity(
            context,
            2299,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_ezkin)
            .setColor(Color.parseColor("#6C4CCF"))
            .setContentTitle(title)
            .setContentIntent(contentIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setOnlyAlertOnce(true)
            .setAutoCancel(false);

        if (body != null && !body.trim().isEmpty()) {
            builder
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body));
        }
        return builder;
    }

    private static NotificationCompat.Action action(
        Context context,
        String label,
        String action,
        String userId,
        String date,
        int requestCode
    ) {
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context,
            requestCode,
            receiverIntent(context, action, userId, date),
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        return new NotificationCompat.Action.Builder(0, label, pendingIntent).build();
    }

    private static Intent receiverIntent(Context context, String action, String userId, String date) {
        Intent intent = new Intent(context, EzkinNotificationReceiver.class);
        intent.setAction(action);
        intent.putExtra(EXTRA_USER_ID, userId);
        intent.putExtra(EXTRA_DATE, date);
        return intent;
    }

    private static void notify(Context context, NotificationCompat.Builder builder) {
        if (
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) return;
        NotificationManagerCompat.from(context).notify(EVENING_NOTIFICATION_ID, builder.build());
    }
}
