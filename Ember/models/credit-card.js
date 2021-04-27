import { equal } from '@ember/object/computed';
import { get, set, computed } from '@ember/object';
import DS from 'ember-data';
import moment from 'moment';
import { inject as service } from '@ember/service';
import { collectionAction } from 'ember-api-actions';
import { not } from '@ember/object/computed';

const { Model, attr, belongsTo } = DS;

import { validator, buildValidations } from 'ember-cp-validations';

const Validations = buildValidations({
  ccYear: [
    validator('presence', true),
    validator('number', {
      allowString: true,
      integer: true,
      gte: computed(function() {
        return moment().year();
      }),
      message() {
        return get(this, 'model.intl').t('ember_validations.not_valid');
      }
    })
  ],

  ccMonth: [
    validator('presence', true),
    validator('number', {
      allowString: true,
      integer: true,
      lte: 12,
      message() {
        return get(this, 'model.intl').t('ember_validations.not_valid');
      }
    }),
    validator('credit-card-month')
  ],

  payment: [validator('presence', true), validator('ds-error')],
  card_holder_name: [
    validator('presence', true),
    validator('ds-error'),
    validator('custom-validation')
  ],

  card_number: [
    validator('presence', true),
    validator('format', {
      regex: /^\**[0-9\s]+$/,
      message() {
        return get(this, 'model.intl').t('ember_validations.not_valid');
      }
    }),
    validator('ds-error'),
    validator('custom-validation')
  ],

  cid: [
    validator('presence', true),
    validator('number', {
      allowString: true,
      integer: true
    }),
    validator('length', {
      min: 3,
      max: 4
    }),
    validator('ds-error')
  ],

  country: [validator('presence', true), validator('ds-error')],
  billing_address: [validator('presence', true), validator('ds-error')],
  billing_city: [validator('presence', true), validator('ds-error')],

  state: [
    validator('presence', {
      presence: true,
      disabled: not('model.country.unitedStates')
    }),
    validator('ds-error')
  ],

  billing_zip: [validator('presence', true), validator('ds-error')],
  billing_phonenumber: [
    validator('presence', true),
    validator('phone-number'),
    validator('ds-error')
  ]
});

export default Model.extend(Validations, {
  intl: service(),

  subscription: belongsTo('subscription'),
  country: belongsTo('country'),
  state: belongsTo('state'),
  billing_state: attr('string'),
  payment: belongsTo('payment'),
  billing_address: attr('string'),
  billing_address2: attr('string'),
  billing_city: attr('string'),
  billing_zip: attr('string'),
  billing_phonenumber: attr('string'),
  card_holder_name: attr('string'),
  card_number: attr('string'),
  expiration: attr('string'),
  cid: attr('string'),
  validation_status: attr('string', { defaultValue: 'no_access' }),
  grecaptcha: attr('string'),
  next_step_token: attr('string'),
  account_number: attr('string'), // ACH

  credit_card_expired: attr('boolean'),
  credit_card_about_to_expire: attr('boolean'),

  isRestricted: equal('validation_status', 'restricted_access'),
  isFullAccess: equal('validation_status', 'full_access'),

  skipCaptchaValidation: false,
  termsAndConditions: true,
  // trialAgreement: false, // no used?

  validateOnServer: collectionAction({ path: 'validate', type: 'post' }),

  ccYear: computed('expiration', {
    get() {
      const expiration = get(this, 'expiration');
      let year;

      if (expiration) {
        year = expiration.split('/')[1];
        if (year === 'undefined') {
          year = undefined;
        }
      }
      return year;
    },

    set(key, value) {
      if (get(this, 'ccMonth') || value) {
        set(this, 'expiration', get(this, 'ccMonth') + '/' + value);
      }

      return value;
    }
  }),

  ccMonth: computed('expiration', {
    get() {
      const expiration = get(this, 'expiration');
      let month;

      if (expiration) {
        month = expiration.split('/')[0];
        if (month === 'undefined') {
          month = undefined;
        }
      }
      return month;
    },
    set(key, value) {
      if (value || get(this, 'ccYear')) {
        set(this, 'expiration', value + '/' + get(this, 'ccYear'));
      }

      return value;
    }
  }),

  isCheck: computed('payment', function() {
    return get(this, 'payment') && get(this, 'payment.category') === 'check';
  })
});
