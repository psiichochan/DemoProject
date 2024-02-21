/* eslint-disable prettier/prettier */
import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  View,
  Image,
  Modal,
  TextInput,
  TouchableOpacity,
  Text,
  Animated,
  Dimensions,
} from 'react-native';
import Video from 'react-native-video';
import RNFS from 'react-native-fs';
import CheckBox from 'react-native-checkbox';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

const SignagePlayer = ({navigation}) => {
  const [mediaData, setMediaData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allMediaDisplayed, setAllMediaDisplayed] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [intervalTime, setIntervalTime] = useState('5');
  const [permissionsGranted, setPermissionGranted] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [textLength, setTextLength] = useState(0);
  const [showScrollingText, setShowScrollingText] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const [modalClicked, setModalClicked] = useState(false);
  const [textFromFile, setTextFromFile] = useState('');
  const [videoEnded, setVideoEnded] = useState(false);
  const intervalIdRef = useRef(null);

  useEffect(() => {
    readTextFromFile();

    const scrollText = () => {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 15000,
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
  }, [animatedValue, screenWidth]);

  const readTextFromFile = async () => {
    try {
      if (permissionsGranted) {
        const filePath =
          RNFS.ExternalStorageDirectoryPath + '/signage/ticker/ticker.txt';
        const fileContent = await RNFS.readFile(filePath, 'utf8');
        setTextFromFile(fileContent);
      }
    } catch (error) {
      console.error('Error reading text from file:', error);
    }
  };

  useEffect(() => {
    fetchDataAndStartLoop();
  }, []);

  useEffect(() => {
    if (allMediaDisplayed) {
      navigation.navigate('Videos');
    }
  }, [allMediaDisplayed, navigation]);

  const fetchDataAndStartLoop = async () => {
    await requestStoragePermissionWrite();
    setPermissionGranted(true);
    await pickMediaFromDirectory();
    if (permissionsGranted) {
      await requestStoragePermission();
    }
    const savedIntervalTime = await AsyncStorage.getItem('intervalTime');
    const initialIntervalTime = savedIntervalTime || '5';
    setIntervalTime(initialIntervalTime);
    startMediaLoop(initialIntervalTime);
  };

  const pickMediaFromDirectory = async () => {
    try {
      const mediaDirectoryPath = RNFS.ExternalStorageDirectoryPath;
      const imageFiles = await RNFS.readDir(
        `${mediaDirectoryPath}/signage/image/`,
        'image',
      );
      const videoFiles = await RNFS.readDir(
        `${mediaDirectoryPath}/signage/video/`,
        'video',
      );

      const imageDatas = imageFiles.map(file => ({
        path: `file://${file.path}`,
        isVideo: false,
      }));
      console.log(imageFiles);
      const videoDatas = videoFiles.map(file => ({
        path: `file://${file.path}`,
        isVideo: true,
      }));

      setMediaData([...imageDatas, ...videoDatas]);
    } catch (error) {
      console.error('Error picking media from directory:', error);
    }
  };

  const startMediaLoop = initialIntervalTime => {
    if (mediaData.length > 0 && !isModalVisible) {
      stopMediaLoop();
      setAllMediaDisplayed(false);
      intervalIdRef.current = setInterval(() => {
        setCurrentIndex(prevIndex => {
          const newIndex = (prevIndex + 1) % mediaData.length;
          if (newIndex === 0) {
            setAllMediaDisplayed(true);
          }
          setVideoEnded(mediaData[newIndex].isVideo);
          return newIndex;
        });
      }, parseInt(initialIntervalTime, 10) * 1000);
    }
  };

  const stopMediaLoop = () => {
    clearInterval(intervalIdRef.current);
  };

  const handleMediaClick = () => {
    setIsModalVisible(true);
    stopMediaLoop();
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    startMediaLoop(intervalTime);
  };

  const handleSaveIntervalTime = () => {
    setIsModalVisible(false);
    setModalClicked(true);
    if (showScrollingText) {
      startMediaLoop(intervalTime);
    }
  };

  useEffect(() => {
    AsyncStorage.setItem('intervalTime', intervalTime);
  }, [intervalTime]);

  return (
    <View style={styles.container}>
      <View style={styles.mediaContainer}>
        {mediaData.length > 0 && (
          <TouchableOpacity onPress={handleMediaClick}>
            {mediaData[currentIndex].isVideo ? (
              <Video
                key={currentIndex}
                source={{uri: mediaData[currentIndex].path}}
                style={styles.media}
                resizeMode="cover"
                onEnd={() => setVideoEnded(true)}
                muted={false}
              />
            ) : (
              <Image
                key={currentIndex}
                source={{uri: mediaData[currentIndex].path}}
                style={styles.media}
              />
            )}
          </TouchableOpacity>
        )}
      </View>

      {modalClicked && showScrollingText && (
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
              {textFromFile || 'WelcomeThinPc'}
            </Text>
          </Animated.View>
        </View>
      )}

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleModalClose}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.titleText}>Media Change Duration</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter interval time (in seconds)"
              keyboardType="numeric"
              value={intervalTime}
              onChangeText={text => setIntervalTime(text)}
            />
            <View style={styles.checkboxContainer}>
              <CheckBox
                label="Show Scrolling Text"
                checked={showScrollingText}
                onChange={() => setShowScrollingText(!showScrollingText)}
              />
            </View>
            <TouchableOpacity onPress={handleSaveIntervalTime}>
              <View style={styles.button}>
                <Text style={styles.buttonText}>Save</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleModalClose}>
              <View style={styles.button}>
                <Text style={styles.buttonText}>Cancel</Text>
              </View>
            </TouchableOpacity>
            {modalClicked && <Text style={styles.checkMark}>✔</Text>}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mediaContainer: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  checkMark: {
    fontSize: 24,
    color: 'green',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  media: {
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
  },
});

export default SignagePlayer;
