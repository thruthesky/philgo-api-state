import { ApiPostSearch, ApiPost } from '@libs/philgo-api/philgo-api-interface';

export class ForumPostSearch {
  static readonly type = '[Forum] Post Search';

  constructor(public searchOption: ApiPostSearch) { }
}

export class ForumPostCreate {
  static readonly type = '[Forum] Post Create';

  constructor(public post: ApiPost, public idCategory: string) { }
}

export class ForumPostUpdate {
  static readonly type = '[Forum] Post Update';

  constructor(public post: ApiPost, public idCategory: string) { }
}

export class ForumPostView {
  static readonly type = '[Forum] Post View';

  constructor(public idx: string) { }
}

