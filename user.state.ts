import { State, Action, StateContext } from '@ngxs/store';
import { ApiUserInformation } from 'libs/philgo-api/philgo-api-interface';
import { UserProfile, UserLogin, UserProfileUpdate, UserRegister, UserLogout } from './user.action';
import { StorageService } from '@libs/v5-storage/storage.service';
import { AppService } from '@libs/app.service';
import { tap } from 'rxjs/operators';

@State<ApiUserInformation>({
  name: 'user',         // 'user' state.
  defaults: {} as any   // Set user object. Not atction.
})
export class UserState {

  constructor(
    private a: AppService,
    private storageService: StorageService
  ) {
  }

  /**
   * Initialize the state with user information.
   * 여기서 StateContext 를 가지고 원하는 작업을 할 수 있다.
   * `defaults` 메타 데이터에 초기값을 변경하는 등의 작업을 할 수 있다.
   * @param ctx context
   *
   * @note 참고로 여기서 localStorage 에 저장된 회원 정보를 `defaults` 로 초기화 한다.
   *      즉, 이전 회원로그인 정보를 가져와서 로그인 정보를 세팅하는 것이다.
   */
  ngxsOnInit(ctx: StateContext<ApiUserInformation>) {
    ctx.setState(this.loadUserProfileAction());
  }

  /**
   * Saves user profile information into the state
   * @note This method will be called whenever profile updates.
   * @param ctx ctx
   * @param user user
   */
  @Action(UserProfile) profile(ctx: StateContext<ApiUserInformation>, action: UserProfile) {
    const user: ApiUserInformation = action.user;
    this.saveUserProfileAction(user);
    ctx.setState(user);
    // console.log('[UserProfile] profile updated on profile action: ', user.idx, user.email, user.nickname );
  }

  /**
   * User login
   * @note 사용자 로그인 Action 이 dispatch 되면 필고 백엔드로 로그인을 하고 성공/실패 여부를 알린다.
   *    When `User Login Action` is dispatched, it does `Philgo Api Login on Backend` and return the observable.
   */
  @Action(UserLogin)
  login(ctx: StateContext<ApiUserInformation>, action: UserLogin) {
    return this.a.philgo.login({ uid: action.login.uid, password: action.login.password })
      .pipe(
        tap(user => {
          // 아래와 같이 ctx 로 다시 Action 을 dispatch 할 수 있다.
          // 아래의 Action 을 통해서 회원 정보를 localStorage 에 저장한다.
          // console.log(`[UserLogin] action dispatched & Philgo login api has done with: `, user.idx, user.email, user.nickname);
          ctx.dispatch(new UserProfile(user));
        })
      ).subscribe();
  }

  /**
   * Register to philgo backend then set user info to State and localStorage if success.
   *
   * @param ctx State Context
   * @param { user } `UserRegister` Class containing the `user` payload.
   */
  @Action(UserRegister)
  register(ctx: StateContext<ApiUserInformation>, { user }: UserRegister) {

    return this.a.philgo.register(user)
      .pipe(
        tap(res => {
          this.profile(ctx, { user: res });
        })
      );
  }

  /**
   * Update user profile information to backend then save to state and localstorage if success.
   *
   * @param ctx StateContext
   * @param { user } `UserProfileUpdate` Class containing the `user` payload.
   */
  @Action(UserProfileUpdate) profileUpdate(ctx: StateContext<ApiUserInformation>, { user }: UserProfileUpdate) {
    const localUser = this.storageService.get('user');

    user['idx_member'] = localUser.idx;         // do this since `philgo.addLogin()` is not fixed yet.
    user.session_id = localUser.session_id;     // do this since `philgo.addLogin()` is not fixed yet.

    return this.a.philgo.profileUpdate(user)
      .pipe(
        tap(res => {
          this.profile(ctx, { user: res });
        })
      );
  }

  /**
   * Resets the state and Set null value for user on localStorage.
   *
   * @param ctx state context
   */
  @Action(UserLogout) logout(ctx: StateContext<ApiUserInformation>) {
    this.profile(ctx, { user: {} } as any);
  }

  loadUserProfileAction() {
    return this.storageService.get('user');
  }
  saveUserProfileAction(user: ApiUserInformation) {
    this.storageService.set('user', user);
  }

}





