/* eslint-disable prettier/prettier */
import React, {useEffect, useState, useRef, useCallback} from 'react';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {NativeModules, ToastAndroid, NativeEventEmitter} from 'react-native';
import Toast from 'react-native-toast-message';
import DeviceInfo from 'react-native-device-info';
import RNFS from 'react-native-fs';
import Restart from 'react-native-restart';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import MediaComponent from './component/SingagePlayer';
import BlankScreen from './component/BlankScreen';
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
  const [deviceId, setDeviceId] = useState(null);
  const [deviceKey, setDeviceKey] = useState('');
  var signageChanges = false;
  const fetchDeviceIdCalledRef = useRef(false);
  const validateKeyCalledRef = useRef(false);

  useEffect(() => {
    const fetchIpAddress = async () => {
      try {
        const netInfo = await NetInfo.fetch();
        const localIpAddress = netInfo.details.ipAddress;

        ToastAndroid.showWithGravity(
          `Device IP Address: ${localIpAddress}`,
          ToastAndroid.LONG,
          ToastAndroid.CENTER,
        );

        setTimeout(() => {
          Toast.hide();
        }, 5000);
      } catch (error) {
        console.error('Error fetching IP address:', error);
      }
    };

    fetchIpAddress();
  }, []);

  const retrieveDeviceKey = async () => {
    const storedDeviceKey = await AsyncStorage.getItem('deviceKey');
    const values = JSON.stringify(storedDeviceKey);
    validateKeyCalledRef.current = true;
    if (storedDeviceKey) {
      setDeviceKey(values);
    }
  };

  useEffect(() => {
    const signageFolderPath = `${RNFS.ExternalDirectoryPath}/signage`;

    const watchDirectory = async () => {
      try {
        // Read the contents of the directory initially
        const files = await RNFS.readDir(`${signageFolderPath}/image/`);
        const video = await RNFS.readDir(`${signageFolderPath}/video/`);
        const audio = await RNFS.readDir(`${signageFolderPath}/audio/`);
        const ticker = await RNFS.readDir(`${signageFolderPath}/ticker/`);

        // Start a timer to periodically check for changes
        const timerId = setInterval(async () => {
          try {
            const imageFiles = await RNFS.readDir(
              `${signageFolderPath}/image/`,
            );
            const videoFiles = await RNFS.readDir(
              `${signageFolderPath}/video/`,
            );
            const audioFiles = await RNFS.readDir(
              `${signageFolderPath}/audio/`,
            );
            const tickerFiles = await RNFS.readDir(
              `${signageFolderPath}/ticker/`,
            );

            // Compare the updated files with the previous ones
            if (
              imageFiles.length !== files.length ||
              !imageFiles.every((f, i) => f.name === files[i].name) ||
              videoFiles.length !== video.length ||
              !videoFiles.every((f, i) => f.name === video[i].name) ||
              audioFiles.length !== audio.length ||
              !audioFiles.every((f, i) => f.name === audio[i].name) ||
              tickerFiles.length !== ticker.length ||
              !tickerFiles.every((f, i) => f.name === ticker[i].name)
            ) {
              Restart.restart(); // Restart the application
            }
          } catch (error) {
            console.error('Error reading directory:', error);
          }
        }, 60000); // Check every second for changes

        return () => clearInterval(timerId); // Cleanup the timer
      } catch (error) {
        console.error('Error watching directory:', error);
      }
    };
    watchDirectory();
  }, []);

  useEffect(() => {
    const checkSignageChanges = async () => {
      if (signageChanges) {
        // Perform any action you want when changes occur.
        console.log('Signage folder has changed!');
      }
    };
    checkSignageChanges();
  }, [signageChanges]);

  const fetchDeviceId = async () => {
    try {
      const id = await DeviceInfo.getUniqueId();
      setDeviceId(id);
    } catch (error) {
      console.error('Error getting device ID:', error);
    }
  };

  const sendDataToGoogleSheet = useCallback(async () => {
    const apiUrl =
      'https://script.google.com/macros/s/AKfycbz9FBo2vF3jCIjX9CE2emPm9WOiZf56pjzQZ2u7qKJuvejTF0JDjtkIic3stTsjmOXv/exec';
    const currentIST = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
    });

    try {
      const data = {
        deviceId,
        timestamp: currentIST,
      };

      const response = await axios.post(apiUrl, data);

      // Check if response.data is an object
      if (response.data && typeof response.data === 'object') {
        console.log('Complete Response:', JSON.stringify(response.data));
      } else {
        console.log('Complete Response:', response.data);
      }

      if (response.status === 200) {
        if (response.data && response.data.deviceKey) {
          const deviceKey1 = response.data.deviceKey;

          await AsyncStorage.setItem('deviceKey', deviceKey1); // Store deviceKey in AsyncStorage
        } else {
          console.error('Invalid response data:', response.data);
          ToastAndroid.showWithGravity(
            `${response.data}`,
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
  }, [deviceId]);

  const validateKey = useCallback(async () => {
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

    // Update validateKeyCalledRef.current
    validateKeyCalledRef.current = true;

    // Persist the value in AsyncStorage
    await AsyncStorage.setItem('validateKeyCalled', 'true');
  }, [deviceKey]);

  useEffect(() => {
    const checkIfFunctionsCalled = async () => {
      const functionsCalled = await AsyncStorage.getItem('functionsCalled');

      if (functionsCalled !== 'true') {
        if (!fetchDeviceIdCalledRef.current) {
          await fetchDeviceId();
          await sendDataToGoogleSheet();
          fetchDeviceIdCalledRef.current = true;
        }

        if (deviceId && !validateKeyCalledRef.current) {
          validateKey();
          validateKeyCalledRef.current = true;
          await AsyncStorage.setItem('validateKeyCalled', 'true'); // Persist the value
        }

        await AsyncStorage.setItem('functionsCalled', 'true');
      }
      retrieveDeviceKey();
    };

    checkIfFunctionsCalled();
  }, [deviceId, sendDataToGoogleSheet, validateKey]);

  useEffect(() => {
    const loadPersistedValues = async () => {
      const isValidateKeyCalled = await AsyncStorage.getItem(
        'validateKeyCalled',
      );

      if (isValidateKeyCalled === 'true') {
        validateKeyCalledRef.current = true;
      }
    };

    loadPersistedValues();
  }, []);

  useEffect(() => {
    console.log('Component mounted');

    return () => {
      console.log('Component unmounted');
    };
  }, []);

  useEffect(() => {
    if (deviceId && !validateKeyCalledRef.current) {
      validateKey();
      validateKeyCalledRef.current = true;
      AsyncStorage.setItem('validateKeyCalled', 'true'); // Persist the value
    }
  }, [deviceId, validateKey]);

  useEffect(() => {
    if (USBModule.addListener && USBModule.removeListeners) {
      const usbListener = usbEvents.addListener(
        'USBConnected',
        async connectedUsbPath => {
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
  }, [copyFolderFromUsb]);

  const copyFolderFromUsb = useCallback(
    async usbPath1 => {
      try {
        const sourcePath = `${usbPath1}/signage`;
        const destinationPath = `${RNFS.ExternalDirectoryPath}/signage`;
        const sourceExists = await RNFS.exists(sourcePath);
        if (!sourceExists) {
          return;
        }

        await RNFS.mkdir(destinationPath);

        await copyRecursive(sourcePath, destinationPath);

        Toast.show({
          type: 'success',
          position: 'top',
          text1: 'Data Copied Successfully',
          text2: 'Please Remove the USB',
          visibilityTime: 3000,
          autoHide: true,
          topOffset: 30,
          textStyle: {fontWeight: 'bold', fontSize: 20},
        });
        Restart.Restart();
      } catch (error) {
        console.error('Error copying signage folder:', error);
      }
    },
    [copyRecursive],
  );

  const copyRecursive = useCallback(async (source, destination) => {
    console.log(`${source} => ${destination}`);

    const destinationExists = await RNFS.exists(destination);
    const mergeContain = await AsyncStorage.getItem('mergeContain');
    if (destinationExists && !mergeContain) {
      await RNFS.unlink(destination).catch(() => {});
    }

    await RNFS.mkdir(destination);

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
  }, []);

  const MyTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: 'black',
    },
  };

  return (
    <NavigationContainer theme={MyTheme}>
      <Stack.Navigator
        initialRouteName={deviceKey ? 'MediaComponent' : 'BlankScreen'}>
        {deviceKey !== null && validateKeyCalledRef.current ? (
          <Stack.Screen
            name="MediaComponent"
            component={MediaComponent}
            options={{headerShown: false}}
          />
        ) : (
          <Stack.Screen
            name="BlankScreen"
            component={BlankScreen}
            options={{headerShown: false}}
          />
        )}
      </Stack.Navigator>
      <Toast />
    </NavigationContainer>
  );
};

export default App;
