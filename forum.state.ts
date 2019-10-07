import { AppService } from '@libs/app.service';
import { ApiPost } from '@libs/philgo-api/philgo-api-interface';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { ForumPostSearch, ForumPostCreate, ForumPostView, ForumPostUpdate, ForumPostDelete } from './forum.action';
import { tap } from 'rxjs/operators';

export interface ForumStateModel {
  postList: ApiPost[];
  forumList: {
    [key: string]: string[];
  };
  loading: {
    [key: string]: boolean;
  };
  page_no: {
    [key: string]: number;
  };
  noMorePost: {
    [key: string]: boolean;
  };

  /**
   * this will be patched whenever a postLoad request is dispatched.
   */
  postLoaded: ApiPost;
  /**
   * this will be patched whenever a new post is created.
   */
  newestCreatedPost: ApiPost;
}

@State<ForumStateModel>({
  name: 'forum',
  defaults: {
    postList: [],
    forumList: {},
    loading: {},
    page_no: {},
    noMorePost: {},
    postLoaded: {},
    newestCreatedPost: {}
  } as any
})
export class ForumState {

  /**
   * return the whole forum state.
   * can be access via `@Select()` decorator.
   *
   * @param forum state
   */
  @Selector()
  static forumPosts(forum: ForumStateModel) {
    return forum;
  }

  /**
   * return the current loaded posts
   * can be access via `@Select()` decorator.
   *
   * @example
   * ````
   *  @Select(s => s.forum.postLoaded) post$: Observable<ApiPost>;
   * ````
   *
   * @param forum forum state
   */
  @Selector()
  static postLoaded(forum: ForumStateModel) {
    return forum.postLoaded;
  }

  @Selector()
  static newestCreatedPost(forum: ForumStateModel) {
    return forum.newestCreatedPost;
  }

  constructor(
    private a: AppService
  ) {
  }

  /**
   * Add login credentials to data.
   * @param obj data to add login credentials
   *
   * @note this is only necessary since philgo `addLogin` function is not yet fixed.
   */
  private addLogin(obj?: any) {
    if (obj === void 0 || !obj) {
      obj = {};
    }

    const idx = this.a.user.idx;
    if (idx) {
      obj.idx_member = idx;
    }
    const sid = this.a.user.session_id;
    if (sid) {
      obj['session_id'] = sid;
    }
    return obj;
  }

  /**
   * prepares post data.
   * @param prepare post data.
   */
  pre(post: ApiPost): ApiPost {
    post.bad = post.bad !== '0' ? post.bad : null;
    post.good = post.good !== '0' ? post.good : null;
    post['replyTo'] = post.idx;

    if (!post.subject || post.subject === '') {
      post.subject = 'No Subject';
    }

    if (post.member && post.member.idx === this.a.user.idx) {
      post.mine = true;
    }

    /**
     * nativeScript doesn't have dom
     */
    if ( this.a.isWeb ) {
      post['safeContent'] = this.a.helper.sanitizeContent(post.content);
    }

    return post;
  }

  /**
   * adds or Edit post data
   *  - it will add it to the post list if not existing yet.
   *  - it will overwrite the existing one on the state.
   *
   * @param post
   */
  addToPostList({ getState, patchState }: StateContext<ForumStateModel>, post: ApiPost) {
    post = this.pre(post);
    const posts = { ...getState().postList };
    posts[post.idx] = post;
    patchState({
      postList: posts
    });
  }

  /**
   * adds post to a certain IdCategory.
   *
   * @param ctx state context
   * @param post payload
   * @param idCategory IDCategory to add
   * @param top if top
   */
  addToIDcategory(ctx: StateContext<ForumStateModel>, post: ApiPost, idCategory: string, top = false) {
    const forums = { ...ctx.getState().forumList };

    if (forums[idCategory] === void 0) {
      forums[idCategory] = [post.idx];
    } else {
      forums[idCategory] = [...ctx.getState().forumList[idCategory]];
    }

    if (forums[idCategory].indexOf(post.idx) === -1) {
      top ? forums[idCategory].unshift(post.idx) : forums[idCategory].push(post.idx);
    }

    ctx.patchState({
      forumList: forums
    });
  }

  /**
   * Add post to certain idCategory.
   *
   * @param ctx state context.
   * @param post post payload.
   * @param idCategory idCategory to add the post.
   * @param top wether top (new post) or not.
   */
  addPost(ctx: StateContext<ForumStateModel>, post: ApiPost, idCategory: string, top = false) {
    this.addToPostList(ctx, post);
    this.addToIDcategory(ctx, post, idCategory, top);
  }

