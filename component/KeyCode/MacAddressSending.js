/* eslint-disable prettier/prettier */
// MacAddressSending.js
import React, {useEffect, useState} from 'react';
import {View, Text, Button, Alert} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import axios from 'axios';

const MacAddressSending = () => {
  const [deviceId, setDeviceId] = useState('');

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
    if (!deviceId) {
      Alert.alert('Error', 'Device ID is not available.');
      return;
    }

    const apiUrl =
      'https://script.google.com/macros/s/AKfycbwO3ObmJ9C1pVYHjiUPy8LIzdX6MvBzZKYCTA7S3lFidc9UKb8UcB6vXKBkRrqMGXI/exec'; // Replace with your deployed web app URL
    const timestamp = new Date().toISOString();

    try {
      const response = await axios.post(apiUrl, {
        deviceId,
        timestamp,
      });

      console.log(response.status);

      console.log('Data sent to Google Sheet:', response.data);
      Alert.alert('Success', 'Data sent to Google Sheet!');
    } catch (error) {
      console.error('Error sending data to Google Sheet:', error);
      Alert.alert(
        'Error',
        'Failed to send data to Google Sheet. Please try again.',
      );
    }
  };

  return (
    <View>
      <Text>Device ID: {deviceId}</Text>
      <Button title="Send to Google Sheet" onPress={sendDataToGoogleSheet} />
    </View>
  );
};

export default MacAddressSending;
