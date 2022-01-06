from channels.testing import ChannelsLiveServerTestCase
from selenium import webdriver
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.wait import WebDriverWait


class ChatTests(ChannelsLiveServerTestCase):
    serve_static = True

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        try:
            cls.driver = webdriver.Firefox()
        except:
            super().tearDownClass()
            raise

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()
        super().tearDownClass()

    def test_when_chat_message_posted_then_seen_by_everyone_in_same_room(self):

        try:
            self.enter_chatroom('room1')
            self.open_window()
            self.enter_chatroom('room1')
            self.switch_to_window(0)
            self.post_msg('First Automation Test')
            WebDriverWait(self.driver, 2).until(lambda _:
                                                'First Automation Test' in self.chat_log,
                                                'message sent by window1 not revieved by window1')
            self.switch_to_window(1)
            WebDriverWait(self.driver, 2).until(lambda _:
                                                'First Automation Test' in self.chat_log,
                                                'message sent by window1 not recieved by window2')

        finally:
            self.close_windows()

    def test_when_chat_message_posted_then_not_seen_by_anyone_in_different_room(self):

        try:
            self.enter_chatroom('room1')
            self.open_window()
            self.enter_chatroom('room2')
            self.switch_to_window(0)
            self.post_msg('Second Automation Test')
            WebDriverWait(self.driver, 2).until(lambda _:
                                                'Second Automation Test' in self.chat_log,
                                                'message sent by window1 not recieved by window1')
            self.switch_to_window(1)
            self.post_msg('Third Automation Test')
            WebDriverWait(self.driver, 2).until(lambda _:
                                                'Third Automation Test' in self.chat_log,
                                                'message sent by window2 is not recieved in window2')
            self.assertTrue('Second Automation Test' not in self.chat_log,
                            'message sent by window1 is not recieved by window2')
        finally:
            self.close_windows()

    def enter_chatroom(self, room_name):
        self.driver.get(self.live_server_url + '/chat_server/')
        ActionChains(self.driver).send_keys(room_name + '\n').perform()
        WebDriverWait(self.driver, 2).until(
            lambda _: room_name not in self.driver.current_url)

    def open_window(self):
        self.driver.execute_script("window.open('about:blank', '_blank';")
        self.driver.switch_to.window(self.driver.window_handles[-1])

    def close_windows(self):
        while len(self.driver.window_handles) > 1:
            self.driver.switch_to.window(self.driver.window_handles[-1])
            self.driver.execute_script("window.close();")
        if len(self.driver.window_handles) == 1:
            self.driver.switch_to.window(self.driver.window_handles[0])

    def switch_to_window(self, windex):
        self.driver.switch_to.window(self.driver.window_handles[windex])

    def post_msg(self, msg):
        ActionChains(self.driver).send_keys(msg + '\n').perform()

    @property
    def chat_log(self):
        return self.driver.find_element_by_css_selector('#chat-log').get_property('value')
