CF.View = {StratiscapeDraw:null,
			CanvasBackground:null,
			CanvasBackgroundLayer:null,
			ContextBackground:null,
			HeadsUpDisplay:null,
			CanvasBackgroundWidth: 960,
			CanvasBackgroundHeight: 640,
			CanvasWidth: 940,
			CanvasHeight: 620,
			DefaultFont: " 'Lucida Sans Unicode', 'Lucida Grande', sans-serif",
			PeriodicTable: null,
			PurchasedElementsGUIMain: null,
			PurchasedElementsGUIOpponent: null,
			AtomVisualizerController: null,
			BattleStageMessage1: null,
			BattleStageMessage2: null,
			BattleStageCompoundMessage: null,
			AutoRemovedTextObjects: []};
			
			
CF.View.Setup = function() {

	//how big?
	// samsung galaxy nexus res: 1280x720 (ratio 16:9) (720p)
	// iphone 4 res: 960x640 (ratio 3:2)(DVGA)
	// src: http://en.wikipedia.org/wiki/List_of_common_resolutions
	
	//	for now use 960 x 640, grid is a bit smaller for padding
	
	CF.View.StratiscapeDraw = new Stratiscape({'containerId':'canvasContainer',
								'canvasNotSupportedCallback':CF.View.CanvasNotSupported,
								'layers':[
									{'name':'canvasCFBackground', x:0, y:0, width:CF.View.CanvasBackgroundWidth, height:CF.View.CanvasBackgroundHeight,'zIndex':1,'backgroundColor':'black;'},
									{'name':'canvasCFForegroundHUD', x:10, y:10, width:CF.View.CanvasWidth, height:CF.View.CanvasHeight,'zIndex':2, 'clickCallback':CF.View.PlayfieldClicked, 'dblclickCallback':CF.View.PlayfieldDoubleClicked, 'mouseHitId':'canvasMouseHitDetector'}
								]
							});
	//if the canvas isn't supported by the browser, don't do anything else
	if(CF.View.StratiscapeDraw['canvasSupported']) {
		
		CF.View.CanvasBackgroundLayer = CF.View.StratiscapeDraw.getLayer('canvasCFBackground');
		CF.View.CanvasBackground = CF.View.CanvasBackgroundLayer.canvas;
		CF.View.ContextBackground = CF.View.CanvasBackgroundLayer.ctx;
		
		CF.View.CanvasItemAnimationsLayer = CF.View.StratiscapeDraw.getLayer('canvasCFForeground');
		CF.View.CanvasForegroundHUDLayer = CF.View.StratiscapeDraw.getLayer('canvasCFForegroundHUD');
		
		CF.View.ContextBackground.globalAlpha = 1.0;
		
		setInterval(function() { CF.View.StratiscapeDraw.draw() }, 1000/60);
		
		CF.View.SetupNewGame();
		
		CF.View.StartTutorial();
	}
};

CF.View.SetupNewGame = function() {
	CF.GameModel = new CF.Model();
	
	CF.Controller.CurrentGameMode = CF.Controller.GameMode.PurchaseElements;
	
	CF.View.CanvasForegroundHUDLayer.children = [];
	
	//add a "dictionary" of known compounds
	var knownCompoundDictionary = "";
	for(var c in CF.GameModel.Compounds){
		var compound = CF.GameModel.Compounds[c];
		knownCompoundDictionary += "<li>" + compound.toString() + "</li>";
	}
	knownCompoundDictionary = "<ul>" + knownCompoundDictionary + "</ul>";
	document.getElementById("knownCompoundList").innerHTML = knownCompoundDictionary;
	
	CF.View.HeadsUpDisplay = new CF.View.HUD();
	CF.View.CanvasForegroundHUDLayer.addChild(CF.View.HeadsUpDisplay); 
	
	CF.View.PeriodicTable = new CF.View.PeriodicTablePurchaseGUI(160, 250, CF.View.CanvasForegroundHUDLayer);
	
	CF.View.AtomVisualizerController = new CF.View.AtomVisualizer(CF.View.CanvasBackgroundLayer);
	CF.View.AtomVisualizerController.addAllElements();
	
	CF.View.PurchasedElementsGUIMain = new CF.View.PurchasedElementsGUI(20, CF.View.CanvasHeight - 80, CF.View.CanvasForegroundHUDLayer, CF.GameModel.MainPlayer);
	CF.View.PurchasedElementsGUIOpponent = new CF.View.PurchasedElementsGUI(20, 62, CF.View.CanvasForegroundHUDLayer, CF.GameModel.OpponentPlayer);
	
	
	CF.Controller.StartTurn();
};

window['SetupChemFight'] = CF.View.Setup;//exports this function to the global window object so that we can still call setup even after the Google Closure Compiler compresses all this

CF.View.CanvasNotSupported = function() {
	$('#startGameOptionsContainer').hide();
	$('#canvasContainer').html('<p style="color:white">Chem Fight requires an HTML 5 compatible browser.</p>');
};

CF.View.PlayfieldClicked = function(pos) {
	//console.log("Canvas PlayfieldClicked: (" + pos.x + "," + pos.y + ")");
	//get hex based on where mouse was clicked
	//var point = new CF.Point(pos.x, pos.y);
	
	if(CF.View.HeadsUpDisplay.onClick(pos.x, pos.y))
		return;
	
	switch(CF.Controller.CurrentGameMode) {
		case CF.Controller.GameMode.Play:
			break;
		case CF.Controller.GameMode.PurchaseElements:
				CF.View.PeriodicTable.onClick(pos.x, pos.y);
				CF.View.PurchasedElementsGUIMain.onClick(pos.x, pos.y);
			break;
		case CF.Controller.GameMode.ChooseAttacker:
		case CF.Controller.GameMode.ChooseDefenders:
				CF.View.PurchasedElementsGUIMain.onClick(pos.x, pos.y);
			break;
		case CF.Controller.GameMode.AnimatingBattle:
			break;
		case CF.Controller.GameMode.NextStage:
			break;
	}
};
/*
CF.View.PlayfieldDoubleClicked = function(pos) {
	console.log("Canvas PlayfieldDoubleClicked");
};
*/
/**
 * Returns the card to be selected if one was in the bounds or control bounds
 * 
 */
