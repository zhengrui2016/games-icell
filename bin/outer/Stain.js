/*** 污渍 ***/
yc.outer.Stain = yc.outer.PhysicalEntity.extend({

	size: 0
	
	, points: []
	
	, density: 0.3
	
	, ctor: function(){
		this._super() ;
		this.id = yc.outer.Stain.assigned ++ ;
		yc.outer.Stain.pool.push(this) ;
	}
	
	, initRandom: function(){

		var stain = this ;

		// 顶点数量(3-4 个顶点)；为避免出现凹多边形，随机顶点数不超过4个
		var pointNum = 3 + Math.round(Math.random()*1) ;
		var maxRadius = 400 * Math.random() ;
		this.size = 0 ;
		
		var createPoint = function(radian){

			var radian = radian%(2*Math.PI) ;
			var radius = Math.random() * maxRadius ;
			
			if(stain.size<radius)
			{
				stain.size=radius
			}
			
			return [(Math.cos(radian) * radius),(Math.sin(radian) * radius)] ;
		}   
		
		var angle = 2*Math.PI / pointNum ;
		var points = [] ;
		
		// 第一个顶点
		var pr = 2*Math.PI*Math.random() ;
		points.push( createPoint(pr) ) ;
		
		// 处理第二个到最后一个
		for(var p=1;p<pointNum;p++)
		{
			points.push( createPoint(pr+=angle) ) ;
		}

		var script = {
				shapes: [
					{
						type: 'polygon'				// 类型 circle, polygon
						, density: Math.random()	// 密度
						, points: points
					}
				]
		}
		
		this.initWithScript(script) ;
	}

	, appendWorldPoint: function(x,y){
		this.points.push({
			x: x-this.x
			, y: y-this.y
			, idx: this.points.length
		}) ;
	}
	, appendPoint: function(x,y){
		this.points.push({
			x: x
			, y: y
			, idx: this.points.length
		}) ;
	}
	, removePoint: function(idx){
		this.points.splice(idx,1) ;
		for ( var i = 0; i < this.points.length; i++) {
			this.points[i].idx = i ;
		}
	}
	
	, draw: function(ctx){

		ctx.lineJoin = 'round' ;

		ctx.rotate(this.getRotation());
		
		this._super(ctx) ;
		
//		// 绘制调试辅助线
//		if(yc.settings.outer.stain.dbg)
//		{
//			ctx.fillStyle = 'red' ;
//			ctx.arc(0,0, 2, 0, 2*Math.PI, false) ;
//			ctx.stroke() ;
//
//			ctx.fillText(this.id,-4,-2);
//			
//			for ( var p = 0; p < this.points.length; p++) {
//				var point = this.points[p] ;
//				ctx.fillText(point.idx,point.x-6,-point.y+10);
//			}
//
//			// 绘制调试辅助线
//			this.testCollision( ins(yc.outer.Cell), ctx ) ;
//		}

	}
	
	, removeFromParentAndCleanup: function(){
		this._super() ;
		yc.util.arr.remove(yc.outer.Stain.pool,this);
	}
	
	, update: function(dt){
		
		this._super(dt) ;

		var cell = ins(yc.outer.Cell) ;
		var dis = yc.util.pointsDis(this.x,this.y,cell.x,cell.y) ;
		this.autoWakeup(dis) ;
	}

	, initWithScript: function(script){
		
		this._super(script) ;

		if('shapes' in script)
		{
			this.initWithScriptShapes(script.shapes) ;
		}

		//this.b2Body.SetLinearDamping( this.b2Body.GetMass() * yc.settings.outer.stain.defaultMultipleLinearDamping ) ;
		//this.b2Body.SetAngularDamping( this.b2Body.GetMass() * yc.settings.outer.stain.defaultMultipleAngularDamping ) ;
	}

	/**
	 * 废弃不用的点相对多边形内外检测函数
	 */
	, testCollision: function(entity,ctx){
		
		if( (entity.size+this.size) < yc.util.pointsDis(this.x,this.y,entity.x,entity.y) )
		{
			return false ;
		}
		
		var target = {
			x: entity.x - this.x
			, y: entity.y - this.y
		}
		
		// 到多边形中心点的角度
		var crossBoards = 0 ;
		var rayRadian = yc.util.radianBetweenPoints(target.x,target.y,0,0) ;
		var rayRadianRevert = rayRadian - 2*Math.PI ;
		
		if(ctx)
		{
			ctx.fillStyle='rgb(255,0,0)'
			yc.util.drawLine(target,[0,0],ctx,null,true) ;
			ctx.fillText(rayRadian.toFixed(2),0,0) ;
			ctx.fillText(rayRadianRevert.toFixed(2),0,10) ;
		}
		
		var pointA = this.points[this.points.length-1] ;
		pointA._r = pointA.__r = yc.util.radianBetweenPoints(target.x,target.y,pointA.x,pointA.y) ;
		
		for(var p=0;p<this.points.length;p++)
		{
			var pointB = this.points[p] ;
			pointB.__r = pointB._r = yc.util.radianBetweenPoints(target.x,target.y,pointB.x,pointB.y) ;
			pointA.__r = pointA._r
			
			if(pointA._r>pointB._r)
			{
				pA = pointA ;
				pB = pointB ;
			}
			else
			{
				pA = pointB ;
				pB = pointA ;
			}
			
			var targetRadian = rayRadian ;
			
			// 两个角的差值超过 180
			if( pA._r-pB._r>Math.PI )
			{
				// 较大的角取反值
				pA.__r = pA._r - 2*Math.PI ;
				
				// 交换大小关系
				var m = pA ;
				pA = pB ;
				pB = m ;
				
				// 如果射线的角度大于 180， 也取反值
				if(rayRadian>Math.PI)
				{
					targetRadian = rayRadianRevert ;
				}
			}
			
			var crossed = pA.__r>targetRadian && pB.__r<targetRadian ;
			if( crossed )
			{
				crossBoards ++ ;
			}
			
			if(ctx)
			{
				yc.util.drawLine(pointA,pointB,ctx,crossed?'rgb(0,255,0)':'rgb(255,0,0)',true) ;
				yc.util.drawLine(target,pointB,ctx,"rgb(200,200,200)",true) ;
				
				ctx.fillText(p+': '+pointA.__r.toFixed(3),pointA.x,-pointA.y) ;
				ctx.fillText(p+': '+pointB.__r.toFixed(3),pointB.x,-pointB.y-12) ;
			}
			
			pointA = pointB ;
		}
		
		if(ctx)
		{
			ctx.fillText('cross boards:'+crossBoards,0,20) ;
		}
		if( crossBoards%2 )
		{
			return true ;
		}
		else
		{
			return false ;
		}
	}
}) ;


yc.outer.Stain.downSpeed = function(entity){
	
	var downSpeed = 0 ;
	
	var stains = yc.outer.Stain.pool ;
	for(var i=0;i<stains.length;i++)
	{
		if( stains[i].testCollision(entity) )
		{
			if( downSpeed < stains[i].damping )
			{
				downSpeed = stains[i].damping ;
			}
		}
	}
	
	entity.runDamping = 1 - downSpeed ;
}

yc.outer.Stain.pool = [] ;
yc.outer.Stain.assigned = 0 ;