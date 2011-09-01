/*
 * RangerMask
 * https://github.com/WalkerCodeRanger/RangerMask
 * 
 * Masked Input plugin for jQuery
 * Copyright (c) 2011 Jeff Walker, http://WalkerCodeRanger.com
 * Licensed under MIT license.
 * Version: 0.9.5
 */

// Namespace
var RangerMask = {};

// Setup Namespace
(function (rmask)
{
	// Characters reserved by RangerMask for special use in mask definitions
	// Currently Used:
	//   ?  optional place
	//   () optional section
	//   {} repeating place
	//   /  escape char
	// Reserved For Future Use:
	//   <> left and right align
	//   [] character classes
	//   *  0 or more?
	//   +  1 or more?
	//   |  block pull/push
	var regExReserved = /[?(){}\/<>\[\]*+|]/g; // ?(){}/<>[]*+|

	// A regex that matches all the chars with special special meaning in regex
	var regExSpecials = /[?(){}\[\]*+|.^$\\]/g; // ?(){}[]*+|.^$\

	// Escape (i.e. put a \ in front of) any characters with special meaning regex
	function escapeRegEx(str)
	{
		return str.replace(regExSpecials, "\\$&");
	}

	function Data(places, selectionStart, selectionLength)
	{
		this.places = places;
		this.selection = {};
		this.selection.start = selectionStart;
		this.selection.length = selectionLength;
	}

	Data.prototype.copy = function(to)
	{
		if(!to) to = new Data();
		to.places = this.places.slice(0);
		to.selection.start = this.selection.start;
		to.selection.length = this.selection.length;
		return to;
	};

	// The null place that terminates the link list of places 
	var nullPlace =
	{
		fixed: true,
		optional: true, // the null place is uniquely fixed and optional becuase it has no string value
		pattern: "",
		emptyVal: "",
		maskedEmptyVal: "",
		section: null,
		val: function() { return ""; },
		displayVal: function () { return ""; },
		maskedVal: function () { return ""; },
		isEmpty: function () { return true; },
		countPlaces: function() { return 0; },
		applyDefaultFill: function() { return ""; },
		type: function() { return false; },
		push: function() { return false; },
		peekPull: function() { return ""; },
		pull: function() { },
		seek: function() { return false; },
		del: function() { }
	};

	// public Class: Mask
	function Mask()
	{
		this.regEx = null;
		this.places = [];
		this.placeholder = "_";
		this.displayPlaceholder = "\u3000";
		this.rootSection = new Section(null, false);
		this.containsRequiredFixedPlaces = false;
	}

	// public: The state of the data in unprocessed form, useful for programmatically manipulating the value from javascript
	Mask.prototype.rawState = function (data)
	{
		return this.createState(data, data.places);
	};

	// public: The state of the data displayed when NOT editing
	Mask.prototype.displayState = function (data)
	{
		// Never show value for empty mask without fixed places
		if(!this.containsRequiredFixedPlaces && this.isEmpty(data))
			return { value: "", selection: { start: 0, length: 0 }};

		var displayPlaces = $.map(this.places, function(place, i) { return place.displayVal(data); });
		return this.createState(data, displayPlaces);
	};

	// public: The state of the data displayed when editing
	Mask.prototype.maskedState = function (data)
	{
		var maskedPlaces = $.map(this.places, function(place, i) { return place.maskedVal(data); });
		return this.createState(data, maskedPlaces);
	};

	// private: construct a state from places
	Mask.prototype.createState = function(data, places)
	{
		var value = places.join("");
		var start = places.slice(0, data.selection.start).join("").length;
		var length = places.slice(0, data.selection.start + data.selection.length).join("").length - start;
		return { value: value, selection: { start: start, length: length }};
	};

	// internal:
	Mask.prototype.init = function ()
	{
		// init places
		var next = nullPlace;
		for(var i=this.places.length-1; i>=0; i--)
		{
			// init place
			var place = this.places[i];
			place.mask = this;
			place.index = i;
			place.next = next;
			place.init();

			// prepare for next
			next = place;
		}
		this.places.push(nullPlace); // Put the null place at the end so we don't have to worry about cursor at end

		// now that places are inited, we can build our regEx etc.
		this.regEx = new RegExp("^" + $.map(this.places, function (p) { return "(" + p.pattern + ")"; }).join("") + "$");
		this.maskedEmptyVal = $.map(this.places, function (p) { return p.maskedEmptyVal; }).join("");
	};

	// internal:
	Mask.prototype.isEmpty = function (data)
	{
		return this.rootSection.isEmpty(data);
	};

	// public:
	Mask.prototype.selectAll = function (data)
	{
		data.selection.start = 0;
		data.selection.length = this.places.length;
	};

	// internal:
	Mask.prototype.deleteSelection = function(data)
	{
		var selectionEnd = data.selection.start + data.selection.length - 1;
		// Becuase of pulling we have to go in reverse
		for(var i=selectionEnd; data.selection.start <= i; i--)
			this.places[i].del(data);

		data.selection.length = 0;
	};

	// public: Apply the mask to a controls value
	Mask.prototype.apply = function (value)
	{
		var placeholder = this.placeholder; // make it available to lambda
		var matches = this.regEx.exec(value);
		if(matches)
			return new Data($.map(matches.slice(1), function(p) { return p==placeholder ? "" : p }), 0, this.places.length);
		else
		{
			var data = new Data($.map(this.places, function (p) { return p.emptyVal; }), 0, 0);
			var mask = this; // make it available to lambda
			$.each(value.split(""), function(i, character)
			{
				mask.type(data, character);
			});
			this.selectAll(data);
			return data;
		}
	};
	
	// internal: Apply default fill, used when losing focus
	Mask.prototype.applyDefaultFill = function(data)
	{
		this.rootSection.applyDefaultFill(data);
	};

	// internal: Sets the selection in the data accounting for optional fields etc.
	Mask.prototype.setSelection = function(data, selection)
	{
		var past = 0;
		var selectionEnd = selection.start + selection.length;
		for(var i=0; i<this.places.length; i++)
		{
			if(past == selection.start)
				data.selection.start = i;

			if(past == selectionEnd)
			{
				data.selection.length = i - data.selection.start;
				return; // done as soon as we find the end of the selection
			}

			past += this.places[i].maskedVal(data).length;
		}
		// If we haven't found the selection end, just set it to the end (minus the null place)
		data.selection.length = this.places.length - 1 - data.selection.start;
	};

	// public: type a character
	Mask.prototype.type = function (data, character)
	{
		var tryData = data.copy();
		this.deleteSelection(tryData);
		if(this.places[tryData.selection.start].type(tryData, character))
			tryData.copy(data);
	};

	// public: paste a value
	Mask.prototype.paste = function (data, pasted)
	{
		var tryData = data.copy();
		this.deleteSelection(tryData);
		var mask = this; // make it available to lambda
		var changed = false;
		$.each(pasted.split(""), function(i, character)
		{
			changed |= mask.places[tryData.selection.start].type(tryData, character)
		});
		if(changed)
			tryData.copy(data);
	};

	// public: backspace
	Mask.prototype.backspace = function (data)
	{
		if(data.selection.length > 0)
			this.deleteSelection(data);
		else
			// Find the first delete-able char behind the cursor
			for(var i=data.selection.start-1; i >= 0; i--)
			{
				var place = this.places[i];
				if(!place.fixed && (place.val(data) != "" || !place.optional))
				{
					this.places[i].del(data);
					data.selection.start = i;
					break;
				}
			}
	};

	// public: delete
	Mask.prototype.del = function (data)
	{
		if(data.selection.length > 0)
			this.deleteSelection(data);
		else
			// Find the first delete-able char ahead of the cursor
			for(var i=data.selection.start; i < this.places.length; i++)
			{
				var place = this.places[i];
				if(!place.fixed && (place.val(data) != "" || !place.optional))
				{
					this.places[i].del(data);
					data.selection.start = i;
					break;
				}
			}
	};

	// Class Section
	function Section(parentSection, optional)
	{
		this.optional = optional;
		this.parts = [];
		this.parentSection = parentSection;
	}

	Section.prototype.isDisplayed = function(data)
	{
		if(this.parentSection && !this.parentSection.isDisplayed(data))
			return false;

		return !this.optional || !this.isEmpty(data);
	};

	Section.prototype.isEmpty = function(data)
	{
		for(var i=0; i<this.parts.length; i++)
			if(!this.parts[i].isEmpty(data))
				return false;

		return true;
	};

	Section.prototype.applyDefaultFill = function(data)
	{
		if(this.isEmpty(data)) return;

		for(var i=0; i<this.parts.length; i++)
			this.parts[i].applyDefaultFill(data);
	};

	// Class Place
	function Place(section, charClass, defaultFill, defaultCallback, optional)
	{
		this.fixed = false;
		this.optional = optional || false;
		this.charClass = charClass;
		this.defaultFill = defaultFill;
		this.defaultCallback = defaultCallback;
		this.emptyVal = "";
		this.regEx = new RegExp("^["+charClass+"]$");
		this.section = section;
	}

	Place.prototype.copy = function(section, optional)
	{
		if(optional == undefined)
			return new Place(section, this.charClass, this.defaultFill, this.defaultCallback, this.optional);
		else
			return new Place(section, this.charClass, this.defaultFill, this.defaultCallback, optional);
	};

	Place.prototype.init = function ()
	{
		this.pattern = this.optional ? "[" + this.charClass + "]?" : "[" + this.charClass + this.mask.placeholder + "]";
		this.maskedEmptyVal = this.optional ? "" : this.mask.placeholder;
	};

	Place.prototype.val = function(data, value)
	{
		if(typeof value === 'undefined')
			return data.places[this.index];
		else
			data.places[this.index] = value;
	};

	Place.prototype.displayVal = function(data)
	{
		if(!this.section.isDisplayed(data))
			return "";

		var val = this.val(data);
		if(val != "" || this.optional)
			return val;
		else
			return this.mask.displayPlaceholder;
	};

	Place.prototype.maskedVal = function(data)
	{
		var val = this.val(data);
		if(val != "" || this.optional)
			return val;
		else
			return this.mask.placeholder;
	};

 	Place.prototype.isEmpty = function (data)
 	{
		return this.val(data) == "";
 	};

	// Counts the number of places to the right (including this one) that are not empty
	// before a fixed or empty place
	Place.prototype.countPlaces = function(data)
	{
		return this.isEmpty(data) ? 0 : (1 + this.next.countPlaces(data));
	};

	Place.prototype.applyDefaultFill = function(data)
	{
		var val = this.val(data);
		if(this.defaultFill && val == "" && !this.optional)
			this.val(data, this.defaultFill);

		if(this.defaultCallback)
			this.defaultCallback(data, this.index);
	};

	Place.prototype.type = function(data, character)
	{
		if(this.regEx.test(character))
		{
			if(this.val(data) == "" || this.next.push(data, this.val(data)))
			{
				this.val(data, character);
				data.selection.start = this.index + 1;
				return true;
			}
			return false;
		}
		else if(this.val(data) == "")
		{
			if(this.optional)
				return this.next.type(data, character);
			else
				return this.next.seek(data, character, false);
		}
	};

	Place.prototype.seek = function(data, character, fixedPlaceFound)
	{
		if(fixedPlaceFound || this.val(data) != "")
			return false;

		return this.next.seek(data, character, false);
	};

	Place.prototype.push = function(data, character)
	{
		if(this.regEx.test(character))
		{
			if(this.val(data) == "" || this.next.push(data, this.val(data)))
			{
				this.val(data, character);
				return true;
			}
		}
		return false;
	};

	// Returns the value that will be pulled, if the puller can pull it, he calls pull()
	Place.prototype.peekPull = function(data)
	{
		return this.val(data);
	};

	// Tells us our value has been pulled, we will now try to pull our next
	Place.prototype.pull = function(data, first)
	{
		// Empty required places stop the pull (except the first could be a delete at an empty place)
		if(!first && !this.optional && this.val(data) == "")
			return;

		var val = this.next.peekPull(data);
		if(val != "" && this.regEx.test(val))
		{
			this.val(data, val);
			this.next.pull(data, false);
			return;
		}

		this.val(data, ""); // our value was pulled and we have nothing to replace it with
	};

	Place.prototype.del = function (data)
	{
		if(!this.optional)
			this.pull(data, true);
		else
			this.val(data, "");
	};

	// Class FixedPlace
	function FixedPlace(section, value)
	{
		this.fixed = true;
		this.optional = false;
		this.pattern = escapeRegEx(value);
		this.value = value;
		this.emptyVal = value;
		this.maskedEmptyVal = value;
		this.section = section;
	};

	FixedPlace.prototype.copy = function(section, optional)
	{
		if(optional)
			return new Place(section, "\\"+this.value, undefined, undefined, optional);
		else
			return new FixedPlace(section, this.value);
	};

	FixedPlace.prototype.init = function ()
	{
	};

	FixedPlace.prototype.val = function(data)
	{
		return this.value;
	};

	
	FixedPlace.prototype.displayVal = function(data)
	{
		if(this.section.isDisplayed(data))
			return this.value;
		else
			return "";
	};

	FixedPlace.prototype.maskedVal = function(data)
	{
		return this.value;
	};

	FixedPlace.prototype.isEmpty = function (data)
 	{
		return true;
 	};

	FixedPlace.prototype.countPlaces = function(data)
	{
		return 0;
	};

	FixedPlace.prototype.applyDefaultFill = function(data)
	{
		// no default fill for fixed places
	};
	
	FixedPlace.prototype.type = function(data, character)
	{
		if(character == this.value)
		{
			data.selection.start = this.index + 1;
			return true;
		}
		else
			return this.next.type(data, character);
	};

	FixedPlace.prototype.seek = function(data, character, fixedPlaceFound)
	{
		if(character == this.value)
		{
			data.selection.start = this.index + 1;
			return true;
		}

		return this.next.seek(data, character, true);
	};

	FixedPlace.prototype.push = function(data, character)
	{
		return this.next.push(data, character);
	};

	FixedPlace.prototype.peekPull = function(data)
	{
		return this.next.peekPull(data); // pull across fixed places
	};

	FixedPlace.prototype.pull = function(data, first)
	{
		this.next.pull(data, false); // pull across fixed places
	};

	FixedPlace.prototype.del = function (data)
	{
		// delete has no affect on a fixed place
	};

	// Class SeparatorPlace
	function SeparatorPlace(section, value, groupSize)
	{
		this.fixed = true;
		this.optional = true;
		this.pattern = escapeRegEx(value)+"?";
		this.value = value;
		this.emptyVal = value;
		this.maskedEmptyVal = value;
		this.section = section;
		this.groupSize = groupSize;
	};

	SeparatorPlace.prototype.copy = function(section, optional)
	{
		return new SeparatorPlace(section, this.value, this.groupSize);
	};

	SeparatorPlace.prototype.init = function ()
	{
	};

	SeparatorPlace.prototype.val = function(data)
	{
		var placesToRight = this.next.countPlaces(data);
		if(placesToRight > 0 && (placesToRight % this.groupSize) == 0)
			return this.value;
		else
			return "";
	};

	SeparatorPlace.prototype.displayVal = function(data)
	{
		if(this.section.isDisplayed(data))
			return this.val(data);
		else
			return "";
	};

	SeparatorPlace.prototype.maskedVal = function(data)
	{
		return this.val(data);
	};

	SeparatorPlace.prototype.isEmpty = function (data)
	{
		return true;
	};

	SeparatorPlace.prototype.countPlaces = function(data)
	{
		return this.next.countPlaces(data);
	};

	SeparatorPlace.prototype.applyDefaultFill = function(data)
	{
		// no default fill for fixed places
	};
	
	SeparatorPlace.prototype.type = function(data, character)
	{
		if(character == this.value)
		{
			data.selection.start = this.index + 1;
			return true;
		}
		else
			return this.next.type(data, character);
	};

	SeparatorPlace.prototype.seek = function(data, character, fixedPlaceFound)
	{
		if(character == this.value)
		{
			data.selection.start = this.index + 1;
			return true;
		}

		return this.next.seek(data, character, true);
	};

	SeparatorPlace.prototype.push = function(data, character)
	{
		return this.next.push(data, character);
	};

	SeparatorPlace.prototype.peekPull = function(data)
	{
		return this.next.peekPull(data); // pull across separator places
	};

	SeparatorPlace.prototype.pull = function(data, first)
	{
		this.next.pull(data, false); // pull across separator places
	};

	SeparatorPlace.prototype.del = function (data)
	{
		// delete has no affect on a separator place
	};

	// Class PlaceBuilder
	function PlaceBuilder(places)
	{
		this.places = places;
	}

	PlaceBuilder.prototype.place = function(charClass, defaultFill, optional, defaultCallback)
	{
		this.places.push(new Place(null, charClass, defaultFill, defaultCallback, optional));
		return this;
	};

	PlaceBuilder.prototype.fixed = function(character)
	{
		this.places.push(new FixedPlace(null, character));
		return this;
	};

	PlaceBuilder.prototype.separator = function(character, groupSize)
	{
		this.places.push(new SeparatorPlace(null, character, groupSize || 3));
		return this;
	};

	// Find the longest defintion that starts the pattern
	function startsWithDefinition(pattern)
	{
		var definition = "";
		for(def in rmask.definitions)
			if(pattern.indexOf(def) == 0) // i.e. pattern.startsWith(def)
				if(def.length > definition.length) // take longest match (two defs of same length couldn't both match)
					definition = def;

		return definition.length > 0 ? definition : null;
	}

	function isNumber(n)
	{
		return !isNaN(parseFloat(n)) && isFinite(n);
	}

	rmask.definitions = {};

	rmask.addDef = function(name)
	{
		if(regExReserved.test(name))
			throw new Error("RangerMask.addDef(\""+name+"\"): definitions can't contain the mask special characters");

		var places = rmask.definitions[name] = [];
		return new PlaceBuilder(places);
	};

	rmask.define = function (pattern, options)
	{
		var mask = new Mask();

		// Apply any options to the mask
		if(options)
		{
			if(typeof options.placeholder == "string")
				mask.placeholder = options.placeholder;
			if(typeof options.displayPlaceholder == "string")
				mask.displayPlaceholder = options.displayPlaceholder;
			if(typeof options.showMaskWhenEmpty == "boolean")
				mask.rootSection.optional = !options.showMaskWhenEmpty;
			if(typeof options.defaultCallback == "function")
				mask.defaultCallback = options.defaultCallback;
		}

		var lastDef = null;
		var currentSection = mask.rootSection;

		while(pattern.length > 0)
		{
			var definition = startsWithDefinition(pattern, rmask.definitions);
			if(definition) // Check for defined pattern
			{
				lastDef = [];
				$.each(rmask.definitions[definition], function(i, place)
				{
					var placeCopy = place.copy(currentSection);
					lastDef.push(placeCopy);
					mask.places.push(placeCopy);
					currentSection.parts.push(placeCopy);
				});
				pattern = pattern.substr(definition.length);
			}
			else if(pattern.indexOf("?") == 0) // Previous place is optional
			{
				if(lastDef == null)
					throw new Error("Optional place (i.e. ?) at invalid point in mask definition");

				mask.places = mask.places.slice(0, -lastDef.length); // remove last def from places
				currentSection.parts = currentSection.parts.slice(0, -lastDef.length); // remove from currentSection too
				$.each(lastDef, function(i, place)
				{
					var optionalPlace = place.copy(currentSection, true);
					mask.places.push(optionalPlace);
					currentSection.parts.push(optionalPlace);
				});
				pattern = pattern.substr(1);
				lastDef = null; // So that another modifier can't follow this
			}
			else if(pattern.indexOf("{") == 0) // Begin repetition 
			{
				if(lastDef == null)
					throw new Error("Mask repetition (i.e. {..}) at invalid point in mask definition");

				var repeatPattern = pattern.slice(0, pattern.indexOf("}")+1);
				pattern = pattern.substr(repeatPattern.length);
				repeatPattern = repeatPattern.slice(1, -1);
				var parts = repeatPattern.split(",");
				if(parts.length > 2 || !isNumber(parts[0]))
					throw new Error("Invalid mask repetition (i.e. {..})");

				var min = parseInt(parts[0]);
				var max = min;
				if(parts.length == 2)
				{
					if(!isNumber(parts[1]))
						throw new Error("Invalid mask repetition (i.e. {..})");

					max = parseInt(parts[1]);
				}
				
				mask.places = mask.places.slice(0, -lastDef.length); // remove last def from places
				currentSection.parts = currentSection.parts.slice(0, -lastDef.length); // remove from currentSection too
				for(var i=0; i<max; i++)
				{
					var optional = i >= min;
					$.each(lastDef, function(i, place)
					{
						var placeCopy = place.copy(currentSection, optional)
						mask.places.push(placeCopy);
						currentSection.parts.push(placeCopy);
					});
				}
				lastDef = null; // So that another modifier can't follow this
			}
			else if(pattern.indexOf("(") == 0) // Enter an optional section
			{
				var newSection = new Section(currentSection, true);
				currentSection.parts.push(newSection);
				currentSection = newSection;
				pattern = pattern.substr(1);
				lastDef = null; // So that another modifier can't follow this
			}
			else if(pattern.indexOf(")") == 0) // Exit an optional section
			{
				if(currentSection.parentSection == null)
					throw new Error("Unbalanced parentheses, too many right parentheses");

				currentSection = currentSection.parentSection;
				pattern = pattern.substr(1);
				lastDef = null; // So that another modifier can't follow this
			}
			else // Fixed place
			{
				// Support escape of next char
				if(pattern.indexOf("/") == 0) // i.e. pattern.startsWith("/")
					pattern = pattern.substr(1);

				if(pattern.length == 0)
					throw new Error("Escape "/" can't be at end of mask definition");

				var fixedPlace = new FixedPlace(currentSection, pattern.substr(0, 1));

				lastDef = [fixedPlace];
				mask.places.push(fixedPlace);
				if(!currentSection.optional)
					mask.containsRequiredFixedPlaces = true;
				currentSection.parts.push(fixedPlace);
				pattern = pattern.substr(1);
			}
		}

		if(currentSection.parentSection != null)
			throw new Error("Unclosed parentheses");

		mask.init();

		return mask;
	};

	rmask.leadingZerosCallback = function(digits)
	{
		return function (data, index)
		{
			var start = index-(digits-1);
			var value = data.places.slice(start, index+1).join("");

			if(value != "")
			{
				while(value.length < digits)
					value = "0" + value;

				for(var i=0; i<value.length; i++)
					data.places[start+i] = value.charAt(i);
			}
		};
	};

	rmask.capsCallback = function (data, index)
	{
		data.places[index] = data.places[index].toUpperCase();
	};

	var currentYear = new Date().getFullYear();
	var lastCentury = ((currentYear - (currentYear % 100) - 100) / 100).toString();

	rmask.yearCallback = function (data, index)
	{
		var start = index-(3);
		var value = data.places.slice(start, index+1).join("");

		if(value == "")
	        value = currentYear.toString();
	    else if(value.length <= 2)
		{
			var year = parseInt(lastCentury + ('00' + value).slice(-2)); // Safely convert to a year (handle '05' etc)

			while(year < currentYear - 49)
	        	year += 100;

			value = year.toString();
		}

		if(value.length < 4)
			value = ('0000' + value).slice(-4);

		for(var i=0; i<value.length; i++)
			data.places[start+i] = value.charAt(i);
	};
})(RangerMask);