CF.View.OnElementCardContainerClick = function(x, y, layer, elementCards, selectedElementCard) {
	if(selectedElementCard) {
		//first check to see if the plus or minus buttons have been clicked on this card
		if(selectedElementCard.isPlusButtonInBounds(x, y)) {
			CF.Controller.ElementCardPlusButtonClicked(selectedElementCard.e);
			return selectedElementCard;
		} else if(selectedElementCard.isMinusButtonInBounds(x, y)) {
			CF.Controller.ElementCardMinusButtonClicked(selectedElementCard.e);
			return selectedElementCard;
		}
	}
	for(var ec in elementCards){
		var elementCard = elementCards[ec];
		if(elementCard.isInBounds(x, y)){
			if(selectedElementCard) {
				layer.removeChild(selectedElementCard);
			}
			var largeElementCard = new CF.View.ElementCard(elementCard.x - 20, elementCard.y - 20, elementCard.e, false);
			layer.addChild(largeElementCard);
			largeElementCard.updateFocused(true);
			
			return largeElementCard;
		}
	}
	return null;
};

CF.View.ClearAutoRemovedTexts = function() {
	for(var i in CF.View.AutoRemovedTextObjects){
		CF.View.AutoRemovedTextObjects[i].remove();
	}
	CF.View.AutoRemovedTextObjects = [];
};

CF.View.AddAutoRemovedText = function(x, y, text, color, fontSize, ttl, tbs) {
	var textObject = new CF.View.AutoRemovedText(x, y, text, color, fontSize, ttl, tbs);
	CF.View.AutoRemovedTextObjects.push(textObject);
	CF.View.CanvasForegroundHUDLayer.addChild(textObject);
};

CF.View.StartTutorial = function() {
	var tbs = 0, ttl=10000;
	CF.View.AddAutoRemovedText(CF.View.CanvasWidth/2 - 20, CF.View.CanvasHeight/2, "Welcome to Chem Fight", "#FFF", 20, ttl, 0);
	tbs += 5000;
	CF.View.AddAutoRemovedText(CF.View.CanvasWidth/2 - 20, CF.View.CanvasHeight/2 + 20, "Start by choosing atoms to purchase", "#FFF", 20, ttl + tbs, tbs);
	tbs += 5000;
	CF.View.AddAutoRemovedText(CF.View.CanvasWidth/2, CF.View.CanvasHeight/2 + 80, "Purchase atoms by clicking on an element", "#FFF", 20, ttl + tbs, tbs);
	CF.View.AddAutoRemovedText(CF.View.CanvasWidth/2, CF.View.CanvasHeight/2 + 100, "then click the plus (+) button to add one atom", "#FFF", 20, ttl + tbs, tbs);
	tbs += 5000;
	CF.View.AddAutoRemovedText(CF.View.CanvasWidth/2, CF.View.CanvasHeight/2 + 120, "Return purchased atoms by clicking on an element", "#FFF", 20, ttl + tbs, tbs);
	CF.View.AddAutoRemovedText(CF.View.CanvasWidth/2, CF.View.CanvasHeight/2 + 140, "then click the minus (-) button to remove the atom", "#FFF", 20, ttl + tbs, tbs);
};

/**
 * Our AtomVisualizer shows the elements each player has purchased
 * @constructor
 */
CF.View.AtomVisualizer = function(layer) {
	this.layer = layer;
	this.VisualizedAtoms = [];
	
	this.add = function(element, showAtomElement, restrictToMiddle) {
		var left = 0, right = CF.View.CanvasWidth, top = 0, bottom = CF.View.CanvasHeight;
		if(restrictToMiddle) {
			left = CF.View.CanvasWidth / 2 - 100;
			right = CF.View.CanvasWidth / 2 + 101;
			top = CF.View.CanvasHeight / 2 - 80;
			bottom = CF.View.CanvasHeight / 2 + 81;
		}
		var x = CF.Util.NextRandom(left, right);
		var y = CF.Util.NextRandom(top, bottom);
		var va = new CF.View.AtomVisualized(x, y, element, showAtomElement);
		this.VisualizedAtoms.push(va);
		this.layer.addChild(va);
		va.startUpdate();
	};
	
	this.remove = function(number) {
		for(var i = this.VisualizedAtoms.length - 1; i >= 0; i--) {
			var va = this.VisualizedAtoms[i];
			if(va.e.n == number) {
				va.endUpdate();
				this.layer.removeChild(va);
				this.VisualizedAtoms.splice(i, 1);
				break;
			}
		}
	};
	
	this.clear = function() {
		for(var a in this.VisualizedAtoms) {
			this.VisualizedAtoms[a].endUpdate();
			this.layer.removeChild(this.VisualizedAtoms[a]);
		}
		this.VisualizedAtoms = [];
	};
	
	this.addAllElements = function() {
		for(var e = CF.GameModel.Elements.length - 1; e >= 0; e--) {
			this.add(CF.GameModel.Elements[e], true, false);
		}
	};
	
	this.revealAllElements = function() {
		for(var a in this.VisualizedAtoms) {
			this.VisualizedAtoms[a].reveal();
		}
	};
	
	this.getVisualizedAtomByElement = function(number) {
		for(var a in this.VisualizedAtoms) {
			var va = this.VisualizedAtoms[a];
			if(number == va.e.n) {
				return va;
			}
		}
		return null;
	};
	
	this.moveElementsToCenter = function() {
		for(var a in this.VisualizedAtoms) {
			this.VisualizedAtoms[a].movingTowardsCenter = true;
			this.VisualizedAtoms[a].maxSpeed = 10;
		}
	};
	
	this.moveElementOffscreen = function(number, player) {
		for(var i = this.VisualizedAtoms.length - 1; i >= 0; i--) {
			var va = this.VisualizedAtoms[i];
			if(number == va.e.n) {
				va.movingTowardsCenter = false;
				va.movingOffScreen = true;
				va.maxSpeed = 10;
				va.speed = 10;
				if(player) {
					va.angle = player.AngleFromCenter;
				} else
					va.angle = Math.PI;
				
				this.VisualizedAtoms.splice(i, 1);
				break;
			}
		}
	};
	
	this.particleizeElementToPlayer = function(element, player) {
		var va = this.getVisualizedAtomByElement(element.n);
		if(va != null) {
			var targetUp = (player.AngleFromCenter == Math.PI * 5/4);
			for(var i = 0; i < va.e.n * 2; i ++)
				this.layer.addChild(new CF.View.AtomParticle(va.x, va.y, va.backgroundColor.toString(), targetUp));
			this.remove(element.n);
		}
	};
};

