String.prototype.insertAt = function (index, value)
{
	return this.slice(0, index) + value + this.slice(index);
}

function valueOf(mask, data)
{
	var state = mask.maskedState(data);
	var value = state.value;
	var selectionEnd = state.selection.start + state.selection.length;
	if(selectionEnd != state.selection.start)
		value = value.insertAt(selectionEnd, "^");

	value = value.insertAt(state.selection.start, "^");
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