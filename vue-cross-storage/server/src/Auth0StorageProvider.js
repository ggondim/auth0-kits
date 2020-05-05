import { Defaults } from '@auth0-kits/client';
const { CrossStorageCommands, StorageKeys } = Defaults;

class Auth0Server {
  constructor($window, { defaultStorageKeys = StorageKeys } = {}) {
    this.window = $window;
    this.defaultStorageKeys = defaultStorageKeys;
  }

  static get PROVIDER() {
    return 'Auth0';
  }

  get avaiableCommands() {
    return Object.keys(CrossStorageCommands).map(key => CrossStorageCommands[key]);
  }

  processCommand(command) {
    if (Object.keys(this.defaultStorageKeys).includes(command)) {
      return this.window.localStorage[this.defaultStorageKeys[command]];
    }
  }
}

export default Auth0Server;
