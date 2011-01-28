/// <reference path="jquery-1.4.4.js" />
/// <reference path="jasmine-1.0.1/jasmine.js" />
/// <reference path="jquery.rangerMask.spec.js"/>

// http://regexpal.com/

String.prototype.insertAt=function (index, value)
{
	return this.slice(0, index)+value+this.slice(index);
}

function valueOf(data)
{
	var sections = data.sections.slice(0); // copy array
	var caret = data.caret;
	var selectionEnd = data.caret+data.selection;
	if(caret == selectionEnd)
		selectionEnd = -1; // Don't show the end if it equals the caret

	var past = 0;
	for(var i = 0; i < sections.length; i++)
	{
		// Save off the length because it will change if the caret is added
		var sectionLength = sections[i].length;
		
		// Insert the end caret first so its position won't be affected by the first caret
		if(past <= selectionEnd && selectionEnd < past + sections[i].length)
			sections[i] = sections[i].insertAt(selectionEnd - past, "^");

		// Insert first caret
		if (past <= caret && caret < past + sections[i].length)
			sections[i] = sections[i].insertAt(caret - past, "^");

		past += sectionLength;
	}
	
	// If the caret is at the absolute end we need to tack it on
	if(past == selectionEnd)
	{
		var i = sections.length - 1;
		sections[i] = sections[i] + "^";
	}

	return sections;
}

function ParsePattern(pattern)
{
	return {
		caret : pattern.indexOf("^"),
		selection : pattern.lastIndexOf("^")-pattern.indexOf("^"),
		value : pattern.replace("^", "")
	};
}

function SetupData(value)
{
	var data = new Object();

}


describe("RangerMask", function ()
{
	var mask;

	describe("Empty mask", function ()
	{
		it("can be defined", function ()
		{
			mask = RangerMask.define();
			expect(mask).toBeDefined();
			expect(mask).not.toBeNull();
		});

		it("should have empty blank value", function ()
		{
			expect(mask.blankVal()).toEqual("");
		});
	});

	describe("separator mask", function ()
	{
		it("can be defined", function ()
		{
			mask = RangerMask.define().separator("s$ ");
			expect(mask).toBeDefined();
			expect(mask).not.toBeNull();
		});

		it("should have proper blank value", function ()
		{
			expect(mask.blankVal()).toEqual("s$ ");
		});

		it("should init a valid value", function ()
		{
			var data = new Object();
			mask.init(data, "s$ ");
			expect(valueOf(data)).toEqual(["^s$ ^"]);
		});

		it("should init an invalid value", function ()
		{
			var data = new Object()
			mask.init(data, "foo");
			expect(valueOf(data)).toEqual(["^s$ ^"]);
		});
	});

	describe("custom field mask", function ()
	{
		it("can be defined", function ()
		{
			var places = RangerMask.definitions["A"];
			mask = RangerMask.define().customField(places, "_");
			expect(mask).toBeDefined();
			expect(mask).not.toBeNull();
		});

		it("should have proper blank value", function ()
		{
			expect(mask.blankVal()).toEqual("_");
		});

		it("should init a valid value", function ()
		{
			var data = new Object();
			mask.init(data, "P");
			expect(valueOf(data)).toEqual(["^P^"]);
		});

		it("should init an invalid value", function ()
		{
			var data = new Object();
			mask.init(data, "34");
			expect(valueOf(data)).toEqual(["^_^"]);
		});
	});
});