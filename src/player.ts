/** Player name from the query string, eg "https://example.com/?name=amy" */
export const getPlayerName = (search: string = window.location.search): string =>
  new URLSearchParams(search).get('name') ?? ''

export const getColourByPlayer = (playerName: string): string => {
  switch (playerName) {
    case 'amy':
      return 'magenta'
    case 'ian':
      return '#695E93'
    case 'kard':
      return 'green'
    default:
      return 'white'
  }
}
