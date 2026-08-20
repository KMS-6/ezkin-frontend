package com.wize.ezkin;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(EzkinNotificationPlugin.class);
        registerPlugin(EzkinLocationPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        EzkinNotificationStore.savePendingRoute(
            this,
            intent.getStringExtra(EzkinNotificationHelper.EXTRA_ROUTE)
        );
    }
}
