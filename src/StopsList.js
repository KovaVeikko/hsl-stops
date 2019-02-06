import {FlatList, Image, Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import React from 'react';
import {lightestGrey, lightGrey, white} from './colors';
import Stop from './Stop';
import {STAR_ICON, STAR_ICON_DISABLED} from "./App";


const ModeSelection = ({modes, getModeIcon, toggleModeFilter, chooseStop, modeFilter}) => {
  return (
    <View style={styles.modeSelection}>
      {modes.map(mode => {
        return (
          <TouchableOpacity key={mode} onPress={() => toggleModeFilter(mode)}>
            <Image
              style={styles.modeSelectionIcon}
              source={getModeIcon(mode, modeFilter !== mode)}
            />
          </TouchableOpacity>
        )
      })}
      <TouchableOpacity onPress={() => toggleModeFilter('FAVORITES')}>
        <Image
          style={styles.modeSelectionIcon}
          source={modeFilter === "FAVORITES" ? STAR_ICON : STAR_ICON_DISABLED}
        />
      </TouchableOpacity>
    </View>
  )
};

class StopsList extends React.Component {
  constructor(props) {
    super(props);
  }

  scrollUp = () => {
    if (this.listElem && this.listElem.scrollToOffset) {
      this.listElem.scrollToOffset({x: 0, y: 0, animated: false});
    }
  };

  componentWillReceiveProps(nextProps) {
    if (this.props.modeFilter !== nextProps.modeFilter) {
      this.scrollUp();
    }
  }

  render() {
    const {
      modes,
      loading,
      stops,
      chooseStop,
      stopId,
      getModeIcon,
      toggleModeFilter,
      modeFilter,
      updateStops,
      show,
      showMore,
      toggleFavorite,
      favoriteStopIds
    } = this.props;
    if (!stops) {
      return null;
    }
    const data = modeFilter ? stops[modeFilter] : stops['ALL'];
    return (
      <View style={styles.container}>
        <ModeSelection modes={modes} getModeIcon={getModeIcon} toggleModeFilter={toggleModeFilter} modeFilter={modeFilter}/>
        {data && data.length > 0
          ? <FlatList
            ref={node => this.listElem = node}
            //onRefresh={() => updateStops()}
            //refreshing={loading}
            data={data.slice(0, show)}
            renderItem={item => <Stop stopData={item.item} chooseStop={chooseStop} stopId={stopId} getModeIcon={getModeIcon} toggleFavorite={toggleFavorite} favoriteStopIds={favoriteStopIds}/>}
            keyExtractor={item => item.node.stop.gtfsId}
            extraData={favoriteStopIds.length}
            ItemSeparatorComponent={() => <View style={styles.stopSeparator} />}
            onEndReached={showMore}
            onEndReachedThreshold={0.1}
          />
          : <View style={styles.container}>
            <Text style={styles.emptyListText}>No stops to show</Text>
          </View>
        }
      </View>
    )
  }
}

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
    color: '#333333',
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
  stopSeparator: {
    height: 1,
    width: '100%',
    backgroundColor: '#DDDDDD',
  },
});

export default StopsList;