/**
 * Our PurchasedElementsGUI shows the elements each player has purchased
 * @constructor
 */
CF.View.PurchasedElementsGUI = function(x, y, layer, player) {
	this.x = x;
	this.y = y;
	this.layer = layer;
	this.player = player;
	
	this.selectedElementCard = null;
	
	this.elementCards = [];
	
	this.refresh = function() {
		var ownedElements = player.getOwnedAttackingAndDefendingElementsArray();
		
		//clear our the existing cards
		for(var ec in this.elementCards){
			this.layer.removeChild(this.elementCards[ec]);
		}
		this.elementCards = [];
		
		for(var oe in ownedElements) {
			var element = ownedElements[oe];
			var ec = new CF.View.ElementCard(x + oe * 40, y, element, true);
			
			//update element count
			ec.elementCount = this.player.getOwnedElementCount(element.n);
			this.elementCards.push(ec);
			this.layer.addChild(ec);
		}
		
		//make sure the selected card is on top
		if(this.selectedElementCard) {	
			this.layer.removeChild(this.selectedElementCard);
			if(CF.GameModel.MainPlayer.getOwnedElementCount(this.selectedElementCard.e.n) == 0)
				this.selectedElementCard = null;//if we don't have any more, hide the big selected card
			else
				this.layer.addChild(this.selectedElementCard);
		}
	};
	
	this.deselect = function() {
		if(this.selectedElementCard) {
			this.layer.removeChild(this.selectedElementCard);
			this.selectedElementCard = null;
		}
	};
	/**
	 * Returns true if the click was handled
	 */
	this.onClick = function(x, y) {
		var newSelectedElementCard = CF.View.OnElementCardContainerClick(x, y, this.layer, this.elementCards, this.selectedElementCard);
		var ret = (newSelectedElementCard != null);
		if(!ret)
			this.deselect();
		else
			this.selectedElementCard = newSelectedElementCard;
		return ret;
	};
};

/**
 * Our PeriodicTable shows the known elements and can allow clicking depending on game mode
 * @constructor
 */
CF.View.PeriodicTablePurchaseGUI = function(x, y, layer) {
	this.x = x;
	this.y = y;
	this.layer = layer;
	this.selectedElementCard = null;
	
	this.elementCards = [];
	
	
	this.deselect = function() {
		if(this.selectedElementCard) {
			this.layer.removeChild(this.selectedElementCard);
			this.selectedElementCard = null;
		}
	};
	
	/**
	 * Returns true if the click was handled
	 */
	this.onClick = function(x, y) {
		var newSelectedElementCard = CF.View.OnElementCardContainerClick(x, y, this.layer, this.elementCards, this.selectedElementCard);
		var ret = (newSelectedElementCard != null);
		if(!ret)
			this.deselect();
		else
			this.selectedElementCard = newSelectedElementCard;
		return ret;
	};
	
	this.populate = function() {
		for(var e in CF.GameModel.Elements) {
			var element = CF.GameModel.Elements[e];
			var ec = new CF.View.ElementCard(x + (element.g - 1) * 40, y + (element.p - 1) * 40, element, false);
			this.elementCards.push(ec);
			layer.addChild(ec);
		}
	};
	
	this.clear = function() {
		this.deselect();
		for(var ec in this.elementCards) {
			this.layer.removeChild(this.elementCards[ec]);
		}
		this.elementCards = [];
	};
};

/**
 * Our Heads up display shows points and current game status
 * @constructor
 */
