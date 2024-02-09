package com.demoproject

import android.content.Context
import android.hardware.usb.UsbManager

class UsbUtils(private val context: Context) {

    val pendrivePath: String?
        get() {
            val usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
            if (usbManager != null) {
                for (usbDevice in usbManager.deviceList.values) {
                    // Assuming the pendrive is a mass storage device
                    if (usbDevice.interfaceCount > 0 && usbDevice.getInterface(0).interfaceClass == 8) {
                        return usbDevice.deviceName
                    }
                }
            }
            return null
        }
}
