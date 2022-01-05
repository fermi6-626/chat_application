from django.urls import re_path
from . import clients

ws_urlpatterns = [
    re_path(r'ws/chat_server/(?P<room_name>\w+)/$', clients.ChatClient.as_asgi()),
]
