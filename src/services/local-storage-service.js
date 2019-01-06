import {AsyncStorage} from 'react-native';

const STORAGE_KEY = 'hslStopsAppState';

export const saveSnapshot = async (state) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.log('Error saving snapshot to local storage:', err);
  }
};

export const getSnapshot = async () => {
  try {
    const state = await AsyncStorage.getItem(STORAGE_KEY);
    return state ? JSON.parse(state) : null;
  } catch (err) {
    console.log('Error getting snapshot from local storage:', err);
    return null;
  }
};