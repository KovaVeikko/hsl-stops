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


const filterStops = (stops, modeFilter) => {
  if (stops && stops.length > 0) {
    return modeFilter
      ? stops.filter(stop => {
        const modes = [...new Set(stop.node.stop.patterns.map(p => p.route.mode))];
        return modes.includes(modeFilter);
      })
      : stops;
  }
};

const ErrorMessage = ({message}) => {
  return (
    <View style={styles.errorMessage}>
      <Text style={styles.errorMessageText}>{message}</Text>
    </View>
  )
};

export default class App extends React.Component {

  constructor() {
    super();
    this.state = {
      errors: {},
      stops: {
        loading: false,
        data: null,
      },
      stopId: null,
      departures: {
        loading: false,
        data: null,
      },
      position: {
        loading: true,
        updated: false,
        coordinates: null,
      },
      modeFilter: null,
    }
  };

  error(type, message, error) {
    if (!message) {
      this.setState({errors: {...this.state.errors, [type]: null}})
    }
    else {
      console.warn(type, error);
      this.setState({errors: {...this.state.errors, [type]: message}});
    }
  }

  async updatePosition() {
    this.setState({position: {...this.state.position, loading: true}});
    const timeoutId = setTimeout(() => {
      this.setState({position: {...this.state.position, updated: false}});
      throw new Error({message: "Failed to update location"});
    }, 5000);
    const position = await getPosition();
    this.setState({position: {coordinates: position.coords, loading: false, updated: true}});
    clearTimeout(timeoutId);
  }

  async updateStopsList() {
    if (!this.state.position.coordinates) {
      return;
    }
    const {latitude, longitude} = this.state.position.coordinates;
    this.setState({stops: {...this.state.stops, loading: true}});
    const stops = await fetchStops({lat: latitude, lon: longitude, radius: 1500});
    let ids = [];
    const uniqueStops = stops.filter(stop => {
      const id = stop.node.stop.gtfsId;
      if (!ids.includes(id)) {
        ids = [...ids, id];
        return true;
      }
      return false;
    });
    this.setState({stops: {loading: false, data: uniqueStops}});
  }

  async updateDeparturesList() {
    if (!this.state.stopId) {
      return;
    }
    const {stopId} = this.state;
    const departures = await fetchDepartures({stopId});
    this.setState({departures: {...this.state.departures, data: departures}});
  }

  async updateAll() {
    try {
      await this.updatePosition();
      this.error('LOCATION');
    }
    catch (e) {
      this.error('LOCATION', 'Location request failed', e);
      return;
    }

    try {
      await this.updateStopsList();
      this.error('NETWORK');
    }
    catch (e) {
      this.error('NETWORK', 'Network request failed', e);
      return;
    }

    if (this.state.stopId) {
      try {
        await this.updateDeparturesList();
      }
      catch (e) {
        this.error('NETWORK', 'Network request failed', e);
        this.error('NETWORK');
      }
    }
  }

  chooseStop = (stopId) => {
    this.setState({stopId, departures: {...this.state.departures, loading: true}}, async () => {
      try {
        await this.updateDeparturesList();
        this.setState({departures: {...this.state.departures, loading: false}});
      }
      catch (e) {
        this.error('NETWORK', 'Network request failed', e);
      }
    });
  };

  toggleModeFilter = (mode) => {
    const modeFilter = this.state.modeFilter;
    if (modeFilter === mode) {
      this.setState({modeFilter: null}, () => saveSnapshot(this.state));
    } else {
      this.setState({modeFilter: mode}, () => saveSnapshot(this.state));
    }
  };

  async componentDidMount() {
    const snapshot = await getSnapshot();
    if (snapshot) {
      const {modeFilter} = snapshot;
      this.setState({modeFilter}, async () => {
        await this.updateAll();
      });
    } else {
      await this.updateAll();
    }
    setInterval(async () => await this.updateAll(), 20 * 1000);
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          {Object.keys(this.state.errors).map(type => (
            this.state.errors[type] ? <ErrorMessage key={type} message={this.state.errors[type]}/> : null
          ))}
        </View>
        <DeparturesList departures={this.state.departures.data} loading={this.state.departures.loading} />
        <StopsList
          loading={this.state.stops.loading}
          stops={filterStops(this.state.stops.data, this.state.modeFilter)}
          chooseStop={this.chooseStop}
          stopId={this.state.stopId}
          getModeIcon={getModeIcon}
          toggleModeFilter={this.toggleModeFilter}
          modeFilter={this.state.modeFilter}
          coordinates={this.state.position.coordinates}
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
  errorContainer: {
    height: 'auto',
    width: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 2,
  },
  errorMessage: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'yellow',
    marginBottom: 1,
  },
  errorMessageText: {
    color: '#333333',
    fontSize: 16,
  },
});
