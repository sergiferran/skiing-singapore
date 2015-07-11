var Elevation  = function(value, row, col){
  this.row=row;
  this.col=col;
  this.value=value;
};
Elevation.prototype = {
  toString: function(){
      return this.value;
    }
};

var cache=null;
var curLength=null;

function assert(message, condition){
  if(!condition){
    throw( new Error(message));
  }
}

function findBestPath(model){
  try{
      var firstLineIndex= model.indexOf('\n');
      var firstLine = model.substring(0,firstLineIndex).trim();
      assert('First line must be the array size. e.g: 4 4.', firstLine.match(/^\d+ \d+$/));

      var arraySize = firstLine.split(' ');
      var rows = parseInt(arraySize[0]);

      var cols = parseInt(arraySize[1]);
      var elevations=[];
      
      //NOTE: Faster way to create the matrix instead of split
      var currentRow=[];
      var currentValue='';
      for(var i=firstLineIndex+1;i<model.length;i++){
        var curChar=model[i];
        if(curChar===' ' || curChar==='\n'){
          assert("Empty elevation", currentValue.length>0);
          assert("An elevation is not a number", !isNaN(currentValue));
          currentRow.push(parseInt(currentValue));
          currentValue='';
          if(curChar==='\n'){
            assert('Row '+elevations.length+' must have '+cols+' elevations and has ' + currentRow.length, cols === currentRow.length);
            elevations.push(currentRow);
            currentRow=[];
          }
        }else{
          currentValue+=curChar;
        }
      }
      if(currentValue.trim().length>0){
        currentRow.push(parseInt(currentValue));
      }
      if(currentRow.length>0){
        assert('Row '+elevations.length+' must have '+cols+' elevations and has ' + currentRow.length, cols === currentRow.length);
        elevations.push(currentRow);
      }
      assert('Rows length must be the same as the first number in first line', rows === elevations.length);
      // END CREATION MATRIX

      var bestPath = null;
      cache={};

      var totalElevations= rows*cols;
      var percent = {status:0};
      for(var rowIndex=0; rowIndex< rows; rowIndex++){
        for(var colIndex=0; colIndex<cols;colIndex++){
          var pathForCell = _bestPathForCell(rowIndex, colIndex, rows, cols, elevations);
          bestPath= _bestPathBetweenTwo(bestPath, pathForCell);
        }
          var newPercent = Math.round((((rowIndex * cols)+colIndex)*100) / totalElevations);
          if(newPercent>percent.status){
            percent.status = newPercent;
            postMessage(JSON.stringify(percent));
          }
      }

      var solution = {
        path: bestPath.map(function(path){return path.value;}).join(' - '),
        items: bestPath,
        length: bestPath.length,
        steep: (bestPath[0].value - bestPath.slice(-1)[0].value)
      }
      postMessage(JSON.stringify(solution));

    } catch (e) {
      var error = {
        error: e.message
      }
      postMessage(JSON.stringify(error));
    }
  }



    function _bestPathForCell(row, col, rows, cols, elevations, previousValue) {
    var value = elevations[row][col];

    if ((!previousValue && value < curLength) || previousValue <= value) {
      return null;
    }

    var cacheKey = 'r'+row+'c'+col;
    var pathCached = cache[cacheKey];
    if (pathCached) {
      return pathCached;
    }

    var candidatePath = null;
    if (row > 0) { //up
      candidatePath=_bestPathForCell(row - 1, col, rows, cols, elevations, value);
    }

    if (row < rows - 1) { //dow
      candidatePath=_bestPathBetweenTwo(candidatePath, _bestPathForCell(row + 1, col, rows, cols, elevations, value));
    }

    if (col > 0) { //left
      candidatePath=_bestPathBetweenTwo(candidatePath, _bestPathForCell(row, col - 1, rows, cols, elevations, value));
    }

    if (col < cols - 1) { //rig
      candidatePath=_bestPathBetweenTwo(candidatePath, _bestPathForCell(row, col + 1, rows, cols, elevations, value));
    }

    var elevation = new Elevation(value, row, col);

    var bestPath = [elevation];
    if(candidatePath){
      candidatePath.forEach(function(path){
        bestPath.push(path);
      });
    }
    cache[cacheKey] = bestPath;

    return bestPath;
  }

  function _bestPathBetweenTwo(memo, candidate) {
    if (!candidate) {return memo;}
    var lengthCandidate = candidate.length;
    var steepCandidate = candidate[0].value - candidate.slice(-1)[0].value;
    if (!memo || memo.length < lengthCandidate || (memo.length === lengthCandidate && (memo[0].value - memo.slice(-1)[0].value) < steepCandidate)) {
      curLength= Math.max(curLength, lengthCandidate);
      return candidate;
    }
    return memo;
  }

self.addEventListener('message', function(e) {
  findBestPath(e.data);
}, false);
