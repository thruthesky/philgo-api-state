import { State, Action, StateContext, Store } from '@ngxs/store';
import { ApiUserInformation } from 'libs/philgo-api/philgo-api-interface';
import { UserProfile } from './user.action';
import { StorageService } from '@libs/v5-storage/storage.service';
import { AppService } from '@src/app/app.service';



@State<ApiUserInformation>({
  name: 'user',
  defaults: {} as any
})
export class UserState {


  constructor(
    private a: AppService,
    private storageService: StorageService
  ) {
  }

  /**
   * Initialize user state
   * @param ctx context
   */
  ngxsOnInit(ctx: StateContext<ApiUserInformation>) {
    ctx.patchState(this.a.user());
  }

  /**
   * Saves user profile information into the state
   * @param ctx ctx
   * @param user user
   */
  @Action(UserProfile) profile(ctx: StateContext<ApiUserInformation>, userObj: UserProfile) {
    this.storageService.set('user', userObj);
    ctx.patchState(userObj as any);
  }



}





