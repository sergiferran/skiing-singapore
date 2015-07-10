import Ember from 'ember';
import Elevation from 'skiing-singapore/utils/elevation';

export default Ember.Component.extend({
  model: null,

  error: null,

  solution: null,

  steep: 0,
  length: 0,

  _cache: null,
  _numRows: null,
  _numCols: null,
  _data: null,


  setTestModel: function() {
    this.set('model', '4 4\n4 8 7 3\n2 5 9 3\n6 3 2 5\n4 4 1 6');
  }.on('init'),

  solveProblem: function() {
    var model = this.get('model');

    var error = null;
    var solution = null;

    try {
      Ember.assert('You need to pass data', !Ember.isBlank(model));

      var firstLineIndex= model.indexOf('\n');
      var firstLine = model.substring(0,firstLineIndex).trim();
      Ember.assert('First line must be the array size. e.g: 4 4.', firstLine.match(/^\d+ \d+$/));

      var arraySize = firstLine.split(' ');
      var rows = parseInt(arraySize[0]);
      // Ember.assert('Rows length must be the same as the first number in first line', rows === lines.get('length'));

      var cols = parseInt(arraySize[1]);
      var elevations=[];
      var currentRow=[];
      var currentValue='';
      for(var i=firstLineIndex+1;i<model.length;i++){
        var curChar=model[i];
        if(curChar===' ' || curChar==='\n'){
          currentRow.push(parseInt(currentValue));
          currentValue='';
          if(curChar==='\n'){
            elevations.push(currentRow);
            currentRow=[];
          }
        }else{
          currentValue+=curChar;
        }
      }
      currentRow.push(parseInt(currentValue));
      elevations.push(currentRow);

      // var elevations = lines.map(function(line, row) {
      //   var elevationsInRow = line.trim().split(' ');
      //   Ember.assert('Row %@ must have %@ elevations and have %@'.fmt(row, cols, elevationsInRow.get('length')), cols === elevationsInRow.get('length'));

      //   return elevationsInRow.map(function(elevation, col) {
      //     return parseInt(elevation);
      //   });
      // });

      this.setProperties({
        _numRows: rows,
        _numCols: cols,
        _cache: {},
        _data: elevations
      });

      var bestPathForCell = Ember.run.bind(this, this._bestPathForCell);
      var bestPathComparator = Ember.run.bind(this, this._bestPathBetweenTwo);

      window.console.debug('empiezo a calcular');
      var bestPath = null;

      for(var rowIndex=0; rowIndex< rows; rowIndex++){
        for(var colIndex=0; colIndex<cols;colIndex++){
          var pathForCell = bestPathForCell(rowIndex, colIndex);
          bestPath= bestPathComparator(bestPath, pathForCell);
        }
      }

      window.console.debug(bestPath);

      var colValue = null;

      solution=bestPath.mapBy('value').join(' - ');

      solution+='</br>';
      
      solution+='length: %@, steep drop: %@'.fmt(bestPath.get('length'), bestPath.get('firstObject.value') - bestPath.get('lastObject.value'));


      // solution = elevations.reduce(function(memoRow, row, rowIndex) {
      //   return row.reduce(function(memoCol, col, colIndex) {
      //     colValue = col;
      //     if (bestPath.filterBy('row', rowIndex).anyBy('col', colIndex)) {
      //       colValue = '<b>%@</b>'.fmt(col);
      //     }
      //     return '%@ %@'.fmt(memoCol, colValue);
      //   }, memoRow) + '<br>';
      // }, '');


    } catch (e) {
      error = e;
      throw e;
    }

    this.setProperties({
      error: error,
      solution: solution
    });

  }.observes('model'),

  _bestPathForCell: function(row, col, previousValue) {
    var rows = this.get('_numRows');
    var cols = this.get('_numCols');

    var value = this.get('_data.%@.%@'.fmt(row, col));

    if ((!previousValue && value < this.get('steep')) || previousValue <= value) {
      return null;
    }

    var cache = this.get('_cache');

    var cacheKey = 'r%@c%@'.fmt(row, col);
    var pathCached = cache[cacheKey];
    if (pathCached) {
      return pathCached;
    }

    var candidates = [];

    if (row > 0) { //up
      candidates.addObject(this._bestPathForCell(row - 1, col, value));
    }

    if (row < cols - 1) { //down
      candidates.addObject(this._bestPathForCell(row + 1, col, value));
    }

    if (col > 0) { //left
      candidates.addObject(this._bestPathForCell(row, col - 1, value));
    }

    if (col < rows - 1) { //right
      candidates.addObject(this._bestPathForCell(row, col + 1, value));
    }

    var candidatePath = candidates.compact().reduce(Ember.run.bind(this, this._bestPathBetweenTwo), null) || [];

    var elevation = Elevation.create({
      row: row,
      col: col,
      value: value
    });

    var bestPath = [elevation];
    bestPath.addObjects(candidatePath);
    cache[cacheKey] = bestPath;

    window.console.debug('bestPath for %@,%@ is %@'.fmt(row, col, bestPath.mapBy('value').join('-')));

    return bestPath;
  },

  _bestPathBetweenTwo: function(memo, candidate) {
    if (!candidate) return memo;
    var lengthCandidate = candidate.get('length');
    var steepCandidate = candidate.get('firstObject.value') - candidate.get('lastObject.value');
    if (!memo || memo.get('length') < lengthCandidate || (memo.get('length') === lengthCandidate && (memo.get('firstObject.value') - memo.get('lastObject.value')) < steepCandidate)) {
      this.set('steep', Math.max(this.get('steep'), steepCandidate));
      return candidate;
    }
    return memo;

  }

});