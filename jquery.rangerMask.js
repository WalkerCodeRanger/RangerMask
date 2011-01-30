/*
RangerMask
Masked Input plugin for jQuery
Copyright (c) 2010 Jeffery Walker (WalkerCodeRanger.com)
Licensed under ...
Version: 0.1.0
*/

/*
features?

fields & separators
field alignment?
paste
regEx fields? i.e. dd = 1-31 so that typing "61/2012'->"6/1/2012" becuase it couldn't be 61/...
tab in
shift-tab in
mouse click in
mouse select range
placeholder
empty display? ie. show " / / " for dates but grayed out
optional parts i.e. phone extension or for zip+4
optional negative sign
good way to do am/pm
allow cusor to pass through separators as you type them?
escape of defined chars to you can make them separators?
How to handle things like , in currency?
Ways to handle defaulted parts so "1/1"->"1/1/2011" etc?
Typing separator selects whole next field
*/

// Build regular expression for each field
// combine into regex for whole thing
//new RegExp("^" + regexstring + "$")

// functions for handling events
// break it into fields with the regex?

/*
Masks are composed of sections
sections are either separators or fields
fields are composed of fields

*/

// Namespace
var RangerMask = {};

// Setup Namespace
(function (rmask)
{
//	function padRight(value, count, pad)
//	{
//		var padCount = count - value.length;
//		for(var i = 0; i < padCount; i++)
//			value += pad;

//		return value;
//	}

//	function padLeft(value, count, pad)
//	{
//		var padCount = count - value.length;
//		for(var i = 0; i < padCount; i++)
//			value = pad + value;

//		return value;
//	}

	function repeat(value, times)
	{
		var repeated = "";
		for(var i=0; i<times; i++)
			repeated += value;
		return repeated;
	}

	var regExSpecials = /[.*?|()^$\[\]{}\\]/g; // .*+?|^$()[]{}\
	function escapeRegEx(str)
	{
		return str.replace(regExSpecials, "\\$&");
	}

	function copyData(from, to)
	{
		if(!to) to = new Object();
		to.places = from.places.slice(0);
		to.caret = from.caret;
		to.selection = from.selection;
		return to;
	}

	var nullPlace =
	{
		type: function() { return false; },
		push: function() { return false; },
		seek: function() { return false; }
	};

	// Class Mask
	function Mask()
	{
		this.regEx = null;
		this.places = [];
		this.placeholder = "_";
	}

	Mask.prototype.val = function (data)
	{
		return data.places.join("")
	}

	Mask.prototype.maskedVal = function (data)
	{
		var placeholdersNeeded = 0;
		var placeholder = this.placeholder; // make it available to lambdas
		return $.map(this.places, function(place, i)
		{
			var placeVal = data.places[i];
			// When you hit a real non-optional value, placeholder may be needed before it
			if(placeVal != "" && !place.optional)
			{
				var placholders = repeat(placeholder, placeholdersNeeded);
				placeholdersNeeded = 0;
				return placholders + placeVal;
			}

			if(!place.optional && placeVal == "")
				placeholdersNeeded++;
			else if(place.optional && placeVal != "")
				placeholdersNeeded--;

			return placeVal;
		}).join("") + repeat(placeholder, placeholdersNeeded); // May need placeholders at the end
	}

	// internal methods
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

		// now that places are inited, we can build our regEx etc.
		this.regEx = new RegExp("^" + $.map(this.places, function (p) { return "(" + p.pattern + ")"; }).join("") + "$");
		this.maskedEmptyVal = $.map(this.places, function (p) { return p.maskedEmptyVal; }).join("");
	}

	Mask.prototype.selectAll = function (data)
	{
		data.caret = 0;
		data.selection = this.places.length;
	}

	Mask.prototype.deleteSelection = function(data)
	{
		if(data.selection > 0)
		{
			// TODO delete chars in selection
		}
	}

	// typeInternal assumes that data.selection == 0
//	Mask.prototype.typeInternal = function (data, char)
//	{
//		// first section containing caret (i.e. __^-__ would be in first field, not the separator)
//		var index;
//		var past = 0;	
//		for(index=0; index<data.sections.length; index++)
//		{
//			if(past <= data.caret && data.caret-past <= data.sections[index].length)
//				break;

//			 past += data.sections[index].length;
//		}

//		var caretInSection = data.caret - past;
//		var result = null;
//		while(index < this.sections.length && result == null )
//		{
//			result = this.sections[index].type(data, char, index, caretInSection, past)
//			past += data.sections[index].length;
//			caretInSection = 0;
//			index++;
//		}

//		return result ? result : false;
//	}

	// Actions
	Mask.prototype.apply = function (data, value)
	{
		var placeholder = this.placeholder; // make it available to lambdas
		var matches = this.regEx.exec(value);
		if(matches)
			data.places = $.map(matches.slice(1), function(p) { return p==placeholder ? "" : p });
		else
		{
			data.places = $.map(this.places, function (p) { return p.emptyVal; });
			data.caret = 0;
			data.selection = 0;
			var mask = this; // make it available to lambdas
			$.each(value.split(""), function(i, char)
			{
				mask.type(data, char);
			});
		}

		this.selectAll(data);
	}

	Mask.prototype.type = function (data, char)
	{
		var tryData = copyData(data);
		this.deleteSelection(tryData);
		if(this.places[tryData.caret].type(tryData, char));
			copyData(tryData, data);
	}

	Mask.prototype.paste = function (data, newValue)
	{
		var tryData = copyData(data);
		this.deleteSelection(tryData);
		//TODO: Type all the characters pasted in
	}

	Mask.prototype.backspace = function (data)
	{
		if(data.selection == 0)
		{
			if(data.caret == 0) // ignore backspace at beginning
				return;

			data.caret -= 1;
			data.selection = 1;
		}
		this.deleteSelection(data);
	}

	Mask.prototype.del = function (data)
	{
		if(data.selection == 0)
		{
			if(data.caret == this.val(data).length) // ignore delete at end
				return;

			data.selection = 1;
		}
		this.deleteSelection(data);
	}

	// Class Place
	function Place(charClass, optional, defaultFill)
	{
		this.fixed = false;
		this.optional = optional;
		this.charClass = charClass;
		this.defaultFill = defaultFill;
		this.emptyVal = "";
		this.regEx = new RegExp("^["+charClass+"]$");
	}

	Place.prototype.clone = function()
	{
		return new Place(this.charClass, this.optional, this.defaultFill);
	}

	Place.prototype.init = function ()
	{
		this.pattern = this.optional ? "[" + this.charClass + "]?" : "[" + this.charClass + this.mask.placeholder + "]";
		this.maskedEmptyVal = this.optional ? "" : this.mask.placeholder;
	};

	//	Field.prototype.type = function (data, char, index, caret, past)
//	{
//		var fieldValue = data.sections[index];
//		// TODO handle pushing
//		var offset = fieldValue.charAt(caret) == this.mask.placeholder ? 1 : 0;
//		var changedValue = fieldValue.slice(0, caret) + char + fieldValue.slice(caret+offset);
//			
//		if(this.allows(changedValue))
//		{
//			data.sections[index] = changedValue;
//			data.caret = past + caret + 1;
//			return true;
//		}
//		// Allow this character to spill over into the next section if that is valid
//		else if(caret == fieldValue.length)
//			return null; 
//		// Allow a separator char to jump us out of this field
//		else if(index+1 < data.sections.length && data.sections[index+1].indexOf(char) != -1)
//			return null;

//		return false;
//	}

	Place.prototype.val = function(data, value)
	{
		if(value)
			data.places[this.index] = value;
		else
			return data.places[this.index];
	}

	Place.prototype.type = function(data, char)
	{
		if(this.regEx.test(char))
		{
			if(this.val(data) == "" || this.next.push(data, this.val(data)))
			{
				this.val(data, char);
				data.caret = this.index + 1;
				return true;
			}
			return false;
		}
		else
			return this.next.seek(data, char, false); // TODO seems like there is more to it than this
	};

	Place.prototype.seek = function(data, char, fixedPlaceFound)
	{
		if(fixedPlaceFound || this.val(data) != "")
			return false;

		return this.next.seek(data, char, false);
	};

	Place.prototype.push = function(data, char)
	{
		return false; // TODO Not Implememented
	};

	// Class FixedPlace
	function FixedPlace(value)
	{
		this.fixed = true;
		this.optional = false;
		this.pattern = escapeRegEx(value);
		this.value = value;
		this.emptyVal = value;
		this.maskedEmptyVal = value;
	};

	FixedPlace.prototype.init = function ()
	{
	};

	FixedPlace.prototype.type = function(data, char)
	{
		if(char == this.value)
		{
			data.caret = this.index + 1;
			return true;
		}
		else
			return this.next.type(data, char);
	}

	FixedPlace.prototype.seek = function(data, char, fixedPlaceFound)
	{
		if(char == this.value)
		{
			data.caret = this.index + 1;
			return true;
		}

		return this.next.seek(data, char, true);
	};

	FixedPlace.prototype.push = function(data, char)
	{
		return false; // TODO Not Implememented
	};

	// Class PlaceBuilder
	function PlaceBuilder(places)
	{
		this.places = places;
	}

	PlaceBuilder.prototype.place = function(charClass, optional, defaultFill)
	{
		this.places.push(new Place(charClass, optional, defaultFill));
		return this;
	}

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

	rmask.definitions = {};

	rmask.addDef  = function(name)
	{
		// TODO a def can't contain the escape char /
		var places = rmask.definitions[name] = [];
		return new PlaceBuilder(places);
	}

	rmask.define = function (pattern, options)
	{
		var mask = new Mask();

		if(options && options.placeholder)
			mask.placeholder = options.placeholder;

		while(pattern.length > 0)
		{
			var definition = startsWithDefinition(pattern, rmask.definitions);
			if(definition)
			{
				$.each(rmask.definitions[definition], function(i, place)
				{
					mask.places.push(place.clone());
				});
				pattern = pattern.substr(definition.length);
			}
			else
			{
				// Support escape of next char
				if(pattern.indexOf("/") == 0) // i.e. pattern.startsWith("/")
					pattern = pattern.substr(1);

				mask.places.push(new FixedPlace(pattern.substr(0, 1)));
				pattern = pattern.substr(1);
			}
		}
		mask.init();

		return mask;
	};
})(RangerMask);

