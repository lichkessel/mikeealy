/*
Methods and properties that apply to full scope of application. Functions perform the following:
	- local storage and extraction
	- JSON conversion for local storage and extraction
	- error reporting
	- test data conversion and retrieval
*/
var url = window.location.href; // current URL
var thePage = url.substring(url.lastIndexOf("=") + 1, url.lastIndexOf(".")); // file name minus the extension. finds the "=" and pulls out substring between "=" and "."
var lastPage = getCookie('lastPage'); // file name of the previous page viewed
var answrs = (!getJsonFromStorage('answrs')) ? new Array() : getJsonFromStorage('answrs'); // holds all user response data
var qc = (!getJsonFromStorage('qc')) ? [] : getJsonFromStorage('qc'); // used for testing purposes. currently disabled. disregard
var testComplete = getCookie('testComplete'); // indicates completion of test ('1' for complete, '0' not complete)
var testCompleted = testComplete == '1';
var crMode = getCookie('crMode'); // indicates constructed response is in write mode (empty/undefined) or evaluation mode ("1") // // // // // // // // // // !!!!!!!!!!!!!!!
var timerMode = getCookie('timerMode'); // indicates whether ('1') or not ('0') the timer should be hidden or displayed
var inlineDirectionsFired1 = getCookie('inlineDirectionsFired1'); // indicates whether or not the inline item instructions have been fired
var inlineDirectionsFired2 = getCookie('inlineDirectionsFired2'); // indicates whether or not the inline item instructions have been fired
var testTitle = getCookie('testTitle'); // title of iPT. value pulled from index.html in setup.js
var introViewed = getCookie('introViewed'); // '1' user viewed all of intro content. '0' user has not
var audioViewed = getCookie('audioViewed'); // '0' means no audioSet interstitals have been viewed yet. each viewed audioSet gets added to a string and stored in this cookie
var assistiveMode = getCookie('assistiveMode'); // '1' means accessibility features are activated.
var locationPrefix = 'disp?loc='; // prefixed to each button link
var qNum = (thePage.indexOf('mc-0') == 0) ? Number(thePage.replace('mc-0', '')) : Number(thePage.replace('mc-', '')); // current user question number
var showBrowserInfo = 0; // 1=true; 0=false // no longer in use
var showModalQNum = assignModalQNum(); // assign question to have modal window displayed on load
var crTtl = function () { // return the total amount of constructed response questions
	var tally = 0;
	$.each(allQstns, function () { // allQstns array found in config.js
		for (var key in $(this)) {
			if ($(this).hasOwnProperty(key) && key == 0 && $(this)[key].type == 'constructedresponse') { // check object in allQstns has type 'constructedresponse'
				tally++;
			}
		}
	});
	return tally;
}
/*
 * = - = - = - = - = - = - = - = - = - = - = - = - = - = - = - = - = - = - = - = - = -
 */
