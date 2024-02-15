package com.demoproject

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class USBModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(
    reactContext
) {
    private var currentUsbPath: String? = null

    override fun getName(): String {
        return "USBModule"
    }

    @ReactMethod
    fun getConnectedUSBPath() {
        // Emit the current connected USB path to React Native
        emitEvent("USBConnected", currentUsbPath ?: "")
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Add listener logic if needed
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Remove listener logic if needed
    }

    private fun registerUSBReceiver() {
        val filter = IntentFilter()
        filter.addAction(Intent.ACTION_MEDIA_MOUNTED)
        filter.addAction(Intent.ACTION_MEDIA_UNMOUNTED)
        filter.addDataScheme("file")
        reactContext.registerReceiver(usbReceiver, filter)
    }

    private val usbReceiver: BroadcastReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            val action = intent.action
            if (action != null && (action == Intent.ACTION_MEDIA_MOUNTED || action == Intent.ACTION_MEDIA_UNMOUNTED)) {
                val usbPath = intent.data?.path
                if (usbPath != null) {
                    currentUsbPath = usbPath
                    emitEvent("USBConnected", currentUsbPath!!)
                }
            }
        }
    }

    init {
        registerUSBReceiver()
    }

    private fun emitEvent(eventName: String, data: String) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, data)
    }
}
