import {FlatList, Image, Text, TouchableHighlight, View, StyleSheet} from "react-native";
import React from "react";
import {lightestGrey, lightGrey, white} from './colors';


const ModeSelection = ({getModeIcon, toggleModeFilter, modeFilters}) => {
  const modes = ['BUS', 'TRAM', 'RAIL', 'SUBWAY'];
  return (
    <View style={styles.modeSelection}>
      {modes.map(mode => {
        return (
          <TouchableHighlight key={mode} onPress={() => toggleModeFilter(mode)}>
            <Image
              style={styles.modeSelectionIcon}
              source={getModeIcon(mode, !modeFilters.includes(mode))}
            />
          </TouchableHighlight>
        )
      })}
    </View>
  )
};

const Stop = ({stopData, chooseStop, stopId, getModeIcon}) => {
  const {distance, stop} = stopData.node;
  const directions = stop.patterns.map(p => p.headsign);
  const directionsString = [...new Set(directions)].join(', ');
  const modes = [...new Set(stop.patterns.map(p => p.route.mode))];
  const activeStyle = stop.gtfsId === stopId
    ? styles.stopActive
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
            <Text style={styles.stopPlatformText}>{stop.platformCode}</Text>
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

const StopsList = ({stops, chooseStop, stopId, getModeIcon, toggleModeFilter, modeFilters}) => {
  if (!stops) {
    return null;
  }
  let ids = [];
  const uniqueStops = stops.filter(stop => {
    const id = stop.node.stop.gtfsId;
    if (!ids.includes(id)) {
      ids = [...ids, id];
      return true;
    }
    return false;
  });
  const filteredStops = uniqueStops.filter(stop => {
    const modes = [...new Set(stop.node.stop.patterns.map(p => p.route.mode))];
    let show = false;
    modes.forEach(mode => {
      if (modeFilters.includes(mode)) {
        show = true;
        return;
      }
    });
    return show;
  });
  return (
    <View style={styles.container}>
      <ModeSelection getModeIcon={getModeIcon} toggleModeFilter={toggleModeFilter} modeFilters={modeFilters}/>
      <FlatList
        data={filteredStops}
        renderItem={item => <Stop stopData={item.item} chooseStop={chooseStop} stopId={stopId} getModeIcon={getModeIcon}/>}
        keyExtractor={(item, idx) => idx.toString()}
        extraData={[stopId, modeFilters]}
        ItemSeparatorComponent={() => <View style={styles.stopSeparator} />}
      />
    </View>
  )
};

const styles = StyleSheet.create({
  container: {
    flex: 3,
    width: '100%',
    backgroundColor: white,
  },
  modeSelection: {
    backgroundColor: lightestGrey,
    width: '100%',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    borderTopWidth: 3,
    borderTopColor: lightGrey,
    borderBottomWidth: 1,
    borderBottomColor: lightGrey,
  },
  modeSelectionIcon: {
    width: 30,
    height: 30,
  },
  stop: {
    width: '100%',
    backgroundColor: white,
    padding: 10,
    flexDirection: 'row',
  },
  stopActive: {
    backgroundColor: lightestGrey,
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
    marginBottom: 3,
  },
  stopHeaderText: {
    fontSize: 20,
    color: '#333333',
  },
  stopPlatformText: {
    fontSize: 16,
    color: '#333333',
    marginLeft: 5,
    marginTop: 3,
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