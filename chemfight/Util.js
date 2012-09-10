CF.Util = {};

/*
CF.Util.validateCompounds = function() {
	var goodCompounds = [];
	var elements = CF.GameModel.Elements;
	elements.sort(CF.Util.SortElementsLongestFirst);
	for(var c in CF.GameModel.Compounds)
	{
		var compound = CF.GameModel.Compounds[c];
		//remove any numbers
		var testFormula = compound.f.replace(/[\d.]/g, "");
		//then go through our known elements removing any we know
		for(var e in elements) {
			var regExp = new RegExp(elements[e].s);
			testFormula = testFormula.replace(regExp, "");
		}
		if(testFormula == "") {
			//found good compound
			goodCompounds.push(compound);
		}
		
	}
	document.getElementById("debug").value = JSON.stringify(goodCompounds);
};
*/
/*
CF.Util.findPotentialUnknownCompounds = function() {
	var goodCompounds = [];
	//look for compounds which we don't alredy know about,
	// based on valence electron counts
	
	var sortedElements = CF.GameModel.Elements.slice(0);//copies all elements
	sortedElements.sort(CF.Util.SortElementsLongestFirst);
	
	for(var i in CF.GameModel.Elements) {
		var element = CF.GameModel.Elements[i];
		if(element.g != 18) { //we typically can't find noble gas compounds
			//see if we can fill or 1/2 fill a valence shell
			//maybe based on stable (total) electron counts? 2, 3, 4, 6, 7, 10, 11, 12, 14, 15, 18, 20, 24, 25, 30...
			//or is it better to just base reactivity on valence electrons of elements? since for example 1s level electrons don't affect bonding in Ca?
			for(var j in CF.GameModel.Elements) {
				if(i == j || CF.GameModel.Elements[j].g == 18)
					continue;
				var valenceSum = element.v + CF.GameModel.Elements[j].v;
				if(valenceSum == 8 || valenceSum == 2) {
					var newCompound = new CF.Model.Compound(element.s + CF.GameModel.Elements[j].s, null);
					CF.GameModel.AssignCompoundParticipants(newCompound, sortedElements);
					var otherCompound = CF.GameModel.FindExactCompoundByParticipants(newCompound);
					if(otherCompound == null)
						goodCompounds.push(newCompound);
				}
			}
		}
	}
	document.getElementById("debug").value = JSON.stringify(goodCompounds);
};
*/
CF.Util.NextRandom = function(lowInclusive, highExclusive) {

	if(highExclusive === null || typeof highExclusive == "undefined") {
		highExclusive = lowInclusive;
		lowInclusive = 0;
	}
	
	if(lowInclusive < 0)
		highExclusive += Math.abs(lowInclusive);
	else
		highExclusive -= lowInclusive;

	return Math.floor(Math.random()*highExclusive) + lowInclusive;
};

CF.Util.SortElementsLongestFirst = function(/*element*/ a, /*Element*/ b) {
	return b.s.length.compareTo(a.s.length);
};

CF.Util.SortCompoundsHeaviestFirst = function(/*compound*/ a, /*compound*/ b) {
	return b.w.compareTo(a.w);
};

/**
 * GetElementArrayWeightSum just sums weight counts of an array of elements
 * 
 */
CF.Util.GetElementArrayWeightSum = function(elementArray) {
	var sum = 0;
	for(var i in elementArray) {
		sum += elementArray[i].n;
	}
	return sum;
};

/**
 * This function is a duplicate of some of the functions within Player.js, should eventually move it out to it's own element
 * 
 */
CF.Util.getDefendingElementCount = function(defendingElementCounts, n) {
	if(n in defendingElementCounts) {
		return defendingElementCounts[n];
	}
	return 0;
};

