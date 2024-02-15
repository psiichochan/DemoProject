/* eslint-disable prettier/prettier */
import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import Images from './component/Images';
import Videos from './component/Videos';
import {NativeModules, ToastAndroid, NativeEventEmitter} from 'react-native';
import ScrollingText from './component/ScrollingText';
import RNFS from 'react-native-fs';
import Restart from 'react-native-restart';
import MacAddressSending from './component/KeyCode/MacAddressSending';
import SignagePlayer from './component/SingagePlayer';

const Stack = createStackNavigator();
const USBModule = NativeModules.USBModule;
const usbEvents = new NativeEventEmitter(USBModule);

// Check if the necessary methods exist on the USBModule
if (!USBModule.addListener || !USBModule.removeListeners) {
  console.error(
    'USBModule does not have the required methods for event subscription and unsubscription.',
  );
}

const App = () => {
  const [usbPath, setUsbPath] = useState('');

  useEffect(() => {
    // Check if the necessary methods exist before creating the listener
    if (USBModule.addListener && USBModule.removeListeners) {
      const usbListener = usbEvents.addListener(
        'USBConnected',
        async connectedUsbPath => {
          console.log(`USB Connected. Path: ${connectedUsbPath}`);
          setUsbPath(connectedUsbPath);

          // Perform the copy operation when USB is connected and "signage" folder is present
          await copyFolderFromUsb(connectedUsbPath);
        },
      );

      return () => {
        usbListener.remove();
      };
    } else {
      console.error(
        'USBModule does not have the required methods for event subscription and unsubscription.',
      );
    }
  }, []);

  const copyFolderFromUsb = async () => {
    try {
      const sourcePath = `${usbPath}/signage`; // Assuming "signage" folder is in the USB root
      const destinationPath = `${RNFS.ExternalStorageDirectoryPath}/signage`;

      // Check if the source path exists
      const sourceExists = await RNFS.exists(sourcePath);
      if (!sourceExists) {
        console.error('Source path does not exist:', sourcePath);
        return;
      }

      // Create the destination directory
      await RNFS.mkdir(destinationPath);

      // Perform the recursive copy operation
      await copyRecursive(sourcePath, destinationPath);

      console.log('Signage folder copied successfully.');
      ToastAndroid.showWithGravity(
        'USB Connected. Signage folder copied.',
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
      );
      Restart.Restart();
    } catch (error) {
      console.error('Error copying signage folder:', error);
      ToastAndroid.showWithGravity(
        `Error copying signage folder: ${error.message}`,
        ToastAndroid.LONG,
        ToastAndroid.CENTER,
      );
    }
  };

  async function copyRecursive(source, destination) {
    console.log(`${source} => ${destination}`);

    // Check if the destination folder exists
    const destinationExists = await RNFS.exists(destination);
    if (destinationExists) {
      console.log(`Deleting existing destination folder: ${destination}`);
      await RNFS.unlink(destination).catch(() => {});
    }

    // Create the destination directory
    await RNFS.mkdir(destination);

    // Read items from the source directory
    const items = await RNFS.readDir(source);

    await Promise.all(
      items.map(async item => {
        const destinationPath = `${destination}/${item.name}`;

        if (item.isFile()) {
          console.log(`Copying file: ${item.path}`);
          await RNFS.copyFile(item.path, destinationPath);
        } else {
          await copyRecursive(item.path, destinationPath);
        }
      }),
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Images">
        <Stack.Screen
          name="SignagePlayer"
          component={SignagePlayer}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Images"
          component={Images}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Macadress"
          component={MacAddressSending}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ScrollingText"
          component={ScrollingText}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Videos"
          component={Videos}
          options={{headerShown: false}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
