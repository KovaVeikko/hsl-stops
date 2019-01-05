import React from 'react';
import {StyleSheet, Text, View, FlatList, TouchableHighlight} from 'react-native';
import {getPosition} from './services/locationService';
import {fetchStops} from './services/stops-service';
import {fetchDepartures} from './services/departures-service';
import moment from 'moment';


const DepartureRow = ({departure}) => {
  const shortName = departure.trip.route.shortName;
  const now = moment();
  const departureTime = moment.unix(departure.serviceDay + departure.realtimeDeparture);
  return (
    <View style={{flexDirection: 'row', margin: 1, width: '100%', justifyContent: 'space-between'}}>
      <Text>{shortName}</Text>
      <Text>{departureTime.diff(now, 'minutes')}</Text>
    </View>
  )
};

const DeparturesTable = ({departures}) => {
  if (!departures) {
    return <View style={styles.departuresTable}/>;
  }
  const {name, stoptimesWithoutPatterns} = departures.stop;
  return (
    <View style={styles.departuresTable}>
      <Text>{name}</Text>
      {stoptimesWithoutPatterns.map((d, idx) => (
        <DepartureRow key={idx} departure={d}/>
      ))}
    </View>
  )
};


const Stop = ({stopData, chooseStop, stopId}) => {
  const {distance, stop} = stopData.node;
  const directions = stop.patterns.map(p => p.headsign);
  const directionsString = [...new Set(directions)].join(', ');
  const activeStyle = stop.gtfsId === stopId
    ? {backgroundColor: '#00DD00'}
    : {};
  return (
    <TouchableHighlight onPress={() => chooseStop(stop.gtfsId)}>
      <View style={[styles.stop, activeStyle]}>
        <View style={styles.stopHeader}>
          <Text style={styles.stopHeaderText}>{stop.name}</Text>
          <Text>{(distance/1000).toFixed(2)} km</Text>
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
        <DeparturesTable departures={this.state.departures} />
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
    padding: 10,
  },
  departuresTable: {
    flex: 1,
    width: '100%',
  },
  stopsList: {
    flex: 1,
    width: '100%',
  },
  stop: {
    width: '100%',
    backgroundColor: '#EEEEEE',
    padding: 10,
  },
  stopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stopHeaderText: {
    fontSize: 20,
  },
  stopBody: {
    marginRight: 80,
  },
  stopBodyText: {
    color: '#999999',
  }
});
