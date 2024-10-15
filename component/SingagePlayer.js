/* eslint-disable prettier/prettier */
import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Easing,
  StatusBar,
  Image,
} from 'react-native';
import CustomCheckBox from './CustomCheckBox'; // Adjust the path if necessary
import RNFS from 'react-native-fs';
import Restart from 'react-native-restart';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {check, PERMISSIONS, request, RESULTS} from 'react-native-permissions';
import FolderManagerModule from './FolderManagerModule';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Video from 'react-native-video';
import NetInfo from '@react-native-community/netinfo';

const MediaComponent = ({navigation}) => {
  const [mediaData, setMediaData] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [intervalTime, setIntervalTime] = useState();
  const [permissionsGranted, setPermissionGranted] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [textLength, setTextLength] = useState(0);
  const [showScrollingText, setShowScrollingText] = useState(false);
  const [merge, setMerge] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const [modalClicked, setModalClicked] = useState(false);
  const [textFromFile, setTextFromFile] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [scrollSpeed, setScrollSpeed] = useState('10');
  const [selectAnimation, setSelectAnimation] = useState('right');
  const intervalIdRef = useRef(null);
  const videoRef = useRef(null);
  const [tickerAnimatedValue] = useState(new Animated.Value(0));
  const [animationRestart, setSelectedAnimationRestart] = useState('');

  useEffect(() => {
    const fetchIpAddress = async () => {
      try {
        const netInfo = await NetInfo.fetch();
        const localIpAddress = netInfo.details.ipAddress;
        setIpAddress(localIpAddress);
      } catch (error) {
        console.error('Error fetching IP address:', error);
      }
    };
    fetchIpAddress();
  }, []);

  useEffect(() => {
    const fetchDataAndStartLoop = async () => {
      const requestStoragePermissionWrite = async () => {
        try {
          const permissionStatus = await check(
            PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
          );
          if (permissionStatus !== RESULTS.GRANTED) {
            const permissionRequestResult = await request(
              PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
            );
            if (permissionRequestResult !== RESULTS.GRANTED) {
              console.warn('Write storage permission not granted.');
              Alert.alert(
                'Permission Required',
                'Please grant storage permission to use the app.',
              );
            } else {
              console.log('Write storage permission granted.');
              createFolders();
              handleCreateFolders();
            }
          } else {
            console.log('Write storage permission already granted.');
            createFolders();
          }
        } catch (error) {
          console.error(
            'Error checking or requesting storage permission:',
            error,
          );
        }
      };
      await requestStoragePermissionWrite();
      setPermissionGranted(true);
      await readTextFromFile();
      await pickMediaFromDirectory();
      if (permissionsGranted) {
        await requestStoragePermission();
      }
    };
    fetchDataAndStartLoop();
  }, [permissionsGranted, readTextFromFile]);

  useEffect(() => {
    pickMediaFromDirectory();
  }, []);

  useEffect(() => {
    if (mediaData.length > 0) {
      if (mediaData.length === 1 && mediaData[0].type === 'video') {
        videoRef.current?.seek(0);
      } else {
        if (mediaData[currentIndex].type === 'image') {
        }
      }
    }
  }, [mediaData, intervalTime, navigation, currentIndex]);

  useEffect(() => {
    const handleAppStart = async () => {
      const savedIntervalTime = await AsyncStorage.getItem('intervalTime');
      const savedScrollSpeed = await AsyncStorage.getItem('scrollSpeed'); // Add this line
      const saveScrollingText = await AsyncStorage.getItem('showScrollingText');
      const how = saveScrollingText === 'true';
      const heyThere = await AsyncStorage.getItem('mergeContain');
      const heypublic = heyThere === 'true';
      setShowScrollingText(how);
      setMerge(heypublic);

      const initialIntervalTime = savedIntervalTime || '5';
      const initialScrollSpeed = savedScrollSpeed || '10'; // Set default scrolling speed to 10 seconds
      setIntervalTime(initialIntervalTime);
      setScrollSpeed(initialScrollSpeed); // Set the scrolling speed
    };

    handleAppStart();
  }, [modalClicked]);

  const readTextFromFile = useCallback(async () => {
    try {
      const tickerFolderPath = RNFS.ExternalDirectoryPath + '/signage/ticker/';
      const filesInTickerFolder = await RNFS.readDir(tickerFolderPath);
      const animationAfter = await AsyncStorage.getItem('animation');
      setSelectedAnimationRestart(animationAfter);

      if (filesInTickerFolder.length > 0) {
        // Read the content of the first file in the "ticker" folder
        const firstFilePath = filesInTickerFolder[0].path;
        const fileContent = await RNFS.readFile(firstFilePath, 'utf8');
        setTextFromFile(fileContent);
        console.log('hey there : ', textFromFile);
      } else {
        console.warn('No files found in the "ticker" folder.');
      }
    } catch (error) {
      console.error('Error reading text from file:', error);
    }
  }, [textFromFile]);

  useEffect(() => {
    if (showScrollingText && textFromFile) {
      const startTickerAnimation = () => {
        tickerAnimatedValue.setValue(0);
        Animated.timing(tickerAnimatedValue, {
          toValue: 1,
          duration: parseInt(scrollSpeed, 10) * 1000, // Convert to milliseconds
          useNativeDriver: true,
          easing: Easing.linear,
        }).start(({finished}) => {
          if (finished) {
            startTickerAnimation(); // Restart the animation when it finishes
          }
        });
      };

      startTickerAnimation();

      return () => {
        tickerAnimatedValue.stopAnimation();
      };
    }
  }, [showScrollingText, textFromFile, scrollSpeed, tickerAnimatedValue]);

  // const animateText = useCallback(() => {
  //   try {
  //     if (showScrollingText) {
  //       Animated.loop(
  //         Animated.timing(animatedValue, {
  //           toValue: 1,
  //           duration: parseInt(scrollSpeed, 10) * 1000, // Correctly using scrollSpeed for duration
  //           useNativeDriver: true,
  //           easing: Easing.linear, // Ensure the scroll is smooth
  //         }),
  //       ).start();
  //     }
  //   } catch (error) {
  //     console.error('An error occurred:', error);
  //   }
  // }, [animatedValue, scrollSpeed, showScrollingText]);

  // useEffect(() => {
  //   animateText();
  // }, [scrollSpeed, textFromFile, showScrollingText, animateText]);

  const requestStoragePermission = async () => {
    try {
      const permissionStatus = await check(
        PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
      );
      const writePermissionStatus = await check(
        PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
      );
      if (
        permissionStatus !== RESULTS.GRANTED ||
        writePermissionStatus !== RESULTS.GRANTED
      ) {
        const permissionRequestResult = await request([
          PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
          PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
        ]);
        if (
          permissionRequestResult[0] !== RESULTS.GRANTED ||
          permissionRequestResult[1] !== RESULTS.GRANTED
        ) {
          console.warn('Read or write storage permission not granted.');
        }
      }
    } catch (error) {
      console.error('Error checking or requesting storage permission:', error);
    }
  };

  const handleCreateFolders = () => {
    FolderManagerModule.createFolders();
  };

  const createFolders = async () => {
    try {
      const storagePath = RNFS.ExternalDirectoryPath;
      const mainFolderPath = `${storagePath}/signage`;
      const isMainFolderExists = await RNFS.exists(mainFolderPath);
      if (!isMainFolderExists) {
        await RNFS.mkdir(mainFolderPath);
        const subfolders = ['image', 'video', 'audio', 'ticker'];
        for (const subfolder of subfolders) {
          const subfolderPath = `${mainFolderPath}/${subfolder}`;
          const isSubfolderExists = await RNFS.exists(subfolderPath);
          if (!isSubfolderExists) {
            await RNFS.mkdir(subfolderPath);
          } else {
            console.log(
              `Subfolder "${subfolder}" already exists:`,
              subfolderPath,
            );
          }
        }
      } else {
        console.log(
          'Main folder already exists through react-native :',
          mainFolderPath,
        );
      }
    } catch (error) {
      console.error('Error creating folders through react-native:', error);
    }
  };

  const pickMediaFromDirectory = async () => {
    try {
      const mediaDirectoryPath = RNFS.ExternalDirectoryPath;
      const imageFiles = await RNFS.readDir(
        `${mediaDirectoryPath}/signage/image/`,
      );
      const videoFiles = await RNFS.readDir(
        `${mediaDirectoryPath}/signage/video/`,
      );
      const mediaDatas = imageFiles.map(file => ({
        type: 'image',
        path: `file://${file.path}`,
      }));

      mediaDatas.push(
        ...videoFiles.map(file => ({
          type: 'video',
          path: `file://${file.path}`,
        })),
      );
      setMediaData(mediaDatas);
    } catch (error) {
      console.error('Error picking media from directory:', error);
    }
  };

  useEffect(() => {
    const preloadImages = async () => {
      if (mediaData.length > 0) {
        const imagePromises = mediaData
          .filter(media => media.type === 'image')
          .map(media => Image.prefetch(`file://${media.path}`));
        await Promise.all(imagePromises);
      }
    };

    preloadImages();
  }, [mediaData]);
  useEffect(() => {
    if (mediaData.length > 0 && !isModalVisible && !isPaused) {
      stopMediaLoop();

      const handleMediaSwitch = () => {
        setCurrentIndex(prevIndex => {
          const newIndex = (prevIndex + 1) % mediaData.length;
          const nextMedia = mediaData[newIndex];

          if (nextMedia.type === 'video') {
            return newIndex;
          } else {
            intervalIdRef.current = setTimeout(
              handleMediaSwitch,
              (intervalTime || 5) * 1000,
            );
            return newIndex;
          }
        });
      };

      const currentMedia = mediaData[currentIndex];
      if (currentMedia.type === 'image') {
        intervalIdRef.current = setTimeout(
          handleMediaSwitch,
          (intervalTime || 5) * 1000,
        );
      }
    }

    return stopMediaLoop;
  }, [
    mediaData,
    isModalVisible,
    intervalTime,
    currentIndex,
    animateTransition,
    isPaused,
  ]);
  const stopMediaLoop = () => {
    if (intervalIdRef.current) {
      clearTimeout(intervalIdRef.current);
    }
  };
  useEffect(() => {
    if (mediaData.length > 0) {
      animateTransition();
    }
  }, [animateTransition, currentIndex, mediaData.length]);
  const animateTransition = useCallback(() => {
    animatedValue.setValue(0);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 50,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease),
    }).start(({finished}) => {
      if (finished) {
      }
    });
  }, [animatedValue]);

  const getAnimationStyle = () => {
    const slideFromRight = {
      transform: [
        {
          translateX: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [screenWidth, 0],
          }),
        },
      ],
    };

    const slideFromLeft = {
      transform: [
        {
          translateX: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [-screenWidth, 0],
          }),
        },
      ],
    };

    const slideFromTop = {
      transform: [
        {
          translateY: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [-screenHeight, 0],
          }),
        },
      ],
    };

    const slideFromBottom = {
      transform: [
        {
          translateY: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [screenHeight, 0],
          }),
        },
      ],
    };

    const fade = {
      opacity: animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      }),
    };

    switch (animationRestart) {
      case 'right':
        return slideFromRight;
      case 'left':
        return slideFromLeft;
      case 'top':
        return slideFromTop;
      case 'bottom':
        return slideFromBottom;
      case 'fade':
        return fade;
      default:
        return slideFromRight;
    }
  };

  // useEffect(() => {
  //   if (mediaData.length > 0 && !isAnimating) {
  //     animateTransition();
  //   }
  // }, [animateTransition, currentIndex, mediaData.length, isAnimating]);

  const renderMedia = () => {
    const currentMedia = mediaData[currentIndex];
    if (currentMedia) {
      return (
        <Animated.View style={[styles.mediaContainer, getAnimationStyle()]}>
          <TouchableWithoutFeedback onPress={handleMediaClick}>
            {currentMedia.type === 'image' ? (
              <Image
                key={currentMedia.path}
                source={{uri: `file://${currentMedia.path}`}}
                style={styles.image}
                resizeMode="stretch"
              />
            ) : (
              <Video
                source={{uri: currentMedia.path}}
                style={styles.media}
                resizeMode="stretch"
                onLoad={videoLoadHandler}
                repeat={mediaData.length === 1}
                paused={isPaused || isModalVisible}
                onEnd={() => {
                  if (mediaData.length > 1 && !isPaused && !isModalVisible) {
                    setCurrentIndex(
                      prevIndex => (prevIndex + 1) % mediaData.length,
                    );
                    animateTransition();
                  }
                }}
              />
            )}
          </TouchableWithoutFeedback>
        </Animated.View>
      );
    } else {
      console.log('No media found.');
      return null;
    }
  };

  const handleMediaClick = () => {
    setIsModalVisible(true);
    setIsPaused(true);
    stopMediaLoop();
  };

  const videoLoadHandler = details => {
    const {duration} = details;

    if (mediaData.length === 1 && mediaData[0].type === 'video') {
      clearTimeout(intervalIdRef.current);
      intervalIdRef.current = setTimeout(() => {
        setCurrentIndex(0); // This will effectively restart the video
      }, duration * 1000);
    }
  };
  const handleSaveIntervalTime = async () => {
    setIsModalVisible(false);
    setModalClicked(true);

    await AsyncStorage.setItem('intervalTime', intervalTime);
    await AsyncStorage.setItem('scrollSpeed', scrollSpeed);
    await AsyncStorage.setItem('animation', selectAnimation);
    await AsyncStorage.setItem(
      'showScrollingText',
      showScrollingText.toString(),
    );
    await AsyncStorage.setItem('mergeContain', merge.toString());

    // Restart the application
    Restart.Restart();
  };
  useEffect(() => {
    const loadAnimationDirection = async () => {
      try {
        const savedAnimation = await AsyncStorage.getItem('animation');
        if (savedAnimation !== null) {
          setSelectAnimation(savedAnimation);
        }
      } catch (e) {
        console.error('Failed to load the animation direction.');
      }
    };

    loadAnimationDirection();
  }, []);

  useEffect(() => {
    return () => stopMediaLoop(); // Clear the interval when the component unmounts
  }, []);

  const handleModalClose = () => {
    setIsModalVisible(false);
    setIsPaused(false);
  };

  useEffect(() => {
    return () => stopMediaLoop(); // Clear the interval when the component unmounts
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      {renderMedia()}
      {showScrollingText && (
        <View style={styles.containerTicker}>
          <Animated.View
            style={[
              styles.tickerContainer,
              {
                transform: [
                  {
                    translateX: tickerAnimatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        Dimensions.get('window').width,
                        -textLength,
                      ],
                    }),
                  },
                ],
              },
            ]}>
            <Text
              style={styles.tickerText}
              onLayout={event => {
                setTextLength(event.nativeEvent.layout.width);
              }}>
              {textFromFile}
            </Text>
          </Animated.View>
        </View>
      )}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={handleModalClose}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalBody}>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Interval Time (sec): </Text>
                <TextInput
                  style={styles.modalInput}
                  value={intervalTime}
                  onChangeText={text => setIntervalTime(text)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Scroll Speed (sec): </Text>
                <TextInput
                  style={styles.modalInput}
                  value={scrollSpeed}
                  onChangeText={text => setScrollSpeed(text)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>IP Address: </Text>
                <TextInput
                  style={styles.modalInput}
                  value={ipAddress}
                  onChangeText={text => setIntervalTime(text)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Show Scrolling Text: </Text>
                <CustomCheckBox
                  style={styles.checkBox}
                  checked={showScrollingText}
                  onChange={newValue => setShowScrollingText(newValue)}
                  label=""
                />
              </View>

              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Merge Contain: </Text>
                <CustomCheckBox
                  style={styles.checkBox}
                  checked={merge}
                  onChange={() => setMerge(!merge)}
                />
              </View>

              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Animation Direction: </Text>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[
                      styles.directionButton,
                      selectAnimation === 'left' && styles.selectedButton,
                    ]}
                    onPress={() => setSelectAnimation('left')}>
                    <Text style={styles.buttonText}>Left</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.directionButton,
                      selectAnimation === 'right' && styles.selectedButton,
                    ]}
                    onPress={() => setSelectAnimation('right')}>
                    <Text style={styles.buttonText}>Right</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.directionButton,
                      selectAnimation === 'top' && styles.selectedButton,
                    ]}
                    onPress={() => setSelectAnimation('top')}>
                    <Text style={styles.buttonText}>Up</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.directionButton,
                      selectAnimation === 'bottom' && styles.selectedButton,
                    ]}
                    onPress={() => setSelectAnimation('bottom')}>
                    <Text style={styles.buttonText}>Down</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleModalClose}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleSaveIntervalTime}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  containerTicker: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    height: 30,
    justifyContent: 'center',
  },
  tickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tickerText: {
    color: 'white',
    fontSize: 16,
    // whiteSpace: 'nowrap',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  backgroundVideo: {
    width: '100%',
    height: '100%',
  },
  buttonText: {
    fontSize: 16,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  checkBox: {marginLeft: 20},
  scrollingTextContainer: {
    position: 'absolute',
    bottom: hp('2%'),
  },
  scrollingText: {
    fontSize: wp('5%'),
    color: '#FFFFFF',
  },
  modalBody: {
    padding: 20,
  },
  modalInput: {
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#3E92CC',
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
  },

  directionButton: {
    padding: 10,
    margin: 5,
    backgroundColor: '#ddd',
    borderRadius: 5,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalLabel: {
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    color: 'black',
    fontWeight: 'bold',

    alignContent: 'space-between',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#3E92CC',
  },
  selectedButton: {
    backgroundColor: 'blue',
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#3E92CC',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    textAlign: 'center',
  },
  orientationToggle: {
    position: 'absolute',
    top: hp('2%'),
    left: wp('2%'),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: wp('2%'),
    borderRadius: wp('2%'),
  },
  orientationText: {
    color: '#FFFFFF',
    fontSize: wp('4%'),
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },

  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    padding: wp('2%'),
    marginBottom: wp('2%'),
  },
  submitButton: {
    backgroundColor: '#007BFF',
    padding: wp('3%'),
    borderRadius: wp('2%'),
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: wp('4%'),
    textAlign: 'center',
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
  },
});

export default MediaComponent;
