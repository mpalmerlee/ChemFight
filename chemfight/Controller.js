//provides the glue between the html controls, CF.View and the Game Model

CF.Controller = {
	statusMessages: [],
	CurrentGameMode: null,
	NextGameMode: null //either ChooseAttacker or ChooseDefenders
};

CF.Controller.GameMode = {
	Play: 0,
	PurchaseElements: 1,
	ChooseAttacker: 2,
	ChooseDefenders: 3,
	AnimatingBattle: 4,
	NextStage: 5,
	NextRound: 6,
	GameOverYouLose: 7,
	GameOverYouWin: 8
};

CF.Controller.SetupNewGame = function() {
	CF.View.SetupNewGame();
};

CF.Controller.RoundOver = function() {
	CF.GameModel.roundOver();
};

CF.Controller.GoToNextRound = function() {
	CF.GameModel.nextRound();
	
	CF.Controller.CurrentGameMode = CF.Controller.GameMode.PurchaseElements;
	CF.View.PeriodicTable.populate();
	CF.GameModel.CurrentTurn++;
	
	CF.View.PurchasedElementsGUIOpponent.refresh();
	CF.View.PurchasedElementsGUIMain.refresh();
};

CF.Controller.ElementCardPlusButtonClicked = function(element) {
	if(CF.Controller.CurrentGameMode == CF.Controller.GameMode.PurchaseElements) {
		CF.GameModel.MainPlayer.purchaseElement(element);
		CF.View.CanvasForegroundHUDLayer.needsDisplay = true;
	} else if(CF.Controller.CurrentGameMode == CF.Controller.GameMode.ChooseDefenders) {
		if(CF.GameModel.MainPlayer.addElementDefender(element))
			CF.View.AtomVisualizerController.add(element, true, true);
	} else if(CF.Controller.CurrentGameMode == CF.Controller.GameMode.ChooseAttacker) {
		if(CF.GameModel.MainPlayer.AttackingElement == null) {
			CF.GameModel.MainPlayer.removeOwnedElement(element);
			CF.GameModel.MainPlayer.AttackingElement = element;
			CF.View.AtomVisualizerController.add(element, true, true);
		}
	}
	CF.View.PurchasedElementsGUIMain.refresh();
};

CF.Controller.ElementCardMinusButtonClicked = function(element) {
	if(CF.Controller.CurrentGameMode == CF.Controller.GameMode.PurchaseElements) {
		CF.GameModel.MainPlayer.refundElement(element);
		CF.View.CanvasForegroundHUDLayer.needsDisplay = true;
	} else if(CF.Controller.CurrentGameMode == CF.Controller.GameMode.ChooseDefenders) {
		CF.GameModel.MainPlayer.removeElementDefender(element);
		CF.GameModel.MainPlayer.addOwnedElement(element);
		CF.View.AtomVisualizerController.remove(element.n);
	} else if(CF.Controller.CurrentGameMode == CF.Controller.GameMode.ChooseAttacker) {
		if(CF.GameModel.MainPlayer.AttackingElement !== null) {
			CF.GameModel.MainPlayer.addOwnedElement(element);
			CF.View.AtomVisualizerController.remove(element.n);
			CF.GameModel.MainPlayer.AttackingElement = null;
		}
	}
	CF.View.PurchasedElementsGUIMain.refresh();
};

CF.Controller.PurchaseElementsFinished = function() {
	CF.View.PeriodicTable.clear();
	//have the AI/Computer player pick the elements
	CF.GameModel.OpponentPlayer.AIPurchaseElements();
	
	CF.View.AtomVisualizerController.clear();
	CF.Controller.CurrentGameMode = CF.Controller.GameMode.ChooseDefenders;
	CF.Controller.NextGameMode = CF.Controller.GameMode.ChooseAttacker;
	CF.Controller.StartTurn();
};

CF.Controller.ChooseDefendersFinished = function() {
	CF.Controller.CurrentGameMode = CF.Controller.GameMode.AnimatingBattle;
	
	CF.View.PurchasedElementsGUIMain.refresh();
	
	//reveal Attacker
	CF.View.AtomVisualizerController.revealAllElements();
	CF.View.CanvasForegroundHUDLayer.needsDisplay = true;
	
	CF.View.AtomVisualizerController.moveElementsToCenter();
	setTimeout(function() {CF.Controller.DetermineBestReaction();}, 2000);
};

