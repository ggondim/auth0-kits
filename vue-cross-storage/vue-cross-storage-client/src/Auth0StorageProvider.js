import { Defaults } from '@auth0-kits/client';
const { CrossStorageCommands } = Defaults;

class Auth0Client {
  constructor(sendCommandFunction) {
    this.sendCommand = sendCommandFunction;
  }

  static get PROVIDER() {
    return 'Auth0';
  }

  get accessToken() {
    return this.sendCommand(CrossStorageCommands.ACCESS_TOKEN);
  }

  get accessTokenPayload() {
    return this.sendCommand(CrossStorageCommands.ACCESS_TOKEN_PAYLOAD);
  }

  get usuario() {
    return this.sendCommand(CrossStorageCommands.USER);
  }

  get refreshToken() {
    return this.sendCommand(CrossStorageCommands.REFRESH_TOKEN);
  }

  get stateKey() {
    return this.sendCommand(CrossStorageCommands.STATE_KEY);
  }

  get ultimoProviderLogon() {
    return this.sendCommand(CrossStorageCommands.LAST_CONNECTION);
  }

}

export default Auth0Client;