// Add standard definitions
RangerMask.addDef("0").place("0-9", "0");
RangerMask.addDef("0,").place("0-9", "0").separator(",", 3);
RangerMask.addDef("9").place("0-9");
RangerMask.addDef("9,").place("0-9").separator(",", 3);
RangerMask.addDef("x").place("A-Fa-f0-9");
RangerMask.addDef("a").place("A-Za-z");
RangerMask.addDef("h").place("0-9").place("0-9", null, true);
RangerMask.addDef("hh").place("0-9").place("0-9", null, true, RangerMask.leadingZerosCallback(2));
RangerMask.addDef("t").place("aApP");
RangerMask.addDef("tt").place("aApP", null, false, RangerMask.capsCallback).place("mM", "M", false, RangerMask.capsCallback);
RangerMask.addDef("d").place("0-9").place("0-9", null, true);
RangerMask.addDef("dd").place("0-9").place("0-9", null, true, RangerMask.leadingZerosCallback(2));
RangerMask.addDef("m").place("0-9").place("0-9", null, true);
RangerMask.addDef("mm").place("0-9").place("0-9", null, true, RangerMask.leadingZerosCallback(2));
RangerMask.addDef("yy").place("0-9").place("0-9", null, true, RangerMask.leadingZerosCallback(2));
RangerMask.addDef("yyyy").place("0-9").place("0-9", null, true)
							.place("0-9", null, true).place("0-9", null, true, RangerMask.yearCallback);

