const elementsIds = {
  startButton: 'start-button',
  toMainButton: 'return-to-main-button',
  mainScreen: 'main-screen',
  playScreen: 'play-screen',
  gameOverScreen: 'gameover-screen',
  reqsStats: 'stats-reqs',
  strikesStats: 'stats-strikes',
  pointsStats: 'stats-points',
  fileList: 'files',
  usersList: 'users',
  log: 'log',
  resultsPoints: 'results-points',
  resultsRequests: 'results-requests',
  resultsTime: 'results-time',
}

document.addEventListener('DOMContentLoaded', function(event) {
  const game = new Game({
    ids: elementsIds
  });

  game.init();
});
