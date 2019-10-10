import { AppService } from '@libs/app.service';
import { ApiPost } from '@libs/philgo-api/philgo-api-interface';
import { State, Action, StateContext, Selector, NgxsOnInit } from '@ngxs/store';
import {
  ForumPostSearch,
  ForumPostCreate,
  ForumPostView,
  ForumPostUpdate,
  ForumPostDelete,
  ForumPostVote,
  ForumBookmarkSearch
} from './forum.action';
import { tap } from 'rxjs/operators';

export interface ForumStateModel {
  postList: {
    [key: string]: ApiPost
  };
  forumList: {
    [key: string]: string[];
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
    postList: {},
    forumList: {},
    page_no: {},
    noMorePost: {},
    postLoaded: {},
    newestCreatedPost: {}
  } as any
})
export class ForumState implements NgxsOnInit {

  constructor(
    private a: AppService
  ) {
  }

  ngxsOnInit() {
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
    if (this.a.isWeb) {
      post['safeContent'] = this.a.helper.sanitizeContent(post.content);
    }

    return post;
  }

  /**
   * adds or Edit post data on post list.
   *  - it will add it to the post list if not existing yet.
   *  - it will overwrite the existing one on the state.
   *
   * @param post
   */
  updatePostList({ getState, patchState }: StateContext<ForumStateModel>, post: ApiPost) {
    const posts = { ...getState().postList };
    posts[post.idx] = post;
    patchState({
      postList: posts
    });
  }

  /**
   * Update post no for a given idCategory.
   * @param state
   * @param idCategory 
   */
  updatePageNo({ getState, patchState }: StateContext<ForumStateModel>, idCategory: string, page_no: number) {
    const pageNums = { ...getState().page_no };
    pageNums[idCategory] = page_no;
    patchState({
      page_no: pageNums
    });
  }

  /**
   * Update no more posts stattus for a given idCategory
   *
   * @param state context
   * @param idCategory idCategory
   */
  updateNoMorePostList({ getState, patchState }: StateContext<ForumStateModel>, idCategory: string) {
    const noMorePosts = { ...getState().noMorePost };
    noMorePosts[idCategory] = true;
    patchState({
      noMorePost: noMorePosts
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
   * Add post to list and to certain idCategory.
   *
   * @param ctx state context.
   * @param post post payload.
   * @param idCategory idCategory to add the post.
   * @param top wether top (new post) or not.
   */
  addPost(ctx: StateContext<ForumStateModel>, post: ApiPost, idCategory: string, top = false) {
    this.updatePostList(ctx, post);
    this.addToIDcategory(ctx, post, idCategory, top);
  }

  /**
   *
   *
   * @param ctx state context
   * @param searchOption search options
   */
  @Action(ForumPostSearch) postSearch(ctx: StateContext<ForumStateModel>, { searchOption }: ForumPostSearch) {
    const idCategory = this.a.generateIdCategory(searchOption);

    // if page number is 0 then replace with 1.
    if (!searchOption.page_no) {
      searchOption.page_no = 1;
    }
    this.updatePageNo(ctx, idCategory, searchOption.page_no);

    // if no search limit then default limit is set to 10.
    if (!searchOption.limit) {
      searchOption.limit = 10;
    }

    // update the page number of this idcategory on the state for future reference.

    return this.a.philgo.postSearch(searchOption)
      .pipe(
        tap(res => {
          // console.log(res);
          // set noMorePost for this category if the posts length doesn't reach the search limit.
          if (res.posts.length < searchOption.limit) {
            this.updateNoMorePostList(ctx, idCategory);
          }

          // for each post we add it to the state postsList.
          res.posts.forEach(
            post => {
              this.pre(post);
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
    }

    // if not then fetch from backend.
    return this.a.philgo.postLoad(idx).pipe(
      tap(post => {
        this.pre(post);
        this.updatePostList(ctx, post);
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
        this.pre(post);
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
        this.updatePostList(ctx, res);
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
          idx: `${res.idx}`,
          subject: 'Deleted',
          content: 'Deleted',
          deleted: '1',
          good: null,
          bad: null,
          created: false,
          show: false,
          mine: false
        };
        this.updatePostList(ctx, deletedPost);
      })
    );
  }

  /**
   * request to backend then apply changes to post on `state.postList`
   */
  @Action(ForumPostVote) postVote(ctx: StateContext<ForumStateModel>, { vote }: ForumPostVote) {
    vote = this.addLogin(vote);

    return this.a.philgo.postLike(vote).pipe(
      tap(res => {

        const post = { ...ctx.getState().postList[vote.idx] };
        if (res.mode === 'good') {
          post.good = res.result;
        } else {
          post.bad = res.result;
        }
        this.updatePostList(ctx, post);
      })
    );
  }

  @Action(ForumBookmarkSearch) loadBookmarks(ctx: StateContext<ForumStateModel>, { searchOpts }: ForumBookmarkSearch) {

    return this.a.philgo.postQuery(searchOpts).pipe(
      tap(res => {
        if (res.length < searchOpts.limit) {
          this.updateNoMorePostList(ctx, 'bookmarks');
        }

        if (res.length) {
          res.forEach(post => {
            this.updatePostList(ctx, post);
          });
        }

        this.updatePageNo(ctx, 'bookmarks', searchOpts.page_no);
      })
    );
  }
}
