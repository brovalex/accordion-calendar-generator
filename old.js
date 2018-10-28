



	// var svgns = document.getElementById("mySVG");//document.createElementNS("http://www.w3.org/2000/svg", "svg");
	var svgNS = "http://www.w3.org/2000/svg";  

	page_w = 550;
	page_h = 350;
	box_w = page_w/7;
	padding_x = 5;
	padding_y = 7;
	function createBox(box_x,box_y,box_h,val)
	{
	    var myShape = document.createElementNS(svgNS,"rect");
	    // myShape.setAttributeNS(null,"id","shape");
	    myShape.setAttributeNS(null,"x",box_x);
	    myShape.setAttributeNS(null,"y",box_y);
	    myShape.setAttributeNS(null,"width",box_w);
	    myShape.setAttributeNS(null,"height",box_h);
	    myShape.setAttributeNS(null,"fill","none");
	    myShape.setAttributeNS(null,"stroke","black");

	    document.getElementById("mySVG").appendChild(myShape);

	    var myText = document.createElementNS(svgNS,"text");
	    myText.setAttributeNS(null,"x",box_x+box_w-padding_x);
		myText.setAttributeNS(null,"y",box_y+padding_y);
		myText.setAttributeNS(null,"text-anchor","end");
		myText.setAttributeNS(null,"alignment-baseline","hanging");

		var textNode = document.createTextNode(val);
		myText.appendChild(textNode);
		document.getElementById("mySVG").appendChild(myText);
	}
	function createMonthLabel(box_x,box_y,val)
	{
	    var myText = document.createElementNS(svgNS,"text");
	    myText.setAttributeNS(null,"x",box_x+padding_x);
		myText.setAttributeNS(null,"y",box_y+padding_y);
		// myText.setAttributeNS(null,"text-anchor","end");
		myText.setAttributeNS(null,"alignment-baseline","hanging");

		var textNode = document.createTextNode(val);
		myText.appendChild(textNode);
		document.getElementById("mySVG").appendChild(myText);
	}     
	// createBox(0,0,10);
	// createBox(0,30,10);

	// var svg = document.getElementById("svgwrap").innerHTML;
 // 	var b64 = btoa(svg);
	// document.write("<a href-lang='image/svg+xml' href='data:image/svg+xml;base64,\n"+b64+"' title='file.svg'>Download</a>");

	cur_y=0;
	for (var i=1;i<pages.length;i++) {		
		// document.write('<div class="month">\n');
			// document.write('\t<h1>'+monthNames[pages[i][1][0].getMonth()]+'</h1>');
			box_h=page_h/pages[i].length;
			createMonthLabel(0,350*(i-1)+page_h/pages[1].length,monthNames[pages[i][1][0].getMonth()])
			for(var j=0;j<pages[i].length;j++) {
				// document.write('<div class="week height'+pages[i].length+'">\n');
				if(pages[i-1] && j==0) {
					cur_y+=page_h/pages[i-1].length+0;//add padding
				} else {
					// box_h=page_h/pages[i].length;
					cur_y+=box_h;
				}
					for(var k=0;k<pages[i][j].length;k++) {
						createBox(k*box_w,cur_y,box_h,pages[i][j][k].getDate());
						// document.write('<div class="day">'+pages[i][j][k].getDate()+'</div>')
					}
				// document.write('</div>');
			}
		// document.write('\n</div>');
	}
	//get svg element.
	var svg = document.getElementById("mySVG");

	//get svg source.
	var serializer = new XMLSerializer();
	var source = serializer.serializeToString(svg);

	//add name spaces.
	if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
	    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
	}
	if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
	    source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
	}

	//add xml declaration
	source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

	//convert svg source to URI data scheme.
	var url = "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);

	//set url value to a element's href attribute.
	document.getElementById("link").href = url;
	//you can download svg file by right click menu.






	// function downloadfile() {
	// 	var svg = document.getElementById("svgwrap").innerHTML; //btoa(
	// 	var xhr = new XMLHttpRequest();

	// 	xhr.open('POST', 'downloadfile.php');
	// 	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	// 	xhr.onload = function() {
	// 	    if (xhr.status === 200) { //&& xhr.responseText !== newName) {
	// 	        // alert('Something went wrong.  Name is now ' + xhr.responseText);
	// 	        console.log(svg);
	// 	        window.location = 'downloadfile.php';
	// 	    }
	// 	    else if (xhr.status !== 200) {
	// 	        alert('Request failed.  Returned status of ' + xhr.status);
	// 	    }
	// 	};
	// 	xhr.send(encodeURI('svg=' + svg));

	// 	// xhr.open('POST', 'downloadfile.php');
	// 	// xhr.send(null);

	// 	// xhr.onreadystatechange = function () {
	// 	// if (xhr.readyState === 4) {
	// 	// 	if (xhr.status === 200) {
	// 	// 		console.log(xhr.responseText); // 'This is the returned text.'
	// 	// 	} else {
	// 	// 		console.log('Error: ' + xhr.status); // An error occurred during the request.
	// 	// 	}
	// 	// }
	// 	// };
	// }



	// document.write('<div class="month">');
	// var m=1;
	// var new_month=0; // flag
	// for (d=start_date;d<=stop_date;d.setDate(d.getDate() + 1)) {
	// 	document.write('<div class="day">'+d.getDate()+monthNames[d.getMonth()]+'</div>')
		
	// 	// check if month changes
	// 	var yst = new Date()
	// 	yst.setDate(d.getDate()-1);
	// 	console.log(d.getMonth(), yst.getMonth())

	// 	if (d.getMonth() != yst.getMonth() ) {
	// 		new_month=1;
	// 	}
	// 	if (m==7) { // check each week
	// 		if (new_month) {
	// 			document.write('</div>');
	// 			document.write('<div class="month">');
	// 			new_month = 0;
	// 		}
	// 		m=1;
	// 	} else {
	// 		m++;
	// 	}
	// }
	// for(a=1; a<360;a++) document.write('<div class="day">a</div>');