  /**
   *
   *
   * @param ctx state context
   * @param searchOption search options
   */
  @Action(ForumPostSearch) postSearch(ctx: StateContext<ForumStateModel>, { searchOption }: ForumPostSearch) {
    const state = ctx.getState();

    const idCategory = this.a.generateIdCategory(searchOption);

    // if state is already loading posts for this category return. prevent request spam.
    // if (state.loading[idCategory]) {
    //   return;
    // }

    // if page number is 0 then replace with 1.
    if (!searchOption.page_no) {
      searchOption.page_no = 1;
    }

    // if the page_no for this category is already on the same page as it's state don't load it again.
    if (state.page_no[idCategory] === searchOption.page_no) {
      return;
    }

    // update the page number of this idcategory on the state for future reference.
    ctx.patchState({
      page_no: { [idCategory]: searchOption.page_no }
    });

    // if no search limit then default limit is set to 10.
    if (!searchOption.limit) {
      searchOption.limit = 10;
    }

    return this.a.philgo.postSearch(searchOption)
      .pipe(
        tap(res => {
          // console.log(res);
          // set noMorePost for this category if the posts length doesn't reach the search limit.
          if (res.posts.length < searchOption.limit) {
            ctx.patchState({
              noMorePost: { [idCategory]: true }
            });
          }

          // for each post we add it to the state postsList.
          res.posts.forEach(
            post => {
              this.addPost(ctx, post, idCategory);
            });
        })
      );
  }

  /**
   * it will fetch a post from state if existing or the backend if not.
   * then will patch the states `PostLoaded` property for easy access.
   *
   * @example
   * ````
   *  export class PostViewComponent {
   *
   *    @Select(s => s.forum.postLoaded) post$: Observable<ApiPost>;
   *
   *    constructor() {
   *      this.post$.subscribe(post => this.post = post);
   *    }
   *
   *  // ...
   * }
   * ````
   *
   * @param ctx state context
   * @param idx post idx to load
   */
  @Action(ForumPostView) postLoad(ctx: StateContext<ForumStateModel>, { idx }: ForumPostView) {
    const state = ctx.getState();

    // if post already exist on the state, patch postLoaded for easy access on post view.
    if (state.postList[idx]) {
      ctx.patchState({
        postLoaded: state.postList[idx]
      });
      return;
    }

    // if not then fetch from backend.
    return this.a.philgo.postLoad(idx).pipe(
      tap(post => {
        this.pre(post);
        this.addToPostList(ctx, post);
        ctx.patchState({
          postLoaded: post
        });
      })
    );
  }

  /**
   * Creates new post and add it to the state.
   *
   * @param ctx state context
   * @param post new post data.
   */
  @Action(ForumPostCreate) postCreate(ctx: StateContext<ForumStateModel>, { post }: ForumPostCreate) {
    const idCategory = this.a.generateIdCategory(post as any);
    post = this.addLogin(post);
    // console.log('create post', post);

    return this.a.philgo.postCreate(post).pipe(
      tap(res => {
        // console.log(res);
        this.addPost(ctx, res, idCategory, true);     // add to idCategory.
        this.addToIDcategory(ctx, res, res.idx_member, true);     // add to myPosts.
        ctx.patchState({
          newestCreatedPost: res
        });
      })
    );
  }

  /**
   * Update a post from backend and overwrite the one existing on the state.
   *
   * @param ctx state contexnt
   * @param post new post data.
   */
  @Action(ForumPostUpdate) postUpdate(ctx: StateContext<ForumStateModel>, { post }: ForumPostCreate) {
    post = this.addLogin(post);
    // console.log('update post', post);

    return this.a.philgo.postUpdate(post).pipe(
      tap(res => {
        this.pre(res);
        this.addToPostList(ctx, res);
      })
    );
  }

  /**
   * requests a delete from backend then replace the target post on the state with a deleted instance.
   *
   * @param ctx state context
   * @param idx post idx to delete
   */
  @Action(ForumPostDelete) postDelete(ctx: StateContext<ForumStateModel>, { idx }: ForumPostDelete) {
    const req = this.addLogin({ idx: idx });
    // console.log('delete post', req);

    return this.a.philgo.postDelete(req).pipe(
      tap(res => {
        const deletedPost: ApiPost = {
          idx: res.idx as any,
          subject: 'Deleted',
          content: 'Deleted',
          deleted: '1',
          good: null,
          bad: null,
          created: false,
          show: false,
          mine: false
        };
        this.addToPostList(ctx, deletedPost);
      })
    );
  }
}
