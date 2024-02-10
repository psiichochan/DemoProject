/* eslint-disable prettier/prettier */
import React, {useLayoutEffect, useEffect, useRef, useState} from 'react';
import {StyleSheet, View, Text, Animated, Dimensions} from 'react-native';
import RNFS from 'react-native-fs';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

const ScrollingTextTicker = () => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [textLength, setTextLength] = useState(0);
  const screenWidth = Dimensions.get('window').width;
  const [textFromFile, setTextFromFile] = useState('');
  const staticText = 'Welcome To ThinPc';

  useEffect(() => {
    readTextFromFile();
    const scrollText = () => {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 10000, // Adjust the duration as needed
        useNativeDriver: false,
      }).start(() => {
        animatedValue.setValue(0);
        scrollText();
      });
    };

    scrollText();
  }, [animatedValue, screenWidth]);

  const readTextFromFile = async () => {
    try {
      const filePath =
        RNFS.ExternalStorageDirectoryPath + '/signage/ticker/ticker.txt'; // Change the path accordingly
      const fileContent = await RNFS.readFile(filePath, 'utf8');
      setTextFromFile(fileContent);
    } catch (error) {
      console.error('Error reading text from file:', error);
    }
  };

  useLayoutEffect(() => {
    // Measure the width of the text after it is rendered
    if (textLength === 0) {
      setTextLength(screenWidth + textLength);
    }
  }, [textLength, screenWidth]);

  return (
    <View style={styles.containerTicker}>
      <Animated.View
        style={[
          styles.tickerContainer,
          {
            transform: [
              {
                translateX: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [screenWidth, -textLength],
                }),
              },
            ],
          },
        ]}>
        <Text
          style={styles.tickerText}
          onLayout={event => {
            if (textLength === 0) {
              setTextLength(event.nativeEvent.layout.width);
            }
          }}>
          {textFromFile || staticText}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  containerTicker: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 2,
    height: hp(3),
    width: hp(100),

    backgroundColor: 'black', // Set a background color to allow touch events to pass through
  },
  tickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: wp(2),
  },
  tickerText: {
    fontSize: 24,
    color: 'green',
    // Add other text styles as needed
  },
  image: {
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
});

export default ScrollingTextTicker;
