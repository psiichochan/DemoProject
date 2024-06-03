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
  StatusBar,
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
import Video from 'react-native-video';
import NetInfo from '@react-native-community/netinfo';

const MediaComponent = ({navigation}) => {
  const [mediaData, setMediaData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  // const [allMediaDisplayed, setAllMediaDisplayed] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [intervalTime, setIntervalTime] = useState();
  const [permissionsGranted, setPermissionGranted] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;
  // const [selectedValue, setSelectedValue] = useState('option1');
  const [textLength, setTextLength] = useState(0);
  const [showScrollingText, setShowScrollingText] = useState(false);
  const [stretchImage, setStretchImage] = useState(false);
  const [resizeModes, setResizeMode] = useState('');
  const [merge, setMerge] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const [modalClicked, setModalClicked] = useState(false);
  const [textFromFile, setTextFromFile] = useState('Welcome To ThinPC');
  // const [isVertical, setIsVertical] = useState(true);
  const [ipAddress, setIpAddress] = useState('');
  const [scrollSpeed, setScrollSpeed] = useState('10');
  const [selectAnimation, setSelectAnimation] = useState('');
  const intervalIdRef = useRef(null);
  const videoRef = useRef(null);
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
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
      const savedScrollSpeed = await AsyncStorage.getItem('scrollSpeed');
      const saveScrollingText = await AsyncStorage.getItem('showScrollingText');
      const stretchedImage = await AsyncStorage.getItem('stretchImages');
      const heyThere = await AsyncStorage.getItem('mergeContain');
      const heypublic = heyThere === 'true';
      const how = saveScrollingText === 'true';
      console.log('savedScrollSpeed', savedScrollSpeed);
      setShowScrollingText(how);
      setResizeMode(heyThere);
      setMerge(heypublic);

      const initialIntervalTime = savedIntervalTime || '5';
      const initialScrollSpeed = savedScrollSpeed || '10';
      console.log('initialInterValTIme: ', savedIntervalTime);
      setIntervalTime(initialIntervalTime);
      setScrollSpeed(initialScrollSpeed);
      startMediaLoop(initialIntervalTime);
    };
    handleAppStart();
  }, [modalClicked, startMediaLoop]);

  const readTextFromFile = async () => {
    try {
      const tickerFolderPath =
        RNFS.ExternalStorageDirectoryPath + '/signage/ticker/';
      const filesInTickerFolder = await RNFS.readDir(tickerFolderPath);
      const animationAfter = await AsyncStorage.getItem('animation');

      setSelectedAnimationRestart(animationAfter);
      if (filesInTickerFolder.length > 0) {
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
          duration: parseInt(scrollSpeed, 10) * 1000,
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
      );
      const videoFiles = await RNFS.readDir(
        `${mediaDirectoryPath}/signage/video/`,
      );
      const mediaDatas = [...imageFiles, ...videoFiles];
      setMediaData(mediaDatas);
      console.log(mediaDatas);
    } catch (error) {
      console.error('Error picking media from directory:', error);
    }
  };

  const startMediaLoop = useCallback(
    // eslint-disable-next-line no-shadow
    intervalTime => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      const intervalDuration = parseInt(intervalTime, 10) * 1000;
      intervalIdRef.current = setInterval(() => {
        setCurrentIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % mediaData.length;
          return nextIndex;
        });
      }, intervalDuration);
      return () => {
        clearInterval(intervalIdRef.current);
      };
    },
    [mediaData.length],
  );

  useEffect(() => {
    if (mediaData.length > 0) {
      animateTransition();
    }
  }, [animateTransition, currentIndex, mediaData.length]);

  const animateTransition = useCallback(() => {
    animatedValue.setValue(0);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
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

  const renderMedia = () => {
    const currentMedia = mediaData[currentIndex];
    if (currentMedia) {
      const mediaExtension = currentMedia.name.split('.').pop().toLowerCase();
      if (mediaExtension === 'mp4') {
        return (
          <Video
            key={currentMedia.path}
            ref={videoRef}
            source={{uri: `file://${currentMedia.path}`}}
            style={styles.backgroundVideo}
            resizeMode="contain"
            onEnd={handleVideoEnd}
            repeat={false}
          />
        );
      } else {
        return (
          <AnimatedTouchable
            style={[styles.mediaContainer, getAnimationStyle()]}
            onPress={() => setIsModalVisible(true)}>
            <Animated.Image
              key={currentMedia.path}
              source={{uri: `file://${currentMedia.path}`}}
              style={[styles.image]}
              resizeMode="contain"
              onPress={() => setIsModalVisible(true)}
            />
          </AnimatedTouchable>
        );
      }
    } else {
      console.log('No media found.');
      return null;
    }
  };

  const handleVideoEnd = () => {
    setCurrentIndex(prevIndex => {
      const nextIndex = (prevIndex + 1) % mediaData.length;
      return nextIndex;
    });
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
    await AsyncStorage.setItem('stretchImages', stretchImage.toString());
    await AsyncStorage.setItem('mergeContain', merge.toString());

    setTimeout(() => {
      Restart.Restart();
    }, 500);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    startMediaLoop(intervalTime);
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      {renderMedia()}
      {showScrollingText && (
        <Animated.View
          style={[
            styles.scrollingTextContainer,
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
          ]}
          onLayout={event => setTextLength(event.nativeEvent.layout.width)}>
          <Text style={styles.scrollingText}>{textFromFile}</Text>
        </Animated.View>
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
                  style={styles.checkBox}
                  checked={showScrollingText}
                  onChange={() => setShowScrollingText(!showScrollingText)}
                />
              </View>
              {/* <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Image Stretch: </Text>
                <CheckBox
                  style={styles.checkBox}
                  checked={stretchImage}
                  onChange={() => setStretchImage(!stretchImage)}
                />
              </View> */}
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Merge Contain: </Text>
                <CheckBox
                  style={styles.checkBox}
                  checked={merge}
                  onChange={() => setMerge(!merge)}
                />
              </View>
              <View>
                <Text style={styles.modalLabel}>Split Screen</Text>
              </View>

              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Animation Direction</Text>
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
  },
  image: {
    width: '100%',
    height: '100%',
  },
  backgroundVideo: {
    width: '100%',
    height: '100%',
  },
  buttonText: {
    fontSize: 16,
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
    // alignItems: 'center',
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
