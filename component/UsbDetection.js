/* eslint-disable prettier/prettier */
import {NativeEventEmitter, NativeModules} from 'react-native';

const {UsbDetectionModule} = NativeModules;
const usbEventEmitter = new NativeEventEmitter(UsbDetectionModule);

const UsbDetection = {
  startUsbDetection: () => UsbDetectionModule.startUsbDetection(),

  addUsbListener: callback => usbEventEmitter.addListener('usbEvent', callback),

  removeUsbListener: subscription => subscription.remove(),
};

export default UsbDetection;
