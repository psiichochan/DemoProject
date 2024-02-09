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
  Alert,
} from 'react-native';
import RNFS from 'react-native-fs';
import {check, PERMISSIONS, RESULTS, request} from 'react-native-permissions';

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
  const [intervalTime, setIntervalTime] = useState('5');
  const [permissionsGranted, setPermissionGranted] = useState(false);
  const [imagesFound, setImagesFound] = useState(true);

  const intervalIdRef = useRef(null);

  useEffect(() => {
    const fetchDataAndStartLoop = async () => {
      requestStoragePermissionWrite();
      setPermissionGranted(true);
      if (permissionsGranted) {
        await requestStoragePermission();
        // await createSignageFolder();
        await pickMediaFromDirectory();
        // Start the image loop fter fetchinghe data
        startImageLoop();
      }
    };

    fetchDataAndStartLoop();
  }, []);

  // Example:
  useEffect(() => {
    startImageLoop();
  }, [imageData, intervalTime, isModalVisible]);

  useEffect(() => {
    // Navigate to the 'Videos' screen wen all images are displayed
    if (allImagesDisplayed) {
      navigation.navigate('Videos');
    }
  }, [allImagesDisplayed, navigation]);

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

        // Create subfolders inside the main folder
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

      const imageDatas = [
        require('../assets/image/11.jpeg'),
        require('../assets/image/12.jpeg'),
        require('../assets/image/13.jpeg'),
        require('../assets/image/14.jpeg'),
      ];

      // Check if imageFiles is not null or undefined before updating the state
      if (imageFiles && imageFiles.length > 0) {
        setImageData(imageFiles);
      } else {
        setImageData(imageDatas);
        setImagesFound(false);
        // console.logeData[currentImageIndex].imagePath}`);

        console.error('No image files found in the directory.');
      }
    } catch (error) {
      console.error('Error picking media from direcory:', error);
    }
  };
  const startImageLoop = () => {
    if (imageData.length > 0 && !isModalVisible) {
      // Clear the existing interval
      stopImageLoop();

      // Reset the allImagesDisplayed state
      setAllImagesDisplayed(false);

      // Set an interval to change the displayed image every specified seconds
      intervalIdRef.current = setInterval(() => {
        setCurrentImageIndex(prevIndex => {
          const newIndex = (prevIndex + 1) % imageData.length;
          if (newIndex === 0) {
            setAllImagesDisplayed(true);
          }
          return newIndex;
        });
      }, parseInt(intervalTime, 10) * 1000); // Convert seconds to milliseconds
    }
  };
  const stopImageLoop = () => {
    // Clear the existing interval to stop the
    clearInterval(intervalIdRef.current);
  };

  const handleImageClick = () => {
    // Show the modal on image click
    setIsModalVisible(true);
    // Stop the image loop when the modal is visible
    stopImageLoop();
  };

  const handleModalClose = () => {
    // Close the modal
    setIsModalVisible(false);
    // Restart the image loop from the beginning when the modal is closed
    startImageLoop();
  };

  const handleSaveIntervalTime = () => {
    // Update the interval time and restart the image loop
    setIsModalVisible(false);
    startImageLoop();
  };

  return (
    <View>
      {imagesFound === true ? (
        <TouchableOpacity onPress={handleImageClick}>
          <Image
            key={currentImageIndex}
            source={imageData[currentImageIndex]}
            style={styles.image}
          />
        </TouchableOpacity>
      ) : (
        imageData.length > 0 && (
          <TouchableOpacity onPress={handleImageClick}>
            <Image
              key={currentImageIndex}
              source={{uri: `file://${imageData[currentImageIndex].path}`}}
              style={styles.image}
            />
          </TouchableOpacity>
        )
      )}

      {/* Modal for changing iterva time */}
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
              onChangeText={text => setIntervalTime(text)}
            />
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
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {width: '100%', height: '100%'},
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
