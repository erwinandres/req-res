function Req(path) {
  this.id = ID();
  this.path = path || Req.paths[0];
  this.at = timeStamp();
  this.status = 'waiting';

  this.dead = false;
  this.collected = false;
  this.resAt;
  this.el;
}

Req.waitTime = 7000;
Req.timeToDelete = 2500;
Req.paths = [
  '',
  'about',
  'contact',
  'gallery',
  'legal',
  'orders',
  'portfolio',
  'products',
  'services',
  'about.html',
  'contact.html',
  'gallery.html',
  'index.html',
  'legal.html',
  'orders.html',
  'portfolio.html',
  'products.html',
  'services.html',
  'profile.html',
  'bonus.php'
]

Req.prototype = {
  getEffect: function() {
    return this.path === 'bonus.php' ? 'random' : false;
  },

  setStatus: function(status) {
    this.status = status;

    if (status === 'success' || status === 'error') {
      this.el.container.dataset.result = this.status;
      this.dead = true;
    }
  },

  getPoints: function() {
    if (this.status === 'waiting') return false;

    return Math.ceil((Req.waitTime - (this.resAt - this.at))/1000);
  },

  collect: function(timestamp) {
    this.collected = timestamp;
  },

  fullPath: function() {
    return  this.path === '' ?
      'index.html' :
      (this.path.split('.')[1] ? this.path : this.path + '.html');
  },

  pathMatch: function(file) {
    return file === (
      Game.files.indexOf(this.fullPath()) === -1 ?
        '404.html' : this.fullPath()
    );
  },

  onDrop: function(event) {
    event.preventDefault();

    if (this.status !== 'waiting') return;

    const data = event.dataTransfer.getData('text/plain');

    this.resAt = timeStamp();

    this.setStatus(this.pathMatch(data) ? 'success' : 'error');
    event.target.classList.remove('user__dragEnter');
  },

  onDragOver: function(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  },

  onDragEnter: function(event) {
    this.classList.add('user__dragEnter');
  },

  onDragLeaveOrEnd: function(event) {
    this.classList.remove('user__dragEnter');
  },

  getElementTemplate: function() {
    const li = document.createElement('li');
    li.className = 'user';
    li.dataset.userId = this.id;

    li.innerHTML = `
      <div class="user-status">
        <progress class="user-waitBar" value="100" max="100"></progress>
        <i class="user-resultIcon js-icon"></i>
      </div>
      <div class="user-info">
        <div class="user-req js-req">GET <em>/<span class="js-req-path">${this.path}</span></em></div>
      </div>
    `;

    li.addEventListener('drop', this.onDrop.bind(this));
    li.addEventListener('dragover', this.onDragOver);
    li.addEventListener('dragenter', this.onDragEnter);
    li.addEventListener('dragleave', this.onDragLeaveOrEnd);
    li.addEventListener('dragend', this.onDragLeaveOrEnd);

    return li;
  },

  generateElement: function(container) {
    this.el = {}
    this.el.container = this.getElementTemplate();
    this.el.progressBar = this.el.container.querySelector('progress');
    this.el.inDOMTree = true;

    container.insertBefore(this.el.container, container.firstChild);
  },

  remove: function() {
    if (this.el.inDOMTree) {
      this.el.container.parentElement.removeChild(this.el.container);
      this.el.inDOMTree = false;
    }
  },

  update: function(timestamp) {
    if (this.status === 'waiting') {
      const timeSinceReq = timestamp - this.at;

      this.el.progressBar.value = ((Req.waitTime - timeSinceReq) * 100) / Req.waitTime;

      if (timeSinceReq > Req.waitTime) {
        this.resAt = timestamp;
        this.setStatus('error');
      }
    }
  }
}

