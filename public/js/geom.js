
geom = new (function(){

	this.applyMatrixToPoints = function(points,transform){
		
		return points.map(function(v){ 
			var p = transform.transformPoint(v.x,v.y);
			return { 
				x : p[0],
				y : p[1]
				//x : matrix.a * v.x + matrix.c * v.y + matrix.e, 
				//y : matrix.b * v.x + matrix.d * v.y + matrix.f 
			}; 
		});
	
	}

	this.calculateBounds = function(points){
		
		var xValues = points.map(function(val){ return val.x });
		var yValues = points.map(function(val){ return val.y });
	
		var bounds = {
			xMin : Math.min.apply(null,xValues),
			xMax : Math.max.apply(null,xValues),
			yMin : Math.min.apply(null,yValues),
			yMax : Math.max.apply(null,yValues)
		};
		
		return bounds;
	}

	this.isPointInsideBounds = function(point,bounds){
	
		var horizontal = bounds.xMin < point.x && point.x < bounds.xMax;
		var vertical = bounds.yMin < point.y && point.y < bounds.yMax;
	
		return horizontal && vertical ;
	}
	
	this.doBoundsOverlap = function(boundsA,boundsB){
		var horizontal = ( boundsA.xMin < boundsB.xMax && boundsB.xMin < boundsA.xMax );
		var vertical = ( boundsA.yMin < boundsB.yMax && boundsB.yMin < boundsA.yMax );
		
		return horizontal && vertical;
	}
	
	this.doesPointLieWithinCircle = function(point, centre, radius ){
		var x = point.x - centre.x ;
		var y = point.y - centre.y ;
		var h2 = ( x*x + y*y );
		var r2 = radius * radius;
		
		return h2 < r2;
	}

	this.doesCircleIntersectWithLine = function(lineStart,lineEnd,centre,radius){
		//if not then find the intersection point between the line and circle direction as a time along A
		var u = this.calculateIntersection(lineStart,lineEnd, this.originPoint(), center );
		
		//return false if that time is less than 0 or greater than 1
		if( u < 0 || u > 1 ) return false;
		
		//return true if circle distance minus circle radius is less than or equal to the intersection point distance
		
		return u;
	};

	this.areLinesParallel = function(lineAStart,lineAEnd, lineBStart, lineBEnd){
		return (lineAStart.x-lineAEnd.x)*(lineBStart.y-lineBEnd.y)-(lineAStart.y-lineAEnd.y)*(lineBStart.x-lineBEnd.x) == 0;
	};
	
	this.calculateIntersection = function(lineAStart,lineAEnd, lineBStart, lineBEnd){
		bDiffX = lineBEnd.x - lineBStart.x;
		bDiffY = lineBEnd.y - lineBStart.y;
		
		var a = bDiffX * ( lineAStart.y - lineBStart.y ) - bDiffY * ( lineAStart.x - lineBStart.x ),
			b = bDiffY * ( lineAEnd.x - lineAStart.x  ) - bDiffX * ( lineBEnd.y - lineBStart.y ),
			u;
		
		if( b == 0 ) throw new Error("lines are parallel, no discrete intersection");
		
		u = a / b ;
		
		return u;
	};
	this.pointOnLine = function(lineStart,lineB,t){
		var point = {x:0,y:0};
		return point;
	};
	
	this.distanceSquare = function(lineAStart,lineAEnd){
		var x=lineAEnd.x-lineAStart.x,
			y=lineAEnd.y-lineAEnd.y;
		return x*x+y*y;
	}
	
	this.originPoint = function(){
		return { x : 0, y : 0 };
	}
	
	this.subtractPoint = function( p1, p2 ){
		return { x : p1.x - p2.x, y : p1.y - p2.y  };
	}
})();