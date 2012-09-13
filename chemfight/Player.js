/**
 * Player is our object holding player stats
 * @constructor
 */
CF.Player = function(name, angleFromCenter) {
	this.Life = 30;
	this.Energy = 10;
	this.AtomBucks = 30;
	this.Points = 0;
	this.Name = name;
	
	this.AngleFromCenter = angleFromCenter;
	
	this.OwnedElementCounts = {};//key is element number, value is number of elements owned i.e. { 1:2 } means two hydrogen atoms
	
	this.AttackingElement = null;
	this.DefendingElementCounts = {};//key is element number, value is number of elements chosen to defend
	
};

CF.Player.prototype.roundOver = function(round) {
	//refund all remaining elements
	var allOwnedElements = this.getAllOwnedElements();
	for(var n in allOwnedElements) {
		this.refundElement(allOwnedElements[n]);
	}
	
	//give player points based on Life, Energy, AtomBucks, etc...
	this.Points += (this.AtomBucks + this.Life) * 10;
	this.Points += this.Energy * 5;
	
	
	//clear out player's owned elements, etc...
	this.Life = 30 + (15 * round);
	this.Energy = this.Life / 3;
	this.AtomBucks = this.Life;
	
	this.clearAttackerAndDefenders();
	this.OwnedElementCounts = {};
};

CF.Player.prototype.clearAttackerAndDefenders = function() {
	this.AttackingElement = null;
	this.DefendingElementCounts = {};
}; 

CF.Player.prototype.getOwnedElementCount = function(n) {
	if(n in this.OwnedElementCounts) {
		return this.OwnedElementCounts[n];
	}
	return 0;
};

CF.Player.prototype.getDefendingElementsString = function(n) {
	var defendingElements = "";
	for(var e in CF.GameModel.Elements) {
		var element = CF.GameModel.Elements[e];
		if(element.n in this.DefendingElementCounts && this.DefendingElementCounts[element.n] > 0) {
			if(defendingElements.length != 0)
				defendingElements += ", ";
			var count = this.DefendingElementCounts[element.n];
			defendingElements += (count > 1 ? count + "" : "") + element.s;
		}
	}
	if(defendingElements == "")
		defendingElements = "<none>"
	return defendingElements;
};

CF.Player.prototype.getAllDefendingElements = function() {
	var allDefenders = [];
	for(var n in this.DefendingElementCounts) {
		var count = this.DefendingElementCounts[n];
		var element = CF.GameModel.Elements[n-1];
		for(var i = 0; i < count; i++)
			allDefenders.push(element);
	}
	return allDefenders;
};

CF.Player.prototype.getAllOwnedElementsCount = function() {
	var count = 0;
	
	for(var n in this.OwnedElementCounts) {
		count += this.OwnedElementCounts[n];
	}
	
	return count;
};

CF.Player.prototype.getAllOwnedElements = function() {
	var allElements = [];
	
	for(var e in CF.GameModel.Elements) {
		var element = CF.GameModel.Elements[e];
		if(element.n in this.OwnedElementCounts && this.OwnedElementCounts[element.n] > 0) {
			var oec = this.OwnedElementCounts[element.n];
			while(oec > 0) {
				allElements.push(element);
				oec--;
			}
		}
	}
	
	return allElements;
};

CF.Player.prototype.getOwnedAttackingAndDefendingElementsArray = function() {
	var allElements = [];
	
	for(var e in CF.GameModel.Elements) {
		var element = CF.GameModel.Elements[e];
		if(element.n in this.OwnedElementCounts && this.OwnedElementCounts[element.n] > 0) {
			allElements.push(element);
		} else if(element.n in this.DefendingElementCounts && this.DefendingElementCounts[element.n] > 0) {
			allElements.push(element);
		} else if(this.AttackingElement !== null && this.AttackingElement.n == element.n) {
			allElements.push(element);
		}
	}
	
	return allElements;
};

