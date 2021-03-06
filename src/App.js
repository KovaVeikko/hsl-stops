import React from 'react';
import {StyleSheet, View, Text, StatusBar, Platform, AppState} from 'react-native';
import Permissions from 'react-native-permissions';
import {getPosition} from './services/location-service';
import {fetchStops} from './services/stops-service';
import {fetchDepartures} from './services/departures-service';
import DeparturesList from './DeparturesList';
import StopsList from './StopsList';
import {getSnapshot, saveSnapshot} from './services/local-storage-service';
import Header from './Header';
import Loading from './Loading';
import LocationDeniedMessage from './LocationDeniedMessage';


const BUS_ICON = require('../img/bus.png');
const BUS_ICON_DISABLED = require('../img/bus_alpha.png');
const TRAIN_ICON = require('../img/train.png');
const TRAIN_ICON_DISABLED = require('../img/train_alpha.png');
const METRO_ICON = require('../img/metro.png');
const METRO_ICON_DISABLED = require('../img/metro_alpha.png');
const TRAM_ICON = require('../img/tram.png');
const TRAM_ICON_DISABLED = require('../img/tram_alpha.png');
export const STAR_ICON = require('../img/star.png');
export const STAR_ICON_DISABLED = require('../img/star_alpha.png');


const MODES = ['BUS', 'TRAM', 'RAIL', 'SUBWAY'];

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


const filterStops = (stops, mode) => {
  if (stops && stops.length > 0) {
    return mode
      ? stops.filter(stop => {
        const modes = [...new Set(stop.node.stop.patterns.map(p => p.route.mode))];
        return modes.includes(mode);
      })
      : stops;
  }
};

