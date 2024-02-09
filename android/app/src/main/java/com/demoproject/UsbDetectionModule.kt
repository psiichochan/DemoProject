package com.demoproject

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class UsbDetectionModule(reactContext: ReactApplicationContext) :
        ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "UsbDetectionModule"
    }

    @ReactMethod
    fun startUsbDetection() {
        // You might want to do something here
        if (!usbReceiverRegistered) {
            registerUsbReceiver()
        }
    }

    private var usbReceiverRegistered = false

    private fun registerUsbReceiver() {
        val filter = IntentFilter()
        filter.addAction(UsbManager.ACTION_USB_DEVICE_ATTACHED)
        filter.addAction(UsbManager.ACTION_USB_DEVICE_DETACHED)
        reactApplicationContext.registerReceiver(usbReceiver, filter)
        usbReceiverRegistered = true
    }

    private val usbReceiver: BroadcastReceiver =
            object : BroadcastReceiver() {
                override fun onReceive(context: Context, intent: Intent) {
                    val action = intent.action
                    if (UsbManager.ACTION_USB_DEVICE_ATTACHED == action) {
                        val device = intent.getParcelableExtra<UsbDevice>(UsbManager.EXTRA_DEVICE)
                        if (device != null) {
                            sendEvent(true, device.deviceName)
                        }
                    } else if (UsbManager.ACTION_USB_DEVICE_DETACHED == action) {
                        val device = intent.getParcelableExtra<UsbDevice>(UsbManager.EXTRA_DEVICE)
                        if (device != null) {
                            sendEvent(false, device.deviceName)
                        }
                    }
                }
            }

    private fun sendEvent(isConnected: Boolean, deviceName: String) {
        reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(USB_EVENT, isConnected)
    }

    companion object {
        private const val USB_EVENT = "usbEvent"
    }
}
