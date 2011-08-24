describe("RangerMask.applyDefaultFill", function ()
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
			expect(maskedValueOf(mask, data)).toEqual("^1.20");
		});

		it("should NOT apply default fill if entire field is blank", function ()
		{
			data = dataFor(mask, "^_.__");
			mask.applyDefaultFill(data);
			expect(maskedValueOf(mask, data)).toEqual("^_.__");
		});

		it("should NOT apply default fill if optional section is empty", function ()
		{
			mask = RangerMask.define("9(.00)");
			data = dataFor(mask, "6^.__");
			mask.applyDefaultFill(data);
			expect(maskedValueOf(mask, data)).toEqual("6^.__");
		});
	});

	describe("Optional places", function ()
	{
		beforeEach(function ()
		{
			mask = RangerMask.define("9.0?");
		});

		it("should NOT apply default fill", function ()
		{
			data = dataFor(mask, "^1.");
			mask.applyDefaultFill(data);
			expect(maskedValueOf(mask, data)).toEqual("^1.");
		});
	});

	describe("yearCallback", function ()
	{
		var currentYear = new Date().getFullYear();

		beforeEach(function ()
		{
			mask = RangerMask.define("yyyy-mm");
		});

		it("should default to current year for empty", function ()
		{
			data = dataFor(mask, "_-12^");
			mask.applyDefaultFill(data);
			expect(maskedValueOf(mask, data)).toEqual(currentYear + "-12^");
		});

		it("should be typed value for four digit year", function ()
		{
			data = dataFor(mask, "1624-12^");
			mask.applyDefaultFill(data);
			expect(maskedValueOf(mask, data)).toEqual("1624-12^");
		});

		it("should be typed value for four digit year with leading zero", function ()
		{
			data = dataFor(mask, "0624-12^");
			mask.applyDefaultFill(data);
			expect(maskedValueOf(mask, data)).toEqual("0624-12^");
		});

		it("should prefix with 0 for three digit year", function ()
		{
			data = dataFor(mask, "624-12^");
			mask.applyDefaultFill(data);
			expect(maskedValueOf(mask, data)).toEqual("0624-12^");
		});

		it("should infer century for single digit", function ()
		{
			data = dataFor(mask, "4-12^");
			mask.applyDefaultFill(data);
			expect(maskedValueOf(mask, data)).toEqual("2004-12^");
		});

		it("should infer century for zero", function ()
		{
			data = dataFor(mask, "0-12^");
			mask.applyDefaultFill(data);
			expect(maskedValueOf(mask, data)).toEqual("2000-12^");
		});

		it("should infer century two digit", function ()
		{
			data = dataFor(mask, "11-12^");
			mask.applyDefaultFill(data);
			expect(maskedValueOf(mask, data)).toEqual("2011-12^");
		});

		it("should infer century two digit with leading zero", function ()
		{
			data = dataFor(mask, "08-12^");
			mask.applyDefaultFill(data);
			expect(maskedValueOf(mask, data)).toEqual("2008-12^");
		});

		it("should infer past up to 49 years ago", function ()
		{
			var year = (currentYear - 49).toString();
			data = dataFor(mask, year.slice(-2) + "-12^");
			mask.applyDefaultFill(data);
			expect(maskedValueOf(mask, data)).toEqual(year+"-12^");
		});

		it("should infer future up to 50 years from now", function ()
		{
			var year = (currentYear + 50).toString();
			data = dataFor(mask, year.slice(-2) + "-12^");
			mask.applyDefaultFill(data);
			expect(maskedValueOf(mask, data)).toEqual(year + "-12^");
		});
	});
});