CF.Player.prototype.canPurchaseElement = function(element) {
	if(this.AtomBucks < element.n)//make sure the player can afford it
		return false;
	if(element.g == 18 && this.Energy < element.n/2) //noble gasses cost energy to purchase
		return false;
	return true;	
};

CF.Player.prototype.purchaseElement = function(element) {
	if(!this.canPurchaseElement(element))
		return;
	this.addOwnedElement(element);
	this.AtomBucks -= element.n;
	if(element.g == 18) {
		this.Energy -= element.n/2;
	}
};

CF.Player.prototype.addOwnedElement = function(element) {
	if(!(element.n in this.OwnedElementCounts)) {
		this.OwnedElementCounts[element.n] = 0;
	}
	this.OwnedElementCounts[element.n] += 1;
};

CF.Player.prototype.removeOwnedElement = function(element) {
	if(element.n in this.OwnedElementCounts && this.OwnedElementCounts[element.n] > 0) {
		this.OwnedElementCounts[element.n] -= 1;
	}
};

CF.Player.prototype.refundElement = function(element) {
	if(element.n in this.OwnedElementCounts && this.OwnedElementCounts[element.n] > 0) {
		this.OwnedElementCounts[element.n] -= 1;
		this.AtomBucks += element.n;
		if(element.g == 18) {//noble gasses cost energy to purchase
			this.Energy += element.n/2;
		}
	}
};

CF.Player.prototype.getDefendingElementCount = function(n) {
	if(n in this.DefendingElementCounts) {
		return this.DefendingElementCounts[n];
	}
	return 0;
};

CF.Player.prototype.addElementDefender = function(element) {
	if(this.getOwnedElementCount(element.n) == 0 || element.g == 18)//make sure the player owns at least one
		return false;
	if(!(element.n in this.DefendingElementCounts)) {
		this.DefendingElementCounts[element.n] = 0;
	}
	this.DefendingElementCounts[element.n] += 1;
	this.OwnedElementCounts[element.n] -= 1;//remove it from the owned elements list, if we don't use the defender we'll put it back
	return true;
};

CF.Player.prototype.removeElementDefender = function(element) {
	if(element.n in this.DefendingElementCounts && this.DefendingElementCounts[element.n] > 0) {
		this.DefendingElementCounts[element.n] -= 1;
	}
};

/**
 * Round 1 AI will make purely random purchases
 * Round 2 AI should prefer noble gasses and diversify the elements owned (so less likely to buy H if they already have H)
 * Round 3 AI could purchase elements that would be good to use for attack or defense against the player, it could even refund some elements
 */
CF.Player.prototype.AIPurchaseElements = function() {
	while(this.AtomBucks > 0) {
		var index = null;
		
		if(CF.GameModel.CurrentRound > 1) {
			//base purchase decisions on what we already have so we get a variety 
			//owned elements should be less likely to be re-purchased
			var unownedAffordableElements = [];
			for(var i = 0; i < CF.GameModel.Elements.length; i++) {
				var element = CF.GameModel.Elements[i];
				if(this.AtomBucks >= element.n && this.getOwnedElementCount(element) == 0) {
					unownedAffordableElements.push(element);
				}
			}
			if(unownedAffordableElements.length > 0) {
				var i = CF.Util.NextRandom(0, unownedAffordableElements.length);
				index = unownedAffordableElements[i].n - 1;
			}
		} 
		if(!index) {//just pick one at random to purchase
			index = this.AtomBucks + 1 < CF.GameModel.Elements.length ? this.AtomBucks + 1 : CF.GameModel.Elements.length;
			index = CF.Util.NextRandom(0, index);
		}
		var element = CF.GameModel.Elements[index];
		this.purchaseElement(element);
	}
};

/**
 * AI prefers to attack with noble gasses if it has any 
 *  round 2 opponent should prefer heavier elements and a variety elements that are less reactive (middle of the periodic table)
 *  round 3 opponent should try to pick elements that are not easily defendable by the player (based on what he/she owns)?
 */
