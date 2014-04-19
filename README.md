ChemFight
=========

Chem Fight is an HTML5 Chemistry Battle Game, defeat your opponents and become a chemistry master!

Chem Fight was developed for the js13KGames competition http://js13kgames.com/

You can play the latest version of the game here: http://www.masteredsoftware.com/chemfight/

Game Mechanics
==============
The game mechanics of Chem Fight are pretty simple, you are given a number of "Atom Bucks"
which are used to purchase single atoms from the periodic table (i.e. you can purchase Helium [He] with atomic number 2, for two Atom Bucks).

In each turn, players attack with a single atom, the defender is shown only the valence electron count of the attacking atom
and is given a chance to choose a number of atoms for defense.

If the attacking atom will bond with one or more of the defender's chosen atoms,
it is considered a successful defense and the defending player is given a number of Atom Bucks and Energy Units as a bonus.

If there is no known possible compound between the attacking element and any of the defending elements,
the attack is successful and the defending player is damaged based on the atomic number of the attacking element.

The defender is penalized for any unbonded defending elements (this is to discourage players from just defending with every element they own each time).

Energy units must be spent to regain the unused defending elements, if the player has insufficient energy,
their health is damaged for the deficit.

At the end of each turn, players earn a number of Atom Bucks and are given the chance to purchase more elements.


Helpful Hints
=============
* Currently the game is broken up into 3 rounds, after each round the opponent gets a bit smarter and each player starts with more health, energy and atom bucks.

* Noble gasses are special because they cannot be used for defense or defended against, but to purchase a Noble gas, energy must be spent.

* Purchasing a variety of elements will help players defend against more possible attackers.

* Typically, heavier elements and elements found in the middle of the Periodic Table (Groups 2 though 16) are better for attacking, and lighter elements found on the sides of the Periodic Table (Groups 1, 17, and 18) are better for defense.

* Typically if the opponent is attacking with an element with 1 valence electron, you should be able to defend using a Hydrogen (because the 2s electron subshell will be filled)

Useful Chemical References
==========================
Dynamic Periodic Table http://www.ptable.com/

Electron Shell http://en.wikipedia.org/wiki/Electron_shell

Electron Configuration http://en.wikipedia.org/wiki/Electron_configuration

License 
=======
MIT Licensed
