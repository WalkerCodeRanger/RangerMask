describe("RangerMask.backspace", function ()
{
	var mask = RangerMask.define("999-99-99aa99");
	var data;

	it("should delete a selection", function ()
	{
		data = dataFor(mask, "9^45-67^-5689");
		mask.backspace(data);
		expect(valueOf(mask, data)).toEqual("9^56-__-__89");
	});

	it("should be ignored at start of mask", function ()
	{
		data = dataFor(mask, "^945-67-5689");
		mask.backspace(data);
		expect(valueOf(mask, data)).toEqual("^945-67-5689");
	});

	it("should delete preceding required place", function ()
	{
		data = dataFor(mask, "945-67^-5689");
		mask.backspace(data);
		expect(valueOf(mask, data)).toEqual("945-6^5-6_89"); // optional prevents pull
	});

	it("should delete across fixed places", function ()
	{
		data = dataFor(mask, "945-^67-5689");
		mask.backspace(data);
		expect(valueOf(mask, data)).toEqual("94^6-75-6_89");
	});

	it("should delete optional places", function ()
	{
		data = dataFor(mask, "___-__-45g^68");
		mask.backspace(data);
		expect(valueOf(mask, data)).toEqual("___-__-45^68");
	});

	it("should delete across optional places", function ()
	{
		data = dataFor(mask, "___-__-456^8");
		mask.backspace(data);
		mask.backspace(data);
		expect(valueOf(mask, data)).toEqual("___-__-4^_8_");
	});

	it("should delete last place", function ()
	{
		data = dataFor(mask, "___-__-4568^");
		mask.backspace(data);
		expect(valueOf(mask, data)).toEqual("___-__-456^_");
	});
});