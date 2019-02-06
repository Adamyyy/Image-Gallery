
//------------------------------------
//              VARIABLES
//------------------------------------

var searchBox = document.getElementById("SearchBox");
var savedItems = document.getElementById("savedItems")
var customContainer = document.querySelector(".containerCustom");
var savedItemsBTN = document.getElementsByClassName("savedItemBTN");
var orBTN = document.getElementById("orBTN")
var deleteBTN = document.getElementById("deleteBTN")
var andBTN = document.getElementById("andBTN")
searchBox.value = "Search For Images";
var firstInputFieldClick = 1
var currentIndex = 0
var data = []
var displayData = []
var newQuery = false
var nothingInStorage = 0;
var saveBTN = document.getElementById("saveBTN");
var itemsSelectedForAndOrQuery = []



//------------------------------------
//         INTITIAL FUNCTIONS
//------------------------------------


//We check if user has already saved some search values
checkIfSavedExist()





//If user saved search values we render the section otherwise we keep the flag with value of 1 
function checkIfSavedExist(){
	if (localStorage.key(0) ==null) {
		nothingInStorage = 1
	} else {
		renderSavedItems("initial")
	}

}



//clear the initial text and keep flag for knowing this is the first inputclick
searchBox.addEventListener ("click", function(){
	if (firstInputFieldClick == 1) {
		searchBox.value = ""
		firstInputFieldClick = 0
	}
});

//infinite scroll handler
window.onscroll = yHandler;
function yHandler(){
	var contentHeight = customContainer.offsetHeight;
	var yOffset = window.pageYOffset; 
	var y = yOffset + window.innerHeight;
	if (y >= contentHeight && searchBox.value != ""){
		newQuery = false
		renderHTML()
	}	
}




//------------------------------------
//              Functionality
//------------------------------------


// get all highlighted saved items and run the or operation on them
orBTN.addEventListener('click', function(){
	var allSavedSelected = []
	var maxLength = 0 //checking for the biggest amount of photos in a specific object
	var allHighlightedButtons = document.getElementsByClassName("btn-dark")

	//If we dont have any items selected we'll want to leave the function
	if (allHighlightedButtons.length == 0) {
		alert ("please highlight some of your saved items by selecting them first");
		return
	}
		//get the imgs from local memory with the phrases found in the selected items, put them in the allSavedSelected and know which imgs collection is biggest
		for (i = 0; i< allHighlightedButtons.length; i++){
			var imgs = JSON.parse(localStorage.getItem(allHighlightedButtons[i].textContent));
			if (imgs.length > maxLength) {
				maxLength = imgs.length
			}
			allSavedSelected.push(imgs)
	}

	//Turn the allSavedSelected obj into array of objects and iterate over the entire structure to form one big unified array

	let unionArray=[];
	for (i = 0; i< maxLength - 1; i++){
		Object.values(allSavedSelected).forEach((item)=>{
			if (item[i] != null) {
				unionArray=unionArray.concat(item[i])
			}
		});
	}
	//GUI update
	newQuery = true
	currentIndex = 0
	data = unionArray
	renderHTML()

}); 

andBTN.addEventListener('click', function(){
	//Same as OrBTN operation only here we use the myMap map for better runtime (alternative is o(n^2) naive iteration)
	var allSavedSelected = []
	data = []
	var myMap = new Map(); //the map that will allocate an image id to the number of apperances it has across multiple search values
	var maxLength = 0
	var finalResultArr = [] // the array that will contain the images that appear in all phrases
	var allHighlightedButtons = document.getElementsByClassName("btn-dark");
	if (allHighlightedButtons.length == 0) {
		alert ("please highlight some of your saved items by selecting them first");
		return
	}
	for (i = 0; i< allHighlightedButtons.length; i++){
		var imgs = JSON.parse(localStorage.getItem(allHighlightedButtons[i].textContent));
		if (imgs.length > maxLength) {
			maxLength = imgs.length
		}
		allSavedSelected.push(imgs)
	}

	var objectAsArr = Object.values(allSavedSelected)

	//Set up the map counting apperances for each saved search term, in the next phase we'll be looking for those that appear the same number of times as the phrases we counted earlier
	for (i = 0; i< maxLength - 1; i++){
		objectAsArr.forEach((item)=>{
			if (typeof item[i] != 'undefined') {
				if (myMap.get(item[i].id) == null) {
						myMap.set(item[i].id, 1);
			}
			else {
				var apperances = myMap.get(item[i].id);
				var apperancesPlusOne = apperances + 1
				myMap.set(item[i].id, apperancesPlusOne)
			}
				}
		});
	}

	//We only need to loop through 1 imgs object to see if its value in the map is of the total number of search values (meaning it appears in all of them)
	for (var i = 0; i<objectAsArr[0].length - 1; i++) {
		if (myMap.get(objectAsArr[0][i].id) == allHighlightedButtons.length) {
			finalResultArr.push(objectAsArr[0][i])
		}
	}

	//GUI operations
	newQuery = true
	currentIndex = 0
	data = finalResultArr

	//Should there be no shared images between the search values we'll update the user
	if (data.length == 0) {
		var str = " "
		for (var i =0; i < allHighlightedButtons.length; i++) {
			if (i == allHighlightedButtons.length -1) {
				str = str + " and " + allHighlightedButtons[i].textContent
			}
			if (i==0) {
				str = str + allHighlightedButtons[i].textContent 
			}
			if (i != 0 && i != allHighlightedButtons.length -1 ) {
				str = str + ", " + allHighlightedButtons[i].textContent 
			}
		}
		alert("No images are shared between" + str)
	}
	else {
		renderHTML()
	}

}); 




