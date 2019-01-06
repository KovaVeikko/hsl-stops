import React from 'react';
import {StyleSheet, View} from 'react-native';
import {getPosition} from './services/locationService';
import {fetchStops} from './services/stops-service';
import {fetchDepartures} from './services/departures-service';
import DeparturesList from './DeparturesList';
import StopsList from './StopsList';


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

export default class App extends React.Component {

  constructor() {
    super();
    this.state = {
      stops: null,
      stopId: null,
      departures: null,
      coordinates: null,
      modeFilters: ['RAIL', 'BUS', 'TRAM', 'SUBWAY'],
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
      this.setState({modeFilters: modeFilters.filter(m => m !== mode)});
    } else {
      this.setState({modeFilters: [...modeFilters, mode]});
    }
  };

  async componentWillMount() {
    await this.updateAll();
    setInterval(async () => await this.updateAll(), 20 * 1000);
  }

  render() {
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
});
