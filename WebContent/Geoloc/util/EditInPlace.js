// EditInPlace.js - enable editing a text field right on the page
//
// Using this object is very easy.
//
// 1) In your HTML, put the text you want to make editable into an
//    identifiable HTML element.  You can use an id, a name, or
//    whatever identification method you like.  For example:
//
//        <div id="text">Here is the text.</div>
//
//    The element should have only text inside it, not other HTML elements.
//
// 2) Load the routines into your code:
//
//        <script src="http://www.acme.com/javascript/EditInPlace.js" type="text/javascript"></script>
//
// 3) Find the element you want to edit.  For example, if you specified an
//    id in the HTML then you could say:
//
//        var element = document.getElementById( 'text' );
//
// 4) Create an EditInPlace object, passing it the HTML element, the number
//    of lines you want in the editable field, and a callback function:
//
//        var eip = new EditInPlace( element, lines, callback );
//
//    If lines is one you get a text input field for editing; if lines is
//    greater than one you get a textarea.
//
// 5) The callback will probably a closure that you create, that knows
//    which element it is getting called on.  For example you might say:
//
//        function () { RealCallback( element ); }
//
//    That creates a closure that calls the real callback with the text
//    element as argument.
//
//    When the callback is called, the contents of the text element have
//    already been changed to the new value.  If you don't need to do
//    anything else, feel free to pass null as the callback.
//
// That's it!  Everything else happens automatically.
//
//
// The current version of this code is always available at:
// http://www.acme.com/javascript/
//
//
// Copyright � 2006 by Jef Poskanzer <jef@mail.acme.com>.
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions
// are met:
// 1. Redistributions of source code must retain the above copyright
//    notice, this list of conditions and the following disclaimer.
// 2. Redistributions in binary form must reproduce the above copyright
//    notice, this list of conditions and the following disclaimer in the
//    documentation and/or other materials provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS ``AS IS'' AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR OR CONTRIBUTORS BE LIABLE
// FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
// DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
// OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
// HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
// LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
// OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
// SUCH DAMAGE.
//
// For commentary on this license please see http://www.acme.com/license.html

/*
 * Fichier modifi� pour adaptation � l'application EasyMap.
 * Branche de version diff�rente et incompatible avec le fichier original.
 * Attention au changement de version.
 * Janvier 2006 - Naeregwen
 */

EditInPlace = function ( element, lines, callback )
    {
    this.element = element;
    this.lines = lines;
    this.callback = callback;

    this.savedBackgroundColor = element.style.backgroundColor;
    if ( element.title == null || element.title == '' )
	element.title = 'Cliquez dans la zone pour �diter le texte';
    else
	element.title += ' - cliquez dans la zone pour �diter le texte';

    element.onmouseover = EditInPlace.MakeCaller( EditInPlace.Yellowfy, this );
    element.onmouseout = EditInPlace.MakeCaller( EditInPlace.DeYellowfy, this );
    element.onclick = EditInPlace.MakeCaller( EditInPlace.Edit, this );
    };


EditInPlace.yellow = '#ffffcc';


EditInPlace.Yellowfy = function ( eip )
    {
    eip.element.style.backgroundColor = EditInPlace.yellow;
    };


EditInPlace.DeYellowfy = function ( eip )
    {
    eip.element.style.backgroundColor = eip.savedBackgroundColor;
    };


EditInPlace.Edit = function ( eip )
    {
    if ( eip.editElement == null )
	{
	// Create editElement.  Structure is as follows:
	//           <span>&nbsp;</span>
	//           <input type="text">
	//           <input type="submit" value="Save">
	//           <span>&nbsp;</span>
	//           <input type="submit" value="Cancel">
	this.eip = eip;
	eip.editElement = document.createElement( 'span' );
	eip.element.parentNode.insertBefore( eip.editElement, eip.element );

	if ( eip.lines == 1 ) {
	    eip.inputElement = document.createElement( 'input' );
	    eip.inputElement.type = 'text';
	    //eip.inputElement.value = eip.element.innerHTML;
	    eip.inputElement.value = eip.element.value;
	} else {
	    eip.inputElement = document.createElement( 'textarea' );
	    eip.inputElement.value = eip.element.innerHTML;
	}

	eip.inputElement.size = eip.element.size - 35;
	eip.inputElement.style.height = eip.element.style.height;
	eip.inputElement.style.backgroundColor = EditInPlace.yellow;
	eip.inputElement.onkeypress = EditInPlace.MakeCaller( EditInPlace.KeyPress, eip );
	eip.editElement.appendChild( eip.inputElement );

	var spanElement1 = document.createElement( 'span' );
	spanElement1.innerHTML = '&nbsp;';
	eip.editElement.appendChild( spanElement1 );
	
	var saveElement = document.createElement( 'input' );
	saveElement.type = 'button';
	saveElement.value = 'Sauvegarder';
	saveElement.onclick = EditInPlace.MakeCaller( EditInPlace.Save, eip );
	eip.editElement.appendChild( saveElement );

	var spanElement2 = document.createElement( 'span' );
	spanElement2.innerHTML = '&nbsp;';
	eip.editElement.appendChild( spanElement2 );

	var cancelElement = document.createElement( 'input' );
	cancelElement.type = 'button';
	cancelElement.value = 'Annuler';
	cancelElement.onclick = EditInPlace.MakeCaller( EditInPlace.Cancel, eip );
	eip.editElement.appendChild( cancelElement );

	}
    eip.element.style.display = 'none';
    eip.editElement.style.display = '';
    eip.inputElement.select();
    };


EditInPlace.KeyPress = function ( eip )
    {
    // This only works in MSIE, but it's also only needed in MSIE.
    // In Firefox, hitting Enter in the input field automatically
    // triggers the onsubmit action of the first button.
    if ( window.event ) {
    	switch ( window.event.keyCode ) {
      	case 13 : EditInPlace.Save( eip ); break;
      	case 27 : EditInPlace.Cancel( eip ); break;
      	}
    }
    };


EditInPlace.Save = function ( eip )
    {

	if (!dojo.widget.byId('EasyMap').isValidAddress(eip.inputElement.value)) { return; } 
    eip.element.value = eip.inputElement.value;
    eip.editElement.style.display = 'none';
    eip.element.style.display = '';
    EditInPlace.DeYellowfy( eip );
    if ( eip.callback != null )
	eip.callback();
    };

EditInPlace.Cancel = function ( eip )
    {
    eip.inputElement.value = eip.element.value; // Annuler les modifications
    eip.editElement.style.display = 'none';
    eip.element.style.display = '';
    EditInPlace.DeYellowfy( eip );
    };


// This returns a function closure that calls the given routine with the
// specified arg.
EditInPlace.MakeCaller = function ( func, arg )
    {
    return function () { func( arg ); };
    };
    