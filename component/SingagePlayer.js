/* eslint-disable prettier/prettier */
import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Image,
  Modal,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Text,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import RNFS from 'react-native-fs';
import Restart from 'react-native-restart';
import CheckBox from 'react-native-checkbox';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {check, PERMISSIONS, request, RESULTS} from 'react-native-permissions';
import FolderManagerModule from './FolderManagerModule';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Video from 'react-native-video';
import NetInfo from '@react-native-community/netinfo';

const MediaComponent = ({navigation}) => {
  const [mediaData, setMediaData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allMediaDisplayed, setAllMediaDisplayed] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [intervalTime, setIntervalTime] = useState();
  const [permissionsGranted, setPermissionGranted] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [textLength, setTextLength] = useState(0);
  const [showScrollingText, setShowScrollingText] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const [modalClicked, setModalClicked] = useState(false);
  const [textFromFile, setTextFromFile] = useState('');
  const [isVertical, setIsVertical] = useState(true);
  const [ipAddress, setIpAddress] = useState('');
  const [scrollSpeed, setScrollSpeed] = useState('10'); // Initial value set to 10 seconds
  const [selectAnimation, setSelectAnimation] = useState('left');

  const intervalIdRef = useRef(null);

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
      console.log(permissionsGranted);
      if (permissionsGranted) {
        await requestStoragePermission();
      }
    };

    fetchDataAndStartLoop();
  }, [permissionsGranted]);

  useEffect(() => {
    pickMediaFromDirectory();
  }, []);

  useEffect(() => {
    if (mediaData.length > 0) {
      startMediaLoop(intervalTime);
    } else {
      console.log('No media files found.');
    }
  }, [mediaData, intervalTime, navigation, startMediaLoop]);

  useEffect(() => {
    const handleAppStart = async () => {
      const savedIntervalTime = await AsyncStorage.getItem('intervalTime');
      const savedScrollSpeed = await AsyncStorage.getItem('scrollSpeed'); // Add this line
      const saveScrollingText = await AsyncStorage.getItem('showScrollingText');
      const how = saveScrollingText === 'true';
      console.log('savedScrollSpeed', savedScrollSpeed);
      setShowScrollingText(how);

      const initialIntervalTime = savedIntervalTime || '5';
      const initialScrollSpeed = savedScrollSpeed || '10'; // Set default scrolling speed to 10 seconds
      console.log('initialInterValTIme: ', savedIntervalTime);
      setIntervalTime(initialIntervalTime);
      setScrollSpeed(initialScrollSpeed); // Set the scrolling speed
      startMediaLoop(initialIntervalTime);
    };

    handleAppStart();
  }, [modalClicked, startMediaLoop]);

  const readTextFromFile = async () => {
    try {
      const tickerFolderPath = RNFS.ExternalDirectoryPath + '/signage/ticker/';
      const filesInTickerFolder = await RNFS.readDir(tickerFolderPath);

      if (filesInTickerFolder.length > 0) {
        // Read the content of the first file in the "ticker" folder
        const firstFilePath = filesInTickerFolder[0].path;
        const fileContent = await RNFS.readFile(firstFilePath, 'utf8');
        setTextFromFile(fileContent);
      } else {
        console.warn('No files found in the "ticker" folder.');
      }
    } catch (error) {
      console.error('Error reading text from file:', error);
    }
  };

  useEffect(() => {
    const animateText = () => {
      console.log('scroll', scrollSpeed);
      Animated.loop(
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: parseInt(scrollSpeed, 20) * 1000, // Use scrollSpeed
          useNativeDriver: true,
        }),
      ).start();
    };

    if (showScrollingText) {
      animateText();
    }
  }, [animatedValue, showScrollingText, scrollSpeed]);

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
        const permissionRequestResult = await request(
          PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
          PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
        );

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
    FolderManagerModule.createFolders(); // Call the method to create folders
  };

  const createFolders = async () => {
    try {
      const storagePath = RNFS.ExternalDirectoryPath;
      const mainFolderPath = `${storagePath}/signage`;
      console.log('this is path: ', storagePath);

      const isMainFolderExists = await RNFS.exists(mainFolderPath);

      if (!isMainFolderExists) {
        await RNFS.mkdir(mainFolderPath);

        console.log(
          'Main folder created successfully through react-native:',
          mainFolderPath,
        );

        const subfolders = ['image', 'video', 'audio', 'ticker'];
        for (const subfolder of subfolders) {
          const subfolderPath = `${mainFolderPath}/${subfolder}`;
          const isSubfolderExists = await RNFS.exists(subfolderPath);

          if (!isSubfolderExists) {
            await RNFS.mkdir(subfolderPath);
            console.log(
              `Subfolder "${subfolder}" created successfully:`,
              subfolderPath,
            );
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
        'image',
      );
      const videoFiles = await RNFS.readDir(
        `${mediaDirectoryPath}/signage/video/`,
        'video',
      );

      const mediaDatas = imageFiles.map(file => ({
        type: 'image',
        path: `file://${file.path}`, // Add 'file://' prefix
      }));

      mediaDatas.push(
        ...videoFiles.map(file => ({
          type: 'video',
          path: `file://${file.path}`,
        })),
      );

      if (mediaDatas.length > 0) {
        setMediaData(mediaDatas);
      } else {
        Toast.show({
          type: 'success',
          position: 'top',
          text1: 'No media files found in the directory.',
          visibilityTime: 3000,
          autoHide: true,
          topOffset: 30,
          textStyle: {fontWeight: 'bold', fontSize: 150},
          alignSelf: 'center',
        });
        console.error('No media files found in the directory.');
      }
    } catch (error) {
      console.error('Error picking media from directory:', error);
    }
  };

  const startMediaLoop = useCallback(() => {
    if (mediaData.length > 0 && !isModalVisible) {
      stopMediaLoop();

      // Check if there's only one media item and it's a video
      if (mediaData.length === 1 && mediaData[0].type === 'video') {
        // If only one video, let it loop by setting the onEnd callback
        setCurrentIndex(0);
        setAllMediaDisplayed(true); // Set to true since all media is displayed
      } else {
        // For multiple media items, use intervalTime
        intervalIdRef.current = setInterval(() => {
          setCurrentIndex(prevIndex => {
            const newIndex = (prevIndex + 1) % mediaData.length;
            if (!allMediaDisplayed) {
              setAllMediaDisplayed(newIndex === 0);
            }
            return newIndex;
          });
        }, parseInt(intervalTime, 10) * 1000);
      }
    }
  }, [mediaData, isModalVisible, intervalTime, allMediaDisplayed]);

  const stopMediaLoop = () => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
    }
  };

  const handleMediaClick = () => {
    setIsModalVisible(true);
    stopMediaLoop();
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    startMediaLoop(intervalTime);
  };

  const handleSaveIntervalTime = async () => {
    setIsModalVisible(false);
    setModalClicked(true);

    await AsyncStorage.setItem('intervalTime', intervalTime);
    await AsyncStorage.setItem('scrollSpeed', scrollSpeed);
    await AsyncStorage.setItem(
      'showScrollingText',
      showScrollingText.toString(),
    );

    setTimeout(() => {
      Restart.Restart();
    }, 500);
  };

  const videoRef = useRef(null);

  useEffect(() => {
    AsyncStorage.setItem('intervalTime', intervalTime);
  }, [intervalTime]);

  const renderMedia = () => {
    if (mediaData.length > 0) {
      const currentMedia = mediaData[currentIndex];

      if (currentMedia) {
        if (currentMedia.type === 'image') {
          return (
            <TouchableWithoutFeedback onPress={handleMediaClick}>
              <View style={styles.mediaContainer}>
                <Image
                  source={{uri: currentMedia.path}}
                  style={styles.media}
                  key={currentMedia.path}
                />
              </View>
            </TouchableWithoutFeedback>
          );
        } else if (currentMedia.type === 'video') {
          return (
            <TouchableWithoutFeedback onPress={handleMediaClick}>
              <Video
                source={{uri: currentMedia.path}}
                style={styles.media}
                resizeMode="cover"
                onLoad={videoLoadHandler}
                ref={videoRef}
                repeat={true} // This will loop the video
                onEnd={() => {
                  if (mediaData.length === 1) {
                    videoRef.current?.seek(0); // Seek to the start if only one video
                  } else {
                    setCurrentIndex(
                      prevIndex => (prevIndex + 1) % mediaData.length,
                    );
                  }
                }}
              />
            </TouchableWithoutFeedback>
          );
        }
      }
    }
  };

  const videoLoadHandler = details => {
    const {duration} = details;
    console.log('video duration: ', duration);

    if (mediaData.length === 1 && mediaData[0].type === 'video') {
      // If only one video, set the interval based on video length

      clearInterval(intervalIdRef.current);
      intervalIdRef.current = setInterval(() => {
        videoRef.current?.seek(0); // Restart the video
      }, duration * 1000); // Using video duration in milliseconds
    } else {
      // Regular case: use the duration from the `intervalTime` state
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = setInterval(() => {
        setCurrentIndex(prevIndex => (prevIndex + 1) % mediaData.length);
      }, parseInt(duration, 10) * 1000);
    }
  };
  useEffect(() => {
    if (!isModalVisible) {
      startMediaLoop(intervalTime);
    }

    return () => {
      clearInterval(intervalIdRef.current); // Cleanup on component unmount or when dependencies change
    };
  }, [intervalTime, mediaData, isModalVisible, startMediaLoop]);

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
  }, [isVertical]);

  return (
    <View
      style={[
        styles.container,
        // isVertical ? styles.vertical : styles.horizontal,
      ]}>
      {renderMedia()}
      {showScrollingText && (
        <View style={[styles.containerTicker]}>
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
                <Text style={styles.modalLabel}>Interval Time (sec) : </Text>
                <TextInput
                  style={styles.modalInput}
                  value={intervalTime}
                  onChangeText={text => setIntervalTime(text)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Scroll Speed (sec) : </Text>
                <TextInput
                  style={styles.modalInput}
                  value={scrollSpeed}
                  onChangeText={text => setScrollSpeed(text)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>IP Address : </Text>
                <TextInput
                  style={styles.modalInput}
                  value={ipAddress}
                  onChangeText={text => setIntervalTime(text)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Show Scrolling Text : </Text>
                <CheckBox
                  label="Show Scrolling Text"
                  checked={showScrollingText}
                  onChange={() => setShowScrollingText(!showScrollingText)}
                />
              </View>
              <View style={styles.animationContainer}>
                <Text style={styles.modalLabel}>Animation Direction : </Text>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[
                      styles.directionButton,
                      selectAnimation === 'random' && styles.selectedButton,
                    ]}
                    onPress={() => setSelectAnimation('random')}>
                    <Text
                      style={[
                        styles.buttonText,
                        selectAnimation === 'random' &&
                          styles.selectedButtonText,
                      ]}>
                      Random
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.directionButton,
                      selectAnimation === 'left' && styles.selectedButton,
                    ]}
                    onPress={() => setSelectAnimation('left')}>
                    <Text
                      style={[
                        styles.buttonText,
                        selectAnimation === 'left' && styles.selectedButtonText,
                      ]}>
                      Left
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.directionButton,
                      selectAnimation === 'right' && styles.selectedButton,
                    ]}
                    onPress={() => setSelectAnimation('right')}>
                    <Text
                      style={[
                        styles.buttonText,
                        selectAnimation === 'right' &&
                          styles.selectedButtonText,
                      ]}>
                      Right
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.directionButton,
                      selectAnimation === 'up' && styles.selectedButton,
                    ]}
                    onPress={() => setSelectAnimation('up')}>
                    <Text
                      style={[
                        styles.buttonText,
                        selectAnimation === 'up' && styles.selectedButtonText,
                      ]}>
                      Up
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.directionButton,
                      selectAnimation === 'down' && styles.selectedButton,
                    ]}
                    onPress={() => setSelectAnimation('down')}>
                    <Text
                      style={[
                        styles.buttonText,
                        selectAnimation === 'down' && styles.selectedButtonText,
                      ]}>
                      Down
                    </Text>
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
    position: 'relative',
  },
  containerTicker: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'black',
    width: '100%',
    height: hp(4),
  },
  selectedButton: {
    backgroundColor: '#343434',
  },
  selectedButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  directionButton: {
    padding: 10,
    margin: 5,
    backgroundColor: '#ddd',
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 16,
    color: 'black',
    fontWeight: '700',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  animationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(2),
  },
  tickerText: {
    color: 'white',
    fontSize: hp(2),
  },
  ipAddressContainer: {
    position: 'absolute',
    top: 10, // Position at the top of the container
    backgroundColor: 'black',
    paddingHorizontal: wp(1),

    borderRadius: 5,
    right: wp(1),
    zIndex: 1, // Ensure it appears above other content
  },
  ipAddressText1: {
    color: 'white',
    fontSize: hp(1),
    fontFamily: 'Roboto-Bold',
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    backgroundColor: '#3E92CC',
    padding: 15,
    alignItems: 'center',
  },
  modalHeaderText: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'Roboto-Bold',
  },
  modalBody: {
    padding: 20,
  },
  modalRow: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    fontWeight: 'bold',
    color: 'black',
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
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#3E92CC',
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
  horizontal: {
    flexDirection: 'row',
  },
  vertical: {
    flexDirection: 'column',
  },
});

export default MediaComponent;
