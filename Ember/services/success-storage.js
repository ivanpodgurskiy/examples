import Service from '@ember/service';
import { inject as service } from '@ember/service';
import moment from 'moment';
import { get } from '@ember/object';

const LOCAL_STORAGE_KEY = 'launcher_last_success';
const MAX_AGE = moment.duration(6, 'months');

export default Service.extend({
  storage: service('local-storage'),
  cookies: service(),

  getLastSuccess() {
    return get(this, 'storage').getItem(LOCAL_STORAGE_KEY);
  },

  hasSuccess: function() {
    const lastSuccess = parseInt(this.getLastSuccess(), 10);
    if (!lastSuccess) {
      return false;
    }
    const ago = moment().unix() - lastSuccess; //sec
    const freshEnough = moment.duration(ago, 'seconds') < MAX_AGE;
    console.log(
      `[SuccessStorage] hasSuccess(): Found lastSuccess: ${lastSuccess} which was ago: ${ago} so it is fresh enough: ${freshEnough}`
    );
    return freshEnough;
  },

  storeSuccess: function() {
    const cookieService = get(this, 'cookies');

    const now = moment().unix();
    const setItemWorked = get(this, 'storage').setItem(LOCAL_STORAGE_KEY, now);
    window.ga('send', 'event', 'app', 'local_storage', 'store_success');
    cookieService.clear('launcher_token', { path: '/' });
    console.log(
      `[SuccessStorage] storeSuccess(): ${now} setItem to localStorage worked: ${setItemWorked}`
    );
    return setItemWorked;
  },

  removeSuccess: function() {
    window.ga('send', 'event', 'app', 'local_storage', 'remove_success');
    console.log('[SuccessStorage] removeSuccess()');
    return get(this, 'storage').removeItem(LOCAL_STORAGE_KEY);
  }
});
