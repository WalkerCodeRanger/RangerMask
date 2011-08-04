describe("RangerMask.optionalSections", function ()
{
	var mask;
	var data;

	describe("Single Optional Section", function ()
	{
		beforeEach(function ()
		{
			mask = RangerMask.define("99999(-9999)");
		});


		it("should not affect editing", function ()
		{
			data = dataFor(mask, "^_____-____");
			mask.type(data, "5");
			expect(maskedValueOf(mask, data)).toEqual("5^____-____");
		});
	});

	describe("Nested optional places", function ()
	{
		beforeEach(function ()
		{
			mask = RangerMask.define("9(-9(-a-)9-)9");
		});

		it("should not affect editing", function ()
		{
			data = dataFor(mask, "^_-_-_-_-_");
			mask.type(data, "5");
			mask.type(data, "3");
			expect(maskedValueOf(mask, data)).toEqual("5-3^-_-_-_");
		});
	});
});