CF.Controller.ChooseAttackerFinished = function() {
	if(CF.GameModel.MainPlayer.AttackingElement.g == 18) {
		//special handling for noble gasses
		CF.Controller.HandleNobleGasAttack(CF.GameModel.MainPlayer, CF.GameModel.OpponentPlayer);
		return;
	} 
	
	CF.Controller.CurrentGameMode = CF.Controller.GameMode.AnimatingBattle;
	
	//Have the AI choose defenders
	CF.GameModel.OpponentPlayer.AIPickDefendingElements(CF.GameModel.MainPlayer.AttackingElement.v);
	CF.View.PurchasedElementsGUIOpponent.refresh();
	
	//reveal/add visualized Defenders
	var defendingElements = CF.GameModel.OpponentPlayer.getAllDefendingElements();
	for(var e in defendingElements)
		CF.View.AtomVisualizerController.add(defendingElements[e], true, true);
		
	CF.View.CanvasForegroundHUDLayer.needsDisplay = true;
	
	CF.View.AtomVisualizerController.moveElementsToCenter();
	setTimeout(function() {CF.Controller.DetermineBestReaction();}, 2000);
};

CF.Controller.DetermineBestReaction = function() {
	var attackingPlayer = CF.GameModel.getAttackingPlayer();
	var defendingPlayer = CF.GameModel.getDefendingPlayer();

	var foundCompound = CF.GameModel.DetermineBestReaction(attackingPlayer, defendingPlayer);//the real work is done here
	var leftoverDefenders = defendingPlayer.getAllDefendingElements();
	
	CF.View.BattleStageCompoundMessage = null;
	CF.View.BattleStageMessage2 = null;
	if(foundCompound !== null) {
		//defense successful
		//give defender energy, points and cash?
		var b = foundCompound.w;
		defendingPlayer.AtomBucks += b;
		defendingPlayer.Points += b * 10;
		defendingPlayer.Energy += b * 2;
		CF.View.BattleStageMessage1 = "Defense Successful, Defender Earned " + b + " buck" + (b > 1 ? "s" : "") + " and " + (b * 2) + " energy.";
		CF.View.BattleStageCompoundMessage = "Compound: " + foundCompound.toString() + " formed.";
		
		//remove the elements from leftoverDefenders that we used in our defense
		for(var p in foundCompound.participants) {
			participant = foundCompound.participants[p];
			for(var i = 0; i < participant.count; i++) {
				if(i == 0 && participant.n == attackingPlayer.AttackingElement.n){
					CF.View.AtomVisualizerController.moveElementOffscreen(attackingPlayer.AttackingElement.n);
					continue;//skip our attacker
				}
				for(var j = leftoverDefenders.length - 1; j >= 0; j--) {
					if(leftoverDefenders[j].n == participant.n) {
						CF.View.AtomVisualizerController.moveElementOffscreen(participant.n);
						leftoverDefenders.splice(j, 1);
						break;
					}
				}				
			}
		}
		
	} else {
		CF.Controller.AttackingElementUndefended(attackingPlayer, defendingPlayer);
		CF.View.BattleStageMessage1 = "Attack Successful " + attackingPlayer.AttackingElement.n + " damage dealt";
	}
	
	//penalize defender for unbonded elements and return them to ownership
	var energyLost = 0;
	var lifeLost = 0;
	for(var d in leftoverDefenders) {
		element = leftoverDefenders[d];
		defendingPlayer.addOwnedElement(element);
		defendingPlayer.Energy -= element.n;
		energyLost += element.n;
		CF.View.AtomVisualizerController.moveElementOffscreen(element.n, defendingPlayer);
	}
	if(defendingPlayer.Energy < 0) {
		lifeLost = defendingPlayer.Energy * -1;
		energyLost -= lifeLost;
		defendingPlayer.Life -= lifeLost;
		defendingPlayer.Energy = 0;
	}
	if(energyLost != 0 || lifeLost != 0) {
		CF.View.BattleStageMessage2 = lifeLost + " Life lost and " + energyLost + " Energy lost from unbonded defending elements.";
	}
	
	CF.Controller.CurrentGameMode = CF.Controller.GameMode.NextStage;
	CF.View.CanvasForegroundHUDLayer.needsDisplay = true;
	
	//check for end of game
	CF.Controller.CheckForGameOver();
};

