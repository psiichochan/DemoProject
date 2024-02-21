/* eslint-disable prettier/prettier */
import React, {useEffect, useState, useRef} from 'react';
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
import RNFS from 'react-native-fs';
import Restart from 'react-native-restart';
import CheckBox from 'react-native-checkbox';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {check, PERMISSIONS, RESULTS, request} from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Images = ({navigation}) => {
  const [imageData, setImageData] = useState([
    require('../assets/image/11.jpeg'),
    require('../assets/image/12.jpeg'),
    require('../assets/image/13.jpeg'),
    require('../assets/image/14.jpeg'),
  ]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [allImagesDisplayed, setAllImagesDisplayed] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [intervalTime, setIntervalTime] = useState();
  const [permissionsGranted, setPermissionGranted] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [textLength, setTextLength] = useState(0);
  const [showScrollingText, setShowScrollingText] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const [modalClicked, setModalClicked] = useState(false);
  const [textFromFile, setTextFromFile] = useState('Welcome To ThinPC');
  // const [imagesDisplayedCount, setImagesDisplayedCount] = useState(0);
  const [imagesFound, setImagesFound] = useState(true);
  const [displayedImages, setDisplayedImages] = useState([]);
  const [currentImagePath, setCurrentImagePath] = useState('');
  const staticText = 'WelcomeThinPc';

  const intervalIdRef = useRef(null);
  useEffect(() => {
    // Navigate to the 'Videos' screen when all images are displayed or no images are found
    if (displayedImages.length === imageData.length || !imagesFound) {
      navigation.navigate('Videos', {
        showScrollingText,
      });
    }
  }, [displayedImages, imagesFound, navigation]);

  useEffect(() => {
    const scrollText = () => {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 30000, // Set the duration to the desired value (30 seconds in this example)
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 0, // Set duration to 0 to immediately reset to the initial position
          useNativeDriver: true,
        }),
      ]).start(() => {
        scrollText(); // Call scrollText again to restart the animation
      });
    };

    scrollText();
  }, [animatedValue, screenWidth]);

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
  }, []);

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

      const imageDatas = imageFiles.map(file => ({
        path: `file://${file.path}`, // Add 'file://' prefix
      }));

      if (imageFiles && imageFiles.length > 0) {
        setImageData(imageDatas);
        setCurrentImagePath(imageDatas[0].path); // Set the initial image path
      } else {
        setImagesFound(false);
        console.error('No image files found in the directory.');
        navigation.navigate('Videos');
      }
    } catch (error) {
      console.error('Error picking media from directory:', error);
    }
  };
  useEffect(() => {
    pickMediaFromDirectory();
  }, []);

  useEffect(() => {
    // Handle changes to currentImageIndex and update currentImagePath
    if (imageData.length > 0) {
      setCurrentImagePath(imageData[currentImageIndex]?.path || '');
    }
  }, [currentImageIndex, imageData]);

  const startImageLoop = initialIntervalTime => {
    console.log('Starting image loop with interval time:', initialIntervalTime);
    if (imageData.length > 0 && !isModalVisible) {
      // Clear the existing interval
      stopImageLoop();

      // Reset the displayedImages state
      setDisplayedImages([]);

      // Set an interval to change the displayed image every specified seconds
      intervalIdRef.current = setInterval(() => {
        setCurrentImageIndex(prevIndex => {
          const newIndex = (prevIndex + 1) % imageData.length;

          // Check if this image has already been displayed
          if (!displayedImages.includes(newIndex)) {
            // Add the index to the displayedImages array
            setDisplayedImages(prev => [...prev, newIndex]);

            // Check if this is the last image
            if (newIndex === 0) {
              setAllImagesDisplayed(true);
            }

            return newIndex;
          } else {
            // If the image has already been displayed, find the next non-displayed image
            for (let i = 0; i < imageData.length; i++) {
              const nextIndex = (newIndex + i) % imageData.length;
              if (!displayedImages.includes(nextIndex)) {
                setDisplayedImages(prev => [...prev, nextIndex]);
                return nextIndex;
              }
            }
          }
        });
      }, parseInt(initialIntervalTime, 10) * 1000);
    }
  };

  const stopImageLoop = () => {
    // Clear the existing interval to stop the loop
    clearInterval(intervalIdRef.current);
  };

  const handleImageClick = () => {
    // Show the modal on image click
    setIsModalVisible(true);
    // Stop the image loop when the modal is visib
    stopImageLoop();
  };

  const handleModalClose = () => {
    // Close the modal
    setIsModalVisible(false);
    // Restart the image loop from the beginning when the modal is closed
    startImageLoop(intervalTime);
  };

  const handleSaveIntervalTime = async () => {
    setIsModalVisible(false);
    setModalClicked(true);

    // Save the interval time
    await AsyncStorage.setItem('intervalTime', intervalTime);
    // Save the showScrollingText state
    await AsyncStorage.setItem(
      'showScrollingText',
      showScrollingText.toString(),
    );

    // Delay the restart to ensure AsyncStorage is updated before restarting
    setTimeout(() => {
      // Restart the app
      Restart.Restart();
    }, 500);
  };

  useEffect(() => {
    AsyncStorage.setItem('intervalTime', intervalTime);
  }, [intervalTime]);
  useEffect(() => {
    // Additional logic to handle AsyncStorage retrieval on app restart
    const handleAppStart = async () => {
      const savedIntervalTime = await AsyncStorage.getItem('intervalTime');
      const saveScrollingText = await AsyncStorage.getItem('showScrollingText');
      const how = saveScrollingText === 'true';
      console.log(how, modalClicked, typeof how);
      setShowScrollingText(how);

      const initialIntervalTime = savedIntervalTime || '5';
      console.log('initialInterValTIme: ', savedIntervalTime);
      setIntervalTime(initialIntervalTime);
      startImageLoop(initialIntervalTime);
    };

    handleAppStart();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {currentImagePath !== '' && (
          <TouchableOpacity onPress={handleImageClick}>
            <Image
              key={currentImagePath}
              source={{uri: currentImagePath}}
              style={styles.image}
            />
          </TouchableOpacity>
        )}
      </View>
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

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleModalClose}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.titleText}>Image Change Duration</Text>
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
  imageContainer: {
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
  image: {
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  containerTicker: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: hp(4),
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

export default Images;
