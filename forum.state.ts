import { AppService } from '@libs/app.service';
import { ApiPost } from '@libs/philgo-api/philgo-api-interface';
import { State, Action, StateContext } from '@ngxs/store';
import {
  ForumPostSearch,
  ForumPostCreate,
  ForumPostView,
  ForumBookmarkSearch,
  ForumPostOrCommentVote,
  ForumPostOrCommentUpdate,
  ForumPostOrCommentDelete,
  ForumCommentCreate
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
    newestCreatedPost: {}
  } as any
})
export class ForumState {

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
    if (this.a.isWeb) {
      post['safeContent'] = post.content;
    }

    post.show = false;
    post.inCommentEdit = post.idx;

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
    if (post.idx) {
      posts[post.idx] = post;
      patchState({
        postList: posts
      });
    }
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
   * `Forum posts` load.
   *
   * @param ctx state context
   * @param searchOption search options
   */
  @Action(ForumPostSearch) postSearch(ctx: StateContext<ForumStateModel>, { searchOption }: ForumPostSearch) {
    const idCategory = this.a.generateIdCategory(searchOption);
    const pageNums = ctx.getState().page_no;

    // if page number is 0 or undefined then replace with idCategory's current page number on the state, if not yet set then 1.
    if (!searchOption.page_no) {
      searchOption.page_no = pageNums[idCategory] ? pageNums[idCategory] : 1;
    }
    // console.log('loading page no.', searchOption.page_no);

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
              post = this.pre(post);
              this.addPost(ctx, post, idCategory);
            });

          /**
           * update page number after successful return of data.
           */
          this.updatePageNo(ctx, idCategory, searchOption.page_no);
        })
      );
  }

  /**
   * `Single post` load.
   *
   * @param ctx state context
   * @param idx post idx to load
   */
  @Action(ForumPostView) postLoad(ctx: StateContext<ForumStateModel>, { idx }: ForumPostView) {
    return this.a.philgo.postLoad(idx).pipe(
      tap(post => {
        post = this.pre(post);
        this.updatePostList(ctx, post);
      })
    );
  }

  /**
   * `Bookmark` loading.
   *
   * @param ctx state context
   * @param searchOpts search options
   */
  @Action(ForumBookmarkSearch) loadBookmarks(ctx: StateContext<ForumStateModel>, { searchOpts }: ForumBookmarkSearch) {
    const idCategory = 'bookmarks';
    const pageNums = ctx.getState().page_no;

    // if page number is 0 or undefined then replace with idCategory's current page number on the state, if not yet set then 1.
    if (!searchOpts.page_no) {
      searchOpts.page_no = pageNums[idCategory] ? pageNums[idCategory] : 1;
    }
    // console.log('loading page no.', searchOpts.page_no);

    return this.a.philgo.postQuery(searchOpts).pipe(
      tap(res => {

        if (res.length < searchOpts.limit) {
          this.updateNoMorePostList(ctx, idCategory);
        }

        if (res.length) {
          res.forEach(post => {
            post = this.pre(post);
            // this.updatePostList(ctx, post);
            this.addPost(ctx, post, idCategory);
          });

          this.updatePageNo(ctx, idCategory, searchOpts.page_no);
        }
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
        post = this.pre(res);
        this.addPost(ctx, res, idCategory, true);     // add to idCategory.
        this.addToIDcategory(ctx, res, res.idx_member, true);     // add to myPosts.
        ctx.patchState({
          newestCreatedPost: res
        });
      })
    );
  }


  @Action(ForumCommentCreate) createComment(ctx: StateContext<ForumStateModel>, { comment }: ForumCommentCreate) {
    comment = this.addLogin(comment);
    const index = comment['index'];

    return this.a.philgo.commentCreate(comment).pipe(
      tap(res => {

        const post = { ...ctx.getState().postList[res.idx_root] };
        if (!post.comments) {
          post.comments = [];
        }

        if (res.depth === '1') {
          post.comments.push(res);
        } else {
          post.comments.splice(index + 1, 0, res);
        }

        post.inCommentEdit = post.idx;
        this.updatePostList(ctx, post);
      })
    );
  }

  /**
   * Update a post from backend and overwrite the one existing on the state.
   *
   * @param ctx state contexnt
   * @param post new post data.
   */
  @Action(ForumPostOrCommentUpdate) postOrCommentUpdate(ctx: StateContext<ForumStateModel>, { postOrComment }: ForumPostOrCommentUpdate) {
    const req = this.addLogin(postOrComment);
    const post = { ...ctx.getState().postList[postOrComment.idx_parent === '0' ? postOrComment.idx : postOrComment.idx_root] };


    // console.log(post);
    return this.a.philgo.postUpdate(req).pipe(
      tap(res => {

        /**
         * post
         */
        if (postOrComment.idx_parent === '0') {
          this.pre(res);
          this.updatePostList(ctx, res);

          /**
           * comment
           *
           * `index` will always be present if we are dealing with comment.
           */
        } else {
          const index = postOrComment['index'];
          Object.assign(post.comments[index], res);
          post.inCommentEdit = post.idx;
          this.updatePostList(ctx, post);
        }

      })
    );
  }


  /**
   * Deletes and replaces a post or comment from the state with a deleted Instance.
   *
   * @param ctx state context
   * @param postOrComment the post or comment being deleted.
   */
  @Action(ForumPostOrCommentDelete) postOrCommentDelete(ctx: StateContext<ForumStateModel>, { postOrComment }: ForumPostOrCommentDelete) {
    const req = this.addLogin({ idx: postOrComment.idx });

    return this.a.philgo.postDelete(req).pipe(
      tap(res => {

        const deletedData: any = {
          idx: `${postOrComment.idx}`,
          subject: 'Deleted',
          deleted: '1'
        };

        /**
         * for post.
         */
        if (postOrComment.idx_parent === '0') {
          this.updatePostList(ctx, deletedData);

          /**
           * for comment.
           *
           * use `idx_root` since `idx_parent` can be a post idx or comment idx.
           * `index` will always be present if we are dealing with comment.
           */
        } else {
          const post = { ...ctx.getState().postList[postOrComment.idx_root] };
          const index = postOrComment['index'];

          deletedData.depth = postOrComment.depth;
          post.comments[index] = deletedData;
          this.updatePostList(ctx, post);
        }
      })
    );
  }

  /**
   * @param ctx state context
   * @param vote is the vote containing the target's idx and vote mode.
   * @param postOrComment the target being voted to, which can be a post or comment.
   */
  @Action(ForumPostOrCommentVote) postOrCommentVote(ctx: StateContext<ForumStateModel>, { vote, postOrComment }: ForumPostOrCommentVote) {
    vote = this.addLogin(vote);
    const postIdx = postOrComment.idx_parent === '0' ? postOrComment.idx : postOrComment.idx_root;
    const post = { ...ctx.getState().postList[postIdx] };

    const voteRes = {
      good: postOrComment.good,
      bad: postOrComment.bad
    };

    return this.a.philgo.postLike(vote).pipe(
      tap(res => {

        if (res.mode === 'good') {
          voteRes.good = res.result;
        } else {
          voteRes.bad = res.result;
        }

        // post
        if (postOrComment.idx_parent === '0') {
          Object.assign(post, voteRes);

          /**
           * comment
           *
           * `index` will always be present if we are dealing with comment.
           */
        } else {
          const index = postOrComment['index'];
          Object.assign(post.comments[index], voteRes);
        }

        this.updatePostList(ctx, post);
      })
    );
  }
}
