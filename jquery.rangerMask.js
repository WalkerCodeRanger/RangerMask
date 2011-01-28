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

var RangerMask = new (function ()
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

	/*
	Masks are composed of sections
	sections are either separators or fields
	fields are composed of fields

	*/

	function Mask()
	{
		//fields
		this.regEx = null;
		this.sections = [];
		this.placeholderVal = "_";
	}

	// Define
	Mask.prototype.placeholder = function (placeholder)
	{
		this.placeholderVal = placeholder;
	}

	Mask.prototype.separator = function (value)
	{
		this.sections.push(new Separator(this, value));
		return this;
	}

	Mask.prototype.field = function (places, placeholder)
	{
		this.sections.push(new Field(this, places, placeholder));
		return this;
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
			this.selectAll(data);
			for(char in value.split())
				this.type(data, char);
		}

		this.selectAll(data);
	}

	Mask.prototype.type = function (data, char)
	{
	}

	Mask.prototype.paste = function (data, newValue)
	{
		this.backspace(data);
		//TODO: Type all the characters pasted in
	}

	Mask.prototype.backspace = function (data)
	{
	}

	Mask.prototype.del = function (data)
	{
	}

	function Field(mask, places, placeholder)
	{
		this.mask = mask;
		this.placeholder = placeholder ? placeholder : mask.placeholderVal;
		placeholder = this.placeholder; // Set the placeholder value back to that it is available
		this.blankVal = $.map(places, function (p) { return p.optional ? "" : placeholder }).join("");
		this.pattern = $.map(places, function (p) { return p.createPattern(placeholder); }).join("");
	}

	function Separator(mask, value)
	{
		this.pattern = escapeRegEx(value);
		this.blankVal = value;
	}

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

	this.definitions =
	{
		"0": [new Place("0-9", false, "0")],
		"9": [new Place("0-9", false)],
		"#": [new Place("0-9", true)],
		"x": [new Place("A-Fa-f0-9", true)],
		"X": [new Place("A-Fa-f0-9", false)],
		"a": [new Place("A-Za-z", true)],
		"A": [new Place("A-Za-z", false)],
		"*": [new Place("A-Za-z0-9", true)],
		"?": [new Place("A-Za-z0-9", false)],
		"dd": [new Place("1-9", false),
				new Place("0-9", true)]
	};

	// Find the longest defintion that starts the pattern
	function startsWithDefinition(pattern, definitions)
	{
		var definition = "";
		for(def in definitions)
			if(pattern.indexOf(def) == 0) // i.e. pattern.startsWith(def)
				if(def.length >= definition.length) // if two patterns are same length take longer
					definition = def;

		return definition.length > 0 ? definition : null;
	}

	this.define = function (pattern, placeholder)
	{
		var mask = new Mask();

		if(placeholder)
			mask.placeholder(placeholder);

		if(pattern)
		{
			var separatorValue = "";
			var fieldPlaces = [];
			while(pattern.length > 0)
			{
				//pattern = pattern.substr(1);
				// TODO handle escape chars

				var definition = startsWithDefinition(pattern, this.definitions);

				if(definition)
				{
					if(separatorValue.length > 0)
					{
						mask.separator(separatorValue);
						separatorValue = "";
					}

					fieldPlaces = fieldPlaces.concat(this.definitions[definition]);
					pattern = pattern.substr(definition.length);
				}
				else
				{
					if(fieldPlaces.length > 0)
					{
						mask.field(fieldPlaces);
						fieldPlaces = [];
					}

					separatorValue += pattern.substr(0, 1);
					pattern = pattern.substr(1);
				}
			}

			// Add the last field or separator
			if(fieldPlaces.length > 0)
			{
				mask.field(fieldPlaces);
				fieldPlaces = [];
			} else if(separatorValue.length > 0)
			{
				mask.separator(separatorValue);
				separatorValue = "";
			}
		}
		return mask;
	};

	this.zip = this.define("99999");
	this.zip4 = this.define("99999-####");
	this.ssn = this.define("999-99-9999");
	this.ein = this.define("99-999999");
	this.ip = this.define("##0.##0.##0.##0");
	this.ip6 = this.define("xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx");
})();

(function ($)
{
	function getSelection(element)
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
		return { caret: begin, selection: length };
	}

	function setSelection(element, selection)
	{
		var end = selection.caret + selection.length;
		if(element.setSelectionRange)
			element.setSelectionRange(selection.caret, end);
		else //if (this.createTextRange)
		{
			var range = element.createTextRange();
			range.collapse(true);
			range.moveEnd('character', end);
			range.moveStart('character', begin);
			range.select();
		}
	}

	function storeOldValues(element)
	{
		var data = getSelection(element[0]);
		data.length = element.valueOf().length;
		element.data("rangerMaskData", data);
	}

	function applyState(element, data)
	{
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
		})
			.bind("paste", function (e)
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