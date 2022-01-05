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
            super().tearDownClass
            raise

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit
        super().tearDownClass()

    def seen_by_everyone(self):
        