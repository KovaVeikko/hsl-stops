import React from 'react';
import {StyleSheet, Text, View, FlatList} from 'react-native';
import moment from 'moment';


const Departure = ({departure}) => {
  const shortName = departure.trip.route.shortName;
  const route = departure.trip.route.longName.split('-');
  const headsign = departure.headsign;
  const destination = headsign || route[route.length - 1];
  const now = moment();
  const departureTime = moment.unix(departure.serviceDay + departure.realtimeDeparture);
  const minutes = departureTime.diff(now, 'minutes');
  const day = departureTime.day() !== now.day() ? departureTime.format('dddd') : null;
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
        <Text style={styles.departureTimeText}>
          {minutes > 20 ? departureTime.format('H:mm') : minutes}
        </Text>
        {day &&
          <Text style={styles.departureDayText}>{day}</Text>
        }
      </View>
    </View>
  )
};

const DeparturesList = ({departures}) => {
  if (!departures) {
    return <View style={styles.container}/>;
  }
  const {stoptimesWithoutPatterns} = departures.stop;
  return (
    <View style={styles.container}>
      <FlatList
        renderItem={item => <Departure departure={item.item}/>}
        data={stoptimesWithoutPatterns}
        keyExtractor={(item, idx) => idx.toString()}
        ItemSeparatorComponent={() => <View style={styles.departureSeparator} />}
        extraData={departures}
      />
    </View>
  )
};


const styles = StyleSheet.create({
  container: {
    flex: 2,
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
    width: 55,
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
    width: 55,
    justifyContent: 'center',
  },
  departureTimeText: {
    fontSize: 20,
  },
  departureDayText: {
    color: '#AAAAAA',
  },
});

export default DeparturesList;