CF.Player.prototype.AIPickAttackingElement = function() {
	this.AttackingElement = null;
	
	//first check for Noble gasses, might as well use those to attack first
	for(var i = CF.GameModel.Elements.length-1; i >= 0; i--) {
		var element = CF.GameModel.Elements[i];
		if(element.g == 18 && element.n in this.OwnedElementCounts && this.OwnedElementCounts[element.n] > 0){
			this.AttackingElement = element;
			break;
		}
	}
	
	if(!this.AttackingElement && CF.GameModel.CurrentRound > 1) {
		//Prefer to attack with element groups 2 through 16 and the heaviest elements in those groups (those are probably the harder ones to defend against)
		var bestElementsForAttack = [];
		for(var i = CF.GameModel.Elements.length-1; i >= 0; i--) {
			var element = CF.GameModel.Elements[i];
			if(element.g > 1 && element.g < 17){
				bestElementsForAttack.push(element);
			}
		}
		
		if(bestElementsForAttack.length > 0) {
			//prefer the elements in the list closer to index 0 (those will be the heaviest)
			var probabilitySum = 0;
			for(var i = 0; i < bestElementsForAttack.length; i++) {
				probabilitySum += Math.pow(2, i);
			}
			for(var i = 0; i < bestElementsForAttack.length; i++) {
				var slotProbability = Math.pow(2, bestElementsForAttack.length - i - 1);
				if(CF.Util.NextRandom(0, probabilitySum + 1) <= slotProbability) {
					this.AttackingElement = bestElementsForAttack[i];
					break;
				}
			}
		}
	}
	
	if(!this.AttackingElement) {
		//just pick one at random if we got here
		var ownedElements = this.getAllOwnedElements();
		if(ownedElements.length == 0)
			this.AttackingElement = null;
		else {
			var index = CF.Util.NextRandom(0, ownedElements.length);
			this.AttackingElement = ownedElements[index];
		}
	}
	
	if(this.AttackingElement)
		this.removeOwnedElement(this.AttackingElement);
	
	return this.AttackingElement;
};

/**
 * Add more smarts to round 2 and 3 computers picking defending elements, 
 * maybe round 2 chooses smallest possible configuration and 
 * round 3 bases possible defenders based on estimations of players owned compounds and valence electrons and known compounds
 */
