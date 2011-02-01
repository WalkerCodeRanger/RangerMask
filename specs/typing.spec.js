/*
The tests in this section are based around a set of possible contexts.  I context consists of two things,
where the cursor is relative to places, and where entered values are around the cursor.

Since the places before the cursor don't matter, it only matters what follows.  There are three types of places,
namely fixed, required and optional. Additionally the end of the mask affects typing.  Finally, whether there
are values in the required an optional places matters.  Thus contexts are described as a comma separated list
of the places following the cursor. It is assumed no value is present unless the word "value" follow the place.

Cursor positions are illustrated by the carets in ^{^_^_^_^-^$^_^}^ but these positions can be simplified
to only 6 cases like so 1{2_3_4_5-6$2__7}8.  Those 8 cases are described as:
1. Before fixed
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

	describe("Required places", function ()
	{
		beforeEach(function ()
		{
			mask = RangerMask.define("999");
			data = dataFor(mask, "^___");
		});

		it("invalid char ignored", function ()
		{
			mask.type(data, "a");
			expect(valueOf(mask, data)).toEqual("^___");
		});

		it("valid char accepted, cursor advanced", function ()
		{
			mask.type(data, "3");
			expect(valueOf(mask, data)).toEqual("3^__");
		});
	});


	describe("Fixed places", function ()
	{
		beforeEach(function ()
		{
			mask = RangerMask.define("-$9");
			data = dataFor(mask, "^-$_");
		});

		it("invalid char ignored", function ()
		{
			mask.type(data, "a");
			expect(valueOf(mask, data)).toEqual("^-$_");
		});

		it("fixed char advances cursor", function ()
		{
			mask.type(data, "-");
			expect(valueOf(mask, data)).toEqual("-^$_");
		});

		it("fixed char seeks through fixed places", function ()
		{
			mask.type(data, "$");
			expect(valueOf(mask, data)).toEqual("-$^_");
		});

		it("char valid for place after fixed places types", function ()
		{
			mask.type(data, "5");
			expect(valueOf(mask, data)).toEqual("-$5^");
		});
	});

	describe("Optional places", function ()
	{
		beforeEach(function ()
		{
			mask = RangerMask.define("a~a99");
			data = dataFor(mask, "^__");
		});

		it("invalid char ignored", function ()
		{
			mask.type(data, "$");
			expect(valueOf(mask, data)).toEqual("^__");
		});

		it("valid char accepted, cursor advanced", function ()
		{
			mask.type(data, "f");
			expect(valueOf(mask, data)).toEqual("f^__");
		});

		it("char valid for next place accepted, cursor advanced", function ()
		{
			mask.type(data, "-");
			expect(valueOf(mask, data)).toEqual("-^__");
		});

		it("char valid after optional places accepted, cursor advanced", function ()
		{
			mask.type(data, "9");
			expect(valueOf(mask, data)).toEqual("9^_");
		});
	});

	describe("End of mask", function ()
	{
		beforeEach(function ()
		{
			mask = RangerMask.define("99");
			data = dataFor(mask, "84^");
		});

		it("ignores typing", function ()
		{
			mask.type(data, "a");
			mask.type(data, "5");
			expect(valueOf(mask, data)).toEqual("84^");
		});
	});

	describe("Seeking (moving cursor to fixed places)", function ()
	{
		beforeEach(function ()
		{
			mask = RangerMask.define("$99a-$99a//9");
			data = dataFor(mask, "$^__-$__/_");
		});

		it("should seek across required and optional places", function ()
		{
			mask.type(data, "-");
			expect(valueOf(mask, data)).toEqual("$__-^$__/_");
		});

		it("should seek across required, optional and fixed places", function ()
		{
			mask.type(data, "$");
			expect(valueOf(mask, data)).toEqual("$__-$^__/_");
		});

		it("should NOT seek beyond end of fixed places", function ()
		{
			mask.type(data, "/");
			expect(valueOf(mask, data)).toEqual("$^__-$__/_");
		});
	});

	describe("Pushing (move chars to the right to make room for a char being typed)", function ()
	{
		beforeEach(function ()
		{
			mask = RangerMask.define("99#-9a9");
		});

		it("should push into required place", function ()
		{
			data = dataFor(mask, "^1_-__");
			mask.type(data, "2");
			expect(valueOf(mask, data)).toEqual("2^1-__");
		});

		it("should push into optional place", function ()
		{
			data = dataFor(mask, "^21-__");
			mask.type(data, "3");
			expect(valueOf(mask, data)).toEqual("3^21-__");
		});

		it("should push across fixed place", function ()
		{
			data = dataFor(mask, "^321-__");
			mask.type(data, "4");
			expect(valueOf(mask, data)).toEqual("4^32-1_");
		});

		it("should not be allowed when char does go into pushed place", function ()
		{
			data = dataFor(mask, "__-^7_");
			mask.type(data, "6");
			expect(valueOf(mask, data)).toEqual("__-^7_");
		});

		it("should not be allowed to push past end", function ()
		{
			data = dataFor(mask, "__-_^7");
			mask.type(data, "3");
			expect(valueOf(mask, data)).toEqual("__-_^7");
		});
	});

	// TODO pushing
});