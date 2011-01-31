describe("RangerMask.paste", function ()
{
	var mask = RangerMask.define("999-99-9999");
	var data;

	it("should paste valid values", function ()
	{
		data = dataFor(mask, "^___-__-____");
		mask.paste(data, "123-45-6789");
		expect(valueOf(mask, data)).toEqual("123-45-6789^");
	});

	it("should paste as if typing values", function ()
	{
		data = dataFor(mask, "^___-__-____");
		mask.paste(data, "a1b4cdf$59-23");
		expect(valueOf(mask, data)).toEqual("145-9_-23^__");
	});

	it("should ignore invalid values", function ()
	{
		data = dataFor(mask, "_^45-67^-____");
		mask.paste(data, "abscdefghi");
		expect(valueOf(mask, data)).toEqual("_^45-67^-____");
	});

	it("should delete selection before pasting", function ()
	{
		data = dataFor(mask, "^678^-__-____");
		mask.paste(data, "1");
		expect(valueOf(mask, data)).toEqual("1^__-__-____");
	});
});