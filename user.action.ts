import { ApiUserInformation } from 'libs/philgo-api/philgo-api-interface';

export class UserProfile {
  static readonly type = '[User] Profile';
  constructor(public user: ApiUserInformation) {}
}


export class UserLogin {
  static readonly type = '[User] Login';
  constructor(public login: any) { }
}

