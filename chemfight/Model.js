/**
 * Model is our global game structure
 * @constructor
 */
CF.Model = function() {

	this.Elements = null;
	this.Compounds = null;
	this.ElementFamilies = null;
	
	this.CreateElementFamilies();
	
	this.CreateElements();
	this.CreateCompounds();
	this.AssignElementDynamicProperties();
	this.AssignAllCompoundParticipants();
	
	this.CurrentTurn = 0;
	this.CurrentRound = 1;
	
	this.MainPlayer = new CF.Player("You", Math.PI * 3/4);
	this.OpponentPlayer = new CF.Player("Enemy", Math.PI * 5/4);
};

CF.Model.prototype.roundOver = function() {
	//give the player a bonus based on how quick the round was over
	//since each turn/phase we give the player AtomBucks += round * 2, give the OpponentPlayer some more AtomBucks
	this.OpponentPlayer.AtomBucks += this.CurrentTurn; 

	this.MainPlayer.roundOver(this.CurrentRound);
	this.OpponentPlayer.roundOver(this.CurrentRound);
	
	this.MainPlayer.Points -= this.OpponentPlayer.Points;
	this.MainPlayer.Points += (this.CurrentRound * 1000);
	this.OpponentPlayer.Points = 0;
};

CF.Model.prototype.nextRound = function() {
	this.CurrentTurn = 0;
	this.CurrentRound++;
};

CF.Model.prototype.getDefendingPlayer = function() {
	if(CF.GameModel.MainPlayer.AttackingElement === null){
		return CF.GameModel.MainPlayer;
	} else {
		return CF.GameModel.OpponentPlayer;
	}
};

CF.Model.prototype.getAttackingPlayer = function() {
	if(CF.GameModel.MainPlayer.AttackingElement === null){
		return CF.GameModel.OpponentPlayer;
	} else {
		return CF.GameModel.MainPlayer;
	}
};

CF.Model.prototype.CreateElementFamilies = function() {
	this.ElementFamilies = {};
	this.ElementFamilies[0] = new CF.Model.ElementFamily('Non-Metals','#0F0');
	this.ElementFamilies[1] = new CF.Model.ElementFamily('Noble gases','#09F');
	this.ElementFamilies[2] = new CF.Model.ElementFamily('Alkali Metals','#F90');
	this.ElementFamilies[3] = new CF.Model.ElementFamily('Alkaline earth metals','#FE0');
	this.ElementFamilies[4] = new CF.Model.ElementFamily('Metalloids','#9C9');
	this.ElementFamilies[5] = new CF.Model.ElementFamily('Halogens','#0F9');
	this.ElementFamilies[6] = new CF.Model.ElementFamily('Post-transition metals','#CCC');
};

CF.Model.prototype.DetermineBestReaction = function(playerAttacker, playerDefender) {

	// the highest weight compound is the best match
	var candidateCompounds = CF.Util.GetCandidateCompoundsForReaction(playerAttacker.AttackingElement, playerDefender.DefendingElementCounts);
	
	if(candidateCompounds.length == 0) {
		return null;//no valid compound found
	} else {
		candidateCompounds.sort(CF.Util.SortCompoundsHeaviestFirst);
	}
	return candidateCompounds[0];
};

/**
 * ElementFamily is a name and a color for the periodic table
 * @constructor
 */
CF.Model.ElementFamily = function(n, color) {
	this.n = n;//name
	this.color = color;
};
 
/**
 * Element is our main object all elements will be based on
 * @constructor
 */
CF.Model.Element = function(s, e, n, v) {
	this.s = s;//Symbol (i.e. H, He, Li)
	this.e = e;//Element Name (i.e. Hydrogen, Helium, Lithium)
	this.n = n;//Atomic Number (i.e. 1, 2, 3)
	this.v = v;//Valence Electrons (i.e. 1, 2, 1)
	
	//dynamically added/calculated attributes:
	this.g = null;//group #
	this.p = null;//period #
	this.f = null;//family
};

