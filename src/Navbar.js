import React from 'react';
import {View, Text, StyleSheet, TouchableHighlight} from 'react-native';
import {lightestGrey, white, grey} from './colors';


const Button = ({text, selected, onPress}) => {
  return (
    <TouchableHighlight style={styles.buttonContainer} onPress={onPress}>
      <Text style={[styles.buttonText, !selected ? {color: grey} : null]}>{text}</Text>
    </TouchableHighlight>
  )
};

const Navbar = ({selectedView, changeView}) => {
  return (
    <View style={styles.container}>
      <Button text="Near" selected={selectedView === 'near'} onPress={() => changeView("near")} />
      <Button text="Favorites" selected={selectedView === 'favorites'} onPress={() => changeView("favorites")} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 50,
    width: '100%',
    flexDirection: 'row',
    backgroundColor: white,
    borderTopWidth: 1,
    borderTopColor: lightestGrey,
  },
  buttonContainer: {
    backgroundColor: white,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#333333',
  },
});

export default Navbar;