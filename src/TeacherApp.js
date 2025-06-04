// TeacherApp.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Add onPollConfirmedAndCleared to the destructured props
function TeacherApp({ socket, activePoll, liveResults, onPollConfirmedAndCleared }) {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [durationSeconds, setDurationSeconds] = useState(60); // Default to 60 seconds

    // State to control poll creation button/form visibility
    const [canCreateNewPoll, setCanCreateNewPoll] = useState(true);

    useEffect(() => {
        // When a new poll becomes active (or existing poll clears),
        // disable the create poll button until teacher confirms.
        if (activePoll) {
            setCanCreateNewPoll(false);
        } else {
            // If there's no active poll, teacher can create one.
            setCanCreateNewPoll(true);
        }

        // Clear form fields whenever the activePoll changes (new poll starts or old one ends)
        setQuestion('');
        setOptions(['', '']);
        setDurationSeconds(60); // Reset duration input
    }, [activePoll]);

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        setOptions([...options, '']);
    };

    const removeOption = (index) => {
        const newOptions = [...options];
        newOptions.splice(index, 1);
        setOptions(newOptions);
    };

    const createPoll = async () => {
        const validOptions = options.filter(opt => opt.trim() !== '');
        if (!question.trim() || validOptions.length < 2) {
            alert('Please enter a question and at least two non-empty options.');
            return;
        }
        if (durationSeconds <= 0) {
            alert('Please enter a valid poll duration (in seconds).');
            return;
        }

        try {
            await axios.post('${process.env.REACT_APP_BACKEND_URL}/api/polls', { question, options: validOptions, durationSeconds });
            alert('Poll created and broadcasted!');
            // After creating a poll, disable the button again
            setCanCreateNewPoll(false);
        } catch (error) {
            console.error('Error creating poll:', error);
            alert('Failed to create poll. Check server console.');
        }
    };

    // Function to handle the teacher's confirmation
    const handleTeacherConfirmation = () => {
        const confirm = window.confirm("Are you sure all students have answered or are done with the current poll? Clicking 'OK' will allow you to create a new poll and clear the previous results.");
        if (confirm) {
            setCanCreateNewPoll(true);
            // Call the prop function to clear the active poll in the parent component
            if (onPollConfirmedAndCleared) {
                onPollConfirmedAndCleared();
            }
        }
    };

    return (
        <div>
            <h1>Teacher Dashboard</h1>
            <h2>Create New Poll</h2>

            {canCreateNewPoll ? (
                <>
                    <input
                        type="text"
                        placeholder="Poll Question"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                    />
                    {options.map((option, index) => (
                        <div key={index} style={{ marginBottom: '5px' }}>
                            <input
                                type="text"
                                placeholder={`Option ${index + 1}`}
                                value={option}
                                onChange={(e) => handleOptionChange(index, e.target.value)}
                            />
                            {/* Changed condition here: Only show remove button for options beyond the initial two */}
                            {index >= 2 && ( 
                                <button onClick={() => removeOption(index)} style={{ marginLeft: '10px' }}>Remove</button>
                            )}
                        </div>
                    ))}
                    <button onClick={addOption}>Add Option</button>

                    <div style={{ marginTop: '15px', marginBottom: '15px' }}>
                        <label htmlFor="duration">Poll Duration (seconds, per student): </label>
                        <input
                            type="number"
                            id="duration"
                            value={durationSeconds}
                            onChange={(e) => setDurationSeconds(parseInt(e.target.value))}
                            min="5"
                            style={{ width: '80px', textAlign: 'center' }}
                        />
                    </div>
                    <button onClick={createPoll} style={{ marginLeft: '10px' }}>Create Poll</button>
                </>
            ) : (
                <div>
                    <p>
                        A poll is currently active. You can create a new poll only after confirming that students are done with the current one.
                    </p>
                    <button onClick={handleTeacherConfirmation} disabled={!activePoll}>
                        All students have answered / Done with current poll?
                    </button>
                </div>
            )}

            <hr style={{ margin: '30px 0' }}/>

            <h2>Live Poll Results</h2>
            {activePoll ? (
                <div>
                    <h3>Current Poll: {activePoll.question}</h3>
                    <p style={{ fontStyle: 'italic', color: 'gray' }}>
                        (Students have {activePoll.durationSeconds} seconds to answer this poll once they enter the portal.)
                    </p>
                    {activePoll.options && activePoll.options.map((option) => {
                        const result = liveResults.find(r => r.optionId === option.id);
                        const percentage = result ? result.percentage.toFixed(2) : 0;
                        return (
                            <div key={option.id} style={{ marginBottom: '10px' }}>
                                <strong>{option.text}:</strong> {percentage}%
                                <div
                                    style={{
                                        width: `${percentage}%`,
                                        backgroundColor: 'lightblue',
                                        height: '20px',
                                        marginTop: '5px',
                                        borderRadius: '4px'
                                    }}
                                ></div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p>No active poll at the moment. Create one above to see results here.</p>
            )}
        </div>
    );
}

export default TeacherApp;
