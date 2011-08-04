describe("RangerMask.del", function ()
{
	var mask = RangerMask.define("999-99-99a?a?99");
	var data;

	it("should delete a selection", function ()
	{
		data = dataFor(mask, "9^45-67^-5689");
		mask.del(data);
		expect(maskedValueOf(mask, data)).toEqual("9^56-__-__89");
	});

	it("should be ignored at end of mask", function ()
	{
		data = dataFor(mask, "945-67-5689^");
		mask.del(data);
		expect(maskedValueOf(mask, data)).toEqual("945-67-5689^");
	});

	it("should delete following required place", function ()
	{
		data = dataFor(mask, "945-6^7-5689");
		mask.del(data);
		expect(maskedValueOf(mask, data)).toEqual("945-6^5-6_89"); // optional prevents pull
	});

	it("should delete across fixed places", function ()
	{
		data = dataFor(mask, "945^-67-5689");
		mask.del(data);
		expect(maskedValueOf(mask, data)).toEqual("945-^75-6_89");
	});

	it("should delete optional places", function ()
	{
		data = dataFor(mask, "___-__-45^g68");
		mask.del(data);
		expect(maskedValueOf(mask, data)).toEqual("___-__-45^68");
	});

	it("should delete first place", function ()
	{
		data = dataFor(mask, "^456-__-____");
		mask.del(data);
		expect(maskedValueOf(mask, data)).toEqual("^56_-__-____");
	});
});