CF.View.HUD = Stratiscape.DrawnObject.extend({ //HUD drawn object class
	
	/**
	 * initializes this HUD
	 * @this {CF.View.HUD}
	 */
	init: function() {
		this.widthBoard = 200;
		this.heightBoard = 50;
		this.xBoard = CF.View.CanvasWidth - this.widthBoard - 1;
		this.yBoard1 = CF.View.CanvasHeight - this.heightBoard - 2;
		this.yBoard2 = 2;
		
		this.gameControlButtonVisible = false;
		this.gameControlButtonText = null;
		this.gameControlButtonWidth = this.widthBoard;
		this.gameControlButtonHeight = this.heightBoard;
		this.gameControlButtonX = this.xBoard;
		this.gameControlButtonY = this.yBoard1 - this.heightBoard - 25;
	},
	
	/**
	 * draws the HUD to the canvas
	 * @this {CF.View.HUD}
	 */
	draw: function(ctx) {
		
		if(CF.Controller.CurrentGameMode == CF.Controller.GameMode.GameOverYouLose || 
			CF.Controller.CurrentGameMode == CF.Controller.GameMode.GameOverYouWin ||
			CF.Controller.CurrentGameMode == CF.Controller.GameMode.NextRound) {
			//Draw a ScoreBoard and then let the user either start over or go to the next round
			
			var bw=300, bh=100;
			var bx=(CF.View.CanvasWidth - bw)/2, by=(CF.View.CanvasHeight - bh)/2 - bh;
			ctx.globalAlpha = 0.4;
			ctx.fillStyle = "rgba(51, 102, 153, 25)";
			ctx.fillRect(bx,by,bw,bh);
			ctx.globalAlpha = 1.0;
			ctx.strokeStyle = "#008000";
			ctx.strokeRect(bx,by,bw,bh);

			
			ctx.textAlign = "center";
			ctx.textBaseline = 'middle';
			ctx.font = "bolder 20px" + CF.View.DefaultFont;
			ctx.fillStyle = '#FE0';
			
			ctx.fillText("Your Score:", bx + bw/2, by + bh/2);
			ctx.fillText(CF.GameModel.MainPlayer.Points + "",  bx + bw/2, by + bh/2 + 40);
			
		} else {
			this.drawPlayerStatusBoard(ctx, this.yBoard1, CF.GameModel.MainPlayer);
			this.drawPlayerStatusBoard(ctx, this.yBoard2, CF.GameModel.OpponentPlayer);
		}
		
		ctx.font = "bolder 14px" + CF.View.DefaultFont;
		ctx.fillStyle = '#FFF';
		
		ctx.textAlign = "left";
		ctx.textBaseline = 'top';
		ctx.fillText("Enemy Elements", 0, 0);
		ctx.textBaseline = 'bottom';
		ctx.fillText("Your Elements", 0, CF.View.CanvasHeight);
		
		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		
		//Draw Round and Turn
		ctx.fillText("Round: " + CF.GameModel.CurrentRound + ", Turn: " + CF.GameModel.CurrentTurn,  CF.View.CanvasWidth/2, 14);
		
		var textStartX = this.widthBoard/2 + 25;
		var textStartY = 125;
		//Draw information about the current game mode
		switch(CF.Controller.CurrentGameMode) {
			case CF.Controller.GameMode.PurchaseElements:
				ctx.fillText("Choose Elements to Purchase", textStartX, textStartY);
				ctx.fillStyle = '#FE0';
				ctx.font = "12px" + CF.View.DefaultFont;
				textStartY += 14;
				ctx.fillText("Your current Atom Bucks are shown below", textStartX, textStartY);
				textStartY += 14;
				ctx.fillText("1 Atom Buck = 1 Proton (Atomic Number)", textStartX, textStartY);
				textStartY += 14;
				ctx.fillText("(i.e. Helium costs 2 Atom Bucks each)", textStartX, textStartY);
				textStartY += 14;
				ctx.fillText("After spending all your Atom Bucks,", textStartX, textStartY);
				textStartY += 14;
				ctx.fillText("click the Done button.", textStartX, textStartY);
				textStartY += 14;
				ctx.fillStyle = '#00F';
				ctx.fillText("Noble gases are great for attacking,", textStartX, textStartY);
				textStartY += 14;
				ctx.fillText("but cannot be used for defense.", textStartX, textStartY);
				textStartY += 14;
				ctx.fillText("Noble gases cost energy to purchase.", textStartX, textStartY);
				break;
			case CF.Controller.GameMode.ChooseAttacker:
				ctx.fillText("Choose an Attacking Element", textStartX, textStartY);
				ctx.fillStyle = '#FE0';
				ctx.font = "12px" + CF.View.DefaultFont;
				textStartY += 14;
				ctx.fillText("If your element does not form a compound", textStartX, textStartY);
				textStartY += 14;
				ctx.fillText("with the opponents defending elements,", textStartX, textStartY);
				textStartY += 14;
				ctx.fillText("it is considered a successful attack", textStartX, textStartY);
				textStartY += 14;
				ctx.fillText("and the enemy looses life.", textStartX, textStartY);
				textStartY += 14;
				ctx.fillStyle = '#00F';
				ctx.fillText("Noble gases cannot be defended against.", textStartX, textStartY);
				break;
			case CF.Controller.GameMode.ChooseDefenders:
				ctx.fillText("Choose Elements to Defend with", textStartX, textStartY);
				ctx.fillStyle = '#FE0';
				ctx.font = "12px" + CF.View.DefaultFont;
				textStartY += 14;
				ctx.fillText("If your chosen elements form a compound", textStartX, textStartY);
				textStartY += 14;
				ctx.fillText("with the opponents attacking element,", textStartX, textStartY);
				textStartY += 14;
				ctx.fillText("it is considered a successful defense.", textStartX, textStartY);
				textStartY += 14;
				ctx.fillText("Unused defensive elements deduct energy,", textStartX, textStartY);
				textStartY += 14;
				ctx.fillText("insufficient energy results in loss of life.", textStartX, textStartY);
				textStartY += 14;
				ctx.fillStyle = '#00F';
				ctx.fillText("Noble gases cannot be used for defense.", textStartX, textStartY);
				break;
			case CF.Controller.GameMode.AnimatingBattle:
			case CF.Controller.GameMode.NextStage:
				ctx.fillText("The Battle Ensues", textStartX, textStartY);
				ctx.fillStyle = '#FE0';
				ctx.font = "12px" + CF.View.DefaultFont;
				textStartY += 14;
				var attackingText = "";
				var defendingText1 = "";
				var defendingText2 = "";
				if(CF.GameModel.MainPlayer.AttackingElement === null) {
					//You are the defender
					defendingText1 = "You are defending with:"
					defendingText2 = CF.GameModel.MainPlayer.getDefendingElementsString();
					attackingText = "Opponent is attacking with " + CF.GameModel.OpponentPlayer.AttackingElement.s;
				} else {
					//You are attacking
					attackingText = "You are attacking with " + CF.GameModel.MainPlayer.AttackingElement.s;
					defendingText1 = "Opponent is defending with:";
					defendingText2 = CF.GameModel.OpponentPlayer.getDefendingElementsString();
				}
				ctx.fillText(attackingText, textStartX, textStartY);
				textStartY += 14;
				ctx.fillText(defendingText1, textStartX, textStartY);
				textStartY += 14;
				ctx.fillText(defendingText2, textStartX, textStartY);
				break;
			case CF.Controller.GameMode.NextRound:
				ctx.fillText("You defeated your Opponent!", textStartX, textStartY);
				break;
			case CF.Controller.GameMode.GameOverYouWin:
				ctx.fillText("You defeated all Opponents!", textStartX, textStartY);
				break;
			case CF.Controller.GameMode.GameOverYouLose:
				ctx.fillText("Your Opponent defeated You!", textStartX, textStartY);
				break;
		}
		
		
		this.gameControlButtonVisible = false;
		if(CF.Controller.CurrentGameMode == CF.Controller.GameMode.PurchaseElements &&
			(CF.GameModel.MainPlayer.AtomBucks == 0 || CF.GameModel.CurrentTurn > 1)) {
			this.gameControlButtonVisible = true;
			this.gameControlButtonText = "Done Purchasing Elements";
		} else if(CF.Controller.CurrentGameMode == CF.Controller.GameMode.ChooseDefenders) {
			this.gameControlButtonVisible = true;
			this.gameControlButtonText = "Done Choosing Defenders";
		} else if(CF.Controller.CurrentGameMode == CF.Controller.GameMode.ChooseAttacker && 
			CF.GameModel.MainPlayer.AttackingElement !== null) {
			this.gameControlButtonVisible = true;
			this.gameControlButtonText = "Done Choosing Attacker";
		} else if(CF.Controller.CurrentGameMode == CF.Controller.GameMode.NextStage) {
			this.gameControlButtonVisible = true;
			this.gameControlButtonText = "Continue";
		} else if(CF.Controller.CurrentGameMode == CF.Controller.GameMode.NextRound) {
			this.gameControlButtonVisible = true;
			this.gameControlButtonText = "Next Round";
		} else if(CF.Controller.CurrentGameMode == CF.Controller.GameMode.GameOverYouLose) {
			this.gameControlButtonVisible = true;
			this.gameControlButtonText = "Try Again";
		} else if(CF.Controller.CurrentGameMode == CF.Controller.GameMode.GameOverYouWin) {
			this.gameControlButtonVisible = true;
			this.gameControlButtonText = "Play Again";
		}
		
		if(this.gameControlButtonVisible) {
			ctx.font = "bolder 12px" + CF.View.DefaultFont;
			ctx.fillStyle = '#FE0';
			ctx.fillText(this.gameControlButtonText, this.gameControlButtonX + this.gameControlButtonWidth/2, this.gameControlButtonY + this.gameControlButtonHeight/2);
			
			ctx.strokeStyle = "#008000";
			ctx.strokeRect(this.gameControlButtonX,this.gameControlButtonY,this.gameControlButtonWidth,this.gameControlButtonHeight);
		}
		
		//periodic table family legend
		var legendStartX = 0;
		var legendStartY = 250;
		ctx.font = "12px" + CF.View.DefaultFont;
		ctx.textAlign = "left";
		ctx.textBaseline = 'top';
		for(var f in CF.GameModel.ElementFamilies) {
			var ef = CF.GameModel.ElementFamilies[f];
			ctx.fillStyle = ef.color;
			ctx.fillRect(legendStartX, legendStartY, 18, 18);
			ctx.fillText(ef.n, legendStartX + 25, legendStartY);
			legendStartY += 25;
		}
		
		ctx.font = "16px" + CF.View.DefaultFont;
		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillStyle = "#FE0";
		//when player is defending, show the chosen Attacking Element's Valence Electron count
		if(CF.Controller.CurrentGameMode == CF.Controller.GameMode.ChooseDefenders) {
			if(CF.GameModel.OpponentPlayer.AttackingElement != null) {
				var veText = CF.GameModel.OpponentPlayer.AttackingElement.v == 1 ? " valence electron." : " valence electrons.";
				ctx.fillText("Opponent's Attacking Element has: " + CF.GameModel.OpponentPlayer.AttackingElement.v + veText, CF.View.CanvasWidth/2, CF.View.CanvasHeight/4);
			}
		} else if(CF.Controller.CurrentGameMode == CF.Controller.GameMode.AnimatingBattle) {
			ctx.fillText("Checking for valid compounds for defense against: " + CF.GameModel.getAttackingPlayer().AttackingElement.e, CF.View.CanvasWidth/2, CF.View.CanvasHeight/4);
		} else if(CF.Controller.CurrentGameMode == CF.Controller.GameMode.NextStage) {
			ctx.fillText(CF.View.BattleStageMessage1, CF.View.CanvasWidth/2, CF.View.CanvasHeight/4);
			var battleMessageY = 20;
			ctx.fillStyle = '#FFF';
			if(CF.View.BattleStageCompoundMessage !== null) {
				ctx.fillText(CF.View.BattleStageCompoundMessage, CF.View.CanvasWidth/2, CF.View.CanvasHeight/4 + battleMessageY);
				battleMessageY += 20;
			}
			if(CF.View.BattleStageMessage2 !== null) {
				ctx.fillText(CF.View.BattleStageMessage2, CF.View.CanvasWidth/2, CF.View.CanvasHeight/4 + battleMessageY);
			}
		}
		
	},
	
	/**
	 * draws the HUD Element Electron Configuration Board 
	 * @this {CF.View.HUD}
	 */
	drawElementElectronConfigurationBoard: function(ctx) {
		
	},
	
	/**
	 * draws the HUD Player Status Board
	 * @this {CF.View.HUD}
	 */
	drawPlayerStatusBoard: function(ctx, y, player) {
		//scoreboard
		ctx.globalAlpha = 0.4;
		ctx.fillStyle = "rgba(51, 102, 153, 25)";
		ctx.fillRect(this.xBoard,y,this.widthBoard,this.heightBoard);
		ctx.globalAlpha = 1.0;
		ctx.strokeStyle = "#008000";
		ctx.strokeRect(this.xBoard,y,this.widthBoard,this.heightBoard);

		
		ctx.textAlign = "left";
		ctx.textBaseline = 'top';
		ctx.font = "bolder 12px" + CF.View.DefaultFont;
		ctx.fillStyle = '#FE0';
		
		//draw player name
		ctx.fillText(player.Name, this.xBoard + 2, y);
		
		ctx.font = "bolder 25px" + CF.View.DefaultFont;
		//draw icons for health, energy and money
		//heart
		ctx.fillStyle = "#800000";
		ctx.beginPath();
		var r = 16;
		var oy = y + 25;
		var ox = this.xBoard;
		ctx.arc(ox + r,oy,r/2,0,Math.PI*2,true);
		ctx.arc(ox + (r * 2),oy,r/2,0,Math.PI*2,true);
		ctx.closePath();
		ctx.fill();
		ctx.beginPath();
		oy += 2;
		ctx.moveTo(ox + r/2, oy);
		ctx.lineTo(ox + r*2.5, oy);
		ctx.lineTo(ox + r*1.5, oy + r*1.4);
		ctx.closePath();
		ctx.fill();
		ox += 40;
		ctx.fillText(player.Life + "", ox, y + 14);
		
		oy -= 2 + r/2;
		ox += 40;
		//lightning bolt
		r = r/2;
		var ldy = r/3.0;
		var ldx = r * 2/3.0;
		ctx.fillStyle = "#00F";
		ctx.strokeStyle = "#00F";
		ctx.beginPath();
		ctx.moveTo(ox, oy);
		var lArr = [ox + r, oy + r,
					ox, oy + r,
					ox + r, oy + r*2,
					ox, oy + r*2,
					ox + r, oy + r*3,
					ox + ldx, oy + ldy + r*2,
					ox + ldx + r, oy + ldy + r*2,
					ox + ldx, oy + ldy + r,
					ox + ldx + r, oy + ldy + r
					];
		for(var i = 0; i < lArr.length; i+=2){
			ctx.lineTo(lArr[i], lArr[i+1]);
		}
		ctx.closePath();
		ctx.stroke();
		ctx.fill();
		ox += 16;
		ctx.fillText(player.Energy + "", ox, y + 14);
		
		//dollar sign
		
		ox += 40;
		ctx.fillStyle = '#FE0';
		var scoreText = "$" + player.AtomBucks;
		ctx.fillText(scoreText, ox, y + 14);
	},
	/**
	 * Returns true if the click was handled
	 * @this {CF.View.HUD}
	 */
	onClick: function(x, y) {
		if(this.gameControlButtonVisible &&
			this.gameControlButtonX < x && x < this.gameControlButtonX + this.gameControlButtonWidth &&
			this.gameControlButtonY < y && y < this.gameControlButtonY + this.gameControlButtonHeight) {
			CF.Controller.GotoNextGameMode();
			return true;
		}
		
		return false;
	}
});

