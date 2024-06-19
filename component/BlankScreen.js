/* eslint-disable prettier/prettier */
import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import DeviceInfo from 'react-native-device-info';

const BlankScreen = () => {
  const [deviceId, setDeviceId] = useState(null);

  const fetchDeviceId = async () => {
    try {
      const id = await DeviceInfo.getUniqueId();
      setDeviceId(id);
    } catch (error) {
      console.error('Error getting device ID:', error);
    }
  };

  useEffect(() => {
    const hello = async () => {
      fetchDeviceId();
    };
    hello();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        You are out of licensed. Purchase the key.
      </Text>
      <Text style={[styles.text, {top: 50}]}>Device Id: {deviceId}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white', // Change to your preferred background color
  },
  text: {
    fontSize: 20,
    textAlign: 'center',
    color: 'black',
    fontWeight: 'bold',
  },
});

export default BlankScreen;
