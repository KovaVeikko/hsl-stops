import React from 'react';
import {
  StyleSheet,
  View,
  Text,
} from 'react-native';

const LocationDeniedMessage = () => (
  <View style={styles.container}>
    <Text style={styles.bodyText}>
      Location permission must be enabled to use this app.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  bodyText: {
    fontSize: 20,
    color: '#222222',
    textAlign: 'center',
  },
});

export default LocationDeniedMessage;