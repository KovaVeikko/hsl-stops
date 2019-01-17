export const getPosition = () => new Promise((resolve, reject) => {
  return navigator.geolocation.getCurrentPosition(
    position => {
      resolve(position);
    },
    error => {
      reject(error);
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 10000 }
  )
});
