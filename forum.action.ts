import { ApiPostSearch } from '@libs/philgo-api/philgo-api-interface';

export class PostSearch {
  static readonly type = '[Forum] Search';
  constructor(public searchOptions: ApiPostSearch) { }
}

