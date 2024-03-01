/* eslint-disable prettier/prettier */
import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Orientation from 'react-native-orientation-locker';

const Orientations = () => {
  const [isVertical, setIsVertical] = useState(true);

  useEffect(() => {
    const loadOrientationState = async () => {
      try {
        const storedOrientation = await AsyncStorage.getItem('isVertical');
        if (storedOrientation !== null) {
          setIsVertical(JSON.parse(storedOrientation));
        }
      } catch (error) {
        console.error('Error loading orientation state:', error);
      }
    };

    loadOrientationState();

    // Lock initial orientation
    Orientation.lockToPortrait(); // or lockToLandscape();
  }, []);

  useEffect(() => {
    const saveOrientationState = async () => {
      try {
        await AsyncStorage.setItem('isVertical', JSON.stringify(isVertical));
      } catch (error) {
        console.error('Error saving orientation state:', error);
      }
    };

    saveOrientationState();

    // Lock/unlock orientation based on the state
    if (isVertical) {
      Orientation.lockToPortrait();
    } else {
      Orientation.unlockAllOrientations();
    }
  }, [isVertical]);

  const toggleOrientation = () => {
    // Toggle between portrait and landscape
    setIsVertical(prevIsVertical => !prevIsVertical);
  };

  return (
    <View style={styles.container}>
      {/* Your existing components go here */}
      <Text onPress={toggleOrientation}>Toggle Orientation</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Orientations;