/**
 * ElectronShellBox is a representation of 1 box that will hold two electrons with opposite spins
 * @constructor
 */
CF.View.ElectronShellBox = Stratiscape.DrawnObject.extend({ //ElectronShellBox drawn object class
	
	/**
	 * initializes this ElectronShellBox
	 * @this {CF.View.ElectronShellBox}
	 */
	init: function(x, y, eCount) {
		this.s = 20;//box size
		this.x = x;
		this.y = y;
		this.eCount = eCount;//0, 1 or 2
	},
	
	/**
	 * draws the ElectronShellBox to the canvas
	 * @this {CF.View.ElectronShellBox}
	 */
	draw: function(ctx) {
		ctx.strokeStyle = '#008000';
		ctx.strokeRect(this.x, this.y, this.s, this.s);
		
		if(this.eCount > 0) {
			ctx.lineWidth = 2;

			ctx.beginPath();
			ctx.moveTo(this.x + 6, this.y + 2);
			ctx.lineTo(this.x + 6, this.y + 17);
			ctx.lineTo(this.x + 10, this.y + 13);

			if(this.eCount > 1) {
				ctx.moveTo(this.x + 14, this.y + 2);
				ctx.lineTo(this.x + 14, this.y + 17);
				ctx.lineTo(this.x + 18, this.y + 13);
			}
			ctx.stroke();
			ctx.closePath();
		}
	}
	
});