// Add standard definitions
RangerMask.addDef("0").place("0-9", false, "0");
RangerMask.addDef("9").place("0-9", false);
RangerMask.addDef("#").place("0-9", true);
RangerMask.addDef("x").place("A-Fa-f0-9", true);
RangerMask.addDef("X").place("A-Fa-f0-9", false);
RangerMask.addDef("a").place("A-Za-z", true);
RangerMask.addDef("A").place("A-Za-z", false);
RangerMask.addDef("*").place("A-Za-z0-9", true);
RangerMask.addDef("?").place("A-Za-z0-9", false);
RangerMask.addDef("mm").place("1-9", false).place("0-9", true);
RangerMask.addDef("MM").place("0-9", false, "0").place("0-9", false);
RangerMask.addDef("dd").place("1-9", false).place("0-9", true);
RangerMask.addDef("DD").place("0-9", false, "0").place("0-9", false);
RangerMask.addDef("yy").place("0-9", false).place("0-9", true);
RangerMask.addDef("yyyy").place("0-9", true).place("0-9", true).place("0-9", true).place("0-9", true);
RangerMask.addDef("yyYY").place("1-9", true).place("0-9", true).place("0-9", false).place("0-9", false);

// Define standard masks
RangerMask.zip = RangerMask.define("99999");
RangerMask.zip4 = RangerMask.define("99999-####");
RangerMask.ssn = RangerMask.define("999-99-9999");
RangerMask.ein = RangerMask.define("99-999999");
RangerMask.ip = RangerMask.define("##0.##0.##0.##0");
RangerMask.ip6 = RangerMask.define("xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx");
RangerMask.guid = RangerMask.define("XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX");
RangerMask.guidBraced = RangerMask.define("{XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}");

