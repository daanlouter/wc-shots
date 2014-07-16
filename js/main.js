var data;
var goalsContainer;
var pitch;
var pitchWidth = 800;
var pitchHeight = 400;
var oldMinute = 1;
var transitionSpeed = 200;
var matchesPerDay = {};
var goalsPerMatch = {};
var shotsPerMatch = [];
var idList = [];
var currentHash;
var goalsByMatch;
var hashValue;
var hashProperty;
var pitchContainer, pitchBackground, goalA, goalB, middleLine, middleCircle;
var pitchContainerWidth, pitchContainerHeight;

var scaleX = d3.scale.linear()
	.domain([50,100])
	.range([0,100])

var scaleY = d3.scale.linear()
	.domain([100,0])
	.range([0,pitchHeight])

$(document).ready(function(){
	if(window.location.hash){
		currentHash = window.location.hash.replace('#','');
		hashProperty = currentHash.split('=')[0];
	}
	goalsContainer = $('.shotsContainer');

	d3.csv("js/shots.csv", function(error, json) {
  		if (error) return console.warn(error);
  		data = json;
  		// visualizePerMatch();
  		visualizeOneMatch(1);
	});
	
	$('#minuteSelector').on("change mousemove", function() {
		var minute = $(this).val();
		if(minute !== oldMinute){
			visualizeOneMatch(minute);
			oldMinute = minute;
		}
	});
	
});

$(window).on('resize',function(){
	generatePitch();
})

function pressPlay(){
	(function myLoop (i) {          
   		setTimeout(function () {  
   			i++; 
     		$('#minuteSelector').val(i);
     		visualizeOneMatch(i);
      		if (i<90) myLoop(i);      //  decrement i and call myLoop again if i > 0
   		}, 100)
	})(1);   
}

function visualizeOneMatch(currentMinute){
	goalsByMatch = "";
	var flatMatchArray = [];
	_.each(generateMatchesPerDay(),function(i){
		_.each(i,function(j){
			flatMatchArray.push(j);
		})
	})
	pitchContainer = d3.select('.shotsContainer').append('div').attr('class','pitchContainer');
  	generatePitch();
	
	d3.selectAll('.shot')
		.transition()
		.duration(transitionSpeed)
		.attr('r',0)
		.remove()
	$('.details').html('');
	
	//Get goals by minute
	function getGoalsByMinute(){
		currentMinuteGoals = [];
		currentMinuteGoals = _.select(data, function(shot){ return shot.MINUTE === currentMinute;});
		$('h1#title').html('Minute-by-minute mapping of all goals and shots at the 2014 World Cup: <span>' + currentMinute + '\'</span>' )
		_.each(currentMinuteGoals, populateGoals);
	}

	//Get goals by Country
	function getGoalsByCountry(){
		var country = hashValue;
		country = country.charAt(0).toUpperCase() + country.substring(1);
		shotsPerCountry = _.where(data, {TEAM: country});
		$('h1#title').html('All of '+ country + '\'s goals and shots at the 2014 World Cup mapped: click on the dots for more info')
		_.each(shotsPerCountry, populateGoals);
	}

	function getGoalsByMatch(){
		shotsPerMatch = _.findWhere(flatMatchArray, {id: hashValue-1});
		$('.shotsContainer .details').html();
		goalsByMatch = true;
		$('h1#title').html('Every goal and shot from '+ shotsPerMatch.teamA + '-' + shotsPerMatch.teamB + ' mapped: click on the dots for more info')
		_.each(shotsPerMatch.shots, populateGoals);
	}

	function getAllGoals(){
		var allGoals = _.where(data, {Shot: "Goal"});
		_.each(allGoals, populateGoals);
	}
	if(currentHash){
		hashProperty = currentHash.split('=')[0];

		if(hashProperty.toLowerCase() === "team"){
			hashValue = currentHash.split('=')[1];
			getGoalsByCountry();
		}else if(hashProperty.toLowerCase() === "minute"){
			hashValue = currentHash.split('=')[1];
			currentMinute = hashValue;
			getGoalsByMinute();
		}else if(hashProperty.toLowerCase() === "match"){
			hashValue = parseInt(currentHash.split('=')[1]);
			getGoalsByMatch();
		}
	}else{
		getAllGoals();
	}
	
}