/**
 * Compound is a name and a code to signify a number of Elements
 * @constructor
 */
 CF.Model.Compound = function(f, n) {
	this.f = f;//formula (i.e. H20)
	this.n = n;//name (i.e. Water)
	
	//dynamically added/calculated attributes:
	this.w = null;//compound weight
	this.participants = null;//array of CompoundParticipant objects
 };

 CF.Model.Compound.prototype.toString = function() {
	return this.f + " (" + this.n + ")";
 };
 
 /**
 * Compound participant is one element and how many are in a particular compound
 * @constructor
 */
 CF.Model.CompoundParticipant = function(s, n, count) {
	this.s = s;//element symbol
	this.n = n;//element Atomic Number 
	this.count = count;//count of the number of times this element appears in the compound
 };

CF.Model.prototype.AssignElementDynamicProperties = function() {
	for(var e in this.Elements) {
		var element = this.Elements[e];
		//assign group
		element.g = element.v;
		if(element.v >=3) { //groups 13 - 18 and He
			element.g += 10;
		} else if(element.n == 2) { //He is a special case
			element.g = 18;
		}
		
		//assign period
		if(element.n < 3)
			element.p = 1;
		else if(element.n < 11)
			element.p = 2;
		else if(element.n < 19)
			element.p = 3;
		else
			element.p = 4;
		
		//assign family
		switch(element.n) {
			case 1:
			case 6:
			case 7:
			case 8:
			case 15:
			case 16:
				element.f = this.ElementFamilies[0];
				break;
			case 2:
			case 10:
			case 18:
				element.f = this.ElementFamilies[1];
				break;
			case 3:
			case 11:
			case 19:
				element.f = this.ElementFamilies[2];
				break;
			case 4:
			case 12:
			case 20:
				element.f = this.ElementFamilies[3];
				break;
			case 5:
			case 14:
				element.f = this.ElementFamilies[4];
				break;
			case 9:
			case 17:
				element.f = this.ElementFamilies[5];
				break;
			case 13:
				element.f = this.ElementFamilies[6];
				break;
		}
	}
	
};

CF.Model.prototype.AssignAllCompoundParticipants = function() {
	var elements = this.Elements.slice(0);//copies all elements
	elements.sort(CF.Util.SortElementsLongestFirst);
	for(var c in this.Compounds)
	{
		this.AssignCompoundParticipants(this.Compounds[c], elements);
	}
};

CF.Model.prototype.AssignCompoundParticipants = function(compound, sortedElements) {
	compound.participants = [];
	var weight = 0;
	var testFormula = compound.f;
	for(var e in sortedElements) {
		var element = sortedElements[e];
		var regExp = new RegExp("(" + sortedElements[e].s + ")([0-9]*)");
		var match = regExp.exec(testFormula, "");
		if(match && match.length > 0) {
			testFormula = testFormula.replace(regExp, "");
			var count = (match[2] == "" ? 1 : (parseInt(match[2])));
			weight += element.n * count;
			compound.participants.push(new CF.Model.CompoundParticipant(element.s, element.n, count));
		}
	}
	compound.w = weight;
};

CF.Model.prototype.FindExactCompoundByParticipants = function(otherCompound) {
	for(var i in this.Compounds) {
		var compound = this.Compounds[i];
		if(compound.participants.length == otherCompound.participants.length) {
			//check participants for equality
			var validParticipantFound = false;
			for(var j in compound.participants){
				validParticipantFound = false;
				for(var k in otherCompound.participants) {
					if(compound.participants[j].n == otherCompound.participants[k].n) {
						if(compound.participants[j].count == otherCompound.participants[k].count) {
							validParticipantFound = true;
							break;
						} else
							break;
					}
				}
				if(!validParticipantFound)
					break;
			}
			if(validParticipantFound)
				return compound;
		}
	}
	return null;
};

/*
CF.Model.prototype.FindElementBySymbol = function(s) {
	for(var i in this.Elements) {
		if(this.Elements[i].s == s)
			return this.Elements[i];
	}
	return null;
};
*/