/**
 * ElementCard is a representation of 1 element
 * @constructor
 */
CF.View.ElementCard = Stratiscape.DrawnObject.extend({ //ElementCard drawn object class
	
	/**
	 * initializes this ElementCard
	 * @this {CF.View.ElementCard}
	 */
	init: function(x, y, e, showElementCount) {
		this.s = 40;//box size
		this.x = x;
		this.y = y;
		this.e = e;
		
		this.backgroundColor = e.f.color;
		
		this.focused = false;
		this.buttonSize = 16;
		this.plusX = x + 45;
		this.plusY = y + 5;
		this.minusX = x + 25;
		this.minusY = y + 5;
		
		this.showElementCount = showElementCount;
		this.elementCount = 0;
	},
	
	/**
	 * draws the ElementCard to the canvas
	 * @this {CF.View.ElementCard}
	 */
	draw: function(ctx) {
		var size = this.focused ? this.s * 2 : this.s;
		ctx.lineWidth = 2;
		ctx.strokeStyle = '#000';
		ctx.fillStyle = this.backgroundColor;
		ctx.fillRect(this.x, this.y, size, size);
		ctx.strokeRect(this.x, this.y, size, size);
		
		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.font = (size/4)+"px" + CF.View.DefaultFont;
		ctx.fillStyle = '#000';
		ctx.fillText(this.e.n, this.x + (size/8) + 1, this.y + (size/8));
		
		ctx.font = "bolder "+size/2+"px" + CF.View.DefaultFont;
		ctx.fillText(this.e.s, this.x + size/2, this.y + size/2);
		
		//draw element name if we are focused
		if(this.focused) {
			ctx.font = (size/6)+"px" + CF.View.DefaultFont;
			ctx.fillText(this.e.e, this.x + size/2, this.y + size - (size/8));
			
			var drawPlus = false;
			var drawMinus = false;
			if(CF.Controller.CurrentGameMode == CF.Controller.GameMode.PurchaseElements) {
				//draw plus minus button controls (if appropriate based on $ and already purchased elements)
				
				if(CF.GameModel.MainPlayer.canPurchaseElement(this.e)) {
					drawPlus = true;
				}
				
				if(CF.GameModel.MainPlayer.getOwnedElementCount(this.e.n) != 0) {
					drawMinus = true;
				}
				
			} else if(CF.Controller.CurrentGameMode == CF.Controller.GameMode.ChooseDefenders) {
				if(CF.GameModel.MainPlayer.getOwnedElementCount(this.e.n) != 0 && this.e.g != 18) {
					drawPlus = true;
				}
				
				if(CF.GameModel.MainPlayer.getDefendingElementCount(this.e.n) != 0) {
					drawMinus = true;
				}
			} else if(CF.Controller.CurrentGameMode == CF.Controller.GameMode.ChooseAttacker) {
				if(CF.GameModel.MainPlayer.AttackingElement === null ) {
					drawPlus = true;
				} else if(CF.GameModel.MainPlayer.AttackingElement.n == this.e.n) {
					drawMinus = true;
				}
			}
			
			ctx.strokeStyle = "#000";
			ctx.beginPath();
			if(drawPlus) {
				ctx.fillStyle = '#008000';
				ctx.fillRect(this.plusX, this.plusY, this.buttonSize, this.buttonSize);
				ctx.moveTo(this.plusX + 2, this.plusY + this.buttonSize/2);
				ctx.lineTo(this.plusX + this.buttonSize - 2, this.plusY + this.buttonSize/2);
				ctx.moveTo(this.plusX + this.buttonSize/2, this.plusY + 2);
				ctx.lineTo(this.plusX + this.buttonSize/2, this.plusY + this.buttonSize - 2);
			}
			
			if(drawMinus) {
				ctx.fillStyle = '#800000';
				ctx.fillRect(this.minusX, this.minusY, this.buttonSize, this.buttonSize);
				ctx.moveTo(this.minusX + 2, this.minusY + this.buttonSize/2);
				ctx.lineTo(this.minusX + this.buttonSize - 2, this.minusY + this.buttonSize/2);
			}
			ctx.stroke();
			ctx.closePath();
			
			//draw electron configuration (this will need to change when we go above Ca)
			var electronShells = [2, 8, 8, 2];
			ctx.font = "10px" + CF.View.DefaultFont;
			ctx.fillStyle = '#000';
			ctx.textBaseline = 'top';
			var electronCount = 0;
			var lastElectronCount = 0;
			var done = false;
			for(var i in electronShells) {
				electronCount += electronShells[i];
				var text = electronShells[i]
				if(this.e.n < electronCount) {
					text = this.e.n - lastElectronCount + "";
					done = true;
				}
				ctx.fillText(text, this.x + size - 8, this.y + (10 * i));
				lastElectronCount = electronCount;
				if(done)
					break;
			}
		}

		if(this.showElementCount) {
			ctx.fillStyle = '#00F';
			ctx.beginPath();
			ctx.arc(this.x + size/2,this.y - 30,15,0,Math.PI*2,true);
			ctx.closePath();
			ctx.fill();
			
			ctx.fillStyle = '#FE0';
			ctx.font = "16px" + CF.View.DefaultFont;
			ctx.fillText(this.elementCount + "", this.x + size/2, this.y - 30);
		}
		
	},
	
	isInBounds: function(x, y) {
		return (this.x < x && x < this.x + this.s &&
				this.y < y && y < this.y + this.s);
	},
	
	isPlusButtonInBounds: function(x, y){
		return (this.plusX < x && x < this.plusX + this.buttonSize &&
				this.plusY < y && y < this.plusY + this.buttonSize);
	},
	
	isMinusButtonInBounds: function(x, y){
		return (this.minusX < x && x < this.minusX + this.buttonSize &&
				this.minusY < y && y < this.minusY + this.buttonSize);
	},
	
	updateFocused: function(focused) {
		this.focused = focused;
		this.layer.needsDisplay = true;
	}
	
});

