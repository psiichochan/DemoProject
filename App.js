/* eslint-disable prettier/prettier */
import React, {useEffect, useState, useRef} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import Images from './component/Images';
import Videos from './component/Videos';
import {NativeModules, ToastAndroid, NativeEventEmitter} from 'react-native';
import Toast from 'react-native-toast-message';
import ScrollingText from './component/ScrollingText';
import DeviceInfo from 'react-native-device-info';
import RNFS from 'react-native-fs';
import Restart from 'react-native-restart';
import MacAddressSending from './component/KeyCode/MacAddressSending';

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import MediaComponent from './component/SingagePlayer';

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
  const [deviceId, setDeviceId] = useState(null); // Change initial state to null
  const [deviceKey, setDeviceKey] = useState('');
  console.log(deviceId);

  const fetchDeviceIdCalledRef = useRef(false);
  const sendDataToGoogleSheetCalledRef = useRef(false);
  const validateKeyCalledRef = useRef(false);

  const fetchDeviceId = async () => {
    try {
      const id = await DeviceInfo.getUniqueId();
      setDeviceId(id);
    } catch (error) {
      console.error('Error getting device ID:', error);
    }
  };
  const currentIST1 = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
  });
  console.log(currentIST1);

  const sendDataToGoogleSheet = async () => {
    const apiUrl =
      'https://script.google.com/macros/s/AKfycbwO3ObmJ9C1pVYHjiUPy8LIzdX6MvBzZKYCTA7S3lFidc9UKb8UcB6vXKBkRrqMGXI/exec'; // Replace with your deployed web app URL
    const currentIST = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
    });
    try {
      const data = {
        deviceId,
        timestamp: currentIST,
      };
      console.log(data);

      const response = await axios.post(apiUrl, data);
      console.log('Complete Response:', response);
      if (response.status === 200) {
        if (response.data && response.data.deviceKey) {
          const deviceKey1 = response.data.deviceKey;
          console.log('Data sent to Google Sheet. Device Key:', deviceKey);
          setDeviceKey(deviceKey1);
          console.log('API Call: ', deviceKey1);
        } else {
          console.error('Invalid response data:', response.data);
          ToastAndroid.showWithGravity(
            'Invalid response data',
            ToastAndroid.SHORT,
            ToastAndroid.CENTER,
          );
        }
      } else {
        console.error('Error in API call. Status:', response.status);
        ToastAndroid.showWithGravity(
          'Error in API call',
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
        );
      }
    } catch (error) {
      console.error('Error sending data to Google Sheet:', error);
    }
  };

  const validateKey = () => {
    if (deviceKey) {
      ToastAndroid.showWithGravity(
        'Device Key Is Validated',
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
      );
    } else {
      ToastAndroid.showWithGravity(
        'Device Key Is Not Validated',
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
      );
    }
  };

  useEffect(() => {
    const checkIfFunctionsCalled = async () => {
      // Check if the functions have been called before
      const functionsCalled = await AsyncStorage.getItem('functionsCalled');
      console.log('FunctionCalled: ', functionsCalled);
      console.log('Hello: ', fetchDeviceIdCalledRef.current);

      if (functionsCalled !== 'true') {
        // If not called before, call the functions
        if (!fetchDeviceIdCalledRef.current) {
          await fetchDeviceId();
          await sendDataToGoogleSheet();
          fetchDeviceIdCalledRef.current = true;
        }
        // console.log('deviceID', sendDataToGoogleSheetCalledRef.current);
        // if (deviceId && !sendDataToGoogleSheetCalledRef.current) {

        //   sendDataToGoogleSheetCalledRef.current = true;
        // }

        if (deviceId && !validateKeyCalledRef.current) {
          validateKey();
          console.log('hello : ', deviceId);
          validateKeyCalledRef.current = true;
        }

        // Set a flag in AsyncStorage indicating that the functions have been called
        await AsyncStorage.setItem('functionsCalled', 'true');
      }
    };

    checkIfFunctionsCalled();
  }, [deviceId]);

  useEffect(() => {
    if (deviceId && !validateKeyCalledRef.current) {
      validateKey();
      validateKeyCalledRef.current = true;
    }
  }, [deviceId]);

  useEffect(() => {
    // Check if the necessary methods exist before creating the listener
    if (USBModule.addListener && USBModule.removeListeners) {
      const usbListener = usbEvents.addListener(
        'USBConnected',
        async connectedUsbPath => {
          setUsbPath(connectedUsbPath);

          await copyFolderFromUsb(connectedUsbPath);

          // Display a toast message when USB drive is connected
          // ToastAndroid.showWithGravity(
          //   'Pendrive Is Connected. Now Copying the Data.',
          //   ToastAndroid.SHORT,
          //   ToastAndroid.CENTER,
          //   StyleSheet.create({
          //     text: {
          //       fontSize: 18, // Change the font size as needed
          //       fontWeight: 'bold', // Make the text bold
          //     },
          //   }),
          // );
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

  const copyFolderFromUsb = async usbPath1 => {
    try {
      const sourcePath = `${usbPath1}/signage`; // Assuming "signage" folder is in the USB root
      const destinationPath = `${RNFS.ExternalStorageDirectoryPath}/signage`;

      // Check if the source path exists
      const sourceExists = await RNFS.exists(sourcePath);
      if (!sourceExists) {
        return;
      }

      // Create the destination directory
      await RNFS.mkdir(destinationPath);

      // Perform the recursive copy operation
      await copyRecursive(sourcePath, destinationPath);

      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'Data Copied Successfully',
        text2: 'Please Remove the USB',
        visibilityTime: 3000, // 3 seconds
        autoHide: true,
        topOffset: 30, // Adjust as needed
        textStyle: {fontWeight: 'bold', fontSize: 20},
      });
      console.log('Please Remove the USB. Folder Copied Successful');
      // ToastAndroid.showWithGravity(
      //   'Please Remove the USB. Folder Copied Successful',
      //   ToastAndroid.SHORT,
      //   ToastAndroid.CENTER,
      // );
      Restart.Restart();
    } catch (error) {
      console.error('Error copying signage folder:', error);
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
      <Stack.Navigator initialRouteName="MediaComponent">
        {/* <Stack.Screen
          name="ActivationScreen"
          component={ActivationScreen}
          options={{headerShown: false}}
        /> */}
        <Stack.Screen
          name="MediaComponent"
          component={MediaComponent}
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
      <Toast />
    </NavigationContainer>
  );
};

export default App;
