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
