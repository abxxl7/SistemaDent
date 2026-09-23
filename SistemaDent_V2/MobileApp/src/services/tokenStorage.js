import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS = 'access_token';
const REFRESH = 'refresh_token';

export const getAccessToken = () => AsyncStorage.getItem(ACCESS);
export const getRefreshToken = () => AsyncStorage.getItem(REFRESH);

export const saveTokens = ({ access_token, refresh_token }) =>
  AsyncStorage.multiSet([
    [ACCESS, access_token],
    [REFRESH, refresh_token],
  ]);

export const clearTokens = () => AsyncStorage.multiRemove([ACCESS, REFRESH]);