CF.Controller.CheckForGameOver = function() {
	var ttl = 10000;
	if(CF.GameModel.MainPlayer.Life <= 0) {
		//you loose! Game Over!
		CF.Controller.CurrentGameMode = CF.Controller.GameMode.GameOverYouLose;
		CF.View.AddAutoRemovedText(CF.View.CanvasWidth/2, CF.View.CanvasHeight/2, "You lost all your Life", "#FFF", 20, ttl, 0);
		CF.View.AddAutoRemovedText(CF.View.CanvasWidth/2, CF.View.CanvasHeight/2 + 20, "Game Over!", "#FFF", 20, ttl, 3000);
	}
	else if(CF.GameModel.OpponentPlayer.Life <= 0) {
		if(CF.GameModel.CurrentRound < 3){
			//goto next round
			CF.Controller.RoundOver();
			CF.Controller.CurrentGameMode = CF.Controller.GameMode.NextRound;
			CF.View.AddAutoRemovedText(CF.View.CanvasWidth/2, CF.View.CanvasHeight/2, "Opponent Defeated!", "#FFF", 20, ttl, 0);
			CF.View.AddAutoRemovedText(CF.View.CanvasWidth/2, CF.View.CanvasHeight/2 + 20, "Round Complete", "#FFF", 20, ttl, 3000);
		} else {
			CF.Controller.RoundOver();
			//you win the Chem Fight! You are a chemical master! 
			CF.Controller.CurrentGameMode = CF.Controller.GameMode.GameOverYouWin;
			CF.View.AddAutoRemovedText(CF.View.CanvasWidth/2, CF.View.CanvasHeight/2, "You defeated all Opponents", "#FFF", 20, ttl, 0);
			CF.View.AddAutoRemovedText(CF.View.CanvasWidth/2, CF.View.CanvasHeight/2 + 20, "and won the Chem Fight!", "#FFF", 20, ttl, 0);
			CF.View.AddAutoRemovedText(CF.View.CanvasWidth/2, CF.View.CanvasHeight/2 + 40, "Congratulations!", "#FFF", 20, ttl, 3000);
			CF.View.AddAutoRemovedText(CF.View.CanvasWidth/2, CF.View.CanvasHeight/2 + 60, "You are a chemical master!", "#FFF", 20, ttl, 3000);
		}
	}
};

CF.Controller.GotoNextGameMode = function() {
	CF.View.ClearAutoRemovedTexts();
	
	switch(CF.Controller.CurrentGameMode) {
		case CF.Controller.GameMode.PurchaseElements:
			CF.Controller.PurchaseElementsFinished();
			break;
		case CF.Controller.GameMode.ChooseDefenders:
			CF.Controller.ChooseDefendersFinished();
			break;
		case CF.Controller.GameMode.ChooseAttacker:
			CF.Controller.ChooseAttackerFinished();
			break;
		case CF.Controller.GameMode.NextStage:
			//clear both player's attackers and defenders
			CF.GameModel.MainPlayer.clearAttackerAndDefenders();
			CF.GameModel.OpponentPlayer.clearAttackerAndDefenders();
			CF.View.PurchasedElementsGUIOpponent.refresh();
			CF.View.PurchasedElementsGUIMain.refresh();
		
			CF.Controller.CurrentGameMode = CF.Controller.NextGameMode;
			if(CF.Controller.CurrentGameMode == CF.Controller.GameMode.ChooseAttacker) {
				CF.Controller.NextGameMode = CF.Controller.GameMode.PurchaseElements;
				CF.View.AddAutoRemovedText(CF.View.CanvasWidth/2, CF.View.CanvasHeight/2, "Choose Attacker", "#FFF", 20, 6000, 1000);
				CF.Controller.CheckForNoAttackersAvailable(CF.GameModel.MainPlayer);
			} else { //CurrentGameMode = ChooseDefenders
				CF.Controller.NextGameMode = CF.Controller.GameMode.ChooseAttacker;
				CF.Controller.StartTurn();
			}
			CF.View.CanvasForegroundHUDLayer.needsDisplay = true;
			break;
		case CF.Controller.GameMode.NextRound:
			CF.Controller.GoToNextRound();
			break;
		case CF.Controller.GameMode.GameOverYouLose:
		case CF.Controller.GameMode.GameOverYouWin:
			CF.Controller.SetupNewGame();
			break;
	}
};

