const url = 'https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql';

const body = (stopId) => `
{
  stop(id: "${stopId}") {
    name
    stoptimesWithoutPatterns(numberOfDepartures: 12) {
      scheduledArrival
      realtimeArrival
      arrivalDelay
      scheduledDeparture
      realtimeDeparture
      departureDelay
      realtime
      realtimeState
      serviceDay
      headsign
      trip {
        route {
          shortName
          longName
          mode
        }
      }
    }
  }
}
`;

const options = (stopId) => ({
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/graphql'
  },
  body: body(stopId),
});

export const fetchDepartures = ({stopId}) => new Promise((resolve, reject) => {
  return fetch(url, options(stopId))
    .then(response => {
      if (response.status !== 200) {
        reject(response.statusText)
      } else {
        response.json()
          .then(json => {
            const data = json.data;
            resolve(data);
          })
          .catch(error => {
            reject(error)
          })
      }
    })
    .catch(error => {
      reject(error)
    })
});