/**
 * AtomVisualized is a representation of 1 atom of an element
 * @constructor
 */
CF.View.AtomVisualized = Stratiscape.DrawnObject.extend({ //AtomVisualized drawn object class
	
	/**
	 * initializes this AtomVisualized
	 * @this {CF.View.AtomVisualized}
	 */
	init: function(x, y, e, showAtomElement) {
		this.x = x;
		this.y = y;
		this.e = e;
		
		this.backgroundColor = CF.Util.GetColorRGBAFromHexString(e.f.color);
		
		
		this.showAtomElement = showAtomElement;
		this.r = 10 + this.e.n * 2;
		if(!showAtomElement) {
			this.r = 20;
		}
		
		this.speed = 1;
		this.angle = CF.Util.NextRandom(0, 360) * Math.PI/180; //in radians
		
		this.maxSpeed = 4;
		this.updating = false;
		this.movingTowardsCenter = false;
		this.movingOffScreen = false;
	},
	
	/**
	 * draws the AtomVisualized to the canvas
	 * @this {CF.View.AtomVisualized}
	 */
	draw: function(ctx) {
		var color = this.backgroundColor.clone();
		ctx.fillStyle = color.toString();
		ctx.strokeStyle = "#FFF";
		
		if(!this.showAtomElement) {
			color = new CF.Util.ColorRGBA(255, 255, 255, 255);
			ctx.fillStyle = color.toString();
		}
		//create radial gradient
		var r3 = this.r * 3;
		var radgrad = ctx.createRadialGradient( this.x,
												this.y,
												1,
												this.x,
												this.y,
												r3);
		
		radgrad.addColorStop(0, color.toString());
		color.a = 0;
		radgrad.addColorStop(1, color.toString());
		ctx.fillStyle = radgrad;
		ctx.fillRect(this.x - r3,this.y - r3,r3 * 2,r3 * 2); 
		
		
		ctx.beginPath();
		ctx.arc(this.x,this.y,this.r,0,Math.PI*2,true);
		ctx.closePath();
		ctx.fill();
		
		if(this.showAtomElement) {
			ctx.textAlign = "center";
			ctx.textBaseline = 'middle';
			ctx.font = "20px" + CF.View.DefaultFont;
			ctx.fillStyle = '#000';
			ctx.fillText(this.e.s, this.x, this.y);
		}
	},
	
	reveal: function() {
		if(!this.showAtomElement) {
			this.r = 10 + this.e.n * 2;
			this.showAtomElement = true;
			this.layer.needsDisplay = true;
		}
	},
	
	startUpdate: function() {
		this.updating = true;
		this.update();
	},
	
	endUpdate: function() {
		this.updating = false;
	},
	
	outOfBounds: function() {
		return (this.x - this.r < 0 || this.y - this.r < 0 || this.x + this.r > CF.View.CanvasWidth || this.y + this.r > CF.View.CanvasHeight);
	},
	
	/**
	 * moves the AtomVisualized a tick
	 * @this {CF.View.AtomVisualized}
	 */
	update: function() {
		
		//check if we are out of bounds, if so angle towards center
		var oob = this.outOfBounds();
		if(this.movingOffScreen) {
			this.speed = this.maxSpeed;
			if(oob) {
				this.endUpdate();
				this.layer.removeChild(this);
				return;
			}
		}
		else if(this.movingTowardsCenter || oob) {
			var dx = CF.View.CanvasWidth/2 - this.x;
			var dy = CF.View.CanvasHeight/2 - this.y;
			this.angle = Math.atan2(dy,dx);
		}
		else {
			var angleChange = CF.Util.NextRandom(-10, 12);
			this.angle += (angleChange * Math.PI / 180);
		}
		
		this.speed += CF.Util.NextRandom(-1, 2);
		if(this.speed < 0) this.speed = 0;
		
		//if(this.speed < -this.maxSpeed) this.speed = -this.maxSpeed;
		if(this.speed > this.maxSpeed) this.speed = this.maxSpeed;
	
		if(this.speed != 0)
		{
			this.x += this.speed * Math.cos(this.angle);
			this.y += this.speed * Math.sin(this.angle);
		}
		
		if(this.updating) {
			var me = this;
			setTimeout(function() { me.update(); }, 100);
			this.layer.needsDisplay = true;
		}
	}
});

