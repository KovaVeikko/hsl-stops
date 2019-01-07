import React from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {getPosition} from './services/location-service';
import {fetchStops} from './services/stops-service';
import {fetchDepartures} from './services/departures-service';
import DeparturesList from './DeparturesList';
import StopsList from './StopsList';
import {getSnapshot, saveSnapshot} from './services/local-storage-service';


const BUS_ICON = require('../img/bus.png');
const BUS_ICON_DISABLED = require('../img/bus_alpha.png');
const TRAIN_ICON = require('../img/train.png');
const TRAIN_ICON_DISABLED = require('../img/train_alpha.png');
const METRO_ICON = require('../img/metro.png');
const METRO_ICON_DISABLED = require('../img/metro_alpha.png');
const TRAM_ICON = require('../img/tram.png');
const TRAM_ICON_DISABLED = require('../img/tram_alpha.png');

const getModeIcon = (mode, disabled) => {
  switch (mode) {
    case 'RAIL':
      return disabled ? TRAIN_ICON_DISABLED : TRAIN_ICON;
    case 'BUS':
      return disabled ? BUS_ICON_DISABLED : BUS_ICON;
    case 'TRAM':
      return disabled ? TRAM_ICON_DISABLED : TRAM_ICON;
    case 'SUBWAY':
      return disabled ? METRO_ICON_DISABLED : METRO_ICON;
    default:
      return disabled ? BUS_ICON_DISABLED : BUS_ICON;
  }
};


const ErrorMessage = ({title, message}) => {
  return (
    <View style={styles.errorMessage}>
      <Text style={styles.errorMessageTitleText}>{title}</Text>
      <Text style={styles.errorMessageText}>{message}</Text>
    </View>
  )
};

export default class App extends React.Component {

  constructor() {
    super();
    this.state = {
      online: null,
      stops: null,
      stopId: null,
      departures: null,
      position: {
        permission: null,
        loading: true,
        available: null,
        coordinates: null,
      },
      modeFilters: ['RAIL', 'BUS', 'TRAM', 'SUBWAY'],
    }
  };

  async updatePosition() {
    this.setState({position: {...this.state.position, loading: true}});
    const id = setTimeout(() => {
      this.setState({position: {...this.state.position, available: false}});
    }, 5000);
    try {
      const position = await getPosition();
      this.setState({position: {coordinates: position.coords, loading: false, permission: true, available: true}});
    } catch (e) {
      if (e.code === 1) {
        this.setState({position: {...this.state.position, permission: false, loading: false}});
      }
      else {
        this.setState({position: {...this.state.position, available: false, loading: false}});
      }
    } finally {
      clearTimeout(id);
    }
  }

  async updateStopsList() {
    if (!this.state.position.coordinates) {
      return;
    }
    const {latitude, longitude} = this.state.position.coordinates;
    const stops = await fetchStops({lat: latitude, lon: longitude, radius: 1500});
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

  toggleModeFilter = (mode) => {
    const modeFilters = this.state.modeFilters;
    if (modeFilters.includes(mode)) {
      this.setState({modeFilters: modeFilters.filter(m => m !== mode)}, () => saveSnapshot(this.state));
    } else {
      this.setState({modeFilters: [...modeFilters, mode]}, () => saveSnapshot(this.state));
    }
  };

  async componentDidMount() {
    const snapshot = await getSnapshot();
    if (snapshot) {
      const {modeFilters} = snapshot;
      this.setState({modeFilters}, async () => {
        await this.updateAll();
      });
    } else {
      await this.updateAll();
    }
    setInterval(async () => await this.updateAll(), 20 * 1000);
  }

  render() {
    const {permission, available, coordinates, loading} = this.state.position;
    if (permission === false) {
      return <ErrorMessage title="Location permission denied" message="Turn on in order to use this app."/>
    }
    if (available === false || (!coordinates && !loading)) {
      return <ErrorMessage title="Location not available" />
    }
    return (
      <View style={styles.container}>
        <DeparturesList departures={this.state.departures} />
        <StopsList
          stops={this.state.stops}
          chooseStop={this.chooseStop}
          stopId={this.state.stopId}
          getModeIcon={getModeIcon}
          toggleModeFilter={this.toggleModeFilter}
          modeFilters={this.state.modeFilters}
        />
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
  errorMessage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5FCFF',
  },
  errorMessageTitleText: {
    color: '#333333',
    fontSize: 20,
    marginBottom: 3,
  },
  errorMessageText: {
    color: '#333333',
    fontSize: 16,
  },
});