(function ($)
{
	function getSelection(element, data)
	{
		var caret, length;
		if(element.setSelectionRange)
		{
			caret = element.selectionStart;
			length = element.selectionEnd - caret;
		}
		else //if (document.selection && document.selection.createRange)
		{
			var range = document.selection.createRange();
			caret = 0 - range.duplicate().moveStart('character', -100000);
			length = range.text.length;
		}
		data.caret = begin;
		data.selection = length;
	}

	function setSelection(element, to)
	{
		var end = to.caret + to.selection;
		if(element.setSelectionRange)
			element.setSelectionRange(to.caret, end);
		else //if (this.createTextRange)
		{
			var range = element.createTextRange();
			range.collapse(true);
			range.moveEnd('character', end);
			range.moveStart('character', to.caret);
			range.select();
		}
	}

	function storeOldValues(element)
	{
		var data = { length: element.valueOf().length };
		getSelection(element[0], data);
		element.data("rangerMaskData", data);
	}

	function applyState(element, data)
	{
		element.val(data.sections.join(""));
		setSelection(element[0], data);
	}

	$.fn.rangerMask = function (mask)
	{
		this.each(function ()
		{
			var element = $(this);
			var data = new Object();
			data.maxlength = element.attr("maxlength");
			element.removeAttr("maxlength");
			mask.apply(data, element.val());
			element.data("rangerMaskData", data);
			applyState(element, data);
		})
		.bind("keypress.rangerMask", function (e)
		{
			if(e.ctrlKey || e.altKey || e.metaKey)
				return true;
			if((32 <= e.which && e.which <= 126) || e.which >= 128) // If typeable char
			{
				var element = $(this);
				var data = element.data("rangerMaskData");
				getSelection(this, data);
				mask.type(data, String.fromCharCode(e.which));
				applyState(element, data);
			}
			return false;
		})
		.bind("paste.rangerMask", function (e)
		{
			var element = $(this);
			var data = element.data("rangerMaskData");
			mask.paste(data, element.val());
			setSelection(this, data);
		});
		return this;
	};
	$.fn.rangerUnmask = function ()
	{
		return this.unbind(".rangerMask");
	};
})(jQuery);