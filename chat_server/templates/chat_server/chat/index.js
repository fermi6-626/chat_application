import React, { useCallback, useEffect, useState } from 'react';
import style from './style.module.css';
import moment from 'moment';
import io from 'socket.io-client';
import { useRef } from 'react';

const Chat = () => {
  const [value, setValue] = useState('')
  const [socket, setSocket] = useState<any>(null)
  const [roomId, setRoomId] = useState('')
  const [message, setMessage] = useState([])
  const [lastTyping, setLastTyping] = useState('')
  const [loading, setLoading] = useState(true)
  const [isStrangerLeft, setIsStrangerLeft] = useState(false)
  const [isStrangerTyping, setIsStrangerTyping] = useState(false)
  const [isStartingNewConnection, setIsStartingNewConnection] = useState(true)
  const messagesEndRef = useRef(null)

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
        setMessage((prevState) => [...prevState, data])
        scrollToBottom()
        audio.play()
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

  // sending message
  const handleSendMessage = () => {
    var data = {
      id: moment().unix(),
      message: value,
      sender: 'stranger',
      time: moment().format('h:mm a'),
      roomId,
    }
    socket.emit('message', data)
    setMessage([...message, { ...data, sender: 'self' }])
    scrollToBottom()
    setValue('')
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
    setMessage([])
    handleSocketCall()
  }
  return (
    <div className={style.chat_box}>
      <div className={style.chat_container}>
        {message.map((item, i) => {
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
        {isStrangerLeft && !isStartingNewConnection && (
          <div className={style.stranger_left}>
            <p>Stranger has disconnected.</p>
          </div>
        )}
        {!isStrangerLeft && isStartingNewConnection && (
          <div className={style.stranger_left}>
            <p>Looking for Stranger to chat...</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className={style.message_box}>
        {isStrangerTyping && roomId && (
          <div className='wave'>
            Stranger is typing
            <span className='dot'></span>
            <span className='dot'></span>
            <span className='dot'></span>
          </div>
        )}
        <button
          className={`btn ${style.stop_btn} ${style.hide_mob}`}
          onClick={handleNewConnection}
        >
          New
        </button>
        <textarea
          disabled={!roomId}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => handelInputChange(e)}
          className={style.input_field}
          placeholder='Message...'
        />
        <button
          className={`btn main_btn  ${style.hide_mob}`}
          onClick={() => handleSendMessage()}
          disabled={loading}
        >
          Send
        </button>
        <div className={`${style.btn_container}`}>
          <button
            className={`btn ${style.stop_btn} ${style.hide_big} `}
            onClick={handleNewConnection}
          >
            New
          </button>
          <button
            disabled={loading}
            className={`btn main_btn  ${style.hide_big}`}
            onClick={() => handleSendMessage()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default Chat

const Strangers = (props) => {
  return (
    <div className={style.strangers_box}>
      <div className={style.first_row}>
        <p>stranger</p>
        <p>{props?.time}</p>
      </div>
      <div className={`${style.text} ${style.stranger}`}>
        <p>{props?.message}</p>
      </div>
    </div>
  )
}
const Self = (props) => {
  return (
    <div className={style.self_box}>
      <div className={style.first_row}>
        <p>Me</p>
        <p>{props?.time}</p>
      </div>
      <div className={`${style.text} ${style.self}`}>
        <p>{props?.message}</p>
      </div>
    </div>
  )
}
