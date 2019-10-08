import {
  ApiUserInformation,
  ApiRegisterRequest,
  ApiLoginRequest,
  ApiProfileUpdateRequest
} from 'libs/philgo-api/philgo-api-interface';

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

export class UserRegister {
  static readonly type = '[User] Register';
  constructor(public user: ApiRegisterRequest) { }
}

export class UserLogin {
  static readonly type = '[User] Login';
  constructor(public login: ApiLoginRequest) { }
}

export class UserProfileUpdate {
  static readonly type = '[User] Profile Update';
  constructor(public user: ApiProfileUpdateRequest) { }
}

export class UserLogout {
  static readonly type = '[User] Logout';
}

export class UserBookmark {
  static readonly type = '[User] Bookmark';

  constructor(public bookmarkList: string) {}
}