function populateGoals(shot,num,list){
	var shotRadius;
	var shotCircle;
	if(pitchContainerWidth>580){
		shotRadius = 6;
	}else{
		shotRadius = 3.5;
	}
	if(shot.Shot === "Goal"){
		shotCircle = d3.select('.goals').append('circle').attr('class','goal shot')
	}else{
		shotCircle = d3.select('.shots').insert('circle').attr('class','shot')
	}
		shotCircle.attr({
		'cx' : function(){
			if(goalsByMatch){
				if(shot.TEAM === shotsPerMatch.teamA){
					return shot.X + "%"
				}else if(shot.TEAM === shotsPerMatch.teamB){
					return (100-shot.X) + "%"
				}
			}else{
				return scaleX(shot.X) + "%"
			}
		},
		'cy' : function(){
			if(goalsByMatch){
				if(shot.TEAM === shotsPerMatch.teamA){
					return (100-shot.Y) + "%"
				}else if(shot.TEAM === shotsPerMatch.teamB){
					return shot.Y + "%"
				}
			}else{
				return (100-shot.Y) + "%"
			}
		},
		
		'r'  : 0,
		'fill': function(){
			if(shot.Shot === "Goal"){
				return "#FB8935"
			}else{
				return "rgb(255,255,255)"
			}
		},
		'stroke': function(){
			if(shot.Shot === "Goal"){
				return "#fff"
			}else{
				return "#fff"
			}
		},
		'stroke-width': function(){
			if(shot.Shot === "Goal"){
				return 2
			}else{
				return 2
			}
		},
		'data-name': num,

	})
	.transition()
	.duration(transitionSpeed)
	.attr('r',shotRadius)

	$('.shot').on('click',function(e){
		var number = $(this)[0].dataset.name;
		$('.details').css('background','#85C54B')
		$('.details').html(list[number].PLAYER + " | " + list[number].TEAM + "-" + list[number].OPPOSITION + " ("+list[number].DATE +") | " + list[number].Shot + " (" + list[number].MINUTE + "\')")
	})
}

function generatePitch(){
	if(hashProperty === "match"){
		$('.closeupView').removeClass('closeupView');
	}
	var goalWidth, middleCircleWidth, goalHeight,shotRadius, middleCirclePosition;
	pitchContainerHeight = $('.pitchContainer').outerHeight();
	pitchContainerWidth = $('.pitchContainer').outerWidth();
	middleCirclePosition = (pitchContainerWidth/2)-0.5;
	

	if(pitchContainerWidth>580){
		goalWidth = '25';
		middleCircleWidth = 20;
	}else{
		goalWidth = 25;
		middleCircleWidth = 20;
	}

	if(hashProperty!=="match"){
		goalWidth = goalWidth*1.5;
		middleCirclePosition = 0;
		middleCircleWidth = middleCircleWidth*1.5;
	}else{

	}
	goalHeight = 70;
	if(!pitch){
		pitchContainer = 
		pitch = pitchContainer.append('svg').attr({
			'class' : 'pitch',
			'width' : '100%',
			'height': pitchContainerHeight,
		})
		var pitchBackground = pitch.append('rect').attr({
			'fill' : '#85C54B',
			'width': '100%',
			'height': '100%',
			'class' : 'pitchBackground'
		});
		goalA = pitch.append('rect')
			.attr({
				'stroke':"rgba(255,255,255,0.3)",
				'stroke-width':2,
				'fill':'#85C54B',
				'width': goalWidth + "%",
				'height':goalHeight + "%",
				'x':0,
				'y': ((100-goalHeight)/2) + "%",
				'class':'goalA',
			})
		goalB = pitch.append('rect')
			.attr({
				'stroke':"rgba(255,255,255,0.3)",
				'stroke-width':2,
				'fill':'#85C54B',
				'width': goalWidth + "%",
				'height':goalHeight + "%",
				'x':100-goalWidth + "%",
				'y': ((100-goalHeight)/2) + "%"
			})
		middleLine = pitch.append('line')
			.attr({
				'x1':middleCirclePosition-0.5,
				'x2':middleCirclePosition-0.5,
				'y1':0,
				'y2':pitchContainerHeight,
				'stroke':'rgba(255,255,255,0.3)',
				'stroke-width':2
			})
		middleCircle = pitch.append('circle')
			.attr({
				'r': middleCircleWidth + "%",
				'stroke':'rgba(255,255,255,0.3)',
				'stroke-width':2,
				'fill':'#85C54B',
				'cx': middleCirclePosition,
				'cy': (pitchContainerHeight/2)-0.5
			})
		
		pitch.append('g').attr('class','shots');
		pitch.append('g').attr('class','goals');
	}else{
		pitch.attr('height', pitchContainerHeight);
		goalA.attr({
			'width': goalWidth + "%",
			'height':goalHeight + "%",
			'y': ((100-goalHeight)/2) + "%"
		}),
		goalB.attr({
			'width': goalWidth + "%",
			'height':goalHeight + "%",
			'x':100-goalWidth + "%",
			'y': ((100-goalHeight)/2) + "%"
		})
		middleLine.attr({
			'x1':middleCirclePosition-0.5,
			'x2':middleCirclePosition-0.5,
			'y2':pitchContainerHeight,
		})
		middleCircle.attr({
			'cx': middleCirclePosition-0.5,
			'cy': (pitchContainerHeight/2)-0.5,
			'r': middleCircleWidth + "%"
		})
	}
}

