String.prototype.insertAt = function (index, value)
{
	return this.slice(0, index) + value + this.slice(index);
}

function valueOf(data)
{
	var sections = data.sections.slice(0); // copy array
	var caret = data.caret;
	var selectionEnd = data.caret + data.selection;
	if(caret == selectionEnd)
		selectionEnd = -1; // Don't show the end if it equals the caret

	var past = 0;
	for(var i = 0; i < sections.length; i++)
	{
		// Save off the length because it will change if the caret is added
		var sectionLength = sections[i].length;

		// Insert the end caret first so its position won't be affected by the first caret
		if(past <= selectionEnd && selectionEnd < past + sections[i].length)
			sections[i] = sections[i].insertAt(selectionEnd - past, "^");

		// Insert first caret
		if(past <= caret && caret < past + sections[i].length)
			sections[i] = sections[i].insertAt(caret - past, "^");

		past += sectionLength;
	}

	// If the caret is at the absolute end we need to tack it on
	if(past == selectionEnd)
	{
		var i = sections.length - 1;
		sections[i] = sections[i] + "^";
	}

	return sections;
}
