import {
  ApiUserInformation,
  ApiRegisterRequest,
  ApiLoginRequest,
  ApiProfileUpdateRequest
} from 'libs/philgo-api/philgo-api-interface';

export class UserProfile {
  static readonly type = '[User] Profile';
  constructor(public user: ApiUserInformation) { }
}


export class UserLogin {
  static readonly type = '[User] Login';
  constructor(public login: ApiLoginRequest) { }
}


export class UserRegister {
  static readonly type = '[User] Register';
  constructor(public user: ApiRegisterRequest) { }
}

export class UserProfileUpdate {
  static readonly type = '[User] Profile Update';
  constructor(public user: ApiProfileUpdateRequest) { }
}

export class UserLogout {
  static readonly type = '[User] Logout';
}
