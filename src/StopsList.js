import {FlatList, Image, Text, TouchableHighlight, View, StyleSheet} from "react-native";
import React from "react";


const Stop = ({stopData, chooseStop, stopId, getModeIcon}) => {
  const {distance, stop} = stopData.node;
  const directions = stop.patterns.map(p => {
    const route = p.route.longName.split('-');
    return `${p.route.shortName} ${route[route.length-1]}`;
  });
  const directionsString = [...new Set(directions)].join(', ');
  const modes = [...new Set(stop.patterns.map(p => p.route.mode))];
  const activeStyle = stop.gtfsId === stopId
    ? {backgroundColor: '#EEEEEE'}
    : {};
  return (
    <TouchableHighlight onPress={() => chooseStop(stop.gtfsId)}>
      <View style={[styles.stop, activeStyle]}>
        <View style={styles.stopLeftPanel}>
          {modes.map((mode, idx) => (
            <Image
              key={idx}
              style={styles.stopIcon}
              source={getModeIcon(mode)}
            />
          ))}
        </View>
        <View style={styles.stopRightPanel}>
          <View style={styles.stopHeader}>
            <Text style={styles.stopHeaderText}>{stop.name}</Text>
            <Text style={styles.stopDistanceText}>{(distance/1000).toFixed(1)} km</Text>
          </View>
          <View style={styles.stopBody}>
            <Text style={styles.stopBodyText} numberOfLines={1}>{directionsString}</Text>
          </View>
        </View>
      </View>
    </TouchableHighlight>
  )
};

const StopsList = ({stops, chooseStop, stopId, getModeIcon}) => {
  if (!stops) {
    return null;
  }
  return (
    <View style={styles.container}>
      <FlatList
        data={stops}
        renderItem={item => <Stop stopData={item.item} chooseStop={chooseStop} stopId={stopId} getModeIcon={getModeIcon}/>}
        keyExtractor={(item, idx) => idx.toString()}
        extraData={stopId}
        ItemSeparatorComponent={() => <View style={styles.stopSeparator} />}
      />
    </View>
  )
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  stop: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 10,
    flexDirection: 'row',
  },
  stopSeparator: {
    height: 1,
    width: '100%',
    backgroundColor: '#DDDDDD',
  },
  stopLeftPanel: {
    width: 25,
    justifyContent: 'center',
  },
  stopRightPanel: {
    flex: 1,
    justifyContent: 'center',
  },
  stopIcon: {
    width: 15,
    height: 15,
    marginRight: 10,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopHeaderText: {
    fontSize: 20,
    lineHeight: 30,
    color: '#333333',
  },
  stopDistanceText: {
    fontSize: 16,
    color: '#333333',
    marginLeft: 'auto',
  },
  stopBody: {
    marginRight: 80,
  },
  stopBodyText: {
    color: '#555555',
  }
});

export default StopsList;