/*
The tests in this section are based around a set of possible contexts.  I context consists of two things,
where the cursor is relative to fields and separators, and where entered values are around the cursor.

Cursor positions are ilistrated by the carets in ^{^_^_^_^-^_^}^ but these positions can be simplified
to only 6 cases like so 1{2_3_4_5-2__6}7.  Those 6 cases are described as:
1. Before separator
2. Before field
3. Mid field
4. End of field
5. After field
6. After last field
7. After last char

It is generally assumed that a value has been entered up to the point of the cursor unless specified otherwise.
Other possibilities are that no value has been entered to the left called "after placeholder" or that a value
has been entered to the right, called "before value".  Of course both could happen at once.

*/

describe("RangerMask.type", function ()
{
	var mask;
	var data;

	describe("Mask {999-9}", function ()
	{
		beforeEach(function ()
		{
			mask = RangerMask.define("/{999-9/}");
		});

		describe("Caret before separator", function ()
		{
			beforeEach(function ()
			{
				data = dataFor(mask, "^{___-_}");
			});

			it("type invalid char doesn't change state", function ()
			{
				mask.type(data, "a");
				expect(valueOf(mask, data)).toEqual("^{___-_}");
			});

			it("type valid char, goes to next field with caret after", function ()
			{
				mask.type(data, "3");
				expect(valueOf(mask, data)).toEqual("{3^__-_}");
			});
		});

		describe("Caret mid field", function ()
		{
			beforeEach(function ()
			{
				data = dataFor(mask, "{3^__-_}");
			});

			it("type invalid char doesn't change state", function ()
			{
				mask.type(data, "a");
				expect(valueOf(mask, data)).toEqual("{3^__-_}");
			});

			it("type valid char, replaces placeholder and puts caret after ", function ()
			{
				mask.type(data, "8");
				expect(valueOf(mask, data)).toEqual("{38^_-_}");
			});
		});

		describe("Caret at end of field", function ()
		{
			beforeEach(function ()
			{
				data = dataFor(mask, "{34^_-_}");
			});

			it("type invalid char doesn't change state", function ()
			{
				mask.type(data, "a");
				expect(valueOf(mask, data)).toEqual("{34^_-_}");
			});

			it("type valid char, replaces placeholder and puts caret after ", function ()
			{
				mask.type(data, "8");
				expect(valueOf(mask, data)).toEqual("{348^-_}");
			});
		});

		describe("Caret after field", function ()
		{
			beforeEach(function ()
			{
				data = dataFor(mask, "{345^-_}");
			});

			it("type invalid char doesn't change state", function ()
			{
				mask.type(data, "a");
				expect(valueOf(mask, data)).toEqual("{345^-_}");
			});

			it("type valid char, replaces placeholder and puts caret after ", function ()
			{
				mask.type(data, "8");
				expect(valueOf(mask, data)).toEqual("{345-8^}");
			});
		});
	});

	//--------------------------------------------------------------------

	describe("advance on separator", function ()
	{
		it("one separator char", function ()
		{
			mask = RangerMask.define("/{ /}9.9");
			data = dataFor(mask, "^{ }_._");

			mask.type(data, "{");
			expect(valueOf(mask, data)).toEqual("{^ }_._");
		});

		it("two separator chars", function ()
		{
			mask.type(data, "}");
			expect(valueOf(mask, data)).toEqual("{ }^_._");
		});

		it("to next field", function ()
		{
			mask.type(data, ".");
			expect(valueOf(mask, data)).toEqual("{ }_.^_");
		});
	});
});