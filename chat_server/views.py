from django.shortcuts import render

def index(request):
    return render(request, 'chat/index.js')

def chatroom(request, room_name):
    return render(request, 'message/index.js', {
        'room_name': room_name
    })