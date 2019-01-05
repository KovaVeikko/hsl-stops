export const getPosition = () => new Promise((resolve, reject) => {
  return navigator.geolocation.getCurrentPosition(
    position => {
      resolve(position);
    },
    error => {
      reject(error);
    },
    null
  )
});
