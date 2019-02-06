import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {lightestGrey, white} from './colors';


const Header = ({stop}) => {
  const stopName = stop ? stop.node.stop.name : '';
  const noStopStyle = stop ? {} : {borderBottomWidth: 0};
  return (
    <View style={[styles.container, noStopStyle]}>
      <Text style={styles.text}>{stopName}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 40,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: white,
    borderBottomWidth: 2,
    borderBottomColor: lightestGrey,
  },
  text: {
    fontSize: 18,
  },
});

export default Header;