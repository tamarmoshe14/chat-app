const socket = io()

//elements
const form = document.querySelector('form');
const input = document.querySelector('input');
const button = form.querySelector('button')
const locationButton = document.querySelector('#sendLocation')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const { username , room } = Qs.parse(location.search, {ignoreQueryPrefix:true})

const autoscroll = ()=>{
    const $newMessage = $messages.lastElementChild
    const newMessageMargin = parseInt(getComputedStyle($newMessage).marginBottom)
    const newMessageHeight = newMessageMargin + $newMessage.offsetHeight
    //visible height
    const visibleHeight = $messages.offsetHeight
    //height og container
    const containerHeight = $messages.scrollHeight
    //how far have i scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight
    //make sure we were at the buttom before message was sent
    if(containerHeight-newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message)=>{
    console.log(message)
    const html = Mustache.render(messageTemplate, {username: message.username, message: message.text, createdAt: moment(message.createdAt).format("h:mm a")})
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (location)=>{
    console.log(location)
    const html = Mustache.render(locationTemplate, {username:location.username,
                                                    location:location.location, 
                                                    createdAt:moment(location.createdAt).format("h:mm a")})
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users})=>{
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    $sidebar.innerHTML = html
})

form.addEventListener('submit', (e)=>{
    e.preventDefault();

    button.setAttribute('disabled','disabled')
    const message = e.target.elements.message.value;
    
    socket.emit('sendMessage', message, (error)=>{
        button.removeAttribute('disabled')
        input.value=""
        input.focus()

        if(error){
            return console.log(error)
        }
        console.log("the message was delivered")
    })
})

locationButton.addEventListener('click', ()=>{
    if (!navigator.geolocation){
        return alert('Geolocation is not supported by your browser.')
    }
    locationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendLocation', {lat:position.coords.latitude, long: position.coords.longitude}, ()=>{
            locationButton.removeAttribute('disabled')
            console.log("Your location was shared successfully!")
        })

    })
})

socket.emit('join', { username, room }, (error)=>{
    if(error){
        alert(error)
        location.href='/'
    }
})