/*
RangerMask
Masked Input plugin for jQuery
Copyright (c) 2010 Jeffery Walker (WalkerCodeRanger.com)
Licensed under ...
Version: 0.1.0
*/

/*
Features To Do:
	paste
	tab in
	shift-tab in
	mouse click in
	mouse select range
	optional parts i.e. phone extension or for zip+4
	optional negative sign
	handle things like , in currency
	Ways to handle defaulted parts so "1/1"->"1/1/2011" etc?
	delete
	backaspace

Possible Features:
	right to left places
	context around a place allowing for more control (i.e. 61 is not a valid month)
	empty display? ie. show " / / " for dates but grayed out
	good way to do am/pm
	functions for handling events

Developer Notes:
	Please note that places includes the final null place which always has the value ""
*/

// Namespace
var RangerMask = {};

// Setup Namespace
(function (rmask)
{
	var regExSpecials = /[.*?|()^$\[\]{}\\]/g; // .*+?|^$()[]{}\
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
	}

	var nullPlace =
	{
		fixed: true,
		optional: true, // the null place is uniquely fixed and optional becuase it has no string value
		pattern: "",
		emptyVal: "",
		maskedEmptyVal: "",
		val: function() { return ""; },
		type: function() { return false; },
		push: function() { return false; },
		seek: function() { return false; },
		del: function() { }
	};

	// Class Mask
	function Mask()
	{
		this.regEx = null;
		this.places = [];
		this.placeholder = "_";
	}

	Mask.prototype.state = function (data)
	{
		var value = data.places.join("");
		var start = data.places.slice(0, data.selection.start).join("").length;
		var length = data.places.slice(0, data.selection.start + data.selection.length).join("").length - start;
		return { value: value, selection: { start: start, length: length }};
	}

	Mask.prototype.maskedPlaces = function(data)
	{
		var placeholder = this.placeholder; // make it available to lambda
		return $.map(this.places, function(place, i)
		{
			var placeVal = place.val(data);
			if(placeVal != "" || place.optional)
				return placeVal;
			else
				return placeholder;
		});
	}

	Mask.prototype.maskedState = function (data)
	{
		var maskedPlaces = this.maskedPlaces(data);
		var value = maskedPlaces.join("");
		var start = maskedPlaces.slice(0, data.selection.start).join("").length;
		var length = maskedPlaces.slice(0, data.selection.start + data.selection.length).join("").length - start;
		return { value: value, selection: { start: start, length: length }};
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
		this.places.push(nullPlace); // Put the null place at the end so we don't have to worry about cursor at end

		// now that places are inited, we can build our regEx etc.
		this.regEx = new RegExp("^" + $.map(this.places, function (p) { return "(" + p.pattern + ")"; }).join("") + "$");
		this.maskedEmptyVal = $.map(this.places, function (p) { return p.maskedEmptyVal; }).join("");
	}

	Mask.prototype.selectAll = function (data)
	{
		data.selection.start = 0;
		data.selection.length = this.places.length;
	}

	Mask.prototype.deleteSelection = function(data)
	{
		var selectionEnd = data.selection.start + data.selection.length;
		for(var i=data.selection.start; i<selectionEnd; i++)
			this.places[i].del(data);

		data.selection.length = 0;
	}

	// Actions
	Mask.prototype.apply = function (value)
	{
		var data;
		var placeholder = this.placeholder; // make it available to lambda
		var matches = this.regEx.exec(value);
		if(matches)
			return new Data($.map(matches.slice(1), function(p) { return p==placeholder ? "" : p }), 0, this.places.length);
		else
		{
			var data = new Data($.map(this.places, function (p) { return p.emptyVal; }), 0, 0);
			var mask = this; // make it available to lambda
			$.each(value.split(""), function(i, char)
			{
				mask.type(data, char);
			});
			this.selectAll(data);
			return data;
		}
	}

	Mask.prototype.type = function (data, char)
	{
		var tryData = data.copy();
		this.deleteSelection(tryData);
		if(this.places[tryData.selection.start].type(tryData, char));
			tryData.copy(data);
	}

	Mask.prototype.paste = function (data, pasted)
	{
		var tryData = data.copy();
		this.deleteSelection(tryData);
		var mask = this; // make it available to lambda
		var changed = false;
		$.each(pasted.split(""), function(i, char)
		{
			changed |= mask.places[tryData.selection.start].type(tryData, char)
		});
		if(changed)
			tryData.copy(data);
	}

	Mask.prototype.backspace = function (data)
	{
		// TODO this may be wrong because of blanks around the selection start
		if(data.selection.length == 0)
		{
			if(data.selection.start == 0) // ignore backspace at beginning
				return;

			data.selection.start -= 1;
			data.selection.length = 1;
		}
		this.deleteSelection(data);
	}

	Mask.prototype.del = function (data)
	{
		// TODO this may be wrong because of blanks around the selection start
		if(data.selection.length == 0)
		{
			if(data.selection.start == this.places.length) // ignore delete at end
				return;

			data.selection.length = 1;
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
	}

	Place.prototype.val = function(data, value)
	{
		if(typeof value === 'undefined')
			return data.places[this.index];
		else
			data.places[this.index] = value;
	}

	Place.prototype.type = function(data, char)
	{
		if(this.regEx.test(char))
		{
			if(this.val(data) == "" || this.next.push(data, this.val(data)))
			{
				this.val(data, char);
				data.selection.start = this.index + 1;
				return true;
			}
			return false;
		}
		else if(this.optional)
			return this.next.type(data, char);
		else
			return this.next.seek(data, char, false); // TODO seems like there is more to it than this
														// i.e. if we are optional then we could type next
	}

	Place.prototype.seek = function(data, char, fixedPlaceFound)
	{
		if(fixedPlaceFound || this.val(data) != "")
			return false;

		return this.next.seek(data, char, false);
	}

	Place.prototype.push = function(data, char)
	{
		return false; // TODO Not Implememented
	}

	Place.prototype.del = function (data)
	{
		this.val(data, "");
	}

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

	FixedPlace.prototype.val = function(data)
	{
		return this.value;
	}

	FixedPlace.prototype.type = function(data, char)
	{
		if(char == this.value)
		{
			data.selection.start = this.index + 1;
			return true;
		}
		else
			return this.next.type(data, char);
	}

	FixedPlace.prototype.seek = function(data, char, fixedPlaceFound)
	{
		if(char == this.value)
		{
			data.selection.start = this.index + 1;
			return true;
		}

		return this.next.seek(data, char, true);
	};

	FixedPlace.prototype.push = function(data, char)
	{
		return false; // TODO Not Implememented
	};

	FixedPlace.prototype.del = function (data)
	{
		// delete has no affect on a fixed place
	}

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
RangerMask.addDef("~").place("-", true); // optional minus sign
RangerMask.addDef("0").place("0-9", false, "0"); // TODO test and implement default fill
RangerMask.addDef("9").place("0-9", false);
RangerMask.addDef("#").place("0-9", true);
RangerMask.addDef("x").place("A-Fa-f0-9", true);
RangerMask.addDef("X").place("A-Fa-f0-9", false);
RangerMask.addDef("a").place("A-Za-z", true); // TODO support for non ascii?
RangerMask.addDef("A").place("A-Za-z", false);
RangerMask.addDef("*").place("A-Za-z0-9", true);
RangerMask.addDef("?").place("A-Za-z0-9", false); // TODO maybe the ? is needed for optional fixed places
RangerMask.addDef("mm").place("1-9", false).place("0-9", true);
RangerMask.addDef("MM").place("0-9", false, "0").place("0-9", false);
RangerMask.addDef("dd").place("1-9", false).place("0-9", true); // TODO allow lookahead and behind expressions to create better validation?
RangerMask.addDef("DD").place("0-9", false, "0").place("0-9", false);
RangerMask.addDef("yy").place("0-9", false).place("0-9", true);
RangerMask.addDef("yyyy").place("0-9", true).place("0-9", true).place("0-9", true).place("0-9", true);
RangerMask.addDef("yyYY").place("0-9", false).place("0-9", false).place("0-9", true).place("0-9", true);

// Reserve some characters for future use
RangerMask.addDef("<");
RangerMask.addDef(">");
RangerMask.addDef("(");
RangerMask.addDef(")");
RangerMask.addDef("["); // optional? char class?
RangerMask.addDef("]");
RangerMask.addDef("{");
RangerMask.addDef("}");

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
	function getSelection(element)
	{
		var selection = {};
		if(element.setSelectionRange)
		{
			selection.start = element.selectionStart;
			selection.length = element.selectionEnd - selection.start;
		}
		else //if (document.selection && document.selection.createRange)
		{
			var range = document.selection.createRange();
			selection.start = 0 - range.duplicate().moveStart('character', -100000);
			selection.length = range.text.length;
		}
		return selection;
	}

	function setSelection(element, selection)
	{
		var end = selection.start + selection.length;
		if(element.setSelectionRange)
			element.setSelectionRange(selection.start, end);
		else //if (this.createTextRange)
		{
			var range = element.createTextRange();
			range.collapse(true);
			range.moveEnd('character', end);
			range.moveStart('character', selection.start);
			range.select();
		}
	}

	function setState(element, state)
	{
		element.val(state.value);
		setSelection(element[0], state.selection);
	}

	$.fn.rangerMask = function (mask)
	{	
		// TODO remove any existing rangerMask on the elements
		// TODO filter to element the mask works on?
		this.each(function ()
		{
			var element = $(this);
			var data = mask.apply(element.val());

			data.maxlength = element.attr("maxlength");
			element.removeAttr("maxlength");

			element.data("rangerMaskData", data);

			element.val(mask.state(data).value);
		})
		.bind("keypress.rangerMask", function (e)
		{
			if(e.ctrlKey || e.altKey || e.metaKey)
				return true;
			if((32 <= e.which && e.which <= 126) || e.which >= 128) // If typeable char
			{
				var element = $(this);
				var data = element.data("rangerMaskData");
				// ? = getSelection(this);
				mask.type(data, String.fromCharCode(e.which));
				setState(element, mask.maskedState(data));
			}
			return false;
		})
		.bind("paste.rangerMask", function (e)
		{
			var selection = getSelection(this);
			var element = $(this);
			// Use setTimeout to wait for the paste to complete
			setTimeout(function()
			{
				var selectionAfterPaste = getSelection(element[0]);
				var pastedText = element.val().slice(selection.start, selectionAfterPaste.start);
				var data = element.data("rangerMaskData");
				mask.paste(data, pastedText);
				setState(element, mask.maskedState(data));;
			}, 0);
		});
		return this;
	};
	$.fn.rangerUnmask = function ()
	{
		return this.unbind(".rangerMask");
	};
})(jQuery);