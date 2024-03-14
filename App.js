/* eslint-disable prettier/prettier */
import React, {useEffect, useState, useRef} from 'react';
import {NavigationContainer} from '@react-navigation/native';
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
import RNFetchBlob from 'rn-fetch-blob';
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
  const [deviceId, setDeviceId] = useState(null);
  const [deviceKey, setDeviceKey] = useState('');
  const [signageChanges, setSignageChanges] = useState(false);

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
    let watcher;

    const watchSignageFolder = async () => {
      const signageFolderPath = `${RNFetchBlob.fs.dirs.SDCardDir}/signage`;

      console.log('Watching signage folder:', signageFolderPath);

      watcher = await RNFetchBlob.fs.watch(signageFolderPath, {interval: 500});

      watcher.onData = (eventType, filePath) => {
        console.log('Signage folder has changed. Event type:', eventType);
        console.log('Changed path:', filePath);

        // Optional: Log additional details about the event
        setSignageChanges(true);

        // Restart the application
        Restart.Restart();
      };

      watcher.onError = error => {
        console.log('Error in the signage folder watcher:', error);
      };

      watcher.start();
    };

    watchSignageFolder();

    return () => {
      watcher && watcher.stop();
    };
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

  const sendDataToGoogleSheet = async () => {
    const apiUrl =
      'https://script.google.com/macros/s/AKfycbxjg6T9NMO11YZ_KLAGYnXLps63TAprbRFnIPKhCZ424Vvb1_NdykECg3meZSkhBokgtg/exec';
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
          console.log('Data sent to Google Sheet. Device Key:', deviceKey1);
          // setDeviceKey(deviceKey1);
          await AsyncStorage.setItem('deviceKey', deviceKey1); // Store deviceKey in AsyncStorage
          console.log('API Call: ', deviceKey1);
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
  };

  const validateKey = async () => {
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
  };

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
  }, [deviceId]);

  useEffect(() => {
    const loadPersistedValues = async () => {
      const isValidateKeyCalled = await AsyncStorage.getItem(
        'validateKeyCalled',
      );
      console.log(
        'Retrieved value of validateKeyCalled from AsyncStorage:',
        isValidateKeyCalled,
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
    console.log('Device ID effect triggered');
    // Rest of the code for this effect...
  }, [deviceId]);

  useEffect(() => {
    console.log('AsyncStorage initialization effect triggered');
    // Rest of the code for this effect...
  }, []);

  useEffect(() => {
    console.log('AsyncStorage update effect triggered');
    // Rest of the code for this effect...
  }, [validateKeyCalledRef.current]);

  useEffect(() => {
    if (deviceId && !validateKeyCalledRef.current) {
      validateKey();
      validateKeyCalledRef.current = true;
      AsyncStorage.setItem('validateKeyCalled', 'true'); // Persist the value
    }
  }, [deviceId]);

  useEffect(() => {
    if (USBModule.addListener && USBModule.removeListeners) {
      const usbListener = usbEvents.addListener(
        'USBConnected',
        async connectedUsbPath => {
          setUsbPath(connectedUsbPath);
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

  const copyFolderFromUsb = async usbPath1 => {
    try {
      const sourcePath = `${usbPath1}/signage`;
      const destinationPath = `${RNFS.ExternalStorageDirectoryPath}/signage`;

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
      console.log('Please Remove the USB. Folder Copied Successful');
      Restart.Restart();
    } catch (error) {
      console.error('Error copying signage folder:', error);
    }
  };

  async function copyRecursive(source, destination) {
    console.log(`${source} => ${destination}`);

    const destinationExists = await RNFS.exists(destination);
    if (destinationExists) {
      console.log(`Deleting existing destination folder: ${destination}`);
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
  }

  return (
    <NavigationContainer>
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
