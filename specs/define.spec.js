describe("RangerMask.define", function ()
{
	var mask;
	var data;

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

	describe("Separator mask", function ()
	{
		it("can be defined", function ()
		{
			mask = RangerMask.define("s$ ");
			expect(mask).toBeDefined();
			expect(mask).not.toBeNull();
		});

		it("should have proper blank value", function ()
		{
			expect(mask.blankVal()).toEqual("s$ ");
		});

		it("should init a valid value", function ()
		{
			data = new Object();
			mask.init(data, "s$ ");
			expect(valueOf(data)).toEqual("^s$ ^");
		});

		it("should init an invalid value", function ()
		{
			data = new Object()
			mask.init(data, "foo");
			expect(valueOf(data)).toEqual("^s$ ^");
		});
	});

	describe("Mask with escaped chars and escaped escape and incomplete escape", function ()
	{
		it("can be defined", function ()
		{
			mask = RangerMask.define("v/9v//v/");
			expect(mask).toBeDefined();
			expect(mask).not.toBeNull();
		});

		it("should treat escaped chars as separator chars", function ()
		{
			expect(mask.blankVal()).toEqual("v9v/v");
		});
	});

	describe("Single place field mask", function ()
	{
		it("can be defined", function ()
		{
			mask = RangerMask.define("A");
			expect(mask).toBeDefined();
			expect(mask).not.toBeNull();
		});

		it("should have proper blank value", function ()
		{
			expect(mask.blankVal()).toEqual("_");
		});

		it("should init an invalid value", function ()
		{
			data = new Object();
			mask.init(data, "34");
			expect(valueOf(data)).toEqual("^_^");
		});

		it("should init a valid value", function ()
		{
			data = new Object();
			mask.init(data, "P");
			expect(valueOf(data)).toEqual("^P^");
		});

		it("should init a partially valid value", function ()
		{
			data = new Object();
			mask.init(data, "45x");
			expect(valueOf(data)).toEqual("^x^");
		});
	});

	describe("Multi-place field mask", function ()
	{
		it("can be defined", function ()
		{
			mask = RangerMask.define("AA9");
			expect(mask).toBeDefined();
			expect(mask).not.toBeNull();
		});

		it("should have proper blank value", function ()
		{
			expect(mask.blankVal()).toEqual("___");
		});

		it("should init an invalid value", function ()
		{
			data = new Object();
			mask.init(data, "34");
			expect(valueOf(data)).toEqual("^___^");
		});

		it("should init a valid value", function ()
		{
			data = new Object();
			mask.init(data, "Pq4");
			expect(valueOf(data)).toEqual("^Pq4^");
		});

		it("should init a partially valid value", function ()
		{
			data = new Object();
			mask.init(data, "Pqx");
			expect(valueOf(data)).toEqual("^Pq_^");
		});
	});

	describe("Prefix separator mask", function ()
	{
		it("can be defined", function ()
		{
			mask = RangerMask.define("$99");
			expect(mask).toBeDefined();
			expect(mask).not.toBeNull();
		});

		it("should have proper blank value", function ()
		{
			expect(mask.blankVal()).toEqual("$__");
		});

		it("should init a invalid value", function ()
		{
			data = new Object();
			mask.init(data, "Pq");
			expect(valueOf(data)).toEqual("^$__^");
		});

		it("should init an valid value", function ()
		{
			data = new Object();
			mask.init(data, "$34");
			expect(valueOf(data)).toEqual("^$34^");
		});

		it("should init a partially valid value", function ()
		{
			data = new Object();
			mask.init(data, "2a");
			expect(valueOf(data)).toEqual("^$2_^");
		});
	});

	describe("Suffix separator mask", function ()
	{
		it("can be defined", function ()
		{
			mask = RangerMask.define("99%");
			expect(mask).toBeDefined();
			expect(mask).not.toBeNull();
		});

		it("should have proper blank value", function ()
		{
			expect(mask.blankVal()).toEqual("__%");
		});

		it("should init an invalid value", function ()
		{
			data = new Object();
			mask.init(data, "af");
			expect(valueOf(data)).toEqual("^__%^");
		});

		it("should init a valid value", function ()
		{
			data = new Object();
			mask.init(data, "45%");
			expect(valueOf(data)).toEqual("^45%^");
		});

		it("should init a partially valid value", function ()
		{
			data = new Object();
			mask.init(data, "a4");
			expect(valueOf(data)).toEqual("^4_%^");
		});
	});

	describe("Infix separator mask", function ()
	{
		it("can be defined", function ()
		{
			mask = RangerMask.define("9-9");
			expect(mask).toBeDefined();
			expect(mask).not.toBeNull();
		});

		it("should have proper blank value", function ()
		{
			expect(mask.blankVal()).toEqual("_-_");
		});

		it("should init an invalid value", function ()
		{
			data = new Object();
			mask.init(data, "af");
			expect(valueOf(data)).toEqual("^_-_^");
		});

		it("should init a valid value", function ()
		{
			data = new Object();
			mask.init(data, "5-6");
			expect(valueOf(data)).toEqual("^5-6^");
		});

		it("should init a partially valid value", function ()
		{
			data = new Object();
			mask.init(data, "-9");
			expect(valueOf(data)).toEqual("^_-9^");
		});
	});

	describe("Mixed field/separator mask", function ()
	{
		it("can be defined", function ()
		{
			mask = RangerMask.define("{XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}");
			expect(mask).toBeDefined();
			expect(mask).not.toBeNull();
		});

		it("should have proper blank value", function ()
		{
			expect(mask.blankVal()).toEqual("{________-____-____-____-____________}");
		});

		it("should init an invalid value", function ()
		{
			data = new Object();
			mask.init(data, "qn-kl");
			expect(valueOf(data)).toEqual("^{________-____-____-____-____________}^");
		});

		it("should init a valid value", function ()
		{
			data = new Object();
			mask.init(data, "{F07DC0DA-F0DE-4F09-bcfd-63B36CC46FCF}");
			expect(valueOf(data)).toEqual("^{F07DC0DA-F0DE-4F09-bcfd-63B36CC46FCF}^");
		});

		it("should init a partially valid value", function ()
		{
			data = new Object();
			mask.init(data, "{F07DC0DA-F0DE-4F0");
			expect(valueOf(data)).toEqual("^{F07DC0DA-F0DE-4F0_-____-____________}^");
		});
	});

	describe("Optional places mask", function ()
	{
		it("can be defined", function ()
		{
			mask = RangerMask.define("$##9");
			expect(mask).toBeDefined();
			expect(mask).not.toBeNull();
		});

		it("should have proper blank value", function ()
		{
			expect(mask.blankVal()).toEqual("$_");
		});

		it("should init an invalid value", function ()
		{
			data = new Object();
			mask.init(data, "af");
			expect(valueOf(data)).toEqual("^$_^");
		});

		it("should init a valid value", function ()
		{
			data = new Object();
			mask.init(data, "$23");
			expect(valueOf(data)).toEqual("^$23^");
		});

		it("should init a partially valid value", function ()
		{
			data = new Object();
			mask.init(data, "a8");
			expect(valueOf(data)).toEqual("^$8^");
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

		it("should have proper blank value", function ()
		{
			expect(mask.blankVal()).toEqual("_/_/__");
		});

		it("should init an invalid value", function ()
		{
			data = new Object();
			mask.init(data, "sdgh");
			expect(valueOf(data)).toEqual("^_/_/__^");
		});

		it("should init a valid value", function ()
		{
			data = new Object();
			mask.init(data, "2/3/1986");
			expect(valueOf(data)).toEqual("^2/3/1986^");
		});

		it("should init a partially valid value", function ()
		{
			data = new Object();
			mask.init(data, "/48/82");
			expect(valueOf(data)).toEqual("^_/48/82^");
		});
	});
});