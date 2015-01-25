aba.registerAnimation("ActiveGraph",function(options){ 
	// options
	this.options = $.extend({
		nodeColor: "#ffffff",
		edgeColor: "#ffffff"
	}, options );
	
	this.init = function(canvas){
		this.nodes = new Array();
		this.edges = new Array();
			
		this.canvas = canvas;
		this.width = this.canvas.width();
		this.height = this.canvas.height();
		
		//3 dots average per 100^2 pixels
		this.nb = Math.min(this.canvas.surface*2,140);
		this.near = 2;
		
		for (var i = 0; i < this.nb; i++){
			this.nodes.push(new Node(this,new aba.Position(aba.randomIntFromInterval(0,this.width),
														   aba.randomIntFromInterval(0,this.height))));
		}
	}
	
	this.hasEdge = function(e){
		for(var i=0; i < this.edges.length; i++) {
			if(e.equals(this.edges[i])) return true; 
		}
		return false; 
	}
	
	this.addEdge = function(e){
		if(!this.hasEdge(e)){
			this.edges.push(e);
		}
	}
	
	this.update = function(t){
		this.width = this.canvas.width();
		this.height = this.canvas.height();
		
		//node update
		for (var i = 0; i < this.nodes.length; i++){		
			this.nodes[i].update(t);
		}
		
		//edge search
		this.edges = new Array();
		var nears = this.nodes.slice(); //copy
		for (var i = 0; i < this.nodes.length; i++){
			var thisPos = this.nodes[i].position;
			nears.sort(function(a,b){
				return a.position.sqDistanceTo(thisPos) - b.position.sqDistanceTo(thisPos)
			});
			
			//first is itself
			for(var j=1;j < this.near+1; j++){
				this.addEdge(new Edge(this,this.nodes[i],nears[j]));
			}
			
			//nears = nears.slice(0, 3);
		}
		
		//edge update
		/*
		for (var i = 0; i < this.edges.length; i++){		
			this.edges[i].update(t);
		}
		*/
	}
	
	this.render = function(ctx){
		for (var i = 0; i < this.edges.length; i++){
			this.edges[i].render(ctx);
		}
		for (var i = 0; i < this.nodes.length; i++){
			this.nodes[i].render(ctx);
		}
	}

	function Node(graph,position){
		this.graph = graph;
		this.position = position || new aba.Position(0,0);
		this.speed = aba.randomIntFromInterval(0.1,15);
		this.direction = aba.randomIntFromInterval(0,2*Math.PI);
		
		this.vector = new aba.Vector(aba.randomIntFromInterval(0.1,15),aba.randomIntFromInterval(0,2*Math.PI));
		
		this.equals = function(n){
			return this.position.equals(n.position);
		}
		
		this.update = function(t){
			//var velocity = new Position(t*this.speed*Math.cos(this.direction),t*this.speed*Math.sin(this.direction));
			this.position.add(this.vector.getPosition().mul(t));
			
			if(this.position.x<0){this.position.x += this.graph.width;}
			else if(this.position.x>this.graph.width){this.position.x -= this.graph.width;}
			if(this.position.y<0){this.position.y += this.graph.height;}
			else if(this.position.y>this.graph.height){this.position.y -= this.graph.height;}
		}
		
		this.render = function(ctx){
			ctx.beginPath();
			ctx.arc(this.position.x, this.position.y, 4, 0, 2 * Math.PI, false);
			ctx.lineWidth = 2;
			ctx.fillStyle = '#0490d3';
			ctx.strokeStyle = this.graph.options.nodeColor;
			ctx.fill();
			ctx.stroke();
		}
	}

	function Edge(graph,nodeA,nodeB){
		this.graph = graph;
		this.nodeA = nodeA;
		this.nodeB = nodeB;
		
		this.equals = function(e){
			return (this.nodeA.position.equals(e.nodeA.position) && this.nodeB.position.equals(e.nodeB.position)) ||
				   (this.nodeA.position.equals(e.nodeB.position) && this.nodeB.position.equals(e.nodeA.position));
		}
		
		this.update = function(t){
			/*
			var vect = new Vector(t*10/(this.length()^2),this.angle());
			
			this.nodeB.vector.add(vect);
			vect.angle+=Math.PI;
			this.nodeA.vector.add(vect);
			*/
		}
		
		this.length = function(){
			return this.nodeA.position.sqDistanceTo(this.nodeB.position);
		}
		
		this.angle = function(){
			return Math.atan2(this.nodeA.position.y-this.nodeB.position.y,this.nodeA.position.x-this.nodeB.position.x);
		}
		
		this.render = function(ctx){
			var alpha = (1-(this.length()/10000));
			if(alpha<0.1){
				alpha=0.1;
			}
			ctx.strokeStyle = 'rgba(255,255,255,'+alpha+')';
			ctx.beginPath();
			ctx.moveTo(this.nodeA.position.x, this.nodeA.position.y);
			ctx.lineTo(this.nodeB.position.x, this.nodeB.position.y);
			ctx.stroke();
		}
	}					
});