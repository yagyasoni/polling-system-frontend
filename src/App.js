import React, { useState, useEffect, useRef } from 'react';
import TeacherApp from './TeacherApp';
import StudentApp from './StudentApp';
import './App.css';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function App() {
  const [persona, setPersona] = useState(null);
  const [activePollFromSocket, setActivePollFromSocket] = useState(null);
  const [liveResultsFromSocket, setLiveResultsFromSocket] = useState([]);

  useEffect(() => {
    console.log("App: Setting up GLOBAL socket listeners.");

    socket.on('connect', () => {
        console.log("App: GLOBAL Socket connected to server!");
    });

    socket.on('newPoll', (poll) => {
        console.log("App: GLOBAL Received newPoll event:", poll);
        setActivePollFromSocket(poll);
        setLiveResultsFromSocket([]); // Reset results for new poll
    });

    socket.on('updateResults', (results) => {
        console.log("App: GLOBAL Received updateResults event:", results);
        setLiveResultsFromSocket(results);
    });

    socket.on('pollEnded', ({ pollId, message }) => {
        console.log(`App: GLOBAL Poll ${pollId} ended, server message: ${message}`);
        if (activePollFromSocket && activePollFromSocket.id === pollId) {
             setActivePollFromSocket(null); // Clear the poll for everyone
             setLiveResultsFromSocket([]);
        }
    });

    socket.on('disconnect', (reason) => {
        console.log(`App: GLOBAL Socket disconnected: ${reason}`);
    });

    socket.on('connect_error', (error) => {
        console.error(`App: GLOBAL Socket connection error:`, error);
    });

    return () => {
        console.log("App: Cleaning up GLOBAL socket listeners.");
        socket.off('connect');
        socket.off('newPoll');
        socket.off('updateResults');
        socket.off('pollEnded');
        socket.off('disconnect');
        socket.off('connect_error');
    };
  }, []);

  const selectPersona = (p) => {
    setPersona(p);
  };

  const goBackToPersonaSelection = () => {
      setPersona(null);
  }

  // New function to clear the active poll state in App.js
  const clearActivePollFromParent = () => {
    setActivePollFromSocket(null);
    setLiveResultsFromSocket([]);
    console.log("App: Active poll cleared by teacher confirmation.");
  };

  return (
    <div className="App">
      {persona && (
        <button onClick={goBackToPersonaSelection} style={{ position: 'absolute', top: '10px', left: '10px' }}>
          &larr; Back to Selection
        </button>
      )}

      {!persona && (
        <div style={{display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh', // full screen height
      textAlign: 'center'
        }}>
          <h1>Welcome to the Polling System</h1>
         <div style={{display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    // full screen height
      textAlign: 'center'
        }}><button onClick={() => selectPersona('teacher')}>I am a Teacher</button>
            {/* <button onClick={() => selectPersona('teacher')}>I am a Teacher</button> */}
        <button onClick={() => selectPersona('student')}>I am a Student</button></div>
        </div>
      )}

      {persona === 'teacher' && (
        <TeacherApp
          socket={socket} // Pass the socket down to TeacherApp
          activePoll={activePollFromSocket}
          liveResults={liveResultsFromSocket}
          onPollConfirmedAndCleared={clearActivePollFromParent} // Pass the new function here
        />
      )}
      {persona === 'student' && (
        <StudentApp
          socket={socket}
          activePoll={activePollFromSocket}
          liveResults={liveResultsFromSocket}
        />
      )}
    </div>
  );
}

export default App;