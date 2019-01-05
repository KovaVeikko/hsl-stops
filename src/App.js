import React from 'react';
import {StyleSheet, Text, View, FlatList, TouchableHighlight} from 'react-native';
import {getPosition} from './services/locationService';
import {fetchStops} from './services/stops-service';
import {fetchDepartures} from './services/departures-service';
import moment from 'moment';


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
  const {name, stoptimesWithoutPatterns} = departures.stop;
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
  const activeStyle = stop.gtfsId === stopId
    ? {backgroundColor: '#EEEEEE'}
    : {};
  return (
    <TouchableHighlight onPress={() => chooseStop(stop.gtfsId)}>
      <View style={[styles.stop, activeStyle]}>
        <View style={styles.stopHeader}>
          <Text style={styles.stopHeaderText}>{stop.name}</Text>
          <Text>{(distance/1000).toFixed(1)} km</Text>
        </View>
        <View style={styles.stopBody}>
          <Text style={styles.stopBodyText} numberOfLines={1}>{directionsString}</Text>
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
    this.setState({stops});
  }

  async updateDeparturesList() {
    if (!this.state.stopId) {
      return;
    }
    const {stopId} = this.state;
    const departures = await fetchDepartures({stopId});
    this.setState({departures});
  }

  chooseStop = (stopId) => {
    this.setState({stopId}, async () => {
      await this.updateDeparturesList();
    });
  };

  async componentWillMount() {
    await this.updatePosition();
    await this.updateStopsList();
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
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 15,
    paddingBottom: 15,
  },
  departureSeparator: {
    height: 1,
    width: '100%',
    backgroundColor: '#CCCCCC',
  },
  departureName: {
    width: 70,
  },
  departureNameText: {
    fontSize: 20,
  },
  departureDestination: {
    flex: 1,
    marginRight: 20,
  },
  departureDestinationText: {
    fontSize: 16
  },
  departureTime: {
    marginLeft: 'auto',
    width: 50,
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
  },
  stopSeparator: {
    height: 1,
    width: '100%',
    backgroundColor: '#DDDDDD',
  },
  stopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stopHeaderText: {
    fontSize: 20,
    lineHeight: 30,
    color: '#333333',
  },
  stopBody: {
    marginRight: 80,
  },
  stopBodyText: {
    color: '#555555',
  }
});
