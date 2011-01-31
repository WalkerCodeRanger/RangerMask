String.prototype.insertAt = function (index, value)
{
	return this.slice(0, index) + value + this.slice(index);
}

function valueOf(mask, data)
{
	var value = mask.maskedVal(data);
	var selection = mask.selectionInMasked(data);
	var selectionEnd = selection.start + selection.length;
	if(selectionEnd != selection.start)
		value = value.insertAt(selectionEnd, "^");

	value = value.insertAt(selection.start, "^");
	return value;
}

function dataFor(mask, value)
{
	var cleanValue = value.replace("^", "");
	var data = mask.apply(cleanValue);
	data.selection.start = value.indexOf("^");
	data.selection.length = value.lastIndexOf("^") - data.selection.start;
	if(valueOf(mask, data) !== value)
		throw "dataFor(\""+mask.maskedEmptyVal+"\", \""+value+"\") didn't match value provided, did you give an invalid value?";
	return data;
}