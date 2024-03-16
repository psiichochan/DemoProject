/* eslint-disable prettier/prettier */
// FolderManagerModule.js

import {NativeModules} from 'react-native';

const {FolderManager} = NativeModules;

export default {
  createFolders: () => {
    FolderManager.createFolders();
  },
};
