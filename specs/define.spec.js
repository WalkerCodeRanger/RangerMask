describe("RangerMask.define", function ()
{
	var mask;
	var data;

	describe("Empty mask", function ()
	{
		it("can be defined", function ()
		{
			mask = RangerMask.define("");
			expect(mask).toBeDefined();
			expect(mask).not.toBeNull();
		});

		it("should have empty masked empty value", function ()
		{
			expect(mask.maskedEmptyVal).toEqual("");
		});
	});

	describe("Fixed mask", function ()
	{
		it("can be defined", function ()
		{
			mask = RangerMask.define("s$ ");
			expect(mask).toBeDefined();
			expect(mask).not.toBeNull();
		});

		it("should have proper masked empty value", function ()
		{
			expect(mask.maskedEmptyVal).toEqual("s$ ");
		});

		it("should apply to a valid value", function ()
		{
			data = mask.apply("s$ ");
			expect(maskedValueOf(mask, data)).toEqual("^s$ ^");
		});

		it("should apply to an invalid value", function ()
		{
			data = mask.apply("foo");
			expect(maskedValueOf(mask, data)).toEqual("^s$ ^");
		});
	});

	describe("Mask with escaped chars and escaped escape", function ()
	{
		it("can be defined", function ()
		{
			mask = RangerMask.define("v/9v//v");
			expect(mask).toBeDefined();
			expect(mask).not.toBeNull();
		});

		it("should treat escaped chars as fixed places", function ()
		{
			expect(mask.maskedEmptyVal).toEqual("v9v/v");
		});
	});

	describe("Mask incomplete escape", function ()
	{
		it("can't be defined", function ()
		{
			expect(function () { RangerMask.define("vv/") }).toThrow(new Error("Escape " / " can't be at end of mask definition"));
		});
	});

	describe("Single place field mask", function ()
	{
		it("can be defined", function ()
		{
			mask = RangerMask.define("a");
			expect(mask).toBeDefined();
			expect(mask).not.toBeNull();
		});

		it("should have proper masked empty value", function ()
		{
			expect(mask.maskedEmptyVal).toEqual("_");
		});

		it("should apply to an invalid value", function ()
		{
			data = mask.apply("34");
			expect(maskedValueOf(mask, data)).toEqual("^_^");
		});

		it("should apply to a valid value", function ()
		{
			data = mask.apply("P");
			expect(maskedValueOf(mask, data)).toEqual("^P^");
		});

		it("should apply to a partially valid value", function ()
		{
			data = mask.apply("45x");
			expect(maskedValueOf(mask, data)).toEqual("^x^");
		});
	});

	describe("Multi-place field mask", function ()
	{
		it("can be defined", function ()
		{
			mask = RangerMask.define("aa9");
			expect(mask).toBeDefined();
			expect(mask).not.toBeNull();
		});

		it("should have proper masked empty value", function ()
		{
			expect(mask.maskedEmptyVal).toEqual("___");
		});

		it("should apply to an invalid value", function ()
		{
			data = mask.apply("34");
			expect(maskedValueOf(mask, data)).toEqual("^___^");
		});

		it("should apply to a valid value", function ()
		{
			data = mask.apply("Pq4");
			expect(maskedValueOf(mask, data)).toEqual("^Pq4^");
		});

		it("should apply to a partially valid value", function ()
		{
			data = mask.apply("Pqx");
			expect(maskedValueOf(mask, data)).toEqual("^Pq_^");
		});
	});

	describe("Fixed prefix mask", function ()
	{
		it("can be defined", function ()
		{
			mask = RangerMask.define("$99");
			expect(mask).toBeDefined();
			expect(mask).not.toBeNull();
		});

		it("should have proper masked empty value", function ()
		{
			expect(mask.maskedEmptyVal).toEqual("$__");
		});

		it("should apply to a invalid value", function ()
		{
			data = mask.apply("Pq");
			expect(maskedValueOf(mask, data)).toEqual("^$__^");
		});

		it("should apply to an valid value", function ()
		{
			data = mask.apply("$34");
			expect(maskedValueOf(mask, data)).toEqual("^$34^");
		});

		it("should apply to a partially valid value", function ()
		{
			data = mask.apply("2a");
			expect(maskedValueOf(mask, data)).toEqual("^$2_^");
		});
	});

	describe("Fixed suffix mask", function ()
	{
		it("can be defined", function ()
		{
			mask = RangerMask.define("99%");
			expect(mask).toBeDefined();
			expect(mask).not.toBeNull();
		});

		it("should have proper masked empty value", function ()
		{
			expect(mask.maskedEmptyVal).toEqual("__%");
		});

		it("should apply to an invalid value", function ()
		{
			data = mask.apply("af");
			expect(maskedValueOf(mask, data)).toEqual("^__%^");
		});

		it("should apply to a valid value", function ()
		{
			data = mask.apply("45%");
			expect(maskedValueOf(mask, data)).toEqual("^45%^");
		});

		it("should apply to a partially valid value", function ()
		{
			data = mask.apply("a4");
			expect(maskedValueOf(mask, data)).toEqual("^4_%^");
		});
	});

	describe("Fixed place in middle mask", function ()
	{
		it("can be defined", function ()
		{
			mask = RangerMask.define("9-9");
			expect(mask).toBeDefined();
			expect(mask).not.toBeNull();
		});

		it("should have proper masked empty value", function ()
		{
			expect(mask.maskedEmptyVal).toEqual("_-_");
		});

		it("should apply to an invalid value", function ()
		{
			data = mask.apply("af");
			expect(maskedValueOf(mask, data)).toEqual("^_-_^");
		});

		it("should apply to a valid value", function ()
		{
			data = mask.apply("5-6");
			expect(maskedValueOf(mask, data)).toEqual("^5-6^");
		});

		it("should apply to a partially valid value", function ()
		{
			data = mask.apply("-9");
			expect(maskedValueOf(mask, data)).toEqual("^_-9^");
		});
	});

	describe("Muliple fixed & required places mask", function ()
	{
		it("can be defined", function ()
		{
			mask = RangerMask.define("/{xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/}");
			expect(mask).toBeDefined();
			expect(mask).not.toBeNull();
		});

		it("should have proper masked empty value", function ()
		{
			expect(mask.maskedEmptyVal).toEqual("{________-____-____-____-____________}");
		});

		it("should apply to an invalid value", function ()
		{
			data = mask.apply("qn-kl");
			expect(maskedValueOf(mask, data)).toEqual("^{________-____-____-____-____________}^");
		});

		it("should apply to a valid value", function ()
		{
			data = mask.apply("{F07DC0DA-F0DE-4F09-bcfd-63B36CC46FCF}");
			expect(maskedValueOf(mask, data)).toEqual("^{F07DC0DA-F0DE-4F09-bcfd-63B36CC46FCF}^");
		});

		it("should apply to a partially valid value", function ()
		{
			data = mask.apply("{F07DC0DA-F0DE-4F0@#");
			expect(maskedValueOf(mask, data)).toEqual("^{F07DC0DA-F0DE-4F0_-____-____________}^");
		});
	});

	describe("Optional suffix mask", function ()
	{
		it("can be defined", function ()
		{
			mask = RangerMask.define("$99?9?");
			expect(mask).toBeDefined();
			expect(mask).not.toBeNull();
		});

		it("should have proper masked empty value", function ()
		{
			expect(mask.maskedEmptyVal).toEqual("$_");
		});

		it("should apply to an invalid value", function ()
		{
			data = mask.apply("af");
			expect(maskedValueOf(mask, data)).toEqual("^$_^");
		});

		it("should apply to a valid value", function ()
		{
			data = mask.apply("$23");
			expect(maskedValueOf(mask, data)).toEqual("^$23^");
		});

		it("should apply to a partially valid value", function ()
		{
			data = mask.apply("a8");
			expect(maskedValueOf(mask, data)).toEqual("^$8^");
		});
	});

	describe("Optional prefix mask", function ()
	{
		it("can be defined", function ()
		{
			mask = RangerMask.define("-?9");
			expect(mask).toBeDefined();
			expect(mask).not.toBeNull();
		});

		it("should have proper masked empty value", function ()
		{
			expect(mask.maskedEmptyVal).toEqual("_");
		});

		it("should apply to an invalid value", function ()
		{
			data = mask.apply("af");
			expect(maskedValueOf(mask, data)).toEqual("^_^");
		});

		it("should apply to a valid value", function ()
		{
			data = mask.apply("-6");
			expect(maskedValueOf(mask, data)).toEqual("^-6^");
		});

		it("should apply to a partially valid value", function ()
		{
			data = mask.apply("-");
			expect(maskedValueOf(mask, data)).toEqual("^-_^");
		});
	});

	describe("Multi-char def mask", function ()
	{
		it("can be defined", function ()
		{
			mask = RangerMask.define("mm//dd//yyYY");
			expect(mask).toBeDefined();
			expect(mask).not.toBeNull();
		});

		it("should have proper masked empty value", function ()
		{
			expect(mask.maskedEmptyVal).toEqual("_/_/__");
		});

		it("should apply to an invalid value", function ()
		{
			data = mask.apply("sdgh");
			expect(maskedValueOf(mask, data)).toEqual("^_/_/__^");
		});

		it("should apply to a valid value", function ()
		{
			data = mask.apply("2/3/1986");
			expect(maskedValueOf(mask, data)).toEqual("^2/3/1986^");
		});

		it("should apply to a partially valid value", function ()
		{
			data = mask.apply("/48/82");
			expect(maskedValueOf(mask, data)).toEqual("^_/48/82^");
		});

		describe("Simple repeat mask", function ()
		{
			it("can be defined", function ()
			{
				mask = RangerMask.define("a9{5}");
				expect(mask).toBeDefined();
				expect(mask).not.toBeNull();
			});

			it("should have proper masked empty value", function ()
			{
				expect(mask.maskedEmptyVal).toEqual("______");
			});

			it("should apply to an invalid value", function ()
			{
				data = mask.apply("$#@");
				expect(maskedValueOf(mask, data)).toEqual("^______^");
			});

			it("should apply to a valid value", function ()
			{
				data = mask.apply("g34625");
				expect(maskedValueOf(mask, data)).toEqual("^g34625^");
			});

			it("should apply to a partially valid value", function ()
			{
				data = mask.apply("g4r5");
				expect(maskedValueOf(mask, data)).toEqual("^g45___^");
			});
		});

		describe("Repeat {min,max} mask", function ()
		{
			it("can be defined", function ()
			{
				mask = RangerMask.define("a9{2,3}");
				expect(mask).toBeDefined();
				expect(mask).not.toBeNull();
			});

			it("should have proper masked empty value", function ()
			{
				expect(mask.maskedEmptyVal).toEqual("___");
			});

			it("should apply to an invalid value", function ()
			{
				data = mask.apply("$#@");
				expect(maskedValueOf(mask, data)).toEqual("^___^");
			});

			it("should apply to a valid value", function ()
			{
				data = mask.apply("g343");
				expect(maskedValueOf(mask, data)).toEqual("^g343^");
			});

			it("should apply to a partially valid value", function ()
			{
				data = mask.apply("g4r$");
				expect(maskedValueOf(mask, data)).toEqual("^g4_^");
			});
		});

		describe("Repeat fixed place mask", function ()
		{
			it("can be defined", function ()
			{
				mask = RangerMask.define("aa!{0,10}");
				expect(mask).toBeDefined();
				expect(mask).not.toBeNull();
			});

			it("should have proper masked empty value", function ()
			{
				expect(mask.maskedEmptyVal).toEqual("__");
			});

			it("should apply to an invalid value", function ()
			{
				data = mask.apply("$#@");
				expect(maskedValueOf(mask, data)).toEqual("^__^");
			});

			it("should apply to a valid value", function ()
			{
				data = mask.apply("fe!!!!!!");
				expect(maskedValueOf(mask, data)).toEqual("^fe!!!!!!^");
			});

			it("should apply to a partially valid value", function ()
			{
				data = mask.apply("h4r2!!4!");
				expect(maskedValueOf(mask, data)).toEqual("^hr!!!^");
			});
		});
	});
});