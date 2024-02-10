/* eslint-disable prettier/prettier */
import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import Images from './component/Images';
import Videos from './component/Videos';
import UsbDetection from './component/UsbDetection';
import {NativeModules, ToastAndroid} from 'react-native';
import ScrollingText from './component/ScrollingText';

const Stack = createStackNavigator();
const usbDetectionModule = NativeModules.UsbDetectionModule;

const App = () => {
  useEffect(() => {
    if (usbDetectionModule) {
      usbDetectionModule.startUsbDetection();
    } else {
      console.error('UsbDetectionModule is not available.');
    }

    const usbListener = UsbDetection.addUsbListener(isConnected => {
      console.log(`USB Connected: ${isConnected}`);

      if (isConnected) {
        // You can add your logic here for USB connection
        ToastAndroid.showWithGravity(
          'PenDrive Is Connected Copying Data',
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
        );
      } else if (isConnected === false) {
        ToastAndroid.showWithGravity(
          'PenDrive Is DisConnected',
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
        );
      }
    });

    return () => {
      UsbDetection.removeUsbListener(usbListener);
    };
  }, [usbDetectionModule]);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Images">
        <Stack.Screen
          name="Images"
          component={Images}
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
