const socket = io();

const $chatForm = document.querySelector("#chat-form");
const $sendMessageBtn = $chatForm.querySelector("#send-message");
const $messageInputField = $chatForm.querySelector("input");
const $sendLocationBtn = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

const {username, room} = Qs.parse(location.search,{ignoreQueryPrefix: true});

const autoScroll = () => {
	
	const $newMessage = $messages.lastElementChild;
	
	const newMessageStyles = getComputedStyle( $newMessage );
	const newMessageMargin = parseInt(newMessageStyles.marginBottom);
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
	
	const visibleHeight = $messages.offsetHeight;
	
	const containerHeight = $messages.scrollHeight;
	
	const scrollOffset = $messages.scrollTop + visibleHeight;
		
	if( containerHeight - newMessageHeight <= scrollOffset ){
		$messages.scrollTop = $messages.scrollHeight;
	}

}

socket.emit("join", {username, room}, (error) => {
	if(error){
		alert(error);
		location.href = "/";
	}
	console.log('perfect');
} );

socket.on("message", (message)=>{

	let html = document.querySelector("#message-template").innerHTML;
	let messageTemplate = Mustache.render(html, {username: message.username, message:message.text,createdAt:moment(message.createdAt).format('hh:mm a')});
	$messages.insertAdjacentHTML("beforeend", messageTemplate);
	autoScroll();

});

socket.on("locationMessage", (message)=>{
	let html = document.querySelector("#location-message-template").innerHTML;
	let locationTemplate = Mustache.render(html, {username: message.username, message: message.text, createdAt: moment(message.createdAt).format('hh:mm a')} );
	$messages.insertAdjacentHTML("beforeend",locationTemplate);
})

socket.on("userData", (data)=>{
	let html = document.querySelector("#sidebar-template").innerHTML;
	let sidebarTemplate = Mustache.render(html,{room: data.room, users: data.users});
	document.querySelector("#sidebar").innerHTML = sidebarTemplate;
})

$chatForm.addEventListener("submit",(e)=>{
	e.preventDefault();
	$sendMessageBtn.setAttribute("disabled","disabled");
	let message = e.target.elements.message.value;

	socket.emit('sendMessage', message, (err)=>{
		$messageInputField.value="";
		$messageInputField.focus();
		$sendMessageBtn.removeAttribute("disabled");
		if( err ) return console.log(err);
	});

});

$sendLocationBtn.addEventListener("click",()=>{
	//if( ! navigator.geolocation ){
	//	return alert('Browser does not support geolocation');
	//}
	
	$sendLocationBtn.setAttribute("disabled","disabled");
	console.log('Location searching..');
	//navigator.geolocation.getCurrentPosition((position)=>{
	//	let latitude = position.coords.latitude;
	//	let longitude = position.coords.longitude;
		socket.emit('sendLocation', {latitude:'1',longitude:'2'}, function(){
			$sendLocationBtn.removeAttribute("disabled");
		});
	//});
})


