var CF = {Version: '0.0.1', GameModel: null};

Number.prototype.compareTo = function(num) {
	 if (typeof num != "number") return false; // if number is not of type number return false

	 if (num < this) return 1;
	 else if (num > this) return -1;
	 else return 0;
};