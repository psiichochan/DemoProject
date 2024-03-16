package com.demoproject

import java.io.DataOutputStream
import java.io.IOException

object FolderManagerHelper {
    fun createFoldersWithRootAccess() {
        try {
            // Execute 'adb root' command to gain root access
            executeCommandWithRootAccess("adb root")

            // Execute mkdir commands with root access
                executeCommandWithRootAccess("mkdir /storage/emulated/0/signage")
            executeCommandWithRootAccess("mkdir /storage/emulated/0/signage/image")
            executeCommandWithRootAccess("mkdir /storage/emulated/0/signage/video")
            executeCommandWithRootAccess("mkdir /storage/emulated/0/signage/audio")
            executeCommandWithRootAccess("mkdir /storage/emulated/0/signage/ticker")
        } catch (e: IOException) {
            e.printStackTrace()
        } catch (e: InterruptedException) {
            e.printStackTrace()
        }
    }

    @Throws(IOException::class, InterruptedException::class)
    private fun executeCommandWithRootAccess(command: String) {
        val process = Runtime.getRuntime().exec("su")
        val outputStream = DataOutputStream(process.outputStream)
        outputStream.writeBytes("$command\n")
        outputStream.flush()
        outputStream.writeBytes("exit\n")
        outputStream.flush()
        process.waitFor()
        outputStream.close()
    }
}


