import { ApiUserInformation } from 'libs/philgo-api/philgo-api-interface';

export class UserProfile {
  static readonly type = '[User] Profile';
  idx: string;
  constructor(public user: ApiUserInformation) {
    if (user === null) {
      return;
    }
    this.idx = user.idx;
  }
}


export class UserLogin {
  static readonly type = '[User] Login';
  constructor(public login: any) { }
}

