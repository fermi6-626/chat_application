from django.shortcuts import render

def index(request):
    return render(request, 'chat_server/index.html')

def chatroom(request, room_name):
    return render(request, 'chat_server/chatroom.html', {
        'room_name': room_name
    })