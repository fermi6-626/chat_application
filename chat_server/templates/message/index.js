import React, { useCallback, useEffect, useRef, useState } from 'react';
import style from './style.module.css';
import { RiSendPlaneFill } from 'react-icons/ri';
import { BsArrowRightCircleFill } from 'react-icons/bs';
import { BsMicFill } from 'react-icons/bs';
import moment from 'moment';
import io from 'socket.io-client';

const Message = () => {
  const [value, setValue] = useState('')
  const [roomId, setRoomId] = useState('')
  const [messages, setMessages] = useState([])
  const [lastTyping, setLastTyping] = useState('')
  const [loading, setLoading] = useState(true)
  const [isStrangerLeft, setIsStrangerLeft] = useState(false)
  const [isStrangerTyping, setIsStrangerTyping] = useState(false)
  const [isStartingNewConnection, setIsStartingNewConnection] = useState(true)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  useEffect(() => {
    if (roomId && value) {
      setLoading(false)
    } else {
      setLoading(true)
    }
  }, [value, roomId])

  useEffect(() => {
    if (lastTyping) {
      seeChange()
    }
  }, [lastTyping])

  useEffect(() => {
    if (socket == null) {
      handleSocketCall()
    }
  }, [])

  // after connecting to other user
  useEffect(() => {
    if (socket != null) {
      socket.on('roomId', (data) => {
        setRoomId(data)
        if (!data) {
          setIsStrangerLeft(true)
        } else {
          setIsStartingNewConnection(false)
        }
      })
    }
  }, [socket])

  // listining to message
  useEffect(() => {
    if (socket != null) {
      // reciving message
      socket.on('message', (data) => {
        setMessages((prevState) => [...prevState, data])
        scrollToBottom()
        // audio.play()
      })
    }
  }, [socket])

  // listening to typing status
  useEffect(() => {
    if (socket != null) {
      // reciving message
      socket.on('typing', (data) => {
        setIsStrangerTyping(data?.isTyping)
      })
    }
  }, [socket])

  // srolling to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // making connection to socket
  const handleSocketCall = useCallback(async () => {
    const socketio = io('https://omegle-clone-backend.herokuapp.com')
    socketio.emit('connection')
    await setSocket(() => socketio)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])
  // sending message
  const handleSendMessage = () => {
    var data = {
      id: moment().unix(),
      message: value,
      sender: 'stranger',
      time: moment(),
      roomId,
    }
    setValue('')

    socket.emit('message', data)
    setMessages([...messages, { ...data, sender: 'self' }])
  }

  //  detecting user typing
  const handelInputChange = (e) => {
    if (e.key === 'Enter' && e.shiftKey === false) {
      handleSendMessage()
    } else {
      if (socket !== null) {
        const time = moment(new Date())
        setLastTyping(time)
        socket.emit('typing', {
          roomId,
          isTyping: true,
        })
      }
    }
  }

  // tracking user typing
  const seeChange = () => {
    setTimeout(() => {
      var rnt = moment(new Date())
      var duration = rnt.diff(lastTyping, 'second')
      if (duration >= 4) {
        socket.emit('typing', {
          roomId,
          isTyping: false,
        })
      }
    }, 10000)
  }

  const handleNewConnection = () => {
    socket.disconnect()
    setIsStrangerLeft(false)
    setIsStrangerTyping(false)
    setIsStartingNewConnection(true)
    setRoomId('')
    setMessages([])
    handleSocketCall()
  }
  return (
    <div className={style.messages}>
      <Navbar />
      <div className={style.message_content}>
        <div className={style.chat_container}>
          <div className={style.chat_box} ref={messagesContainerRef}>
            {messages.map((item, i) => {
              return (
                <div key={i}>
                  {item.sender === 'self' ? (
                    <Self message={item.message} time={item.time} />
                  ) : (
                    <Strangers message={item.message} time={item.time} />
                  )}
                </div>
              )
            })}

            <div ref={messagesEndRef} />
          </div>
          <div className={style.process}>
            {isStrangerLeft && !isStartingNewConnection && (
              <div className={style.stranger_left}>
                <p>Stranger has disconnected.</p>
              </div>
            )}
            {!isStrangerLeft && isStartingNewConnection && (
              <div className={style.stranger_left}>
                <p>Searching for Stranger to chat...</p>
              </div>
            )}
            {isStrangerTyping && roomId && (
              <div className='wave'>
                Stranger is typing
                <span className='dot'></span>
                <span className='dot'></span>
                <span className='dot'></span>
              </div>
            )}
          </div>
        </div>
        <div className={style.footer}>
          <div className={style.input_field_container}>
            <input
              type='text'
              placeholder='Type your message...'
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => handelInputChange(e)}
              value={value}
              disabled={!roomId}
            />
            <div className={style.action_container}>
              {value && roomId && (
                <div
                  className={style.send_icon_container}
                  onClick={handleSendMessage}
                >
                  <RiSendPlaneFill className={style.icons} />
                </div>
              )}
              {!value && roomId && (
                <div className={style.send_icon_container}>
                  <BsMicFill className={style.icons} />
                </div>
              )}
              {
                <div
                  className={style.send_icon_container}
                  onClick={handleNewConnection}
                >
                  <BsArrowRightCircleFill className={style.icons} />
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Message

const Strangers = (props) => {
  return (
    <div className={`${style.box} ${style.strangers_box}`}>
      <div className={style.first_row}>
        <p>stranger</p>
        <p>{moment(props?.time).format('h:mm a')}</p>
      </div>
      <div className={`${style.text} ${style.stranger}`}>
        <p>{props?.message}</p>
      </div>
    </div>
  )
}
const Self = (props) => {
  return (
    <div className={`${style.box} ${style.self_box}`}>
      <div className={style.first_row}>
        <p>Me</p>
        <p>{moment(props?.time).format('h:mm a')}</p>
      </div>
      <div className={`${style.text} ${style.self}`}>
        <p>{props?.message}</p>
      </div>
    </div>
  )
}
