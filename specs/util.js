String.prototype.insertAt = function (index, value)
{
	return this.slice(0, index) + value + this.slice(index);
}

function valueOf(mask, data)
{
	var value = mask.maskedVal(data);
	var caret = data.places.slice(0, data.caret).join("").length;
	var selectionEnd = data.places.slice(0, data.caret + data.selection).length;
	if(selectionEnd != caret)
		value = value.insertAt(selectionEnd, "^");

	value = value.insertAt(caret, "^");
	return value;
}

function dataFor(mask, value)
{
	var cleanValue = value.replace("^", "");
	var data = new Object();
	mask.apply(data, cleanValue);
	data.caret = value.indexOf("^");
	data.selection = value.lastIndexOf("^") - data.caret;
	if(valueOf(data) !== value)
		throw "dataFor(\""+mask.maskedEmptyVal+"\", \""+value+"\") didn't match value provided, did you give an invalid value?";
	return data;
}