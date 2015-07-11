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
export default Elevation;