//delete all the selected saved items:
deleteBTN.addEventListener('click',function(){
	var allHighlightedButtons = document.getElementsByClassName("btn-dark");
	while(allHighlightedButtons.length != 0) {
		localStorage.removeItem(allHighlightedButtons[0].textContent);
		allHighlightedButtons[0].parentNode.removeChild(allHighlightedButtons[0]);	
	}
	
});



//Save the phrases and the images to local memory for future use
saveBTN.addEventListener('click', function(){
	var str = searchBox.value
	if (firstInputFieldClick != 1) {
		if (localStorage.getItem(str) != null){
			alert("Search Value already exists")
			return
		}else {
			localStorage.setItem (str, JSON.stringify(data))
			renderSavedItems ("notInitial")
		}		
	}
	else {
		alert("Please enter a search value first")
	}

}); 



//Call the flickr API each time the searchBox Text has changed
searchBox.addEventListener('input', function(){
	data = []
	var xhr = new XMLHttpRequest();
	var searchVal = searchBox.value
	var url = "https://api.flickr.com/services/rest/?method=flickr.photos.search&safe_search=1&text=" +searchVal + "&format=json&nojsoncallback=1&api_key=bac9f1ccfd854f27894fd47c4f01b1e8&content_type=1&is_getty=1"
	xhr.open('GET', url, true);
	xhr.onload = function () {
		if (this.status == 200) {
			currentIndex = 0
			newQuery = true
			var responce = JSON.parse(this.responseText)
			var photos = responce["photos"]["photo"]
			data = photos
			renderHTML()
		}
	}
	xhr.send()

}); 




//------------------------------------
//              GUI
//------------------------------------

//Update the images container to display the relevant data depending on application use
function renderHTML() {
	var url = ""
	var text = ""
	var indexWhenCalled = currentIndex
	var indexAddition = 0;
	for (i = indexWhenCalled; i< indexWhenCalled + 12; i++){
		if (typeof data[i] == 'undefined') {
			break
		}
		indexAddition +=1
		var title = data[i].title
		var id = data[i].id;
		var secret = data[i].secret
		var server = data[i].server;
		var farm = data[i].farm
		url = "https://farm" + farm + ".staticflickr.com/" + server + "/" + id + "_" + secret + ".jpg"
		
		//seeing how we'll want to create a new row every 4 images we'll add this line when the modulo of i by 4 is zero (meaning we passed through 4 images)
		if (i%4 == 0) {
		text += 
		'<div class="row"> '

		}
		text += 
			'<div class="col-lg-3 col-md-3 col-sm-6">\
				<div class="card">\
					<img class="card-img-top"src="' + url + '""> \
				</div>\
			</div>'
		
		//And of course every 4th image we'll want to close the row div
		if (i%4 ==3 ){
			text += '</div>'
		}
		
	}
	currentIndex = currentIndex + indexAddition

	//If we're scrolling through the page newQuery will be false, in that case we'll need to append the html to the existing one
	if (newQuery == true ){
		customContainer.innerHTML = text
	}
	else {
		customContainer.innerHTML += text
	}
	

}



//Load the saved item keys from memory and display them for user use
function renderSavedItems(cmd) {
	var i = 0;
	var text = ""
	if (cmd == "initial") {
		while (localStorage.key(i) != null) {
			text += '<button type="button" class="btn btn-light savedItemBTN">' + localStorage.key(i) + '</button>'
			i = i+1
		}
		
	}
	else {
		var value = searchBox.value
		text = '<button type="button" class="btn btn-light savedItemBTN">' + value + '</button>'

	}
	savedItems.innerHTML += text
	savedItemsBTN = document.getElementsByClassName("savedItemBTN");
		for (i = 0; i < savedItemsBTN.length; i++) {
   			 savedItemsBTN[i].addEventListener("click", function() {
    			this.classList.toggle("btn-light");
    			this.classList.toggle("btn-dark");

    			 });
 			 }
	}




