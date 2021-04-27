import moment from 'moment';

export const DATE_FORMAT = 'MM/DD/YYYY';
export const TIME_FORMAT = 'h:mm A';

export function isValidDate(date) {
  const regex = /^(0[1-9]|1[012])[/](0[1-9]|[12][0-9]|3[01])[/](19|20)\d\d$/;
  return regex.test(date);
}

export function isValidTime(time) {
  const regex = /^(0?[1-9]|1[012])(:[0-5]\d) [APap][mM]$/;
  return regex.test(time);
}

export function isValidRelativeTime(time) {
  const regex = /^(\d+)(:[0-9]\d)$/;
  return regex.test(time);
}

export const getCombinedDateTime = (date, time) => (
  moment(`${date} ${time}`, `${DATE_FORMAT} ${TIME_FORMAT}`).toDate()
);

export function decemicalTimeFormat(value) {
  if (value === 0) {
    return '0';
  }
  const hrs = Math.floor(value);
  let min = Math.round((value % 1) * 60);
  min = min < 10 ? `0${min}` : min.toString();
  return `+ ${hrs} h ${min} min`;
}

export function decemicalToTime(value) {
  if (value === 0) {
    return '';
  }
  const hrs = Math.floor(value);
  let min = Math.round((value % 1) * 60);
  min = min < 10 ? `0${min}` : min.toString();
  return `${hrs}:${min}`;
}

export function timeToDecemical(time) {
  const hoursMinutes = time.split(/[.:]/);
  const hours = parseInt(hoursMinutes[0], 10);
  const minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;
  return (hours + (minutes / 60));
}

export function unixTimeToDate(value) {
  return new Date(value * 1000);
}

export function getAge(dateUnixTimeString) {
  const today = new Date();
  const birthDate = unixTimeToDate(dateUnixTimeString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
