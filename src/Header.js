import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {lightestGrey} from './colors';


const Header = ({stop}) => {
  const stopName = stop ? stop.node.stop.name : '';
  return (
    <View style={styles.container}>
      <Text>{stopName}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 40,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightestGrey,
  }
});

export default Header;