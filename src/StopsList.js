import {FlatList, Image, Text, TouchableHighlight, View, StyleSheet} from "react-native";
import React from "react";
import {lightestGrey, lightGrey, white} from './colors';


const ModeSelection = ({modes, getModeIcon, toggleModeFilter, chooseStop, modeFilter}) => {
  return (
    <View style={styles.modeSelection}>
      {modes.map(mode => {
        return (
          <TouchableHighlight key={mode} onPress={() => toggleModeFilter(mode)}>
            <Image
              style={styles.modeSelectionIcon}
              source={getModeIcon(mode, modeFilter !== mode)}
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

const StopsList = ({modes, radius, loading, stops, chooseStop, stopId, getModeIcon, toggleModeFilter, modeFilter, coordinates, updateStops, show, showMore}) => {
  if (!stops) {
    return null;
  }
  const data = modeFilter ? stops[modeFilter] : stops['ALL'];
  return (
    <View style={styles.container}>
      <ModeSelection modes={modes} getModeIcon={getModeIcon} toggleModeFilter={toggleModeFilter} modeFilter={modeFilter}/>
      {data
        ? <FlatList
            onRefresh={() => updateStops()}
            refreshing={loading}
            data={data.slice(0, show)}
            renderItem={item => <Stop stopData={item.item} chooseStop={chooseStop} stopId={stopId} getModeIcon={getModeIcon}/>}
            keyExtractor={item => item.node.stop.gtfsId}
            extraData={[stopId, modeFilter, coordinates]}
            ItemSeparatorComponent={() => <View style={styles.stopSeparator} />}
            onEndReached={showMore}
            onEndReachedThreshold={0.1}
          />
        : <View style={styles.container}>
            <Text style={styles.emptyListText}>No stops within {(radius / 1000).toFixed(1)} km range</Text>
          </View>
      }
    </View>
  )
};

const styles = StyleSheet.create({
  container: {
    flex: 3,
    width: '100%',
    backgroundColor: white,
  },
  emptyListText: {
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  modeSelection: {
    backgroundColor: white,
    width: '100%',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    borderTopWidth: 2,
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