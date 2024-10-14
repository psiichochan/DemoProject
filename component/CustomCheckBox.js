/* eslint-disable prettier/prettier */
// CustomCheckBox.js
import React from 'react';
import {TouchableOpacity, View, Text, StyleSheet} from 'react-native';

const CustomCheckBox = ({style, checked, onChange, label}) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={() => onChange(!checked)}>
      <View style={[styles.checkbox, checked && styles.checked]}>
        {checked && <View style={styles.checkMark} />}
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#3E92CC',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checked: {
    backgroundColor: '#3E92CC',
  },
  checkMark: {
    width: 12,
    height: 6,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'white',
    transform: [{rotate: '-45deg'}],
  },
  label: {
    fontSize: 16,
    color: '#333',
  },
});

export default CustomCheckBox;
