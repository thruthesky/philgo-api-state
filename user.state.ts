import { State, Action, StateContext, NgxsOnInit } from '@ngxs/store';
import { ApiUserInformation } from 'libs/philgo-api/philgo-api-interface';
import { UserProfile, UserLogin, UserLogout, UserRegister, UserProfileUpdate } from './user.action';
import { StorageService } from '@libs/v5-storage/storage.service';
import { PhilGoApiService } from '@libs/philgo-api/philgo-api.service';



@State<ApiUserInformation>({
  name: 'user',
  defaults: {} as any
})
export class UserState implements NgxsOnInit {


  constructor(
    private storageService: StorageService,
    private philgo: PhilGoApiService
  ) {
    // console.log('this: ', this);
  }

  ngxsOnInit(ctx: StateContext<ApiUserInformation>) {
    const user = this.storageService.get('user');
    this.profile(ctx, user);
  }

  /**
   * Saves user profile information into the state
   * @param ctx ctx
   * @param { user } `UserProfile` class which holds the `user` payload.
   */
  @Action(UserProfile) profile(ctx: StateContext<ApiUserInformation>, { user }: UserProfile) {
    // if no user, maybe the app is booting
    if (!user) {
      user = this.storageService.get('user');
    }
    ctx.patchState(user);
  }

  /**
   * Register to philgo backend then set user info to State and localStorage if success.
   *
   * @param ctx State Context
   * @param { user } `UserRegister` Class containing the `user` payload.
   */
  @Action(UserRegister)
  register(ctx: StateContext<ApiUserInformation>, { user }: UserRegister) {

    this.philgo.register(user).subscribe(       // register to philgo
      res => {
        this.storageService.set('user', res);   // set to local storage
        // ctx.patchState(res);                    // also patch state
        this.profile(ctx, { user: res } as any);
      },
      e => {
        alert(e.message);
        console.log('Error on register!', e);
      }
    );

  }

  /**
   * Login to philgo backend then set user info to State and localStorage if success.
   *
   * @param ctx State Context
   * @param { user } `UserLogin` Class containing the `user` payload.
   */
  @Action(UserLogin) login(ctx: StateContext<ApiUserInformation>, { user }: UserLogin) {

    this.philgo.login(user).subscribe(          // login to philgo
      res => {
        this.storageService.set('user', res);   // set to localStorage if success
        // ctx.patchState(res);                    // also patch state
        this.profile(ctx, { user: res } as any);
      },
      e => {
        alert(e.message);
        console.log('Error on login!', e);
      });

  }

  /**
   * Update user profile information to backend then save to state and localstorage if success.
   *
   * @param ctx StateContext
   * @param { user } `UserProfileUpdate` Class containing the `user` payload.
   */
  @Action(UserProfileUpdate) profileUpdate(ctx: StateContext<ApiUserInformation>, { user }: UserProfileUpdate) {
    const localUser = this.storageService.get('user');
    user['idx_member'] = localUser.idx;
    user.session_id = localUser.session_id;
    this.philgo.profileUpdate(user).subscribe(
      res => {
        this.storageService.set('user', res);
        this.profile(ctx, { user: res } as any);
      },
      e => {
        alert(e.message);
        console.log('Error on User Update!', e);
      }
    );
  }

  /**
   * Resets the state and Set null value for user on localStorage.
   *
   * @param ctx state context
   */
  @Action(UserLogout) logout(ctx: StateContext<ApiUserInformation>) {
    this.storageService.set('user', {});
    ctx.setState({} as any);
  }



}





