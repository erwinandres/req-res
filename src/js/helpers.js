const chars = 'abcdefghijklmnopqrstuvwxyz';

function timeStamp () {
  return window.performance && window.performance.now ?
      window.performance.now() :
      Date.now();
}

function ID () {
  return '_' + Math.random().toString(36).substr(2, 9);
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function numberEnding (number) {
    return (number === 1) ? '' : 's';
}

function humanTime(milliseconds) {
  let temp = Math.floor(milliseconds / 1000);
  let years = Math.floor(temp / 31536000);
  if (years) {
      return years + ' year' + numberEnding(years);
  }

  let days = Math.floor((temp %= 31536000) / 86400);

  if (days) {
      return days + ' day' + numberEnding(days);
  }

  let hours = Math.floor((temp %= 86400) / 3600);

  if (hours) {
      return hours + ' hour' + numberEnding(hours);
  }

  let minutes = Math.floor((temp %= 3600) / 60);

  if (minutes) {
      return minutes + ' minute' + numberEnding(minutes);
  }

  let seconds = temp % 60;

  if (seconds) {
      return seconds + ' second' + numberEnding(seconds);
  }

  return 'less than a second';
}

String.prototype.removeCharAt = function (i) {
    const tmp = this.split('');
    tmp.splice(i - 1 , 1);

    return tmp.join('');
}

String.prototype.insertCharAt = function (i, char) {
    return this.slice(0, i) + char + this.slice(i);
}
