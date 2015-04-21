import Ember from 'ember';

var SuspendableProxy = Ember.Object.extend(Ember.Observable, {
  content: null,

  cachedKeys: function() {
    return Ember.A();
  }.property(),

  cached: function() {
    return Ember.Object.createWithMixins(Ember.Observable);
  }.property(),

  isSuspended: false,

  isRecursive: true,

  unknownProperty: function(key) {
    var cached = this.get('cached'),
        content = this.get('content'),
        isSuspended = this.get('isSuspended');

    this.get('cachedKeys').pushObject(key);

    // first consult our proxy cache
    if (cached.hasOwnProperty(key)) {
      return Ember.get(cached, key);
    }

    // otherwise fetch from the proxied model
    var proxiedValue = Ember.get(content, key);

    // if we can listen for changes, then we shall
    Ember.addObserver(content, key, this, this.proxiedPropertyChanged);

    // recursive suspension
    if (this.get('isRecursive') && typeof proxiedValue === 'object') {

      if (Ember.Array.detect(proxiedValue)) {

        proxiedValue = proxiedValue.map(function(item) {
          return SuspendableProxy.create({
            content: item,
            isSuspended: isSuspended
          });
        });

      } else {

        proxiedValue = SuspendableProxy.create({
          content: proxiedValue,
          isSuspended: isSuspended
        });
      }
    }

    Ember.set(cached, key, proxiedValue);
    return proxiedValue;
  },

  proxiedPropertyChanged: function(sender, key) {
    if (this.get('isSuspended')) {
      return;
    }

    var value = sender.get(key);

    this.propertyWillChange(key);
    this.get('cached').set(key, value);
    this.propertyDidChange(key);
  },

  toggleObservers: function(shouldSuspend) {
    this.set('isSuspended', shouldSuspend);
    if (this.get('isRecursive')) {
      var cached = this.get('cached');
      this.get('cachedKeys').forEach(function(key) {
        var nested = Ember.get(cached, key);
        if (nested && nested.toggleObservers) {
          nested.toggleObservers(shouldSuspend);
        }
      });
    }
  },

  suspendObservers: function() {
    this.toggleObservers(true);
  },

  resumeObservers: function() {
    this.toggleObservers(false);
  },

  // set all unknown values on the cache, condemning them to oblivion in the long run
  setUnknownProperty: function(key, value) {
    this.get('cached').set(key, value);
  },
});

export default SuspendableProxy;
