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
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import RNFS from 'react-native-fs';
import CheckBox from 'react-native-checkbox';
import Video from 'react-native-video';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {check, PERMISSIONS, RESULTS, request} from 'react-native-permissions';

const SignagePlayer = ({navigation}) => {
  const [mediaData, setMediaData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allMediaDisplayed, setAllMediaDisplayed] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [intervalTime, setIntervalTime] = useState('5');
  const [permissionsGranted, setPermissionGranted] = useState(false);
  const [mediaFound, setMediaFound] = useState(true);
  const [textLength, setTextLength] = useState(0);
  const [showScrollingText, setShowScrollingText] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const [modalClicked, setModalClicked] = useState(false);
  const [textFromFile, setTextFromFile] = useState('');
  const [isVideo, setIsVideo] = useState(false);
  const staticText = 'WelcomeThinPc';

  const intervalIdRef = useRef(null);
  const animatedValue = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    const fetchDataAndStartLoop = async () => {
      requestStoragePermissionWrite();
      setPermissionGranted(true);
      await pickMediaFromDirectory();
      if (permissionsGranted) {
        await requestStoragePermission();
        startMediaLoop();
      }
    };

    fetchDataAndStartLoop();
  }, []);

  useEffect(() => {
    startMediaLoop();
  }, [mediaData, intervalTime, isModalVisible]);

  useEffect(() => {
    if (allMediaDisplayed) {
      navigation.navigate('Media'); // You may adjust the navigation destination
    }
  }, [allMediaDisplayed, navigation]);

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

      const combinedMediaData = imageFiles.map(file => ({
        ...file,
        isImage: true,
        isVideo: false,
      }));

      videoFiles.forEach(file => {
        combinedMediaData.push({
          ...file,
          isImage: false,
          isVideo: true,
        });
      });

      setMediaData(combinedMediaData);
    } catch (error) {
      console.error('Error picking media from directory:', error);
    }
  };

  const startMediaLoop = () => {
    if (mediaData.length > 0 && !isModalVisible) {
      clearInterval(intervalIdRef.current);
      setAllMediaDisplayed(false);

      intervalIdRef.current = setInterval(() => {
        setCurrentIndex(prevIndex => {
          const newIndex = (prevIndex + 1) % mediaData.length;
          if (newIndex === 0) {
            setAllMediaDisplayed(true);
          }

          setIsVideo(mediaData[newIndex].isVideo);

          return newIndex;
        });
      }, parseInt(intervalTime, 10) * 1000);
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
    startMediaLoop();
  };

  const handleSaveIntervalTime = () => {
    setIsModalVisible(false);
    setModalClicked(true);
    if (showScrollingText) {
      startMediaLoop();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.mediaContainer}>
        {mediaFound === false ? (
          <TouchableOpacity onPress={handleMediaClick}>
            <Image
              key={currentIndex}
              source={mediaData[currentIndex]}
              style={styles.media}
            />
          </TouchableOpacity>
        ) : (
          mediaData.length > 0 && (
            <TouchableOpacity onPress={handleMediaClick}>
              {isVideo ? (
                <Video
                  key={currentIndex}
                  source={{uri: `file://${mediaData[currentIndex].path}`}}
                  style={styles.media}
                  resizeMode="cover"
                  onEnd={() => {
                    setCurrentIndex(
                      prevIndex => (prevIndex + 1) % mediaData.length,
                    );
                    setIsVideo(
                      mediaData[(currentIndex + 1) % mediaData.length].isVideo,
                    );
                  }}
                  muted={false}
                />
              ) : (
                <Image
                  key={currentIndex}
                  source={{uri: `file://${mediaData[currentIndex].path}`}}
                  style={styles.media}
                />
              )}
            </TouchableOpacity>
          )
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
              {textFromFile || staticText}
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
