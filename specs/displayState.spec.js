describe("RangerMask.displayState", function ()
{
	var mask;
	var data;

	describe("Show mask when empty = true", function ()
	{
		beforeEach(function ()
		{
			mask = RangerMask.define("999-99-9999", { showMaskWhenEmpty: true, displayPlaceholder: " " });
		});


		it("should shown display placeholders when empty", function ()
		{
			data = dataFor(mask, "^___-__-____");
			expect(displayValueOf(mask, data)).toEqual("^   -  -    ");
		});
	});


	describe("Show mask when empty = false", function ()
	{
		beforeEach(function ()
		{
			mask = RangerMask.define("999-99-9999", { showMaskWhenEmpty: false, displayPlaceholder: " " });
		});


		it("should NOT shown display placeholders when empty", function ()
		{
			data = dataFor(mask, "^___-__-____");
			expect(displayValueOf(mask, data)).toEqual("^");
		});
	});

	describe("Single Optional Section", function ()
	{
		beforeEach(function ()
		{
			mask = RangerMask.define("99999(-9999)", { displayPlaceholder: "`" });
		});


		it("should not be shown when empty", function ()
		{
			data = dataFor(mask, "45678^-____^");
			expect(displayValueOf(mask, data)).toEqual("45678^");
		});

		it("should be shown when not empty", function ()
		{
			data = dataFor(mask, "^45678-_7__");
			expect(displayValueOf(mask, data)).toEqual("^45678-`7``");
		});
	});

	describe("Nested optional places", function ()
	{
		beforeEach(function ()
		{
			mask = RangerMask.define("9(-9(-a-)9-)9", { displayPlaceholder: "`" });
		});

		it("outer should not be shown when empty", function ()
		{
			data = dataFor(mask, "^6-_-_^-_-_");
			expect(displayValueOf(mask, data)).toEqual("^6^`");
		});

		it("inner should not be shown when empty", function ()
		{
			data = dataFor(mask, "^6-5-_^-_-_");
			expect(displayValueOf(mask, data)).toEqual("^6-5^`-`");
		});

		it("should be shown when not empty", function ()
		{
			data = dataFor(mask, "^6-_-R^-_-_");
			expect(displayValueOf(mask, data)).toEqual("^6-`-R^-`-`");
		});
	});
});