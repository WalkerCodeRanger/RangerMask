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
	function padRight(value, count, pad)
	{
		var padCount = count - value.length;
		for(var i = 0; i < padCount; i++)
			value += pad;

		return value;
	}

	var regExSpecials = /[.*?|()^$\[\]{}\\]/g; // .*+?|^$()[]{}\
	function escapeRegEx(str)
	{
		return str.replace(regExSpecials, "\\$&");
	}

	function copyData(from, to)
	{
		if(!to) to = new Object();
		to.sections = from.sections.slice(0);
		to.caret = from.caret;
		to.selection = from.selection;
		return to;
	}

	// Class Mask
	function Mask()
	{
		//fields
		this.regEx = null;
		this.sections = [];
		this.placeholder = "_";
	}

	// Properties
	Mask.prototype.blankVal = function ()
	{
		return $.map(this.sections, function (s) { return s.blankVal; }).join("");
	}

	Mask.prototype.val = function (data)
	{
		return data.sections.join("")
	}

	// internal methods
	Mask.prototype.initMask = function ()
	{
		if(this.regEx == null)
			this.regEx = new RegExp("^" + $.map(this.sections, function (s) { return "(" + s.pattern + ")"; }).join("") + "$");
	}

	Mask.prototype.selectAll = function (data)
	{
		data.caret = 0;
		data.selection = this.val(data).length;
	}

	Mask.prototype.deleteSelection = function(data)
	{
		if(data.selection > 0)
		{
			// TODO delete chars in selection
		}
	}

	// typeInternal assumes that data.selection == 0
	Mask.prototype.typeInternal = function (data, char)
	{
		// first section containing caret (i.e. __^-__ would be in first field, not the separator)
		var index;
		var past = 0;	
		for(index=0; index<data.sections.length; index++)
		{
			if(past <= data.caret && data.caret-past <= data.sections[index].length)
				break;

			 past += data.sections[index].length;
		}

		var caretInSection = data.caret - past;
		var result = null;
		while(index < this.sections.length && result == null )
		{
			result = this.sections[index].type(data, char, index, caretInSection, past)
			past += data.sections[index].length;
			caretInSection = 0;
			index++;
		}

		return result ? result : false;
	}

	// Actions
	Mask.prototype.init = function (data, value)
	{
		this.initMask();
		var matches = this.regEx.exec(value);
		if(matches)
			data.sections = matches.slice(1);
		else
		{
			data.sections = $.map(this.sections, function (s) { return s.blankVal; });
			data.caret = 0;
			data.selection = 0;
			var mask = this; // so it is available below
			$.each(value.split(""), function(i, char)
			{
				mask.type(data, char);
			});
		}

		this.selectAll(data);
		// TODO if result is blank value, then empty string should be displayed
	}

	Mask.prototype.type = function (data, char)
	{
		var tryData = copyData(data);
		this.deleteSelection(tryData);
		if(this.typeInternal(tryData, char));
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

	// Class Field
	function Field(mask, places)
	{
		this.isField = true;
		this.mask = mask;
		this.blankVal = $.map(places, function (p) { return p.optional ? "" : mask.placeholder }).join("");
		this.pattern = $.map(places, function (p) { return p.createPattern(mask.placeholder); }).join("");
		this.regEx = new RegExp("^"+this.pattern+"$");
	}

	Field.prototype.allows = function(value)
	{
		return this.regEx.test(value);
	}

	Field.prototype.type = function (data, char, index, caret, past)
	{
		var fieldValue = data.sections[index];
		// TODO handle pushing
		var offset = fieldValue.charAt(caret) == this.mask.placeholder ? 1 : 0;
		var changedValue = fieldValue.slice(0, caret) + char + fieldValue.slice(caret+offset);
			
		if(this.allows(changedValue))
		{
			data.sections[index] = changedValue;
			data.caret = past + caret + 1;
			return true;
		}
		// Allow this character to spill over into the next section if that is valid
		else if(caret == fieldValue.length)
			return null; 
		// Allow a separator char to jump us out of this field
		else if(index+1 < data.sections.length && data.sections[index+1].indexOf(char) != -1)
			return null;

		return false;
	}

	// Class Separator
	function Separator(mask, value)
	{
		this.isField = false;
		this.pattern = escapeRegEx(value);
		this.blankVal = value;
	}

	Separator.prototype.type = function(data, char, index, caret, past)
	{
		var value = data.sections[index];

		// Advance past the char in question
		var place = value.indexOf(char, caret);
		if(place != -1)
		{
			data.caret = past + place + 1;
			return true;
		}
		return null;
	}

	// Class Place
	function Place(charClass, optional, defaultFill)
	{
		this.charClass = charClass;
		this.optional = optional;
		this.defaultFill = defaultFill;
	}

	Place.prototype.createPattern = function (placeholder)
	{
		if(this.optional)
			return "[" + this.charClass + "]?";
		else
			return "[" + this.charClass + placeholder + "]";
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

		if(pattern)
		{
			var fieldPlaces = [];
			var separatorValue = "";
			var pushField = function()
			{
				if(fieldPlaces.length > 0)
				{
					mask.sections.push(new Field(mask, fieldPlaces));
					fieldPlaces = [];
				}
			};
			var pushSeparator = function()
			{
				if(separatorValue.length > 0)
				{
					mask.sections.push(new Separator(mask, separatorValue));
					separatorValue = "";
				}
			};
			while(pattern.length > 0)
			{
				var definition = startsWithDefinition(pattern, rmask.definitions);
				if(definition)
				{
					pushSeparator();
					fieldPlaces = fieldPlaces.concat(rmask.definitions[definition]);
					pattern = pattern.substr(definition.length);
				}
				else
				{
					pushField();

					// Support escape of next char
					if(pattern.indexOf("/") == 0) // i.e. pattern.startsWith("/")
						pattern = pattern.substr(1);

					separatorValue += pattern.substr(0, 1);
					pattern = pattern.substr(1);
				}
			}

			// Add the last field or separator
			pushField();
			pushSeparator();
		}
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
			mask.init(data, element.val());
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