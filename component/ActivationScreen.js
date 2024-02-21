/* eslint-disable prettier/prettier */
import React from 'react';
import {
  View,
  ImageBackground,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';

const ActivationScreen = ({navigation}) => {
  return (
    <View style={styles.container}>
      {/* Background Image */}
      <ImageBackground
        source={require('../assets/image/1159.jpg')}
        style={styles.backgroundImage}>
        {/* Your content goes here */}

        {/* Two Buttons at the bottom */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Images')}>
            <Text style={styles.buttonText}>Demo Mode</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Images')}>
            <Text style={styles.buttonText}>Activate</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'stretch', // or 'stretch' or 'contain'
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 20,
    // alignSelf: 'auto',
  },
  button: {
    backgroundColor: '#a59f9f', // semi-transparent black background
    padding: 15,
    borderRadius: 10,
    width: '48%', // to distribute buttons evenly on screen
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ActivationScreen;