CF.Controller.CheckForNoAttackersAvailable = function(attackingPlayer) {
	//if either player is attacking, but doesn't have any elements, we need to move on
	if(attackingPlayer.getAllOwnedElementsCount() == 0) {
		CF.View.AddAutoRemovedText(CF.View.CanvasWidth/2, CF.View.CanvasHeight/2, "No Elements owned by Attacker", "#FFF", 20, 3000, 0);
		CF.View.AddAutoRemovedText(CF.View.CanvasWidth/2, CF.View.CanvasHeight/2 + 30, "Skipping to next Stage", "#FFF", 20, 3000, 0);
		//if the main player was just attacking, move onto purchase elements, otherwise the main player chooses an attacker
		setTimeout(function() {
			if(CF.Controller.CurrentGameMode == CF.Controller.GameMode.ChooseAttacker) {
				CF.Controller.CurrentGameMode = CF.Controller.GameMode.PurchaseElements;
				CF.Controller.StartTurn();
			} else { //CurrentGameMode = ChooseDefenders
				CF.Controller.CurrentGameMode = CF.Controller.GameMode.NextStage;
				CF.Controller.GotoNextGameMode();
			}
		}, 3000);
	}
};

CF.Controller.AttackingElementUndefended = function(attackingPlayer, defendingPlayer) {
	CF.View.AtomVisualizerController.particleizeElementToPlayer(attackingPlayer.AttackingElement, defendingPlayer);
	//attack successful
	//damage defender and give points to attacker
	defendingPlayer.Life -= attackingPlayer.AttackingElement.n;
	attackingPlayer.Points += attackingPlayer.AttackingElement.n * 10;
};

CF.Controller.HandleNobleGasAttack = function(attackingPlayer, defendingPlayer) {
	CF.Controller.CurrentGameMode = CF.Controller.GameMode.NextStage;
	//reveal Attacker
	CF.View.AtomVisualizerController.revealAllElements();
	CF.Controller.AttackingElementUndefended(attackingPlayer, defendingPlayer);
	CF.View.BattleStageCompoundMessage = null;
	CF.View.BattleStageMessage1 = "A noble gas attacked, unable to defend.";
	CF.View.BattleStageMessage2 = attackingPlayer.AttackingElement.n + " damage dealt";
	CF.View.CanvasForegroundHUDLayer.needsDisplay = true;
	CF.Controller.CheckForGameOver();
};

CF.Controller.StartTurn = function() {
	if(CF.Controller.CurrentGameMode == CF.Controller.GameMode.ChooseDefenders) {
		CF.View.PurchasedElementsGUIOpponent.refresh();
		CF.Controller.CheckForNoAttackersAvailable(CF.GameModel.OpponentPlayer);
		//have the AI player choose an attacker and then show the player the chosen elements valence electrons
		var element = CF.GameModel.OpponentPlayer.AIPickAttackingElement();
		if(element) {
			CF.View.AtomVisualizerController.add(element, false, true);
			if(element.g == 18) {
				//special handling for noble gasses
				CF.Controller.HandleNobleGasAttack(CF.GameModel.OpponentPlayer, CF.GameModel.MainPlayer);
			} else {
				CF.View.AddAutoRemovedText(CF.View.CanvasWidth/2, CF.View.CanvasHeight/2, "Choose Defenders", "#FFF", 20, 6000, 1000);
			}
		}
	} else if (CF.Controller.CurrentGameMode == CF.Controller.GameMode.PurchaseElements) {
		//give some cash to each player based on the turn#
		CF.GameModel.MainPlayer.AtomBucks += (CF.GameModel.CurrentTurn * 2);
		CF.GameModel.OpponentPlayer.AtomBucks += (CF.GameModel.CurrentTurn * 2);
		CF.View.PeriodicTable.populate();
		CF.GameModel.CurrentTurn++;
		
		if(CF.GameModel.CurrentTurn > 1) {
			CF.View.AddAutoRemovedText(CF.View.CanvasWidth/2, CF.View.CanvasHeight/2, "Purchase more Elements", "#FFF", 20, 6000, 1000);
		}
	}
};