$(document).ready(function () {
	// qc action, currently not in use. disregard
	if (qc.length > 0) {
		if (qc.length > 0) qcHandler(qc[0].sections, qc[0].migration, qc[0].modalDialog, qc[0].hideSortBy);
		var total2 = $('html').html().match(/\/1\.2\//g);
		if (total2) {
			$('body').append('<span style="position:fixed; top:50px; left:20px; border:1px solid red; padding:3px;">Page not coded to specification. Total 1.2 entries in source = ' + String(total2.length))
		}
	}
	// get browser info
	jQuery.browser = {};
	jQuery.browser.mozilla = /mozilla/.test(navigator.userAgent.toLowerCase()) && !/webkit    /.test(navigator.userAgent.toLowerCase());
	jQuery.browser.webkit = /webkit/.test(navigator.userAgent.toLowerCase());
	jQuery.browser.opera = /opera/.test(navigator.userAgent.toLowerCase());
	jQuery.browser.msie = /msie/.test(navigator.userAgent.toLowerCase());
	var IE78BrowserMode = ($.browser.msie && ($.browser.version == 7.0 || $.browser.version == 8.0)); // is it IE7 or IE8?
	var IE78DocumentMode = ($.browser.msie && document.documentMode && (document.documentMode == 7 || document.documentMode == 8));
	var unsupportedIe = (IE78BrowserMode || IE78DocumentMode); // we do not support IE8 and below
	if (showBrowserInfo) { // show browser info. used for testing purposes. currently disabled, disregard
		$('body').append('<div id="browserInfo" style="clear:both;width:900px;text-align:right;margin:0 auto;padding:5em 0 2em 0;font-size:10px;color:#ddd;"></div>');
		if ($.browser.msie) {
			$('#browserInfo').append('<p>version: ' + getIEVersion() + '<br />compatibility mode: ' + unsupportedIe + '</p>');
		}
		$('#browserInfo').append('<p>' + navigator.userAgent + '</p>');
	} // end: showBrowserInfo
	if (unsupportedIe) { // sniff IE8 and below
		$('#wrap-outer').hide(); // hide the ui
		$('footer').hide(); // hide the ui
		$('#browserInfo').hide(); // hide the ui
		// unsupported browser message appears in modal dialog
		$('body').append('<div id="dialog-modal" title="Sorry, your browser is not supported!"><p>The browser you are currently using, Internet Explorer 8 or below, does not support the functionality of the Interactive Practice Test. We recommend you upgrade to one of the supported browsers:</p><ul><li><a href="https:// www.google.com/intl/en/chrome/browser/" target="_blank">Chrome</a></li><li><a href="http:// www.mozilla.org/en-US/firefox/new/" target="_blank">Firefox</a></li><li><a href="http:// www.apple.com/safari/" target="_blank">Safari</a></li><li><a href="http:// windows.microsoft.com/en-us/internet-explorer/download-ie" target="_blank">Internet Explorer 9+ (non-compatibility mode)</a></li></ul></div>');
		$('#dialog-modal').dialog({ // invoke dialog with unsupported browser message
			height: 250,
			width: 580,
			draggable: false,
			modal: true,
			closeOnEscape: false,
			position: ['center', 150],
			close: function (event, ui) {
				$('#dialog-modal').remove();
			}
		});
	}
	try {
		var md = 0; // total modal dialogs in config.js
		for (var key in modalDialog) { // all modal dialogs are defined in var modalDialog found in config.js
			md++;
			if (modalDialog.hasOwnProperty(key)) {
				modalDialog[key].fired = getCookie('dialog' + String(md)); // verify what dialogs have been fired based whats stored as a cookie
			}
		}
	} catch (error) {
	};
	// sections are defined in config.js
	// they divide the iPT into two parts
	// a dialog appears once before each section
	// answers are organized by section answers.html
	try {
		for (var i = 0; i < sections.length; i++) {
			sections[i].dialog.fired = getCookie('sectionDialog' + String(i + 1)); // verify if section dialog has been fired
		}
	} catch (error) {
	};
	if (!$('#contents').children('div').eq(1).hasClass('test-banner')) globalHacks('addTestTitle'); // the index page and exit page are the only ones with div '.test-banner'. test title does not get inserted on those pages.
	globalHacks('addCopyright'); // copyright gets inserted on every page with globalhacks()
	setCookie('lastPage', thePage + '.html'); // file name of previous page viewed gets stored here as cookie
	if (timerMode == '0') { // hide timer if timerMode cookie says so ('0')
		$('#btn-timer').text('Show Timer');
		$('#wrap-timer').hide();
	}
	if (testComplete == '1') { // test is in review mode
		$('#btn-timer').hide(); // no timer in review mode
		$('#wrap-timer').hide(); // no timer in review mode
		$('body').addClass('completed'); // apply review mode styles with 'completed' class
	} else {
		$('body').removeClass('completed'); // test is in write mode
	}
	$('#btn-timer').click(function (e) { // toggle timer visibility
		e.preventDefault();
		if (timerMode == '0') { // timer currently hidden
			$('#wrap-timer').show(); // display timer
			$('#btn-timer').text('Hide Timer'); // change link text
			timerMode = '1'; // '1' means timer is on display
			setCookie('timerMode', '1'); // other pages need to know timer should be visible
		} else {
			$('#wrap-timer').hide();
			$('#btn-timer').text('Show Timer');
			timerMode = '0';
			setCookie('timerMode', '0');
		}
		$('#btn-timer').append('<span class="icon icon-timer"></span>'); // <span class="icon icon-timer"> applies proper button dimensions. when we changed the text, we need to re-insert the <span>
	});
	// spans for button icons
	$('#btn-timer').append('<span class="icon icon-timer"></span>');
	$('#btn-directions').append('<span class="icon icon-timer"></span>');
	$('#btn-transcript').append('<span class="icon icon-timer"></span>');
	$('#btn-help').append('<span class="icon icon-help"></span>');
	$('#btn-print').append('<span class="icon icon-print"></span>');
	$('#btn-prev').prepend('<span class="icon icon-arrow-left-grey"></span>');
	$('#btn-back').prepend('<span class="icon icon-arrow-left"></span>');
	$('#btn-back-score').prepend('<span class="icon icon-arrow-left-grey"></span>');
	$('#btn-return').prepend('<span class="icon icon-arrow-left"></span>');
	$('#btn-next').append('<span class="icon icon-arrow-right-grey"></span>');
	$('#btn-start').append('<span class="icon icon-arrow-right"></span>');
	$('#btn-skip').append('<span class="icon icon-arrow-right"></span>');
	$('#btn-review').append('<span class="icon icon-arrow-up"></span>');
	$('#btn-continue').append('<span class="icon icon-arrow-right"></span>');
	$('#btn-review-demo').append('<span class="icon icon-arrow-up"></span>');
	$('#btn-exit').append('<span class="icon icon-exit"></span>');
	$('#btn-finish').prepend('<span class="icon icon-finish"></span>');
	$('#btn-scores').prepend('<span class="icon icon-scores"></span>');
	$('#btn-answers').prepend('<span class="icon icon-answers"></span>');
	$('#btn-evaluate-cr').prepend('<span class="icon icon-finish"></span>');
	$('#btn-evaluate-cr').prepend('<span class="icon icon-finish"></span>');
	$('.btn-audio').prepend('<span class="loading"><img src="/rsc/1.2/common/img/loading.gif" alt="loading" height="16" width="16" /></span>Loading');
	// spans for button iconsbrea
}); // end ready
$(window).load(function () {
	$('#btn-assistive').click(function (e) { // button has visibility:hidden. available for those using assistive technology
		assistiveMode = '1'; // '1' means activated
		setCookie('assistiveMode', '1'); // store in cookie for future reference
		alert('Thank you for confirming. The test is now in assistive mode.');
		window.location.href = locationPrefix + 'intro-1.html';
	});
	if (assistiveMode == '1') {
		var nav = '<nav id="nav-page" role="navigation">' + $('nav').html() + '</nav>'; // capture main navigation code on footer
		$('nav').remove(); // remove footer nav from dom
		$('#contents').prepend(nav); // insert navigation into top of page. best practice for accessibility purposes
	}
	// keep footer fixed when div#question height pushes it beneath the fold
	// reduce scale of footer based on width of browser
	// keep footer fixed when div#question height pushes it beneath the fold
	// reduce scale of footer based on width of browser
	// DISABLED, NOT IN USE.
	function windowResizeHandler() {
		var scaleBase = 765;
		var scale = String(window.innerWidth / scaleBase);
		if (window.innerWidth > 400) {
			if (window.innerWidth < scaleBase) {
				$('footer').css('transform', 'scale(' + scale + ',' + scale + ')');
				$('footer').css('-webkit-transform', 'scale(' + scale + ',' + scale + ')');
				$('footer').css('-ms-transform:', 'scale(' + scale + ',' + scale + ')');
			} else {
				$('footer').css('transform', 'scale(1,1)');
				$('footer').css('-webkit-transform', 'scale(1,1)');
				$('footer').css('-ms-transform:', 'scale(1,1)');
			}
		}
		if (window.innerHeight < ($('#wrap-outer').height() + $('footer').height())) {
			$('footer').addClass('footer-fixed');
			if (!$('nav').html().match('scroll-buttons')) {
				$('nav').append('<div id="scroll-buttons"><ul><li id="wrap-scroll-up"><button class="btn btn-yel" id="btn-scroll-up"><span class="icon icon-scroll-up"></span></button></li><li id="wrap-scroll-down"><button class="btn btn-yel" id="btn-scroll-down"><span class="icon icon-scroll-down"></span></button></li></ul></div>');
				$('#btn-scroll-down').on('click', function () {
					$('html, body').animate({ scrollTop: $('#wrap-outer').height() }, 800);
				});
				$('#btn-scroll-up').on('click', function () {
					$('html, body').animate({ scrollTop: '0px' }, 800);
				});
			}
		}
		else if ($('footer').hasClass('footer-fixed')) {
			$('footer').removeClass('footer-fixed');
			if ($('nav').html().match('scroll-buttons')) {
				$('#scroll-buttons').remove();
			}
		}
	}
});
function getIEVersion() { // return value of IE version
	var rv = -1; // Return value assumes failure.
	if (navigator.appName == 'Microsoft Internet Explorer') {
		var ua = navigator.userAgent;
		var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
		if (re.test(ua) != null)
			rv = parseFloat(RegExp.$1);
	}
	return rv;
} // end getIEVersion()
function globalHacks(hack) { // various functions that aren't exactly best practice
	switch (hack) { // need to convert array index to letters value...
		case 'addTestTitle': // insert test title into top of layout
			$('#contents').prepend('<p id="test-title" aria-hidden="true">' + testTitle + '</p>');
			$('#question h2').attr('tabindex', '0');
			try {
				var testSections = sections; // sections variable may or may not exist in config.js
				$('#test-title').addClass('test-title-one-line'); // make sure test title doesnt wrap with this class
				if (thePage.match('mc')) { // this is a question file
					var section2Start = parseInt(sections[1].range.split('-')[0]); // start of section range
					var index = (qNum < section2Start || !qNum) ? 0 : 1; // question number is less than the first question of section 2 qNum is NaN )
					$('#test-title').append(' ' + sections[index].title); // insert section title after test title
				}
			} catch (error) {
				// no sections entered
			};
			break;
		case 'addCopyright': // append copyright to the footer of each page
			var today = new Date();
			$('footer').append('<div id="cya"><p>Copyright <span aria-hidden="true">&copy;</span>' + today.getFullYear() + ' by Educational Testing Service. All rights reserved. All trademarks are the property of their respective owners.</p></div>');
			break;
		default:
			// default
	}
} // end globalHacks
// hasMathJax
// Returns true if has MathJax object and <math> tag is found
//
function hasMathJax() {
	if (typeof(MathJax) == "object") { // if MathJax library loaded
		var $mathjax = $('math'); // look for <math> tag
		if ($mathjax.length > 0) // if MathML on page
			return true;
	}
	return false;
}
// getCookie
// taken from w3 with minor modifications http:// www.w3schools.com/js/js_cookies.asp
// 
function getCookie(c_name) {
	var i, x, y, ARRcookies = document.cookie.split(';');
	for (i = 0; i < ARRcookies.length; i++) {
		x = ARRcookies[i].substr(0, ARRcookies[i].indexOf('='));
		y = ARRcookies[i].substr(ARRcookies[i].indexOf('=') + 1);
		x = x.replace(/^\s+|\s+$/g, '');
		if (x == c_name) {
			return unescape(y);
		}
	}
} // getCookie
// setCookie
// taken from w3 with minor modifications http://www.w3schools.com/js/js_cookies.asp
// leaving 'exdays' empty creates a session cookie
// 
function setCookie(c_name, value, exdays) {
	var exdate = new Date();
	exdate.setDate(exdate.getDate() + exdays);
	var c_value = escape(value) + ((exdays == null) ? '' : '; expires=' + exdate.toUTCString());
	document.cookie = c_name + '=' + c_value;
}
// convert json to string and put in local storage
function sendJsonToStorage(obj, name) {
	var extract = JSON.stringify(obj, null, '\t'); // convert object to string
	try {
		localStorage.setItem(name, extract); // save data in local storage
	} catch (error) {
	};
}
// sendJsonToStorage
// format string from localeStorage so it can be interpreted as an object
// 
function getJsonFromStorage(name) {
	var compile;
	try {
		compile = JSON.parse(localStorage.getItem(name)); // convert string back to json
	} catch (error) {
		compile = false;
	};
	return compile;
}
// getJsonFromStorage
// tryCatch
function tryCatch(func) {
	var test = false;
	try {
		func
	} catch (err) {
		test = true;
	}
	return test;
}
// tryCatch
// debug
function debug(label, obj) { // console.log can break IE. invoking it through a try/catch fixes that
	try {
		console.log(label + ' = ' + obj);
	} catch (err) {
	}
}
// debug
/*getUserSelections
 - handle user selections stored in answrs array:
 - convert numbers to letters ... 0:A / 1:B / 2:C / 3:D
*/
function getUserSelections(arr) {
	function isNumber(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	}
	var selectedAnswer = new Array();
	var userSelections = new Array();
	for (var i = 0; i < arr.length; i++) { // apply the following to all answered questions
		selectedAnswer = []; // empty selectedAnswer array
		if (arr[i].type == 'single' || arr[i].type == 'multi' || arr[i].type == 'dragdrop' || arr[i].type == 'dragdropinline' || arr[i].type == 'blankselect' || arr[i].type == 'inline' || arr[i].type == 'grid') { // for non constructed response questions... ones that have ABCD as an answer
			for (var j = 0; j < arr[i].selected.length; j++) { // loop through all selected answers for a particular question and store them in selectedAnswer array
				selectedAnswer.push(returnLetter(arr[i].selected[j])); // convert to letters
			}
		}
		else if (arr[i].type == 'constructedresponse') { // constructed response answers are stored in cr json object with 'response' key
			selectedAnswer.push(arr[i].cr[0].response);
		}
		else {
			selectedAnswer.push(arr[i].selected); // store other response types as entered by the user (textentry in particular)
		}
		userSelections.push(selectedAnswer); // insert the the answer after it is handled
	}
	return userSelections;
}
/*getUserResults
 - get results of the entire test
 - assign correct, incorrect, and omitted values to each question
 - returns JSON that provides all relevant data associated with each question, whether the user answered a question or not
 - handles scenarios when multiple answers are acceptable (evalMultipleValues())
 - handles when multiple answers are required (evalMultipleKeys())
 - handles fractions -- numerator, denominator and factors of both (evalFraction())
*/
function getUserResults(arr, target) {
	var completeAnswerData = new Array();
	function isNumber(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	}
	for (var i = 0; i < allQstns.length; i++) { // loop through each question on the test, answered and unanswered
		var qId = (target != null) ? '#' + target + String(i + 1) : '#' + String(i + 1)// generate question ID
		var userAnswer = new String; // the answer selected by the user
		var correctAnswer = allQstns[i].correct; // the correct answer
		var category = allQstns[i].category;
		var subCategory = allQstns[i].subcategory;
		var qType = allQstns[i].type; // the item type
		for (var j = 0; j < arr.length; j++) { // loop through all the recorded test data (typically answrs array)
			// data is typically not stored sequentially (answrs array stores chronologically). this function needs to return the data in correct sequence
			if (arr[j].id == (i + 1)) { // find the answer in proper sequence by matching index and id
				userAnswer = getUserSelections(arr)[j]; // capture the user data in the proper format
			}
		}
		completeAnswerData.push({ 'id': qId, 'type': qType, 'category': category, 'subCategory': subCategory }); // insert initially user response object with all relevant data needed to calculate / render results
		if (userAnswer != '') {
			var uniqProp, versionIssueQ;
			try {
				uniqProp = uniqueProperty; // check to see if there is a unique property assigned to this test (if exists, var uniqueProperty found in config.js)
				for (var j = 0; j < uniqProp.length; j++) { // loop through unique property array
					if ((typeof (uniqProp[j]) == 'object')) { // looking for an object
						var firstKey = Object.keys(uniqueProperty[j])[0]; // object first key
						if (firstKey == 'versionScoringIssues') { // if matched, versionScoringIssues indicates there is a discrepancy in scoring between v1 and v1.2 item types on tests that utilize both engines
							$.each(uniqueProperty[j].versionScoringIssues, function (index) { // versionScoringIssues array contains questions that need special treatment for scoring conflicts
								if (uniqueProperty[j].versionScoringIssues[index].q == i + 1) { // current user response iteration matches versionScoringIssues question id number
									versionIssueQ = uniqueProperty[j].versionScoringIssues[index]; // capture scoring issue data
								}
							});
						}
					}
				}
			} catch (err) {
				// do nothing
			}
			if (qType != 'constructedresponse' && (qType != '' || qType != null)) { // verify the answer box we intend to modify doesn't represent a CR question
				for (var j = 0; j < userAnswer[0].length; j++) { // any user respnonses that remain as numbers need to converted to strings for evaluation
					if (isNumber(userAnswer[0][j])) { // is this a number?
						userAnswer[0][j] = String(Number(userAnswer[0][j])); // convert to string
					}
				}
				if (versionIssueQ && i + 1 == versionIssueQ.q) { // current question number equals question number of versionIssueQ
					var str = []; // not sure why I called this str, my bad
					if (versionIssueQ.type == 'grid') { // grid response types need special treatment when both v1 and v1.2/1.3 engines are in use on same iPT
						$.each(userAnswer, function (index) { // v1.2/v1.3 grid answers need to be letters. v1 needs to be numbers (as a string)
							str.push(userAnswer[index].charCodeAt(0) - 65); // find number equivalent to letter for v1 evaluation
						});
					}
					else if (versionIssueQ.type == 'dragdropselect') { // also know as 'blankselect' on v1.2/v1.3. user selects answers that 'fill in the blank' in a paragraph
						userAnswer = String(userAnswer).split(',');// this needs to go. leave alone for now.
						$.each(userAnswer, function (index) {
							str.push(returnLetter(userAnswer[index])); // convert answer for this reponse type to letter for v1.2/v1.3 evaluation
						});
					}
					userAnswer = String(str);
				}
				if (userAnswer == correctAnswer && correctAnswer.indexOf('/') == -1 && correctAnswer.indexOf('{') == -1) { // correct answer, not a fraction and does not support multiple answers (just one answer is allowed)
					completeAnswerData[i].answer = 'correct';
				}
				else if (correctAnswer.indexOf('/') != -1 && correctAnswer.indexOf('{') == -1 && evalFraction(userAnswer[0][0], userAnswer[0][1], i)) { // answer is a fraction, only one answer is allowed, and evalFraction() returns true
					completeAnswerData[i].answer = 'correct';
				}
				else if (correctAnswer.indexOf('/') == -1 && correctAnswer.indexOf('{') != -1) { // answer is not a fraction and more than one answer is allowed
					if (evalMultipleKeys(userAnswer, correctAnswer) && qType == 'textentry') { // textentry and answer with mulitple text fields returns correct
						completeAnswerData[i].answer = 'correct';
					}
					else if (evalMultipleValues(userAnswer, correctAnswer).correct && qType == ('dragdrop' || 'dragdropinline')) { // is a drag and drop and answer with multiple answer combinations within drop zones returns correct
						completeAnswerData[i].answer = 'correct';
					}
					else {
						completeAnswerData[i].answer = 'incorrect';
					}
				}
				else if (userAnswer != correctAnswer) { // not a constructed response. represents all other answer scenarios and doesn't match correct
					completeAnswerData[i].answer = 'incorrect';
				}
			}
			else if (qType == 'constructedresponse') {
				completeAnswerData[i].answer = 'cr'; // constructed respone question result stored as 'cr'
			}
		} else {
			completeAnswerData[i].answer = 'omitted'; // unanswered questions stored as 'omitted'
		}
	}
	return completeAnswerData;
}
// getUserResults
function evalFraction(userNumerator, userDenominator, index) { // evaluate factored fraction
	var fraction = allQstns[index].correct.split('/'); // fractions entered with '/' in config.js allQstns (ex. 1/2)
	var keyNumerator = parseInt(fraction[0]); // [0] always numerator
	var keyDenominator = parseInt(fraction[1]); // [1] always denominator
	return (keyNumerator * userDenominator == keyDenominator * userNumerator) ? true : false;
}
function evalMultipleKeys(userAnswer, correctAnswer) { // multiple answers required by user that need to be evaluated against multiple valid correct answers
	var found = new Array(),
		rxp = /{([^}]+)}/g,
		curMatch;
	while (curMatch = rxp.exec(correctAnswer)) {
		found.push(curMatch[1]);
	}
	for (var i = 0; i < found.length; i++) {
		if (found[i] == String(userAnswer)) {
			return true;
		}
	}
	return false;
}
function evalMultipleValues(userAnswerArr, correctAnswer) { // multiple answer combinations. evaluate them in any order and return if correct
	var evalCorrect = true; // all user supplied answer values are correct)
	var evalArray = new Array(); // used to show correctness of each individual answer
	var correctAnswerArr = correctAnswer.replace(/{/g, '').replace(/}/g, '').replace(/,/g, ''); // combinations grouped by curly brackets and comma separated in config.js. remove brackets and replace commas with spaces
	// 'correctAnswerArr' bad name for this variable. needs to be changed, not an array. leave along for now.
	var groups = new Array(); // holds all all answer combinations
	var group = new Array(); // holds indivdual combination and lives inside groups array
	var tally = 0;
	for (var i = 0; i < correctAnswerArr.length; i++) { // loop through correct answer string
		group.push(correctAnswerArr.charAt(i)); // insert correct answer into group
		tally++;
		if (tally == 2) { // only groups of 2 allowed
			groups.push(group); // push group into container array 'groups'
			group = []; // empty group now that exists in groups
			tally = 0; // zero out tally for next group
		}
	}
	for (var i = 0; i < groups.length; i++) {
		if ($.inArray(userAnswerArr[i], groups[i]) != -1) { // see if the users answer exists anywhere in 'groups'
			evalArray.push(true) // user's answer matches one of the 'groups' values
		} else {
			evalArray.push(false) // user's answer doesn't match any of the 'groups' values
			evalCorrect = false; // if any of the answers do not match, the answer is wrong
		}
	}
	return { answers: evalArray, correct: evalCorrect };
}
function returnLetter(num) { // if passed 'X' returns 'X' otherwise returns A, B, C, etc. for numbers 0, 1, 2, etc.
	return num == 'X' ? 'X' : String.fromCharCode(65 + parseInt(num));
}
function getTextWidth(text) { // return width of word or character
	var html_org = text.html();
	var html_calc = '<span>' + html_org + '</span>';
	text.html(html_calc);
	var width = text.find('span:first').width();
	return width
}
function getTextHeight(text) { // return hieght of word or character
	var html_org = text.html();
	var html_calc = '<span>' + html_org + '</span>';
	text.html(html_calc);
	var height = text.find('span:first').height();
	return height
}
function crsAnswered() { // return the amount of constructed response questions that have an answer value
	var ttlCrsAnswered = new Array();
	for (var j = 0; j < answrs.length; j++) { // loop through all the recorded test data
		if (answrs[j].type == 'constructedresponse' && (answrs[j].cr[0].response != '' && answrs[j].cr[0].response != undefined)) {
			ttlCrsAnswered.push(answrs[j]);
		}
	}
	return ttlCrsAnswered;
}
function createPopup(path, w, h) {
	window.open(locationPrefix + path, '', 'width=' + w + ',height=' + h + '');
	return false;
}
// keep modal dialog centered and scaled based on browser window width. jqueryUI does not support this in its dialog api.
function positionModalDialog() {
	var center = String((window.innerWidth - $('#dialog-modal').width()) / 2) + 'px';
	if (window.innerWidth < 800) {
		$('#dialog-modal').parent().css('width', String(window.innerWidth - 65) + 'px');
		$('#dialog-modal').parent().css('left', '40px');
	} else {
		$('#dialog-modal').parent().css('left', center);
		$('#dialog-modal').parent().css('width', '800px');
	}
}
function createTwoColumnLayout() { // convert single column layouts two column
	$('#question').css('padding', '20px 10px');
	if ($(".jqQuestions").length > 0) {
		$('.jqQuestions').addClass('passage-divider');
	} else {
		$('#contents').addClass('passage-divider');
	}
	$('#basic-instruction').width(400);
	/* changing padding #question effects rationale (it overalps the border). rationale needs new container to keep it within the frame */
	$('#rationale').wrap('<div id="rationale-container" />'); // add container
	if ($('#question').hasClass('left-col-scaled')) { // adjusts layout so passage lines do not wrap and left column is wider than the right
		$('#basic-instruction').addClass('basic-instruction-width-scaled');
		$('.passage-left,.passage-right').addClass('line-num-font-size');
		$('.passage-left').addClass('passage-left-width-scaled');
		$('.passage-right').addClass('passage-right-width-scaled');
		$('.title').addClass('title-margin-scaled');
		$('.passage-divider').addClass('passage-divider-scaled');
	}
}
function assignModalQNum() {
	switch (vjb) {
		case '24105': return 1;
	}
	return undefined;
}
/* includePassage tweaks the #question css to allow a passage and a question to sit side-by-side */
jQuery.fn.includePassage = function () {
	createTwoColumnLayout();
} // end: includePassage
/* addLineNumsBr creates reading passages with line numbers based on a passage with line breaks already hardcoded the styles for the created line wrappers are in common.css */
jQuery.fn.addLineNumsBr = function () {
	createTwoColumnLayout();
	lineIndex = 1;
	$('p', this).not('.attribution').each(function () {
		var $p = $(this);
		var origText = $(this).html(); // as html() to preserve the spans
		$p.empty();
		var spans = [],
			lineStart = true,
			wordsInLine = 1;
		$.each(origText.match(/(?:(?!<br \/>).)*/g), function () {
			var line = this;
			line = $.trim(line.replace(/<br>/g, ''));
			if (line.length > 1) {
				var $span = $('<span>' + line + '</span>');
				spans.push($span);
			}
		});
		for (var ii = 0; ii < spans.length; ii++) {
			newLine(lineIndex, $p, 'line-text' + (($('#question').hasClass('left-col-scaled')) ? ' line-text-width-scaled' : '')); // check to see if the question needs a wider left column ('left-col-scaled'). If it does, apply additional class name
			$thisLine = $p.find('[data-line="' + lineIndex + '"]');
			$thisLine.append(' ' + spans[ii].html());
			lineIndex++;
		} // end for spans.length
	}); // end p-each
}; // end addLineNumsBr
/* addLineNums creates reading passages with line numbers the styles for the created line wrappers are in common.css */
jQuery.fn.addLineNums = function () {
	createTwoColumnLayout();
	var $this = $(this);
	var $passage = $this,
		$paras = $this.find('p').not('.attribution'),
		$title = $this.find('.title'),
		$attribution = $this.find('.attribution');
	$passage.empty();
	var regexTag = /<\s*(EM|I|B|STRONG)>/i;
	var lineIndex = 1; // line count that will be carried across all the paragraphs
	$paras.each(function () {
		var words = [],				// holder for all the 'words'
			text = $(this).html(),	// get the text for each paragraph
			tmp = [];
		var tmp = text.match(/<\s*(\w+\b)(?:(?!<\s*\/\s*\1\b)[\s\S])*<\s*\/\s*\1\s*>|\S+/g);
		// break the line into chunks based on spaces or tags there is a problem in web-kit when we try to guess at line numbers
		// with SPANs, EMs, and STRONG tags that have content look at each 'word' and see if there are nested words
		// (open tag + word + word + word + closetag) break them out
		$.each(tmp, function (ii, val) {
			// look at each 'val' in 'tmp' if this starts with a EM|I|B|STRONG
			if (regexTag.test(val)) {
				byspaces = val.split(' '); // break it down
				$.each(byspaces, function (x, xword) {
					// if there is a start and-or end tag replace them with <span class="text-TAGNAME"></span>
					var fixed = xword.replace(/<\/?(EM|I|STRONG|B)>/ig, "<span class=\"text-$1\"></span>")
					words.push(fixed);
				});
			} else {
				// otherwise just add it to 'words'
				words.push(val);
			}
		});
		// here we have all the 'words' in this paragraph the EM|I|STRONG|B tags have been processed into something
		// that should be good to line count in all of the browsers
		var lineStart = true,
			$wrap = $('<div class="paragraph"></div>'), // holder for the line counted paragraph
			wordsInLine = 1,
			lineHeight = 0;
		$passage.append($wrap); // add the new paragraph
		for (var ii = 0; ii < words.length; ii++) {
			var word = words[ii];
			if (lineStart) { // IF this is the first word in a paragraph we will need a container for that line
				lineStart = false; // there can be only one...
				newLine(lineIndex, $wrap, 'line-text');
			}
			$thisLine = $wrap.find('[data-line="' + lineIndex + '"]'); // the current line of counted text we're working with
			if (wordsInLine == 1) {
				$thisLine.append(word); // add the first word and set an initial lineHeight
				lineHeight = $thisLine.height();
			} else { // there are already words, so see if can cram another word in there
				var previousLine = $thisLine.html();
				$thisLine.append(' ' + word);
				if ($thisLine.height() > lineHeight) { // does the new word fit on the same visual line?
					var spanDataTag = '<span data-tag="start"';
					var isSpanTag = words[ii - 1].substr(0, 22) == spanDataTag;
					if (isSpanTag) { // if previous word was span data-tag=start
						var indx = previousLine.indexOf(spanDataTag);
						var spanTag = previousLine.substr(indx, previousLine.length - 1); // get span tag
						previousLine = previousLine.substr(0, indx - 1); // remove span data-tag=start from previous line
						words[ii] = spanTag + ' ' + words[ii]; // prepend span tag to word
					}
					$thisLine.html(previousLine);
					lineIndex++; // make a new line
					wordsInLine = 0; // TODO: zero out words in line when we create a new line
					// check to see if the question needs a wider left column ('left-col-scaled')
					// If it does, apply additional class name
					var leftColScaled = ($('#question').hasClass('left-col-scaled')) ? ' line-text-width-scaled' : '';
					newLine(lineIndex, $wrap, 'line-text' + leftColScaled);
					if (leftColScaled) // now backup one // DEBUG: why add 500px here too?
						$('.line-text').css('width', '500px');
					ii--; // backup 1 so when for-loop increments 1, you're on same word that wrapped
				} // end lineHeight check
			} // end wordsInLine
			wordsInLine++; // and just keep track of how many words we have because of reasons DEBUG: incrementing wordsInLine causing android products to crash
		} // end words.length
		// advance the line count for the start of the next paragraph
		lineIndex++;
	}); // end $paras.each() 
	$passage.append($attribution);
	// now that we've re-written the paragraphs we have to go back an put in the proper styling for EM|I|STRONG|BOLD
	var $tagsEm = $passage.find('[class="text-em"]');
	openTag = false;
	tagStart = 0;
	tagEnd = 0;
	// look at all the tags and apply the formatting we removed above emphasis
	for (var ii = 0; ii < $tagsEm.length; ii += 2) {
		var $tagStart = $tagsEm.slice((ii), (ii + 1)); // https:// api.jquery.com/slice/
		var $tagEnd = $tagsEm.slice((ii + 1), (ii + 2));
		$tagStart.attr('data-tag', 'start');
		$tagEnd.attr('data-tag', 'end');
		startLine = $tagStart.parent('.line-text').data('line')
		endLine = $tagEnd.parent('.line-text').data('line')
		wrapWithTag(startLine, endLine, 'em');
	}
}; // end addLineNums
function wrapWithTag(startLine, endLine, tagName) {
	// start and end are on the same line
	if (startLine == endLine) {
		$('span.text-' + tagName + '[data-tag="start"]').each(function () {
			// get all text nodes between the start and end tags
			var $set = $();
			var nextObj = this.nextSibling;
			while (nextObj) {
				if (!$(nextObj).is('span.text-' + tagName + '[data-tag="end"]')) {
					$set.push(nextObj);
					nextObj = nextObj.nextSibling;
				} else break;
			}
			// wrap everything with tagName
			$set.wrapAll('<' + tagName + ' />');
		});
	} else {
		// start and end are on different lines
		// highlight everything from the start tag until the end of the line
		$('span[data-line=' + startLine + '] span.text-' + tagName + '[data-tag="start"]').each(function () {
			// get all the text nodes on this line after the start tag
			var $set = $();
			var nextObj = this.nextSibling;
			while (nextObj) {
				$set.push(nextObj);
				nextObj = nextObj.nextSibling;
			}
			// wrap everything with tagName
			$set.wrapAll('<' + tagName + ' />');
		});
		// highlight everything from start of the last line until the end tag
		var nodesToWrap = $();
		// on the last line
		var lineNodes = $('span[data-line=' + endLine + '] span.text-' + tagName + '[data-tag="end"]').parent('span.line-text').contents();
		$.each(lineNodes, function () {
			// get all the text nodes before the end tags
			nodesToWrap.push(this);
			if (this.nodeType == 1 && this.tagName.toLowerCase() == "span") {
				return false;
			}
		});
		// wrap everything on the last line with tagName
		nodesToWrap.wrapAll('<' + tagName + ' />');
		// wrap any full rows in between start and end with the tag
		for (var ii = startLine + 1; ii < endLine; ii++) {
			$('span.line-text[data-line="' + ii + '"]').wrapInner('<' + tagName + ' />');
		}
	}
} // end wrapWithTag
/* newLine */
/* used by addLineNums to create the containers for the passage line numbers */
function newLine(lineIndex, para, className) {
	if (lineIndex == 4) {
		para.append('<span class="line-num">Line</span>');
	} else if (lineIndex % 5 == 0) {
		para.append('<span class="line-num">(' + lineIndex + ')</span>');
	} else {
		para.append('<span class="line-num"></span>');
	}
	para.append('<span class="' + className + '" data-line="' + lineIndex + '">');
} // end newLine
/* addPassageLinks */
/* after a passage had line numbers added, update the references to selected text */
function addPassageLinks() {
	var flaggedTests = (vjb == '23293' || vjb == '24106');
	var flaggedQs = (qNum < 50 || qNum > 53); // boolean indicating set of questions on particular test are subject for highlighting
	$('span[data-passage-ref]').each(function () {
		val = $(this).data('passage-ref');
		lineText = "line";
		startLine = $('span[data-id="' + val + '"][data-tag="start"]').parent('span.line-text').data('line');
		endLine = $('span[data-id="' + val + '"][data-tag="end"]').parent('span.line-text').data('line');
		if ($(this).data('case') == "uc") { lineText = "Line"; }
		if (startLine == endLine) {
			$(this).text(lineText + ' ' + startLine + '');
		} else {
			$(this).text(lineText + 's ' + startLine + '–' + endLine + '');
		}
		// now wrap the selected parts in a span we can highlight
		// find the starting element
		// -- the end element can be on this line (is a sibling)
		// -- or a line that follows (not a sibling)
		if (startLine == endLine) {
			// start and end are on the same line
			// wrap everything is a highlight span
			$('span[data-id="' + val + '"][data-tag="start"]').each(function () {
				var $set = $();
				var nextObj = this.nextSibling;
				while (nextObj) {
					if (!$(nextObj).is('span[data-id="' + val + '"][data-tag="end"]')) {
						$set.push(nextObj);
						nextObj = nextObj.nextSibling;
					} else break;
				}
				if (flaggedTests && flaggedQs)
					$set.wrapAll('<span class="text-highlight" />');
				else if (!flaggedTests)
					$set.wrapAll('<span class="text-highlight" />');
			});
		} else {
			// start and end are on different lines
			// highlight everything from the start tag until the end of the line
			$('span[data-id="' + val + '"][data-tag="start"]').each(function () {
				var $set = $();
				var nextObj = this.nextSibling;
				while (nextObj) {
					$set.push(nextObj);
					nextObj = nextObj.nextSibling;
				}
				if (flaggedTests && flaggedQs)
					$set.wrapAll('<span class="text-highlight" />');
				else if (!flaggedTests)
					$set.wrapAll('<span class="text-highlight" />');
			});
			// highlight everything from start of the last line until the end tag
			var nodesToWrap = $();
			var lineNodes = $('span[data-id="' + val + '"][data-tag="end"]').parent('span.line-text').contents();
			$.each(lineNodes, function () {
				nodesToWrap.push(this);
				if (this.nodeType == 1 && this.tagName.toLowerCase() == "span") {
					return false;
				}
			});
			if (flaggedTests && flaggedQs)
				nodesToWrap.wrapAll('<span class="text-highlight" />');
			else if (!flaggedTests)
				nodesToWrap.wrapAll('<span class="text-highlight" />');
			// highlight any full rows in between start and end
			for (var ii = startLine + 1; ii < endLine; ii++) {
				if (flaggedTests && flaggedQs)
					$('span.line-text[data-line="' + ii + '"]').addClass('text-highlight');
				else if (!flaggedTests)
					$('span.line-text[data-line="' + ii + '"]').addClass('text-highlight');
			}
		}
	});
} // end addPassageLinks
/*
- identifyAudioSet gets called on each next question and previous question click (or navigation from answers.html)
- this is the function that invokes interstitials
- originally interstitials were only associated with audioSets
- less QC overhead to override existing function to support interstitals NOT assoiciated with audio sets
- thats what I do, make it so that no one has to do any real testing
*/
function identifyAudioSet(newPage, newPageString) {
	try {
		if (testComplete == '1') return newPageString; // test is in review mode, stop here and return unedited newPageString
		for (var i = 0; i < audioSets.length; i++) { // loop through answrs object to see if the current question has been answered already
			var range = audioSets[i].split('-'); // turn entered audioSet string into array with start and end of audio set
			var pageNum = parseInt(newPage);
			if ((pageNum >= parseInt(range[0].replace(/^0/, ''))) && (pageNum <= parseInt(range[1].replace(/^0/, '')))) { // does the destination question number fall between start and end of audio set range?
				var setViewed = $.inArray(range[0], audioViewed.split(',')); // has this audioSet been viewed yet?
				if (setViewed == '-1') { // this audioSet hasn't been viewed yet
					newPageString = 'mc-' + range[0] + '-1.html'; // typically this points to 'mc-'+range[0]+'-1.html' this iPT starts at -2
					if (audioViewed == '0') { // we havent seen at any audioSets yet
						audioViewed = range[0]; // this will be a comma separated string of all viewed audioSets
						setCookie('audioViewed', audioViewed); // store viewed audioSets in a cookie
					} else {
						audioViewed += (',' + range[0]); // concatenate to string of all audioSets viewed
						setCookie('audioViewed', audioViewed); // store all viewed audioSets in cookie
					}
				}
			}
		}
		return newPageString; // interstitial file name
	} catch (error) {
		return newPageString; // interstitial file name as it was originally passed
	};
}
function qcHandler(sctns, mgrtn, dlg, srt) { // no longer in use, disregard / leave alone
	if (sctns == '1') {
		window.sections = [
				{ range: '1-19', title: 'SECTION TITLE 1', dialog: { h: 200, y: 170, fired: '0', instructions: 'Questions 1 - 19 on this practice test will ask you to respond to questions about this section.' } },
				{ range: '20-39', title: 'SECTION TITLE 2', dialog: { h: 200, y: 170, fired: '0', instructions: 'Questions 20 - 39 on this practice test will ask you to respond to questions about this section.' } }
		];
	}
	if (dlg == '1') {
		window.modalDialog = {
			d1: { num: 1, height: 175, width: 580, y: 150, fired: 0, content: '<div id="dialog-modal" title="Test Dialog"><p>This confirms that the modal dialog scripting is functioning properly.</p></div>' }
		}
	}
	if (srt == '1') {
		if (!uniqueProperty) window.uniqueProperty = [];
		uniqueProperty.push('single-subarea-no-sort');
	}
	if (mgrtn == '1') {
		$('body').append('<div id="migration-confirm"></div>');
		$('body').append('<span id="migration-confirm-button"></span>');
		var boxes = [
			'<span class="migration-box docs-all" id="migration-css-common">common.css</span>',
			'<span class="migration-box docs-all" id="migration-css-jquery-ui">jquery-ui.min.css</span>',
			'<span class="migration-box docs-all" id="migration-jquery-ui">jquery-ui.min.js</span>',
			'<span class="migration-box docs-all" id="migration-jquery">jquery-1.9.1.min.js</span>',
			'<span class="migration-box docs-all" id="migration-modernizr">modernizr.js</span>',
			'<span class="migration-box docs-all" id="migration-json2">json2.min.js</span>',
			'<span class="migration-box docs-all" id="migration-global">global.js</span>',
			'<span class="migration-box setup" id="migration-setup">setup.js</span>',
			'<span class="migration-box intro" id="migration-intro">intro.js</span>',
			'<span class="migration-box question" id="migration-question">question.js</span>',
			'<span class="migration-box question" id="migration-css-item">item.css</span>',
			'<span class="migration-box question" id="migration-item">item.js</span>',
			'<span class="migration-box docs-question-dragdrop-all" id="migration-jquery-mobile">jquery.mobile-1.2.0.min.js</span>',
			'<span class="migration-box docs-question-dragdrop-all" id="migration-jquery-touch-punch">jquery.ui.touch-punch.min.js</span>',
			'<span class="migration-box order-match-table" id="migration-css-order-match-table">order-match-table.css</span>',
			'<span class="migration-box order-match-table" id="migration-order-match-table">order-match-table.js</span>',
			'<span class="migration-box order-match-inline" id="migration-css-order-match-inline">order-match-inline.css</span>',
			'<span class="migration-box order-match-inline" id="migration-order-match-inline">order-match-inline.js</span>',
			'<span class="migration-box constructed-response" id="migration-css-constructed-response">constructed-response.css</span>',
			'<span class="migration-box constructed-response" id="migration-constructed-response">constructed-response.js</span>',
			'<span class="migration-box score-guide" id="migration-css-score-guide">score-guide.css</span>',
			'<span class="migration-box score-guide" id="migration-score-guide">score-guide.js</span>',
			'<span class="migration-box answers" id="migration-css-answers">answers.css</span>',
			'<span class="migration-box answers" id="migration-answers">answers.js</span>',
			'<span class="migration-box scores" id="migration-css-scores">scores.css</span>',
			'<span class="migration-box scores" id="migration-scores">scores.js</span>',
			'<span class="migration-box exit" id="migration-exit">exit.js</span>'
		];
		$.each(boxes, function (index) {
			$('#migration-confirm').append(boxes[index]);
		});
		$('#migration-global').css('background', '#42ff00');
		setTimeout(function () {
			var src = $('head').html();
			var index = src.match(/setup.js/g);
			var intro = src.match(/intro.js/g);
			var question = src.match(/question.js/g);
			var item2 = src.match(/item.js/g);
			var dragdrop = src.match(/jquery.ui.touch-punch.min.js</g);
			var orderMatchTable = src.match(/order-match-table.js/g);
			var orderMatchInline = src.match(/order-match-inline.js/g);
			var constructedResponse = src.match(/constructed-response.js/g);
			var scoreGuide = src.match(/score-guide.js/g);
			var answersPage = src.match(/answers.js/g);
			var scoresPage = src.match(/scores.js/g);
			var exitPage = src.match(/exit.js/g);
			var success = true;
			var hexDigits = new Array("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f");
			var pageTypes = [index, intro, question, dragdrop, orderMatchTable, orderMatchInline, constructedResponse, scoreGuide, answersPage, scoresPage, exitPage];
			function rgb2hex(rgb) {
				rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
				return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
			}
			function hex(x) {
				return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
			}
			function checkHex(bg) {
				var color = String(bg);
				var hex = rgb2hex(color);
				var itemTestExceptionCr = (question && constructedResponse && !item2); // constructed response are only items that point to question.js and DONT point to item.js.
				if (hex == '#ff0000' && !itemTestExceptionCr) { // crs don't pull in item.js. with question.js in head, an exeception needs to be made (itemTestExceptionCr)
					success = false;
				}
			}
			$('.docs-all').each(function (index) {
				checkHex($(this).css('background-color'));
			});
			$.each(pageTypes, function (index) {
				if (pageTypes[index]) {
					var type = String(pageTypes[index]).replace(/.js/g, '');;
					$('.' + type).each(function (index) {
						checkHex($(this).css('background-color'));
					});
				}
			});
			if (success) {
				$('#migration-confirm-button').html('OK');
				$('#migration-confirm-button').css('background', '#42ff00');
			} else {
				$('#migration-confirm-button').html('FAIL');
				$('#migration-confirm-button').css('background', '#ff0000');
			}
			$('#migration-confirm-button').on('click', function () {
				if ($('#migration-confirm').css('display') == 'none') {
					$('#migration-confirm').show();
				} else {
					$('#migration-confirm').hide();
				}
			});
			debug('success', success);
		}, 2500);
		function keyDownCommand(ctrlKey, keyCode) {
			if (ctrlKey && keyCode == 39) {
				nextPrevQuestion(true);
			}
		}
		$(document).keydown(function (e) {
			keyDownCommand(e.ctrlKey, e.keyCode);
		})
	}
}
