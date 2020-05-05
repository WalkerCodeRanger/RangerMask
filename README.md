# RangerMask

A flexible html input masking library built on [jQuery](https://jquery.com/). Can handle not just simple masks like phone numbers and SSN, but comma separated numbers and even dates.

## Project Status: Stable Obsolete

This code was in production use for a number of years. I'm not sure if it still is. No further work will be done on this project. No maintenance or bug fixes will be done.

### Installation and Use

Download the `jquery.rangerMask.js` file from the master branch and include in your scripts. This is dependent on jQuery and was developed against version 1.6.2, but later versions should be compatible. Check out `demo.html` for examples of how to use it. Define new masks with `RangerMask.define("...")` or use one of the standard masks already defined on the `RangerMask` object (search `jquery.rangerMask.js` for "Define standard masks" to see the full list).  Apply masks to inputs in jQuery style using `$('<selector>').rangerMask(maskObject)`.
