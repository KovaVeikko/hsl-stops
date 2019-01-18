export const getPosition = ({highAccuracy = true}) => new Promise((resolve, reject) => {
  return navigator.geolocation.getCurrentPosition(
    position => {
      resolve(position);
    },
    error => {
      reject(error);
    },
    { enableHighAccuracy: highAccuracy, timeout: 10000, maximumAge: 10000 }
  )
});
