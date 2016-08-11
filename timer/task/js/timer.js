// timer.js
//
// timer countdown and modals associated with timer functionality
//

// activityTimer = 1680; -- no activity ... session will logout after 30min... set to warn at 28min (as seconds)
//                       -- clicking okay will reset the counter
//                       -- the server timer is not reset every 30 mins, the user is logged out
//                       -- 28min * 60sec = 1680 seconds
// sessionTimer = 18000; -- time available in the user session
//                       -- set to warn at 1min (1min * 60sec = 60 seconds)
//                       -- the server session timer will expire at 0, so warn them with a minute to spare
//                       -- that is the ONLY warning (as of 6/24/2013)
//                       -- on any server interaction after the sessionTimer expires, the user is logged out
//                       -- 5hr * 60 min * 60 sec = 18000 seconds
// testTimer = 7200;     -- time available for the user to self-test
//                       -- this timer is displayed to the user
//                       -- if/when this timer reaches zero, it should start to count up
//                       -- 2hr * 60min * 60sec = 7200 seconds
//

testTimer = typeof(testTimer) == 'undefined' ? 7200 : testTimer;
sessionTimer = typeof(sessionTimer) == 'undefined' ? 7200 : sessionTimer;

var baseText = "Time Remaining = ";
var baseExpired = "Over Time by ";


		 
		 
$(function(){

	var timer = setInterval(function(){

		activityTimer--;
		sessionTimer--;
		testTimer--;
		
		// how much test time remains?
		if( testTimer > 0 ) {
			// time still counting down
			$('#wrap-timer').html( baseText + sec2hhmmss(testTimer) );
		} else if( testTimer == 0 ){
			$('#wrap-timer').html( '<span class="exp">Time Expired</span>');
		} else {
			if( testTimer < 0 ) {
				// timer is now counting up
				$('#wrap-timer').html( '<span class="exp">' + baseExpired + sec2hhmmss(Math.abs(testTimer)) + '</span>');
			}
		}

		// how much activity remains?
		// only warn them at 0
		if( activityTimer == 0 ) {
			activityWarn();
		}

		// on every page load, if the session time is less than 30 min
		// warn the user and give them the time remaining
		if( sessionTimer < 60 ) {
			var sessionWarned = getCookie('sessionWarn');
			if( sessionWarned != "warned" ) {
				sessionEnds(sessionTimer);
				setCookie('sessionWarn','warned');
			}
		}

	}, 1000);

}); // end: document.ready

function sec2hhmmss(s) {
	var h = Math.floor(s/3600); //Get whole hours
	    s -= h*3600;
	var m = Math.floor(s/60); //Get remaining minutes
	    s -= m*60;
	return h+":"+(m < 10 ? '0'+m : m)+":"+(s < 10 ? '0'+s : s); //zero padding on minutes and seconds
} // end sec2hhmmss

function activityWarn() {
	
	if(cr && testComplete != '1'){ //current question is a constructed response and the test is not in review mode
		location.reload();
	} else {
		alert('Do something in 2 minutes or your session will expire');
		location.reload();
	}
	
} // end activityWarn

function sessionEnds(time) {
	if( time < 0 ) {  time = 0; }
	// alert('Your session will end in ' + sec2hhmmss(time) );
	alert('Your session will end in 30 minutes' );
} // end sessionEnds