const getStopById = (stopId, stops) => {
  if (stops) {
    return stops.find(s => s.node.stop.gtfsId === stopId);
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
      failureMessage: null,
      appState: AppState.currentState,
      locationPermissionDenied: null,
      loaded: false,
      intervalId: null,
      options: {
        radius: 10000,
      },
      stops: {
        loading: false,
        data: null,
        show: 20,
      },
      stopId: null,
      departures: {
        loading: false,
        data: null,
      },
      position: {
        loading: true,
        failed: null,
        coordinates: {
          latitude: 60.171873,
          longitude: 24.941422,
        },
      },
      networkFailed: null,
      modeFilter: null,
      favoriteStopIds: [],
    }
  };

  handleAppStateChange = (nextAppState) => {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      this.startUpdateInterval();
    }
    if (this.state.appState  === 'active' && nextAppState.match(/inactive|background/)) {
      this.stopUpdateInterval();
    }
    this.setState({appState: nextAppState});
  };

  async updatePosition() {
    this.setState({position: {...this.state.position, loading: true}});
    try {
      const position = await getPosition({highAccuracy: true});
      this.setState({position: {coordinates: position.coords, loading: false, failed: false}}, async () => {
        await saveSnapshot(this.state);
      });
    }
    catch (e) {
      if (e.code === 3) { // if timed out, try again without high accuracy
        try {
          const position = await getPosition({highAccuracy: false});
          this.setState({position: {coordinates: position.coords, loading: false, failed: false}}, async () => {
            await saveSnapshot(this.state);
          });
        }
        catch {
          this.setState({position: {...this.state.position, loading: false, failed: true}});
        }
      } else {
        this.setState({position: {...this.state.position, loading: false, failed: true}});
      }
    }
  }

  async updateStopsList() {
    if (!this.state.position.coordinates) {
      return;
    }
    const {latitude, longitude} = this.state.position.coordinates;
    this.setState({stops: {...this.state.stops, loading: true}});
    try {
      const stops = await fetchStops({lat: latitude, lon: longitude, radius: this.state.options.radius});
      let ids = [];
      const uniqueStops = stops.filter(stop => {
        const id = stop.node.stop.gtfsId;
        if (!ids.includes(id)) {
          ids = [...ids, id];
          return true;
        }
        return false;
      });
      const stopData = {
        'ALL': uniqueStops,
        'FAVORITES': uniqueStops.filter(s => this.state.favoriteStopIds.includes(s.node.stop.gtfsId)),
      };
      MODES.map(mode => {
        stopData[mode] = filterStops(uniqueStops, mode);
      });
      this.setState({networkFailed: false, stops: {...this.state.stops, loading: false, data: stopData}});
    }
    catch (e) {
      this.setState({networkFailed: true});
    }
  }

  async updateDeparturesList() {
    if (!this.state.stopId) {
      return;
    }
    const {stopId} = this.state;
    try {
      const departures = await fetchDepartures({stopId});
      this.setState({networkFailed: false, departures: {...this.state.departures, data: departures}});
    }
    catch (e) {
      this.setState({networkFailed: true});
    }
  }

  chooseStop = (stopId) => {
    if (stopId !== this.state.stopId) {
      this.setState({departures: {...this.state.departures, data: null}})
    }
    this.setState({stopId}, async () => {
      const spinner = setTimeout(() => {
        this.setState({departures: {...this.state.departures, loading: true}});
      }, 1000);
      await this.updateDeparturesList();
      clearTimeout(spinner);
      this.setState({departures: {...this.state.departures, loading: false}});
    });
  };

  chooseFirstStop = () => {
    if (!this.state.stops.data) {
      return null;
    }
    const stops = this.state.modeFilter
      ? this.state.stops.data[this.state.modeFilter]
      : this.state.stops.data['ALL'];
    const stopId = (stops && stops.length > 0) ? stops[0].node.stop.gtfsId : null;
    if (stopId) {
      this.chooseStop(stopId);
    } else {
      this.setState({stopId: null});
    }
  };

  toggleModeFilter = (mode) => {
    const modeFilter = this.state.modeFilter;
    if (modeFilter === mode) {
      this.setState({modeFilter: null}, async () => {
        await saveSnapshot(this.state);
        this.chooseFirstStop();
      });
    } else {
      this.setState({modeFilter: mode, stops: {...this.state.stops, show: 20}}, async () => {
        await saveSnapshot(this.state);
        this.chooseFirstStop();
      });
    }
  };

  showMoreStops = () => {
    const stops = this.state.stops;
    const stopsList = this.state.modeFilter
      ? stops.data[this.state.modeFilter]
      : stops.data['ALL'];
    if (stopsList && stops.show < stopsList.length) {
      this.setState({stops: {...stops, show: stops.show + 20}});
    }
  };

  async hasLocationPermission() {
    // Response is one of: 'authorized', 'denied', 'restricted', or 'undetermined'
    const permission = await Permissions.check('location');
    return ['authorized'].includes(permission);
  }

  async requestLocationPermission() {
    const permission = await Permissions.request('location');
    return ['authorized'].includes(permission);
  }

  async getLocationPermission() {
    const locationPermission = await this.hasLocationPermission();
    if (!locationPermission) {
      return await this.requestLocationPermission();
    }
    return true;
  }

  toggleFavorite = (stopId) => {
    const {favoriteStopIds, stops} = this.state;
    const nextStopData = stops.data;
    let nextFavoriteIds;
    if (favoriteStopIds.includes(stopId)) {
      nextFavoriteIds = favoriteStopIds.filter(f => f !== stopId);
      this.setState({favoriteStopIds: nextFavoriteIds}, async () => {
        await saveSnapshot(this.state);
      });
    } else {
      nextFavoriteIds = [...favoriteStopIds, stopId];
      this.setState({favoriteStopIds: nextFavoriteIds}, async () => {
        await saveSnapshot(this.state);
      });
    }
    nextStopData['FAVORITES'] = nextStopData['ALL'].filter(s => nextFavoriteIds.includes(s.node.stop.gtfsId));
    this.setState({stops: {...stops, data: nextStopData}});
  };

  async startup() {
    // load saved state from the local storage
    try {
      const snapshot = await getSnapshot();
      const modeFilter = snapshot ? snapshot.modeFilter : null;
      const coordinates = snapshot ? snapshot.position.coordinates : this.state.position.coordinates;
      const favoriteStopIds = snapshot && snapshot.favoriteStopIds ? snapshot.favoriteStopIds : this.state.favoriteStopIds;
      const selectedView = snapshot && snapshot.selectedView ? snapshot.selectedView : this.state.selectedView;

      // fetch position and stops list
      await this.setState({modeFilter, favoriteStopIds, selectedView, position: {...this.state.position, coordinates}}, async () => {
        await this.updatePosition();
        await this.updateStopsList();
        this.chooseFirstStop();
        this.setState({loaded: true});
      });
    } catch (e) {
      this.setState({failureMessage: e.message})
    }
  }

  async startUpdateInterval() {
    // set interval for updating data
    await this.updateDeparturesList();
    const intervalId = setInterval(async () => {
      if (this.state.position.failed) {
        await this.updatePosition();
      }
      if (!this.state.stops.data) {
        await this.updateStopsList();
      }
      await this.updateDeparturesList();
    }, 15 * 1000);
    this.setState({intervalId})
  }

  async stopUpdateInterval() {
    clearInterval(this.state.intervalId);
  }

  async componentDidMount() {
    // check permissions
    const locationPermission = await this.getLocationPermission();
    if (!locationPermission) {
      this.setState({locationPermissionDenied: true, loaded: true});
      return;
    }

    // startup
    await this.startup();

    // listen to app state change
    AppState.addEventListener('change', this.handleAppStateChange);

    // start update interval
    await this.startUpdateInterval();
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
  }

  render() {
    const {
      failureMessage,
      loaded,
      locationPermissionDenied,
      stops,
      stopId,
      departures,
      modeFilter,
      position,
      networkFailed,
      favoriteStopIds,
    } = this.state;

    if (failureMessage) {
      return <ErrorMessage message={failureMessage}/>
    }

    if (!loaded) {
      return <Loading/>
    }

    if (locationPermissionDenied) {
      return <LocationDeniedMessage/>;
    }

    const stopsData = stops.data;
    const chosenStop = getStopById(stopId, stopsData ? stopsData['ALL'] : null);
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor='#455A64'/>

        {position.failed &&
          <ErrorMessage message="Failed to update location"/>
        }

        {networkFailed &&
          <ErrorMessage message="Failed to update data"/>
        }

        <Header stop={chosenStop}/>
        <DeparturesList
          stopId={stopId}
          departures={departures.data}
          loading={departures.loading}
        />
        <StopsList
          modes={MODES}
          loading={stops.loading}
          stops={stops.data}
          chooseStop={this.chooseStop}
          stopId={stopId}
          getModeIcon={getModeIcon}
          toggleModeFilter={this.toggleModeFilter}
          modeFilter={modeFilter}
          updateStops={async () => {
            await this.updatePosition();
            await this.updateStopsList();
          }}
          show={stops.show}
          showMore={this.showMoreStops}
          toggleFavorite={this.toggleFavorite}
          favoriteStopIds={favoriteStopIds}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 30 : 0,
    backgroundColor: '#F5FCFF',
  },
  errorContainer: {
    height: 'auto',
    width: '100%',
    zIndex: 2,
  },
  errorMessage: {
    flexDirection: 'row',
    padding: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDDDDD',
    marginBottom: 1,
  },
  errorMessageText: {
    color: '#333333',
    fontSize: 16,
    marginRight: 10,
  },
});
