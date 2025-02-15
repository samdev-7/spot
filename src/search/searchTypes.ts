export type Icons = "search" | "url"

export type BasicAction = {
  type: string
}

export type URLAction = BasicAction & {
  type: 'url'
  url: string
}

export type BasicResult = {
  type: string,
  text: string,
  icon: Icons,
  priority: number,
  actions: BasicAction[]
}

export type SearchResult = BasicResult & {
  type: 'search',
  actions: URLAction[]
}

export type URLResult = BasicResult & {
  type: 'url',
  actions: URLAction[]
}

export type SuggestionResult = BasicResult & {
  type: 'suggestion'
  actions: URLAction[]
}

export type Result = SearchResult | URLResult | SuggestionResult
