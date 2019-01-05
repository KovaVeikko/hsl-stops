import React from 'react';
import {StyleSheet, Text, View, FlatList, TouchableHighlight, Image} from 'react-native';
import {getPosition} from './services/locationService';
import {fetchStops} from './services/stops-service';
import {fetchDepartures} from './services/departures-service';
import moment from 'moment';


const BUS_ICON = require('../img/bus.png');
const TRAIN_ICON = require('../img/train.png');
const METRO_ICON = require('../img/metro.png');
const TRAM_ICON = require('../img/tram.png');


const getModeIcon = (mode) => {
  switch (mode) {
    case 'RAIL':
      return TRAIN_ICON;
    case 'BUS':
      return BUS_ICON;
    case 'TRAM':
      return TRAM_ICON;
    case 'SUBWAY':
      return METRO_ICON;
    default:
      return BUS_ICON;
  }
};

const Departure = ({departure}) => {
  const shortName = departure.trip.route.shortName;
  const route = departure.trip.route.longName.split('-');
  const headsign = departure.headsign;
  const destination = headsign || route[route.length - 1];
  const now = moment();
  const departureTime = moment.unix(departure.serviceDay + departure.realtimeDeparture);
  return (
    <View style={styles.departure}>
      <View style={styles.departureName}>
        <Text style={styles.departureNameText}>{shortName}</Text>
      </View>
      <View style={styles.departureDestination}>
        <Text style={styles.departureDestinationText} numberOfLines={1} ellipsizeMode='tail'>
          {destination.length > 125 ? destination.substring(0, 22) + '...' : destination}
        </Text>
      </View>
      <View style={styles.departureTime}>
        <Text style={styles.departureTimeText}>{departureTime.diff(now, 'minutes')}</Text>
      </View>
    </View>
  )
};

const DeparturesList = ({departures}) => {
  if (!departures) {
    return <View style={styles.departuresList}/>;
  }
  const {stoptimesWithoutPatterns} = departures.stop;
  return (
    <View style={styles.departuresList}>
      <FlatList
        renderItem={item => <Departure departure={item.item}/>}
        data={stoptimesWithoutPatterns}
        keyExtractor={(item, idx) => idx.toString()}
        ItemSeparatorComponent={() => <View style={styles.departureSeparator} />}
      />
    </View>
  )
};


const Stop = ({stopData, chooseStop, stopId}) => {
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

const StopsList = ({stops, chooseStop, stopId}) => {
  if (!stops) {
    return null;
  }
  return (
    <View style={styles.stopsList}>
      <FlatList
        data={stops}
        renderItem={item => <Stop stopData={item.item} chooseStop={chooseStop} stopId={stopId}/>}
        keyExtractor={(item, idx) => idx.toString()}
        extraData={stopId}
        ItemSeparatorComponent={() => <View style={styles.stopSeparator} />}
      />
    </View>
  )
};


export default class App extends React.Component {

  constructor() {
    super();
    this.state = {
      stops: null,
      stopId: null,
      departures: null,
      coordinates: null,
    }
  };

  async updatePosition() {
    const position = await getPosition();
    this.setState({coordinates: position.coords});
  }

  async updateStopsList() {
    if (!this.state.coordinates) {
      return;
    }
    const {latitude, longitude} = this.state.coordinates;
    const stops = await fetchStops({lat: latitude, lon: longitude, radius: 500});
    let stopId = this.state.stopId;
    if (!stopId && stops.length > 0) {
      stopId = stops[0].node.stop.gtfsId;
    }
    this.setState({stops, stopId});
  }

  async updateDeparturesList() {
    if (!this.state.stopId) {
      return;
    }
    const {stopId} = this.state;
    const departures = await fetchDepartures({stopId});
    this.setState({departures});
  }

  async updateAll() {
    await this.updatePosition();
    await this.updateStopsList();
    if (this.state.stopId) {
      await this.updateDeparturesList();
    }
  }

  chooseStop = (stopId) => {
    this.setState({stopId}, async () => {
      await this.updateDeparturesList();
    });
  };

  async componentWillMount() {
    await this.updateAll();
    setInterval(async () => await this.updateAll(), 20 * 1000);
  }

  render() {
    return (
      <View style={styles.container}>
        <DeparturesList departures={this.state.departures} />
        <StopsList stops={this.state.stops} chooseStop={this.chooseStop} stopId={this.state.stopId} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 30,
    backgroundColor: '#F5FCFF',
  },
  departuresList: {
    flex: 1,
    width: '100%',
    borderBottomWidth: 4,
    borderBottomColor: '#EEEEEE',
  },
  departure: {
    flexDirection: 'row',
    margin: 1,
    width: '100%',
    justifyContent: 'space-between',
    padding: 15,
  },
  departureSeparator: {
    height: 1,
    width: '100%',
    backgroundColor: '#EEEEEE',
  },
  departureName: {
    width: 70,
    flexDirection: 'row',
    alignItems: 'center',
  },
  departureIcon: {
    width: 15,
    height: 15,
    marginRight: 10,
  },
  departureNameText: {
    fontSize: 20,
  },
  departureDestination: {
    flex: 1,
    marginRight: 20,
    justifyContent: 'center',
  },
  departureDestinationText: {
    fontSize: 16
  },
  departureTime: {
    marginLeft: 'auto',
    width: 50,
    justifyContent: 'center',
  },
  departureTimeText: {
    fontSize: 20,
  },
  stopsList: {
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
