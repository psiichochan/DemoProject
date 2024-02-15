/* eslint-disable prettier/prettier */
import React, {useState, useEffect} from 'react';
import {View, StyleSheet, BackHandler} from 'react-native';
import Video from 'react-native-video';
import RNFS from 'react-native-fs';

const Videos = () => {
  const [videoData, setVideoData] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  useEffect(() => {
    pickMediaFromDirectory();

    const handleBackButton = () => {
      // Handle cleanup or other tasks before going back
      BackHandler.exitApp(); // Exit the app when the back button is pressed on any video
      return true; // Return true to prevent default back button behavior
    };

    const backHandlerSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackButton,
    );

    return () => {
      backHandlerSubscription.remove();
    };
  }, []); // Run this effect only once on component mount

  const pickMediaFromDirectory = async () => {
    try {
      const mediaDirectoryPath = RNFS.ExternalStorageDirectoryPath;
      const videoFiles = await RNFS.readDir(
        `${mediaDirectoryPath}/signage/video/`,
        'video',
      );
      setVideoData(videoFiles);
    } catch (error) {
      console.error('Error picking media from directory:', error);
    }
  };

  const playNextVideo = () => {
    setCurrentVideoIndex(prevIndex => (prevIndex + 1) % videoData.length);
  };

  if (videoData.length === 0) {
    return null; // or a loading indicator if you want
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
    </View>
  );
};

const styles = StyleSheet.create({
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