CF.Model.prototype.CreateElements = function() {
	this.Elements = [];
	this.Elements.push(new CF.Model.Element("H","Hydrogen",1,1));
	this.Elements.push(new CF.Model.Element("He","Helium",2,2));
	this.Elements.push(new CF.Model.Element("Li","Lithium",3,1));
	this.Elements.push(new CF.Model.Element("Be","Beryllium",4,2));
	this.Elements.push(new CF.Model.Element("B","Boron",5,3));
	this.Elements.push(new CF.Model.Element("C","Carbon",6,4));
	this.Elements.push(new CF.Model.Element("N","Nitrogen",7,5));
	this.Elements.push(new CF.Model.Element("O","Oxygen",8,6));
	this.Elements.push(new CF.Model.Element("F","Fluorine",9,7));
	this.Elements.push(new CF.Model.Element("Ne","Neon",10,8));
	this.Elements.push(new CF.Model.Element("Na","Sodium",11,1));
	this.Elements.push(new CF.Model.Element("Mg","Magnesium",12,2));
	this.Elements.push(new CF.Model.Element("Al","Aluminum",13,3));
	this.Elements.push(new CF.Model.Element("Si","Silicon",14,4));
	this.Elements.push(new CF.Model.Element("P","Phosphorus",15,5));
	this.Elements.push(new CF.Model.Element("S","Sulfur",16,6));
	this.Elements.push(new CF.Model.Element("Cl","Chlorine",17,7));
	this.Elements.push(new CF.Model.Element("Ar","Argon",18,8));
	this.Elements.push(new CF.Model.Element("K","Potassium",19,1));
	this.Elements.push(new CF.Model.Element("Ca","Calcium",20,2));
};

