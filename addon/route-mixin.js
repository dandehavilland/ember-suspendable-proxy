import Ember from 'ember';
import SuspendableProxy from './proxy';

export default Ember.Mixin.create({
  suspendOnSetup: true,

  setupController: function(controller, model) {
    var suspendable = SuspendableProxy.create({
      content: model,
      isSuspended: this.get('suspendOnSetup')
    });
    controller.set('model', suspendable);
  }
});
