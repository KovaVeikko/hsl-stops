import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {lighterGrey, lightGrey, white, yellow} from './colors';
import Icon from "react-native-vector-icons/FontAwesome";


const Stop = ({stopData, chooseStop, stopId, getModeIcon, toggleFavorite, favoriteStopIds}) => {
  const {distance, stop} = stopData.node;
  const directions = stop.patterns.map(p => p.headsign);
  const directionsString = [...new Set(directions)].join(', ');
  const modes = [...new Set(stop.patterns.map(p => p.route.mode))];
  const activeStyle = stop.gtfsId === stopId
    ? styles.active
    : {};
  const isFavorite = favoriteStopIds && favoriteStopIds.includes(stop.gtfsId);
  return (
    <TouchableOpacity onPress={() => chooseStop(stop.gtfsId)}>
      <View style={[styles.container, activeStyle]}>
        <View style={styles.mode}>

          {modes.map((mode, idx) => (
            <Image
              key={idx}
              style={styles.modeIcon}
              source={getModeIcon(mode)}
            />
          ))}
        </View>
        <View style={styles.body}>
          <View style={styles.row}>
            <Text style={styles.nameText}>{stop.name}</Text>
            <Text style={styles.platformText}>{stop.platformCode}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.directionsText} numberOfLines={1}>{directionsString}</Text>
          </View>
        </View>
        <View style={styles.distance}>
          <Text style={styles.distanceText}>{(distance/1000).toFixed(1)} km</Text>
        </View>
        <View style={styles.star}>
          <TouchableOpacity onPress={() => toggleFavorite(stop.gtfsId)}>
            <Icon
              name={isFavorite ? "star" : "star-o"}
              size={20}
              color={isFavorite ? yellow :  lightGrey}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: white,
    padding: 10,
    flexDirection: 'row',
  },
  active: {
    backgroundColor: lighterGrey,
  },
  mode: {
    width: 25,
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    marginRight: 15,
  },
  distance: {
    width: 55,
    justifyContent: 'center',
  },
  star: {
    width: 25,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  modeIcon: {
    width: 15,
    height: 15,
  },
  nameText: {
    fontSize: 20,
    color: '#333333',
    marginBottom: 1,
  },
  directionsText: {
    color: '#555555',
  },
  platformText: {
    fontSize: 16,
    color: '#333333',
    marginLeft: 5,
    marginTop: 3,
  },
  distanceText: {
    fontSize: 14,
    color: '#333333',
  },
});

export default Stop;