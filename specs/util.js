String.prototype.insertAt = function (index, value)
{
	return this.slice(0, index) + value + this.slice(index);
}

function valueOf(data)
{
	var value = data.sections.join("");
	var caret = data.caret;
	var selectionEnd = data.caret + data.selection;
	if(selectionEnd != caret)
		value = value.insertAt(selectionEnd, "^");

	value = value.insertAt(caret, "^");
	return value;
}

function dataFor(mask, value)
{
	var cleanValue = value.replace("^", "");
	var data = new Object();
	mask.init(data, cleanValue);
	data.caret = value.indexOf("^");
	data.selection = value.lastIndexOf("^") - data.caret;
	if(valueOf(data) !== value)
		throw "dataFor(\""+mask.blankVal()+"\", \""+value+"\") didn't match value provided, did you give an invalid value?";
	return data;
}