function Game(options) {
  this.el = {
    usersList: document.getElementById(options.ids.usersList),
    fileList: document.getElementById(options.ids.fileList),
    stats: {
      reqs: document.getElementById(options.ids.reqsStats),
      strikes: document.getElementById(options.ids.strikesStats),
      points: document.getElementById(options.ids.pointsStats),
    },
    buttons: {
      start: document.getElementById(options.ids.startButton),
      toMain: document.getElementById(options.ids.toMainButton)
    },
    screens: {
      main: document.getElementById(options.ids.mainScreen),
      play: document.getElementById(options.ids.playScreen),
      over: document.getElementById(options.ids.gameOverScreen),
    },
    log: document.getElementById(options.ids.log),
    results: {
      points: document.getElementById(options.ids.resultsPoints),
      requests: document.getElementById(options.ids.resultsRequests),
      time: document.getElementById(options.ids.resultsTime)
    }
  }

  this.activeScreen = 'main';

  this.requests = [];

  this.stats = {
    points: 0,
    reqs: 0,
    strikes: 0
  }

  this.startedAt;
  this.lastSpawn;
  this.lastTime;
  this.animationId;
}

Game.baseSpawnRate = 3500;
Game.maxStrikes = 3;

Game.activeScreenClassName = 'window__active';
Game.files = [
  '404.html',
  'about.html',
  'contact.html',
  'gallery.html',
  'index.html',
  'legal.html',
  'portfolio.html',
  'products.html',
  'services.html',
  'bonus.php'
];

Game.logTemplates = {
  message:(data) => data.text,
  newRequest:(data) => `Someone is requesting <em>/${data}</em>`,
  success:(data) => `Correct response: <span class="log-item-good">+${data.points} points</span>.`,
  error:(data) => `Incorrect response: <span class="log-item-bad">+1 strike</span>.`,
  timeout:(data) => `Request timeout: <span class="log-item-bad">+1 strike</span>.`,
  bonus: (data) => {
    let m = `BONUS: '${data.name}'.`;

    if (data.points) {
      m += ` <span class="log-item-good">${data.points.sign}${data.points.value} points</span>.`;
    }

    if (data.strikes) {
      m += ` <span class="log-item-bad">${data.strikes.sign}${data.strikes.value} strikes</span>.`;
    }

    return m;
  }
}

Game.bonus = ['extraPoints', 'deleteStrike', 'clear']

