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
import FastImage from 'react-native-fast-image';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {check, PERMISSIONS, request, RESULTS} from 'react-native-permissions';
import {Image as RNImage} from 'react-native'; // Import Image as RNImage

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
  const [textFromFile, setTextFromFile] = useState('Welcome To ThinPC');
  const [isVertical, setIsVertical] = useState(true);
  const [mediaFound, setMediaFound] = useState(true);
  const [ipAddress, setIpAddress] = useState('');
  const [scrollSpeed, setScrollSpeed] = useState('10'); // Initial value set to 10 seconds

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
      setMediaFound(false);
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
    const animateText = () => {
      console.log('scroll', scrollSpeed);
      Animated.loop(
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: parseInt(scrollSpeed, 10) * 1000, // Use scrollSpeed
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

  const createFolders = async () => {
    try {
      const storagePath = RNFS.ExternalStorageDirectoryPath;
      const mainFolderPath = `${storagePath}/signage`;

      const isMainFolderExists = await RNFS.exists(mainFolderPath);

      if (!isMainFolderExists) {
        await RNFS.mkdir(mainFolderPath);
        console.log('Main folder created successfully:', mainFolderPath);

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
        console.log('Main folder already exists:', mainFolderPath);
      }
    } catch (error) {
      console.error('Error creating folders:', error);
    }
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
        setMediaFound(false);
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

  const preloadNextImage = useCallback(() => {
    const nextIndex = (currentIndex + 1) % mediaData.length;
    const nextMedia = mediaData[nextIndex];

    if (nextMedia && nextMedia.type === 'image') {
      FastImage.preload([{uri: nextMedia.path}]);
    }
  }, [currentIndex, mediaData]);
  const startMediaLoop = useCallback(
    initialIntervalTime => {
      if (mediaData.length > 0 && !isModalVisible) {
        stopMediaLoop();
        intervalIdRef.current = setInterval(() => {
          setCurrentIndex(prevIndex => {
            const newIndex = (prevIndex + 1) % mediaData.length;

            if (!allMediaDisplayed) {
              setAllMediaDisplayed(newIndex === 0);
            }

            preloadNextImage();

            const currentMedia = mediaData[newIndex];
            if (currentMedia.type === 'video') {
              videoRef.current?.seek(0);
              videoRef.current?.pause();
            }

            return newIndex;
          });
        }, parseInt(initialIntervalTime, 10) * 1000);
      }
    },
    [mediaData, isModalVisible, allMediaDisplayed, preloadNextImage],
  );

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
                <FastImage
                  source={{uri: currentMedia.path}}
                  style={styles.media}
                  resizeMode={FastImage.resizeMode.cover}
                  onLoad={preloadNextImage}
                  key={currentMedia.path}
                />
              </View>
            </TouchableWithoutFeedback>
          );
        } else if (currentMedia.type === 'video') {
          const videoSource = {uri: currentMedia.path};
          return (
            <TouchableWithoutFeedback onPress={handleMediaClick}>
              <Video
                source={videoSource}
                style={styles.media}
                resizeMode="cover"
                onLoad={videoLoadHandler}
                ref={videoRef}
              />
            </TouchableWithoutFeedback>
          );
        }
      }
    }
  };

  const videoLoadHandler = details => {
    const {duration} = details;

    clearInterval(intervalIdRef.current);

    intervalIdRef.current = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const newIndex = (prevIndex + 1) % mediaData.length;

        if (!allMediaDisplayed) {
          setAllMediaDisplayed(newIndex === 0);
        }

        return newIndex;
      });
    }, duration * 1000);
  };

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
        isVertical ? styles.vertical : styles.horizontal,
      ]}>
      <View style={styles.ipAddressContainer}>
        <Text style={styles.ipAddressText1}>{ipAddress}</Text>
      </View>
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
              {textFromFile || 'Welcome To ThinPc'}
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
                <Text style={styles.modalLabel}>Interval Time (sec)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={intervalTime}
                  onChangeText={text => setIntervalTime(text)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Scroll Speed (sec)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={scrollSpeed}
                  onChangeText={text => setScrollSpeed(text)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>IP Address</Text>
                <TextInput
                  style={styles.modalInput}
                  value={ipAddress}
                  onChangeText={text => setIntervalTime(text)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Show Scrolling Text</Text>
                <CheckBox
                  label="Show Scrolling Text"
                  checked={showScrollingText}
                  onChange={() => setShowScrollingText(!showScrollingText)}
                />
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
  },
  containerTicker: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'black',
    width: '100%',
  },
  tickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // paddingHorizontal: wp('2%'),
  },
  tickerText: {
    color: 'white',
    fontSize: hp('2'),
    fontFamily: 'Roboto-Regular',
  },
  ipAddressContainer: {
    position: 'absolute',
    top: 100,
    backgroundColor: 'black',
    paddingHorizontal: wp('2'),
    paddingVertical: hp('0.5'),
    borderRadius: 5,
  },
  ipAddressText1: {
    color: 'white',
    fontSize: hp('1.5%'),
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
    flex: 1,
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