function generateMatchesPerDay(){
	matchesPerDay = _.groupBy(data, function(i){ return i.DATE});
	return generateMatches();
}

function generateMatches(){
	var idCounter = 0;
	var counter = 0;
	var ids = [];
	shotsPerMatch = [];
	var matchPerDay = _.each(matchesPerDay,function(i,j,m){
		shotsPerMatch[counter] = {};
		_.each(i,function(k){
			if(shotsPerMatch[counter][k.TEAM+"-"+k.OPPOSITION]){
				shotsPerMatch[counter][k.TEAM+"-"+k.OPPOSITION].shots.push(k);
			}else if(shotsPerMatch[counter][k.OPPOSITION+"-"+k.TEAM]){
				shotsPerMatch[counter][k.OPPOSITION+"-"+k.TEAM].shots.push(k);
			}else{
				shotsPerMatch[counter][k.TEAM+"-"+k.OPPOSITION] = {};
				shotsPerMatch[counter][k.TEAM+"-"+k.OPPOSITION].shots = [k];
				shotsPerMatch[counter][k.TEAM+"-"+k.OPPOSITION].id = idCounter;
				shotsPerMatch[counter][k.TEAM+"-"+k.OPPOSITION].teamA = k.TEAM;
				shotsPerMatch[counter][k.TEAM+"-"+k.OPPOSITION].teamB = k.OPPOSITION;
				idCounter++;
			}
			
		})
		counter++;
	})
	_.each(shotsPerMatch,function(d){
		_.each(d,function(i){
			ids.push([i.teamA+"-"+i.teamB,i.id+1])
			console.log(i);
		})
	})
	console.log(JSON.stringify(ids));
	return shotsPerMatch;
}

function visualizePerMatch(){
	var counter = 0;
	var matchesContainer = d3.select('.shotsContainer').attr('class','matchesContainer');
	_.each(generateMatchesPerDay(),function(day){
		_.each(day,function(match,matchName){
			counter++;
			match.id = counter;
			idList.push(matchName + ";" + counter)
			var matchContainer = matchesContainer.append('div').attr('class','match');
			var pitchContainer = matchContainer.append('svg');
			var pitch = pitchContainer.append('rect').attr('class','pitch');
			var teams = {
				'a' : {
					'name': match.teamA,
					'color': '#00bbff'
				},
				'b' : {
					'name': match.teamB,
					'color': '#ffbb00'
				}
			}
			pitch
				.attr({
					'width':'100%',
					'height':'100%'
				})
			matchContainer
				.append('p')
				.html("<span style='background:" + teams.a.color + "'>" + teams.a.name + "</span> - <span style='background:" + teams.b.color + "'>" + teams.b.name + "</span>")

			var shot = pitchContainer.selectAll('.shot')
			.data(match.shots)
			.enter()
			.append('circle')
			.attr({
				'r':4,
				'cx':function(d){
					if(d.TEAM === teams.b.name && d.X > 50){
						return d.X + "%"
					}else if(d.TEAM === teams.b.name && d.X <= 50){
						return (100 - d.X) + "%"
					} else if(d.TEAM === teams.a.name && d.X <= 50){
						return d.X + "%"
					}else if(d.TEAM === teams.a.name && d.X > 50){
						return (100 - d.X) + "%"
					}
				},
				'cy':function(d){
					if(d.TEAM === teams.b.name && d.X > 50){
						return (100-d.Y) + "%"
					}else if(d.TEAM === teams.b.name && d.X <= 50){
						return (d.Y) + "%"
					} else if(d.TEAM === teams.a.name && d.X <= 50){
						return (100-d.Y) + "%"
					}else if(d.TEAM === teams.a.name && d.X > 50){
						return d.Y + "%"
					}
				},
				'fill': function(d){
					return _.findWhere(teams, {'name':d.TEAM}).color;
				},
				'class':'shot'
			})
			

		})

	})
}

function resizePitch(){
	
}