Game.prototype = {
  applyBonus: function() {
    const bonusName = randomFromArray(Game.bonus);

    switch (bonusName) {
      case 'extraPoints':
        const points = 10;

        this.updateStats(
          'points',
          this.stats.points += points
        );

        this.log('bonus', {
          name: 'Extra points',
          points: {
            sign: '+',
            value: points
          }
        });

        break;
      case 'deleteStrike':
        const strikesToDelete = this.stats.strikes > 0 ? 1 : 0;

        this.updateStats(
          'strikes',
          this.stats.strikes -= strikesToDelete
        );

        this.log('bonus', {
          name: 'Delete strike',
          strikes: {
            sign: '-',
            value: strikesToDelete
          }
        });

        break;
      case 'clear':
        this.log('bonus', {name: 'Clear all!.'});
        this.requests.forEach(req => {
          req.resAt = this.lastTime;
          req.status = 'success';
          req.dead = true;
          req.setStatus('success');
        });

        break;
    }
  },

  getRandomPath: function() {
    let path = randomFromArray(Req.paths);

    if (path !== '' && Math.random() < .3) {
      let nCharsToDelete = getRandomInt(0, 2);

      while (nCharsToDelete > 0 && path.length) {
        path = path.removeCharAt(getRandomInt(0, path.length - 1));
        nCharsToDelete --;
      }

      let nCharsToAdd = getRandomInt(0, 2);

      while (nCharsToAdd > 0) {
        path = path.insertCharAt(getRandomInt(0, path.length - 1), randomFromArray(chars))
        nCharsToAdd --;
      }
    }

    return path;
  },

  spawn: function() {
    const req = new Req(
      this.getRandomPath()
    );

    req.generateElement(this.el.usersList);
    this.requests.push(req);
    this.updateStats('reqs', this.stats.reqs + 1);

    this.lastSpawn = this.lastTime;
    this.log('newRequest', req.path);
  },

  isTimeToSpawn: function() {
    return this.lastTime - this.lastSpawn >= Game.baseSpawnRate - (300 * Math.floor(this.stats.reqs / 10));
  },

  getFileElementTemplate: function(fileName) {
    const li = document.createElement('li');
    li.draggable = true;
    li.innerHTML = fileName;
    li.className = 'file';

    li.addEventListener('dragstart', this.onDragStartFile)

    return li;
  },

  renderFileTree: function() {
    Game.files.forEach(file => {
      this.el.fileList.append(this.getFileElementTemplate(file));
    });
  },

  updateStats: function(stat, value) {
    this.stats[stat] = value;
    this.el.stats[stat].innerHTML = value;
  },

  getLogTemplate: function(template, data) {
    const p = document.createElement('p');

    p.className = 'log-item';
    p.innerHTML = Game.logTemplates[template](data);

    return p;
  },

  log: function(type, text) {
    this.el.log.append(this.getLogTemplate(type, text));

    while (this.el.log.childElementCount > 10) {
      this.el.log.removeChild(this.el.log.firstChild);
    }

    this.el.log.scrollTop = this.el.log.scrollHeight;
  },

  switchScreens: function(screen) {
    if (this.activeScreen === screen) return;

    this.el.screens[this.activeScreen].classList.remove(
      Game.activeScreenClassName
    );

    this.el.screens[screen].classList.add(
      Game.activeScreenClassName
    );

    this.activeScreen = screen;
  },

  onDragStartFile: function(event) {
    event.dataTransfer.setData('text/plain', event.target.innerHTML);
    event.dataTransfer.dropEffect = 'copy';
  },

  listen: function() {
    this.el.buttons.start.addEventListener('click', function() {
      this.start();
    }.bind(this));

    this.el.buttons.toMain.addEventListener('click', function() {
      this.switchScreens('main');
    }.bind(this));
  },

  start: function() {
    const now = timeStamp();

    this.startedAt = now;
    this.log('message', {text: 'Server is up and listening for requests.'});

    this.lastSpawn = now;
    this.spawn();

    this.switchScreens('play');
  },

  gameOver: function() {
    this.el.results.points.innerHTML = this.stats.points;
    this.el.results.requests.innerHTML = this.stats.reqs;
    this.el.results.time.innerHTML = humanTime(this.lastTime - this.startedAt);

    this.switchScreens('over');
    this.reset();
  },

  reset: function() {
    this.startedAt = false;
    this.lastSpawn = false;
    this.requests.length = 0;
    this.stats = {
      points: 0,
      reqs: 0,
      strikes: 0
    };
    this.el.usersList.innerHTML = '';
    this.el.log.innerHTML = '';
  },

  update: function(dt) {
    if (this.isTimeToSpawn()) {
      this.spawn();
    }

    for (let i = this.requests.length - 1; i >= 0; i--) {
      const req = this.requests[i];

      req.update(this.lastTime);
      if (req.dead && !req.collected) {
        if (req.status === 'error') {
          this.updateStats('strikes', this.stats.strikes + 1);

          let logType = req.resAt - req.at >= Req.waitTime ? 'timeout' : 'error';
          this.log(logType, { strikes: this.stats.strikes });

          if (this.stats.strikes >= Game.maxStrikes) {
            this.gameOver();
            return;
          }
        } else if (req.status === 'success') {
          const points = req.getPoints();

          this.updateStats(
            'points',
            this.stats.points + points
          );

          this.log('success', { points });

          if (req.getEffect()) this.applyBonus();
        }

        req.collect(this.lastTime);
      } else if (req.dead && this.lastTime - req.collected >= Req.timeToDelete) {
        req.remove();
        this.requests.splice(i, 1);
      }
    }
  },

  loop: function() {
    const now = timeStamp();
    let dt = now - this.lastTime;

    if (dt > 999) {
      dt = 1 / 60;
    } else {
      dt /= 1000;
    }

    this.lastTime = now;

    if (this.startedAt) {
      this.update(dt);
    }

    this.animationId = window.requestAnimationFrame(this.loop.bind(this));
  },

  init: function() {
    this.listen();
    this.el.buttons.start.disabled = false;
    this.renderFileTree();

    this.lastTime = timeStamp();
    this.loop();
  }
}
