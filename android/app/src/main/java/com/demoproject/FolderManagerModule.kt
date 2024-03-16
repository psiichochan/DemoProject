// Inside FolderManagerModule.kt

import com.demoproject.FolderManagerHelper
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class FolderManagerModule(reactContext: ReactApplicationContext?) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "FolderManager"
    }

    @ReactMethod
    fun createFolders() {
        // Invoke the native method for creating folders with root access
        FolderManagerHelper.createFoldersWithRootAccess()
    }
}
