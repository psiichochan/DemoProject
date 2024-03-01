/* eslint-disable prettier/prettier */
import React, {useState, useEffect, useRef} from 'react';
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

import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Video from 'react-native-video';

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

  const intervalIdRef = useRef(null);

  useEffect(() => {
    const fetchDataAndStartLoop = async () => {
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
  }, [mediaData, intervalTime, navigation]);

  useEffect(() => {
    const handleAppStart = async () => {
      const savedIntervalTime = await AsyncStorage.getItem('intervalTime');
      const saveScrollingText = await AsyncStorage.getItem('showScrollingText');
      const how = saveScrollingText === 'true';
      console.log(how, modalClicked, typeof how);
      setShowScrollingText(how);

      const initialIntervalTime = savedIntervalTime || '5';
      console.log('initialInterValTIme: ', savedIntervalTime);
      setIntervalTime(initialIntervalTime);
      startMediaLoop(initialIntervalTime);
    };

    handleAppStart();
  }, [modalClicked]);

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
    if (showScrollingText) {
      animateText();
    }
  }, [showScrollingText]);

  const animateText = () => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 30000, // Adjust the duration as needed
        useNativeDriver: true,
      }),
    ).start();
  };

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
          // text2: 'Please Remove the USB',
          visibilityTime: 3000, // 3 seconds
          autoHide: true,
          topOffset: 30, // Adjust as needed
          textStyle: {fontWeight: 'bold', fontSize: 150},
          alignSelf: 'center',
        });
        console.error('No media files found in the directory.');
      }
    } catch (error) {
      console.error('Error picking media from directory:', error);
    }
  };

  const startMediaLoop = initialIntervalTime => {
    if (mediaData.length > 0 && !isModalVisible) {
      stopMediaLoop();
      intervalIdRef.current = setInterval(() => {
        setCurrentIndex(prevIndex => {
          const newIndex = (prevIndex + 1) % mediaData.length;

          if (!allMediaDisplayed) {
            // If not all media displayed, update state accordingly
            setAllMediaDisplayed(newIndex === 0);
          }

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

  const handleSaveIntervalTime = async () => {
    setIsModalVisible(false);
    setModalClicked(true);

    await AsyncStorage.setItem('intervalTime', intervalTime);
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
                  key={currentMedia.path}
                  source={{uri: currentMedia.path}}
                  style={styles.media}
                  resizeMode="contain"
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
                ref={videoRef} // Ref for the video component
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
          // If not all media displayed, update state accordingly
          setAllMediaDisplayed(newIndex === 0);
        }

        return newIndex;
      });
    }, duration * 1000); // Use video duration to switch to the next media
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

  // Save orientation state to AsyncStorage whenever it changes
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
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleModalClose}>
        <View
          style={[
            styles.modalContainer,
            isVertical ? null : styles.horizontal,
          ]}>
          <View style={styles.modalContent}>
            <Text style={styles.titleText}>Media Change Duration</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter interval time (in seconds)"
              keyboardType="numeric"
              value={intervalTime}
              onChangeText={text => {
                setIntervalTime(text);
                console.log('interval time is ', text);
              }}
            />
            <View style={styles.checkboxContainer}>
              <CheckBox
                label="Show Scrolling Text"
                checked={showScrollingText}
                onChange={() => setShowScrollingText(!showScrollingText)}
              />
              <CheckBox
                label="Vertical Orientation"
                checked={isVertical}
                onChange={() => setIsVertical(!isVertical)}
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
    zIndex: 0,
  },
  media: {
    width: '100%',
    height: '100%',
    zIndex: 1,
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
  containerTicker: {
    position: 'absolute',
    bottom: hp(1),
    left: 0,
    right: 0,
    backgroundColor: 'black',
    overflow: 'hidden',
    zIndex: 2,
  },
  tickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  tickerText: {
    fontSize: hp(2),
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
  mediaContainer: {
    flex: 1,
    backgroundColor: 'black', // Set the background color to black
  },
  vertical: {
    flexDirection: 'row', // Apply vertical orientation
  },
  horizontal: {
    flexDirection: 'column', // Apply horizontal orientation
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

export default MediaComponent;
