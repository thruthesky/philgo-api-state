import { ApiUserInformation } from 'libs/philgo-api/philgo-api-interface';

export class UserProfile {
  static readonly type = '[User] Profile';
  idx: string;
  constructor(public user: ApiUserInformation) {
    this.idx = user.idx;
  }
}
