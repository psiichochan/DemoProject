/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable prettier/prettier */
import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  BackHandler,
  Animated,
  Dimensions,
  Text,
} from 'react-native';
import Video from 'react-native-video';
import RNFS from 'react-native-fs';
import {useFocusEffect} from '@react-navigation/native'; // Import useFocusEffect
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

const Videos = ({navigation, route}) => {
  const {showScrollingText} = true;

  const [videoData, setVideoData] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [textFromFile, setTextFromFile] = useState('');
  const [textLength, setTextLength] = useState(0);
  const screenWidth = Dimensions.get('window').width;
  const staticText = 'WelcomeThinPc';

  const readTextFromFile = async () => {
    try {
      const tickerFolderPath =
        RNFS.ExternalStorageDirectoryPath + '/signage/ticker/';
      const filesInTickerFolder = await RNFS.readDir(tickerFolderPath);

      if (filesInTickerFolder.length > 0) {
        // Read the content of the first file in the "ticker" folder
        const firstFilePath = filesInTickerFolder[0].path;
        const fileContent = await RNFS.readFile(firstFilePath, 'utf8');
        setTextFromFile(fileContent);
        console.log('File content:', fileContent);
      } else {
        console.warn('No files found in the "ticker" folder.');
      }
    } catch (error) {
      console.error('Error reading text from file:', error);
    }
  };

  useEffect(() => {
    pickMediaFromDirectory();
    readTextFromFile();

    const scrollText = () => {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 30000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]).start(() => {
        scrollText();
      });
    };

    scrollText();

    const handleBackButton = () => {
      BackHandler.exitApp();
      return true;
    };

    const backHandlerSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackButton,
    );

    return () => {
      backHandlerSubscription.remove();
    };
  }, [animatedValue]);

  const pickMediaFromDirectory = async () => {
    try {
      const mediaDirectoryPath = RNFS.ExternalStorageDirectoryPath;
      const videoFiles = await RNFS.readDir(
        `${mediaDirectoryPath}/signage/video/`,
        'video',
      );
      if (videoFiles.length === 0) {
        navigation.goBack();
        console.log('No videos found in directory');
      } else {
        setVideoData(videoFiles);
      }
    } catch (error) {
      console.error('Error picking media from directory:', error);
    }
  };

  const playNextVideo = () => {
    const nextIndex = (currentVideoIndex + 1) % videoData.length;

    // Check if the next index is the first one, indicating that all videos have been played
    if (nextIndex === 0) {
      // Navigate back to the "Images" screen
      navigation.navigate('Images');
    } else {
      // Play the next video
      setCurrentVideoIndex(nextIndex);
    }
  };

  // Use useFocusEffect to reset currentVideoIndex when the component is focused
  useFocusEffect(
    React.useCallback(() => {
      setCurrentVideoIndex(0);
    }, []),
  );

  if (videoData.length === 0) {
    return null;
  }

  const videoSource = {uri: `file://${videoData[currentVideoIndex].path}`};

  return (
    <View style={styles.container}>
      <Video
        source={videoSource}
        style={styles.video}
        resizeMode="cover"
        onEnd={() => playNextVideo()}
        muted={false}
      />
      {showScrollingText && (
        <View style={styles.containerTicker}>
          <Animated.View
            style={[
              styles.tickerContainer,
              {
                transform: [
                  {
                    translateX: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [screenWidth, -textLength - screenWidth],
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  containerTicker: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: hp(3),
    backgroundColor: 'black',
    overflow: 'hidden',
  },
  tickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: wp(200),
  },
  tickerText: {
    fontSize: 24,
    color: 'green',
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});

export default Videos;