CF.Util.GetCandidateCompoundsForReaction = function(attackingElement, defendingElementCounts) {
	//this algorithm looks for compounds where the attacker element is required
	// at least one or more of the defenders elements must be included,
	// all participants in a compound must be accounted for either by the attacking element or by the defenders
	
	var candidateCompounds = [];
	
	for(var i in CF.GameModel.Compounds) {
		var compound = CF.GameModel.Compounds[i];
		//check participants for attacking element
		for(var j in compound.participants) {
			var participant = compound.participants[j];
			if(participant.s == attackingElement.s){
				candidateCompounds.push(compound);
				break;
			}
		}
	}
	
	for(var i = candidateCompounds.length - 1; i >= 0; i--) {
		var compound = candidateCompounds[i];
		//check participants for defending elements requirement, remove the candidate if a requirement is not met
		for(var j in compound.participants) {
			var participant = compound.participants[j];
			
			if(participant.s == attackingElement.s){
				if(participant.count == 1)
					continue;//we're good on the attacker
				else if(CF.Util.getDefendingElementCount(defendingElementCounts, participant.n) >= participant.count - 1){//check to make sure the defender can make up the rest
					continue;
				}
			} else if(CF.Util.getDefendingElementCount(defendingElementCounts, participant.n) >= participant.count)
				continue;
			//if we got here we didn't satisfy the requirements for this compound, remove this candidate
			candidateCompounds.splice(i, 1);
			break;
		}
	}
	
	return candidateCompounds;
};


CF.Util.GetColorRGBAFromHexString = function(hex) {
	var h = hex.charAt(0)=="#" ? hex.substr(1) : hex;
	var color = null;
	if(h.length == 3) {
		var r = parseInt(h.substring(0,1),16);
		var g = parseInt(h.substring(1,2),16);
		var b = parseInt(h.substring(2,3),16);
		color = new CF.Util.ColorRGBA(r + r * 16, g + g * 16, b + b * 16, 255);
	}
	else if(h.length == 6)
		color = new CF.Util.ColorRGBA(parseInt(h.substring(0,2),16),parseInt(h.substring(2,4),16),parseInt(h.substring(4,6),16), 255);
	return color;
};

/**
 * A ColorRGBA represents the red green blue and alpha of a color
 * @constructor
 */
CF.Util.ColorRGBA = function(r, g, b, a) {
	this.r = r;//red
	this.g = g;//green
	this.b = b;//blue
	this.a = a;//alpha
};

/**
 * multiply returns a new colorRGBA with the r, g, b values multiplied by the multiplyier
 * @this {CF.Util.ColorRGBA}
 * @return {CF.Util.ColorRGBA}
 */
CF.Util.ColorRGBA.prototype.multiply = function(multiplyier) {
	return new CF.Util.ColorRGBA(Math.floor(this.r * multiplyier)
								, Math.floor(this.g * multiplyier)
								, Math.floor(this.b * multiplyier)
								, this.a);
};

/**
 * fadeTo returns a new colorRGBA that is a bit closer to the r, g, b values of the ColorRGBA passed in
 * @this {CF.Util.ColorRGBA}
 * @return {CF.Util.ColorRGBA}
 */
CF.Util.ColorRGBA.prototype.fadeTo = function(colorToApproach) {
	
	//if they are the same, just return this
	if(this.equals(colorToApproach))
		return this;

	
	return new CF.Util.ColorRGBA(this.r > colorToApproach.r ? this.r - 1 : this.r + 1
								, this.g > colorToApproach.g ? this.g - 1 : this.g + 1
								, this.b > colorToApproach.b ? this.b - 1 : this.b + 1
								, this.a > colorToApproach.a ? this.a - 1 : this.a + 1);
};

/**
 * equals returns true if r, g, b, and a of the passed in ColorRGBA equals this ColorRGBA
 * @this {CF.Util.ColorRGBA}
 * @return {bool}
 */
CF.Util.ColorRGBA.prototype.equals = function(colorCompare) {
	return (this.r == colorCompare.r && this.g == colorCompare.g && this.b == colorCompare.b && this.a == colorCompare.a);
};

/**
 * toString converts a ColorRGBA object to a string the canvas can recognize
 * @this {CF.Util.ColorRGBA}
 * @return {string}
 */
CF.Util.ColorRGBA.prototype.toString = function() {
	return 'rgba(' + this.r + ', ' + this.g + ', ' + this.b + ', ' + this.a + ')';
};

/**
 * toString returns a new ColorRGBA object based on this object
 * @this {CF.Util.ColorRGBA}
 * @return {CF.Util.ColorRGBA}
 */
CF.Util.ColorRGBA.prototype.clone = function() {
	return new CF.Util.ColorRGBA(this.r, this.g, this.b, this.a);
};

CF.Util.SecondsToMMSS = function(seconds) {
	//return seconds in MM:SS format
	var minutes = Math.floor(seconds/60);
	var secondsRemaining = seconds % 60;

	var ret = minutes < 10 ? "0" + minutes + ":" : minutes + ":";
	ret += secondsRemaining < 10 ? "0" + secondsRemaining : secondsRemaining;
	return ret;
};