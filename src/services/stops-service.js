const url = 'https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql';

const body = (lat, lon, radius) => `
{
    stopsByRadius(lat:${lat},lon:${lon},radius:${radius}) {
      edges {
        node {
          stop { 
            gtfsId 
            name
            patterns {
              code
              directionId
              headsign
              route {
                shortName
                longName
                mode
              }
            }
          }
          distance
        }
      }
    }
  }
`;

const options = (lat, lon, radius) => ({
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/graphql'
  },
  body: body(lat, lon, radius),
});

export const fetchStops = ({lat, lon, radius}) => new Promise((resolve, reject) => {
  return fetch(url, options(lat, lon, radius))
    .then(response => {
      if (response.status !== 200) {
        reject(response.statusText)
      } else {
        response.json()
          .then(json => {
            const data = json.data.stopsByRadius.edges;
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