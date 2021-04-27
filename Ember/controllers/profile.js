import Controller from '@ember/controller';
import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { get, set } from '@ember/object';
import DS from 'ember-data';

export default Controller.extend({
  app: service(),
  intl: service(),
  store: service(),
  modal: service(),
  flashMessages: service(),
  subscription: alias('app.currentSubscription'),

  resendInfo() {
    get(this, 'subscription')
      .emailAccountInfo()
      .then(() => {
        get(this, 'flashMessages').success(
          get(this, 'intl').t('common.confirmation_email_sent'),
          {
            title: get(this, 'intl').t('common.success')
          }
        );
      })
      .catch(() => {
        get(this, 'flashMessages').warning(
          get(this, 'intl').t('errors.confirmation_email'),
          {
            title: get(this, 'intl').t('common.warning')
          }
        );
      });
  },

  save() {
    const subscription = get(this, 'subscription');

    if (get(subscription, 'hasDirtyAttributes')) {
      if (!get(this, 'subscriptionIsSaving')) {
        subscription.validate().then(({ model }) => {
          set(model, 'didValidate', true);

          // to prevent validation collision with FCC (subscriber_pin is null for HD)
          if (
            get(model, 'validations.attrs.first_name.isValid') &&
            get(model, 'validations.attrs.last_name.isValid') &&
            get(model, 'validations.attrs.email.isValid')
          ) {
            set(this, 'subscriptionIsSaving', true);
            subscription
              .save()
              .then(() => {
                get(this, 'flashMessages').success(
                  get(this, 'intl').t('common.information_saved'),
                  {
                    title: get(this, 'intl').t('common.success')
                  }
                );
              })
              .catch(error => {
                if (error instanceof DS.ConflictError) {
                  return;
                }

                get(this, 'flashMessages').warning(
                  error.message ||
                    get(this, 'intl').t('profile.subscription_not_saved'),
                  {
                    title: get(this, 'intl').t('common.warning')
                  }
                );
              })
              .finally(() => {
                set(this, 'subscriptionIsSaving', false);
              });
          }
        });
      }
    } else {
      get(this, 'flashMessages').success(
        get(this, 'intl').t('common.noting_was_changed'),
        {
          title: get(this, 'intl').t('common.success')
        }
      );
    }
  },

  actions: {
    showChangePassword() {
      get(this, 'modal').toggleModal('popups/modal-change-password');
    },

    showChangeAccessCode() {
      get(this, 'modal').toggleModal('popups/modal-change-access-code');
    },

    resendInfo() {
      this.resendInfo();
    },

    saveKeyUp(model, value, event) {
      if (event && event.which === 13) {
        this.save();
      }
    },

    save() {
      this.save();
    }
  }
});
