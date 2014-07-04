var data;
var goalsContainer;
var pitch;
var pitchWidth = 800;
var pitchHeight = 400;
var oldMinute = 1;
var transitionSpeed = 200;

var scaleX = d3.scale.linear()
	.domain([0,100])
	.range([0,pitchWidth])

var scaleY = d3.scale.linear()
	.domain([100,0])
	.range([0,pitchHeight])

$(document).ready(function(){
	generatePitch();
	goalsContainer = $('.shotsContainer');

	d3.json("js/shots.json", function(error, json) {
  		if (error) return console.warn(error);
  		data = json;
  		visualizeData(1);
	});
	
	$('#minuteSelector').on("change mousemove", function() {
		var minute = parseInt($(this).val());
		if(minute !== oldMinute){
			visualizeData(minute);
			oldMinute = minute;
		}
		
	});

	
	
	
});

function visualizeData(currentMinute){
	d3.selectAll('.shot')
		.transition()
		.duration(transitionSpeed)
		.attr('r',0)
		.remove()
	$('.details').html('');
	currentMinuteGoals = [];
	currentMinuteGoals = _.select(data, function(shot){ return shot.MINUTE === currentMinute;});
	$('.currentMinute span').html(currentMinute)
	
	_.each(currentMinuteGoals, populateGoals);
}


function populateGoals(shot,num,list){
	d3.select('.shots').append('circle').attr({
		'class': 'shot',
		'cx' : scaleX(shot.X) - 5,
		'cy' : scaleY(shot.Y) - 5,
		'r'  : 0,
		'fill': function(){
			if(shot.Shot === "Goal"){
				return "#ffbb00"
			}else{
				return "#fff"
			}
		},
		'stroke-width': 4,
		'data-name': num,
		
	})
	.transition()
	.duration(transitionSpeed)
	.attr('r',8)

	// d3.select('.details').append('li').html(shot.PLAYER + " | " + shot.TEAM + " - " + shot.OPPOSITION);
	$('.shot').on('click',function(e){
		var number = $(this)[0].dataset.name;
		$('.details').html(list[number].PLAYER + " | " + list[number].TEAM + " - " + list[number].OPPOSITION)
	})
}

function generatePitch(){
	pitch = d3.select('.shotsContainer svg').attr({
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
	pitch.append('g').attr('class','shots')
}