// Define standard masks
RangerMask.zip = RangerMask.define("9{5}");
RangerMask.zip4 = RangerMask.define("9{5}(-9{4})");
RangerMask.ssn = RangerMask.define("999-99-9999");
RangerMask.ein = RangerMask.define("99-999999");
RangerMask.ip = RangerMask.define("9?9?0.9?9?0.9?9?0.9?9?0");
RangerMask.ip6 = RangerMask.define("x{0,4}:x{0,4}:x{0,4}:x{0,4}:x{0,4}:x{0,4}:x{0,4}:x{0,4}");
RangerMask.guid = RangerMask.define("x{8}-x{4}-x{4}-x{4}-x{12}");
RangerMask.guidBraced = RangerMask.define("/{x{8}-x{4}-x{4}-x{4}-x{12}/}");

(function ($)
{
	// Returns a selection object with start and length of selection of the text in the element
	function getSelection(element)
	{
		var selection = {};
		if(element.setSelectionRange)
		{
			selection.start = element.selectionStart;
			selection.length = element.selectionEnd - selection.start;
		}
		else if(document.selection && document.selection.createRange)
		{
			var range = document.selection.createRange();
			selection.start = 0 - range.duplicate().moveStart('character', -100000);
			selection.length = range.text.length;
		}
		return selection;
	}

	// Sets the selection of the element, to the start and length provided
	function setSelection(element, selection)
	{
		var end = selection.start + selection.length;
		if(element.setSelectionRange)
			element.setSelectionRange(selection.start, end);
		else if(element.createTextRange)
		{
			var range = element.createTextRange();
			range.collapse(true);
			range.moveEnd('character', end);
			range.moveStart('character', selection.start);
			range.select();
		}
	}

	// Returns the Data for the element with the current selection applied to it
	function getData(element, mask)
	{
		var data = element.data("rangerMaskData");
		mask.setSelection(data, getSelection(element[0]));
		return data;
	}

	function setState(element, state)
	{
		element.val(state.value);
		setSelection(element[0], state.selection);
	}

	$.fn.rangerUnmask = function ()
	{
		this.filter("input[type='text']")
		.unbind(".rangerMask")
		.each(function()
		{
			var element = $(this);
			var data = element.data("rangerMaskData");
			if(data)
				element.attr("maxlength", data.maxlength);
			element.removeData("rangerMaskData");
		});
		return this;
	};

	$.fn.rangerMask = function (mask)
	{
		this.filter("input[type='text']")
		.rangerUnmask()// Remove any previously applied mask
		.each(function ()
		{
			var element = $(this);
			var data = mask.apply(element.val());

			data.maxlength = element.attr("maxlength");
			element.removeAttr("maxlength");

			element.data("rangerMaskData", data);

			element.val(mask.displayState(data).value);
			data.unmodifiedStateValue = element.val();
		})
		.bind("focus.rangerMask", function (e)
		{
			var element = $(this);
			element.trigger("rangerMask_Focus");
			var data = getData(element, mask);

			// If the element value has been programmatically changed, update places (but not selection) to reflect that
			if(element.val() != data.unmodifiedStateValue)
			{
				var newVal = element.val();
				data.places = mask.apply(newVal).places;
				data.unmodifiedStateValue = newVal;
			}

			setState(element, mask.maskedState(data));
		})
		.bind("blur.rangerMask", function (e)
		{
			var element = $(this);
			var data = getData(element, mask);
			mask.applyDefaultFill(data);
			if(mask.defaultCallback)
				mask.defaultCallback(element, data);
			element.val(mask.displayState(data).value);
			var valueChanged = data.unmodifiedStateValue != element.val()
			data.unmodifiedStateValue = element.val();

			if(valueChanged)
				element.trigger("rangerMask_Change");

			element.trigger("rangerMask_Blur");
		})
		.bind("keydown.rangerMask", function (e)
		{
			// In IE these chars don't send keypress
			if(e.which == 8 || e.which == 46)
			{
				var element = $(this);
				var data = getData(element, mask);
				if(e.which == 8) // Backspace
					mask.backspace(data, data);
				else // Delete
					mask.del(data, data);
				setState(element, mask.maskedState(data));
				return false;
			}
		})
		.bind("keypress.rangerMask", function (e)
		{
			if(e.ctrlKey || e.altKey || e.metaKey || e.which < 32)
				return true;
			if((32 <= e.which && e.which <= 126) || e.which >= 128) // If typeable char
			{
				var element = $(this);
				var data = getData(element, mask);
				mask.type(data, String.fromCharCode(e.which));
				setState(element, mask.maskedState(data));
			}
			return false;
		})
		.bind("cut.rangerMask", function (e)
		{
			var element = $(this);
			var data = getData(element, mask);
			mask.del(data);
			setState(element, mask.maskedState(data));
		})
		.bind("paste.rangerMask", function (e)
		{
			var selection = getSelection(this);
			var element = $(this);
			var data = getData(element, mask);
			// Use setTimeout to wait for the paste to complete
			setTimeout(function()
			{
				var selectionAfterPaste = getSelection(element[0]);
				var pastedText = element.val().slice(selection.start, selectionAfterPaste.start);
				mask.paste(data, pastedText);
				setState(element, mask.maskedState(data));;
			}, 0);
		});
		return this;
	};
})(jQuery);
