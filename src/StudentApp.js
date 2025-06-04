import React, { useState, useEffect, useRef } from 'react';

function StudentApp({ socket, activePoll, liveResults }) {
    const [studentName, setStudentName] = useState('');
    const [hasEnteredName, setHasEnteredName] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);

    // Per-student timer states
    // const [personalPollStartTime, setPersonalPollStartTime] = useState(null);
    const [personalPollRemainingTime, setPersonalPollRemainingTime] = useState(null);
    const [isPersonalPollActive, setIsPersonalPollActive] = useState(false); // Crucial state
    const personalCountdownIntervalRef = useRef(null);

    const [hasAnsweredCurrentPoll, setHasAnsweredCurrentPoll] = useState(false);
    const [alreadyVotedMessage, setAlreadyVotedMessage] = useState('');

    // Helper to format time
    const formatTime = (ms) => {
        if (typeof ms !== 'number' || isNaN(ms) || ms < 0) {
            return "00s";
        }
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        if (minutes > 0) {
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            return `${seconds.toString().padStart(2, '0')}s`;
        }
    };

    // --- Main Timer Management useEffect ---
    useEffect(() => {
        // This effect manages the personal timer based on activePoll and hasEnteredName
        // It's crucial to clear the interval before setting up a new one or if conditions change.

        // ALWAYS clear previous interval if it exists
        if (personalCountdownIntervalRef.current) {
            clearInterval(personalCountdownIntervalRef.current);
            personalCountdownIntervalRef.current = null;
            console.log("[STUDENT Timer Effect] Cleared existing personal timer.");
        }

        // Only start timer if student has entered name AND there's an active poll AND they haven't answered yet
        if (hasEnteredName && activePoll && !hasAnsweredCurrentPoll) {
            const pollDurationSeconds = parseInt(activePoll.durationSeconds, 10);

            if (isNaN(pollDurationSeconds) || pollDurationSeconds <= 0) {
                console.error(`[STUDENT Timer Effect] Invalid poll duration received: ${activePoll.durationSeconds}. Timer will not start.`);
                setIsPersonalPollActive(false); // Ensure inactive state
                setPersonalPollRemainingTime(0);
                return; // Stop here if duration is invalid
            }

            console.log(`[STUDENT Timer Effect] Starting personal timer for poll: ${activePoll.question}, Duration: ${pollDurationSeconds}s`);
            const startTime = Date.now();
            const endTime = startTime + (pollDurationSeconds * 1000);

            // Set initial state to active
            setIsPersonalPollActive(true);
            setPersonalPollStartTime(startTime); // Store start time

            // Calculate and set initial remaining time
            const initialRemaining = Math.max(0, endTime - Date.now());
            setPersonalPollRemainingTime(initialRemaining);

            // If initial remaining is already 0 or negative, set inactive immediately
            if (initialRemaining <= 0) {
                console.log("[STUDENT Timer Effect] Poll already expired on entry. Setting inactive.");
                setIsPersonalPollActive(false);
                setPersonalPollRemainingTime(0);
                return;
            }

            // Start the interval
            personalCountdownIntervalRef.current = setInterval(() => {
                const currentRemaining = Math.max(0, endTime - Date.now());
                setPersonalPollRemainingTime(currentRemaining);

                if (currentRemaining <= 0) {
                    console.log("[STUDENT Timer Tick] Personal poll countdown reached 0. Clearing interval.");
                    clearInterval(personalCountdownIntervalRef.current);
                    personalCountdownIntervalRef.current = null;
                    setIsPersonalPollActive(false); // Timer ran out, poll is now inactive for this student
                }
            }, 1000);
        } else {
            // If conditions not met (no name, no poll, or already answered), ensure timer is off and state is inactive
            console.log("[STUDENT Timer Effect] Conditions not met for starting timer or already answered. Ensuring inactive state.");
            setIsPersonalPollActive(false);
            setPersonalPollRemainingTime(0); // Show 00s if not active
        }

        // Cleanup function for this useEffect: runs on unmount or before effect re-runs
        return () => {
            if (personalCountdownIntervalRef.current) {
                console.log("[STUDENT Timer Effect Cleanup] Clearing interval.");
                clearInterval(personalCountdownIntervalRef.current);
                personalCountdownIntervalRef.current = null;
            }
        };
    }, [activePoll, hasEnteredName, hasAnsweredCurrentPoll]); // Dependencies: activePoll, hasEnteredName, and hasAnsweredCurrentPoll

    // --- Socket Listener for 'alreadyVoted' Effect ---
    useEffect(() => {
        socket.on('alreadyVoted', (data) => {
            console.warn("Student: Already voted for this poll:", data.message);
            setAlreadyVotedMessage(data.message);
            setHasAnsweredCurrentPoll(true); // This will trigger the main timer useEffect to stop the timer
        });

        return () => {
            socket.off('alreadyVoted');
        };
    }, [socket]);


    const handleNameSubmit = () => {
        if (studentName.trim()) {
            setHasEnteredName(true);
            // The `useEffect` above will now handle starting the timer
        } else {
            alert('Please enter your name.');
        }
    };

    const handleSubmitAnswer = () => {
        // Crucial check: only allow submission if personal poll is active AND not yet answered
        if (!isPersonalPollActive) {
            alert('Your time for this poll has ended, or it is no longer active.');
            return;
        }
        if (hasAnsweredCurrentPoll) {
             alert('You have already submitted your answer for this poll.');
             return;
        }
        if (activePoll && selectedOption !== null) {
            socket.emit('submitAnswer', { pollId: activePoll.id, optionId: selectedOption, studentName });
            setHasAnsweredCurrentPoll(true); // Mark as answered locally
            setIsPersonalPollActive(false); // Set inactive immediately on submission
            // The timer useEffect will handle clearing the interval due to hasAnsweredCurrentPoll change
        } else {
            alert('Please select an option before submitting.');
        }
    };

    if (!hasEnteredName) {
        return (
            <div>
                <h1>Welcome, Student!</h1>
                <p>Please enter your name to participate:</p>
                <input
                    type="text"
                    placeholder="Your Name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') handleNameSubmit();
                    }}
                />
                <button onClick={handleNameSubmit}>Enter</button>
            </div>
        );
    }

    return (
        <div>
            <h1>Student View: {studentName}</h1>
            {activePoll ? (
                <div>
                    <h2>Current Poll: {activePoll.question}</h2>
                    {/* Display based on isPersonalPollActive */}
                    {isPersonalPollActive ? (
                        <p style={{ fontWeight: 'bold', color: 'blue' }}>
                            Time Remaining: {personalPollRemainingTime !== null ? formatTime(personalPollRemainingTime) : 'Starting...'}
                        </p>
                    ) : (
                        <p style={{ fontWeight: 'bold', color: 'red' }}>
                            {/* Differentiate between "answered" and "time ended" */}
                            {hasAnsweredCurrentPoll ? (
                                alreadyVotedMessage || 'Thank you for your response!'
                            ) : (
                                'Your time for this poll has ended.'
                            )}
                        </p>
                    )}

                    {/* Show options and submit button ONLY if personal poll is active and not yet answered */}
                    {isPersonalPollActive && !hasAnsweredCurrentPoll && (
                        <div>
                            {activePoll.options && activePoll.options.map((option) => (
                                <div key={option.id} style={{ marginBottom: '10px' }}>
                                    <input
                                        type="radio"
                                        id={`option-${option.id}`}
                                        name="pollOption"
                                        value={option.id}
                                        checked={selectedOption === option.id}
                                        onChange={() => setSelectedOption(option.id)}
                                        style={{ marginRight: '5px' }}
                                    />
                                    <label htmlFor={`option-${option.id}`}>{option.text}</label>
                                </div>
                            ))}
                            <button onClick={handleSubmitAnswer}>Submit Answer</button>
                        </div>
                    )}

                    <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                        <h3>Live Results</h3>
                        {activePoll.options && activePoll.options.map((option) => {
                            const result = liveResults.find(r => r.optionId === option.id);
                            const percentage = result ? result.percentage.toFixed(2) : 0;
                            return (
                                <div key={option.id} style={{ marginBottom: '10px' }}>
                                    <strong>{option.text}:</strong> {percentage}%
                                    <div
                                        style={{
                                            width: `${percentage}%`,
                                            backgroundColor: 'lightgreen',
                                            height: '20px',
                                            marginTop: '5px',
                                            borderRadius: '4px'
                                        }}
                                    ></div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <p>No active poll at the moment. Please wait for your teacher to create one.</p>
            )}
        </div>
    );
}

export default StudentApp;
