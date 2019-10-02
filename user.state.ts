import { State, Action, StateContext, Store } from '@ngxs/store';
import { ApiUserInformation } from 'libs/philgo-api/philgo-api-interface';
import { UserProfile } from './user.action';
import { StorageService } from '@libs/v5-storage/storage.service';



@State<ApiUserInformation>({
  name: 'user',
  defaults: {} as any
})
export class UserState {


  constructor(
    private storageService: StorageService
  ) {
    console.log('this: ', this);
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





