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

var scaleX = d3.scale.linear()
	.domain([0,100])
	.range([0,pitchWidth])

var scaleY = d3.scale.linear()
	.domain([100,0])
	.range([0,pitchHeight])

$(document).ready(function(){
	if(window.location.hash){
		currentHash = window.location.hash.replace('#','');
	}
	goalsContainer = $('.shotsContainer');

	d3.json("js/shots.json", function(error, json) {
  		if (error) return console.warn(error);
  		data = json;
  		// visualizePerMatch();
  		visualizeOneMatch(1);
	});
	
	$('#minuteSelector').on("change mousemove", function() {
		var minute = parseInt($(this).val());
		if(minute !== oldMinute){
			visualizeOneMatch(minute);
			oldMinute = minute;
		}
	});
	
});

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
		$('.currentMinute span').html(currentMinute)
		_.each(currentMinuteGoals, populateGoals);
	}

	//Get goals by Country
	function getGoalsByCountry(){
		var country = hashValue;
		country = country.charAt(0).toUpperCase() + country.substring(1);
		console.log(country)
		shotsPerCountry = _.where(data, {TEAM: country});
		_.each(shotsPerCountry, populateGoals);
	}

	function getGoalsByMatch(){
		shotsPerMatch = _.findWhere(flatMatchArray, {id: hashValue});
		$('.shotsContainer .details').html(shotsPerMatch.teamA + " - " + shotsPerMatch.teamB);
		goalsByMatch = true;
		_.each(shotsPerMatch.shots, populateGoals);
	}

	function getAllGoals(){
		_.each(data, populateGoals);
	}
	hashProperty = currentHash.split('=')[0];

	if(hashProperty.toLowerCase() === "team"){
		hashValue = currentHash.split('=')[1];
		getGoalsByCountry();
	}else if(hashProperty.toLowerCase() === "minute"){
		hashValue = parseInt(currentHash.split('=')[1]);
		currentMinute = hashValue;
		getGoalsByMinute();
	}else if(hashProperty.toLowerCase() === "match"){
		hashValue = parseInt(currentHash.split('=')[1]);
		getGoalsByMatch();
	}else{
		getAllGoals();
	}
	
}


function populateGoals(shot,num,list){
	d3.select('.shots').append('circle').attr({
		'class': 'shot',
		'cx' : function(){
			if(goalsByMatch){
				return shot.X + "%"
			}else{
				return shot.X + "%"
			}
		},
		'cy' : (100-shot.Y) + "%",
		'r'  : 0,
		'fill': function(){
			if(shot.Shot === "Goal"){
				return "#ffbb00"
			}else{
				return "rgba(255,255,255,0.2)"
			}
		},
		'data-name': num,
	})
	.transition()
	.duration(transitionSpeed)
	.attr('r',8)

	// d3.select('.details').append('li').html(shot.PLAYER + " | " + shot.TEAM + " - " + shot.OPPOSITION);
	$('.shot').on('click',function(e){
		var number = $(this)[0].dataset.name;
		$('.details').html(list[number].PLAYER + " | " + list[number].TEAM + " - " + list[number].OPPOSITION + " (" + list[number].Shot + " in minute " + list[number].MINUTE + ")")
	})
}

function generatePitch(){
	if(!pitch){
		pitch = d3.select('.shotsContainer').append('svg').attr({
			'class' : 'pitch',
			'width' : pitchWidth,
			'height': pitchHeight,
		})
		var pitchBackground = pitch.append('rect').attr({
			'fill' : '#111',
			'width': '100%',
			'height': '100%',
			'class' : 'pitchBackground'
		});
		var goalA = pitch.append('rect')
			.attr({
				'stroke':"#fff",
				'stroke-width':1,
				'width': 80,
				'height':140,
				'x':-0.5,
				'y':(pitchHeight/2)-70.5
			})
		var goalB = pitch.append('rect')
			.attr({
				'stroke':"#fff",
				'stroke-width':1,
				'width': 80,
				'height':140,
				'x':pitchWidth-79.5,
				'y':(pitchHeight/2)-70.5
			})

		var middleLine = pitch.append('line')
			.attr({
				'x1':(pitchWidth/2)-0.5,
				'x2':(pitchWidth/2)-0.5,
				'y1':0,
				'y2':pitchHeight,
				'stroke':'#fff'
			})
		var middleCircle = pitch.append('circle')
			.attr({
				'r': 100,
				'stroke': '#fff',
				'cx': (pitchWidth/2)-0.5,
				'cy': (pitchHeight/2)-0.5
			})
		
		pitch.append('g').attr('class','shots')
	}
}

function generateMatchesPerDay(){
	matchesPerDay = _.groupBy(data, function(i){ return i.DATE});
	return generateMatches();
}

function generateMatches(){
	var idCounter = 0;
	var counter = 0;
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
			shot.on('click',function(d){
				console.log(JSON.stringify(d));
			})

		})

	})
// $('.shot').on('click',function(d){
// 				console.log(d3.select(this))
// 			})
}