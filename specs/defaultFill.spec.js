﻿describe("RangerMask.applyDefaultFill", function ()
{
	var mask;
	var data;

	describe("Required places", function ()
	{
		beforeEach(function ()
		{
			mask = RangerMask.define("9.00");
		});


		it("should apply default fill to required places", function ()
		{
			data = dataFor(mask, "^1.2_");
			mask.applyDefaultFill(data);
			expect(valueOf(mask, data)).toEqual("^1.20");
		});

		it("should NOT apply default fill if entire field is blank", function ()
		{
			data = dataFor(mask, "^_.__");
			mask.applyDefaultFill(data);
			expect(valueOf(mask, data)).toEqual("^_.__");
		});
	});

	describe("Optional places", function ()
	{
		beforeEach(function ()
		{
			mask = RangerMask.define("9.0?");
		});

		it("should apply default fill", function ()
		{
			data = dataFor(mask, "^1.");
			mask.applyDefaultFill(data);
			expect(valueOf(mask, data)).toEqual("^1.0");
		});
	});
});