CF.Model.prototype.CreateCompounds = function() {
	this.Compounds = [];
	this.Compounds.push(new CF.Model.Compound("AlBO","aluminium boron oxide"));
	this.Compounds.push(new CF.Model.Compound("AlBO2","aluminium borate"));
	this.Compounds.push(new CF.Model.Compound("AlCl","aluminium monochloride"));
	this.Compounds.push(new CF.Model.Compound("AlClF","aluminium chloride fluoride"));
	this.Compounds.push(new CF.Model.Compound("AlClF2","aluminium chloride fluoride"));
	this.Compounds.push(new CF.Model.Compound("AlClO","aluminium chloride oxide"));
	this.Compounds.push(new CF.Model.Compound("AlCl2F","aluminium chloride fluoride"));
	this.Compounds.push(new CF.Model.Compound("AlF","aluminium monofluoride"));
	this.Compounds.push(new CF.Model.Compound("AlFO","aluminium monofluoride monoxide"));
	this.Compounds.push(new CF.Model.Compound("AlF2","aluminium difluoride"));
	this.Compounds.push(new CF.Model.Compound("AlF2O","aluminium difluoride oxide"));
	this.Compounds.push(new CF.Model.Compound("AlF3","aluminium trifluoride"));
	this.Compounds.push(new CF.Model.Compound("AlF4Li","lithium tetrafluoroaluminate"));
	this.Compounds.push(new CF.Model.Compound("AlLiO2","lithium aluminate"));
	this.Compounds.push(new CF.Model.Compound("AlN","aluminium nitride"));
	this.Compounds.push(new CF.Model.Compound("AlNaO2","sodium aluminate"));
	this.Compounds.push(new CF.Model.Compound("AlO","aluminium monoxide"));
	this.Compounds.push(new CF.Model.Compound("AlOSi","aluminium silicon monoxide"));
	this.Compounds.push(new CF.Model.Compound("AlO2","Aluminium(IV) oxide"));
	this.Compounds.push(new CF.Model.Compound("AlP","aluminium monophosphide"));
	this.Compounds.push(new CF.Model.Compound("AlPO4","aluminium phosphate"));
	this.Compounds.push(new CF.Model.Compound("Al2O","dialuminium monoxide"));
	this.Compounds.push(new CF.Model.Compound("Al2O2","dialuminium dioxide"));
	this.Compounds.push(new CF.Model.Compound("Al2O3","aluminium oxide"));
	this.Compounds.push(new CF.Model.Compound("Al2S","dialuminium monosulfide"));
	this.Compounds.push(new CF.Model.Compound("ArClF","argon chloride fluoride"));
	this.Compounds.push(new CF.Model.Compound("ArClH","argon chloride hydride"));
	this.Compounds.push(new CF.Model.Compound("ArFH","argon fluoride hydride"));
	this.Compounds.push(new CF.Model.Compound("BCl3","boron trichloride"));
	this.Compounds.push(new CF.Model.Compound("BF3","boron trifluoride"));
	this.Compounds.push(new CF.Model.Compound("BN","boron nitride"));
	this.Compounds.push(new CF.Model.Compound("BP","boron(III) phosphide"));
	this.Compounds.push(new CF.Model.Compound("BPO4","boron(III) orthophosphate"));
	this.Compounds.push(new CF.Model.Compound("B2F4","boron trifluoride"));
	this.Compounds.push(new CF.Model.Compound("B2H6","diborane"));//boron hydride
	this.Compounds.push(new CF.Model.Compound("BH3","borane"));
	this.Compounds.push(new CF.Model.Compound("B2O3","boron(III) oxide"));
	this.Compounds.push(new CF.Model.Compound("B2S3","boron sulfide"));
	this.Compounds.push(new CF.Model.Compound("B3N3H6","borazine"));
	this.Compounds.push(new CF.Model.Compound("B4C","boron carbide"));
	this.Compounds.push(new CF.Model.Compound("BeB2","beryllium boride"));
	this.Compounds.push(new CF.Model.Compound("BeCl2","beryllium chloride"));
	this.Compounds.push(new CF.Model.Compound("BeF2","beryllium fluoride"));
	this.Compounds.push(new CF.Model.Compound("BeO","beryllium oxide"));
	this.Compounds.push(new CF.Model.Compound("BeS","beryllium sulfide"));
	this.Compounds.push(new CF.Model.Compound("BeSO4","beryllium sulfate"));
	this.Compounds.push(new CF.Model.Compound("Be2C","beryllium carbide"));
	this.Compounds.push(new CF.Model.Compound("Be3N2","beryllium nitride"));
	this.Compounds.push(new CF.Model.Compound("CCl2F2","dichlorodifluoromethane"));
	this.Compounds.push(new CF.Model.Compound("CHCl3","chloroform"));
	this.Compounds.push(new CF.Model.Compound("CH2Cl2","dichloromethane"));
	this.Compounds.push(new CF.Model.Compound("CH2O","formaldehyde"));
	this.Compounds.push(new CF.Model.Compound("CH3Cl","chloromethane"));
	this.Compounds.push(new CF.Model.Compound("CH4","methane"));
	this.Compounds.push(new CF.Model.Compound("CO","carbon monoxide"));
	this.Compounds.push(new CF.Model.Compound("COCl2","phosgene"));
	this.Compounds.push(new CF.Model.Compound("CO2","carbon dioxide"));
	this.Compounds.push(new CF.Model.Compound("CO3","carbon trioxide"));
	this.Compounds.push(new CF.Model.Compound("CS2","carbon disulfide"));
	this.Compounds.push(new CF.Model.Compound("C2F4","tetrafluoroethylene"));
	this.Compounds.push(new CF.Model.Compound("C2H2","acetylene"));
	this.Compounds.push(new CF.Model.Compound("C2H3Cl","vinyl chloride"));
	this.Compounds.push(new CF.Model.Compound("C2H4","ethylene"));
	this.Compounds.push(new CF.Model.Compound("C2H4Cl2","ethylene dichloride"));
	this.Compounds.push(new CF.Model.Compound("C2H4O2","acetic acid"));
	this.Compounds.push(new CF.Model.Compound("C2H5NO2","glycine"));
	this.Compounds.push(new CF.Model.Compound("C2H6","ethane"));
	this.Compounds.push(new CF.Model.Compound("C2H6OS","dimethyl sulfoxide"));
	this.Compounds.push(new CF.Model.Compound("C3H6","cyclopropane"));
	this.Compounds.push(new CF.Model.Compound("C3H7NO2","alanine"));
	this.Compounds.push(new CF.Model.Compound("C3H7NO3","serine"));
	this.Compounds.push(new CF.Model.Compound("C3H8","propane"));
	this.Compounds.push(new CF.Model.Compound("C3H8O","propanol"));
	this.Compounds.push(new CF.Model.Compound("C4H8","cyclobutane"));
	this.Compounds.push(new CF.Model.Compound("C4H8O","tetrahydrofuran"));
	this.Compounds.push(new CF.Model.Compound("C4H10","butane"));
	this.Compounds.push(new CF.Model.Compound("C4H10O","diethyl ether"));
	this.Compounds.push(new CF.Model.Compound("C5H5N","pyridine"));
	this.Compounds.push(new CF.Model.Compound("C5H10","cyclopentane"));
	this.Compounds.push(new CF.Model.Compound("C5H12","pentane"));
	this.Compounds.push(new CF.Model.Compound("C6H4O2","orthobenzoquinone"));
	this.Compounds.push(new CF.Model.Compound("C6H5F","fluorobenzene"));
	this.Compounds.push(new CF.Model.Compound("C6H6","benzene"));
	this.Compounds.push(new CF.Model.Compound("C6H6O2","catechol"));
	this.Compounds.push(new CF.Model.Compound("C6H12","cyclohexane"));
	this.Compounds.push(new CF.Model.Compound("C6H14","hexane"));
	this.Compounds.push(new CF.Model.Compound("C7H8","toluene"));
	this.Compounds.push(new CF.Model.Compound("C7H16","heptane"));
	this.Compounds.push(new CF.Model.Compound("C8H8","cubane"));
	this.Compounds.push(new CF.Model.Compound("CaB6","calcium boride"));
	this.Compounds.push(new CF.Model.Compound("CaCO3","calcium carbonate"));
	this.Compounds.push(new CF.Model.Compound("CaC2","calcium carbide"));
	this.Compounds.push(new CF.Model.Compound("CaCl2","calcium chloride"));
	this.Compounds.push(new CF.Model.Compound("CaF2","calcium fluoride"));
	this.Compounds.push(new CF.Model.Compound("CaH2","calcium hydride"));
	this.Compounds.push(new CF.Model.Compound("CaO","calcium oxide"));
	this.Compounds.push(new CF.Model.Compound("CaO2","calcium peroxide"));
	this.Compounds.push(new CF.Model.Compound("CaS","calcium sulfide"));
	this.Compounds.push(new CF.Model.Compound("CaSiO3","calcium metasilicate"));
	this.Compounds.push(new CF.Model.Compound("ClF","chlorine fluoride"));
	this.Compounds.push(new CF.Model.Compound("ClF3","chlorine trifluoride"));
	this.Compounds.push(new CF.Model.Compound("ClO2","chlorine dioxide"));
	this.Compounds.push(new CF.Model.Compound("ClO3F","chlorine trioxide fluoride"));
	this.Compounds.push(new CF.Model.Compound("Cl2","chlorine"));
	this.Compounds.push(new CF.Model.Compound("Cl2O3","chlorine trioxide"));
	this.Compounds.push(new CF.Model.Compound("FLi","lithium fluoride"));
	this.Compounds.push(new CF.Model.Compound("FLiO","lithium hypofluorite"));
	this.Compounds.push(new CF.Model.Compound("FLi2","dilithium monofluoride"));
	this.Compounds.push(new CF.Model.Compound("FMg","magnesium monofluoride"));
	this.Compounds.push(new CF.Model.Compound("FN","fluoroimidogen"));
	this.Compounds.push(new CF.Model.Compound("FNO","nitrosyl fluoride"));
	this.Compounds.push(new CF.Model.Compound("FNO2","nitryl fluoride"));
	this.Compounds.push(new CF.Model.Compound("FNO3","fluorine nitrate"));
	this.Compounds.push(new CF.Model.Compound("FNS","thiazyl fluoride"));
	this.Compounds.push(new CF.Model.Compound("FNa","sodium fluoride"));
	this.Compounds.push(new CF.Model.Compound("FNa2","disodium monofluoride"));
	this.Compounds.push(new CF.Model.Compound("FO","oxygen monofluoride"));
	this.Compounds.push(new CF.Model.Compound("FO2","dioxygen monofluoride"));
	this.Compounds.push(new CF.Model.Compound("FO3S","fluorosulfate radical"));
	this.Compounds.push(new CF.Model.Compound("FP","phosphorus monofluoride"));
	this.Compounds.push(new CF.Model.Compound("FPS","phosphenothious fluoride"));
	this.Compounds.push(new CF.Model.Compound("FPS2","phosphenodithioic fluoride"));
	this.Compounds.push(new CF.Model.Compound("FS","monosulfur monofluoride"));
	this.Compounds.push(new CF.Model.Compound("F2","fluorine"));
	this.Compounds.push(new CF.Model.Compound("F2K2","dipotassium difluoride"));
	this.Compounds.push(new CF.Model.Compound("F2Li2","lithium fluoride"));
	this.Compounds.push(new CF.Model.Compound("F2Mg","magnesium fluoride"));
	this.Compounds.push(new CF.Model.Compound("F2N","difluoroamino radical"));
	this.Compounds.push(new CF.Model.Compound("F2N2O","nitrosodifluoroamine"));
	this.Compounds.push(new CF.Model.Compound("F2Na2","disodium difluoride"));
	this.Compounds.push(new CF.Model.Compound("F2O","difluorine monoxide"));
	this.Compounds.push(new CF.Model.Compound("F2OS","thionyl fluoride"));
	this.Compounds.push(new CF.Model.Compound("F2OSi","difluorooxosilane"));
	this.Compounds.push(new CF.Model.Compound("F2O2","perfluoroperoxide"));
	this.Compounds.push(new CF.Model.Compound("F2O2S","sulfuryl fluoride"));
	this.Compounds.push(new CF.Model.Compound("F2P","phosphorus difluoride"));
	this.Compounds.push(new CF.Model.Compound("F2S","sulfur difluoride"));
	this.Compounds.push(new CF.Model.Compound("F2S2","difluorodisulfane"));
	this.Compounds.push(new CF.Model.Compound("F2S2","thiothionyl fluoride"));
	this.Compounds.push(new CF.Model.Compound("F2S2","thiothionyl fluoride"));
	this.Compounds.push(new CF.Model.Compound("F2Si","difluorosilylene"));
	this.Compounds.push(new CF.Model.Compound("F3Li3","trilithium trifluoride"));
	this.Compounds.push(new CF.Model.Compound("F3N","nitrogen trifluoride"));
	this.Compounds.push(new CF.Model.Compound("F3NO","nitrogen trifluoride oxide"));
	this.Compounds.push(new CF.Model.Compound("F3NS","thiazyl trifluoride"));
	this.Compounds.push(new CF.Model.Compound("F3OP","phosphoryl fluoride"));
	this.Compounds.push(new CF.Model.Compound("F3P","phosphorus trifluoride"));
	this.Compounds.push(new CF.Model.Compound("F3PS","thiophosphoryl fluoride"));
	this.Compounds.push(new CF.Model.Compound("F3S","sulfur trifluoride"));
	this.Compounds.push(new CF.Model.Compound("F3Si","trifluorosilyl radical"));
	this.Compounds.push(new CF.Model.Compound("F4Mg2","dimagnesium tetrafluoride"));
	this.Compounds.push(new CF.Model.Compound("F4Mg2","magnesium fluoride"));
	this.Compounds.push(new CF.Model.Compound("F4N2","tetrafluorohydrazine"));
	this.Compounds.push(new CF.Model.Compound("F4OS","sulfur tetrafluoride oxide"));
	this.Compounds.push(new CF.Model.Compound("F4S","sulfur tetrafluoride"));
	this.Compounds.push(new CF.Model.Compound("F4Si","silicon tetrafluoride"));
	this.Compounds.push(new CF.Model.Compound("F5P","phosphorus pentafluoride"));
	this.Compounds.push(new CF.Model.Compound("H2B2","diborene"));
	this.Compounds.push(new CF.Model.Compound("HCN","hydrocyanic acid"));
	this.Compounds.push(new CF.Model.Compound("HCl","hydrochloric acid"));
	this.Compounds.push(new CF.Model.Compound("HClO","hypochlorous acid"));
	this.Compounds.push(new CF.Model.Compound("HClO2","chlorous acid"));
	this.Compounds.push(new CF.Model.Compound("HClO3","chloric acid"));
	this.Compounds.push(new CF.Model.Compound("HClO4","perchloric acid"));
	this.Compounds.push(new CF.Model.Compound("HF","hydrofluoric acid"));
	this.Compounds.push(new CF.Model.Compound("HNO2","nitrous acid"));
	this.Compounds.push(new CF.Model.Compound("HNO3","nitric acid"));
	this.Compounds.push(new CF.Model.Compound("HN3","hydrazoic acid"));
	this.Compounds.push(new CF.Model.Compound("HOCl","hypochlorous acid"));
	this.Compounds.push(new CF.Model.Compound("HOF","hypofluorous acid"));
	this.Compounds.push(new CF.Model.Compound("H2","hydrogen"));
	this.Compounds.push(new CF.Model.Compound("H2CO","formaldehyde"));
	this.Compounds.push(new CF.Model.Compound("H2CO3","carbonic acid"));
	this.Compounds.push(new CF.Model.Compound("H2CSO","sulfine"));
	this.Compounds.push(new CF.Model.Compound("H2C2O4","oxalic acid"));
	this.Compounds.push(new CF.Model.Compound("H2O","water"));
	this.Compounds.push(new CF.Model.Compound("H2O2","hydrogen peroxide"));
	this.Compounds.push(new CF.Model.Compound("H2S","hydrogen sulfide"));
	this.Compounds.push(new CF.Model.Compound("H2SO3","sulfurous acid"));
	this.Compounds.push(new CF.Model.Compound("H2SO4","sulfuric acid"));
	this.Compounds.push(new CF.Model.Compound("H2SiO3","silicic acid"));
	this.Compounds.push(new CF.Model.Compound("H3PO4","phosphoric acid"));
	this.Compounds.push(new CF.Model.Compound("KH","potassium hydride"));
	this.Compounds.push(new CF.Model.Compound("KCN","potassium cyanide"));
	this.Compounds.push(new CF.Model.Compound("KC2H5O","potassium ethoxide"));
	this.Compounds.push(new CF.Model.Compound("KCl","potassium chloride"));
	this.Compounds.push(new CF.Model.Compound("KClO3","potassium chlorate"));
	this.Compounds.push(new CF.Model.Compound("KF","potassium fluoride"));
	this.Compounds.push(new CF.Model.Compound("KHCO3","potassium bicarbonate"));
	this.Compounds.push(new CF.Model.Compound("KHSO3","potassium hydrogen sulfite"));
	this.Compounds.push(new CF.Model.Compound("KNa","potassium sodide"));
	this.Compounds.push(new CF.Model.Compound("KNO3","potassium nitrate"));
	this.Compounds.push(new CF.Model.Compound("KO","monopotassium monoxide"));
	this.Compounds.push(new CF.Model.Compound("KOCl","potassium hypochlorite"));
	this.Compounds.push(new CF.Model.Compound("KOH","potassium hydroxide"));
	this.Compounds.push(new CF.Model.Compound("KO2","potassium superoxide"));
	this.Compounds.push(new CF.Model.Compound("KO3","potassium ozonide"));
	this.Compounds.push(new CF.Model.Compound("K2Na2","dipotassium disodium"));
	this.Compounds.push(new CF.Model.Compound("K2O","potassium oxide"));
	this.Compounds.push(new CF.Model.Compound("K2O2","potassium peroxide"));
	this.Compounds.push(new CF.Model.Compound("K2S","potassium sulfide"));
	this.Compounds.push(new CF.Model.Compound("LiCN","lithium cyanide"));
	this.Compounds.push(new CF.Model.Compound("LiC2H5O","lithium ethoxide"));
	this.Compounds.push(new CF.Model.Compound("LiHSO4","lithium hydrogen sulfate"));
	this.Compounds.push(new CF.Model.Compound("LiNa","sodium lithium"));
	this.Compounds.push(new CF.Model.Compound("LiNO3","lithium nitrate"));
	this.Compounds.push(new CF.Model.Compound("Li2SO4","lithium sulfate"));
	this.Compounds.push(new CF.Model.Compound("Li2SiO3","lithium metasilicate"));
	this.Compounds.push(new CF.Model.Compound("LiCl","lithium chloride"));
	this.Compounds.push(new CF.Model.Compound("LiH","lithium hydride"));
	this.Compounds.push(new CF.Model.Compound("MgCO3","magnesium carbonate"));
	this.Compounds.push(new CF.Model.Compound("MgC2O4","magnesium oxalate"));
	this.Compounds.push(new CF.Model.Compound("MgCl2","magnesium chloride"));
	this.Compounds.push(new CF.Model.Compound("MgF2","magnesium fluoride"));
	this.Compounds.push(new CF.Model.Compound("MgO","magnesium oxide"));
	this.Compounds.push(new CF.Model.Compound("MgS","magnesium sulfide"));
	this.Compounds.push(new CF.Model.Compound("MgSO4","magnesium sulfate"));
	this.Compounds.push(new CF.Model.Compound("MgSiO3","magnesium metasilicate"));
	this.Compounds.push(new CF.Model.Compound("NH3","ammonia"));
	this.Compounds.push(new CF.Model.Compound("NH4Cl","ammonium chloride"));
	this.Compounds.push(new CF.Model.Compound("NH4ClO4","Ammonium perchlorate"));
	this.Compounds.push(new CF.Model.Compound("NO","nitric oxide"));
	this.Compounds.push(new CF.Model.Compound("NO2","nitrogen dioxide"));
	this.Compounds.push(new CF.Model.Compound("NO2Cl","nytril chloride"));
	this.Compounds.push(new CF.Model.Compound("N2","nitrogen"));
	this.Compounds.push(new CF.Model.Compound("N2H4","hydrazine"));
	this.Compounds.push(new CF.Model.Compound("N2O","nitrous oxide"));
	this.Compounds.push(new CF.Model.Compound("N2O3","dinitrogen trioxide"));
	this.Compounds.push(new CF.Model.Compound("N2O4","dinitrogen tetroxide"));
	this.Compounds.push(new CF.Model.Compound("N2O5","dinitrogen pentaoxide"));
	this.Compounds.push(new CF.Model.Compound("N4H4","trans-tetrazene"));
	this.Compounds.push(new CF.Model.Compound("NaCN","sodium cyanide"));
	this.Compounds.push(new CF.Model.Compound("NaCl","sodium chloride"));
	this.Compounds.push(new CF.Model.Compound("NaH","sodium hydride"));
	this.Compounds.push(new CF.Model.Compound("NaHCO3","sodium bicarbonate"));
	this.Compounds.push(new CF.Model.Compound("NaNO3","sodium nitrate"));
	this.Compounds.push(new CF.Model.Compound("NaOH","sodium hydroxide"));
	this.Compounds.push(new CF.Model.Compound("Na2CO3","sodium carbonate"));
	this.Compounds.push(new CF.Model.Compound("Na2O2","sodium peroxide"));
	this.Compounds.push(new CF.Model.Compound("Na2O","sodium oxide"));
	this.Compounds.push(new CF.Model.Compound("Na2S","sodium monosulfide"));
	this.Compounds.push(new CF.Model.Compound("O2","dioxygen"));
	this.Compounds.push(new CF.Model.Compound("OF2","oxygen difluoride"));
	this.Compounds.push(new CF.Model.Compound("O2F2","dioxygen difluoride"));
	this.Compounds.push(new CF.Model.Compound("O3","ozone"));
	this.Compounds.push(new CF.Model.Compound("SF4","sulfur tetrafluoride"));
	this.Compounds.push(new CF.Model.Compound("SOF2","thionyl difluoride"));
	this.Compounds.push(new CF.Model.Compound("SO2","sulfur dioxide"));
	this.Compounds.push(new CF.Model.Compound("SO2F2","sulfuryl difluoride"));
	this.Compounds.push(new CF.Model.Compound("SO3","sulfur trioxide"));
	this.Compounds.push(new CF.Model.Compound("SiC","silicon carbide"));
	this.Compounds.push(new CF.Model.Compound("SiH4","silane"));
	this.Compounds.push(new CF.Model.Compound("SiO2","silicon(IV) dioxide"));
};

/**
 * Rect is another rectangle
 * @constructor
 */
CF.Model.Rect = function(x, y, width, height) {
	this.X = x;
	this.Y = y;
	this.Width = width;
	this.Height = height;
	
	this.Left = x;
	this.Right = x + width;
	this.Top = y;
	this.Bottom = y + height;
}

/**
 * Contains for rect
 * @this {CF.Model.Rect}
 * @param {CF.Point} point the test point
 */
CF.Model.Rect.prototype.Contains = function(/*CF.Point*/ point) {
	if(this.Left <= point.X && this.Right >= point.X &&
		this.Bottom >= point.Y && this.Top <= point.Y)
		return true;
	else
		return false;
}