/**
 * AtomParticle is a representation of protons and neutrons which "explode" when an attack is successful
 * @constructor
 */
CF.View.AtomParticle = Stratiscape.DrawnObject.extend({ //AtomParticle drawn object class
	
	/**
	 * initializes this AtomParticle
	 * @this {CF.View.AtomParticle}
	 */
	init: function(x, y, color, targetUp) {
		this.x = x;
		this.y = y;
		this.color = color;
		this.speed = CF.Util.NextRandom(30, 51);
		//var degrees = y > CF.View.CanvasHeight * 3/4 ? CF.Util.NextRandom(1, 180) : y < CF.View.CanvasHeight/4  ?  CF.Util.NextRandom(180, 360) : CF.Util.NextRandom(0, 360);
		var degrees = targetUp ? CF.Util.NextRandom(180, 360) : CF.Util.NextRandom(1, 180);
		this.angle = degrees * Math.PI/180;
		var me = this;
		setTimeout(function() { me.update(); }, 10);
	},
	
	/**
	 * draws the AtomParticle to the canvas
	 * @this {CF.View.AtomParticle}
	 */
	draw: function(ctx) {
		var r = 5;
		ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.arc(this.x,this.y,r,0,Math.PI*2,true);
		ctx.closePath();
		ctx.fill();
	},
	 /**
	 * moves the AtomParticle a tick
	 * @this {CF.View.AtomParticle}
	 */
	update: function() {
		this.speed -= CF.Util.NextRandom(0, 2);
		
		if(this.speed > 0) {
			this.x += this.speed * Math.cos(this.angle);
			this.y += this.speed * Math.sin(this.angle);
		}
		
		if(this.speed > 0) {
			var me = this;
			setTimeout(function() { me.update(); }, 50);
			if(this.layer)
				this.layer.needsDisplay = true;
		} else {
			this.layer.removeChild(this);
		}
	}
});


/**
 * AutoRemovedText is a simple drawn text object with a time to live
 * @constructor
 */
CF.View.AutoRemovedText = Stratiscape.DrawnObject.extend({ //AutoRemovedText drawn object class
	
	/**
	 * initializes this AtomParticle
	 * @this {CF.View.AutoRemovedText}
	 */
	init: function(x, y, text, color, fontSize, ttl, tbs) {
		this.x = x;
		this.y = y;
		this.text = text;
		this.color = color;
		this.font = fontSize + "px" + CF.View.DefaultFont;
		this.ttl = ttl;//passed in units are milliseconds
		this.tbs = tbs;//time before showing (in milliseconds)
		this.alpha = 1.0;
		if(this.tbs > 0) {
			this.alpha = 0;
		}
		var me = this;
		setTimeout(function() { me.remove(); }, ttl);
		this.update();
	},
	
	/**
	 * draws the AutoRemovedText to the canvas
	 * @this {CF.View.AutoRemovedText}
	 */
	draw: function(ctx) {
		
		ctx.globalAlpha = this.alpha;
		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillStyle = this.color;
		ctx.font = this.font;
		ctx.fillText(this.text, this.x, this.y);
		ctx.globalAlpha = 1.0;
	},
	/**
	 * changes ttl and alpha
	 * @this {CF.View.AutoRemovedText}
	 */
	update: function() {
		this.ttl -= 200;
		if(this.ttl <= 2000 && this.alpha > 0.09){
			this.alpha -= 0.1;
		} else if(this.tbs >= 200) {
			this.tbs -= 200;
			if(this.tbs <= 2000 && this.alpha < 0.91)
				this.alpha += 0.1;
			if(this.tbs <= 0)
				this.alpha = 1.0;
		}
		if(this.layer) 
			this.layer.needsDisplay = true;
			
		var me = this;
		setTimeout(function() { if(me.layer) me.update(); }, 200);
	},
	/**
	 * removes the AutoRemovedText from the canvas
	 * @this {CF.View.AutoRemovedText}
	 */
	 remove: function() {
		if(this.layer)
			this.layer.removeChild(this);
	 }
});