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
			expect(valueOf(data)).toEqual(["^s$ ^"]);
		});

		it("should init an invalid value", function ()
		{
			data = new Object()
			mask.init(data, "foo");
			expect(valueOf(data)).toEqual(["^s$ ^"]);
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
			expect(valueOf(data)).toEqual(["^_^"]);
		});

		it("should init a valid value", function ()
		{
			data = new Object();
			mask.init(data, "P");
			expect(valueOf(data)).toEqual(["^P^"]);
		});

		it("should block invalid char (and not change selection)", function ()
		{
			mask.type(data, "5");
			expect(valueOf(data)).toEqual(["^P^"]);
		});

		it("should accept valid char", function ()
		{
			mask.type(data, "b");
			expect(valueOf(data)).toEqual(["b^"]);
		});
	});
});