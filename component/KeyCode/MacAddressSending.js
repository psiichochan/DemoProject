/* eslint-disable prettier/prettier */
// MacAddressSending.js
import React, {useEffect, useState} from 'react';
import {View, Text, Button, Alert, TextInput} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import axios from 'axios';

const MacAddressSending = () => {
  const [deviceId, setDeviceId] = useState('');
  const [userDeviceKey, setUserDeviceKey] = useState('');
  const [deviceKey1, setDeviceKey] = useState('');

  useEffect(() => {
    const fetchDeviceId = async () => {
      try {
        const id = await DeviceInfo.getUniqueId();
        setDeviceId(id);
      } catch (error) {
        console.error('Error getting device ID:', error);
        Alert.alert('Error', 'Failed to get device ID. Please try again.');
      }
    };

    fetchDeviceId();
  }, []);

  const sendDataToGoogleSheet = async () => {
    // if (!deviceId) {
    //   Alert.alert('Error', 'Device ID is not available.');
    //   return;
    // }

    const apiUrl =
      'https://script.google.com/macros/s/AKfycbwO3ObmJ9C1pVYHjiUPy8LIzdX6MvBzZKYCTA7S3lFidc9UKb8UcB6vXKBkRrqMGXI/exec'; // Replace with your deployed web app URL
    const timestamp = new Date().toISOString();

    try {
      const response = await axios.post(apiUrl, {
        deviceId,
        timestamp,
      });

      console.log(response.status);

      if (response.status === 200 && response.data && response.data.deviceKey) {
        const deviceKey = response.data.deviceKey;
        console.log('Data sent to Google Sheet. Device Key:', deviceKey);
        setDeviceKey(deviceKey);
      } else {
        console.error('Invalid response data:', response.data);
        Alert.alert(
          'Error',
          'Failed to send data to Google Sheet. Invalid response data.',
        );
      }
    } catch (error) {
      console.error('Error sending data to Google Sheet:', error);
      Alert.alert(
        'Error',
        'Failed to send data to Google Sheet. Please try again.',
      );
    }
  };

  const validateKey = () => {
    if (deviceKey1 === userDeviceKey) {
      Alert.alert('Success', 'Device key validated.');
    } else {
      Alert.alert(
        'Error',
        'Device key validation failed. Please check the entered key.',
      );
    }
  };

  return (
    <View>
      <Text>Device ID: {deviceId}</Text>
      <TextInput
        placeholder="Enter Device Key"
        value={userDeviceKey}
        onChangeText={text => setUserDeviceKey(text)}
      />
      <Button title="Send to Google Sheet" onPress={sendDataToGoogleSheet} />
      <Button title="Validate" onPress={validateKey} />
    </View>
  );
};

export default MacAddressSending;
