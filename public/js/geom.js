geom = function(){
	this.doesCircleIntersectWithLine(lineStart,lineEnd,centre,radius){
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
	
	this.originPoint(){
		return { x : 0, y : 0 };
	}
	
	this.subtractPoint( p1, p2 ){
		return { x : p1.x - p2.x, y : p1.y - p2.y  };
	}
}