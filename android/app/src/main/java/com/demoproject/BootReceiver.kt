package com.demoproject

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action == Intent.ACTION_BOOT_COMPLETED) {
            // Start the React Native activity
            val launchIntent = context?.packageManager?.getLaunchIntentForPackage(context?.packageName!!)
            context?.startActivity(launchIntent)
        }
    }
}