CF.Player.prototype.AIPickDefendingElements = function(attackerValenceCount) {
	//if we own enough elements to hit 2 or 8 valence electrons, that's what we'll use, otherwise we could pick one at random or just not defend?
	var valenceTarget = attackerValenceCount == 1 ? 2 : 8;
	
	var ownedValenceSum = 0;
	var ownedElements = this.getAllOwnedElements();
	
	var ownGroup1 = false;
	for(oe in ownedElements) {
		ownedValenceSum += ownedElements[oe].v;
		//check for group one in our owned elements, if we don't have a group 1 element (1 valence electron), the target should be 8
		if(ownedElements[oe].g == 1) {
			ownGroup1 = true;
		}
	}
	if(valenceTarget == 2 && !ownGroup1) {
		valenceTarget = 8;//this is in hopes that we can use something like Fluorine to bond with an attacking hydrogen
	}
	valenceTarget -= attackerValenceCount;
	var possibleDefenderArrays = [];//array of arrays
	
	if(CF.GameModel.CurrentRound >= 3) {
		//for the final rounds, the computer will be smarter about choosing defenders
		//first we guess which possible elements the player could be attacking with based on the valence count
		// then we see if we have elements that would form compounds based on the known compound list
		var playerOwnedElements = CF.GameModel.MainPlayer.getOwnedAttackingAndDefendingElementsArray();
		var possibleAttackers = [];
		for(var poe in playerOwnedElements) {
			var element = playerOwnedElements[poe];
			if(element.v == attackerValenceCount) {
				possibleAttackers.push(element);
			}
		}
		for(var e in possibleAttackers) {
			var attackingElement = possibleAttackers[e];
			//find possible compounds
			var candidateCompounds = CF.Util.GetCandidateCompoundsForReaction(attackingElement, this.OwnedElementCounts);
			for(var c in candidateCompounds) {
				var compound = candidateCompounds[c];
				var possibleDefenders = [];
				//check participants for defending elements requirement, remove the candidate if a requirement is not met
				for(var j in compound.participants) {
					var participant = compound.participants[j];
					for(var pc = 0; pc < participant.count; pc++) {
						if(pc == 0 && participant.s == attackingElement.s)
							continue;//we're good on the attacker
						possibleDefenders.push(CF.GameModel.Elements[participant.n-1]);
					}
				}
				if(possibleDefenders.length > 0)
					possibleDefenderArrays.push(possibleDefenders);
			}
		}
		
	} else {
	
		var currentDefenderSet = [];
		var currentLevelDefenders = [];
		for(var o in ownedElements) {
			var element = ownedElements[o];
			if(element.g != 18){//skip noble gasses, they are no good for defense
				var elementArr = [];
				elementArr.push(element);
				currentLevelDefenders.push(elementArr);
				currentDefenderSet.push(element);
			}
		}
		possibleDefenderArrays = this.AIGetDefendingElementCombinations(valenceTarget, currentLevelDefenders, 0, currentDefenderSet);
		
	}
	
	if(possibleDefenderArrays.length > 0) {
		possibleDefenderArrays.sort(this.SortElementArraysLightestFirst);
		
		var chosenDefenders = possibleDefenderArrays[0];
		if(CF.GameModel.CurrentRound == 1) {
			var randIndex = CF.Util.NextRandom(0, possibleDefenderArrays.length);
			chosenDefenders = possibleDefenderArrays[randIndex];
		}
		
		for(oe in chosenDefenders) {
			this.addElementDefender(chosenDefenders[oe]);
		}
	}
};

CF.Player.prototype.SortElementArraysLightestFirst = function(/*compound*/ a, /*compound*/ b) {
	var sumA = CF.Util.GetElementArrayWeightSum(a);
	var sumB = CF.Util.GetElementArrayWeightSum(b);
	return sumA.compareTo(sumB);
};

/**
 * AIGetDefendingElementCombinations is a recursive function, it takes an array of arrays (of elements)
 * 
 */
CF.Player.prototype.AIGetDefendingElementCombinations = function(valenceTarget, currentLevelDefenders, iLevelStart, ownedElements) {
	var goodDefenders = [];
	
	for(var c in currentLevelDefenders) {
		var elementArray = currentLevelDefenders[c];
		var valenceSum = this.GetElementArrayValenceElectronSum(elementArray);
		if(valenceSum == valenceTarget){//we are done on this path
			goodDefenders.push(elementArray);
		} else if(valenceSum > valenceTarget) {//this path isn't good
			continue;
		}
		for(var i = iLevelStart + 1; i < ownedElements.length; i++) {
			var nextLevelDefenders = elementArray.slice(0);//copies all elements
			nextLevelDefenders.push(ownedElements[i]);
			var newLevel = [];
			newLevel.push(nextLevelDefenders);
			var recursiveDefenderArrays = this.AIGetDefendingElementCombinations(valenceTarget, newLevel, i, ownedElements);
			for(var r in recursiveDefenderArrays)
				goodDefenders.push(recursiveDefenderArrays[r]);
		}
	}
	
	return goodDefenders;
};

/**
 * GetElementArrayValenceElectronSum just sums valence counts
 * 
 */
CF.Player.prototype.GetElementArrayValenceElectronSum = function(elementArray) {
	var sum = 0;
	for(var i in elementArray) {
		sum += elementArray[i].v;
	}
	return sum;
};
