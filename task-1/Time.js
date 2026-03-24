export class Time {
    #secondsFromMidnight;

  constructor(hours, minutes, seconds) {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    if (totalSeconds < 0 || totalSeconds >= 86400) {
      throw new Error('Invalid time');
    }

    this.#secondsFromMidnight = totalSeconds;
  }

  getHours() {
    return Math.floor(this.#secondsFromMidnight / 3600);
  }

  getMinutes() {
    return Math.floor((this.#secondsFromMidnight % 3600) / 60);
  }

  getSeconds() {
    return this.#secondsFromMidnight % 60;
  }

  addSeconds(seconds) {
    this.#secondsFromMidnight =
      ((this.#secondsFromMidnight + seconds) % 86400 + 86400) % 86400;
  }

  addMinutes(minutes) {
    this.addSeconds(minutes * 60);
  }

  addHours(hours) {
    this.addSeconds(hours * 3600);
  }

  toString() {
  let hour = this.getHours();
  let minute = this.getMinutes();
  let second = this.getSeconds();

  if (hour < 10) {
    hour = '0' + hour;
  }

  if (minute < 10) {
    minute = '0' + minute;
  }

  if (second < 10) {
    second = '0' + second;
  }
    return `${hour}:${minute}:${second}`;
  }
}