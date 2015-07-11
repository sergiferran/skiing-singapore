import Ember from 'ember';

export default Ember.Component.extend({
  model: null,

  error: null,

  solution: null,
  status: null,
  statusWidth: function(){
    return 'width: %@%'.fmt(this.get('status'));
  }.property('status'),

  _worker: null,

  testModels: [],

  cancelVisible: false,


  loadTestModels: function() {
    var testModels = [];
    testModels.addObject('4 4\n4 8 7 3\n2 5 9 3\n6 3 2 5\n4 4 1 6');
    testModels.addObject('4 4\n4 8 7 3\n2 5 9 3 6\n6 3 2 5\n4 4 1 6');
    testModels.addObject('4 4\n4 8 7 3\n2 5 9 a\n6 3 2 5\n4 4 1 6');
    Ember.$.ajax('/assets/map.txt').then(function(data){
      testModels.addObject(data);
    });
    this.set('testModels', testModels);
  }.on('init'),

  solveProblem: function() {
    var model = this.get('model');
    this.set('error', null);
    this.set('status', null);
    this.set('solution', null);

    try {
      Ember.assert('You need to pass data', !Ember.isBlank(model)); 
    } catch (e) {
      this.set('error', e);
    }

    var worker=this.get('_worker');
    if(worker){
      worker.terminate();
    }
    worker = new window.Worker('assets/workers/findBestPath.js');

    worker.addEventListener("message", Ember.run.bind(this, function (oEvent) {
      var data = JSON.parse(oEvent.data);
      if(data.error){
        this.set('error', data.error);
      }else if(data.status){
        this.set('status', data.status);        
      }else if(data.path){
        var solution=data.path;

      solution+='</br>';
      
      solution+='length: '+data.length+', steep drop: '+data.steep;
        this.set('solution', data);        
      } 
    }), false);

    worker.postMessage(model);

    this.set('_worker', worker);
  }.observes('model'),

  cancelVisibleObserver: function(){
    this.set('cancelVisible', !(Ember.isPresent(this.get('solution')) || Ember.isPresent(this.get('error'))));
  }.observes('solution', 'error'),

  actions: {
    cancelWorker: function(){
      var worker=this.get('_worker');
      if(worker){
        worker.terminate();
        this.set('_worker', null);
        this.set('error', 'You have cancelled the process, change the data to restart or press Start button');
      }
    },
    startWorker :function(){
      this.solveProblem();
    }, 
    emptyMap: function(){
      this.set('model', null);
    }, 
    loadMap: function(index){
      this.set('model', this.get('testModels').objectAt(index));
    }
  }

});